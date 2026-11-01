#!/usr/bin/env python3
"""Compare real 1/2/4-process pools, with a fixed total of 32 connections."""
import argparse, ctypes, hashlib, http.client, json, os, platform, socket, subprocess, threading, time
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--root',type=Path,required=True)
p.add_argument('--out',type=Path,required=True)
p.add_argument('--blocks',type=int,default=4)
p.add_argument('--seconds',type=float,default=10)
p.add_argument('--warmup',type=float,default=3)
a=p.parse_args();root=a.root.resolve();out=a.out.resolve();out.mkdir(parents=True,exist_ok=True)
project=root/'sources/api/apps/elysia-api';bun=root/'compiler/bun-darwin-aarch64/bun'
variants={'jit':'api-wired-jit','bytecode':'api-wired-bytecode','native':'api-wired-native'}
env={**os.environ,'NODE_ENV':'production','DATABASE_URL':'postgres://postgres@127.0.0.1:55439/bench_saas','DB_DRIVER':'bunsql','JWT_SECRET':'bench-secret-do-not-use-in-prod'}
assert platform.system()=='Darwin','This research runner uses macOS process accounting'
builds=json.loads((Path(__file__).parent/'../validation-2026-10-31/results/server-builds.json').resolve().read_text())
byname={x['name']:x for x in builds}
for name in variants.values():assert hashlib.sha256((project/'builds'/name).read_bytes()).hexdigest()==byname[name]['sha256'],name
pgpid=int((root/'pgdata/postmaster.pid').read_text().splitlines()[0])
assert str(root/'postgres/bin/postgres') in subprocess.check_output(['ps','-p',str(pgpid),'-o','command='],text=True)
lib=ctypes.CDLL('/usr/lib/libproc.dylib');lib.proc_pid_rusage.argtypes=[ctypes.c_int,ctypes.c_int,ctypes.c_void_p];lib.proc_pid_rusage.restype=ctypes.c_int
class Timebase(ctypes.Structure):_fields_=[('numer',ctypes.c_uint32),('denom',ctypes.c_uint32)]
tb=Timebase();ctypes.CDLL('/usr/lib/libSystem.B.dylib').mach_timebase_info(ctypes.byref(tb));tick_seconds=tb.numer/tb.denom/1e9

def memory(pid):
 b=ctypes.create_string_buffer(4096)
 if lib.proc_pid_rusage(pid,4,b):return None
 v=(ctypes.c_uint64*35).from_buffer(b,16)
 return {'user_ticks':v[0],'system_ticks':v[1],'rss_bytes':v[6],'physical_bytes':v[7],'lifetime_peak_physical_bytes':v[28]}

def process_snapshot():
 rows=[]
 for line in subprocess.check_output(['ps','-A','-o','pid=,ppid=,time='],text=True).splitlines():
  pid,parent,clock=line.split();parts=clock.split(':');seconds=sum(float(v)*60**i for i,v in enumerate(reversed(parts)))
  rows.append((int(pid),int(parent),seconds))
 return rows

def tree(parent,snapshot):
 ids={parent}
 while True:
  extended=ids|{pid for pid,ppid,_ in snapshot if ppid in ids}
  if extended==ids:return ids
  ids=extended

def request(port,method,path,body=None,headers=None):
 c=http.client.HTTPConnection('127.0.0.1',port,timeout=5)
 try:
  c.request(method,path,body=body,headers=headers or {});r=c.getresponse();return r.status,r.read()
 finally:c.close()

token=subprocess.check_output([str(bun),'-e','import {SignJWT} from "jose"; console.log(await new SignJWT({}).setProtectedHeader({alg:"HS256"}).setSubject("4242").setIssuedAt(0).sign(new TextEncoder().encode("bench-secret-do-not-use-in-prod")))'],cwd=project,text=True).strip()
cases=[{'name':'echo','method':'POST','path':'/echo','body':'{"name":"Jane Doe","email":"jane@example.com","age":30,"tags":["a","b"]}','headers':{'content-type':'application/json'}},{'name':'me','method':'GET','path':'/me','body':None,'headers':{'authorization':'Bearer '+token}}]
references={}

@contextmanager
def pool(mode,n,label):
 processes=[];logs=[];servers=[];reserved=[]
 try:
  # Keep reservations until all ports are selected; release immediately before spawn.
  for i in range(n):
   s=socket.socket();s.bind(('127.0.0.1',0));reserved.append(s)
  ports=[s.getsockname()[1] for s in reserved]
  started=time.perf_counter()
  for i,port in enumerate(ports):
   reserved[i].close();log=open(out/f'{label}-worker{i}.log','ab');logs.append(log)
   proc=subprocess.Popen([str(project/'builds'/variants[mode])],cwd=project,env={**env,'PORT':str(port)},stdout=log,stderr=log);processes.append(proc)
   servers.append({'pid':proc.pid,'port':port})
  for server,proc in zip(servers,processes):
   deadline=time.perf_counter()+15
   while True:
    if proc.poll() is not None:raise RuntimeError(f'{mode} worker exited {proc.returncode}')
    try:
     assert request(server['port'],'GET','/health')==(200,b'{"status":"ok"}');break
    except (ConnectionError,OSError):
     if time.perf_counter()>deadline:raise TimeoutError(mode)
     time.sleep(.002)
  ready_ms=(time.perf_counter()-started)*1000
  for server in servers:
   for case in cases:
    status,body=request(server['port'],case['method'],case['path'],case['body'],case['headers']);assert status==200,(mode,case['name'],status)
    value=json.loads(body)
    if case['name']=='echo':assert value==json.loads(case['body'])
    else:assert value['id']==4242 and value['name']=='User 4242' and value['email']=='user4242@example.com'
    assert body==references.setdefault(case['name'],body),(mode,case['name'],'changed body')
  yield servers,ready_ms
 finally:
  for proc in processes:
   if proc.poll() is None:proc.terminate()
  for proc in processes:
   try:proc.wait(timeout=5)
   except subprocess.TimeoutExpired:proc.kill();proc.wait()
  for log in logs:log.close()
  for s in reserved:s.close()

def load(servers,case,seconds,label):
 n=len(servers);clients=[];samples=[];stop=threading.Event();expected=out/f'{label}.expected';expected.write_bytes(references[case['name']]);files=[]
 before_ps=process_snapshot();dbids=tree(pgpid,before_ps);appids={x['pid'] for x in servers}
 before_app={pid:memory(pid) for pid in appids};before_db={pid:memory(pid) for pid in dbids}
 def sample():
  while not stop.is_set():
   samples.append({'seconds':time.perf_counter()-started,'app':{str(pid):memory(pid) for pid in appids},'database':{str(pid):memory(pid) for pid in dbids}});stop.wait(.25)
 started=time.perf_counter();thread=threading.Thread(target=sample);thread.start();launch_times=[]
 try:
  for i,s in enumerate(servers):
   lines=[f"{case['method']} {case['path']} HTTP/1.1",'Host: 127.0.0.1','Connection: keep-alive']+[f'{k}: {v}' for k,v in case['headers'].items()]
   body=(case['body'] or '').encode()
   if case['body'] is not None:lines.append(f'Content-Length: {len(body)}')
   req=out/f'{label}-worker{i}.request';req.write_bytes(('\r\n'.join(lines)+'\r\n\r\n').encode()+body)
   result=out/f'{label}-worker{i}.json';files.append(result)
   clients.append(subprocess.Popen([str(root/'http-load'),str(s['port']),str(32//n),str(seconds),str(req),str(expected),'200',str(result)],stdout=subprocess.PIPE,stderr=subprocess.PIPE));launch_times.append(time.perf_counter()-started)
  for proc in clients:
   stdout,stderr=proc.communicate(timeout=seconds+20)
   if proc.returncode:raise RuntimeError(f'client failed {proc.returncode}: {stderr.decode()[:200]}')
  elapsed=time.perf_counter()-started
 finally:
  stop.set();thread.join()
  for proc in clients:
   if proc.poll() is None:proc.terminate();proc.wait(timeout=5)
 after_app={pid:memory(pid) for pid in appids};after_ps=process_snapshot();after_dbids=tree(pgpid,after_ps);after_db={pid:memory(pid) for pid in after_dbids}
 values=[json.loads(f.read_text()) for f in files]
 for v in values:assert v['failures']==0 and v['requests']>0 and v['requests']==sum(x[1] for x in v['histogram_upper_us'])
 def delta(before,after):return sum(max(0,(v['user_ticks']+v['system_ticks'])-((before.get(pid) or {}).get('user_ticks',0)+(before.get(pid) or {}).get('system_ticks',0))) for pid,v in after.items() if v)*tick_seconds
 owned=tree(os.getpid(),after_ps)|after_dbids;before_foreign={pid:t for pid,_,t in before_ps if pid not in owned};after_foreign={pid:t for pid,_,t in after_ps if pid not in owned}
 foreign=sum(max(0,after_foreign[pid]-t) for pid,t in before_foreign.items() if pid in after_foreign)
 total=sum(v['requests'] for v in values)
 return {'requests':total,'seconds':elapsed,'rps':total/elapsed,'failures':sum(v['failures'] for v in values),'client_launch_span_ms':(max(launch_times)-min(launch_times))*1000,'clients':values,'memory_samples':samples,'app_before':before_app,'app_after':after_app,'database_before':before_db,'database_after':after_db,'database_pids_added_during_measurement':sorted(after_dbids-dbids),'app_cpu_percent':delta(before_app,after_app)/elapsed*100,'database_cpu_percent':delta(before_db,after_db)/elapsed*100,'foreign_persistent_cpu_percent':foreign/elapsed*100,'load_average':os.getloadavg()}

metadata={'started_at':datetime.now(timezone.utc).isoformat(),'runner_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'client_sha256':hashlib.sha256((root/'http-load').read_bytes()).hexdigest(),'binaries':{m:byname[n] for m,n in variants.items()},'host':{'machine':platform.machine(),'system':platform.platform(),'cpu_count':os.cpu_count()},'cpu_nanoseconds_per_tick':{'numer':tb.numer,'denom':tb.denom},'total_connections':32,'per_process_db_pool_limit':10,'warmup_seconds':a.warmup,'measured_seconds':a.seconds,'blocks':a.blocks}
rows=[]
base=[('jit',1),('bytecode',2),('native',4),('bytecode',1),('native',2),('jit',4),('native',1),('jit',2),('bytecode',4)]
for block in range(a.blocks):
 offset=block*2%len(base);order=base[offset:]+base[:offset]
 if block%2:order=list(reversed(order))
 for position,(mode,n) in enumerate(order):
  label=f'b{block}-{position}-{mode}-n{n}';row={'block':block,'position':position,'mode':mode,'workers':n,'observed_at':datetime.now(timezone.utc).isoformat(),'routes':[]}
  try:
   with pool(mode,n,label) as (servers,ready_ms):
    row['all_ready_ms']=ready_ms
    for case in (cases if block%2==0 else list(reversed(cases))):
     load(servers,case,a.warmup,label+'-'+case['name']+'-warm')
     row['routes'].append({'name':case['name'],**load(servers,case,a.seconds,label+'-'+case['name']+'-measure')})
  except Exception as e:
   row['error']=f'{type(e).__name__}: {e}';rows.append(row);(out/'observations.json').write_text(json.dumps({'metadata':metadata,'rows':rows},indent=2)+'\n');raise
  rows.append(row);(out/'observations.json').write_text(json.dumps({'metadata':metadata,'rows':rows},indent=2)+'\n')
  print(block+1,position+1,mode,n,[(x['name'],round(x['rps']),round(x['app_cpu_percent'])) for x in row['routes']],flush=True)
print('DONE',len(rows),flush=True)
