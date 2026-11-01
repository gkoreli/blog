#!/usr/bin/env python3
"""Separate Keryx returning-session control; preserve the no-cookie batch."""
import argparse,hashlib,importlib.util,json,subprocess
from pathlib import Path
spec=importlib.util.spec_from_file_location('study',Path(__file__).with_name('study.py'));study=importlib.util.module_from_spec(spec);spec.loader.exec_module(study)
def main():
 p=argparse.ArgumentParser();p.add_argument('--lab',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();assert not a.out.exists();a.out.mkdir(parents=True);(a.out/'private').mkdir(mode=0o700);metrics=study.helper.Metrics();client=a.out/'private/http-load'
 subprocess.run(['cc','-O2','-Wall','-Wextra','-pthread',str(study.TOOL.with_name('http-load.c')),'-o',str(client)],check=True)
 data={'metadata':{'profile':'One returning session shared by eight concurrent HTTP connections; reuse the actual Set-Cookie value','runner_sha256':study.sha(__file__),'study_sha256':study.sha(Path(__file__).with_name('study.py')),'helper_sha256':study.sha(study.TOOL),'client_source_sha256':study.sha(study.TOOL.with_name('http-load.c')),'runs':6,'connections':8,'warmup_seconds':2,'measured_seconds':5,'cpu_seconds_per_tick':metrics.cpu_seconds_per_tick},'rows':[]}
 def save():(a.out/'observations.json').write_text(json.dumps(data,indent=2)+'\n')
 save()
 for block in range(6):
  for mode in (['source','native'] if block%2==0 else ['native','source']):
   row={'mode':mode,'block':block};data['rows'].append(row)
   try:
    with study.server('keryx',mode,a.lab,a.out,f'cookie-{mode}-{block}',metrics) as server:
     row.update({k:v for k,v in server.items() if k not in ('pid','port')});row['checks'],cases=study.check('keryx',server['port'],a.lab)
     code,headers,body=study.request(server['port'],'/api/greeting/prompt?name=Goga');assert code==200;study.exact(json.loads(body),study.hello('Goga'));cookie=headers['set-cookie'].split(';')[0];assert cookie.startswith('__session=')
     row['routes']=[]
     for c,b in cases if block%2==0 else list(reversed(cases)):
      c={**c,'headers':{'Cookie':cookie}}
      study.helper.load(client,server,c,b,2,8,metrics);v=study.helper.load(client,server,c,b,5,8,metrics);row['routes'].append({'name':c['name'],**v})
     row['accepted']=True
   except Exception as e:row.update(accepted=False,error=str(e))
   save();print(mode,'cookie',block+1,row['accepted'],row.get('error',''),flush=True)
 assert len(data['rows'])==12 and all(r['accepted'] for r in data['rows'])
if __name__=='__main__':main()
