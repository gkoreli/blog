"""Compare ordinary standalone build flags before and after Bun PR 49336.

Use: python3 aot_flags.py STABLE_BUN BEFORE_CANARY AFTER_CANARY FRESH_OUTPUT
"""

from datetime import datetime, timezone
from hashlib import file_digest
import json
import os
from pathlib import Path
import platform
import subprocess
import sys
from tempfile import TemporaryDirectory


ENTRY = 'const passes: number = 2; console.log(JSON.stringify({passes}));\n'
API = '''try {
  const result = await Bun.build({
    entrypoints: ["./entry.ts"],
    compile: { outfile: "./program", aot: true },
    bytecode: BYTECODE,
  });
  if (!result.success) throw new AggregateError(result.logs, "Build failed");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
'''
CLI_CASES = {
    'build_bytecode': ['build', '--compile', '--bytecode'],
    'build_aot': ['build', '--compile', '--aot'],
    'build_combined': ['build', '--compile', '--aot', '--bytecode'],
    'compile_bytecode': ['compile', '--bytecode'],
    'compile_no_aot_bytecode': ['compile', '--no-aot', '--bytecode'],
}
API_CASES = {'api_aot': 'false', 'api_combined': 'true'}
DIAGNOSTICS = (
    '--bytecode has no effect',
    'Cannot use both --aot and --bytecode',
    'Cannot use --bytecode with bun compile',
    'compile.aot cannot be used with bytecode',
)


def run(directory, *args):
    env = {'PATH': os.environ['PATH'], 'LC_ALL': 'C', 'NO_COLOR': '1',
           'CI': '1', 'BUN_ENABLE_CRASH_REPORTING': '0'}
    return subprocess.run(args, cwd=directory, env=env, capture_output=True,
                          encoding='utf-8', timeout=90)


def trial(root, binary, name, args):
    with TemporaryDirectory(dir=root, prefix=name + '-') as folder:
        directory = Path(folder)
        (directory / 'entry.ts').write_text(ENTRY)
        if name in API_CASES:
            (directory / 'build.mjs').write_text(API.replace('BYTECODE', API_CASES[name]))
        build = run(directory, binary, *args)
        (root / f'{name}.log').write_text(build.stdout + build.stderr)
        diagnostic = next((line.strip() for line in (build.stderr + build.stdout).splitlines()
                           if any(marker in line for marker in DIAGNOSTICS)), None)
        executable = directory / 'program'
        result = {'args': args, 'status': build.returncode, 'diagnostic': diagnostic,
                  'artifact_bytes': None, 'run': None}
        if executable.is_file():
            result['artifact_bytes'] = executable.stat().st_size
            process = run(directory, executable)
            result['run'] = {'status': process.returncode, 'stdout': process.stdout.strip()}
        return result


def main(stable, earlier, newer, output):
    output.mkdir()
    results = {
        'checked_at': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        'machine': {'macos': platform.mac_ver()[0], 'arch': platform.machine()},
        'expected_stdout': '{"passes":2}',
        'binaries': {},
    }
    for name, binary in [('stable', stable), ('earlier_canary', earlier), ('newer_canary', newer)]:
        directory = output / name
        directory.mkdir()
        with binary.open('rb') as file:
            digest = file_digest(file, 'sha256').hexdigest()
        revision = run(directory, binary, '--revision')
        revision.check_returncode()
        cli_cases = {case: [*flags, './entry.ts', '--outfile', './program']
                     for case, flags in CLI_CASES.items()}
        cases = {'build_bytecode': cli_cases['build_bytecode']}
        if name != 'stable':
            cases.update(cli_cases)
            cases.update({case: ['./build.mjs'] for case in API_CASES})
        results['binaries'][name] = {
            'revision': revision.stdout.strip(),
            'binary_sha256': digest,
            'cases': {case: trial(directory, binary, case, args) for case, args in cases.items()},
        }
    print(json.dumps(results, indent=2))


if __name__ == '__main__':
    main(*(Path(argument).resolve() for argument in sys.argv[1:]))
