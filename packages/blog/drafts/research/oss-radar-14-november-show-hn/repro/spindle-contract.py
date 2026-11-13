"""Usage: python spindle-contract.py /opam /opam-root /pinned/checkout /output /zod.

Needs the temporary 'radar' OCaml switch with Spindle's dependencies installed.
Only writes radar_contract in that temporary checkout; starts its loopback server.
"""
import json
import os
from pathlib import Path
import signal
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
opam,opamroot,checkout,root,zod=map(lambda p:Path(p).resolve(),sys.argv[1:]);root.mkdir(parents=True,exist_ok=True)
fixture=checkout/'radar_contract';fixture.mkdir(exist_ok=True)
(fixture/'dune').write_text(Path(__file__).with_suffix('.dune').read_text())
source=Path(__file__).with_suffix('.ml').read_text()
(root/'node_modules').mkdir(exist_ok=True)
(root/'node_modules/zod').symlink_to(zod)
exe=checkout/'_build/default/radar_contract/main.exe'
def run(name,args):
 r=subprocess.run([str(a) for a in args],cwd=checkout,capture_output=True,text=True,timeout=150)
 (root/(name+'.stdout')).write_text(r.stdout);(root/(name+'.stderr')).write_text(r.stderr)
 return r

def http_cases():
 with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
 log=(root/'server.log').open('a');p=subprocess.Popen([str(exe),'serve',str(port)],stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
 try:
  deadline=time.monotonic()+10
  while True:
   try:
    with socket.create_connection(('127.0.0.1',port),timeout=.2):break
   except OSError:
    if p.poll() is not None:raise RuntimeError('Fixture server exited; inspect server.log')
    if time.monotonic()>deadline:raise TimeoutError('Loopback server did not start')
    time.sleep(.1)
  results=[]
  for units in [0,1,2,3,11,'3']:
   req=urllib.request.Request(f'http://127.0.0.1:{port}/claim',data=json.dumps({'units':units}).encode(),headers={'Content-Type':'application/json'})
   try:
    with urllib.request.urlopen(req,timeout=5) as r:status,body=r.status,r.read().decode()
   except urllib.error.HTTPError as r:status,body=r.code,r.read().decode()
   results.append({'units':units,'status':status,'body':json.loads(body)})
  return results
 finally:
  try:os.killpg(p.pid,signal.SIGTERM)
  except ProcessLookupError:pass
  try:p.wait(timeout=5)
  except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGKILL);p.wait(timeout=5)
  log.close()

def zod_cases(file):
 code="const m=await import(process.argv[1]); console.log(JSON.stringify([0,1,2,3,11,'3'].map(units=>({units,success:m.ClaimSchema.safeParse({units}).success}))));"
 r=run(file.stem+'-validation',['node','--input-type=module','-e',code,file.as_uri()]);r.check_returncode();return json.loads(r.stdout)

results=[]
for label,bound in [('before',10),('after',2)]:
 (fixture/'main.ml').write_text(source.replace('[@max 10]',f'[@max {bound}]'))
 r=run(label+'-build',[opam,'exec','--root='+str(opamroot),'--switch=radar','--','dune','build','radar_contract/main.exe']);r.check_returncode()
 if label=='after':
  stale=run('stale-check',[exe,'api','check','--openapi',root/'before.json','--zod',root/'before.ts','--strict']).returncode
 for kind,suffix in [('openapi','json'),('zod','ts')]:
  run(label+'-'+kind,[exe,'api',kind,'-o',root/(label+'.'+suffix)]).check_returncode()
 fresh=run(label+'-fresh-check',[exe,'api','check','--openapi',root/(label+'.json'),'--zod',root/(label+'.ts'),'--strict']).returncode
 schema=json.loads((root/(label+'.json')).read_text())['components']['schemas']['Claim']['properties']['units']
 results.append({'phase':label,'declaredBound':bound,'openapiUnitsSchema':schema,'http':http_cases(),'zod':zod_cases(root/(label+'.ts')),'freshCheckExit':fresh})
result={'sourceCommit':'9ed528817b74e4cd13cc1595d1e986dc9580e75f','ocaml':'5.5.0','zodVersion':json.loads((zod/'package.json').read_text())['version'],'staleCheckExit':stale,'phases':results,'scope':'One synthetic route; real server, generated schemas, actual Zod parser and CLI drift check. No full protocol conformance or production app.'}
(root/'results.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
