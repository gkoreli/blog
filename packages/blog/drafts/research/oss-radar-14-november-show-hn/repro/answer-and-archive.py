"""Usage: python answer-and-archive.py /Flide/checkout /omnidiff /fresh/output.

Requires Pydantic (same major as pinned Flide). Executes pure answer assembly,
not a model. Creates small synthetic ZIPs, not private artifacts.
"""
import json
from pathlib import Path
import subprocess
import sys
import zipfile
flide,omni,root=map(Path,sys.argv[1:]);root.mkdir(parents=True,exist_ok=True)
sys.path.insert(0,str(flide))
from flide.api.answers import make_choice,make_score
answers={
 'peaked_first':make_choice(['first','second'],[.9,.1]).model_dump(),
 'peaked_second':make_choice(['first','second'],[.1,.9]).model_dump(),
 'uniform_binary':make_choice(['first','second'],[.5,.5]).model_dump(),
 'uniform_four':make_choice(['a','b','c','d'],[.25]*4).model_dump(),
 'bimodal_score':make_score(['low','middle','high'],[.49,.02,.49]).model_dump(),
}
# The labels above are arbitrary names for illustrating the formula;
# no empirical model calibration is inferred from these supplied probabilities.
for file,reverse,compress,changed,year in [
 ('original.zip',False,zipfile.ZIP_STORED,False,2020),
 ('repacked.zip',True,zipfile.ZIP_DEFLATED,False,2026),
 ('edited.zip',True,zipfile.ZIP_DEFLATED,True,2026),
]:
 members=[('policy.txt','allow=true\n' if changed else 'allow=false\n'),('unchanged.txt','same\n')]
 if reverse:members.reverse()
 with zipfile.ZipFile(root/file,'w',compression=compress) as z:
  for name,body in members:
   info=zipfile.ZipInfo(name,(year,1,2,3,4,6));info.compress_type=compress;z.writestr(info,body)
archives=[]
for name in ['repacked','edited']:
 p=subprocess.run([str(omni),'--mode','json','--exit-code',str(root/'original.zip'),str(root/(name+'.zip'))],capture_output=True,text=True,timeout=30)
 g=subprocess.run(['git','diff','--no-index','--',str(root/'original.zip'),str(root/(name+'.zip'))],capture_output=True,text=True)
 archives.append({'case':name,'exitCode':p.returncode,'result':json.loads(p.stdout),'gitExitCode':g.returncode,'gitReportsBinary':bool('Binary files' in g.stdout)})
result={'flideAnswers':answers,'archives':archives,'scope':'Pure answer formatting and synthetic archive contents; no GPU inference or population review accuracy.'}
(root/'results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'flideAnswers':answers,'archives':[{'case':x['case'],'exitCode':x['exitCode'],'gitExitCode':x['gitExitCode'],'gitReportsBinary':x['gitReportsBinary'],'result':x['result']} for x in archives]},indent=2))
