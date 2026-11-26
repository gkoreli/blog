"""Compare mise artifact caching with and without a declared build input.

Use: python3 cache_inputs_trial.py MISE_BINARY FRESH_OUTPUT_DIRECTORY [--read-allowance-only]
"""

import argparse
from hashlib import file_digest
import json
import os
from pathlib import Path
import platform
import subprocess


def trial(binary, root, *, sandbox, declare_mode, allow_mode=False):
    project = root / 'project'
    source = project / 'src' / 'app.txt'
    source.parent.mkdir(parents=True)
    source.write_text('application\n')
    mode = project / 'build-mode.txt'
    mode.write_text('debug\n')
    output = project / 'dist' / 'out.txt'
    output.parent.mkdir()
    command = 'value=$(cat src/app.txt build-mode.txt) && printf "%s\\n" "$value" > dist/out.txt'
    inputs = ['src/app.txt', *(['build-mode.txt'] if declare_mode else [])]
    switch = str(sandbox).lower()
    (project / 'mise.toml').write_text(
        '[settings]\nexperimental = true\n'
        '[tasks.build]\n'
        f'run = {json.dumps(command)}\n'
        f'sources = {json.dumps(inputs)}\n'
        'outputs = ["dist/out.txt"]\n'
        f'cache = {{ enabled = true, sandbox = {switch} }}\n'
    )
    env = {
        'HOME': os.environ['HOME'], 'PATH': '/usr/bin:/bin', 'LANG': 'C',
        'NO_COLOR': '1', 'CI': '1', 'MISE_CHECK_FOR_UPDATE': 'false',
        'MISE_NOT_FOUND_AUTO_INSTALL': 'false',
        'MISE_TRUSTED_CONFIG_PATHS': str(project),
    }
    for label in ('cache', 'config', 'data', 'state'):
        directory = root / label
        directory.mkdir()
        env[f'MISE_{label.upper()}_DIR'] = str(directory)

    arguments = [binary, 'run']
    if allow_mode:
        arguments.append('--allow-read=build-mode.txt')
    arguments.append('build')
    results = {}
    for phase in ('first', 'mode_changed', 'fresh_output', 'source_changed'):
        if phase == 'mode_changed':
            mode.write_text('release\n')
        if phase == 'source_changed':
            source.write_text('application-v2\n')
        output.unlink(missing_ok=True)
        run = subprocess.run(arguments, cwd=project, env=env,
                             capture_output=True, text=True, timeout=25)
        log = run.stdout + run.stderr
        (root / f'{phase}.log').write_text(log)
        results[phase] = {
            'status': run.returncode,
            'output': output.read_text() if output.is_file() else None,
            'diagnostics': [line for line in log.splitlines()
                            if any(key in line for key in ('restored outputs from cache', 'cache miss', 'cache store',
                                                           'single file', 'Permission denied',
                                                           'only enforced on Linux'))],
        }
    return {'sandbox_requested': sandbox, 'declared_inputs': inputs, 'runs': results}


def main(binary, output, *, read_allowance_only):
    output.mkdir()
    version = subprocess.check_output([binary, '--version'], text=True,
                                      env={**os.environ, 'MISE_CHECK_FOR_UPDATE': 'false'}).strip()
    with binary.open('rb') as handle:
        digest = file_digest(handle, 'sha256').hexdigest()
    if read_allowance_only:
        cases = {
            'sandbox_with_read_allowance': trial(binary, output / 'allowance', sandbox=True,
                                                 declare_mode=False, allow_mode=True),
        }
        cases['sandbox_with_read_allowance']['allowed_reads'] = ['build-mode.txt']
    else:
        cases = {
            'ordinary_cache': trial(binary, output / 'ordinary', sandbox=False, declare_mode=False),
            'sandbox_missing_input': trial(binary, output / 'missing', sandbox=True, declare_mode=False),
            'sandbox_declared_input': trial(binary, output / 'declared', sandbox=True, declare_mode=True),
        }
    results = {
        'environment': {'system': platform.system(), 'kernel': platform.release(),
                        'arch': platform.machine(), 'mise': version},
        'binary_sha256': digest,
        'cases': cases,
    }
    print(json.dumps(results, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('mise_binary', type=Path)
    parser.add_argument('fresh_output_directory', type=Path)
    parser.add_argument('--read-allowance-only', action='store_true')
    args = parser.parse_args()
    main(args.mise_binary.resolve(), args.fresh_output_directory.resolve(),
         read_allowance_only=args.read_allowance_only)
