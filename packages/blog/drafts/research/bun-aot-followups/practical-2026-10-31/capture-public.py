#!/usr/bin/env python3
"""Package completed numeric captures losslessly, verify sources and stamp a manifest."""
import argparse,gzip,hashlib,json,subprocess,sys,zipfile
from datetime import datetime,timezone
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--lab',type=Path,required=True);a=p.parse_args();lab=a.lab.resolve();base=Path(__file__).parent.resolve();out=base/'results';out.mkdir(exist_ok=True)
def sha(data):return hashlib.sha256(data).hexdigest()
cohorts=[('main','main.json.gz','pool-study.py'),('fixed','fixed-total-db.json.gz','pool-fixed-connections.py'),('sustained','sustained.json.gz','pool-sustained.py'),('matched-clients','matched-clients.json.gz','matched-client-pools.py')]
for folder,name,runner in cohorts:
 raw=(lab/folder/'observations.json').read_bytes();data=json.loads(raw)
 assert all('error' not in r for r in data['rows'])
 assert data['metadata']['runner_sha256']==sha((base/runner).read_bytes()),runner
 (out/name).write_bytes(gzip.compress(raw,mtime=0))
# Remove only superseded uncompressed public copies; originals stay in the lab.
for name in ['main.json','fixed-total-db.json']:(out/name).unlink(missing_ok=True)
(out/'summary.json').write_bytes((lab/'accepted/summary.json').read_bytes())
for source,dest in [('control-builds/builds.json','control-builds.json'),('selected-host-conditions.json','host-conditions.json'),('tool-selftest-v5/acceptance.json','tool-selftest.json')]:
 (out/dest).write_bytes((lab/source).read_bytes())
for source,dest in [('tool-api-v3','tool-api'),('tool-four-v3','tool-example')]:
 (out/dest).mkdir(exist_ok=True)
 for name,target in [('observations.json','observations.json'),('summary.json','summary.json'),('summary.md','report.md')]:
  (out/dest/target).write_bytes((lab/source/name).read_bytes())
responses={}
for name in ['echo','me']:
 path=next((lab/'main').glob('*-'+name+'-measure.expected'));raw=path.read_bytes();responses[name]={'sha256':sha(raw),'body_utf8':raw.decode()}
(out/'expected-responses.json').write_text(json.dumps(responses,indent=2)+'\n')
tool=base.parents[3]/'tools/bun-aot-check';assert (tool/'compare.py').exists()
archive=base.parents[3]/'public/downloads/bun-aot-check-0.1.0.zip'
subprocess.run([sys.executable,str(tool/'package.py'),'--out',str(archive)],check=True)
with zipfile.ZipFile(archive) as zipped:
 assert len(zipped.namelist())==8 and zipped.testzip() is None
 for name in zipped.namelist():assert zipped.read(name)==(tool/Path(name).name).read_bytes()
summary=json.loads((out/'summary.json').read_text())
manifest={'created_at':datetime.now(timezone.utc).isoformat(),'scope':'Owner-run numerical evidence on one shared M5 and one preview compiler. Gzip is lossless; no samples are filtered. Raw process/mail/app-command logs stay outside Git. No independent operator replication or adoption claim.','accepted_totals':{'observations':sum(b['observations'] for b in summary['batches'].values()),'windows':sum(b['timed_route_windows'] for b in summary['batches'].values()),'requests':sum(b['checked_responses'] for b in summary['batches'].values())},'comparison_tool_sha256':sha((tool/'compare.py').read_bytes()),'runner_source_sha256':{runner:sha((base/runner).read_bytes()) for _,_,runner in cohorts},'analysis_source_sha256':{name:sha((base/name).read_bytes()) for name in ['summarize-pools.py','verify-evidence.py','capture-public.py','build-pool-control.py']},'download':{'url':'https://gkoreli.com/downloads/bun-aot-check-0.1.0.zip','bytes':archive.stat().st_size,'sha256':sha(archive.read_bytes()),'entries':8},'files':{}}
assert manifest['accepted_totals']['observations']==88 and manifest['accepted_totals']['windows']==140
for path in sorted(out.rglob('*')):
 if not path.is_file() or path.name=='manifest.json':continue
 raw=path.read_bytes();record={'bytes':len(raw),'sha256':sha(raw)}
 if path.suffix=='.gz':
  value=gzip.decompress(raw);record.update(encoding='gzip',uncompressed_bytes=len(value),uncompressed_sha256=sha(value))
 manifest['files'][str(path.relative_to(out))]=record
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Public evidence packaged:',manifest['accepted_totals'],'download',manifest['download'])
