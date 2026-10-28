import hashlib
import json
import os
import pathlib
import platform
import statistics
import subprocess
import time

root = pathlib.Path(os.environ['BENCH_ROOT']).resolve()
cli = pathlib.Path(os.environ['PNPM_CLI']).resolve()
template = root / 'template'
store = pathlib.Path(os.environ.get('BENCH_STORE', root / 'store')).resolve()
runtime = json.loads(subprocess.check_output([
    'node', '-e',
    'const os=require("node:os");console.log(JSON.stringify({node:process.version,'
    'cpu:os.cpus()[0]?.model,logicalCpus:os.cpus().length,'
    'memoryGiB:os.totalmem()/1024**3,arch:os.arch()}))'
], text=True))
pnpm_version = subprocess.check_output(['node', str(cli), '--version'], text=True).strip()
if pnpm_version != '12.14.0':
    raise RuntimeError(f'This reproduction pins pnpm 12.14.0, got {pnpm_version}')
rows = []
check = '''
const assert = require('node:assert/strict');
assert.equal(require('typescript').version, '6.0.3');
assert.equal(require('zod').z.string().parse('ok'), 'ok');
assert.equal(require('react').createElement('p').type, 'p');
assert.deepEqual(require('lodash').chunk([1,2], 1), [[1],[2]]);
assert.equal(typeof require('eslint').ESLint, 'function');
'''

def run(mode, label):
    cwd = root / f'{label}-{mode}'
    cwd.mkdir()
    for filename in ['package.json', 'pnpm-lock.yaml']:
        (cwd / filename).write_bytes((template / filename).read_bytes())
    (cwd / 'pnpm-workspace.yaml').write_text(
        f'enableGlobalVirtualStore: {str(mode == "shared").lower()}\n'
    )
    args = ['node', str(cli), 'install', '--offline', '--frozen-lockfile',
            '--ignore-scripts', '--store-dir', str(store), '--reporter', 'append-only']
    started = time.perf_counter()
    process = subprocess.run(args, cwd=cwd, text=True, capture_output=True, timeout=60)
    elapsed = time.perf_counter() - started
    (cwd / 'install.log').write_text(process.stdout + process.stderr)
    if process.returncode:
        raise RuntimeError(process.stdout + process.stderr)
    verified = subprocess.run(['node', '-e', check], cwd=cwd, text=True,
                              capture_output=True, timeout=30)
    if verified.returncode:
        raise RuntimeError(verified.stderr)
    esm_check = '''
import ts from 'typescript';
import {z} from 'zod';
import React from 'react';
import _ from 'lodash';
import {ESLint} from 'eslint';
if (ts.version !== '6.0.3' || z.string().parse('ok') !== 'ok' ||
    React.createElement('p').type !== 'p' || _.chunk([1,2],1).length !== 2 ||
    typeof ESLint !== 'function') process.exit(1);
'''
    esm = subprocess.run(['node', '--input-type=module', '-e', esm_check], cwd=cwd,
                         text=True, capture_output=True, timeout=30)
    if esm.returncode:
        raise RuntimeError(esm.stderr)
    assert (cwd / 'pnpm-lock.yaml').read_bytes() == (template / 'pnpm-lock.yaml').read_bytes()
    files = links = dirs = 0
    for parent, subdirs, filenames in os.walk(cwd / 'node_modules', followlinks=False):
        for name in subdirs + filenames:
            p = pathlib.Path(parent) / name
            if p.is_symlink(): links += 1
            elif p.is_dir(): dirs += 1
            else: files += 1
    return {'mode': mode, 'label': label, 'seconds': elapsed,
            'regularFilesInLocalNodeModules': files, 'symlinksInLocalNodeModules': links,
            'directoriesInLocalNodeModules': dirs, 'smokeCheck': 'passed',
            'esmCheck': 'passed',
            'lockfileUnchanged': True,
            'zodRealpath': str((cwd / 'node_modules/zod').resolve())
                .replace(str(store), '<store>').replace(str(root), '<scratch>')}

for mode in ['default', 'shared']:
    rows.append(run(mode, 'warmup'))
for pair in range(5):
    order = ['default', 'shared'] if pair % 2 == 0 else ['shared', 'default']
    for mode in order:
        row = run(mode, f'pair-{pair}')
        rows.append(row)
        print(json.dumps(row), flush=True)

summary = {mode: statistics.median(r['seconds'] for r in rows
           if r['mode'] == mode and r['label'] != 'warmup') for mode in ['default', 'shared']}
result = {'measuredAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
          'os': platform.platform(), 'pnpm': pnpm_version, 'node': runtime.pop('node'),
          'machine': {**runtime, 'filesystem': os.environ.get('BENCH_FILESYSTEM', 'unreported'),
                      'macos': platform.mac_ver()[0]},
          'packages': 90, 'rows': rows, 'medianSeconds': summary,
          'lockfileSha256': hashlib.sha256((template / 'pnpm-lock.yaml').read_bytes()).hexdigest(),
          'conditions': 'Fresh directories; shared warm store; offline; scripts disabled; five alternating pairs after one warmup per mode. Install process wall time only; file creation outside install, smoke checks and traversal excluded. Shared host, no CPU isolation. Not T3 Code; no Git checkout, build, native install scripts, Linux leg or cold-cache measurement.'}
(root / 'results.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'medianSeconds': summary}), flush=True)
