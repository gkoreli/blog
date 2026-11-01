#!/usr/bin/env python3
"""Audit the balanced within-batch policy/runtime comparison and block pairs."""
import argparse
import gzip
import hashlib
import importlib.util
import json
from pathlib import Path

source = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('audit', source / 'audit-results.py')
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--work', type=Path, required=True)
parser.add_argument('--guard', type=Path, required=True)
parser.add_argument('--out', type=Path, required=True)
args = parser.parse_args()
inputs = json.loads((args.work / 'inputs.json').read_text())
data = json.loads((args.work / 'comparison/observations.json').read_text())
guard = json.loads(args.guard.read_text())
summary = audit.compare.summarize(data)
assert summary['complete'] and len(data['observations']) == 36
assert data['metadata']['runs'] == 6 and data['metadata']['connections'] == 8
assert data['metadata']['warmup_seconds'] == 3 and data['metadata']['seconds'] == 8
assert inputs['runner_sha256'] == hashlib.sha256((source / 'policy-matrix.py').read_bytes()).hexdigest()
assert data['metadata']['tool_sha256'] == inputs['source_inputs']['reader_tool_sha256']
expected = json.loads((source / 'cases.json').read_text())['cases'][0]['expected_json']
expected_sha = hashlib.sha256(json.dumps(expected, separators=(',', ':')).encode()).hexdigest()
checked = 0
for build in data['builds']:
    origin = inputs['builds'][build['mode']]
    assert build['sha256'] == origin['sha256']
    assert hashlib.sha256(Path(build['binary']).read_bytes()).hexdigest() == origin['sha256']
    build.pop('binary')
for mode in inputs['fixed_order']:
    rows = [r for r in data['observations'] if r['mode'] == mode]
    assert len(rows) == 6 and {r['block'] for r in rows} == set(range(6))
    assert [sum(r['position'] == p for r in rows) for p in range(6)] == [1] * 6
    for row in rows:
        assert row['status'] == 'passed' and len(row['routes']) == 1
        assert row['routes'][0]['response_sha256'] == expected_sha
        checked += audit.verify_route(row['routes'][0])
pairs = []
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
        baseline, prebuilt = cells['runtime-' + mode], cells['standalone-' + mode]
        row[mode + '_standalone_vs_runtime_rate_pct'] = (prebuilt['rps'] / baseline['rps'] - 1) * 100
        row[mode + '_standalone_vs_runtime_cpu_pct'] = (prebuilt['cpu_seconds_per_million'] / baseline['cpu_seconds_per_million'] - 1) * 100
    pairs.append(row)
paired_summary = {key: audit.compare.describe([r[key] for r in pairs]) for key in pairs[0] if key != 'block'}
assert guard['status'] == 'completed' and guard['study_exit_code'] == 0
running = [r for r in guard['samples'] if r['stage'] == 'running']
assert len(running) >= 360 and not any(r['active_external_study'] for r in running)
for value in inputs['builds'].values():
    value.pop('binary')
conditions = {'timed_windows': 36, 'checked_responses': checked, 'blocks': 6,
              'positions_per_cell': [1] * 6, 'running_guard_samples': len(running),
              'active_known_competing_samples': 0, 'guard_quiet_seconds': guard['quiet_seconds_required'],
              'boundary': 'Known study paths sampled once per second; ordinary/unknown activity and thermal variation remain possible. One cached-read fixture on macOS; plain JSON has different wider response behavior.'}
args.out.mkdir(parents=True, exist_ok=True)
manifest = []
for name, value, compress in [
    ('policy-matrix-observations', data, True), ('policy-matrix-summary', summary, False),
    ('policy-matrix-inputs', inputs, False), ('policy-matrix-conditions', conditions, False),
    ('policy-matrix-pairs', {'blocks': pairs, 'summary': paired_summary}, False),
]:
    raw = (json.dumps(value, indent=2) + '\n').encode()
    stored = gzip.compress(raw, mtime=0) if compress else raw
    filename = name + ('.json.gz' if compress else '.json')
    (args.out / filename).write_bytes(stored)
    manifest.append({'file': filename, 'bytes': len(stored), 'sha256': hashlib.sha256(stored).hexdigest(),
                     'uncompressed_sha256': hashlib.sha256(raw).hexdigest()})
(args.out / 'policy-matrix-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps(conditions, indent=2))
print(json.dumps(paired_summary, indent=2))
for group in summary['groups']:
    route = group['routes'][0]
    print(group['mode'], 'rps', route['rps'], 'CPU/request', route['cpu_seconds_per_million'],
          'app MB', route['end_memory_bytes']['median'] / 1e6)
