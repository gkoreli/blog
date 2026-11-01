#!/usr/bin/env python3
"""Accept only the completed guarded Express phase before the later interruption."""
import argparse
import gzip
import hashlib
import importlib.util
import json
from datetime import datetime, timedelta
from pathlib import Path

source = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('audit', source / 'audit-results.py')
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--work', type=Path, required=True)
parser.add_argument('--receipt', type=Path, required=True)
parser.add_argument('--out', type=Path, required=True)
args = parser.parse_args()
data = json.loads((args.work / 'express-warm/observations.json').read_text())
summary = audit.compare.summarize(data)
assert summary['complete'] and len(data['observations']) == 18
assert data['metadata']['runs'] == 6 and data['metadata']['connections'] == 8
assert data['metadata']['warmup_seconds'] == 3 and data['metadata']['seconds'] == 8
inputs = json.loads((args.work / 'inputs.json').read_text())
assert data['metadata']['bun_revision'] == inputs['bun_revision']
assert hashlib.sha256((args.work / 'fixture.sqlite').read_bytes()).hexdigest() == inputs['database_sha256']
assert hashlib.sha256(audit.tool.read_bytes()).hexdigest() == inputs['reader_tool_sha256']
for name, expected in inputs['source_hashes'].items():
    assert hashlib.sha256((args.work / name).read_bytes()).hexdigest() == expected
watched = json.loads((args.work / 'foreign-work.json').read_text())
phase = [r for r in watched if r.get('phase') == 'express-warm']
assert len(phase) >= 180
assert not any('error' in r for r in watched)
assert not any(r['active_external_study'] for r in phase)
guard = json.loads(args.receipt.read_text())
assert guard['status'] == 'interrupted_external_activity'
first_conflict = next(r for r in guard['samples'] if r['stage'] == 'running' and r['active_external_study'])
last = data['observations'][-1]
last_route = last['routes'][0]
end_bound = datetime.fromisoformat(last['observed_at']) + timedelta(
    milliseconds=last['startup_ms'], seconds=3 + last_route['seconds'] + 1)
assert datetime.fromisoformat(first_conflict['at']) > end_bound
checked = 0
hashes = set()
for mode in ['jit', 'bytecode', 'aot']:
    rows = [r for r in data['observations'] if r['mode'] == mode]
    assert len(rows) == 6 and {r['block'] for r in rows} == set(range(6))
    assert [sum(r['position'] == p for r in rows) for p in range(3)] == [2, 2, 2]
    for row in rows:
        assert row['status'] == 'passed' and len(row['routes']) == 1
        checked += audit.verify_route(row['routes'][0])
        hashes.add(row['routes'][0]['response_sha256'])
assert len(hashes) == 1
expected = json.loads((source / 'cases.json').read_text())['cases'][0]['expected_json']
assert hashes == {hashlib.sha256(json.dumps(expected, separators=(',', ':')).encode()).hexdigest()}
for build in data['builds']:
    binary = Path(build.pop('binary'))
    assert hashlib.sha256(binary.read_bytes()).hexdigest() == build['sha256']
conditions = {
    'scope': 'Completed guarded Express warmed batch only. Later cold phase interrupted; no cold/Fastify/control performance acceptance in this receipt.',
    'processes': 18, 'timed_windows': 18, 'checked_responses': checked,
    'response_sha256': sorted(hashes), 'phase_samples': len(phase),
    'active_other_study_samples_during_phase': 0,
    'guard_quiet_seconds_required': guard['quiet_seconds_required'],
    'later_attempt_status': guard['status'],
    'phase_observation_start': phase[0]['at'], 'phase_observation_end': phase[-1]['at'],
    'later_first_conflict_at': first_conflict['at'],
    'boundary': 'One-second snapshots of >10% CPU processes in two known study paths, excluding owned descendants. Short-lived/unknown work and ordinary shared-host activity remain possible.',
}
args.out.mkdir(parents=True, exist_ok=True)
manifest = []
for name, value, compress in [
    ('express-warm-guarded', data, True), ('express-warm-summary', summary, False),
    ('express-warm-inputs', inputs, False), ('express-warm-conditions', conditions, False),
]:
    raw = (json.dumps(value, indent=2) + '\n').encode()
    stored = gzip.compress(raw, mtime=0) if compress else raw
    filename = name + ('.json.gz' if compress else '.json')
    (args.out / filename).write_bytes(stored)
    manifest.append({'file': filename, 'sha256': hashlib.sha256(stored).hexdigest(),
                     'uncompressed_sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(stored)})
(args.out / 'express-warm-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps(conditions, indent=2))
for group in summary['groups']:
    route = group['routes'][0]
    print(group['mode'], 'requests/s', route['rps'], 'MB', route['end_memory_bytes']['median'] / 1e6,
          'CPU us/request', route['cpu_seconds_per_million'])
