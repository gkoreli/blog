#!/usr/bin/env python3
"""Extra CLI/MCP correctness and first dynamic Next responses; never overlap load."""
import argparse,contextlib,http.client,importlib.util,json,os,signal,socket,subprocess,time
from pathlib import Path
spec=importlib.util.spec_from_file_location('study',Path(__file__).with_name('study.py'));study=importlib.util.module_from_spec(spec);spec.loader.exec_module(study)

def rpc(port,body,session=None):
 headers={'Content-Type':'application/json','Accept':'application/json, text/event-stream'}
 if session:headers['Mcp-Session-Id']=session
 code,heads,b=study.request(port,'/mcp','POST',json.dumps(body).encode(),headers)
 if heads.get('content-type','').startswith('text/event-stream'):
  chunks=[line[6:] for line in b.decode().splitlines() if line.startswith('data: ')];val=json.loads(chunks[-1]) if chunks else None
 else:val=json.loads(b) if b else None
 return code,heads,val

@contextlib.contextmanager
def next_start(lab,out,mode,label,metrics):
 with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
 env={**os.environ,'PORT':str(port),'HOSTNAME':'127.0.0.1','NBC_RUNTIME_DIR':str(out/'runtime'/mode),'NEXT_TELEMETRY_DISABLED':'1'}
 with (out/'private'/f'{label}.log').open('wb') as log:
  started=time.perf_counter();p=subprocess.Popen([str(lab/'next-final'/mode)],env=env,stdout=log,stderr=log,start_new_session=True)
  try:
   while True:
    assert p.poll() is None
    try:
     code,_,body=study.request(port,'/')
     if code==200:
      assert body==(lab/'next-bun-compile/examples/sharp/.next/server/app/index.html').read_bytes();break
    except (OSError,http.client.HTTPException):pass
    assert time.perf_counter()-started<30
    time.sleep(.002)
   yield {'port':port,'pid':p.pid,'ready_ms':(time.perf_counter()-started)*1000,'started':started}
  finally:
   if p.poll() is None:os.killpg(p.pid,signal.SIGTERM)
   try:p.wait(timeout=4)
   except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGKILL);p.wait()

def main():
 a=argparse.ArgumentParser();a.add_argument('--lab',type=Path,required=True);a.add_argument('--out',type=Path,required=True);a.add_argument('--stage',choices=['keryx','next-dynamic'],required=True);x=a.parse_args();assert not x.out.exists();x.out.mkdir(parents=True);(x.out/'private').mkdir(mode=0o700);metrics=study.helper.Metrics();data={'runner_sha256':study.sha(__file__),'study_sha256':study.sha(Path(__file__).with_name('study.py')),'stage':x.stage,'rows':[]}
 def save():(x.out/'observations.json').write_text(json.dumps(data,indent=2)+'\n')
 save()
 if x.stage=='keryx':
  env={**os.environ,'NODE_ENV':'production','DATABASE_URL':'postgres://postgres@127.0.0.1:55441/keryx_study','DATABASE_AUTO_MIGRATE':'false','REDIS_URL':'memory://','TASKS_ENABLED':'false','RATE_LIMIT_ENABLED':'false','WEB_SERVER_ENABLED':'false','MCP_SERVER_ENABLED':'false','CLI_INCLUDE_STACK_IN_ERRORS':'false','LOG_LEVEL':'fatal'}
  for mode in ['source','native']:
   for label,args,name in [('valid',['--name','Goga'],'Goga'),('default',[],'world'),('unicode',['--name','გოგა'],'გოგა'),('reject',['--name'],None)]:
    argv=[str(x.lab/'compiler/bun-darwin-aarch64/bun'),'keryx.ts'] if mode=='source' else [str(x.lab/'keryx-normalized/native')]
    r=subprocess.run([*argv,'greeting:prompt',*args,'-q'],cwd=x.lab/'keryx/example/backend',env=env,capture_output=True,timeout=20)
    (x.out/'private'/f'{mode}-{label}.log').write_bytes(r.stdout+r.stderr)
    row={'kind':'cli','mode':mode,'case':label,'exit':r.returncode};data['rows'].append(row)
    try:
     assert r.returncode==(1 if label=='reject' else 0),(r.returncode,r.stdout[-300:]);val=json.loads(r.stdout)
     if label!='reject':study.exact(val,{'response':study.hello(name)})
     else:study.exact(val,{'response':{},'error':{'message':'Invalid input: expected string, received boolean','type':'CONNECTION_ACTION_PARAM_REQUIRED','key':'name','value':True}})
     row['accepted']=True
    except Exception as e:row.update(accepted=False,error=str(e))
    save();print(mode,'cli',label,row['accepted'],flush=True)
   row={'kind':'mcp','mode':mode};data['rows'].append(row)
   try:
    with study.server('keryx',mode,x.lab,x.out,f'mcp-{mode}',metrics,mcp=True) as server:
     code,heads,init=rpc(server['port'],{'jsonrpc':'2.0','id':1,'method':'initialize','params':{'protocolVersion':'2025-03-26','capabilities':{},'clientInfo':{'name':'goga-aot-study','version':'1'}}})
     assert code==200 and 'result' in init,(code,init);session=heads.get('mcp-session-id');assert session
     code,_,_=rpc(server['port'],{'jsonrpc':'2.0','method':'notifications/initialized'},session);assert code in (200,202,204),code
     code,_,tools=rpc(server['port'],{'jsonrpc':'2.0','id':2,'method':'tools/list'},session);assert code==200 and 'result' in tools,(code,tools)
     names=[t['name'] for t in tools['result']['tools']];assert 'status' in names,names
     code,_,result=rpc(server['port'],{'jsonrpc':'2.0','id':3,'method':'tools/call','params':{'name':'status','arguments':{}}},session)
     assert code==200 and 'result' in result and not result['result'].get('isError'),(code,result)
     parsed=json.loads(next(c['text'] for c in result['result']['content'] if c['type']=='text'))
     assert parsed['healthy'] is True and parsed['checks']=={'database':True,'redis':True},parsed
     row.update(accepted=True,protocol=init['result']['protocolVersion'],public_tools=names,status_fields_checked=['healthy','checks.database','checks.redis'])
   except Exception as e:row.update(accepted=False,error=str(e))
   save();print(mode,'mcp',row['accepted'],row.get('error',''),flush=True)
 else:
  # Pre-extract once; each fresh process still initializes Next lazily on its first dynamic route.
  data['preextraction']=[]
  for mode in ['jit','native-disk']:
   runtime=x.out/'runtime'/mode;runtime.mkdir(parents=True)
   r=subprocess.run([str(x.lab/'next-final'/mode),'--extract'],env={**os.environ,'NBC_RUNTIME_DIR':str(runtime)},capture_output=True,timeout=30);assert r.returncode==0
  for block in range(12):
   for mode in (['jit','native-disk'] if block%2==0 else ['native-disk','jit']):
    row={'mode':mode,'block':block};data['rows'].append(row)
    try:
     with next_start(x.lab,x.out,mode,f'dynamic-{mode}-{block}',metrics) as server:
      row['static_ready_ms']=server['ready_ms'];t=time.perf_counter();code,_,b=study.request(server['port'],'/api/study');row['first_json_after_static_ms']=(time.perf_counter()-t)*1000;assert code==200;study.exact(json.loads(b),{'framework':'Next.js','result':42})
      row['launch_to_first_json_ms']=(time.perf_counter()-server['started'])*1000;row['json_memory']=metrics.read(server['pid']);t=time.perf_counter();code,_,b=study.request(server['port'],'/api/resize');row['first_image_after_json_ms']=(time.perf_counter()-t)*1000;assert code==200;study.png(b);row['accepted']=True
    except Exception as e:row.update(accepted=False,error=str(e))
    save();print(mode,'dynamic',block+1,row['accepted'],flush=True)
 assert all(r['accepted'] for r in data['rows']),'Some extra checks failed; see retained rows/logs'
if __name__=='__main__':main()
