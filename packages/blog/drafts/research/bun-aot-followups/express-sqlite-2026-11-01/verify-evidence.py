#!/usr/bin/env python3
"""Verify the public checkpoints without binaries, private logs or another load run."""
import gzip
import hashlib
import importlib.util
import json
from pathlib import Path

root = Path(__file__).resolve().parent
results = root / 'results'
spec = importlib.util.spec_from_file_location('audit', root / 'audit-results.py')
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)
expected = json.loads((root / 'cases.json').read_text())['cases'][0]['expected_json']
expected_sha = hashlib.sha256(json.dumps(expected, separators=(',', ':')).encode()).hexdigest()
files = {}
for prefix in ['express-warm', 'fastify-warm', 'standalone', 'json-warm', 'cold-startup']:
    manifest = json.loads((results / (prefix + '-manifest.json')).read_text())
    for entry in manifest:
        stored = (results / entry['file']).read_bytes()
        assert len(stored) == entry['bytes']
        assert hashlib.sha256(stored).hexdigest() == entry['sha256']
        raw = gzip.decompress(stored) if entry['file'].endswith('.gz') else stored
        assert hashlib.sha256(raw).hexdigest() == entry['uncompressed_sha256']
        files[entry['file']] = json.loads(raw)
windows = 0
checked = 0
warm_builds = {}
for prefix, modes in [('express-warm', 3), ('fastify-warm', 3), ('standalone-warm', 3), ('json-warm', 2)]:
    data = files[prefix + '-guarded.json.gz']
    summary = files[prefix + '-summary.json']
    assert summary == audit.compare.summarize(data) and summary['complete']
    assert len(data['observations']) == modes * 6
    warm_builds[prefix] = {b['mode']: b for b in data['builds']}
    for mode in warm_builds[prefix]:
        rows = [r for r in data['observations'] if r['mode'] == mode]
        assert len(rows) == 6 and {r['block'] for r in rows} == set(range(6))
        assert [sum(r['position'] == p for r in rows) for p in range(modes)] == [6 // modes] * modes
        for row in rows:
            assert row['status'] == 'passed' and len(row['routes']) == 1
            value = row['routes'][0]
            assert value['response_sha256'] == expected_sha
            checked += audit.verify_route(value)
            windows += 1
assert windows == 66 and checked == 20933700
cold_summary = files['cold-startup-summary.json']
for fixture in ['express', 'fastify']:
    data = files[fixture + '-cold-guarded.json.gz']
    assert len(data['observations']) == 18
    recomputed = []
    for mode in ['jit', 'bytecode', 'aot']:
        rows = [r for r in data['observations'] if r['mode'] == mode]
        assert len(rows) == 6 and {r['block'] for r in rows} == set(range(6))
        assert [sum(r['position'] == p for r in rows) for p in range(3)] == [2, 2, 2]
        for row in rows:
            assert row['status'] == 'passed' and len(row['windows']) == 5
            assert row['response_sha256'] == expected_sha and row['first_business_ms'] > 0
            for value in row['windows']:
                assert value['response_sha256'] == expected_sha
                checked += audit.verify_route(value)
                windows += 1
        group = {'mode': mode, 'n': 6,
                 'startup_ms': audit.compare.describe([r['startup_ms'] for r in rows]),
                 'first_business_ms': audit.compare.describe([r['first_business_ms'] for r in rows]), 'windows': []}
        for index in range(5):
            values = [r['windows'][index] for r in rows]
            group['windows'].append({
                'index': index,
                **{field: audit.compare.describe([v[field] for v in values]) for field in
                   ['rps', 'cpu_seconds_per_million', 'cpu_percent', 'gap_before_seconds']},
                'end_memory_bytes': audit.compare.describe([v['after'][data['memory_metric']] for v in values]),
                'checked_requests': sum(v['requests'] for v in values),
            })
        recomputed.append(group)
    assert recomputed == cold_summary[fixture]
assert windows == 246 and checked == 27977442
startup = files['startup-control-guarded.json.gz']
assert len(startup['observations']) == 180
recomputed = []
for fixture in ['express', 'fastify']:
    builds = warm_builds[fixture + '-warm']
    for mode in ['jit', 'bytecode', 'aot']:
        rows = [r for r in startup['observations'] if r['fixture'] == fixture and r['mode'] == mode]
        assert len(rows) == 30 and {r['block'] for r in rows} == set(range(30))
        assert [sum(r['position'] == p for r in rows) for p in range(3)] == [10, 10, 10]
        assert all(r['status'] == 'passed' and r['binary_sha256'] == builds[mode]['sha256'] for r in rows)
        recomputed.append({'fixture': fixture, 'mode': mode, 'n': 30,
                           'startup_ms': audit.compare.describe([r['startup_ms'] for r in rows])})
assert recomputed == cold_summary['startup-control']
semantic = files['standalone-contract.json']
assert len(semantic) == 4 and all(r['same'] for r in semantic)
assert [r['throws'] for r in semantic] == [False, False, False, True]
plain = json.loads((results / 'serializer-contract.json').read_text())
assert [r['same_bytes'] for r in plain] == [True, False, False]
static_hashes = files['standalone-inputs.json']['hashes']
for name in ['serializer.cjs', 'pnpm-lock.yaml', 'package.json']:
    assert hashlib.sha256((root / 'standalone' / name).read_bytes()).hexdigest() == static_hashes[name]
for name in ['database.mjs', 'cases.json']:
    assert hashlib.sha256((root / name).read_bytes()).hexdigest() == static_hashes[name]
entry = "import standalone from './serializer.cjs';\n" + (root / 'fastify.mjs').read_text().replace(
    'const app = Fastify({ logger: false });',
    'const app = Fastify({ logger: false });\napp.setSerializerCompiler(() => standalone);')
assert hashlib.sha256(entry.encode()).hexdigest() == static_hashes['fastify-static.mjs']
for name in ['express-warm', 'fastify-warm', 'standalone', 'json-warm', 'cold-startup']:
    conditions = files[name + '-conditions.json']
    assert conditions['active_other_study_samples_during_phase'] == 0
guard_tests = json.loads((results / 'host-guard-tests.json').read_text())
assert guard_tests['exit_code'] == 0 and len(guard_tests['cases']) == 3
assert all(row['passed'] for row in guard_tests['cases'])
assert hashlib.sha256((root / 'test-host-guard.py').read_bytes()).hexdigest() == guard_tests['test_source_sha256']
print(f'Verified {windows} timed windows, {checked:,} checked responses, 180 startup-control processes, serializer contracts and artifact integrity.')
print('This rechecks published evidence; it does not independently rerun the applications or authenticate measurements.')
