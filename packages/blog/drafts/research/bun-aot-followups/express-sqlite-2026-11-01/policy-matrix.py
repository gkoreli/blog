#!/usr/bin/env python3
"""One balanced six-cell serializer-policy × runtime batch using checked binaries."""
import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path

source = Path(__file__).resolve().parent
tool = source.parents[3] / 'tools/bun-aot-check/compare.py'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--lab', type=Path, required=True)
parser.add_argument('--out', type=Path, required=True)
args = parser.parse_args()
if args.out.exists():
    parser.error('Use a fresh output directory')
args.out.mkdir(parents=True)
lab = args.lab.resolve()
default = json.loads((lab / 'accepted/fastify-warm/observations.json').read_text())
static = json.loads((lab / 'guarded/standalone/warm/observations.json').read_text())
plain = json.loads((lab / 'accepted/control-builds.json').read_text())
builds = {}
for policy, records in [('runtime', default['builds']), ('standalone', static['builds']), ('json', plain)]:
    for record in records:
        if record['mode'] not in ['jit', 'aot']:
            continue
        binary = (lab / ('accepted/fastify-json-' + record['mode'])) if policy == 'json' else Path(record['binary'])
        assert hashlib.sha256(binary.read_bytes()).hexdigest() == record['sha256']
        builds[policy + '-' + record['mode']] = {'binary': str(binary), 'sha256': record['sha256'], 'bytes': binary.stat().st_size}
project = lab / 'guarded'
inputs = json.loads((project / 'inputs.json').read_text())
assert hashlib.sha256((project / 'fixture.sqlite').read_bytes()).hexdigest() == inputs['database_sha256']
assert hashlib.sha256((project / 'cases.json').read_bytes()).hexdigest() == inputs['source_hashes']['cases.json']
order = ['runtime-jit', 'standalone-aot', 'json-jit', 'runtime-aot', 'standalone-jit', 'json-aot']
provenance = {'builds': builds, 'fixed_order': order, 'source_inputs': inputs,
              'runner_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              'scope': 'Six cyclic rotations; each policy/runtime cell occupies every run position exactly once. Same binaries/data as the earlier separately guarded studies.'}
(args.out / 'inputs.json').write_text(json.dumps(provenance, indent=2) + '\n')
command = [sys.executable, str(tool), '--project', str(project), '--cases', str(project / 'cases.json'),
           '--out', str(args.out / 'comparison'), '--runs', '6', '--warmup', '3', '--seconds', '8', '--connections', '8']
for mode in order:
    command.extend(['--binary', mode + '=' + builds[mode]['binary']])
subprocess.run(command, check=True)
