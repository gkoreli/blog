"""Reproduce the Modern Web Guidance, OmniDiff and STE80 synthetic checks.

Usage: python3 cli-fixtures.py /modern-web.mjs /omnidiff /ste_check.py /temporary/output
Requires Node and Python. Uses synthetic inputs only; disables Modern Web Guidance telemetry.
"""
import json
import os
from pathlib import Path
import subprocess
import sys
import zipfile

modern,omnidiff,ste,root=map(Path,sys.argv[1:])
root.mkdir(parents=True,exist_ok=True)
env=dict(os.environ,DISABLE_TELEMETRY='1',XDG_CONFIG_HOME=str(root/'config'))
def run(name,args):
    v=subprocess.run([str(a) for a in args],cwd=root,env=env,capture_output=True,text=True,timeout=45)
    (root/(name+'.stdout')).write_text(v.stdout)
    (root/(name+'.stderr')).write_text(v.stderr)
    return {'name':name,'exitCode':v.returncode,'stdout':v.stdout,'stderr':v.stderr}

scan=root/'web';scan.mkdir(exist_ok=True)
listener="dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });\n"
(scan/'legacy.js').write_text("const dialog=document.querySelector('dialog');\n"+listener)
(scan/'fallback.js').write_text("const dialog=document.querySelector('dialog');\nif (!('closedBy' in HTMLDialogElement.prototype)) {\n"+listener+"}\n")
results=[run('web-scan',['node',modern,'legacy-scan',scan,'--json']),
    run('web-search',['node',modern,'search','dialog backdrop click close']),
    run('web-volatile-gate',['node',modern,'retrieve','language-model'])]

(root/'before.py').write_text('def first():\n    return 10\n\ndef second():\n    return 20\n')
(root/'after.py').write_text('def second():\n    return 20\n\ndef first():\n    return 11\n')
for filename,value in [('before.zip','allow=false\n'),('after.zip','allow=true\n')]:
    with zipfile.ZipFile(root/filename,'w') as archive:
        archive.writestr('policy.txt',value);archive.writestr('unchanged.txt','same\n')
(root/'bad.zip').write_bytes(b'not actually an archive\x00\x01')
for label,a,b in [('moved-and-edited-code','before.py','after.py'),('archive-change','before.zip','after.zip'),
        ('identical','before.py','before.py'),('invalid-archive','before.zip','bad.zip')]:
    results.append(run('omnidiff-'+label,[omnidiff,'--mode','json','--exit-code',root/a,root/b]))
results.append(run('ordinary-git-archive',['git','diff','--no-index','--',root/'before.zip',root/'after.zip']))

for name,text in {
    'faithful':'The service may need two retries. The limit is 40 requests.\n',
    'fact-changed':'The service needs no retries. The limit is 400 requests.\n',
    'style-heavy':'Great question! It is important to note that we leverage robust solutions to seamlessly enhance the landscape.\n',
}.items():
    file=root/(name+'.txt');file.write_text(text)
    results.append(run('ste-'+name,[sys.executable,ste,'--json',file]))
(root/'raw-results.json').write_text(json.dumps(results,indent=2)+'\n')
print(json.dumps([{'name':r['name'],'exitCode':r['exitCode']} for r in results]))
