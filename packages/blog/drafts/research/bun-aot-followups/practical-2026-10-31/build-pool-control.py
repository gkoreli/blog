#!/usr/bin/env python3
"""Build the explicit connection-pool-size control; restore upstream source."""
import argparse,hashlib,json,subprocess,time
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
project=a.root/'sources/api/apps/elysia-api';bun=a.root/'compiler/bun-darwin-aarch64/bun';a.out.mkdir(parents=True,exist_ok=True)
source=project/'src/db.ts';original=source.read_text();assert original.count('max: 10')==2
replacement=original.replace('max: 10','max: Number(process.env.DB_POOL_MAX ?? 10)')
rows=[]
try:
 source.write_text(replacement)
 (a.out/'db-control.ts').write_text(replacement)
 for name,flags in [('jit',[]),('native',['--aot'])]:
  target=a.out/name;started=time.perf_counter()
  with (a.out/(name+'.log')).open('wb') as log:r=subprocess.run([str(bun),'build','wired-entry.ts','--compile',*flags,'--outfile',str(target)],cwd=project,stdout=log,stderr=log)
  assert r.returncode==0,(name,r.returncode)
  rows.append({'name':name,'flags':flags,'source_change':'DB_POOL_MAX replaces literal 10 in both existing driver configurations','upstream_db_sha256':hashlib.sha256(original.encode()).hexdigest(),'overlay_db_sha256':hashlib.sha256(replacement.encode()).hexdigest(),'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'build_seconds':time.perf_counter()-started})
finally:
 source.write_text(original)
 assert source.read_text()==original
(a.out/'builds.json').write_text(json.dumps(rows,indent=2)+'\n')
print('Built two pool controls and restored upstream db.ts')
