#!/usr/bin/env python3
"""Recompute the publication control from its public structured observations."""
import gzip
import hashlib
import importlib.util
import json
from pathlib import Path

root = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('audit', root / 'audit-results.py')
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)
results = root / 'results'
files = {}
for entry in json.loads((results / 'policy-matrix-manifest.json').read_text()):
    stored = (results / entry['file']).read_bytes()
    assert len(stored) == entry['bytes'] and hashlib.sha256(stored).hexdigest() == entry['sha256']
    raw = gzip.decompress(stored) if entry['file'].endswith('.gz') else stored
    assert hashlib.sha256(raw).hexdigest() == entry['uncompressed_sha256']
    files[entry['file']] = json.loads(raw)
data = files['policy-matrix-observations.json.gz']
inputs = files['policy-matrix-inputs.json']
assert audit.compare.summarize(data) == files['policy-matrix-summary.json']
assert len(data['observations']) == 36
expected = json.loads((root / 'cases.json').read_text())['cases'][0]['expected_json']
expected_sha = hashlib.sha256(json.dumps(expected, separators=(',', ':')).encode()).hexdigest()
checked = 0
for cell in inputs['fixed_order']:
    rows = [r for r in data['observations'] if r['mode'] == cell]
    assert len(rows) == 6 and {r['block'] for r in rows} == set(range(6))
    assert [sum(r['position'] == p for r in rows) for p in range(6)] == [1] * 6
    for row in rows:
        assert row['status'] == 'passed' and len(row['routes']) == 1
        assert row['routes'][0]['response_sha256'] == expected_sha
        checked += audit.verify_route(row['routes'][0])
paired = []
for block in range(6):
    rows = [r for r in data['observations'] if r['block'] == block]
    assert [r['mode'] for r in sorted(rows, key=lambda r: r['position'])] == inputs['fixed_order'][block:] + inputs['fixed_order'][:block]
    cells = {r['mode']: r['routes'][0] for r in rows}
    row = {'block': block}
    for policy in ['runtime', 'standalone', 'json']:
        j, a = cells[policy + '-jit'], cells[policy + '-aot']
        row[policy + '_aot_vs_jit_rate_pct'] = (a['rps'] / j['rps'] - 1) * 100
        row[policy + '_aot_vs_jit_cpu_pct'] = (a['cpu_seconds_per_million'] / j['cpu_seconds_per_million'] - 1) * 100
    for mode in ['jit', 'aot']:
        j, a = cells['runtime-' + mode], cells['standalone-' + mode]
        row[mode + '_standalone_vs_runtime_rate_pct'] = (a['rps'] / j['rps'] - 1) * 100
        row[mode + '_standalone_vs_runtime_cpu_pct'] = (a['cpu_seconds_per_million'] / j['cpu_seconds_per_million'] - 1) * 100
    paired.append(row)
assert paired == files['policy-matrix-pairs.json']['blocks']
summary = {k: audit.compare.describe([r[k] for r in paired]) for k in paired[0] if k != 'block'}
assert summary == files['policy-matrix-pairs.json']['summary']
assert checked == 11200026
conditions = files['policy-matrix-conditions.json']
assert conditions['checked_responses'] == checked and conditions['timed_windows'] == 36
assert conditions['active_known_competing_samples'] == 0
assert inputs['runner_sha256'] == hashlib.sha256((root / 'policy-matrix.py').read_bytes()).hexdigest()
print('Verified 36 balanced publication windows and 11,200,026 responses; paired changes and manifest hashes match.')
