#!/usr/bin/env python3
"""Audit and publish numeric evidence only; keep process inventories/logs private."""
import argparse
import gzip
import hashlib
import importlib.util
import json
from pathlib import Path

source = Path(__file__).resolve().parent
tool = source.parents[3] / 'tools/bun-aot-check/compare.py'
spec = importlib.util.spec_from_file_location('compare', tool)
compare = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compare)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def verify_route(value):
    assert value['requests'] > 0 and value['failures'] == 0
    assert value['requests'] == sum(n for _, n in value['histogram_upper_us'])
    assert value['after']['cpu_seconds'] >= value['before']['cpu_seconds']
    calculated = (value['after']['cpu_seconds'] - value['before']['cpu_seconds']) * 1e6 / value['requests']
    assert abs(calculated - value['cpu_seconds_per_million']) < 1e-8
    assert abs(value['requests'] / value['seconds'] - value['rps']) < .001
    assert value['memory_samples']
    return value['requests']


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--work', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--startup', type=Path)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    work = args.work
    inputs = json.loads((work / 'inputs.json').read_text())
    completed = json.loads((work / 'completed.json').read_text())
    assert completed['database_unchanged']
    for name, digest in inputs['source_hashes'].items():
        assert sha((work / name).read_bytes()) == digest
        if (source / name).exists():
            assert sha((source / name).read_bytes()) == digest
    assert sha(tool.read_bytes()) == inputs['reader_tool_sha256']
    assert sha((work / 'fixture.sqlite').read_bytes()) == inputs['database_sha256']
    manifest = []
    summaries = {}
    response_hashes = set()
    checked = 0
    timed_windows = 0

    def save(name, value, compress=False):
        raw = (json.dumps(value, indent=2) + '\n').encode()
        data = gzip.compress(raw, mtime=0) if compress else raw
        filename = name + ('.json.gz' if compress else '.json')
        (args.out / filename).write_bytes(data)
        manifest.append({'file': filename, 'bytes': len(data), 'sha256': sha(data),
                         'uncompressed_sha256': sha(raw)})

    for fixture, modes in [('express', 3), ('fastify', 3), ('fastify-json', 2)]:
        data = json.loads((work / (fixture + '-warm') / 'observations.json').read_text())
        summary = compare.summarize(data)
        assert summary['complete'] and len(data['observations']) == modes * 6
        assert all(b['status'] == 'passed' for b in data['builds'])
        assert all(row['status'] == 'passed' for row in data['preflight'])
        for row in data['observations']:
            assert row['status'] == 'passed' and len(row['routes']) == 1
            for route in row['routes']:
                checked += verify_route(route)
                response_hashes.add(route['response_sha256'])
                timed_windows += 1
        for mode in {row['mode'] for row in data['observations']}:
            rows = [r for r in data['observations'] if r['mode'] == mode]
            assert len(rows) == 6 and {r['block'] for r in rows} == set(range(6))
            if modes == 3:
                assert [sum(r['position'] == p for r in rows) for p in range(3)] == [2, 2, 2]
        summaries[fixture + '-warm'] = summary
        # Binary locations are machine-specific. Hashes and size identify each file.
        for build in data['builds']:
            build.pop('binary', None)
        save(fixture + '-warm', data, compress=True)
        if fixture == 'fastify-json':
            continue
        cold = json.loads((work / (fixture + '-cold') / 'observations.json').read_text())
        assert len(cold['observations']) == 18
        assert sha((work / (fixture + '-warm') / 'observations.json').read_bytes()) == cold['warm_observations_sha256']
        for row in cold['observations']:
            assert row['status'] == 'passed' and len(row['windows']) == 5
            assert row['first_business_ms'] > 0
            response_hashes.add(row['response_sha256'])
            for window in row['windows']:
                checked += verify_route(window)
                response_hashes.add(window['response_sha256'])
                timed_windows += 1
        for mode in ['jit', 'bytecode', 'aot']:
            rows = [r for r in cold['observations'] if r['mode'] == mode]
            assert len(rows) == 6 and {r['block'] for r in rows} == set(range(6))
            assert [sum(r['position'] == p for r in rows) for p in range(3)] == [2, 2, 2]
        cold_summary = []
        for mode in ['jit', 'bytecode', 'aot']:
            rows = [r for r in cold['observations'] if r['mode'] == mode]
            group = {'mode': mode, 'n': len(rows),
                     'startup_ms': compare.describe([r['startup_ms'] for r in rows]),
                     'first_business_ms': compare.describe([r['first_business_ms'] for r in rows]), 'windows': []}
            for index in range(5):
                values = [r['windows'][index] for r in rows]
                group['windows'].append({
                    'index': index,
                    **{field: compare.describe([v[field] for v in values]) for field in
                       ['rps', 'cpu_seconds_per_million', 'cpu_percent', 'gap_before_seconds']},
                    'end_memory_bytes': compare.describe([v['after'][cold['memory_metric']] for v in values]),
                    'checked_requests': sum(v['requests'] for v in values),
                })
            cold_summary.append(group)
        assert cold_summary == json.loads((work / (fixture + '-cold') / 'summary.json').read_text())
        summaries[fixture + '-cold'] = cold_summary
        save(fixture + '-cold', cold, compress=True)
    assert len(response_hashes) == 1, 'Cross-framework/mode response bytes differ'
    assert timed_windows == 228
    if args.startup:
        startup = json.loads((args.startup / 'observations.json').read_text())
        assert len(startup['observations']) == 180
        startup_summary = []
        for fixture in ['express', 'fastify']:
            for mode in ['jit', 'bytecode', 'aot']:
                rows = [r for r in startup['observations'] if r['fixture'] == fixture and r['mode'] == mode]
                assert len(rows) == 30 and {r['block'] for r in rows} == set(range(30))
                assert all(r['status'] == 'passed' and r['startup_ms'] > 0 for r in rows)
                assert [sum(r['position'] == p for r in rows) for p in range(3)] == [10, 10, 10]
                startup_summary.append({'fixture': fixture, 'mode': mode, 'n': 30,
                                        'startup_ms': compare.describe([r['startup_ms'] for r in rows])})
        assert startup_summary == json.loads((args.startup / 'summary.json').read_text())
        summaries['startup-control'] = startup_summary
        save('startup-control', startup, compress=True)
    foreign = json.loads((work / 'foreign-work.json').read_text())
    errors = [r for r in foreign if 'error' in r]
    active = [r for r in foreign if r.get('active_external_study')]
    # Retain interference honestly; a nonzero count needs review before acceptance.
    conditions = {
        'samples': len(foreign), 'sampling_errors': len(errors), 'active_other_study_samples': len(active),
        'by_phase': {phase: {'samples': sum(r.get('phase') == phase for r in foreign),
                            'active': sum(r.get('phase') == phase for r in active)}
                     for phase in sorted({r['phase'] for r in foreign if 'phase' in r})},
        'boundary': 'One-second snapshots of >10% CPU processes in the two known study paths, excluding our descendants. Short-lived work and other host activity can be missed.',
    }
    assert not errors and not active, 'Known external study overlap; preserve results and review before acceptance'
    save('conditions', conditions)
    save('inputs', inputs)
    save('completed', completed)
    save('control-builds', json.loads((work / 'control-builds.json').read_text()))
    save('summary', summaries)
    save('audit', {'warm_processes': 48, 'cold_processes': 36, 'timed_windows': timed_windows,
                   'checked_responses': checked, 'unique_response_sha256': sorted(response_hashes),
                   'reader_tool_sha256': sha(tool.read_bytes()), 'sampling_errors': len(errors),
                   'active_other_study_samples': len(active)})
    (args.out / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print('Audited', timed_windows, 'timed windows and', checked, 'checked responses')
    for fixture in ['express', 'fastify', 'fastify-json']:
        for group in summaries[fixture + '-warm']['groups']:
            route = group['routes'][0]
            print(fixture, group['mode'], 'rps', round(route['rps']['median']), 'MB',
                  round(route['end_memory_bytes']['median'] / 1e6, 2),
                  'us/request', round(route['cpu_seconds_per_million']['median'], 2))


if __name__ == '__main__':
    main()
