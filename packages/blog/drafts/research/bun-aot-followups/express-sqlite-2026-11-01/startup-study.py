#!/usr/bin/env python3
"""Additional readiness-only distribution check; no sustained load or rebuild."""
import argparse
import importlib.util
import json
from datetime import datetime, timezone
from pathlib import Path

source = Path(__file__).resolve().parent
tool = source.parents[3] / 'tools/bun-aot-check/compare.py'
spec = importlib.util.spec_from_file_location('compare', tool)
compare = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compare)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--work', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    compare.require(not args.out.exists(), 'Use a fresh output directory')
    args.out.mkdir(parents=True)
    private = args.out / 'private'
    private.mkdir(mode=0o700)
    config = json.loads((args.work / 'cases.json').read_text())
    ready = compare.case(config['ready'], 0)
    case = compare.case(config['cases'][0], 1)
    metrics = compare.Metrics()
    rows = []
    result = {'created_at': datetime.now(timezone.utc).isoformat(), 'runs_per_fixture_mode': 30,
              'runner_sha256': compare.sha(__file__), 'observations': rows,
              'boundary': 'Third batch, declared after startup medians reversed between warm and cold batches. Same checked binaries, fresh processes, warm filesystem caches, readiness at /health. A successful business request follows readiness but no load window.'}
    for block in range(30):
        fixtures = ['express', 'fastify'] if block % 2 == 0 else ['fastify', 'express']
        for fixture in fixtures:
            warm = json.loads((args.work / (fixture + '-warm') / 'observations.json').read_text())
            builds = warm['builds']
            k = block % 3
            order = builds[k:] + builds[:k]
            if (block // 3) % 2:
                order = list(reversed(order))
            for position, build in enumerate(order):
                binary = Path(build['binary'])
                compare.require(compare.sha(binary) == build['sha256'], 'Executable changed')
                with compare.server(binary, args.work, ready, metrics,
                                    private / f"{fixture}-{build['mode']}-{block}.log", 10, 0) as server:
                    compare.request(server['port'], case)
                    rows.append({'fixture': fixture, 'mode': build['mode'], 'block': block,
                                 'position': position, 'startup_ms': server['ready_ms'],
                                 'ready_memory': server['ready_memory'], 'status': 'passed',
                                 'binary_sha256': build['sha256']})
            (args.out / 'observations.json').write_text(json.dumps(result, indent=2) + '\n')
        print('startup block', block + 1, 'passed', flush=True)
    summary = []
    for fixture in ['express', 'fastify']:
        for mode in ['jit', 'bytecode', 'aot']:
            selected = [r for r in rows if r['fixture'] == fixture and r['mode'] == mode]
            summary.append({'fixture': fixture, 'mode': mode, 'n': len(selected),
                            'startup_ms': compare.describe([r['startup_ms'] for r in selected])})
    (args.out / 'summary.json').write_text(json.dumps(summary, indent=2) + '\n')
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    main()
