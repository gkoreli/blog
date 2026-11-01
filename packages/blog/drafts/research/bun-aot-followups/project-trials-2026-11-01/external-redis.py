#!/usr/bin/env python3
"""Same Keryx returning-client workload with a study-owned real Redis server."""
import argparse,contextlib,importlib.util,json,os,signal,socket,subprocess,time
from pathlib import Path
spec=importlib.util.spec_from_file_location('study',Path(__file__).with_name('study.py'));study=importlib.util.module_from_spec(spec);spec.loader.exec_module(study)
def free_port():
 with socket.socket() as s:s.bind(('127.0.0.1',0));return s.getsockname()[1]
def stop(p):
 if p.poll() is None:os.killpg(p.pid,signal.SIGTERM)
 try:p.wait(timeout=4)
 except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGKILL);p.wait()
@contextlib.contextmanager
def server(lab,out,mode,block,redis_port,metrics):
 port=free_port();env={**os.environ,'PATH':str(lab/'compiler/bun-darwin-aarch64')+os.pathsep+os.environ['PATH'],'NODE_ENV':'production','DATABASE_URL':'postgres://postgres@127.0.0.1:55441/keryx_study','DATABASE_AUTO_MIGRATE':'false','REDIS_URL':f'redis://127.0.0.1:{redis_port}/0','TASKS_ENABLED':'false','RATE_LIMIT_ENABLED':'false','WEB_SERVER_ENABLED':'true','WEB_SERVER_HOST':'127.0.0.1','WEB_SERVER_PORT':str(port),'MCP_SERVER_ENABLED':'false','LOG_LEVEL':'fatal'}
 binary=lab/'compiler/bun-darwin-aarch64/bun' if mode=='source' else lab/'keryx-normalized/native';argv=[str(binary),'keryx.ts','start'] if mode=='source' else [str(binary),'start']
 with (out/'private'/f'{mode}-{block}.log').open('wb') as log:
  started=time.perf_counter();p=subprocess.Popen(argv,cwd=lab/'keryx/example/backend',env=env,stdout=log,stderr=log,start_new_session=True)
  try:
   while True:
    assert p.poll() is None,('startup exited',p.returncode)
    try:
     code,_,body=study.request(port,'/api/greeting/prompt?name=Goga')
     if code==200:study.exact(json.loads(body),study.hello('Goga'));break
    except (OSError,study.http.client.HTTPException):pass
    assert time.perf_counter()-started<30
    time.sleep(.002)
   ready=(time.perf_counter()-started)*1000;assert not study.helper.child_pids(p.pid)
   yield {'port':port,'pid':p.pid,'ready_ms':ready,'ready_memory':metrics.read(p.pid),'binary_sha256':study.sha(binary)}
  finally:stop(p)
def main():
 a=argparse.ArgumentParser();a.add_argument('--lab',type=Path,required=True);a.add_argument('--out',type=Path,required=True);x=a.parse_args();assert not x.out.exists();x.out.mkdir(parents=True);(x.out/'private').mkdir(mode=0o700);metrics=study.helper.Metrics();client=x.out/'private/http-load'
 subprocess.run(['cc','-O2','-Wall','-Wextra','-pthread',str(study.TOOL.with_name('http-load.c')),'-o',str(client)],check=True)
 redis=x.lab/'redis-8.0.3/src/redis-server';cli=x.lab/'redis-8.0.3/src/redis-cli';port=free_port()
 data={'metadata':{'profile':'One returning session, eight HTTP connections, real isolated Redis and PostgreSQL','runner_sha256':study.sha(__file__),'helper_sha256':study.sha(study.TOOL),'study_sha256':study.sha(Path(__file__).with_name('study.py')),'client_source_sha256':study.sha(study.TOOL.with_name('http-load.c')),'runs':6,'connections':8,'warmup_seconds':2,'measured_seconds':5,'redis_version':subprocess.check_output([str(redis),'--version'],text=True).strip(),'redis_sha256':study.sha(redis),'cpu_seconds_per_tick':metrics.cpu_seconds_per_tick},'rows':[]}
 def save():(x.out/'observations.json').write_text(json.dumps(data,indent=2)+'\n')
 def info(pid):
  raw=subprocess.check_output([str(cli),'-h','127.0.0.1','-p',str(port),'INFO','memory'],text=True);pairs=dict(line.split(':',1) for line in raw.splitlines() if ':' in line and not line.startswith('#'))
  return {'process':metrics.read(pid),'dbsize':int(subprocess.check_output([str(cli),'-h','127.0.0.1','-p',str(port),'DBSIZE'],text=True)),**{k:int(pairs[k]) for k in ['used_memory','used_memory_peak','used_memory_rss']}}
 with (x.out/'private/redis.log').open('wb') as log:
  process=subprocess.Popen([str(redis),'--bind','127.0.0.1','--port',str(port),'--save','','--appendonly','no','--protected-mode','yes'],stdout=log,stderr=log,start_new_session=True)
  try:
   for attempt in range(100):
    r=subprocess.run([str(cli),'-h','127.0.0.1','-p',str(port),'PING'],capture_output=True)
    if r.returncode==0 and r.stdout.strip()==b'PONG':break
    assert process.poll() is None;time.sleep(.02)
   else:raise RuntimeError('Redis readiness failed')
   save()
   for block in range(6):
    for mode in (['source','native'] if block%2==0 else ['native','source']):
     row={'mode':mode,'block':block};data['rows'].append(row)
     try:
      with server(x.lab,x.out,mode,block,port,metrics) as app:
       row.update({k:v for k,v in app.items() if k not in ('pid','port')});row['checks'],cases=study.check('keryx',app['port'],x.lab);code,headers,body=study.request(app['port'],'/api/greeting/prompt?name=Goga');assert code==200;study.exact(json.loads(body),study.hello('Goga'));cookie=headers['set-cookie'].split(';')[0];assert cookie.startswith('__session=');row['routes']=[]
       for c,b in cases if block%2==0 else list(reversed(cases)):
        c={**c,'headers':{'Cookie':cookie}};study.helper.load(client,app,c,b,2,8,metrics);before=info(process.pid);v=study.helper.load(client,app,c,b,5,8,metrics);after=info(process.pid);assert after['dbsize']==before['dbsize'],'returning workload created more keys'
        v.update(redis_before=before,redis_after=after,redis_cpu_percent=(after['process']['cpu_seconds']-before['process']['cpu_seconds'])/v['seconds']*100);row['routes'].append({'name':c['name'],**v})
       row['accepted']=True
     except Exception as error:row.update(accepted=False,error=str(error))
     save();print(mode,'external Redis',block+1,row['accepted'],row.get('error',''),flush=True)
  finally:stop(process)
 assert len(data['rows'])==12 and all(r['accepted'] for r in data['rows'])
if __name__=='__main__':main()
