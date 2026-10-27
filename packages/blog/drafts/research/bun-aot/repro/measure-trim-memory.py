import concurrent.futures, hashlib, http.client, json, os, pathlib, platform, statistics, subprocess, time
ROOT=pathlib.Path(__file__).resolve().parent
BUN=ROOT/'bun-darwin-aarch64/bun'

def rss(pid):
    return int(subprocess.check_output(['ps','-o','rss=','-p',str(pid)],text=True).strip())*1024

def get(port,path):
    conn=http.client.HTTPConnection('127.0.0.1',port,timeout=10)
    conn.request('GET',path)
    r=conn.getresponse(); body=r.read(); conn.close()
    if r.status!=200: raise RuntimeError((r.status,body))
    return body

def load(port,path,count,expected):
    def worker(total):
        conn=http.client.HTTPConnection('127.0.0.1',port,timeout=10)
        for _ in range(total):
            conn.request('GET',path)
            r=conn.getresponse();body=r.read()
            if r.status!=200 or body!=expected:raise RuntimeError((r.status,body,expected))
        conn.close()
    start=time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(worker,[count//8]*8))
    return time.perf_counter()-start

rows=[]
for count in [100000]:
  for repeat in range(5):
    modes=['aot','aot-trim']
    if repeat%2:modes.reverse()
    for mode in modes:
      started=time.perf_counter()
      proc=subprocess.Popen([str(ROOT/f'server-{mode}')],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=dict(os.environ,RETAIN=str(count),PORT='0',NODE_ENV='production'))
      try:
        line=proc.stdout.readline()
        if not line: raise RuntimeError(proc.stderr.read())
        ready=json.loads(line);port=ready['port']
        state=json.loads(get(port,'/state'))
        assert state==({'count':count,'first':0,'last':count-1} if count else {'count':0})
        first=time.perf_counter()-started
        ready_rss=rss(proc.pid)
        samples=[]
        # This is a memory/behavior experiment. Python's client limits throughput;
        # request time is recorded for audit, not used as a server-speed benchmark.
        expected=get(port,'/walk')
        for phase in range(3):
          seconds=load(port,'/walk',800,expected)
          samples.append(dict(phase=phase,seconds=seconds,rss_bytes=rss(proc.pid)))
        released=json.loads(get(port,'/release'));assert released=={'count':0}
        time.sleep(.15)
        row=dict(mode=mode,count=count,repeat=repeat,first_response_ms=first*1000,ready_rss_bytes=ready_rss,samples=samples,released_rss_bytes=rss(proc.pid),response_sha256=hashlib.sha256(expected).hexdigest())
        rows.append(row)
        (ROOT/'trim-memory-results.json').write_text(json.dumps(dict(platform=platform.platform(),rows=rows),indent=2))
        print(mode,count,repeat,round(first*1000,2),ready_rss,flush=True)
      finally:
        proc.terminate();proc.wait(timeout=5)
print('DONE',len(rows),flush=True)
