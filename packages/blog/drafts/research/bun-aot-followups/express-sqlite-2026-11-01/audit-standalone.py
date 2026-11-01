#!/usr/bin/env python3
"""Audit standalone-source semantics and its separately guarded warmed batch."""
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
static = args.work / 'standalone'
inputs = json.loads((args.work / 'inputs.json').read_text())
metadata = json.loads((static / 'completed.json').read_text())
for name, expected in metadata['hashes'].items():
    assert hashlib.sha256((static / name).read_bytes()).hexdigest() == expected
assert metadata['hashes']['fixture.sqlite'] == inputs['database_sha256']
for name in ['database.mjs', 'cases.json']:
    assert metadata['hashes'][name] == inputs['source_hashes'][name]
assert (static / 'pnpm-lock.yaml').read_text().split('packages:\n', 1)[1] == (args.work / 'pnpm-lock.yaml').read_text().split('packages:\n', 1)[1]
semantic = json.loads((static / 'contract-source.json').read_text())
assert semantic == json.loads((static / 'contract-native.json').read_text())
assert metadata['source_and_native_contract_match']
assert [v['name'] for v in semantic] == ['fixture', 'extra-fields', 'numeric-string', 'missing-required']
assert all(v['same'] for v in semantic)
assert [v['throws'] for v in semantic] == [False, False, False, True]
assert [v['bytes'] for v in semantic] == [2215, 2215, 2215, None]
data = json.loads((static / 'warm/observations.json').read_text())
summary = audit.compare.summarize(data)
assert summary['complete'] and len(data['observations']) == 18
assert data['metadata']['runs'] == 6 and data['metadata']['connections'] == 8
assert data['metadata']['warmup_seconds'] == 3 and data['metadata']['seconds'] == 8
assert data['metadata']['bun_revision'] == inputs['bun_revision']
assert hashlib.sha256(audit.tool.read_bytes()).hexdigest() == inputs['reader_tool_sha256']
guard = json.loads(args.guard.read_text())
assert guard['status'] == 'completed' and guard['study_exit_code'] == 0
running = [r for r in guard['samples'] if r['stage'] == 'running']
assert len(running) >= 180 and not any(r['active_external_study'] for r in running)
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
expected = json.loads((source / 'cases.json').read_text())['cases'][0]['expected_json']
assert hashes == {hashlib.sha256(json.dumps(expected, separators=(',', ':')).encode()).hexdigest()}
for build in data['builds']:
    assert hashlib.sha256(Path(build.pop('binary')).read_bytes()).hexdigest() == build['sha256']
conditions = {
    'scope': 'Separately guarded standalone-serializer warmed batch and four source/native contract cases. This is a separate control batch, not an interleaved comparison of serializer policies.',
    'processes': 18, 'timed_windows': 18, 'checked_responses': checked,
    'response_sha256': sorted(hashes), 'running_guard_samples': len(running),
    'active_other_study_samples_during_phase': 0,
    'guard_quiet_seconds_required': guard['quiet_seconds_required'],
    'source_native_contract_cases': len(semantic),
    'boundary': 'One-second snapshots of >10% CPU processes in two known study paths, excluding owned descendants. Short-lived/unknown work and ordinary host activity remain possible. Contract coverage is four cases, not every schema feature.',
}
args.out.mkdir(parents=True, exist_ok=True)
manifest = []
for name, value, compress in [
    ('standalone-warm-guarded', data, True), ('standalone-warm-summary', summary, False),
    ('standalone-inputs', metadata, False), ('standalone-contract', semantic, False),
    ('standalone-conditions', conditions, False),
]:
    raw = (json.dumps(value, indent=2) + '\n').encode()
    stored = gzip.compress(raw, mtime=0) if compress else raw
    filename = name + ('.json.gz' if compress else '.json')
    (args.out / filename).write_bytes(stored)
    manifest.append({'file': filename, 'sha256': hashlib.sha256(stored).hexdigest(),
                     'uncompressed_sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(stored)})
(args.out / 'standalone-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
for name in ['serializer.cjs', 'pnpm-lock.yaml']:
    (source / 'standalone' / name).write_bytes((static / name).read_bytes())
print(json.dumps(conditions, indent=2))
for group in summary['groups']:
    route = group['routes'][0]
    print(group['mode'], 'requests/s', route['rps'], 'MB', route['end_memory_bytes']['median'] / 1e6,
          'CPU us/request', route['cpu_seconds_per_million'])
