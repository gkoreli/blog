#!/usr/bin/env python3
"""Four one-minute Keryx pools, retained live app/JS-heap/Redis observations."""
import argparse,importlib.util,json,os,subprocess,time
from pathlib import Path
spec=importlib.util.spec_from_file_location('external',Path(__file__).with_name('external-redis.py'));external=importlib.util.module_from_spec(spec);spec.loader.exec_module(external);study=external.study

def main():
 p=argparse.ArgumentParser();p.add_argument('--lab',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();assert not a.out.exists();a.out.mkdir(parents=True);(a.out/'private').mkdir(mode=0o700);metrics=study.helper.Metrics();client=a.out/'private/http-load';subprocess.run(['cc','-O2','-Wall','-Wextra','-pthread',str(study.TOOL.with_name('http-load.c')),'-o',str(client)],check=True)
 redis=a.lab/'redis-8.0.3/src/redis-server';cli=a.lab/'redis-8.0.3/src/redis-cli';port=external.free_port();data={'metadata':{'runner_sha256':study.sha(__file__),'external_helper_sha256':study.sha(Path(__file__).with_name('external-redis.py')),'study_sha256':study.sha(Path(__file__).with_name('study.py')),'helper_sha256':study.sha(study.TOOL),'cpu_seconds_per_tick':metrics.cpu_seconds_per_tick,'order':['source','native','native','source'],'segments':6,'seconds_per_segment':10,'warmup_seconds':2,'connections':8,'profile':'Returning cookie, actual Redis and PostgreSQL; status/heap checks between segments'},'rows':[]}
 def save():(a.out/'observations.json').write_text(json.dumps(data,indent=2)+'\n')
 with (a.out/'private/redis.log').open('wb') as log:
  rp=subprocess.Popen([str(redis),'--bind','127.0.0.1','--port',str(port),'--save','','--appendonly','no','--protected-mode','yes'],stdout=log,stderr=log,start_new_session=True)
  try:
   for _ in range(100):
    r=subprocess.run([str(cli),'-p',str(port),'PING'],capture_output=True)
    if r.returncode==0:break
    assert rp.poll() is None;time.sleep(.02)
   else:raise RuntimeError('Redis failed')
   for block,mode in enumerate(data['metadata']['order']):
    row={'mode':mode,'block':block,'routes':[]};data['rows'].append(row)
    try:
     with external.server(a.lab,a.out,mode,block,port,metrics) as server:
      row.update({k:v for k,v in server.items() if k not in ('pid','port')});row['checks'],cases=study.check('keryx',server['port'],a.lab);_,heads,b=study.request(server['port'],'/api/greeting/prompt?name=Goga');cookie=heads['set-cookie'].split(';')[0];case=next(c for c,body in cases if c['name']=='greeting');case={**case,'headers':{'Cookie':cookie}};study.helper.load(client,server,case,b,2,8,metrics)
      for segment in range(6):
       value=study.helper.load(client,server,case,b,10,8,metrics);code,_,body=study.request(server['port'],'/api/status',headers={'Cookie':cookie});status=json.loads(body);assert code==200 and status['healthy'] is True and status['checks']=={'database':True,'redis':True}
       assert type(status['consumedMemoryMB']) in (int,float) and status['consumedMemoryMB']>0
       raw=subprocess.check_output([str(cli),'-p',str(port),'INFO','memory'],text=True);pairs=dict(line.split(':',1) for line in raw.splitlines() if ':' in line and not line.startswith('#'))
       value.update(name='greeting',segment=segment,app_heap_used_mib=status['consumedMemoryMB'],redis_used_memory=int(pairs['used_memory']),redis_keys=int(subprocess.check_output([str(cli),'-p',str(port),'DBSIZE'],text=True)));row['routes'].append(value);save();print(mode,'minute',block+1,'segment',segment+1,flush=True)
      assert len(set(r['redis_keys'] for r in row['routes']))==1,'keys grew under returning-cookie traffic';row['accepted']=True
    except Exception as e:row.update(accepted=False,error=str(e))
    save()
  finally:external.stop(rp)
 assert len(data['rows'])==4 and all(r['accepted'] for r in data['rows'])
if __name__=='__main__':main()
