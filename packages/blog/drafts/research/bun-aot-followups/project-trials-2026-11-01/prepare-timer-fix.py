#!/usr/bin/env python3
import argparse,hashlib,json,os,socket,subprocess
from pathlib import Path

def fixed(source):
 old='    const timeoutPromise = new Promise<never>((_, reject) => {\n      setTimeout(() => {'
 new='    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;\n    const timeoutPromise = new Promise<never>((_, reject) => {\n      timeoutHandle = setTimeout(() => {'
 assert source.count(old)==1
 source=source.replace(old,new)
 old='    } finally {\n      this.actionAbortSignal = previousSignal;'
 new='    } finally {\n      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);\n      this.actionAbortSignal = previousSignal;'
 assert source.count(old)==1
 return source.replace(old,new)

def main():
 p=argparse.ArgumentParser();p.add_argument('--lab',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();assert not a.out.exists();a.out.mkdir(parents=True);root=a.lab/'keryx';file=root/'packages/keryx/classes/Connection.ts';original=file.read_bytes();patched=fixed(original.decode()).encode();bun=a.lab/'compiler/bun-darwin-aarch64/bun';rows=[]
 try:
  for name,content in [('original',original),('fixed',patched)]:
   file.write_bytes(content)
   with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
   env={**os.environ,'NODE_ENV':'production','DATABASE_URL':'postgres://postgres@127.0.0.1:55441/keryx_study','DATABASE_AUTO_MIGRATE':'false','REDIS_URL':'memory://','TASKS_ENABLED':'false','RATE_LIMIT_ENABLED':'false','WEB_SERVER_ENABLED':'true','WEB_SERVER_HOST':'127.0.0.1','WEB_SERVER_PORT':str(port),'MCP_SERVER_ENABLED':'false','LOG_LEVEL':'fatal','WEB_SERVER_INCLUDE_STACK_IN_ERRORS':'false'}
   script=Path(__file__).with_name('timer-contract.ts').resolve();r=subprocess.run([str(bun),str(script),str(a.lab)],cwd=root/'example/backend',env=env,capture_output=True,timeout=30);(a.out/(name+'.log')).write_bytes(r.stdout+r.stderr);assert r.returncode==0,(name,r.returncode,r.stderr[-500:]);result=next(json.loads(line) for line in r.stdout.decode().splitlines() if line.startswith('{"defaultTimers'))
   assert result['defaultTimersAfter20Successes']==(20 if name=='original' else 0)
   assert result['fastTimers']==(1 if name=='original' else 0) and result['thrownTimers']==(1 if name=='original' else 0)
   assert result['abortObserved'] and result['slowStatus']==408 and result['fastStatus']==200 and result['thrownStatus']==500
   rows.append({'variant':name,'connection_sha256':hashlib.sha256(content).hexdigest(),'contract_sha256':hashlib.sha256(script.read_bytes()).hexdigest(),**result});(a.out/'contracts.json').write_text(json.dumps(rows,indent=2));print(name,result,flush=True)
  file.write_bytes(patched)
  patch=subprocess.check_output(['git','diff','--','packages/keryx/classes/Connection.ts'],cwd=root);(a.out/'timer-cleanup.patch').write_bytes(patch)
  cmd=json.loads((a.lab/'keryx-normalized/builds.json').read_text())[0]['argv'];cmd[cmd.index('--outfile')+1]=str(a.out/'native')
  with (a.out/'build.log').open('wb') as log:r=subprocess.run(cmd,cwd=root,stdout=log,stderr=subprocess.STDOUT,timeout=180)
  assert r.returncode==0,'fixed native build failed'
  (a.out/'build.json').write_text(json.dumps({'argv':cmd,'exit':r.returncode,'bytes':(a.out/'native').stat().st_size,'sha256':hashlib.sha256((a.out/'native').read_bytes()).hexdigest(),'original_connection_sha256':hashlib.sha256(original).hexdigest(),'fixed_connection_sha256':hashlib.sha256(patched).hexdigest(),'patch_sha256':hashlib.sha256(patch).hexdigest()},indent=2));print('Fixed native built; original source restored on exit',flush=True)
 finally:file.write_bytes(original)
if __name__=='__main__':main()
