#!/usr/bin/env python3
"""Require complete planned batches, then summarize every observation."""
import argparse, hashlib, json, random, statistics
from collections import Counter
from pathlib import Path
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--root',type=Path,required=True)
p.add_argument('--out',type=Path,required=True)
a=p.parse_args();root=a.root.resolve();out=a.out.resolve();out.mkdir(parents=True,exist_ok=True)
result={'inputs':json.loads((root/'inputs.json').read_text()),'batches':{},'comparisons':[]}
clock=result['inputs']['rusage_cpu_clock']
tick_ns=clock['numer']/clock['denom']
def cpu_ticks(memory):
    # Earlier captured fields had a misleading _ns suffix. Preserve the raw
    # observations and apply the empirically checked host clock conversion.
    return memory.get('user_ticks',memory.get('user_ns'))+memory.get('system_ticks',memory.get('system_ns'))

def describe(values):
    return dict(n=len(values),median=statistics.median(values),min=min(values),max=max(values))

for label,path,n,modes in [
    ('framework-startup','framework/startup/observations.json',24,['elysia-jit','elysia-native','elysia-plugin-jit','elysia-plugin-native','hono-jit','hono-native']),
    ('api-startup','api-startup/observations.json',24,['api-wired-jit','api-wired-native','api-plugin-jit','api-plugin-native']),
    ('framework-load','framework/load/observations.json',6,['elysia-jit','elysia-native','elysia-plugin-jit','elysia-plugin-native','hono-jit','hono-native']),
    ('api-load','api-load/observations.json',8,['api-wired-jit','api-wired-native','api-plugin-jit','api-plugin-native']),
    ('bytecode-startup','bytecode-startup/observations.json',24,['api-wired-jit','api-wired-bytecode','api-wired-native']),
    ('bytecode-load','bytecode-load/observations.json',6,['api-wired-jit','api-wired-bytecode','api-wired-native']),
    ('driver-load','driver-load/observations.json',4,['api-wired-jit','api-wired-native','api-wired-jit-postgresjs','api-wired-native-postgresjs']),
    ('framework-soak','framework/soak/observations.json',2,['elysia-jit','elysia-native']),
    ('api-soak','api-soak/observations.json',2,['api-wired-jit','api-wired-native']),
    ('framework-c1','framework/c1/observations.json',4,['elysia-jit','elysia-native']),
    ('api-c1','api-c1/observations.json',4,['api-wired-jit','api-wired-native']),
    ('framework-c32','framework/c32/observations.json',4,['elysia-jit','elysia-native']),
    ('api-c32','api-c32/observations.json',4,['api-wired-jit','api-wired-native']),
]:
    source=root/path;data=json.loads(source.read_text());rows=data['rows']
    assert len(rows)==n*len(modes),(label,len(rows),n*len(modes))
    groups=[]
    for mode in modes:
        group=[r for r in rows if r['variant']==mode]
        assert len(group)==n and sorted(r['block'] for r in group)==list(range(n))
        assert Counter(r['position'] for r in group)==Counter({position:n//len(modes) for position in range(len(modes))}),(label,mode,'unbalanced positions')
        value=dict(variant=mode,startup_ms=describe([r['ready_ms'] for r in group]),ready_physical_bytes=describe([r['ready_memory']['physical_bytes'] for r in group]),routes=[])
        if any('routes' in r for r in group):
            for route in dict.fromkeys(t['name'] for r in group for t in r['routes']):
                trials=[dict(block=r['block'],**t) for r in group for t in r['routes'] if t['name']==route]
                assert len(trials)==n and all(t['failures']==0 and t['requests']>0 for t in trials)
                for t in trials:
                    assert sum(count for _,count in t['histogram_upper_us'])==t['requests']
                    assert abs(t['requests']/t['seconds']-t['rps'])<.001
                    assert len(t['memory'])>=2
                    assert all(sample['physical_bytes']<=sample['lifetime_peak_physical_bytes'] for sample in t['memory'])
                    assert len(t['expected_sha256'])==64
                summary=dict(name=route,verified_requests=sum(t['requests'] for t in trials))
                for key in ['rps','p50_upper_us','p95_upper_us','p99_upper_us']:summary[key]=describe([t[key] for t in trials])
                summary['end_physical_bytes']=describe([t['after']['physical_bytes'] for t in trials])
                summary['sampled_peak_rss_bytes']=describe([max(m['rss_bytes'] for m in t['memory']) for t in trials])
                summary['server_cpu_percent']=describe([(cpu_ticks(t['after'])-cpu_ticks(t['before']))*tick_ns/1e9/t['seconds']*100 for t in trials])
                foreign=[t['foreign_persistent_cpu_percent'] for t in trials if t.get('foreign_persistent_cpu_percent') is not None]
                summary['foreign_persistent_cpu_percent']=describe(foreign) if foreign else None
                value['routes'].append(summary)
            value['lifetime_peak_physical_bytes']=describe([max(t['after']['lifetime_peak_physical_bytes'] for t in r['routes']) for r in group])
        groups.append(value)
    result['batches'][label]=dict(source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),observations=len(rows),groups=groups)
    if groups[0]['routes']:
        pairs_to_compare=[(v,v[:-4]+'-native') for v in modes if v.endswith('-jit')]
        if 'api-wired-bytecode' in modes:pairs_to_compare.append(('api-wired-jit','api-wired-bytecode'))
        if 'api-wired-jit-postgresjs' in modes:pairs_to_compare.append(('api-wired-jit-postgresjs','api-wired-native-postgresjs'))
        for jit,native in pairs_to_compare:
            assert native in modes
            for route in groups[0]['routes']:
                name=route['name'];pairs=[]
                for block in range(n):
                    left=next(t['rps'] for r in rows if r['variant']==jit and r['block']==block for t in r['routes'] if t['name']==name)
                    right=next(t['rps'] for r in rows if r['variant']==native and r['block']==block for t in r['routes'] if t['name']==name)
                    pairs.append(right/left)
                rng=random.Random(20261031)
                boot=sorted(statistics.median(rng.choices(pairs,k=n)) for _ in range(10000))
                result['comparisons'].append(dict(batch=label,route=name,baseline=jit,candidate=native,paired_rps_ratios=pairs,median_ratio=statistics.median(pairs),descriptive_bootstrap_95=[boot[250],boot[9749]]))
result['inference_limits']='Closed-loop client/server/database on one shared laptop. Bootstrap resamples matched blocks within this pass; it is not a cross-host or production confidence interval. Report raw spread and same-mode controls alongside ratios. Physical and RSS metrics are distinct; database memory is excluded from server memory.'
(out/'summary.json').write_text(json.dumps(result,indent=2)+'\n')
print('All main batches complete and summarized')
