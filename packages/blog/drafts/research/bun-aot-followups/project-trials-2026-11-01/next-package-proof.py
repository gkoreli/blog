#!/usr/bin/env python3
"""Check the two final Next launchers from empty folders with their source hidden."""
import argparse,hashlib,importlib.util,json,os,signal,socket,subprocess,tempfile,time
from pathlib import Path
spec=importlib.util.spec_from_file_location('study',Path(__file__).with_name('study.py'));study=importlib.util.module_from_spec(spec);spec.loader.exec_module(study)
def main():
 p=argparse.ArgumentParser();p.add_argument('--lab',type=Path,required=True);p.add_argument('--out',type=Path,required=True);p.add_argument('--binaries',type=Path);a=p.parse_args();a.binaries=a.binaries or a.lab/'next-final';assert not a.out.exists();a.out.mkdir(parents=True);root=a.lab/'next-bun-compile';hidden=a.lab/'next-source-hidden';assert root.is_dir() and not hidden.exists();assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()=='43ab16c93774f23923654d337e6e2d9c205e4fe4'
 page=(root/'examples/sharp/.next/server/app/index.html').read_bytes();data={'runner_sha256':study.sha(__file__),'source_hidden':False,'rows':[]};root.rename(hidden)
 try:
  data['source_hidden']=not root.exists()
  for mode in ['jit','native-disk']:
   with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
   row={'mode':mode,'checks':[]};data['rows'].append(row);process=None
   try:
    with tempfile.TemporaryDirectory(prefix='next-package-cwd-') as cwd,(a.out/(mode+'.log')).open('wb') as log:
     env={**os.environ,'PATH':'/usr/bin:/bin','NODE_ENV':'production','PORT':str(port),'HOSTNAME':'127.0.0.1','NBC_RUNTIME_DIR':str(a.out/'runtime'/mode),'NEXT_TELEMETRY_DISABLED':'1'}
     process=subprocess.Popen([str(a.binaries/mode)],cwd=cwd,env=env,stdout=log,stderr=log,start_new_session=True);start=time.monotonic()
     while True:
      assert process.poll() is None
      try:
       code,_,b=study.request(port,'/')
       if code==200:assert b==page;break
      except (OSError,study.http.client.HTTPException):pass
      assert time.monotonic()-start<30;time.sleep(.005)
     for name,path,expected,ctype in [('page','/',page,'text/html'),('json','/api/study',{'framework':'Next.js','result':42},'application/json'),('static','/study-asset.txt',b'bun-aot-study-static-asset\n','text/plain'),('image','/api/resize',None,'image/png')]:
      code,heads,b=study.request(port,path);assert code==200 and heads['content-type'].startswith(ctype),(name,code)
      if name=='image':study.png(b)
      elif isinstance(expected,dict):study.exact(json.loads(b),expected)
      else:assert b==expected
      row['checks'].append({'name':name,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
     assert not study.helper.child_pids(process.pid);row['accepted']=True
   except Exception as error:row.update(accepted=False,error=str(error))
   finally:
    if process is not None:
     if process.poll() is None:os.killpg(process.pid,signal.SIGTERM)
     try:process.wait(timeout=4)
     except subprocess.TimeoutExpired:os.killpg(process.pid,signal.SIGKILL);process.wait()
   print(mode,'source-hidden package check',row['accepted'],flush=True)
 finally:
  hidden.rename(root);data['source_restored']=root.exists();(a.out/'result.json').write_text(json.dumps(data,indent=2)+'\n')
 assert len(data['rows'])==2 and all(r['accepted'] for r in data['rows'])
if __name__=='__main__':main()
