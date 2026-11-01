#!/usr/bin/env python3
"""Run the declared batches and standalone control serially under host-guard.py."""
import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path

source = Path(__file__).resolve().parent
tool = source.parents[3] / 'tools/bun-aot-check/compare.py'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--work', type=Path, required=True)
parser.add_argument('--bun', type=Path, required=True)
args = parser.parse_args()
work = args.work.resolve()
bun = args.bun.resolve()


def run(command, cwd=None, capture=None):
    if capture:
        with capture.open('wb') as out:
            subprocess.run(command, cwd=cwd, stdout=out, check=True)
    else:
        subprocess.run(command, cwd=cwd, check=True)


run([sys.executable, str(source / 'run-study.py'), '--work', str(work), '--bun', str(bun)])
run([sys.executable, str(source / 'startup-study.py'), '--work', str(work),
     '--out', str(work / 'startup-control')])
static = work / 'standalone'
run([sys.executable, str(source / 'standalone/prepare.py'), '--base', str(work), '--out', str(static)])
run(['pnpm', 'install', '--frozen-lockfile', '--ignore-scripts'], cwd=static)
run([str(bun), 'run', 'generate.mjs'], cwd=static)
run([str(bun), 'run', 'contract.mjs'], cwd=static, capture=static / 'contract-source.json')
run([str(bun), 'build', 'contract.mjs', '--compile', '--format=esm', '--aot',
     '--outfile', str(static / 'contract-native')], cwd=static)
run([str(static / 'contract-native')], cwd=static, capture=static / 'contract-native.json')
assert json.loads((static / 'contract-source.json').read_text()) == json.loads((static / 'contract-native.json').read_text())
assert len(json.loads((static / 'contract-native.json').read_text())) == 4
run([sys.executable, str(tool), '--bun', str(bun), '--project', str(static),
     '--entry', 'fastify-static.mjs', '--cases', str(static / 'cases.json'),
     '--out', str(static / 'warm'), '--runs', '6', '--warmup', '3', '--seconds', '8', '--connections', '8'])
metadata = {'hashes': {name: hashlib.sha256((static / name).read_bytes()).hexdigest()
                       for name in ['package.json', 'pnpm-lock.yaml', 'serializer.cjs',
                                    'fastify-static.mjs', 'database.mjs', 'cases.json', 'fixture.sqlite']},
            'source_and_native_contract_match': True}
(static / 'completed.json').write_text(json.dumps(metadata, indent=2) + '\n')
print('All declared batches finished; audit required before any performance conclusion', flush=True)
