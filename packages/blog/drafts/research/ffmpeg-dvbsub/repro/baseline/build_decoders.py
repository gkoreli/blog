from pathlib import Path
import subprocess
root=Path(__file__).resolve().parent
repo=root/'ffmpeg'
decode=root/'decode.c'
source=repo/'libavcodec/dvbsubdec.c'
names=['upstream','prior','scalar','wide','rle-variant']
wide=(root/'wide.c').read_text()
rle=(root/'rle-variant.c').read_text()
begin=wide.index('static int dvbsub_read_2bit_string(')
end=wide.index('/* All five loads',begin)
rle_begin=rle.index('/* Clip a decoded run once')
rle_end=rle.index('static void compute_default_clut(',rle_begin)
(root/'combined.c').write_text(wide[:begin]+rle[rle_begin:rle_end]+wide[end:])
names.append('combined')
subprocess.run(['python3',str(root/'build_final.py')],check=True)
names.append('final')
import sys
if len(sys.argv)>1:
    names=sys.argv[1:]
try:
    for name in names:
        source.write_text((root/f'{name}.c').read_text().rstrip('\n')+'\n')
        (repo/'libavcodec/dvbsubdec.o').unlink(missing_ok=True)
        (repo/'libavcodec/libavcodec.a').unlink(missing_ok=True)
        subprocess.run(['make','-j4','libavcodec/libavcodec.a'],cwd=repo,check=True)
        subprocess.run(['clang','-O3','-I',str(repo),str(decode),str(repo/'libavformat/libavformat.a'),str(repo/'libavcodec/libavcodec.a'),str(repo/'libavutil/libavutil.a'),'-lm','-lpthread','-o',str(root/f'decode-{name}')],check=True)
        subprocess.run(['clang','-O3','-I',str(repo),str(root/'packet-test.c'),str(repo/'libavcodec/libavcodec.a'),str(repo/'libavutil/libavutil.a'),'-lm','-lpthread','-o',str(root/f'packets-{name}')],check=True)
finally:
    source.write_text((root/'final.c').read_text().rstrip('\n')+'\n')
