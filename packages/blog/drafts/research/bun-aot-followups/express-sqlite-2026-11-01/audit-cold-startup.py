#!/usr/bin/env python3
"""Audit both cold traces and the independent readiness distribution control."""
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
parser.add_argument('--capture', type=Path, required=True)
parser.add_argument('--guard', type=Path, required=True)
parser.add_argument('--out', type=Path, required=True)
args = parser.parse_args()
guard = json.loads(args.guard.read_text())
assert guard['status'] == 'completed' and guard['study_exit_code'] == 0
running = [r for r in guard['samples'] if r['stage'] == 'running']
assert len(running) >= 170 and not any(r['active_external_study'] for r in running)
inputs = json.loads((args.work / 'inputs.json').read_text())
assert hashlib.sha256((args.work / 'fixture.sqlite').read_bytes()).hexdigest() == inputs['database_sha256']
expected = json.loads((source / 'cases.json').read_text())['cases'][0]['expected_json']
expected_sha = hashlib.sha256(json.dumps(expected, separators=(',', ':')).encode()).hexdigest()
args.out.mkdir(parents=True, exist_ok=True)
manifest = []
summaries = {}
checked = 0
windows = 0


def save(name, value, compress=False):
    raw = (json.dumps(value, indent=2) + '\n').encode()
    stored = gzip.compress(raw, mtime=0) if compress else raw
    filename = name + ('.json.gz' if compress else '.json')
    (args.out / filename).write_bytes(stored)
    manifest.append({'file': filename, 'sha256': hashlib.sha256(stored).hexdigest(),
                     'uncompressed_sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(stored)})


for fixture in ['express', 'fastify']:
    cold = json.loads((args.capture / (fixture + '-cold/observations.json')).read_text())
    assert len(cold['observations']) == 18
    assert cold['runner_sha256'] == hashlib.sha256((source / 'cold-study.py').read_bytes()).hexdigest()
    assert cold['helper_sha256'] == inputs['reader_tool_sha256']
    warm = args.work / (fixture + '-warm/observations.json')
    assert hashlib.sha256(warm.read_bytes()).hexdigest() == cold['warm_observations_sha256']
    summary = []
    for mode in ['jit', 'bytecode', 'aot']:
        rows = [r for r in cold['observations'] if r['mode'] == mode]
        assert len(rows) == 6 and {r['block'] for r in rows} == set(range(6))
        assert [sum(r['position'] == p for r in rows) for p in range(3)] == [2, 2, 2]
        for row in rows:
            assert row['status'] == 'passed' and len(row['windows']) == 5
            assert row['first_business_ms'] > 0 and row['response_sha256'] == expected_sha
            for index, window in enumerate(row['windows']):
                assert window['index'] == index and window['response_sha256'] == expected_sha
                assert window['gap_before_seconds'] >= 0
                assert window['start_after_first_business_seconds'] >= window['gap_before_seconds']
                checked += audit.verify_route(window)
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
                'end_memory_bytes': audit.compare.describe([v['after'][cold['memory_metric']] for v in values]),
                'checked_requests': sum(v['requests'] for v in values),
            })
        summary.append(group)
    assert summary == json.loads((args.capture / (fixture + '-cold/summary.json')).read_text())
    summaries[fixture] = summary
    save(fixture + '-cold-guarded', cold, True)
assert windows == 180
startup = json.loads((args.capture / 'startup-control/observations.json').read_text())
assert len(startup['observations']) == 180
assert startup['runner_sha256'] == hashlib.sha256((source / 'startup-study.py').read_bytes()).hexdigest()
startup_summary = []
for fixture in ['express', 'fastify']:
    warm = json.loads((args.work / (fixture + '-warm/observations.json')).read_text())
    builds = {b['mode']: b for b in warm['builds']}
    for mode in ['jit', 'bytecode', 'aot']:
        rows = [r for r in startup['observations'] if r['fixture'] == fixture and r['mode'] == mode]
        assert len(rows) == 30 and {r['block'] for r in rows} == set(range(30))
        assert [sum(r['position'] == p for r in rows) for p in range(3)] == [10, 10, 10]
        assert all(r['status'] == 'passed' and r['binary_sha256'] == builds[mode]['sha256'] for r in rows)
        startup_summary.append({'fixture': fixture, 'mode': mode, 'n': 30,
                                'startup_ms': audit.compare.describe([r['startup_ms'] for r in rows])})
assert startup_summary == json.loads((args.capture / 'startup-control/summary.json').read_text())
summaries['startup-control'] = startup_summary
save('startup-control-guarded', startup, True)
save('cold-startup-summary', summaries)
save('cold-startup-conditions', {
    'scope': 'Two guarded cold traces and a separate thirty-start-per-mode/framework readiness control.',
    'cold_processes': 36, 'timed_windows': windows, 'checked_responses': checked,
    'startup_control_processes': 180, 'running_guard_samples': len(running),
    'active_other_study_samples_during_phase': 0, 'quiet_seconds_required': guard['quiet_seconds_required'],
    'boundary': 'Health readiness precedes the first business request; fresh processes use warm file caches. The client is restarted for each one-second window and gaps are retained. Known competing study paths are sampled once per second; other activity and thermal variation remain possible.',
})
(args.out / 'cold-startup-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print('Audited', windows, 'cold windows,', checked, 'responses and 180 startup-control processes')
print(json.dumps(summaries, indent=2))
