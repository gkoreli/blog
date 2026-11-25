"""Exercise existing-output decisions after a same-size edit in disposable fixtures.

Use: python3 -B destination_reuse_trial.py MISE_BINARY RESTIC_BINARY FRESH_OUTPUT
"""

import json
import os
from pathlib import Path
import platform
import re
import shutil
import sys

from mtime_inputs_trial import (
    CACHE_RESTORE, FIRST, edit_input, fresh_input, identify, run,
)

VERIFIED = re.compile(r'finished verifying (\d+) files')


def mise_output(binary, directory, *, artifact, hash_freshness):
    project = directory / 'project'
    fresh_input(project)
    result = project / 'dist' / 'result.txt'
    result.parent.mkdir()
    settings = '[settings]\nexperimental = true\n\n'
    if hash_freshness:
        settings += '[settings.task]\nsource_freshness_hash_contents = true\n\n'
    task = '''[tasks.build]
run = "cat src/input.txt > dist/result.txt"
sources = ["src/input.txt"]
outputs = ["dist/result.txt"]
'''
    if artifact:
        task += 'cache = { enabled = true, sandbox = true }\n'
    (project / 'mise.toml').write_text(settings + task)
    env = {'PATH': '/usr/bin:/bin', 'HOME': os.environ['HOME'], 'LANG': 'C', 'NO_COLOR': '1',
           'CI': '1', 'MISE_CHECK_FOR_UPDATE': 'false', 'MISE_NOT_FOUND_AUTO_INSTALL': 'false',
           'MISE_TRUSTED_CONFIG_PATHS': str(project)}
    for name in ('CACHE', 'CONFIG', 'DATA', 'STATE'):
        child = directory / name.lower()
        child.mkdir()
        env[f'MISE_{name}_DIR'] = str(child)

    def build(label):
        _, log = run(project, directory / f'{label}.log', [binary, 'run', 'build'], env)
        restore = CACHE_RESTORE.search(log)
        return {'output': result.read_text(),
                'skipped_as_fresh': 'sources up-to-date, skipping' in log,
                'restored_key': restore[1] if restore else None}

    evidence = {'initial': build('initial')}
    assert evidence['initial']['output'] == FIRST
    evidence['edited_output'] = edit_input(result)
    evidence['after_edit'] = build('after_edit')
    if artifact:
        result.unlink()
        evidence['after_removal'] = build('after_removal')
    evidence['source_after_runs'] = (project / 'src/input.txt').read_text()
    return evidence


def restic_targets(binary, directory):
    fresh_input(directory)
    env = {'PATH': os.environ['PATH'], 'HOME': os.environ['HOME'], 'LANG': 'C'}
    password = directory / 'fixture-password.txt'
    password.write_text('synthetic-repository\n')
    command = [binary, '--repo', str(directory / 'repository'),
               '--password-file', str(password), '--cache-dir', str(directory / 'cache')]

    def restic(label, *arguments):
        return run(directory, directory / f'{label}.log', [*command, *arguments], env)

    restic('init', 'init')
    stdout, _ = restic('backup', 'backup', '--json', '--host', 'fixture', 'src')
    events = [json.loads(line) for line in stdout.splitlines()]
    snapshot = next(item['snapshot_id'] for item in events if item.get('message_type') == 'summary')
    original, _ = restic('snapshot_read', 'dump', snapshot, '/src/input.txt')
    assert original == FIRST
    reference = directory / 'reference'
    restic('seed', 'restore', snapshot, '--target', str(reference))

    results = {}
    for label, overwrite, later_time in (
        ('if_changed_same_mtime', 'if-changed', False),
        ('if_changed_later_mtime', 'if-changed', True),
        ('always_same_mtime', 'always', False),
    ):
        target = directory / label
        shutil.copytree(reference, target)
        path = target / 'src/input.txt'
        edit = edit_input(path)
        if later_time:
            stat = path.stat()
            os.utime(path, ns=(stat.st_atime_ns, stat.st_mtime_ns + 60_000_000_000))
        peer = directory / f'{label}-peer.txt'
        os.link(path, peer)
        same_mtime = path.stat().st_mtime_ns == (reference / 'src/input.txt').stat().st_mtime_ns
        _, log = restic(label, 'restore', snapshot, '--target', str(target),
                        '--overwrite', overwrite, '--verify')
        matched = VERIFIED.search(log)
        results[label] = {'preparation_edit': edit, 'same_mtime_as_snapshot_before_restore': same_mtime,
                          'target_after': path.read_text(), 'peer_after': peer.read_text(),
                          'link_shared_after': os.path.samestat(path.stat(), peer.stat()),
                          'files_verified': int(matched[1]) if matched else None}
    return {'snapshot_contents': original, 'restore_cases': results}


def main(mise, restic, output):
    output.mkdir()
    print(json.dumps({
        'system': {'os': platform.system(), 'kernel': platform.release(), 'arch': platform.machine()},
        'mise': {'binary': identify(mise, '--version'),
                 'artifact_default_freshness': mise_output(mise, output / 'mise-artifact',
                                                           artifact=True, hash_freshness=False),
                 'artifact_content_freshness': mise_output(mise, output / 'mise-artifact-hash',
                                                           artifact=True, hash_freshness=True),
                 'ordinary_content_freshness': mise_output(mise, output / 'mise-hash',
                                                           artifact=False, hash_freshness=True)},
        'restic': {'binary': identify(restic, 'version'),
                   'destination': restic_targets(restic, output / 'restic')},
    }, indent=2))


if __name__ == '__main__':
    main(*(Path(value).resolve() for value in sys.argv[1:]))
