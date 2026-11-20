"""Run small AOT correctness controls on three pinned macOS Bun binaries.

Use: python3 aot_trials.py STABLE_BUN EARLIER_CANARY NEWER_CANARY FRESH_OUTPUT
The test modules and the standalone program below are self-contained fixtures.
"""

from hashlib import file_digest
import json
import os
from pathlib import Path
import platform
import re
import subprocess
import sys


FAILED_THEN_MOCKED = {
    'backend.ts': '''import {trace} from './trace';
trace.push('real module evaluated');
throw new Error('fixture backend unavailable');
export const read = () => 'real';
''',
    'trace.ts': "export const trace: string[] = [];\n",
    'a_test.ts': '''import {expect, test} from 'bun:test';
import {trace} from './trace';
test('backend can fail in an earlier test file', async () => {
  await expect(import('./backend')).rejects.toThrow('fixture backend unavailable');
  expect(trace).toEqual(['real module evaluated']);
});
''',
    'b_test.ts': '''import {expect, mock, test} from 'bun:test';
import {trace} from './trace';
mock.module('./backend', () => ({read: () => 'saved result'}));
test('a later file can use a stand-in without re-running the real backend', async () => {
  expect((await import('./backend')).read()).toBe('saved result');
  expect(trace).toEqual(['real module evaluated']);
});
''',
}

PRELOAD_ORDER = {
    'bunfig.toml': '[test]\npreload = ["./preload.ts"]\n',
    'trace.ts': "export const trace: string[] = [];\n",
    'preload.ts': '''import {vi} from 'bun:test';
import {trace} from './trace';
vi.mock('./provider.ts', async (load: () => Promise<typeof import('./provider.ts')>) => {
  trace.push('factory');
  return {...await load(), configured: true};
});
''',
    'provider.ts': '''import {trace} from './trace';
trace.push('provider');
export const configured = false;
''',
    'observer.ts': '''import {trace} from './trace';
trace.push('observer');
''',
    'order_test.ts': '''import {expect, test} from 'bun:test';
import './observer.ts';
import {configured} from './provider.ts';
import {trace} from './trace';
test('a static dependency gets its turn before the preload factory', () => {
  console.log(JSON.stringify(trace));
  expect(configured).toBe(true);
  expect(trace).toEqual(['observer', 'provider', 'factory']);
});
''',
}

APP = '''type Assignment = {identity: string; before: string; after: string};
const rows: Assignment[] = [
  {identity: 'a', before: 'hold', after: 'hold'},
  {identity: 'b', before: 'hold', after: 'test'},
  {identity: 'c', before: 'test', after: 'test'},
];
const retained: string[] = [];
const changed: string[] = [];
for (const row of rows) {
  (row.before === row.after ? retained : changed).push(row.identity);
}
console.log(JSON.stringify({retained, changed}));
'''


def invoke(cwd, log, *argv):
    env = {'HOME': os.environ['HOME'], 'PATH': os.environ['PATH'], 'LC_ALL': 'C',
           'NO_COLOR': '1', 'CI': '1', 'BUN_ENABLE_CRASH_REPORTING': '0'}
    process = subprocess.run(argv, cwd=cwd, env=env, capture_output=True, text=True, timeout=90)
    log.write_text(process.stdout + process.stderr)
    return process


def test_case(directory, binary, aot, files):
    directory.mkdir()
    for name, contents in files.items():
        (directory / name).write_text(contents)
    flags = ['--aot'] if aot else []
    log = directory / 'test.log'
    process = invoke(directory, log, binary, 'test', *flags)
    text = log.read_text()
    count = {kind: re.search(rf'^\s*(\d+) {kind}\b', text, re.M) for kind in ('pass', 'fail')}
    return {'status': process.returncode,
            'counts': {kind: int(match[1]) if match else None for kind, match in count.items()},
            'printed_sequence': next((line for line in process.stdout.splitlines() if line.startswith('["')), None),
            'aot_diagnostic_lines': sum(line.startswith('[aot]') for line in text.splitlines())}


def path_trial(directory, stable, earlier, canary):
    directory.mkdir()
    old = directory / 'v1.json'
    new = directory / 'v2.json'
    old.write_text('{"version":1}\n')
    new.write_text('{"version":2}\n')
    active = directory / 'active.json'
    active.symlink_to(old.name)
    entry = directory / 'resolve.cjs'
    entry.write_text(f'''const fs = require('node:fs');
const path = require('node:path');
const configPath = process.argv[2];
const filename = process.argv[3] === 'read-path'
  ? configPath
  : configPath ? require.resolve(configPath) : require.resolve({json.dumps(str(active))});
console.log(JSON.stringify({{basename: path.basename(filename), data: JSON.parse(fs.readFileSync(filename, 'utf8'))}}));
''')
    executables = {}
    receipts = {}
    for label, binary in [('earlier', earlier), ('canary', canary)]:
        archive = directory / f'resolve-{label}'
        build = invoke(directory, directory / f'{label}-build.log', binary, 'build', '--compile',
                       '--aot', '--outfile', archive, entry)
        receipts[label] = {'build_status': build.returncode}
        if build.returncode == 0:
            executables[label] = archive

    def read(label, phase, *arguments):
        proc = invoke(directory, directory / f'{label}-{phase}.log', *arguments)
        return {'status': proc.returncode, 'output': json.loads(proc.stdout) if proc.returncode == 0 else None}

    receipts['source'] = {}
    for phase, target in [('before', old), ('after', new)]:
        active.unlink()
        active.symlink_to(target.name)
        receipts['source'][phase] = {
            'literal': read('source-literal', phase, stable, entry),
            'argument': read('source-argument', phase, stable, entry, active),
            'direct_read': read('source-direct', phase, stable, entry, active, 'read-path'),
        }
        for label, archive in executables.items():
            receipts[label][phase] = {
                'literal': read(f'{label}-literal', phase, archive),
                'argument': read(f'{label}-argument', phase, archive, active),
                'direct_read': read(f'{label}-direct', phase, archive, active, 'read-path'),
            }
    return receipts


def main():
    stable, earlier, canary, output = (Path(arg).resolve() for arg in sys.argv[1:])
    output.mkdir(mode=0o700)
    cases = {'failed-then-mocked': FAILED_THEN_MOCKED, 'preload-order': PRELOAD_ORDER}
    builds = {'stable': stable, 'earlier': earlier, 'canary': canary}
    report = {'machine': {'system': platform.system(), 'release': platform.release(),
                         'arch': platform.machine()}, 'binaries': {}, 'tests': {}, 'program': {}}
    for label, binary in builds.items():
        identify = invoke(output, output / f'{label}-revision.log', binary, '--revision')
        assert identify.returncode == 0
        with binary.open('rb') as file:
            report['binaries'][label] = {'revision': identify.stdout.strip(),
                                         'sha256': file_digest(file, 'sha256').hexdigest()}
        for case, files in cases.items():
            for mode in (('jit',) if label == 'stable' else ('jit', 'aot')):
                key = f'{label}-{case}-{mode}'
                report['tests'][key] = test_case(output / key, binary, mode == 'aot', files)

    app_root = output / 'program'
    app_root.mkdir()
    entry = app_root / 'compare.ts'
    entry.write_text(APP)
    expected = {'retained': ['a', 'c'], 'changed': ['b']}
    oracle = invoke(app_root, output / 'source-program.log', stable, entry)
    assert oracle.returncode == 0 and json.loads(oracle.stdout) == expected
    for mode, flags in [('bundle', []), ('aot', ['--aot'])]:
        executable = output / f'compare-{mode}'
        build = invoke(app_root, output / f'build-{mode}.log', canary, 'build', '--compile', *flags,
                       '--outfile', executable, entry)
        report['program'][mode] = {'build_status': build.returncode}
        if build.returncode == 0:
            run_dir = output / f'run-{mode}'
            run_dir.mkdir()
            proc = invoke(run_dir, output / f'run-{mode}.log', executable)
            payload = json.loads(proc.stdout) if proc.returncode == 0 else None
            report['program'][mode].update({'run_status': proc.returncode, 'output': payload,
                                            'matches_source': payload == expected,
                                            'file_bytes': executable.stat().st_size})
    report['path_resolution'] = path_trial(output / 'resolve-path', stable, earlier, canary)
    (output / 'results.json').write_text(json.dumps(report, indent=2) + '\n')


if __name__ == '__main__':
    main()
