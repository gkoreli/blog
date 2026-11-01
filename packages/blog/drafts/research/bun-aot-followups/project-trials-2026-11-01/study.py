#!/usr/bin/env python3
"""Pinned real-project correctness, launch and HTTP trials; see 00-plan.md."""
import argparse, contextlib, hashlib, http.client, importlib.util, json, os, signal, socket, struct, subprocess, time, zlib
from pathlib import Path
from datetime import datetime, timezone

TOOL=Path(__file__).resolve().parents[4]/'tools/bun-aot-check/compare.py'
spec=importlib.util.spec_from_file_location('comparison',TOOL);helper=importlib.util.module_from_spec(spec);spec.loader.exec_module(helper)
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def exact(a,b):assert json.dumps(a,sort_keys=True,separators=(',',':'))==json.dumps(b,sort_keys=True,separators=(',',':')),(a,b)
def hello(name):return {'description':'A personalized greeting','messages':[{'role':'user','content':{'type':'text','text':f'Hello, {name}! How can I help you today?'}}]}
def png(b):
 assert b[:8]==b'\x89PNG\r\n\x1a\n';pos=8;data=b'';ihdr=None
 while pos<len(b):
  n=struct.unpack('>I',b[pos:pos+4])[0];tag=b[pos+4:pos+8];part=b[pos+8:pos+8+n];crc=struct.unpack('>I',b[pos+8+n:pos+12+n])[0]
  assert zlib.crc32(tag+part)&0xffffffff==crc
  if tag==b'IHDR':ihdr=struct.unpack('>IIBBBBB',part)
  if tag==b'IDAT':data+=part
  pos+=12+n
  if tag==b'IEND':break
 assert pos==len(b) and ihdr==(32,32,8,6,0,0,0),ihdr
 raw=zlib.decompress(data);assert len(raw)==32*129;prev=bytearray(128);pixels=bytearray()
 for y in range(32):
  kind=raw[y*129];row=bytearray(raw[y*129+1:(y+1)*129]);assert 0<=kind<=4
  for x in range(128):
   left=row[x-4] if x>=4 else 0;up=prev[x];ul=prev[x-4] if x>=4 else 0
   if kind==1:v=left
   elif kind==2:v=up
   elif kind==3:v=(left+up)//2
   elif kind==4:
    p=left+up-ul;dist=[abs(p-left),abs(p-up),abs(p-ul)];v=[left,up,ul][dist.index(min(dist))]
   else:v=0
   row[x]=(row[x]+v)&255
  pixels+=row;prev=row
 assert pixels==bytes([255,0,0,255])*1024
 return {'width':32,'height':32,'rgba_pixels_checked':1024}

def request(port,path,method='GET',body=None,headers=None):
 c=http.client.HTTPConnection('127.0.0.1',port,timeout=15)
 try:
  c.request(method,path,body=body,headers=headers or {});r=c.getresponse();b=r.read(120001);assert len(b)<120000
  return r.status,dict((k.lower(),v) for k,v in r.getheaders()),b
 finally:c.close()

def check(project,port,lab):
 rows=[];measured=[]
 if project=='next':
  root=lab/'next-bun-compile/examples/sharp'
  cases=[('page','/',200,(root/'.next/server/app/index.html').read_bytes(),'text/html'),('json','/api/study',200,{'framework':'Next.js','result':42},'application/json'),('static','/study-asset.txt',200,b'bun-aot-study-static-asset\n','text/plain'),('image','/api/resize',200,None,'image/png')]
 else:cases=[('greeting','/api/greeting/prompt?name=Goga',200,hello('Goga'),'application/json'),('default','/api/greeting/prompt',200,hello('world'),'application/json'),('rejected','/api/greeting/prompt?name=a&name=b',406,None,'application/json')]
 for name,path,status,expected,ctype in cases:
  code,heads,b=request(port,path);assert code==status,(name,code,b[:200]);assert heads.get('content-type','').startswith(ctype),(name,heads)
  if project=='keryx' and name=='rejected':
   val=json.loads(b);stamp=val['error'].pop('timestamp');assert type(stamp) is int and abs(time.time()*1000-stamp)<300000
   exact(val,{'error':{'message':'Invalid input: expected string, received array','type':'CONNECTION_ACTION_PARAM_REQUIRED','key':'name','value':['a','b']}})
  elif name=='image':png(b)
  elif isinstance(expected,dict):exact(json.loads(b),expected)
  else:assert b==expected,(name,'bytes differ')
  if name in ('json','image'):assert heads.get('cache-control')=='no-store'
  rows.append({'name':name,'path':path,'status':code,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'content_type':heads['content-type'],'check':'full JSON except validated timestamp' if name=='rejected' else 'all 1024 RGBA pixels and PNG CRCs' if name=='image' else 'complete expected JSON/body'})
  if name!='rejected':measured.append(({'name':name,'method':'GET','path':path,'headers':{},'body_bytes':b'','expected_status':status},b))
 return rows,measured

@contextlib.contextmanager
def server(project,mode,lab,out,label,metrics,mcp=False):
 with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
 env={**os.environ,'PATH':str(lab/'compiler/bun-darwin-aarch64')+os.pathsep+os.environ['PATH'],'NODE_ENV':'production','PORT':str(port),'HOSTNAME':'127.0.0.1','NEXT_TELEMETRY_DISABLED':'1','DATABASE_URL':'postgres://postgres@127.0.0.1:55441/keryx_study','DATABASE_AUTO_MIGRATE':'false','REDIS_URL':'memory://','TASKS_ENABLED':'false','RATE_LIMIT_ENABLED':'false','WEB_SERVER_ENABLED':'true','WEB_SERVER_PORT':str(port),'WEB_SERVER_HOST':'127.0.0.1','WEB_SERVER_INCLUDE_STACK_IN_ERRORS':'false','CLI_INCLUDE_STACK_IN_ERRORS':'false','LOG_LEVEL':'fatal','MCP_SERVER_ENABLED':str(mcp).lower(),'MCP_AUTH_MODE':'optional'}
 cwd=lab/'keryx/example/backend' if project=='keryx' else lab/'next-bun-compile/examples/sharp'
 if project=='next':
  binary=lab/'next-final'/mode;argv=[str(binary)];env['NBC_RUNTIME_DIR']=str(out/'runtime'/mode)
 else:
  binary=lab/'compiler/bun-darwin-aarch64/bun' if mode=='source' else lab/'keryx-normalized/native';argv=[str(binary),'keryx.ts','start'] if mode=='source' else [str(binary),'start']
 with (out/'private'/f'{label}.log').open('wb') as log:
  start=time.perf_counter();p=subprocess.Popen(argv,cwd=cwd,env=env,stdout=log,stderr=log,start_new_session=True)
  try:
   path='/' if project=='next' else '/api/greeting/prompt?name=Goga'
   while True:
    assert p.poll() is None,('startup exited',p.returncode,label)
    try:
     code,_,b=request(port,path)
     if code==200:
      if project=='keryx':exact(json.loads(b),hello('Goga'))
      else:assert b==(lab/'next-bun-compile/examples/sharp/.next/server/app/index.html').read_bytes()
      break
    except (OSError,http.client.HTTPException):pass
    assert time.perf_counter()-start<30,('readiness timeout',label)
    time.sleep(.002)
   ready_ms=(time.perf_counter()-start)*1000
   assert not helper.child_pids(p.pid),'parent-only accounting would be incomplete'
   yield {'pid':p.pid,'port':port,'ready_ms':ready_ms,'ready_memory':metrics.read(p.pid),'binary_sha256':sha(binary)}
  finally:
   if p.poll() is None:os.killpg(p.pid,signal.SIGTERM)
   try:p.wait(timeout=4)
   except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGKILL);p.wait()

def main():
 a=argparse.ArgumentParser();a.add_argument('--lab',type=Path,required=True);a.add_argument('--out',type=Path,required=True);a.add_argument('--project',choices=['keryx','next'],required=True);a.add_argument('--stage',choices=['verify','startup','load'],required=True);a.add_argument('--runs',type=int,default=6);x=a.parse_args()
 assert not x.out.exists(),'use a fresh output directory';x.out.mkdir(parents=True);(x.out/'private').mkdir(mode=0o700)
 metrics=helper.Metrics();modes=['source','native'] if x.project=='keryx' else ['jit','native-disk']
 client=x.out/'private/http-load';subprocess.run(['cc','-O2','-Wall','-Wextra','-pthread',str(TOOL.with_name('http-load.c')),'-o',str(client)],check=True)
 data={'metadata':{'observed_at':datetime.now(timezone.utc).isoformat(),'project':x.project,'stage':x.stage,'runs':x.runs,'runner_sha256':sha(__file__),'helper_sha256':sha(TOOL),'client_source_sha256':sha(TOOL.with_name('http-load.c')),'compiler_sha256':sha(x.lab/'compiler/bun-darwin-aarch64/bun'),'cpu_seconds_per_tick':metrics.cpu_seconds_per_tick,'system':os.uname().sysname,'machine':os.uname().machine,'cpu_count':os.cpu_count(),'connections':8,'warmup_seconds':2,'measured_seconds':5,'memory_metric':metrics.memory_metric},'rows':[]}
 def save():(x.out/'observations.json').write_text(json.dumps(data,indent=2)+'\n')
 save()
 if x.project=='next' and x.stage!='verify':
  data['preextraction']=[]
  for mode in modes:
   runtime=x.out/'runtime'/mode;runtime.mkdir(parents=True)
   with (x.out/'private'/f'extract-{mode}.log').open('wb') as log:
    r=subprocess.run([str(x.lab/'next-final'/mode),'--extract'],env={**os.environ,'NBC_RUNTIME_DIR':str(runtime),'NEXT_TELEMETRY_DISABLED':'1'},stdout=log,stderr=subprocess.STDOUT,timeout=30)
   assert r.returncode==0,('preextraction failed',mode)
   files=[p for p in runtime.rglob('*') if p.is_file() and not p.is_symlink()]
   data['preextraction'].append({'mode':mode,'regular_files':len(files),'regular_file_bytes':sum(p.stat().st_size for p in files)})
  save()
 for block in range(x.runs):
  order=modes if block%2==0 else list(reversed(modes))
  for mode in order:
   row={'mode':mode,'block':block};data['rows'].append(row)
   try:
    with server(x.project,mode,x.lab,x.out,f'{mode}-{block}',metrics) as s:
     row.update({k:v for k,v in s.items() if k not in ('pid','port')});checks,cases=check(x.project,s['port'],x.lab);row['checks']=checks
     if x.stage=='load':
      row['routes']=[]
      for c,b in cases if block%2==0 else list(reversed(cases)):
       helper.load(client,s,c,b,2,8,metrics)
       result=helper.load(client,s,c,b,5,8,metrics);row['routes'].append({'name':c['name'],**result})
     row['accepted']=True
   except Exception as error:row['error']=str(error);row['accepted']=False
   save();print(x.project,x.stage,mode,block+1,'passed' if row['accepted'] else row['error'],flush=True)
 assert len(data['rows'])==2*x.runs and all(r['accepted'] for r in data['rows']),'incomplete comparison; inspect retained observations/logs'
if __name__=='__main__':main()
