#!/usr/bin/env python3
"""Check public capture integrity and trial/count invariants, without a running app."""
import argparse,gzip,hashlib,json
from collections import Counter
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--results',type=Path,default=Path(__file__).parent/'results');a=p.parse_args();base=a.results.resolve()
manifest=json.loads((base/'manifest.json').read_text())
for relative,record in manifest['files'].items():
 path=(base/relative).resolve();assert path.is_relative_to(base),relative
 raw=path.read_bytes();assert len(raw)==record['bytes'] and hashlib.sha256(raw).hexdigest()==record['sha256'],relative
 if record.get('encoding')=='gzip':
  value=gzip.decompress(raw);assert len(value)==record['uncompressed_bytes'] and hashlib.sha256(value).hexdigest()==record['uncompressed_sha256'],relative

def read(name):
 path=base/name;data=path.read_bytes();return json.loads(gzip.decompress(data) if name.endswith('.gz') else data)
for name,digest in manifest['runner_source_sha256'].items():assert hashlib.sha256((base.parent/name).read_bytes()).hexdigest()==digest,name
tool=Path(__file__).resolve().parents[4]/'tools/bun-aot-check'
assert hashlib.sha256((tool/'compare.py').read_bytes()).hexdigest()==manifest['comparison_tool_sha256']
summary=read('summary.json');totals={'observations':0,'windows':0,'requests':0}
for filename,expected_rows,expected_routes in [('main.json.gz',36,2),('fixed-total-db.json.gz',24,1),('sustained.json.gz',4,5),('matched-clients.json.gz',24,1)]:
 data=read(filename);rows=data['rows'];assert len(rows)==expected_rows and all('error' not in r and len(r['routes'])==expected_routes for r in rows)
 for row in rows:
  for route in row['routes']:
   assert route['failures']==0 and route['requests']==sum(c['requests'] for c in route['clients'])
   assert all(c['failures']==0 and c['requests']==sum(n for _,n in c['histogram_upper_us']) for c in route['clients'])
   assert len(route['app_after'])==row['workers'] and all(m and m['physical_bytes']>0 for m in route['app_after'].values())
   if filename!='main.json.gz':assert route['database_connections_before_load']<=12 and route['database_connections_before_load']>0
   totals['windows']+=1;totals['requests']+=route['requests']
 totals['observations']+=len(rows)
 if filename=='main.json.gz':assert Counter((r['mode'],r['workers']) for r in rows)==Counter({(m,n):4 for m in ['jit','bytecode','native'] for n in [1,2,4]})
 if filename=='sustained.json.gz':assert [(r['mode'],r['workers']) for r in rows]==[('jit',1),('native',2),('native',2),('jit',1)]
 if filename=='matched-clients.json.gz':assert Counter((r['mode'],r['workers']) for r in rows)==Counter({(m,n):4 for m in ['jit','native'] for n in [1,2,4]}) and all(r['client_processes']==4 for r in rows)
assert totals==manifest['accepted_totals']
for folder,n in [('tool-example',12),('tool-api',18)]:
 data=read(folder+'/observations.json');report=read(folder+'/summary.json');assert report['complete'] and len(data['observations'])==n
 assert all(r['status']=='passed' for r in data['preflight']+data['observations'])
 assert data['metadata']['tool_sha256']==manifest['comparison_tool_sha256']
 assert all(r['failures']==0 and r['requests']==sum(v for _,v in r['histogram_upper_us']) for row in data['observations'] for r in row['routes'])
selftest=read('tool-selftest.json');assert len(selftest)==7 and all(x['exit'] in [0,1] for x in selftest)
assert selftest[0]['complete'] and all(not x['complete'] for x in selftest[1:])
print('Accepted public captures:',totals,';',len(manifest['files']),'file hashes')
print('This audits retained data and delivery integrity; it is not an independent operator replication.')
