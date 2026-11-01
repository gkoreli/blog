#!/usr/bin/env python3
"""Accept every declared pool cell and retain CPU / DB costs beside app memory."""
import argparse,hashlib,json,statistics
from collections import Counter
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--main',type=Path,required=True);p.add_argument('--fixed',type=Path,required=True);p.add_argument('--sustained',type=Path,required=True);p.add_argument('--matched',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();a.out.mkdir(parents=True,exist_ok=True)
def stats(v):return {'n':len(v),'median':statistics.median(v),'min':min(v),'max':max(v)}
def summed(memory,key='physical_bytes'):return sum(v[key] for v in memory.values() if v is not None)
def percentile(clients,q):
 hist=Counter()
 for c in clients:
  for upper,n in c['histogram_upper_us']:hist[upper]+=n
 threshold=sum(hist.values())*q;count=0
 for upper,n in sorted(hist.items()):
  count+=n
  if count>=threshold:return upper
result={'batches':{},'comparisons':[]};body_hashes={}
for label,folder,modes,route_names in [('main',a.main,['jit','bytecode','native'],['echo','me']),('fixed-total-db',a.fixed,['jit','native'],['me']),('five-minute',a.sustained,['jit','native'],['me']),('matched-clients',a.matched,['jit','native'],['me'])]:
 data=json.loads((folder/'observations.json').read_text());rows=data['rows'];metadata=data['metadata'];repeats=2 if label=='five-minute' else 4;assert metadata['blocks']==repeats and metadata['total_connections']==32
 if label=='five-minute':
  assert metadata['segments']==5 and metadata['measured_seconds']==60
  route_names=[f'me-minute-{n}' for n in range(1,6)]
 expected_cells={('jit',1),('native',2)} if label=='five-minute' else {(mode,n) for mode in modes for n in [1,2,4]}
 assert len(rows)==len(expected_cells)*repeats
 assert Counter((r['mode'],r['workers']) for r in rows)==Counter({k:repeats for k in expected_cells})
 for block in range(repeats):assert {(r['mode'],r['workers']) for r in rows if r['block']==block}==expected_cells
 for r in rows:
  assert 'error' not in r
  assert set(v['name'] for v in r['routes'])==set(route_names)
  for v in r['routes']:
   assert v['requests']==sum(c['requests'] for c in v['clients']) and v['failures']==0 and len(v['clients'])==(4 if label=='matched-clients' else r['workers'])
   assert all(c['failures']==0 and c['requests']==sum(x[1] for x in c['histogram_upper_us']) for c in v['clients'])
   assert abs(v['rps']-v['requests']/v['seconds'])<.0001
   assert len(v['app_after'])==r['workers'] and all(x and x['physical_bytes']>0 and x['rss_bytes']>0 for x in v['app_after'].values())
   assert all(len(s['app'])==r['workers'] and all(x and x['physical_bytes']>0 for x in s['app'].values()) for s in v['memory_samples'])
   assert v['app_cpu_percent']>0 and v['database_cpu_percent']>=0 and v['client_launch_span_ms']>=0
   if label!='main':assert 0<v['database_connections_before_load']<=12
 expected_files=list(folder.glob('*.expected'));assert len(expected_files)==len(rows)*(6 if label=='five-minute' else len(route_names)*2)
 for path in expected_files:
  name=next(n for n in ['echo','me'] if '-'+n+'-' in path.name);digest=hashlib.sha256(path.read_bytes()).hexdigest();assert digest==body_hashes.setdefault(name,digest)
 groups=[]
 for mode,n in sorted(expected_cells):
  subset=[r for r in rows if r['mode']==mode and r['workers']==n];group={'mode':mode,'workers':n,'all_ready_ms':stats([r['all_ready_ms'] for r in subset]),'positions':[r['position'] for r in subset],'routes':[]}
  for name in route_names:
   values=[v for r in subset for v in r['routes'] if v['name']==name]
   g={'name':name,'verified_requests':sum(v['requests'] for v in values),'rps':stats([v['rps'] for v in values]),'end_app_physical_bytes':stats([summed(v['app_after']) for v in values]),'sampled_peak_app_physical_bytes':stats([max(summed(s['app']) for s in v['memory_samples']) for v in values]),'end_database_process_physical_sum_bytes':stats([summed(v['database_after']) for v in values]),'app_cpu_percent':stats([v['app_cpu_percent'] for v in values]),'database_cpu_percent':stats([v['database_cpu_percent'] for v in values]),'foreign_persistent_cpu_percent':stats([v['foreign_persistent_cpu_percent'] for v in values]),'p99_upper_us':stats([percentile(v['clients'],.99) for v in values]),'client_launch_span_ms':stats([v['client_launch_span_ms'] for v in values]),'database_pids_added_after_warmup':[v['database_pids_added_during_measurement'] for v in values]}
   g['server_cpu_seconds_per_million_requests']=stats([v['app_cpu_percent']/100*v['seconds']/v['requests']*1e6 for v in values])
   if label!='main':g['database_connections_before_load']=[v['database_connections_before_load'] for v in values]
   group['routes'].append(g)
  groups.append(group)
 result['batches'][label]={'metadata':metadata,'observations':len(rows),'timed_route_windows':sum(len(r['routes']) for r in rows),'checked_responses':sum(v['requests'] for r in rows for v in r['routes']),'source_sha256':hashlib.sha256((folder/'observations.json').read_bytes()).hexdigest(),'groups':groups}
 for label2,mode,workers,other_mode,other_workers in [('two-native-vs-one-jit','native',2,'jit',1),('four-native-vs-two-jit','native',4,'jit',2),('four-vs-two-native','native',4,'native',2)]:
  left=next((g for g in groups if g['mode']==mode and g['workers']==workers),None);right=next((g for g in groups if g['mode']==other_mode and g['workers']==other_workers),None)
  if left is None or right is None:continue
  for l in left['routes']:
   r=next(v for v in right['routes'] if v['name']==l['name']);ratios={k:l[k]['median']/r[k]['median'] for k in ['rps','end_app_physical_bytes','app_cpu_percent','database_cpu_percent'] if r[k]['median']>0}
   paired=[]
   for block in range(repeats):
    left_row=next(x for x in rows if x['block']==block and x['mode']==mode and x['workers']==workers);right_row=next(x for x in rows if x['block']==block and x['mode']==other_mode and x['workers']==other_workers)
    lv=next(v for v in left_row['routes'] if v['name']==l['name']);rv=next(v for v in right_row['routes'] if v['name']==l['name'])
    paired.append({'block':block,'rps':lv['rps']/rv['rps'],'app_memory':summed(lv['app_after'])/summed(rv['app_after']),'app_cpu':lv['app_cpu_percent']/rv['app_cpu_percent']})
   result['comparisons'].append({'batch':label,'comparison':label2,'route':l['name'],'ratios_of_group_medians':ratios,'within_block_ratios':paired})
long_rows=json.loads((a.sustained/'observations.json').read_text())['rows']
result['five_minute_series']=[]
for row in long_rows:
 routes=row['routes'];seconds=sum(v['seconds'] for v in routes);requests=sum(v['requests'] for v in routes)
 result['five_minute_series'].append({'block':row['block'],'mode':row['mode'],'workers':row['workers'],'measured_seconds':seconds,'checked_requests':requests,'rps':requests/seconds,'end_app_physical_bytes':summed(routes[-1]['app_after']),'first_window_app_physical_bytes':summed(routes[0]['app_after']),'app_cpu_percent':sum(v['app_cpu_percent']*v['seconds'] for v in routes)/seconds,'database_cpu_percent':sum(v['database_cpu_percent']*v['seconds'] for v in routes)/seconds})
result['response_sha256']=body_hashes
result['limits']=['One shared M5, pinned preview and cached local DB row; no enforced CPU/RAM budget.','Main: each worker can open 10 DB connections. Fixed-total control: 12 configured across all workers, with observed counts retained.','App memory is the sum of process physical footprints, not uniquely occupied OS RAM or an enforced packing test.','PostgreSQL process footprint sums can include shared accounting; do not turn their sum into machine-wide unique bytes.','CPU percentages are process CPU seconds / elapsed seconds; 100% is one core, and DB CPU is separate.','Four repetitions, equal cell counts and rotated/reversed positions; not a complete nine-position Latin square.','Same-host clients and DB can constrain scaling. Every request count is checked work, not maximum independent server capacity.']
(a.out/'summary.json').write_text(json.dumps(result,indent=2)+'\n')
print('Accepted',sum(b['observations'] for b in result['batches'].values()),'pool trials;',sum(b['timed_route_windows'] for b in result['batches'].values()),'timed windows;',sum(b['checked_responses'] for b in result['batches'].values()),'checked responses')
for label,b in result['batches'].items():
 print(label)
 for g in b['groups']:
  for v in g['routes']:print(g['mode'],g['workers'],v['name'],round(v['rps']['median']),round(v['end_app_physical_bytes']['median']/1e6,1),'appCPU',round(v['app_cpu_percent']['median']),'dbCPU',round(v['database_cpu_percent']['median']))
print(json.dumps(result['comparisons'],indent=2))
