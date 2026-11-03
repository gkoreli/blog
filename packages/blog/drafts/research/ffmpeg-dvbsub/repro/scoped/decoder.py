"""Build/test the palette-only patch and its independent robustness-patch integration."""
import argparse,hashlib,json,os,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--out',type=Path,required=True);p.add_argument('--baseline',type=Path,required=True);p.add_argument('--repo',type=Path,required=True);p.add_argument('--san-repo',type=Path,required=True);a=p.parse_args()
root=Path(__file__).resolve().parent;base=a.baseline.resolve();out=a.out.resolve();out.mkdir(exist_ok=True,parents=True)
subprocess.run(['python3',str(root/'generate.py'),'--out',str(out)],check=True)
plain=(out/'candidate.c').read_bytes();sourcefile=out/'libavcodec/dvbsubdec.c';sourcefile.parent.mkdir(exist_ok=True);sourcefile.write_bytes(plain)
for name in ['04-output-errors.patch','05-short-headers.patch']:
 patch=root.parent/'formal'/name;subprocess.run(['git','apply','--check',str(patch)],cwd=out,check=True);subprocess.run(['git','apply',str(patch)],cwd=out,check=True)
combined=sourcefile.read_bytes();(out/'combined.c').write_bytes(combined)
env=dict(os.environ);env['ASAN_OPTIONS']='abort_on_error=1';env['UBSAN_OPTIONS']='halt_on_error=1:print_stacktrace=1';records=[]
def run(name,cmd,cwd=None,expected=0):
 p=subprocess.run([str(x) for x in cmd],cwd=cwd,env=env,capture_output=True,text=True);log=p.stdout+p.stderr;(out/(name+'.log')).write_text(log)
 records.append({'name':name,'exit_code':p.returncode,'expected':expected,'accepted':p.returncode==expected,'log_sha256':hashlib.sha256(log.encode()).hexdigest()});assert p.returncode==expected,(name,log[-1000:])
for sanitized in [False,True]:
 repo=(a.san_repo if sanitized else a.repo).resolve();original=(repo/'libavcodec/dvbsubdec.c').read_bytes();flags=['-fsanitize=address,undefined','-fno-omit-frame-pointer'] if sanitized else []
 try:
  for integrated in [False,True]:
   name=('combined' if integrated else 'palette')+('-san' if sanitized else '')
   (repo/'libavcodec/dvbsubdec.c').write_bytes(combined if integrated else plain)
   for f in ['libavcodec/dvbsubdec.o','libavcodec/libavcodec.a']:(repo/f).unlink(missing_ok=True)
   run('build-'+name,['make','-j4','ffmpeg'],repo);run('fate-'+name,['make','fate-sub-dvb'],repo)
   for program,source in [('decode',base/'decode.c'),('packets',base/'packet-test.c')]:
    libs=[repo/'libavcodec/libavcodec.a',repo/'libavutil/libavutil.a']
    if program=='decode':libs.insert(0,repo/'libavformat/libavformat.a')
    run('compile-'+program+'-'+name,['clang','-O3',*flags,'-I',repo,source,*libs,'-lm','-lpthread','-o',out/(program+'-'+name)])
   for fixture,program,inputfile in [('real','decode','dvbsubtest_filter.ts'),('generated','packets','corpus.dvbpackets')]:
    for mode in [-2,-1,0,1]:
     ref=out/f'ref-{fixture}-{mode}.bin'
     if not ref.exists():run(f'ref-{fixture}-{mode}',[base/(program+'-upstream'),base/inputfile,'1',str(mode),ref])
     dest=out/f'{fixture}-{name}-{mode}.bin';run(f'{fixture}-{name}-{mode}',[out/(program+'-'+name),base/inputfile,'1',str(mode),dest]);assert dest.read_bytes()==ref.read_bytes()
     records[-1].update(identical_to_upstream=True,bytes=dest.stat().st_size,output_sha256=hashlib.sha256(dest.read_bytes()).hexdigest())
   if integrated:
    run('compile-faults-'+name,['clang','-O2',*flags,'-DHAVE_AV_CONFIG_H',f'-DDECODER_SOURCE="{out/"combined.c"}"','-I',repo,'-I',repo/'libavcodec',root.parent/'formal/failure-test.c',repo/'libavcodec/libavcodec.a',repo/'libavutil/libavutil.a','-lm','-lpthread','-o',out/('faults-'+name)])
    run('faults-'+name,[out/('faults-'+name),base/'corpus.dvbpackets'])
   print('PASS',name,'FATE and real/generated output in all modes',flush=True)
 finally:(repo/'libavcodec/dvbsubdec.c').write_bytes(original)
(out/'decoder-results.json').write_text(json.dumps(records,indent=2)+'\n')
