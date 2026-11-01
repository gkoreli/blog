#!/usr/bin/env python3
"""Check outputs, then compare Bun executable startup, hot HTTP work and memory."""
import argparse, ctypes, hashlib, http.client, json, os, platform, re, signal, socket, statistics, subprocess, sys, tempfile, threading, time
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

VERSION='0.1.0'
class CheckError(Exception): pass

def require(condition,message):
 if not condition:raise CheckError(message)

def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def describe(values):return {'n':len(values),'median':statistics.median(values),'min':min(values),'max':max(values)}

class Metrics:
 """Parent-process accounting. macOS physical footprint and Linux RSS stay distinct."""
 def __init__(self):
  self.system=platform.system()
  require(self.system in ('Darwin','Linux'),'Supported hosts: macOS and Linux')
  if self.system=='Darwin':
   self.lib=ctypes.CDLL('/usr/lib/libproc.dylib');self.lib.proc_pid_rusage.argtypes=[ctypes.c_int,ctypes.c_int,ctypes.c_void_p];self.lib.proc_pid_rusage.restype=ctypes.c_int
   class Timebase(ctypes.Structure):_fields_=[('numer',ctypes.c_uint32),('denom',ctypes.c_uint32)]
   t=Timebase();system=ctypes.CDLL('/usr/lib/libSystem.B.dylib');system.mach_timebase_info.argtypes=[ctypes.POINTER(Timebase)];system.mach_timebase_info.restype=ctypes.c_int;require(system.mach_timebase_info(ctypes.byref(t))==0 and t.denom>0,'Cannot read CPU clock')
   self.cpu_seconds_per_tick=t.numer/t.denom/1e9;self.memory_metric='physical_footprint_bytes'
  else:self.cpu_seconds_per_tick=1/os.sysconf('SC_CLK_TCK');self.memory_metric='rss_bytes'
 def read(self,pid):
  if self.system=='Darwin':
   buf=ctypes.create_string_buffer(4096);require(self.lib.proc_pid_rusage(pid,4,buf)==0,'Server exited or process accounting unavailable')
   v=(ctypes.c_uint64*35).from_buffer(buf,16)
   return {'cpu_seconds':(v[0]+v[1])*self.cpu_seconds_per_tick,'rss_bytes':v[6],'physical_footprint_bytes':v[7],'lifetime_peak_physical_bytes':v[28]}
  try:
   fields=Path(f'/proc/{pid}/stat').read_text().rsplit(')',1)[1].split()
   status=dict(line.split(':',1) for line in Path(f'/proc/{pid}/status').read_text().splitlines() if ':' in line)
   return {'cpu_seconds':(int(fields[11])+int(fields[12]))*self.cpu_seconds_per_tick,'rss_bytes':int(status['VmRSS'].split()[0])*1024,'lifetime_peak_rss_bytes':int(status['VmHWM'].split()[0])*1024}
  except (OSError,KeyError,ValueError) as error:raise CheckError('Server exited or /proc accounting unavailable') from error

def child_pids(parent):
 pairs=[]
 for line in subprocess.check_output(['ps','-A','-o','pid=,ppid='],text=True).splitlines():
  pid,ppid=line.split();pairs.append((int(pid),int(ppid)))
 owned={parent}
 while True:
  more=owned|{pid for pid,ppid in pairs if ppid in owned}
  if more==owned:return sorted(owned-{parent})
  owned=more

def case(raw,index):
 require(isinstance(raw,dict),f'Case {index}: expected an object')
 unknown=set(raw)-{'name','method','path','expected_status','expected_json','expected_text','headers','json','body','measure'}
 require(not unknown,f'Case {index}: unknown options {sorted(unknown)}')
 name=raw.get('name',f'case-{index}');method=raw.get('method','GET');path=raw.get('path')
 require(isinstance(name,str) and re.fullmatch(r'[a-zA-Z0-9_-]+',name),f'Case {index}: use a simple unique name')
 require(method in ('GET','POST','PUT','PATCH','DELETE','OPTIONS'),f'{name}: unsupported method')
 require(isinstance(path,str) and path.startswith('/') and not any(ord(c)<33 or ord(c)>126 for c in path),f'{name}: use an encoded HTTP path beginning with /')
 status=raw.get('expected_status',200);require(type(status) is int and 100<=status<=599,f'{name}: invalid expected_status')
 require(('expected_json' in raw)!=('expected_text' in raw),f'{name}: provide exactly one of expected_json / expected_text')
 if 'expected_text' in raw:require(isinstance(raw['expected_text'],str),f'{name}: expected_text must be a string')
 heads=raw.get('headers',{});require(isinstance(heads,dict),f'{name}: headers must be an object')
 for k,v in heads.items():
  require(isinstance(k,str) and re.fullmatch(r'[A-Za-z0-9-]+',k) and isinstance(v,str) and '\r' not in v and '\n' not in v,f'{name}: invalid header')
  require(k.lower() not in ('host','connection','content-length','transfer-encoding'),f'{name}: the tool supplies framing headers')
 require(type(raw.get('measure',True)) is bool,f'{name}: measure must be true or false')
 require(not ('json' in raw and 'body' in raw),f'{name}: provide json or body, not both')
 if 'json' in raw:
  body=json.dumps(raw['json'],separators=(',',':'),ensure_ascii=False).encode();heads={**heads,'Content-Type':'application/json'}
 else:
  body=raw.get('body','');require(isinstance(body,str),f'{name}: body must be text');body=body.encode()
 require(b'\0' not in body,f'{name}: binary request bodies are unsupported')
 return {**raw,'name':name,'method':method,'path':path,'expected_status':status,'headers':heads,'body_bytes':body,'measure':raw.get('measure',True)}

def request(port,c):
 conn=http.client.HTTPConnection('127.0.0.1',port,timeout=2)
 try:
  conn.request(c['method'],c['path'],body=c['body_bytes'] or None,headers=c['headers']);r=conn.getresponse();body=r.read(120001)
  require(len(body)<120000,f"{c['name']}: response exceeds the client's supported fixed-body size")
  require(r.status==c['expected_status'],f"{c['name']}: expected HTTP {c['expected_status']}, got {r.status}")
  if 'expected_json' in c:
   try:value=json.loads(body)
   except (ValueError,UnicodeError) as error:raise CheckError(f"{c['name']}: response is not JSON") from error
   require(json.dumps(value,sort_keys=True,separators=(',',':'),allow_nan=False)==json.dumps(c['expected_json'],sort_keys=True,separators=(',',':'),allow_nan=False),f"{c['name']}: JSON differs from the expected result")
  else:require(body==c['expected_text'].encode(),f"{c['name']}: text differs from the expected result")
  return body
 finally:conn.close()

@contextmanager
def server(binary,project,ready,metrics,log,timeout,requested_port):
 with socket.socket() as sock:sock.bind(('127.0.0.1',requested_port));port=sock.getsockname()[1]
 with log.open('wb') as output:
  started=time.perf_counter();proc=subprocess.Popen([str(binary)],cwd=project,env={**os.environ,'NODE_ENV':'production','PORT':str(port)},stdout=output,stderr=output,start_new_session=True)
  try:
   last='server did not accept a connection'
   while True:
    require(proc.poll() is None,f'Server exited at startup; see {log}')
    try:request(port,ready);break
    except (OSError,http.client.HTTPException,CheckError) as error:
     last=str(error)
     if time.perf_counter()-started>timeout:raise CheckError(f'Readiness failed: {last}; see {log}') from error
     time.sleep(.001)
   ready_ms=(time.perf_counter()-started)*1000
   require(not child_pids(proc.pid),'Child processes detected; this tool measures a single server process')
   yield {'pid':proc.pid,'port':port,'ready_ms':ready_ms,'ready_memory':metrics.read(proc.pid)}
   require(not child_pids(proc.pid),'Child processes detected; parent-only metrics would be incomplete')
  finally:
   try:os.killpg(proc.pid,signal.SIGTERM)
   except ProcessLookupError:pass
   try:proc.wait(timeout=3)
   except subprocess.TimeoutExpired:
    try:os.killpg(proc.pid,signal.SIGKILL)
    except ProcessLookupError:pass
    proc.wait(timeout=3)

def load(client,s,c,body,seconds,connections,metrics):
 with tempfile.TemporaryDirectory(prefix='bun-aot-check-') as folder:
  tmp=Path(folder);expected=tmp/'expected';expected.write_bytes(body)
  lines=[f"{c['method']} {c['path']} HTTP/1.1",'Host: 127.0.0.1','Connection: keep-alive']+[f'{k}: {v}' for k,v in c['headers'].items()]
  if c['body_bytes']:lines.append(f"Content-Length: {len(c['body_bytes'])}")
  req=tmp/'request';req.write_bytes(('\r\n'.join(lines)+'\r\n\r\n').encode()+c['body_bytes']);result=tmp/'result.json'
  before=metrics.read(s['pid']);samples=[];sampling_errors=[];stop=threading.Event();started=time.perf_counter()
  def sample():
   while not stop.is_set():
    try:samples.append({'seconds':time.perf_counter()-started,**metrics.read(s['pid'])})
    except CheckError as error:sampling_errors.append(str(error));return
    stop.wait(.2)
  thread=threading.Thread(target=sample);thread.start()
  try:r=subprocess.run([str(client),str(s['port']),str(connections),str(seconds),str(req),str(expected),str(c['expected_status']),str(result)],capture_output=True,timeout=seconds+15)
  finally:stop.set();thread.join()
  require(not sampling_errors,'Server process accounting failed during load')
  require(r.returncode==0,'HTTP load failed: response changed, connection failed, or unsupported framing (requires Content-Length)')
  value=json.loads(result.read_text());require(value['requests']>0 and value['failures']==0,'No valid requests or response failures during load')
  require(value['requests']==sum(n for _,n in value['histogram_upper_us']),'Client request / latency counts disagree')
  after=metrics.read(s['pid']);cpu=max(0,after['cpu_seconds']-before['cpu_seconds'])
  value.update(before=before,after=after,memory_samples=samples,cpu_percent=cpu/value['seconds']*100,cpu_seconds_per_million=cpu/value['requests']*1e6,response_sha256=hashlib.sha256(body).hexdigest(),load_average=os.getloadavg())
  for q in [.5,.95,.99]:
   count=0
   for upper,n in value['histogram_upper_us']:
    count+=n
    if count>=value['requests']*q:value[f'p{int(q*100)}_upper_us']=upper;break
  return value

def summarize(data):
 metric=data['metadata']['memory_metric'];groups=[]
 for build in data['builds']:
  mode=build['mode'];rows=[x for x in data['observations'] if x['mode']==mode and x.get('status')=='passed']
  group={'mode':mode,'file_bytes':build.get('bytes'),'accepted_runs':len(rows),'expected_runs':data['metadata']['runs'],'build_status':build['status'],'errors':[x['error'] for x in data['observations'] if x['mode']==mode and 'error' in x],'routes':[]}
  first=next((v for v in data.get('preflight',[]) if v['mode']==mode and v['status']=='passed'),None)
  group['first_checked_launch_ms']=first['startup_ms'] if first else None
  if rows:
   group['startup_ms']=describe([x['startup_ms'] for x in rows]);group['ready_memory_bytes']=describe([x['ready_memory'][metric] for x in rows])
   for name in [c['name'] for c in data['cases'] if c['measure']]:
    routes=[v for x in rows for v in x['routes'] if v['name']==name]
    group['routes'].append({'name':name,'rps':describe([v['rps'] for v in routes]),'end_memory_bytes':describe([v['after'][metric] for v in routes]),'sampled_peak_memory_bytes':describe([max([v['before'][metric],v['after'][metric]]+[m[metric] for m in v['memory_samples']]) for v in routes]),'cpu_percent':describe([v['cpu_percent'] for v in routes]),'cpu_seconds_per_million':describe([v['cpu_seconds_per_million'] for v in routes]),'p99_upper_us':describe([v['p99_upper_us'] for v in routes]),'checked_requests':sum(v['requests'] for v in routes)})
  groups.append(group)
 return {'complete':all(g['build_status']=='passed' and g['accepted_runs']==g['expected_runs'] and not g['errors'] for g in groups),'memory_metric':metric,'groups':groups,'limits':data['metadata']['limits']}

def write_report(data,summary,out):
 lines=['# Bun executable comparison','',f"Completed: {'yes' if summary['complete'] else 'no — inspect failed builds/checks'}",'',f"{data['metadata']['runs']} runs per build; {data['metadata']['connections']} connections; {data['metadata']['warmup_seconds']} s warmup and {data['metadata']['seconds']} s measured per route.",f"Memory: {summary['memory_metric']}, decimal MB. CPU cores are process CPU seconds / elapsed seconds; no CPU cap is imposed.",'', '| Build | File MB | Startup ms | Route | Requests/s median (min–max) | App MB | App CPU cores |','| --- | ---: | ---: | --- | ---: | ---: | ---: |']
 for g in summary['groups']:
  for r in g['routes']:
   lines.append(f"| {g['mode']} | {g['file_bytes']/1e6:.1f} | {g['startup_ms']['median']:.2f} | {r['name']} | {r['rps']['median']:,.0f} ({r['rps']['min']:,.0f}–{r['rps']['max']:,.0f}) | {r['end_memory_bytes']['median']/1e6:.1f} | {r['cpu_percent']['median']/100:.2f} |")
  if g['build_status']!='passed' or g['errors']:lines+=['',f"{g['mode']}: comparison incomplete; build {g['build_status']}; {g['accepted_runs']}/{g['expected_runs']} runs accepted.",*g['errors']]
 first_launches=', '.join(f"{g['mode']}: {g['first_checked_launch_ms']:.2f} ms" for g in summary['groups'] if g['first_checked_launch_ms'] is not None)
 lines+=['','First checked launch (separate from the repeated fresh-process starts in the table): '+first_launches+'. Fresh files may incur one-time OS work; the tool does not isolate its cause.','','## Conditions','',f"Host: {data['metadata']['system']} / {data['metadata']['machine']}.",f"Bun: {data['metadata'].get('bun_revision','prebuilt executables; see hashes in observations.json')}.",'','Outputs were checked for the selected cases. JSON expectations preserve types; every measured response matches the checked bytes. These checks do not certify the entire application.','',*['- '+x for x in summary['limits']],'','Raw observations, hashes, sample spread and per-route peaks are in observations.json / summary.json. Review reports before sharing; application/build logs stay in private/.']
 (out/'summary.md').write_text('\n'.join(lines)+'\n')

def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('--entry',type=Path,help='Build this entry as JIT, bytecode and native AOT')
 p.add_argument('--bun',type=Path,help='Bun binary with native --aot support; required with --entry')
 p.add_argument('--binary',action='append',default=[],metavar='NAME=PATH',help='Compare prebuilt executables instead of building an entry')
 p.add_argument('--project',type=Path,default=Path.cwd(),help='Working directory for the app/build')
 p.add_argument('--cases',type=Path,required=True,help='Readiness and fixed HTTP expectations, see example-cases.json')
 p.add_argument('--out',type=Path,default=Path('aot-results'))
 p.add_argument('--runs',type=int,default=6)
 p.add_argument('--seconds',type=float,default=5)
 p.add_argument('--warmup',type=float,default=2)
 p.add_argument('--connections',type=int,default=8)
 p.add_argument('--startup-timeout',type=float,default=10)
 p.add_argument('--port',type=int,default=0,help='Use this port for an app with a fixed port; fail if it is occupied')
 p.add_argument('--trim',action='store_true',help='Also build native AOT with --trim')
 a=p.parse_args();require(bool(a.entry)!=bool(a.binary),'Choose --entry or one or more --binary NAME=PATH values')
 require(1<=a.runs<=100 and 1<=a.seconds<=600 and 0<=a.warmup<=60 and 1<=a.connections<=128 and 1<=a.startup_timeout<=120,'Invalid run/duration/connection/timeout range')
 require(0<=a.port<=65535,'Port must be 0 (automatic) or 1..65535')
 project=a.project.resolve();require(project.is_dir(),'Project directory does not exist');out=a.out.resolve();require(not out.exists(),'Output folder already exists; choose a new --out to preserve earlier results');out.mkdir(parents=True)
 private=out/'private';private.mkdir(mode=0o700);metrics=Metrics();config=json.loads(a.cases.read_text());require(isinstance(config,dict),'Cases file must be an object');require(not set(config)-{'ready','cases'},'Cases file supports ready and cases only')
 ready=case(config.get('ready'),0);require(isinstance(config.get('cases'),list) and config['cases'],'Provide at least one case');cases=[case(c,i+1) for i,c in enumerate(config['cases'])]
 require(len({c['name'] for c in cases})==len(cases),'Case names must be unique');require(any(c['measure'] for c in cases),'At least one case must be measured')
 metadata={'tool_version':VERSION,'cases_sha256':sha(a.cases),'created_at':datetime.now(timezone.utc).isoformat(),'tool_sha256':sha(__file__),'client_source_sha256':sha(Path(__file__).with_name('http-load.c')),'system':platform.platform(),'machine':platform.machine(),'cpu_count':os.cpu_count(),'cpu_seconds_per_tick':metrics.cpu_seconds_per_tick,'memory_metric':metrics.memory_metric,'runs':a.runs,'seconds':a.seconds,'warmup_seconds':a.warmup,'connections':a.connections,'requested_port':a.port,'limits':['One local client and one server process; closed-loop HTTP/1.1 with fixed Content-Length responses under 120 KB.','macOS physical footprint and Linux RSS are different metrics. Server memory excludes external databases/services.','Readiness is the first expected ready response. One checked launch is recorded separately before repeated fresh-process starts; warm request speed excludes startup. Filesystem caches are not flushed.','Every measured response must match the checked reference bytes. Selected checks do not certify the whole application.','No CPU/RAM limit, independent arrival rate, remote load generator, production soak or cloud-cost claim.','Build flags are ESM JIT / ESM bytecode / native AOT; framework build plugins require a separately prepared entry or --binary.']}
 data={'metadata':metadata,'cases':[{'name':c['name'],'measure':c['measure'],'expected_status':c['expected_status']} for c in cases],'builds':[],'preflight':[],'observations':[]}
 client=private/'http-load';compile_result=subprocess.run(['cc','-O3','-D_GNU_SOURCE',str(Path(__file__).with_name('http-load.c')),'-pthread','-lm','-o',str(client)],capture_output=True,text=True)
 require(compile_result.returncode==0,'A C compiler is required; cc could not build the included local HTTP client')
 metadata['client_sha256']=sha(client)
 if a.entry:
  require(a.bun is not None and a.bun.resolve().is_file(),'--entry requires --bun /path/to/bun')
  bun=a.bun.resolve();entry=(project/a.entry).resolve();require(entry.is_file(),'Entry file does not exist');require(entry.is_relative_to(project),'Entry must be inside --project')
  metadata['bun_revision']=subprocess.check_output([str(bun),'--revision'],text=True).strip();metadata['entry_sha256']=sha(entry)
  modes=[('jit',[]),('bytecode',['--bytecode']),('aot',['--aot'])]+([('aot-trim',['--aot','--trim'])] if a.trim else [])
  for mode,flags in modes:
   binary=private/mode;command=[str(bun),'build',str(entry),'--compile','--format=esm',*flags,'--outfile',str(binary)];started=time.perf_counter()
   with (private/f'build-{mode}.log').open('wb') as log:r=subprocess.run(command,cwd=project,stdout=log,stderr=log)
   build={'mode':mode,'flags':['--compile','--format=esm',*flags],'status':'passed' if r.returncode==0 else 'build_failed','build_seconds':time.perf_counter()-started,'exit_code':r.returncode}
   if r.returncode==0:build.update(binary=str(binary),bytes=binary.stat().st_size,sha256=sha(binary))
   data['builds'].append(build)
 else:
  for pair in a.binary:
   require('=' in pair,'Use --binary NAME=PATH');mode,path=pair.split('=',1);binary=Path(path).resolve();require(re.fullmatch(r'[a-zA-Z0-9_-]+',mode) is not None and binary.is_file(),f'Invalid binary: {mode}')
   data['builds'].append({'mode':mode,'status':'passed','binary':str(binary),'bytes':binary.stat().st_size,'sha256':sha(binary)})
 require(len({b['mode'] for b in data['builds']})==len(data['builds']),'Binary names must be unique')
 references={};failed=set()
 def save():
  (out/'observations.json').write_text(json.dumps(data,indent=2)+'\n');summary=summarize(data);(out/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');write_report(data,summary,out);return summary
 save()
 for build in data['builds']:
  mode=build['mode']
  if build['status']!='passed':continue
  first={'mode':mode,'status':'running','stage':'first-checked-launch'}
  try:
   with server(Path(build['binary']),project,ready,metrics,private/f'{mode}-first.log',a.startup_timeout,a.port) as state:
    first.update(startup_ms=state['ready_ms'],ready_memory=state['ready_memory'])
    for c in cases:
     body=request(state['port'],c);require(body==references.setdefault(c['name'],body),f"{c['name']}: response bytes differ between builds; use fixed test data")
   first['status']='passed'
  except (CheckError,OSError,subprocess.SubprocessError,ValueError) as error:
   first.update(status='failed',error=str(error));failed.add(mode)
   data['observations'].append({'mode':mode,'block':None,'phase':'first-checked-launch','status':'failed','error':str(error),'routes':[]})
  data['preflight'].append(first);save();first_text=f"{first['startup_ms']:.2f} ms" if 'startup_ms' in first else 'not ready';print(mode,'first checked launch',first_text,first['status'],flush=True)
 for block in range(a.runs):
  builds=data['builds'];k=block%len(builds);order=builds[k:]+builds[:k]
  if (block//len(builds))%2:order=list(reversed(order))
  for position,build in enumerate(order):
   mode=build['mode']
   if mode in failed or build['status']!='passed':continue
   row={'block':block,'position':position,'mode':mode,'status':'running','routes':[],'observed_at':datetime.now(timezone.utc).isoformat()}
   try:
    with server(Path(build['binary']),project,ready,metrics,private/f'{mode}-{block}.log',a.startup_timeout,a.port) as s:
     row.update(startup_ms=s['ready_ms'],ready_memory=s['ready_memory'])
     for c in cases:
      row['phase']='checking:'+c['name']
      body=request(s['port'],c);require(body==references.setdefault(c['name'],body),f"{c['name']}: response bytes differ between builds; use fixed test data")
     selected=[c for c in cases if c['measure']];j=block%len(selected);selected=selected[j:]+selected[:j]
     for c in selected:
      body=request(s['port'],c)
      if a.warmup:
       row['phase']='warmup:'+c['name'];load(client,s,c,body,a.warmup,a.connections,metrics)
      row['phase']='measuring:'+c['name']
      row['routes'].append({'name':c['name'],**load(client,s,c,body,a.seconds,a.connections,metrics)})
    row['status']='passed';row['phase']='complete'
   except (CheckError,OSError,subprocess.SubprocessError,ValueError) as error:row.update(status='failed',error=str(error));failed.add(mode)
   data['observations'].append(row);save();print(mode,block+1,row['status'],row.get('error',''),flush=True)
 summary=save();print('\nmode         file MB   startup ms   route       requests/s   app MB   app CPU cores')
 for g in summary['groups']:
  if g['accepted_runs']:
   for r in g['routes']:print(f"{g['mode']:<10} {g['file_bytes']/1e6:>7.1f}   {g['startup_ms']['median']:>10.2f}   {r['name']:<11} {r['rps']['median']:>10,.0f}   {r['end_memory_bytes']['median']/1e6:>6.1f}   {r['cpu_percent']['median']/100:>6.2f}")
  if g['build_status']!='passed' or g['errors'] or g['accepted_runs']!=g['expected_runs']:print(g['mode'],'INCOMPLETE; build:',g['build_status'],'accepted:',g['accepted_runs'],'/',g['expected_runs'],g['errors'])
 print('Startup in the table follows one separately recorded checked launch per build.')
 print('Memory:',summary['memory_metric'],'; decimal MB. File sizes and raw spread are in summary.json.')
 print('Complete comparison.' if summary['complete'] else 'INCOMPLETE: at least one build/check failed; do not claim an overall winner.')
 print('Saved:',out/'summary.md','and',out/'summary.json');return 0 if summary['complete'] else 1

if __name__=='__main__':
 try:sys.exit(main())
 except (CheckError,ValueError,OSError,subprocess.SubprocessError) as error:print('Cannot compare:',error,file=sys.stderr);sys.exit(2)
