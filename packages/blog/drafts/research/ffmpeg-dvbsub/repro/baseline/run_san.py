from pathlib import Path
import hashlib, json, os, subprocess
root=Path(__file__).resolve().parent
repo=root/'ffmpeg-san'
base=root
flags=['clang','-O1','-g','-fsanitize=address,undefined','-fno-omit-frame-pointer','-I',str(repo)]
libs=[str(repo/'libavformat/libavformat.a'),str(repo/'libavcodec/libavcodec.a'),str(repo/'libavutil/libavutil.a'),'-lm','-lpthread']
subprocess.run(flags+[str(base/'decode.c')]+libs+['-o',str(root/'decode-san')],check=True)
subprocess.run(flags+[str(root/'packet-test.c')]+libs+['-o',str(root/'packets-san')],check=True)
env=dict(os.environ,UBSAN_OPTIONS='halt_on_error=1:print_stacktrace=1',ASAN_OPTIONS='abort_on_error=1')
results={}
for mode in (-2,-1,0,1):
    for name,binary,sample,reference in [('real','decode-san',base/'dvbsubtest_filter.ts',root/f'output-final-{mode}.bin'),('generated','packets-san',root/'corpus.dvbpackets',root/f'corpus-final-{mode}.bin')]:
        dest=root/f'san-{name}-{mode}.bin'
        p=subprocess.run([str(root/binary),str(sample),'1',str(mode),str(dest)],env=env,capture_output=True,text=True,check=True)
        if p.stderr: raise RuntimeError(p.stderr)
        assert dest.read_bytes()==reference.read_bytes(),(name,mode)
        results[f'{name}:{mode}']={'matches':True,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'stdout':p.stdout.strip()}
subprocess.run(['make','fate-sub-dvb'],cwd=repo,env=env,check=True,stdout=(root/'fate-san.log').open('w'),stderr=subprocess.STDOUT)
(root/'sanitizer-decoder-results.json').write_text(json.dumps(results,indent=2)+'\n')
print('PASS fully instrumented decoder on real and generated packets, all four modes, and FATE')
