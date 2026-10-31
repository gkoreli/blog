#!/usr/bin/env python3
"""Parity, cold-start, warmed HTTP and soak trials of pinned upstream apps."""
import argparse, ctypes, hashlib, http.client, json, os, select, socket, statistics, subprocess, threading, time, traceback
from contextlib import contextmanager
from pathlib import Path
from datetime import datetime, timezone

p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--root',type=Path,required=True)
p.add_argument('--suite',choices=['framework','api'],required=True)
p.add_argument('--stage',choices=['verify','startup','load','soak','noise'],required=True)
p.add_argument('--out',type=Path,required=True)
p.add_argument('--runs',type=int,default=8)
p.add_argument('--seconds',type=float,default=10)
p.add_argument('--concurrency',type=int,default=8)
p.add_argument('--only',default='')
args=p.parse_args();root=args.root.resolve();out=args.out.resolve();out.mkdir(parents=True,exist_ok=True)
metadata=dict(started_at=datetime.now(timezone.utc).isoformat(),runner_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),client_sha256=hashlib.sha256((root/'http-load').read_bytes()).hexdigest())
project=root/('framework' if args.suite=='framework' else 'sources/api/apps/elysia-api')
env={**os.environ,'NODE_ENV':'production','DATABASE_URL':'postgres://postgres@127.0.0.1:55439/bench_saas','DB_DRIVER':'bunsql'}
variants=(['elysia-jit','elysia-native','elysia-plugin-jit','elysia-plugin-native','hono-jit','hono-native'] if args.suite=='framework' else ['api-wired-jit','api-wired-native','api-plugin-jit','api-plugin-native'])
if args.suite=='api' and args.stage=='verify': variants.insert(0,'api-source')
if args.only: variants=[v for v in variants if v in args.only.split(',')]
assert variants
bun=root/'compiler/bun-darwin-aarch64/bun'
token=''
if args.suite=='api':
    token=subprocess.check_output([str(bun),'-e','import {SignJWT} from "jose"; console.log(await new SignJWT({}).setProtectedHeader({alg:"HS256"}).setSubject("4242").setIssuedAt(0).sign(new TextEncoder().encode("bench-secret-do-not-use-in-prod")))'],cwd=project,text=True).strip()

def request(port,method,path,body=None,headers=None):
    c=http.client.HTTPConnection('127.0.0.1',port,timeout=10)
    try:
        c.request(method,path,body=body,headers=headers or {})
        r=c.getresponse();data=r.read()
        return dict(status=r.status,body=data,headers=dict(r.getheaders()))
    finally: c.close()

# The v4 struct begins with a 16-byte UUID and uint64 fields. Read the exact
# SDK field order; overallocate to avoid a future larger struct overrunning it.
libproc=ctypes.CDLL('/usr/lib/libproc.dylib')
libproc.proc_pid_rusage.argtypes=[ctypes.c_int,ctypes.c_int,ctypes.c_void_p]
libproc.proc_pid_rusage.restype=ctypes.c_int
def memory(pid):
    buf=ctypes.create_string_buffer(4096)
    if libproc.proc_pid_rusage(pid,4,buf)!=0:return None
    values=(ctypes.c_uint64*35).from_buffer(buf,16)
    return dict(user_ns=values[0],system_ns=values[1],rss_bytes=values[6],physical_bytes=values[7],lifetime_peak_physical_bytes=values[28])

def foreign_snapshot(server_pid):
    result=subprocess.run(['ps','-A','-o','pid=,ppid=,time=,comm='],capture_output=True,text=True)
    if result.returncode:return None
    records=[]
    for line in result.stdout.splitlines():
        parts=line.strip().split(None,3)
        if len(parts)!=4:continue
        pid,parent,clock,command=parts
        records.append((int(pid),int(parent),clock,command))
    owned={server_pid,os.getpid()}
    pg_pid=root/'pgdata/postmaster.pid'
    if pg_pid.exists():owned.add(int(pg_pid.read_text().splitlines()[0]))
    while True:
        extended=owned|{pid for pid,parent,_,_ in records if parent in owned}
        if extended==owned:break
        owned=extended
    values={}
    for pid,parent,clock,command in records:
        if pid in owned or command.endswith('/ps'):continue
        fields=clock.split(':')
        try:seconds=sum(float(value)*60**i for i,value in enumerate(reversed(fields)))
        except ValueError:continue
        values[pid]=seconds
    return values

@contextmanager
def server(variant):
    with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
    log=open(out/(variant+'.stderr.log'),'ab')
    started=time.perf_counter()
    command=[str(bun),'src/index.ts'] if variant=='api-source' else [str(project/'builds'/variant)]
    proc=subprocess.Popen(command,cwd=project,env={**env,'PORT':str(port)},stdout=log,stderr=log)
    try:
        deadline=started+15
        path='/health' if args.suite=='api' else '/'
        expected=b'{"status":"ok"}' if args.suite=='api' else b'Hi'
        while True:
            if proc.poll() is not None:raise RuntimeError(f'{variant} exited {proc.returncode}; see log')
            try:
                response=request(port,'GET',path)
                assert response['status']==200 and response['body']==expected,response
                break
            except (ConnectionError,OSError):
                if time.perf_counter()>deadline:raise TimeoutError(variant)
                time.sleep(.001)
        ready_ms=(time.perf_counter()-started)*1000
        yield dict(proc=proc,port=port,ready_ms=ready_ms,ready_memory=memory(proc.pid))
    finally:
        if proc.poll() is None:
            proc.terminate()
            try:proc.wait(timeout=5)
            except subprocess.TimeoutExpired:proc.kill();proc.wait()
        log.close()

def cases():
    if args.suite=='framework':
        return [dict(name='root',method='GET',path='/',status=200,body=None),
                dict(name='dynamic',method='GET',path='/id/42?name=Jane',status=200,body=None),
                dict(name='json',method='POST',path='/json',status=200,body='{"name":"Jane","items":[1,2,3],"active":true}'),
                dict(name='extra',method='GET',path='/account/preferences',status=200,body=None)]
    return [dict(name='health',method='GET',path='/health',status=200,body=None),
            dict(name='echo',method='POST',path='/echo',status=200,body='{"name":"Jane Doe","email":"jane@example.com","age":30,"tags":["a","b"]}'),
            dict(name='user',method='GET',path='/users/4242',status=200,body=None),
            dict(name='list',method='GET',path='/users?page=7&limit=20',status=200,body=None),
            dict(name='me',method='GET',path='/me',status=200,body=None,auth=True)]

def headers(case):
    return {**({'content-type':'application/json'} if case['body'] is not None else {}),**({'authorization':'Bearer '+token} if case.get('auth') else {})}

def verify_one(variant,s):
    rows=[]
    for case in cases():
        r=request(s['port'],case['method'],case['path'],case['body'],headers(case))
        assert r['status']==case['status'],(variant,case,r['status'],r['body'][:300])
        if case['name'] in ['root','dynamic','extra']:
            assert r['body']=={'root':b'Hi','dynamic':b'42 Jane','extra':b'ok'}[case['name']]
        if case['name']=='dynamic':assert r['headers'].get('x-powered-by')=='benchmark'
        if case['name'] in ['json','echo']:assert json.loads(r['body'])==json.loads(case['body'])
        if case['name'] in ['user','me']:
            user=json.loads(r['body']);assert user['id']==4242 and user['name']=='User 4242' and user['email']=='user4242@example.com'
        if case['name']=='list':
            page=json.loads(r['body']);assert page['page']==7 and page['limit']==20 and [x['id'] for x in page['items']]==list(range(121,141))
        rows.append(dict(name=case['name'],status=r['status'],body=r['body'].decode(),sha256=hashlib.sha256(r['body']).hexdigest()))
    if args.suite=='framework':
        for path in ['/missing','/id']:
            r=request(s['port'],'GET',path);assert r['status']==404
            rows.append(dict(name=path,status=r['status'],body=r['body'].decode()))
        r=request(s['port'],'POST','/json','{',{'content-type':'application/json'})
        assert r['status']>=400
        rows.append(dict(name='malformed-json',status=r['status'],body=r['body'].decode()))
        video=project/'public/kyuukurarin.mp4'
        r=request(s['port'],'GET','/video');assert r['status']==200 and hashlib.sha256(r['body']).digest()==hashlib.sha256(video.read_bytes()).digest()
        rows.append(dict(name='video',status=200,bytes=len(r['body']),sha256=hashlib.sha256(r['body']).hexdigest()))
        r=request(s['port'],'GET','/video',headers={'range':'bytes=0-1023'})
        # Upstream Elysia ignores Range; Hono's Bun.file Response honors it.
        expected_status=206 if variant.startswith('hono') else 200
        expected_bytes=video.read_bytes()[:1024] if expected_status==206 else video.read_bytes()
        assert r['status']==expected_status and r['body']==expected_bytes,(variant,'range',r['status'])
        rows.append(dict(name='range',status=r['status'],sha256=hashlib.sha256(r['body']).hexdigest()))
    else:
        for name,path,body,head,expected in [
            ('no-auth','/me',None,{},401),('bad-auth','/me',None,{'authorization':'Bearer invalid'},401),
            ('not-found','/users/9999999',None,{},404),('bad-param','/users/nope',None,{},422),
            ('bad-echo','/echo','{"name":"x","email":"bad","age":-1,"tags":[]}',{'content-type':'application/json'},422),
            ('bad-json','/echo','{',{'content-type':'application/json'},400),
            ('order','/orders','{"userId":4242,"amount":19.99,"currency":"USD"}',{'content-type':'application/json'},201),
            ('cpu','/cpu?n=500',None,{},200)]:
            r=request(s['port'],'POST' if body is not None else 'GET',path,body,head)
            assert r['status']==expected,(variant,name,r['status'],r['body'][:300])
            value=r['body'].decode()
            if name=='order':
                o=json.loads(value);assert o['userId']==4242 and o['amount']=='19.99' and o['currency']=='USD'
                del o['id'];del o['createdAt'];value=json.dumps(o,sort_keys=True)
            if name=='cpu':
                digest='elysia-vs-nest'
                for _ in range(500):digest=hashlib.sha256(digest.encode()).hexdigest()
                assert json.loads(value)==dict(n=500,hash=digest)
            rows.append(dict(name=name,status=r['status'],body=value))
    return rows

def load(variant,s,case,seconds,phase):
    r=request(s['port'],case['method'],case['path'],case['body'],headers(case))
    assert r['status']==case['status']
    prefix=out/f"{variant}-{case['name']}-{phase}"
    expected=prefix.with_suffix('.expected');expected.write_bytes(r['body'])
    lines=[f"{case['method']} {case['path']} HTTP/1.1",'Host: 127.0.0.1','Connection: keep-alive']
    for k,v in headers(case).items():lines.append(f'{k}: {v}')
    body=(case['body'] or '').encode()
    if case['body'] is not None:lines.append(f'Content-Length: {len(body)}')
    req=prefix.with_suffix('.request');req.write_bytes(('\r\n'.join(lines)+'\r\n\r\n').encode()+body)
    result_file=prefix.with_suffix('.json');before=memory(s['proc'].pid);foreign_before=foreign_snapshot(s['proc'].pid);samples=[];stop=threading.Event()
    def sample():
        start=time.perf_counter()
        while not stop.is_set():
            m=memory(s['proc'].pid)
            if m:samples.append(dict(seconds=time.perf_counter()-start,**m))
            stop.wait(.2)
    thread=threading.Thread(target=sample);thread.start()
    try:
        result=subprocess.run([str(root/'http-load'),str(s['port']),str(args.concurrency),str(seconds),str(req),str(expected),str(case['status']),str(result_file)],capture_output=True,timeout=seconds+20)
        assert result.returncode==0,(variant,case['name'],result.returncode,result.stdout,result.stderr)
    finally:stop.set();thread.join()
    value=json.loads(result_file.read_text());assert value['requests']>0 and value['failures']==0
    after=memory(s['proc'].pid)
    foreign_after=foreign_snapshot(s['proc'].pid)
    foreign_seconds=sum(max(0,foreign_after[pid]-seconds) for pid,seconds in foreign_before.items() if pid in foreign_after) if foreign_before is not None and foreign_after is not None else None
    value.update(before=before,after=after,memory=samples,load_average=os.getloadavg(),expected_sha256=hashlib.sha256(r['body']).hexdigest())
    value['foreign_persistent_cpu_percent']=foreign_seconds/value['seconds']*100 if foreign_seconds is not None else None
    for q in [.5,.95,.99]:
        count=0
        for upper,n in value['histogram_upper_us']:
            count+=n
            if count>=value['requests']*q:value[f'p{int(q*100)}_upper_us']=upper;break
    return value

rows=[]
if args.stage=='verify':
    references={}
    for variant in variants:
        try:
            with server(variant) as s:checks=verify_one(variant,s)
            family='hono' if variant.startswith('hono') else 'elysia'
            reference=references.setdefault(family,checks)
            rows.append(dict(variant=variant,checks=checks,matches_reference=checks==reference))
        except Exception as error:rows.append(dict(variant=variant,error=f'{type(error).__name__}: {error}',traceback=traceback.format_exc()))
        (out/'parity.json').write_text(json.dumps(rows,indent=2)+'\n')
    assert all(r.get('matches_reference') for r in rows), 'See preserved parity failures'
else:
    # A fresh independently checked parity run must precede timed trials.
    for variant in variants:
        with server(variant) as s:verify_one(variant,s)
    warm_seconds=5 if args.stage=='soak' else 2
    for block in range(args.runs):
        order=variants[block%len(variants):]+variants[:block%len(variants)]
        if (block//len(variants))%2:order=list(reversed(order))
        for position,variant in enumerate(order):
            with server(variant) as s:
                row=dict(block=block,position=position,variant=variant,ready_ms=s['ready_ms'],ready_memory=s['ready_memory'],observed_at=datetime.now(timezone.utc).isoformat())
                if args.stage!='startup':
                    selected=cases()
                    if args.stage=='load':selected=[c for c in selected if c['name'] in ['dynamic','json','health','echo','user','me']]
                    if args.stage=='noise':selected=[c for c in selected if c['name'] in ['dynamic','echo','user']]
                    if args.stage=='soak':selected=[c for c in selected if c['name'] in ['json','me']]
                    selected=selected[block%len(selected):]+selected[:block%len(selected)]
                    row['routes']=[]
                    for case in selected:
                        load(variant,s,case,warm_seconds,f'{block}-warm')
                        result=load(variant,s,case,args.seconds,f'{block}-measure')
                        row['routes'].append(dict(name=case['name'],**result))
                rows.append(row)
                (out/'observations.json').write_text(json.dumps(dict(metadata=metadata,suite=args.suite,stage=args.stage,concurrency=args.concurrency,seconds=args.seconds,rows=rows),indent=2)+'\n')
                print(args.stage,block+1,variant,round(row['ready_ms'],2),[(r['name'],round(r['rps'])) for r in row.get('routes',[])],flush=True)
print('DONE',len(rows),flush=True)
