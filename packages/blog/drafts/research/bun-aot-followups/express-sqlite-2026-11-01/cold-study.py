#!/usr/bin/env python3
"""First business response and five one-second windows on fresh processes."""
import argparse
import hashlib
import importlib.util
import json
import time
from datetime import datetime, timezone
from pathlib import Path

tool = Path(__file__).resolve().parents[4] / 'tools/bun-aot-check/compare.py'
spec = importlib.util.spec_from_file_location('compare', tool)
compare = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compare)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--warm-results', type=Path, required=True)
    parser.add_argument('--project', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--runs', type=int, default=6)
    args = parser.parse_args()
    compare.require(not args.out.exists(), 'Use a fresh output directory')
    compare.require(1 <= args.runs <= 100, 'Invalid run count')
    args.out.mkdir(parents=True)
    private = args.out / 'private'
    private.mkdir(mode=0o700)
    warm = json.loads((args.warm_results / 'observations.json').read_text())
    compare.require(compare.summarize(warm)['complete'], 'Warmed correctness batch is incomplete')
    config = json.loads((args.project / 'cases.json').read_text())
    ready = compare.case(config['ready'], 0)
    case = compare.case(config['cases'][0], 1)
    client = args.warm_results / 'private/http-load'
    metrics = compare.Metrics()
    data = {
        'created_at': datetime.now(timezone.utc).isoformat(),
        'warm_observations_sha256': compare.sha(args.warm_results / 'observations.json'),
        'runner_sha256': compare.sha(__file__),
        'helper_sha256': compare.sha(tool),
        'runs_per_mode': args.runs, 'windows_per_run': 5, 'connections': 8,
        'memory_metric': metrics.memory_metric, 'observations': [],
        'limits': [
            'Fresh process with warm filesystem caches; not an OS-cold machine.',
            'Readiness checks only /health; one checked business request precedes the load.',
            'Each one-second window starts a new checked C client; retain inter-window gaps.',
            'App memory and CPU only; no CPU or RAM cap; local client shares the host.',
            'Native output lacks JIT but application, database and OS initialization can remain.',
        ],
    }
    for block in range(args.runs):
        builds = warm['builds']
        k = block % len(builds)
        order = builds[k:] + builds[:k]
        if (block // len(builds)) % 2:
            order = list(reversed(order))
        for position, build in enumerate(order):
            binary = Path(build['binary'])
            compare.require(compare.sha(binary) == build['sha256'], 'Executable hash changed')
            row = {'mode': build['mode'], 'block': block, 'position': position,
                   'status': 'running', 'windows': [], 'observed_at': datetime.now(timezone.utc).isoformat()}
            try:
                with compare.server(binary, args.project, ready, metrics,
                                    private / f"{build['mode']}-{block}.log", 10, 0) as server:
                    row['startup_ms'] = server['ready_ms']
                    row['ready_memory'] = server['ready_memory']
                    start = time.perf_counter()
                    body = compare.request(server['port'], case)
                    row['first_business_ms'] = (time.perf_counter() - start) * 1000
                    row['response_sha256'] = hashlib.sha256(body).hexdigest()
                    previous = time.perf_counter()
                    for window in range(5):
                        before = time.perf_counter()
                        value = compare.load(client, server, case, body, 1, 8, metrics)
                        row['windows'].append({
                            'index': window, 'gap_before_seconds': before - previous,
                            'start_after_first_business_seconds': before - start,
                            **value,
                        })
                        previous = time.perf_counter()
                row['status'] = 'passed'
            except Exception as error:
                row.update(status='failed', error=str(error))
                data['observations'].append(row)
                (args.out / 'observations.json').write_text(json.dumps(data, indent=2) + '\n')
                raise
            data['observations'].append(row)
            (args.out / 'observations.json').write_text(json.dumps(data, indent=2) + '\n')
            print(build['mode'], block + 1, 'passed', flush=True)
    summary = []
    for build in warm['builds']:
        rows = [r for r in data['observations'] if r['mode'] == build['mode']]
        group = {'mode': build['mode'], 'n': len(rows),
                 'startup_ms': compare.describe([r['startup_ms'] for r in rows]),
                 'first_business_ms': compare.describe([r['first_business_ms'] for r in rows]), 'windows': []}
        for index in range(5):
            values = [r['windows'][index] for r in rows]
            group['windows'].append({
                'index': index,
                **{field: compare.describe([v[field] for v in values]) for field in
                   ['rps', 'cpu_seconds_per_million', 'cpu_percent', 'gap_before_seconds']},
                'end_memory_bytes': compare.describe([v['after'][metrics.memory_metric] for v in values]),
                'checked_requests': sum(v['requests'] for v in values),
            })
        summary.append(group)
    (args.out / 'summary.json').write_text(json.dumps(summary, indent=2) + '\n')
    for group in summary:
        print(group['mode'], 'first business ms', group['first_business_ms']['median'],
              'window rps', [round(w['rps']['median']) for w in group['windows']])


if __name__ == '__main__':
    main()
