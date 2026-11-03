"""Check the hardened decoder against a bootstrapped baseline, optionally sanitized."""
import argparse,hashlib,json,os,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--baseline',type=Path,required=True);p.add_argument('--out',type=Path,required=True);p.add_argument('--san-repo',type=Path);a=p.parse_args()
root=Path(__file__).resolve().parent;base=a.baseline.resolve();out=a.out.resolve();out.mkdir(parents=True,exist_ok=True)
env=dict(os.environ);env['ASAN_OPTIONS']='abort_on_error=1';env['UBSAN_OPTIONS']='halt_on_error=1:print_stacktrace=1'
records=[]
def command(cmd,log,expected=0,cwd=None):
    proc=subprocess.run([str(x) for x in cmd],cwd=cwd,env=env,capture_output=True,text=True)
    (out/(log+'.log')).write_text(proc.stdout+proc.stderr)
    records.append({'name':log,'exit_code':proc.returncode,'expected_exit':expected,'accepted':proc.returncode==expected,'log_sha256':hashlib.sha256((out/(log+'.log')).read_bytes()).hexdigest()})
    assert proc.returncode==expected,(log,proc.returncode)
# Recompute reference outputs from the fresh upstream executables.
references={}
for mode in [-2,-1,0,1]:
    for fixture,program,inputfile in [('real','decode','dvbsubtest_filter.ts'),('generated','packets','corpus.dvbpackets')]:
        target=out/f'reference-{fixture}-{mode}.bin'
        command([base/(program+'-upstream'),base/inputfile,'1',str(mode),target],f'reference-{fixture}-{mode}')
        references[(fixture,mode)]=target
for sanitized in [False,True]:
    if sanitized and not a.san_repo:continue
    name='sanitized' if sanitized else 'normal';repo=(a.san_repo if sanitized else base/'ffmpeg').resolve()
    source=repo/'libavcodec/dvbsubdec.c';source.write_bytes((root/'hardened.c').read_bytes())
    for f in ['libavcodec/dvbsubdec.o','libavcodec/libavcodec.a']:(repo/f).unlink(missing_ok=True)
    command(['make','-j4','ffmpeg'],'build-'+name,cwd=repo)
    command(['make','fate-sub-dvb'],'fate-'+name,cwd=repo)
    flags=['-fsanitize=address,undefined','-fno-omit-frame-pointer'] if sanitized else []
    for program in ['decode','packets','failure']:
        sourcefile={'decode':base/'decode.c','packets':base/'packet-test.c','failure':root/'failure-test.c'}[program]
        libs=[repo/'libavcodec/libavcodec.a',repo/'libavutil/libavutil.a']
        if program=='decode':libs.insert(0,repo/'libavformat/libavformat.a')
        command(['clang','-O3',*flags,*(['-DHAVE_AV_CONFIG_H'] if program=='failure' else []),'-I',repo,'-I',repo/'libavcodec','-I',root,sourcefile,*libs,'-lm','-lpthread','-o',out/(program+'-'+name)],'compile-'+program+'-'+name)
    command([out/('failure-'+name),base/'corpus.dvbpackets'],'faults-'+name)
    for mode in [-2,-1,0,1]:
        for fixture,program,inputfile in [('real','decode','dvbsubtest_filter.ts'),('generated','packets','corpus.dvbpackets')]:
            target=out/f'{fixture}-{name}-{mode}.bin'
            command([out/(program+'-'+name),base/inputfile,'1',str(mode),target],f'{fixture}-{name}-{mode}')
            assert target.read_bytes()==references[(fixture,mode)].read_bytes()
            records[-1].update(identical_to_merged_upstream=True,bytes=target.stat().st_size,output_sha256=hashlib.sha256(target.read_bytes()).hexdigest())
    if not sanitized:
        for variant in ['final','upstream']:
            command(['clang','-O3','-DHAVE_AV_CONFIG_H',f'-DDECODER_SOURCE="{base/(variant+".c")}"','-I',repo,'-I',repo/'libavcodec','-I',root,root/'failure-test.c',repo/'libavcodec/libavcodec.a',repo/'libavutil/libavutil.a','-lm','-lpthread','-o',out/('failure-'+variant)],'compile-control-'+variant)
            command([out/('failure-'+variant),base/'corpus.dvbpackets'],'fault-control-'+variant,expected=1)
    print('PASS',name,'FATE, fault injection/retry, and all modes/fixtures',flush=True)
(out/'decoder-results.json').write_text(json.dumps(records,indent=2)+'\n')
