#!/usr/bin/env python3
"""Prove the prebuilt native MCP variant with the source tree hidden and no Bun on PATH."""
import argparse,contextlib,hashlib,importlib.util,json,os,signal,socket,subprocess,tempfile,time
from pathlib import Path
spec=importlib.util.spec_from_file_location('checks',Path(__file__).with_name('extra-checks.py'));checks=importlib.util.module_from_spec(spec);spec.loader.exec_module(checks)
def main():
 p=argparse.ArgumentParser();p.add_argument('--lab',type=Path,required=True);p.add_argument('--binary',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();assert not a.out.exists();a.out.mkdir(parents=True);root=a.lab/'keryx';hidden=a.lab/'keryx-source-hidden';assert root.is_dir() and not hidden.exists();assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()=='d119595bec716ae99b4eca740964343e47f57eee'
 with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
 env={**os.environ,'PATH':'/usr/bin:/bin','NODE_ENV':'production','DATABASE_URL':'postgres://postgres@127.0.0.1:55441/keryx_study','DATABASE_AUTO_MIGRATE':'false','REDIS_URL':'memory://','TASKS_ENABLED':'false','RATE_LIMIT_ENABLED':'false','WEB_SERVER_ENABLED':'true','WEB_SERVER_HOST':'127.0.0.1','WEB_SERVER_PORT':str(port),'MCP_SERVER_ENABLED':'true','MCP_AUTH_MODE':'optional','LOG_LEVEL':'fatal'}
 data={'runner_sha256':checks.study.sha(__file__),'binary_sha256':checks.study.sha(a.binary),'source_hidden':False,'path':'/usr/bin:/bin','accepted':False};process=None
 root.rename(hidden)
 try:
  data['source_hidden']=not root.exists()
  with tempfile.TemporaryDirectory(prefix='native-mcp-cwd-') as cwd,(a.out/'private.log').open('wb') as log:
   process=subprocess.Popen([str(a.binary.resolve()),'start'],cwd=cwd,env=env,stdout=log,stderr=log,start_new_session=True);start=time.monotonic()
   while True:
    assert process.poll() is None,('startup exited',process.returncode)
    try:
     code,_,body=checks.study.request(port,'/api/greeting/prompt?name=Goga')
     if code==200:checks.study.exact(json.loads(body),checks.study.hello('Goga'));break
    except (OSError,checks.http.client.HTTPException):pass
    assert time.monotonic()-start<30;time.sleep(.005)
   code,headers,value=checks.rpc(port,{'jsonrpc':'2.0','id':1,'method':'initialize','params':{'protocolVersion':'2025-03-26','capabilities':{},'clientInfo':{'name':'goga-native-mcp-study','version':'1'}}});assert code==200 and 'result' in value,(code,value);session=headers['mcp-session-id'];data['protocol']=value['result']['protocolVersion']
   code,_,_=checks.rpc(port,{'jsonrpc':'2.0','method':'notifications/initialized'},session);assert code in (200,202,204)
   code,_,value=checks.rpc(port,{'jsonrpc':'2.0','id':2,'method':'tools/list'},session);assert code==200;names=[t['name'] for t in value['result']['tools']];assert 'status' in names;data['tools']=names
   code,_,value=checks.rpc(port,{'jsonrpc':'2.0','id':3,'method':'tools/call','params':{'name':'status','arguments':{}}},session);assert code==200 and not value['result'].get('isError');status=json.loads(next(c['text'] for c in value['result']['content'] if c['type']=='text'));assert status['healthy'] is True and status['checks']=={'database':True,'redis':True};data['health_checks']=status['checks']
   code,_,value=checks.rpc(port,{'jsonrpc':'2.0','id':4,'method':'resources/list'},session);assert code==200;resources=value['result'].get('resources',[]);data['resource_uris']=[r['uri'] for r in resources];data['ui_html_checks']=[]
   for resource in resources:
    if not resource['uri'].startswith('ui://'):continue
    code,_,value=checks.rpc(port,{'jsonrpc':'2.0','id':5,'method':'resources/read','params':{'uri':resource['uri']}},session);assert code==200 and 'result' in value
    text=next(c['text'] for c in value['result']['contents'] if 'text' in c);digest=hashlib.sha256(text.encode()).hexdigest();expected=hashlib.sha256((a.lab/'prebuilt-mcp-status.html').read_bytes()).hexdigest();assert digest==expected
    data['ui_html_checks'].append({'uri':resource['uri'],'bytes':len(text.encode()),'sha256':digest})
   data['child_processes']=checks.study.helper.child_pids(process.pid);assert not data['child_processes'];data['accepted']=True
 except Exception as error:data['error']=str(error)
 finally:
  if process is not None:
   if process.poll() is None:os.killpg(process.pid,signal.SIGTERM)
   try:process.wait(timeout=4)
   except subprocess.TimeoutExpired:os.killpg(process.pid,signal.SIGKILL);process.wait()
  hidden.rename(root);data['source_restored']=root.exists();(a.out/'result.json').write_text(json.dumps(data,indent=2)+'\n');print(json.dumps(data),flush=True)
 assert data['accepted'],'Native MCP proof failed; inspect retained result/log'
if __name__=='__main__':main()
