#!/usr/bin/env python3
"""Offline acceptance of published observations, provenance and article medians."""
import gzip, hashlib, json, math, statistics
from pathlib import Path
HERE = Path(__file__).resolve().parent
RESULTS = HERE / 'results'
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def read(name):
    path = RESULTS / name
    return json.loads(gzip.decompress(path.read_bytes()) if name.endswith('.gz') else path.read_bytes())
def near(a, b): assert math.isclose(a, b, rel_tol=1e-6, abs_tol=1e-6), (a, b)
def main():
    manifest = read('manifest.json')
    for item in manifest['files']:
        path = RESULTS / item['path']; assert sha(path) == item['sha256']
        raw = gzip.decompress(path.read_bytes()) if path.suffix == '.gz' else path.read_bytes()
        assert len(raw) == item['uncompressed_bytes'] and hashlib.sha256(raw).hexdigest() == item['uncompressed_sha256']
    for name, digest in manifest['sources'].items(): assert sha(HERE / name) == digest, name
    tool = HERE.parents[3] / 'tools/bun-aot-check'
    summary = read('summary.json'); checked = windows = processes = 0
    runner_for = {'keryx-cookie':'cookie-study.py', 'keryx-external':'external-redis.py', 'keryx-long':'long-redis.py', 'timer-short':'timer-study.py', 'timer-long-fixed':'timer-study.py'}
    for name, batch in summary['batches'].items():
        path = RESULTS / (name + '.json.gz'); raw = gzip.decompress(path.read_bytes()); data = json.loads(raw)
        assert hashlib.sha256(raw).hexdigest() == batch['source_sha256']
        rows = data['rows']; assert len(rows) == batch['observations'] and all(r['accepted'] for r in rows)
        assert data['metadata']['runner_sha256'] == sha(HERE / runner_for.get(name, 'study.py'))
        metadata = data['metadata']
        for key, file in [('study_sha256',HERE/'study.py'),('helper_sha256',tool/'compare.py'),('client_source_sha256',tool/'http-load.c')]:
            if key in metadata: assert metadata[key] == sha(file), (name,key)
        n = 0
        for row in rows:
            for route in row.get('routes', []):
                assert route['failures'] == 0 and route['requests'] > 0
                assert route['requests'] == sum(count for _,count in route['histogram_upper_us'])
                assert route['seconds'] >= metadata.get('measured_seconds',metadata.get('seconds_per_segment',5))
                assert route['after']['physical_footprint_bytes'] > 0 and route['after']['rss_bytes'] > 0
                checked += route['requests']; n += 1
        assert n == batch['timed_windows']; windows += n; processes += len(rows)
        for group in batch.get('groups', []):
            sample = [r for r in rows if r['mode']==group['mode']]
            near(statistics.median(r['ready_ms'] for r in sample),group['ready_ms']['median'])
            for r in group['routes']:
                sample_routes = [x for row in sample for x in row.get('routes',[]) if x['name']==r['name']]
                near(statistics.median(x['rps'] for x in sample_routes),r['rps']['median'])
                near(statistics.median(x['after']['physical_footprint_bytes'] for x in sample_routes),r['end_physical_bytes']['median'])
    assert (processes,windows,checked)==(118,172,56076491)
    timer = read('timer-short.json.gz')['rows']; variants=['source-original','source-fixed','native-original','native-fixed']
    for group in summary['timeout_comparison']['groups']:
        variant=group['variant']; sample=[r for r in timer if r['variant']==variant]; assert len(sample)==4
        assert sorted(i%4 for i,r in enumerate(timer) if r['variant']==variant)==list(range(4))
        near(statistics.median(r['routes'][0]['rps'] for r in sample),group['rps']['median'])
        near(statistics.median(r['routes'][0]['after']['physical_footprint_bytes'] for r in sample),group['end_physical_bytes']['median'])
    assert [round(g['rps']['median']) for g in summary['timeout_comparison']['groups']]==[40753,47789,39912,45307]
    contracts=read('timer-contracts.json'); build=read('timer-build.json')
    assert build['patch_sha256']==sha(HERE/'timer-cleanup.patch') and build['exit']==0
    for c in contracts:
        fixed=c['variant']=='fixed'; expected=0 if fixed else 1
        assert c['defaultTimersAfter20Successes']==20*expected and c['fastTimers']==expected and c['thrownTimers']==expected
        assert (c['fastStatus'],c['slowStatus'],c['thrownStatus'],c['abortObserved'])==(200,408,500,True)
        assert c['contract_sha256']==sha(HERE/'timer-contract.ts')
        assert c['connection_sha256']==build['fixed_connection_sha256' if fixed else 'original_connection_sha256']
    for name in ['keryx-long','timer-long-fixed']:
        for row in read(name+'.json.gz')['rows']:
            assert len(row['routes'])==6 and len(set(r['redis_keys'] for r in row['routes']))==1
    for row in read('timer-long-fixed.json.gz')['rows']:
        assert row['connection_source_sha256']==build['fixed_connection_sha256']
        if row['variant']=='native-fixed': assert row['binary_sha256']==build['sha256']
    dynamic=read('next-dynamic.json.gz'); assert len(dynamic['rows'])==24 and all(r['accepted'] for r in dynamic['rows'])
    assert dynamic['runner_sha256']==sha(HERE/'executed-extra-checks-v1.py')
    for name,source in [('keryx-extra','executed-extra-checks-v1.py'),('keryx-extra-v2','extra-checks.py')]:
        data=read(name+'.json.gz'); assert data['runner_sha256']==sha(HERE/source)
        if name.endswith('v2'):
            assert sum(r['accepted'] for r in data['rows'] if r['kind']=='cli')==8
            assert [(r['mode'],r['accepted']) for r in data['rows'] if r['kind']=='mcp']==[('source',True),('native',False)]
        else: assert sum(not r['accepted'] for r in data['rows'])==3
    for name in ['keryx-verify-v1','next-verify-v1']:
        data=read(name+'.json.gz'); assert len(data['rows'])==2 and all(r['accepted'] for r in data['rows'])
    for name in ['next-package-proof','next-reproduced-proof']:
        proof=read(name+'.json'); assert proof['source_hidden'] and proof['source_restored'] and len(proof['rows'])==2
        assert all(r['accepted'] and len(r['checks'])==4 for r in proof['rows'])
    proof=read('native-mcp-proof.json'); assert proof['accepted'] and proof['source_hidden'] and proof['source_restored']
    assert proof['health_checks']=={'database':True,'redis':True} and proof['child_processes']==[]
    assert proof['resource_uris']==[] and proof['ui_html_checks']==[]
    profile=read('session-profile.json'); assert [profile[k] for k in ['before','after20NewRequests','afterOneCookieCreated','after20ReturningRequests']]==[0,20,21,21]
    assert profile['runner_sha256']==sha(HERE/'session-profile.ts')
    inputs=read('inputs.json'); assert inputs['compiler_revision']=='1.4.4-canary.1+3f3a9ff87'
    assert inputs['compiler_archive_sha256']=='9878f8609a02b7b23dcbb9a1b592aa8ab820ed8652975814c5646b36957e1680'
    for name in ['keryx','next-bun-compile']: assert inputs['repositories'][name]['lock_sha256']==sha(RESULTS/(name+'-bun.lock'))
    print('Accepted: 118 startup/load/control processes, 172 timed windows, 56,076,491 checked responses; separate 24 dynamic launches and functional/failure evidence. Hashes and article medians pass.')
if __name__=='__main__': main()
