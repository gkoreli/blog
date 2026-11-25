"""Check a same-size edit with preserved modification time in two local tools.

Use: python3 mtime_inputs_trial.py MISE_BINARY RESTIC_BINARY FRESH_OUTPUT
The fixture writes a new task project and backup repository under FRESH_OUTPUT.
"""

from hashlib import file_digest
import json
import os
from pathlib import Path
import platform
import re
import subprocess
import sys

FIRST = 'edition-A\n'
SECOND = 'edition-B\n'
STAMP = 1700000000
CACHE_RESTORE = re.compile(r'restored outputs from cache ([0-9a-f]+)')


def fresh_input(project):
    source = project / 'src' / 'input.txt'
    source.parent.mkdir(parents=True)
    source.write_text(FIRST)
    os.utime(source, (STAMP, STAMP))
    return source


def edit_input(source):
    before = source.stat()
    source.write_text(SECOND)
    os.utime(source, ns=(before.st_atime_ns, before.st_mtime_ns))
    after = source.stat()
    edit = {'same_size': before.st_size == after.st_size,
            'same_mtime': before.st_mtime_ns == after.st_mtime_ns,
            'same_inode': before.st_ino == after.st_ino,
            'ctime_changed': before.st_ctime_ns != after.st_ctime_ns}
    assert edit['same_size'] and edit['same_mtime'] and edit['same_inode']
    return edit


def run(project, log, arguments, env):
    process = subprocess.run(arguments, cwd=project, env=env, encoding='utf-8',
                             capture_output=True, timeout=90)
    combined = process.stdout + process.stderr
    log.write_text(combined)
    if process.returncode:
        raise RuntimeError(f'{log.name} exited {process.returncode}: {combined[-1200:]}')
    return process.stdout, combined


def mise_case(binary, directory, artifact, *, hash_freshness=False):
    project = directory / 'project'
    source = fresh_input(project)
    result = project / 'dist' / 'result.txt'
    result.parent.mkdir()
    config = '[settings]\nexperimental = true\n\n'
    if hash_freshness:
        config += '[settings.task]\nsource_freshness_hash_contents = true\n\n'
    config += '''[tasks.build]
run = "cat src/input.txt > dist/result.txt"
sources = ["src/input.txt"]
outputs = ["dist/result.txt"]
'''
    if artifact:
        config += 'cache = { enabled = true, sandbox = true }\n'
    (project / 'mise.toml').write_text(config)
    env = {'PATH': '/usr/bin:/bin', 'HOME': os.environ['HOME'], 'LANG': 'C', 'NO_COLOR': '1',
           'CI': '1', 'MISE_CHECK_FOR_UPDATE': 'false', 'MISE_NOT_FOUND_AUTO_INSTALL': 'false',
           'MISE_TRUSTED_CONFIG_PATHS': str(project)}
    for storage in ('CACHE', 'CONFIG', 'DATA', 'STATE'):
        path = directory / storage.lower()
        path.mkdir()
        env[f'MISE_{storage}_DIR'] = str(path)

    def build(label, *options):
        _, diagnostic = run(project, directory / f'{label}.log',
                            [binary, 'run', *options, 'build'], env)
        match = CACHE_RESTORE.search(diagnostic)
        return {'output': result.read_text() if result.is_file() else None,
                'restored_key': match[1] if match else None,
                'skipped_as_fresh': 'sources up-to-date, skipping' in diagnostic,
                'cache_miss': 'cache miss' in diagnostic}

    evidence = {'initial': build('initial')}
    assert evidence['initial']['output'] == FIRST
    if artifact:
        result.unlink()
    evidence['unchanged_repeat'] = build('unchanged_repeat')
    evidence['edit'] = edit_input(source)
    evidence['after_edit_with_existing_output'] = build('after_edit')
    if artifact:
        result.unlink()
        evidence['after_removing_output'] = build('removed_output')
    elif not hash_freshness:
        evidence['forced_run'] = build('forced', '--force')
    return evidence


def restic_case(binary, directory):
    source = fresh_input(directory)
    env = {'PATH': os.environ['PATH'], 'HOME': os.environ['HOME'], 'LANG': 'C'}
    password = directory / 'fixture-password.txt'
    password.write_text('synthetic-repository\n')
    base = [binary, '--repo', str(directory / 'repository'),
            '--password-file', str(password), '--cache-dir', str(directory / 'cache')]
    run(directory, directory / 'repo-init.log', [*base, 'init'], env)

    def backup(label, *options):
        stdout, _ = run(directory, directory / f'{label}.log',
                        [*base, 'backup', '--json', '--host', 'fixture', *options, 'src'], env)
        events = [json.loads(line) for line in stdout.splitlines()]
        summary = next(event for event in events if event.get('message_type') == 'summary')
        snapshot = summary['snapshot_id']
        restored, _ = run(directory, directory / f'{label}-readback.log',
                          [*base, 'dump', snapshot, '/src/input.txt'], env)
        return {'readback': restored, 'files_new': summary['files_new'],
                'files_changed': summary['files_changed'], 'files_unmodified': summary['files_unmodified'],
                'data_blobs_added': summary['data_blobs']}

    evidence = {'initial': backup('initial'), 'unchanged_repeat': backup('unchanged_repeat')}
    assert evidence['initial']['readback'] == evidence['unchanged_repeat']['readback'] == FIRST
    evidence['edit'] = edit_input(source)
    evidence['incremental_after_edit'] = backup('incremental_after_edit')
    evidence['forced_reference'] = backup('forced_reference', '--force')
    assert evidence['forced_reference']['readback'] == SECOND
    return evidence


def identify(path, *arguments):
    with path.open('rb') as handle:
        digest = file_digest(handle, 'sha256').hexdigest()
    output = subprocess.check_output([path, *arguments], encoding='utf-8',
                                     env={**os.environ, 'MISE_CHECK_FOR_UPDATE': 'false'}, timeout=15)
    return {'version': output.strip(), 'sha256': digest}


def main(mise, restic, output):
    output.mkdir()
    print(json.dumps({
        'system': {'os': platform.system(), 'kernel': platform.release(), 'arch': platform.machine()},
        'mise': {'binary': identify(mise, '--version'),
                 'artifact': mise_case(mise, output / 'mise-artifact', True),
                 'default_freshness': mise_case(mise, output / 'mise-freshness', False),
                 'hash_freshness': mise_case(mise, output / 'mise-hash-freshness', False,
                                            hash_freshness=True)},
        'restic': {'binary': identify(restic, 'version'),
                   'backup': restic_case(restic, output / 'restic')},
    }, indent=2))


if __name__ == '__main__':
    main(*(Path(value).resolve() for value in sys.argv[1:]))
