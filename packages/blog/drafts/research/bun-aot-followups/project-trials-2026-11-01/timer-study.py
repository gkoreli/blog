#!/usr/bin/env python3
"""Balanced original/fixed action-timeout comparison; restore source after every process."""
import argparse,contextlib,importlib.util,json,os,socket,subprocess,time
from pathlib import Path
spec=importlib.util.spec_from_file_location('external',Path(__file__).with_name('external-redis.py'));external=importlib.util.module_from_spec(spec);spec.loader.exec_module(external);study=external.study
fixspec=importlib.util.spec_from_file_location('fix',Path(__file__).with_name('prepare-timer-fix.py'));fix=importlib.util.module_from_spec(fixspec);fixspec.loader.exec_module(fix)
@contextlib.contextmanager
def server(lab,out,variant,index,redis_port,metrics,original):
 root=lab/'keryx';file=root/'packages/keryx/classes/Connection.ts';patched=fix.fixed(original.decode()).encode();use_fixed=variant.endswith('fixed');file.write_bytes(patched if use_fixed else original);port=external.free_port();native=variant.startswith('native');binary=(lab/'keryx-timer-fixed/native' if use_fixed else lab/'keryx-normalized/native') if native else lab/'compiler/bun-darwin-aarch64/bun';argv=[str(binary),'start'] if native else [str(binary),'keryx.ts','start']
 env={**os.environ,'NODE_ENV':'production','DATABASE_URL':'postgres://postgres@127.0.0.1:55441/keryx_study','DATABASE_AUTO_MIGRATE':'false','REDIS_URL':f'redis://127.0.0.1:{redis_port}/0','TASKS_ENABLED':'false','RATE_LIMIT_ENABLED':'false','WEB_SERVER_ENABLED':'true','WEB_SERVER_HOST':'127.0.0.1','WEB_SERVER_PORT':str(port),'MCP_SERVER_ENABLED':'false','LOG_LEVEL':'fatal'};p=None
 try:
  with (out/'private'/f'{variant}-{index}.log').open('wb') as log:
   started=time.perf_counter();p=subprocess.Popen(argv,cwd=root/'example/backend',env=env,stdout=log,stderr=log,start_new_session=True)
   while True:
    assert p.poll() is None,('startup exit',p.returncode)
    try:
     code,_,b=study.request(port,'/api/greeting/prompt?name=Goga')
     if code==200:study.exact(json.loads(b),study.hello('Goga'));break
    except (OSError,study.http.client.HTTPException):pass
    assert time.perf_counter()-started<30;time.sleep(.002)
   ready=(time.perf_counter()-started)*1000;assert not study.helper.child_pids(p.pid)
   yield {'port':port,'pid':p.pid,'ready_ms':ready,'ready_memory':metrics.read(p.pid),'binary_sha256':study.sha(binary),'connection_source_sha256':study.sha(file)}
 finally:
  if p is not None:external.stop(p)
  file.write_bytes(original)
def main():
 p=argparse.ArgumentParser();p.add_argument('--lab',type=Path,required=True);p.add_argument('--out',type=Path,required=True);p.add_argument('--stage',choices=['short','long-fixed'],required=True);a=p.parse_args();assert not a.out.exists();a.out.mkdir(parents=True);(a.out/'private').mkdir(mode=0o700);metrics=study.helper.Metrics();client=a.out/'private/http-load';subprocess.run(['cc','-O2','-Wall','-Wextra','-pthread',str(study.TOOL.with_name('http-load.c')),'-o',str(client)],check=True)
 original=(a.lab/'keryx/packages/keryx/classes/Connection.ts').read_bytes();expected=json.loads((a.lab/'keryx-timer-fixed/build.json').read_text());assert study.hashlib.sha256(original).hexdigest()==expected['original_connection_sha256']
 variants=['source-original','source-fixed','native-original','native-fixed'];order=[]
 if a.stage=='short':
  for block in range(4):
   cells=variants[block:]+variants[:block]
   order.extend((block,v) for v in cells)
 else:order=[(0,'source-fixed'),(1,'native-fixed')]
 data={'metadata':{'runner_sha256':study.sha(__file__),'external_sha256':study.sha(Path(__file__).with_name('external-redis.py')),'study_sha256':study.sha(Path(__file__).with_name('study.py')),'patch_helper_sha256':study.sha(Path(__file__).with_name('prepare-timer-fix.py')),'stage':a.stage,'order':order,'connections':8,'warmup_seconds':2,'measured_seconds':5 if a.stage=='short' else 10,'segments':1 if a.stage=='short' else 6,'profile':'Original/fixed default five-minute action deadline, returning cookie, real Redis/PostgreSQL'},'rows':[]};redis=a.lab/'redis-8.0.3/src/redis-server';cli=a.lab/'redis-8.0.3/src/redis-cli';rp=None;port=external.free_port()
 def save():(a.out/'observations.json').write_text(json.dumps(data,indent=2)+'\n')
 try:
  with (a.out/'private/redis.log').open('wb') as log:
   rp=subprocess.Popen([str(redis),'--bind','127.0.0.1','--port',str(port),'--save','','--appendonly','no','--protected-mode','yes'],stdout=log,stderr=log,start_new_session=True)
   for _ in range(100):
    r=subprocess.run([str(cli),'-p',str(port),'PING'],capture_output=True)
    if r.returncode==0:break
    assert rp.poll() is None;time.sleep(.02)
   else:raise RuntimeError('Redis readiness')
   save()
   for index,(block,variant) in enumerate(order):
    row={'variant':variant,'mode':variant,'block':block,'routes':[]};data['rows'].append(row)
    try:
     with server(a.lab,a.out,variant,index,port,metrics,original) as app:
      row.update({k:v for k,v in app.items() if k not in ('pid','port')});row['checks'],cases=study.check('keryx',app['port'],a.lab);_,heads,b=study.request(app['port'],'/api/greeting/prompt?name=Goga');cookie=heads['set-cookie'].split(';')[0];case=next(c for c,body in cases if c['name']=='greeting');case={**case,'headers':{'Cookie':cookie}};study.helper.load(client,app,case,b,2,8,metrics)
      for segment in range(data['metadata']['segments']):
       before_keys=int(subprocess.check_output([str(cli),'-p',str(port),'DBSIZE'],text=True));v=study.helper.load(client,app,case,b,data['metadata']['measured_seconds'],8,metrics);after_keys=int(subprocess.check_output([str(cli),'-p',str(port),'DBSIZE'],text=True));assert before_keys==after_keys
       v.update(name='greeting',segment=segment,redis_keys=after_keys)
       if a.stage=='long-fixed':
        code,_,body=study.request(app['port'],'/api/status',headers={'Cookie':cookie});status=json.loads(body);assert code==200 and status['healthy'] is True;v['app_heap_used_mib']=status['consumedMemoryMB']
       row['routes'].append(v);save()
      row['accepted']=True
    except Exception as e:row.update(accepted=False,error=str(e))
    save();print(variant,a.stage,index+1,row['accepted'],row.get('error',''),flush=True)
 finally:
  if rp is not None:external.stop(rp)
  (a.lab/'keryx/packages/keryx/classes/Connection.ts').write_bytes(original)
 assert len(data['rows'])==len(order) and all(r['accepted'] for r in data['rows'])
if __name__=='__main__':main()
