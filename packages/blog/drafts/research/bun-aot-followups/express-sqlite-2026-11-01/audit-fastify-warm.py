#!/usr/bin/env python3
"""Audit a separately guarded Fastify batch using the original checked binaries."""
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
parser.add_argument('--input-work', type=Path, required=True)
parser.add_argument('--capture', type=Path, required=True)
parser.add_argument('--guard', type=Path, required=True)
parser.add_argument('--out', type=Path, required=True)
parser.add_argument('--json-control', action='store_true')
args = parser.parse_args()
inputs = json.loads((args.input_work / 'inputs.json').read_text())
origin = json.loads((args.input_work / 'fastify-warm/observations.json').read_text())
modes = ['jit', 'aot'] if args.json_control else ['jit', 'bytecode', 'aot']
window_count = len(modes) * 6
prefix = 'json-warm' if args.json_control else 'fastify-warm'
data = json.loads((args.capture / 'observations.json').read_text())
summary = audit.compare.summarize(data)
assert summary['complete'] and len(data['observations']) == window_count
assert data['metadata']['runs'] == 6 and data['metadata']['connections'] == 8
assert data['metadata']['warmup_seconds'] == 3 and data['metadata']['seconds'] == 8
assert origin['metadata']['bun_revision'] == inputs['bun_revision']
assert hashlib.sha256(audit.tool.read_bytes()).hexdigest() == inputs['reader_tool_sha256']
for name in ['fastify.mjs', 'database.mjs', 'cases.json', 'package.json', 'pnpm-lock.yaml']:
    assert hashlib.sha256((args.input_work / name).read_bytes()).hexdigest() == inputs['source_hashes'][name]
assert hashlib.sha256((args.input_work / 'fixture.sqlite').read_bytes()).hexdigest() == inputs['database_sha256']
if args.json_control:
    assert hashlib.sha256((args.input_work / 'fastify-json.mjs').read_bytes()).hexdigest() == inputs['source_hashes']['fastify-json.mjs']
    prior = {b['mode']: b for b in json.loads((args.input_work / 'control-builds.json').read_text())}
else:
    prior = {b['mode']: b for b in origin['builds']}
build_evidence = []
for build in data['builds']:
    old = prior[build['mode']]
    assert build['sha256'] == old['sha256'] and build['bytes'] == old['bytes']
    assert hashlib.sha256(Path(build.pop('binary')).read_bytes()).hexdigest() == old['sha256']
    build_evidence.append({k: old[k] for k in ['mode', 'flags', 'bytes', 'sha256']})
guard = json.loads(args.guard.read_text())
assert guard['status'] == 'completed' and guard['study_exit_code'] == 0
running = [r for r in guard['samples'] if r['stage'] == 'running']
assert len(running) >= window_count * 10 and not any(r['active_external_study'] for r in running)
checked = 0
hashes = set()
for mode in modes:
    rows = [r for r in data['observations'] if r['mode'] == mode]
    assert len(rows) == 6 and {r['block'] for r in rows} == set(range(6))
    assert [sum(r['position'] == p for r in rows) for p in range(len(modes))] == [6 // len(modes)] * len(modes)
    for row in rows:
        assert row['status'] == 'passed' and len(row['routes']) == 1
        checked += audit.verify_route(row['routes'][0])
        hashes.add(row['routes'][0]['response_sha256'])
expected = json.loads((source / 'cases.json').read_text())['cases'][0]['expected_json']
assert hashes == {hashlib.sha256(json.dumps(expected, separators=(',', ':')).encode()).hexdigest()}
conditions = {
    'scope': ('Separately guarded Fastify plain-JSON control; matching fixed HTTP output does not preserve every schema-specific serialization behavior.' if args.json_control else
              'Separately guarded completed Fastify warmed batch; original checked executables reused. No cold/JSON/standalone result follows from this receipt.'),
    'processes': window_count, 'timed_windows': window_count, 'checked_responses': checked,
    'response_sha256': sorted(hashes), 'running_guard_samples': len(running),
    'active_other_study_samples_during_phase': 0,
    'guard_quiet_seconds_required': guard['quiet_seconds_required'],
    'first_launch_boundary': 'These prebuilt binaries already ran in excluded exploratory batches. The first checked launch here is not the first launch of a newly built file.',
    'boundary': 'One-second snapshots of >10% CPU processes in two known study paths, excluding owned descendants. Short-lived/unknown work and ordinary host activity remain possible.',
}
args.out.mkdir(parents=True, exist_ok=True)
manifest = []
for name, value, compress in [
    (prefix + '-guarded', data, True), (prefix + '-summary', summary, False),
    (prefix + '-inputs', {'inputs': inputs, 'builds': build_evidence}, False),
    (prefix + '-conditions', conditions, False),
]:
    raw = (json.dumps(value, indent=2) + '\n').encode()
    stored = gzip.compress(raw, mtime=0) if compress else raw
    filename = name + ('.json.gz' if compress else '.json')
    (args.out / filename).write_bytes(stored)
    manifest.append({'file': filename, 'sha256': hashlib.sha256(stored).hexdigest(),
                     'uncompressed_sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(stored)})
(args.out / (prefix + '-manifest.json')).write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps(conditions, indent=2))
for group in summary['groups']:
    route = group['routes'][0]
    print(group['mode'], 'requests/s', route['rps'], 'MB', route['end_memory_bytes']['median'] / 1e6,
          'CPU us/request', route['cpu_seconds_per_million'])
