#!/usr/bin/env python3
"""Run packaged API binaries with their build source/dependencies hidden.

Run only after performance work ends. Temporarily renames this study's own
scratch project/node_modules directories and restores them in finally.
"""
import argparse, hashlib, http.client, json, os, socket, subprocess, time
from pathlib import Path
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--root',type=Path,required=True)
a=p.parse_args();root=a.root.resolve();project=root/'sources/api/apps/elysia-api'
bun=root/'compiler/bun-darwin-aarch64/bun';out=root/'packaging';out.mkdir(exist_ok=True)
empty=out/'empty';empty.mkdir(exist_ok=True)
token=subprocess.check_output([str(bun),'-e','import {SignJWT} from "jose";console.log(await new SignJWT({}).setProtectedHeader({alg:"HS256"}).setSubject("4242").setIssuedAt(0).sign(new TextEncoder().encode("bench-secret-do-not-use-in-prod")))'],cwd=project,text=True).strip()
parity=root/'api-parity-v2/parity.json'
if not parity.exists():parity=root/'api-parity/parity.json'
reference=next(r['checks'] for r in json.loads(parity.read_text()) if r['variant']=='api-source')
expected={r['name']:r['body'].encode() for r in reference if r['name'] in ['health','echo','user','me']}
names=['api-wired-jit','api-wired-native','api-wired-bytecode','api-plugin-jit','api-plugin-native']
for name in names:
    target=out/name
    if not target.exists():os.link(project/'builds'/name,target)
    assert hashlib.sha256(target.read_bytes()).digest()==hashlib.sha256((project/'builds'/name).read_bytes()).digest()
renamed=[];rows=[]
try:
    for source in [project,root/'sources/api/node_modules']:
        hidden=source.with_name(source.name+'-hidden-for-packaging')
        assert source.exists() and not hidden.exists(),source
        source.rename(hidden);renamed.append((source,hidden))
    for name,driver in [(n,'bunsql') for n in names]+[('api-wired-jit','postgresjs'),('api-wired-native','postgresjs')]:
        with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
        env={**os.environ,'PORT':str(port),'NODE_ENV':'production','DATABASE_URL':'postgres://postgres@127.0.0.1:55439/bench_saas','DB_DRIVER':driver,'JWT_SECRET':'bench-secret-do-not-use-in-prod','PATH':'/usr/bin:/bin'}
        env.pop('NODE_PATH',None)
        with open(out/(name+'-'+driver+'.log'),'wb') as log:
            proc=subprocess.Popen([str(out/name)],cwd=empty,env=env,stdout=log,stderr=log)
            try:
                deadline=time.monotonic()+15
                while True:
                    if proc.poll() is not None:raise RuntimeError((name,driver,proc.returncode))
                    try:
                        c=http.client.HTTPConnection('127.0.0.1',port,timeout=1);c.request('GET','/health');r=c.getresponse();body=r.read();c.close();assert r.status==200 and body==expected['health'];break
                    except OSError:
                        if time.monotonic()>deadline:raise
                        time.sleep(.005)
                checks=[]
                for case,path in [('echo','/echo'),('user','/users/4242'),('me','/me')]:
                    headers={'content-type':'application/json'} if case=='echo' else {}
                    if case=='me':headers['authorization']='Bearer '+token
                    c=http.client.HTTPConnection('127.0.0.1',port,timeout=10);c.request('POST' if case=='echo' else 'GET',path,body=expected['echo'] if case=='echo' else None,headers=headers)
                    r=c.getresponse();body=r.read();c.close();assert r.status==200 and body==expected[case],(name,driver,case,r.status,body[:100])
                    checks.append(dict(case=case,status=200,body_sha256=hashlib.sha256(body).hexdigest()))
                rows.append(dict(binary=name,driver=driver,checks=checks,source_and_node_modules_hidden=True,cwd_has_no_dependencies=True,system_bins_only_on_path=True))
                (out/'results.json').write_text(json.dumps(rows,indent=2)+'\n')
            finally:
                if proc.poll() is None:proc.terminate();proc.wait(timeout=5)
finally:
    for source,hidden in reversed(renamed):
        assert not source.exists();hidden.rename(source)
print('Packaged API checks passed',len(rows))
