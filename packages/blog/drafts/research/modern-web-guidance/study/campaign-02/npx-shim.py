#!/usr/bin/env python3
"""Resolve only the frozen package, accepting npm runner flags before its name."""
import json
import os
from pathlib import Path
import subprocess
import sys
import time

argv = sys.argv[1:]
args = list(argv)
name = Path(sys.argv[0]).name
error = None
if name in ['npx', 'pnpx']:
    allowed = ['modern-web-guidance', 'modern-web-guidance@latest', 'modern-web-guidance@1.0.0']
    package_index = next((i for i, value in enumerate(args) if value in allowed), None)
    if package_index is None:
        error = 'Only the frozen modern-web-guidance package is available.'
    else:
        # npx flags (including --offline, --no-install, --no and cache options)
        # cannot trigger installs here: this wrapper invokes the pinned CLI only.
        args = args[package_index + 1:]
if os.environ.get('STUDY_MWG_AVAILABLE') != '1':
    error = 'Modern Web Guidance is not installed in this fixture.'
started = time.time()
if error:
    code = 64
    print(error, file=sys.stderr)
else:
    env = {**os.environ, 'DISABLE_TELEMETRY': '1', 'ENABLE_FILE_LOGGING': 'false'}
    code = subprocess.call([os.environ['STUDY_NODE'], os.environ['STUDY_MWG_CLI'], *args], env=env)
with open(os.environ['STUDY_LOOKUP_LOG'], 'a') as log:
    log.write(json.dumps({'at': started, 'runner': name, 'originalArgs': argv, 'args': args, 'exitCode': code, 'error': error}) + '\n')
sys.exit(code)
