"""Usage: /waymark-venv/bin/python waymark-standalone.py /postgres/bin /fresh/output.

Waymark 0.30.1; PostgreSQL with pgcrypto available; all effects are synthetic.
Starts only a fresh Unix-socket database and loopback executor/bridge ports.
"""
import json
import os
from pathlib import Path
import shutil
import signal
import socket
import subprocess
import sys
import tempfile
import time
from urllib.parse import urlencode
pgbin,root=map(lambda p:Path(p).resolve(),sys.argv[1:]);root.mkdir(parents=True,exist_ok=True)
shutil.copyfile(Path(__file__).with_name('waymark_workflows.py'),root/'waymark_workflows.py')
bin_dir=Path(sys.executable).parent
socket_dir=Path(tempfile.mkdtemp(prefix='radar-pg-',dir='/private/tmp'))
def free_port():
 with socket.socket() as s:s.bind(('127.0.0.1',0));return s.getsockname()[1]
worker_port,bridge_port,pgport=free_port(),free_port(),free_port()
env=dict(os.environ,PATH=str(bin_dir)+os.pathsep+os.environ['PATH'],
 RADAR_WAYMARK_TRIAL=str(root),WAYMARK_USER_MODULE='waymark_workflows',
 WAYMARK_WORKER_COUNT='1',WAYMARK_CONCURRENT_PER_WORKER='1',WAYMARK_HTTP_ENABLED='false',
 WAYMARK_WORKER_GRPC_ADDR=f'127.0.0.1:{worker_port}',WAYMARK_BRIDGE_GRPC_ADDR=f'127.0.0.1:{bridge_port}',
 WAYMARK_BRIDGE_GRPC_PORT=str(bridge_port),METRICS_ADDR=f'127.0.0.1:{free_port()}',RUST_LOG='info',
 WAYMARK_DATABASE_URL='postgresql://radar@localhost/radar?'+urlencode({'host':str(socket_dir),'port':pgport}))
owned=[];opened=[];started=False;results=[]
def logged(args,filename):
 with (root/filename).open('w') as f:
  subprocess.run([str(a) for a in args],env=env,stdout=f,stderr=subprocess.STDOUT,check=True)
def launch(exe,file,args=()):
 f=(root/file).open('w');opened.append(f)
 p=subprocess.Popen([str(exe),*args],cwd=root,env=env,stdout=f,stderr=subprocess.STDOUT,start_new_session=True)
 owned.append(p);return p
def kill(p):
 try:os.killpg(p.pid,signal.SIGKILL)
 except ProcessLookupError:pass
 try:p.wait(timeout=5)
 except subprocess.TimeoutExpired:pass
def wait_for(predicate,seconds):
 end=time.monotonic()+seconds
 while time.monotonic()<end:
  if predicate():return
  time.sleep(.2)
 raise TimeoutError('Expected trial condition did not arrive')
def ready(port):
 try:
  with socket.create_connection(('127.0.0.1',port),timeout=.2):return True
 except OSError:return False
def effects(label):
 p=root/'effects.jsonl'
 return [json.loads(s) for s in p.read_text().splitlines() if json.loads(s)['label']==label] if p.exists() else []
try:
 logged([pgbin/'initdb','-D',root/'postgres','-A','trust','-U','radar','--no-locale','--encoding=UTF8'],'initdb.log')
 logged([pgbin/'pg_ctl','-D',root/'postgres','-l',root/'postgres.log','-o',f"-c listen_addresses='' -c unix_socket_directories='{socket_dir}' -p {pgport}",'-w','start'],'pg-start.log');started=True
 logged([pgbin/'createdb','-h',socket_dir,'-p',str(pgport),'-U','radar','radar'],'createdb.log')
 node=launch(bin_dir/'waymark-executor','executor-0.log')
 wait_for(lambda:ready(worker_port) or node.poll() is not None,40)
 if node.poll() is not None:raise RuntimeError('Executor startup failed; see executor-0.log')
 bridge=launch(bin_dir/'waymark-bridge','bridge.log')
 wait_for(lambda:ready(bridge_port) or bridge.poll() is not None,30)
 if bridge.poll() is not None:raise RuntimeError('Bridge startup failed; see bridge.log')
 for index,(label,cls) in enumerate([('sleep','SleepRecovery'),('lost-default','LostDefault'),('lost-retry','LostRetry')],1):
  source=('import asyncio,json\nfrom waymark_workflows import '+cls+'\n'
   'async def main():\n'
   ' try:\n  value=await '+cls+'().run('+repr(label)+')\n  print(json.dumps({"status":"completed","result":value}),flush=True)\n'
   ' except BaseException as error:\n  print(json.dumps({"status":"failed","type":type(error).__name__,"message":str(error)}),flush=True)\n'
   'asyncio.run(main())\n')
  client=launch(sys.executable,label+'-client.log',('-c',source))
  wait_for(lambda:bool(effects(label)) or client.poll() is not None,40)
  if not effects(label):raise RuntimeError(label+': no action started; inspect client log')
  time.sleep(1);kill(node)
  if label!='sleep':(root/(label+'-release')).touch()
  node=launch(bin_dir/'waymark-executor',f'executor-{index}.log')
  wait_for(lambda:client.poll() is not None,120)
  parsed=[]
  for line in (root/(label+'-client.log')).read_text().splitlines():
   try:parsed.append(json.loads(line))
   except json.JSONDecodeError:pass
  out={'case':label,'effects':effects(label),'clientExit':client.returncode,'outcome':parsed[-1] if parsed else None}
  results.append(out);(root/'results.json').write_text(json.dumps(results,indent=2)+'\n');print(json.dumps(out),flush=True)
finally:
 for p in reversed(owned):kill(p)
 if started:logged([pgbin/'pg_ctl','-D',root/'postgres','-m','immediate','-w','stop'],'pg-stop.log')
 for f in opened:f.close()
 shutil.rmtree(socket_dir,ignore_errors=True)
