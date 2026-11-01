#!/usr/bin/env python3
import argparse,json,statistics,hashlib
from pathlib import Path

def stats(v):return {'n':len(v),'median':statistics.median(v),'min':min(v),'max':max(v)}
def main():
 p=argparse.ArgumentParser();p.add_argument('--lab',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();assert not a.out.exists();a.out.mkdir(parents=True)
 summary={'batches':{},'comparisons':[],'limits':['Shared Mac; same-host closed-loop clients; eight connections; no CPU/RAM cap.','macOS physical footprint, RSS, executable bytes and extracted file bytes are distinct.','Keryx compares source execution with a named native packaging variant; ordinary packaged JIT failed before help.','Next compares matched launchers; disk-loaded Next JS remains interpreted.','Selected complete output checks are not whole-application certification or maintainer adoption.']}
 for project in ['keryx','next']:
  for stage,count in ([('startup',24),('load',12),('cookie',12),('external',12)] if project=='keryx' else [('startup',24),('load',12)]):
   f=a.lab/f'{project}-{stage}'/'observations.json';data=json.loads(f.read_text());rows=data['rows'];assert len(rows)==count and all(x['accepted'] for x in rows),(project,stage)
   batch={'source_sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'metadata':data['metadata'],'observations':len(rows),'checked_response_cases':sum(len(x['checks']) for x in rows),'groups':[],'timed_windows':0,'timed_checked_responses':0,'preextraction':data.get('preextraction')}
   for mode in sorted(set(x['mode'] for x in rows)):
    group=[x for x in rows if x['mode']==mode];g={'mode':mode,'ready_ms':stats([x['ready_ms'] for x in group]),'ready_physical_bytes':stats([x['ready_memory']['physical_footprint_bytes'] for x in group]),'routes':[]}
    assert len(set(x['binary_sha256'] for x in group))==1;g['binary_sha256']=group[0]['binary_sha256']
    if stage in ('load','cookie','external'):
     for name in sorted(set(r['name'] for x in group for r in x['routes'])):
      route=[r for x in group for r in x['routes'] if r['name']==name];assert len(route)==6
      for r in route:assert r['failures']==0 and r['requests']==sum(n for _,n in r['histogram_upper_us']) and r['seconds']>=5 and r['requests']>0
      assert len(set(r['response_sha256'] for r in route))==1
      item={'name':name,'rps':stats([r['rps'] for r in route]),'app_cpu_percent':stats([r['cpu_percent'] for r in route]),'end_physical_bytes':stats([r['after']['physical_footprint_bytes'] for r in route]),'sampled_peak_physical_bytes':stats([max(s['physical_footprint_bytes'] for s in r['memory_samples']) for r in route]),'lifetime_peak_physical_bytes':stats([r['after']['lifetime_peak_physical_bytes'] for r in route]),'end_rss_bytes':stats([r['after']['rss_bytes'] for r in route]),'response_sha256':route[0]['response_sha256'],'requests':sum(r['requests'] for r in route)}
      if 'redis_after' in route[0]:
       item['redis_cpu_percent']=stats([r['redis_cpu_percent'] for r in route]);item['redis_physical_bytes']=stats([r['redis_after']['process']['physical_footprint_bytes'] for r in route]);item['redis_used_memory']=stats([r['redis_after']['used_memory'] for r in route]);item['redis_key_counts']=[[r['redis_before']['dbsize'],r['redis_after']['dbsize']] for r in route]
      g['routes'].append(item);batch['timed_windows']+=len(route);batch['timed_checked_responses']+=item['requests']
    batch['groups'].append(g)
   if stage in ('load','cookie','external'):
    left,right=batch['groups']
    for l in left['routes']:
     r=next(v for v in right['routes'] if v['name']==l['name']);assert l['response_sha256']==r['response_sha256']
   summary['batches'][project+'-'+stage]=batch
 summary['totals']={'fresh_processes':sum(x['observations'] for x in summary['batches'].values()),'timed_route_windows':sum(x['timed_windows'] for x in summary['batches'].values()),'timed_checked_responses':sum(x['timed_checked_responses'] for x in summary['batches'].values())}
 dynamic=json.loads((a.lab/'next-dynamic/observations.json').read_text());assert len(dynamic['rows'])==24 and all(r['accepted'] for r in dynamic['rows'])
 summary['first_dynamic_response']={'source_sha256':hashlib.sha256((a.lab/'next-dynamic/observations.json').read_bytes()).hexdigest(),'fresh_processes':24,'groups':[]}
 for mode in ['jit','native-disk']:
  group=[r for r in dynamic['rows'] if r['mode']==mode];summary['first_dynamic_response']['groups'].append({'mode':mode,**{k:stats([r[k] for r in group]) for k in ['static_ready_ms','launch_to_first_json_ms','first_json_after_static_ms','first_image_after_json_ms']}})
 summary['totals']['first_dynamic_fresh_processes']=24
 summary['timeout_comparison']={'groups':[]}
 for stage,count,segments in [('keryx-long',4,6),('timer-short',16,1),('timer-long-fixed',2,6)]:
  path=a.lab/stage/'observations.json';data=json.loads(path.read_text());rows=data['rows'];assert len(rows)==count and all(r['accepted'] for r in rows)
  batch={'source_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'metadata':data['metadata'],'observations':len(rows),'series':[],'timed_windows':0,'timed_checked_responses':0}
  for row in rows:
   routes=row['routes'];assert len(routes)==segments
   for r in routes:
    assert r['failures']==0 and r['requests']==sum(n for _,n in r['histogram_upper_us']) and r['requests']>0
    assert r['seconds']>=data['metadata'].get('measured_seconds',data['metadata'].get('seconds_per_segment'))
   assert len(set(r['redis_keys'] for r in routes))==1
   item={k:row[k] for k in ['mode','block','binary_sha256']};item.update({'rps':sum(r['requests'] for r in routes)/sum(r['seconds'] for r in routes),'physical_bytes':[r['after']['physical_footprint_bytes'] for r in routes],'app_cpu_percent':[r['cpu_percent'] for r in routes],'redis_keys':[r['redis_keys'] for r in routes],'response_sha256':routes[0]['response_sha256']})
   if 'app_heap_used_mib' in routes[0]:item['heap_used_mib']=[r['app_heap_used_mib'] for r in routes]
   batch['series'].append(item);batch['timed_windows']+=len(routes);batch['timed_checked_responses']+=sum(r['requests'] for r in routes)
  assert len(set(s['response_sha256'] for s in batch['series']))==1
  if stage=='timer-short':
   variants=['source-original','source-fixed','native-original','native-fixed']
   for variant in variants:
    group=[s for s in batch['series'] if s['mode']==variant];assert len(group)==4
    positions=[i%4 for i,r in enumerate(rows) if r['mode']==variant];assert sorted(positions)==list(range(4))
    summary['timeout_comparison']['groups'].append({'variant':variant,'rps':stats([s['rps'] for s in group]),'end_physical_bytes':stats([s['physical_bytes'][-1] for s in group]),'app_cpu_percent':stats([s['app_cpu_percent'][-1] for s in group])})
  summary['batches'][stage]=batch
 summary['totals']['extension_fresh_processes']=22
 summary['totals']['extension_timed_windows']=sum(summary['batches'][s]['timed_windows'] for s in ['keryx-long','timer-short','timer-long-fixed'])
 summary['totals']['extension_timed_checked_responses']=sum(summary['batches'][s]['timed_checked_responses'] for s in ['keryx-long','timer-short','timer-long-fixed'])
 profile=json.loads((a.lab/'session-profile.json').read_text());assert profile['after20NewRequests']-profile['before']==20 and profile['after20ReturningRequests']==profile['afterOneCookieCreated'];summary['session_profile']=profile
 (a.out/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary['totals']))
 for name,b in summary['batches'].items():
  if 'groups' not in b:continue
  for g in b['groups']:
   print(name,g['mode'],'ready ms',round(g['ready_ms']['median'],2))
   for r in g['routes']:print(' ',r['name'],round(r['rps']['median']),round(r['end_physical_bytes']['median']/1e6,1),'MB',round(r['app_cpu_percent']['median'],1),'% CPU')
if __name__=='__main__':main()
