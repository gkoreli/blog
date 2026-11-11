"""Attempted recovery protocol; NOT validated end to end.

The recorded run stopped at migrations: pgserver==0.1.4 lacks pgcrypto.
Run with a venv containing waymark==0.30.1 and a compatible database runtime.

Usage: /venv/bin/python waymark-recovery.py /temporary/trial/directory
Uses a fresh PostgreSQL directory, explicit loopback gRPC ports, and only owned process groups.
"""
import json
import os
from pathlib import Path
import shutil
import signal
import socket
import subprocess
import sys
import time
from urllib.parse import urlsplit, urlunsplit
import pgserver

root=Path(sys.argv[1]).resolve();root.mkdir(parents=True,exist_ok=True)
shutil.copyfile(Path(__file__).with_name('waymark_workflows.py'),root/'waymark_workflows.py')
bin_dir=Path(sys.executable).parent
def free_port():
    with socket.socket() as sock:sock.bind(('127.0.0.1',0));return sock.getsockname()[1]
worker_port,bridge_port=free_port(),free_port()
env=dict(os.environ,PATH=str(bin_dir)+os.pathsep+os.environ['PATH'],
    RADAR_WAYMARK_TRIAL=str(root),WAYMARK_USER_MODULE='waymark_workflows',
    WAYMARK_WORKER_COUNT='1',WAYMARK_CONCURRENT_PER_WORKER='1',
    WAYMARK_HTTP_ENABLED='false',WAYMARK_WORKER_GRPC_ADDR=f'127.0.0.1:{worker_port}',
    WAYMARK_BRIDGE_GRPC_ADDR=f'127.0.0.1:{bridge_port}',WAYMARK_BRIDGE_GRPC_PORT=str(bridge_port),
    METRICS_ADDR=f'127.0.0.1:{free_port()}',RUST_LOG='info')
owned=[];opened=[];server=None;node=None;results=[]
def launch(executable,filename,args=()):
    file=(root/filename).open('w');opened.append(file)
    process=subprocess.Popen([str(executable),*args],cwd=root,env=env,stdout=file,stderr=subprocess.STDOUT,start_new_session=True)
    owned.append(process);return process
def kill(process):
    if process is not None:
        try:os.killpg(process.pid,signal.SIGKILL)
        except ProcessLookupError:pass
        try:process.wait(timeout=5)
        except subprocess.TimeoutExpired:pass
def effects(label):
    p=root/'effects.jsonl'
    return [json.loads(l) for l in p.read_text().splitlines() if json.loads(l)['label']==label] if p.exists() else []
def wait_for(predicate,seconds=70):
    end=time.monotonic()+seconds
    while time.monotonic()<end:
        if predicate():return
        time.sleep(0.2)
    raise TimeoutError('Trial condition did not arrive')
def port_ready(port):
    try:
        with socket.create_connection(('127.0.0.1',port),timeout=0.2):return True
    except OSError:return False
try:
    server=pgserver.get_server(root/'postgres',cleanup_mode='stop')
    uri=urlsplit(server.get_uri())
    # pgserver supplies a Unix-socket host in the query with an empty authority host.
    # sqlx also requires a nonempty authority hostname; its host query still picks the socket.
    if uri.hostname is None:uri=uri._replace(netloc=uri.netloc+'localhost')
    env['WAYMARK_DATABASE_URL']=urlunsplit(uri)
    node=launch(bin_dir/'waymark-executor','executor-0.log')
    wait_for(lambda:port_ready(worker_port) or node.poll() is not None,30)
    if node.poll() is not None:raise RuntimeError('Executor exited during startup; see executor-0.log')
    bridge=launch(bin_dir/'waymark-bridge','bridge.log')
    wait_for(lambda:port_ready(bridge_port) or bridge.poll() is not None,30)
    if bridge.poll() is not None:raise RuntimeError('Bridge exited during startup; see bridge.log')
    for index,(label,cls) in enumerate([('sleep','SleepRecovery'),('lost-default','LostDefault'),('lost-retry','LostRetry')],1):
        source=("import asyncio,json\nfrom waymark_workflows import "+cls+"\n"
            "async def main():\n"
            " try:\n  value=await "+cls+"().run("+repr(label)+")\n  print(json.dumps({'status':'completed','result':value}),flush=True)\n"
            " except BaseException as error:\n  print(json.dumps({'status':'failed','type':type(error).__name__,'message':str(error)}),flush=True)\n"
            "asyncio.run(main())\n")
        client=launch(sys.executable,label+'-client.log',('-c',source))
        wait_for(lambda:bool(effects(label)) or client.poll() is not None,35)
        if not effects(label):raise RuntimeError(f'{label}: no action started; see client log')
        time.sleep(1)
        kill(node)
        if label!='sleep':(root/(label+'-release')).touch()
        node=launch(bin_dir/'waymark-executor',f'executor-{index}.log')
        wait_for(lambda:client.poll() is not None,85)
        outcome=(root/(label+'-client.log')).read_text().splitlines()
        parsed=[]
        for line in outcome:
            try:parsed.append(json.loads(line))
            except json.JSONDecodeError:pass
        record={'case':label,'effects':effects(label),'clientExit':client.returncode,'outcome':parsed[-1] if parsed else None}
        results.append(record)
        (root/'results.json').write_text(json.dumps(results,indent=2)+'\n')
        print(json.dumps(record),flush=True)
finally:
    for process in reversed(owned):kill(process)
    if server is not None:server.cleanup()
    for file in opened:file.close()
