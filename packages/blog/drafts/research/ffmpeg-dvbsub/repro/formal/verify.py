"""Run C obligations, reachability/mutation controls, and finite TLC models."""
import argparse,hashlib,json,os,re,shutil,signal,subprocess,tempfile,time
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--tools',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
root=Path(__file__).resolve().parent;out=a.out.resolve();out.mkdir(parents=True,exist_ok=True)
work=out/'formal'
if work.exists():raise SystemExit('Choose a fresh output directory')
shutil.copytree(root,work);(out/'baseline').mkdir();shutil.copy(root.parent/'baseline/final.c',out/'baseline/final.c')
tools=a.tools.resolve();cbmc=next(tools.glob('cbmc/**/bin/cbmc'));java=next(tools.glob('java/**/bin/java'));z3=tools/'z3-package/bin/z3';jar=tools/'tla2tools.jar'
env=dict(os.environ);env['PATH']=str(z3.parent)+os.pathsep+env['PATH']
records=[]
def run(name,cmd,expected=0,timeout=180):
    logfile=out/(name+'.log');start=time.monotonic()
    with logfile.open('w') as f:
        proc=subprocess.Popen([str(x) for x in cmd],cwd=work,env=env,stdout=f,stderr=subprocess.STDOUT,start_new_session=True)
        try:code=proc.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            os.killpg(proc.pid,signal.SIGTERM);proc.wait();code='timeout'
    log=logfile.read_text();record={'name':name,'command':[str(x).replace(str(work),'<work>').replace(str(tools),'<tools>') for x in cmd],
        'exit_code':code,'expected_exit':expected,'accepted':code==expected,'seconds':round(time.monotonic()-start,3),
        'log_sha256':hashlib.sha256(logfile.read_bytes()).hexdigest(),
        'summary':[line for line in log.splitlines() if re.search(r'VERIFICATION|\*\* \d+ of|FAILURE|SATISFIED|invariant .*violated|states generated|distinct states found|No error has been found',line,re.I)]}
    records.append(record);(out/'formal-results.json').write_text(json.dumps(records,indent=2)+'\n')
    print(name,code,record['seconds'],flush=True)
    if code!=expected:raise SystemExit('Unexpected result: '+name+'; see '+str(logfile))
    return log
subprocess.run(['python3',str(work/'generate.py')],check=True)
checks={'rle':18,'block':31,'bounds':2,'arithmetic':2,'statistics':6,'ordering':6,'copy':2}
for name,unwind in checks.items():
    solver=['--z3'] if name in {'arithmetic','statistics','ordering'} else []
    cmd=[cbmc,work/(name+'.c'),*solver,'--unwind',str(unwind),'--unwinding-assertions','--bounds-check','--pointer-check','--signed-overflow-check','--conversion-check']
    log=run('c-'+name,cmd)
    assert 'VERIFICATION SUCCESSFUL' in log
    log=run('reachable-'+name,[cbmc,work/(name+'.c'),*solver,'-DCHECK_REACHABILITY','--unwind',str(unwind),'--cover','cover'])
    assert 'SATISFIED' in log and 'FAILED' not in log
for name,old,new in [('rle','FFMIN(run_length, dbuf_len - *pixels_read)','FFMIN(run_length, dbuf_len - *pixels_read) + 1'),('block','             (pixels ^ AV_RN64(row - stride)) |\n',''),('ordering','if (score > best_score)','if (score >= best_score)')]:
    path=work/('reduced.h' if name=='ordering' else 'extracted.h');original=path.read_text();assert old in original
    try:
        path.write_text(original.replace(old,new))
        log=run('mutation-'+name,[cbmc,work/(name+'.c'),*(['--z3'] if name=='ordering' else []),'--unwind',str(checks[name]),'--unwinding-assertions','--bounds-check','--pointer-check','--signed-overflow-check','--trace'],expected=10)
        assert 'VERIFICATION FAILED' in log and re.search(r'main\.assertion.*FAILURE',log)
    finally:path.write_text(original)
for cfg in sorted(work.glob('*.cfg')):
    spec='PaletteCache' if cfg.name.startswith('cache') else 'OutputFailure'
    negative=cfg.stem in {'cache-broken','cache-once-naive'} or cfg.stem.startswith('output-false')
    log=run('tlc-'+cfg.stem,[java,'-XX:+UseParallelGC','-cp',jar,'tlc2.TLC','-workers','1','-seed','20261103','-fp','1','-metadir',out/('states-'+cfg.stem),'-config',cfg,work/(spec+'.tla')],expected=12 if negative else 0,timeout=60)
    assert ('is violated' in log) if negative else ('No error has been found' in log)
print('PASS all C obligations, reachability checks, mutations and TLC configurations')
