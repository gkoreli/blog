import pathlib,subprocess,os,json,sys,time,hashlib
linux=sys.platform.startswith('linux');r=pathlib.Path('/home/goga.guest/worktree-research' if linux else '/tmp/macos-worktree-research').resolve();shared=pathlib.Path('/tmp/macos-worktree-research');node=r/'tools'/('node-v26.12.1-linux-arm64' if linux else 'node-v26.12.1-darwin-arm64')/'bin/node';cli=r/'tools/pnpm12/bin/pnpm.mjs' if linux else r/'npm-cache/_npx/aa4546e781591cea/node_modules/pnpm/bin/pnpm.mjs';source=r/('t3' if linux else 't3-history');out=r/'v4-cow-proof';out.mkdir(exist_ok=False);shim=out/'bin';shim.mkdir();f=shim/'pnpm';f.write_text(f'#!/bin/sh\nexec {node} {cli} "$@"\n');f.chmod(0o755);env=dict(os.environ);env['PATH']=str(shim)+':'+str(node.parent)+':'+env['PATH'];env.update({'CI':'true','npm_config_manage_package_manager_versions':'false'})
views={'a':r/'v4-overlay-test/view','b':r/'v4-overlay-b/view'} if linux else {x:r/f'v4-mac-shadow-{x}' for x in ('a','b')}
if linux:
 base=r/'v4-overlay-b';base.mkdir();[(base/x).mkdir() for x in ('upper','work','view')];subprocess.run(['sudo','mount','-t','overlay','overlay','-o',f'lowerdir={r}/v4-readonly-t3-store,upperdir={base}/upper,workdir={base}/work,nosuid,nodev',str(base/'view')],check=True)
records=[];repos={}
for name in ('a','b'):
 repo=r/f'v4-cow-t3-{name}';repos[name]=repo;view=views[name];assert (view/'v11/index.db').is_file()
 subprocess.run(['git','-C',str(source),'worktree','add','--detach',str(repo),'125b61954dbba5822a8108c8ca47a4846b4b4328'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);subprocess.run(['git','apply',str(shared/'v4-t3-react-type-peers.patch')],cwd=repo,check=True)
 for stage,command,cwd in [('install',[str(node),str(cli),'install','--offline','--frozen-lockfile','--config.virtualStoreType=global','--store-dir',str(view),'--yes'],repo),('types',[str(repo/'node_modules/.bin/tsc'),'--noEmit','--pretty','false'],repo/'apps/web')]:
  start=time.perf_counter();log=out/f'{name}-{stage}.log'
  with log.open('w') as f:code=subprocess.run(command,cwd=cwd,env=env,stdout=f,stderr=subprocess.STDOUT).returncode
  record={'view':name,'stage':stage,'exitCode':code,'secondsDiagnosticOnly':time.perf_counter()-start};records.append(record);print(json.dumps(record),flush=True)
  if code:raise RuntimeError(f'{name}-{stage} failed')
pA=(repos['a']/'apps/web/node_modules/lucide-react/package.json').resolve();pB=(repos['b']/'apps/web/node_modules/lucide-react/package.json').resolve();assert pA.is_relative_to(views['a']) and pB.is_relative_to(views['b']);beforeA=pA.read_bytes();beforeB=pB.read_bytes();assert beforeA==beforeB;pA.write_bytes(beforeA+b'\n');isolated=pB.read_bytes()==beforeB and pA.read_bytes()!=beforeA;pA.write_bytes(beforeA);assert isolated
(out/'isolation.json').write_text(json.dumps({'simultaneousViews':2,'packageMutationIsolated':isolated,'registryTargetsInsideOwnView':True,'packageRelativePath':str(pA.relative_to(views['a'])),'basePackageSha256':hashlib.sha256(beforeA).hexdigest()},indent=2)+'\n')
repo=repos['a'];view=views['a']
for stage,args in [('unit',['exec','vp','test','run','--project','unit','--maxWorkers=2']),('build',['run','build'])]:
 log=out/(stage+'.log')
 with log.open('w') as f:code=subprocess.run([str(node),str(cli),'--config.virtualStoreType=global','--config.storeDir='+str(view),*args],cwd=repo/'apps/web',env=env,stdout=f,stderr=subprocess.STDOUT).returncode
 record={'stage':stage,'exitCode':code};records.append(record);print(json.dumps(record),flush=True)
 if code:break
(out/'results.json').write_text(json.dumps(records,indent=2)+'\n')
