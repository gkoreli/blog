from pathlib import Path
import difflib, subprocess
root=Path(__file__).resolve().parent
repo=root/'ffmpeg'
up=(root/'upstream.c').read_text().rstrip('\n')+'\n'
final=(root/'final.c').read_text()
start=up.index('static void compute_default_clut(')
end=up.index('\n\nstatic int save_subtitle_set(',start)
fstart=final.index('/* All five loads')
fend=final.index('\n\nstatic int save_subtitle_set(',fstart)
stage1=up[:start]+final[fstart:fend]+up[end:]
stage1=stage1.replace('int clut_count2[257][256]','int clut_adjacency[256][256]')
rstart=stage1.index('static int dvbsub_read_2bit_string(')
rend=stage1.index('/* All five loads',rstart)
frstart=final.index('/* Clip a decoded run once')
frend=final.index('/* All five loads',frstart)
stage2=stage1[:rstart]+final[frstart:frend]+stage1[rend:]
states=[up,stage1,stage2,final]
names=['01-palette-boundaries.patch','02-native-rle-fill.patch','03-palette-output-copy.patch']
for i,name in enumerate(names):
    diff=''.join(difflib.unified_diff(states[i].splitlines(True),states[i+1].splitlines(True),fromfile='a/libavcodec/dvbsubdec.c',tofile='b/libavcodec/dvbsubdec.c'))
    (root/name).write_text(diff)
(root/'candidate.patch').write_text(subprocess.check_output(['git','diff','--','libavcodec/dvbsubdec.c'],cwd=repo).decode())
check=root/'patch-check';(check/'libavcodec').mkdir(parents=True,exist_ok=True)
(check/'libavcodec/dvbsubdec.c').write_text(up)
for name in names:
    subprocess.run(['git','apply','--check',str(root/name)],cwd=check,check=True)
    subprocess.run(['git','apply',str(root/name)],cwd=check,check=True)
assert (check/'libavcodec/dvbsubdec.c').read_text()==final
subprocess.run(['git','diff','--check'],cwd=repo,check=True)
print('PASS three incremental patches apply and reproduce final.c exactly')
