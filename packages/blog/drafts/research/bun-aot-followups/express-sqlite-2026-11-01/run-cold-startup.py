#!/usr/bin/env python3
"""Finish the two cold traces and readiness control using accepted warm binaries."""
import argparse
import subprocess
import sys
from pathlib import Path

source = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--work', type=Path, required=True)
parser.add_argument('--out', type=Path, required=True)
args = parser.parse_args()
if args.out.exists():
    parser.error('Use a fresh output directory')
args.out.mkdir(parents=True)
for fixture in ['express', 'fastify']:
    subprocess.run([
        sys.executable, str(source / 'cold-study.py'), '--project', str(args.work),
        '--warm-results', str(args.work / (fixture + '-warm')),
        '--out', str(args.out / (fixture + '-cold')), '--runs', '6',
    ], check=True)
subprocess.run([
    sys.executable, str(source / 'startup-study.py'), '--work', str(args.work),
    '--out', str(args.out / 'startup-control'),
], check=True)
print('Cold and startup batches finished; audit required', flush=True)
