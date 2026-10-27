import hashlib,http.client,json,os,pathlib,platform,statistics,subprocess,threading,time
root=pathlib.Path(__file__).resolve().parent

def rss(pid):return int(subprocess.check_output(['ps','-o','rss=','-p',str(pid)],text=True))*1024

def get(port,path):
 c=http.client.HTTPConnection('127.0.0.1',port,timeout=10);c.request('GET',path);r=c.getresponse();b=r.read();c.close();assert r.status==200;return b

def load(port,count,expected):
 p=subprocess.run([str(root/'http-load'),str(port),'8',str(count),'/walk',expected],text=True,capture_output=True)
 if p.returncode:raise RuntimeError((p.returncode,p.stdout,p.stderr))
 return json.loads(p.stdout)
rows=[]
for repeat in range(5):
 for mode in (['jit','aot'] if repeat%2==0 else ['aot','jit']):
  start=time.perf_counter();p=subprocess.Popen([str(root/f'server-{mode}')],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=dict(os.environ,RETAIN='100000',PORT='0',NODE_ENV='production'))
  samples=[];stop=threading.Event()
  try:
   line=p.stdout.readline()
   if not line:raise RuntimeError(p.stderr.read())
   ready=json.loads(line);port=ready['port'];state=json.loads(get(port,'/state'));assert state=={'count':100000,'first':0,'last':99999}
   first_ms=(time.perf_counter()-start)*1000
   expected=get(port,'/walk').decode()
   assert json.loads(expected)['total']>0
   def sample():
    while not stop.is_set():
     samples.append(dict(seconds=time.perf_counter()-start,rss_bytes=rss(p.pid)))
     stop.wait(.2)
   thread=threading.Thread(target=sample);thread.start()
   warm=load(port,20000,expected)
   measured=[load(port,1000000,expected) for _ in range(2)]
   time.sleep(1)
   stop.set();thread.join()
   row=dict(mode=mode,repeat=repeat,first_response_ms=first_ms,warm=warm,measured=measured,memory=samples,response_sha256=hashlib.sha256(expected.encode()).hexdigest())
   rows.append(row);(root/'server-throughput-results.json').write_text(json.dumps(dict(platform=platform.platform(),rows=rows),indent=2))
   print(mode,repeat,first_ms,[round(x['rps']) for x in measured],len(samples),flush=True)
  finally:
   stop.set();p.terminate();p.wait(timeout=5)
print('DONE',flush=True)
