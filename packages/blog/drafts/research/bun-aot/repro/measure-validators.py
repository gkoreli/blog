import json,os,pathlib,re,subprocess,time
root=pathlib.Path(__file__).resolve().parent;bun=root/'bun-darwin-aarch64/bun'
builds=[]
for app in ['zod-default','zod-jitless']:
 for mode,flags in [('jit',[]),('aot',['--aot'])]:
  cmd=[str(bun),'build','--compile',*flags,str(root/f'{app}.ts'),'--outfile',str(root/f'{app}-{mode}')]
  t=time.perf_counter();p=subprocess.run(cmd,text=True,capture_output=True)
  builds.append(dict(app=app,mode=mode,seconds=time.perf_counter()-t,exit=p.returncode,stdout=p.stdout,stderr=p.stderr))
  if p.returncode:raise RuntimeError(p.stderr)
(root/'validator-builds.json').write_text(json.dumps(builds,indent=2))
rows=[]
for repeat in range(6):
 cases=[(a,m) for a in ['zod-default','zod-jitless'] for m in ['jit','aot']]
 if repeat%2:cases.reverse()
 for app,mode in cases:
  cmd=[str(root/f'{app}-{mode}')]
  t=time.perf_counter();p=subprocess.run(cmd,text=True,capture_output=True,env=dict(os.environ,ITERATIONS='2000000'))
  if p.returncode or json.loads(p.stdout)!={'passed':2000000}:raise RuntimeError((p.returncode,p.stdout,p.stderr))
  row=dict(app=app,mode=mode,repeat=repeat,warmup=repeat==0,seconds=time.perf_counter()-t,stdout=p.stdout)
  rows.append(row);(root/'validator-results.json').write_text(json.dumps(rows,indent=2));print(app,mode,repeat,round(row['seconds'],4),flush=True)
print('DONE',flush=True)
