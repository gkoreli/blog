"""Verify an ordinary restic restore over populated synthetic targets.

Use: python3 restore_links_trial.py RESTIC_BINARY FRESH_OUTPUT_DIRECTORY
"""

from hashlib import file_digest, sha256
import json
import os
from pathlib import Path
import platform
from random import Random
import shutil
import subprocess
import sys


def same_file(left, right):
    return os.path.samestat(left.stat(), right.stat())


def digest(path):
    with path.open('rb') as handle:
        return file_digest(handle, 'sha256').hexdigest()


def main(binary, output):
    output.mkdir()
    password = output / 'fixture-password.txt'
    password.write_text('synthetic-local-repository\n')
    options = ['--repo', str(output / 'repo'), '--password-file', str(password),
               '--cache-dir', str(output / 'cache')]
    env = {'PATH': os.environ['PATH'], 'HOME': os.environ['HOME'], 'LC_ALL': 'C'}

    def run(*arguments):
        process = subprocess.run([binary, *options, *arguments], cwd=output, env=env,
                                 capture_output=True, text=True, timeout=90)
        if process.returncode:
            raise RuntimeError(f'{arguments[0]} exited {process.returncode}: {process.stderr}')
        return process.stdout

    def backup():
        summaries = [json.loads(line) for line in run('backup', '--host', 'fixture', '--json', 'src').splitlines()]
        return next(item['snapshot_id'] for item in summaries if item['message_type'] == 'summary')

    def blobs(snapshot):
        files = json.loads(run('cat', 'tree', f'{snapshot}:/src'))['nodes']
        return next(node['content'] for node in files if node['name'] == 'data.bin')

    source = output / 'src'
    source.mkdir()
    data = source / 'data.bin'
    stock = Random(18).randbytes(8 * 1024 * 1024)
    data.write_bytes(stock)
    (source / 'labels.txt').write_text('fixture labels\n')
    os.utime(data, (1700000000, 1700000000))
    run('init')
    old_snapshot = backup()
    base = output / 'base'
    run('restore', old_snapshot, '--target', str(base))

    offset = len(stock) // 2
    updated = stock[:offset] + b'REVISED' + stock[offset + len(b'REVISED'):]
    data.write_bytes(updated)
    os.utime(data, (1700003600, 1700003600))
    new_snapshot = backup()
    old_blobs, new_blobs = blobs(old_snapshot), blobs(new_snapshot)

    observations = {}
    for label, copy_file in (('copied_target', shutil.copy2), ('hard_linked_target', os.link)):
        target = output / label
        shutil.copytree(base, target, copy_function=copy_file)
        links_before = {name: same_file(base / 'src' / name, target / 'src' / name)
                        for name in ('data.bin', 'labels.txt')}
        run('restore', new_snapshot, '--overwrite', 'if-changed', '--target', str(target))
        observations[label] = {
            'sha256': digest(target / 'src' / 'data.bin'),
            'shared_inode_before': links_before,
            'shared_inode_after': {name: same_file(base / 'src' / name, target / 'src' / name)
                                   for name in links_before},
            'unchanged_labels_match': (target / 'src' / 'labels.txt').read_bytes() == (source / 'labels.txt').read_bytes(),
        }
    print(json.dumps({
        'environment': {'platform': platform.system(), 'arch': platform.machine(),
                        'restic': run('version').strip()},
        'binary_sha256': digest(binary),
        'snapshot_blobs': {'old': len(old_blobs), 'new': len(new_blobs),
                           'common': len(set(old_blobs) & set(new_blobs))},
        'expected_sha256': {'initial': sha256(stock).hexdigest(), 'updated': sha256(updated).hexdigest()},
        'base_after_both_restores_sha256': digest(base / 'src' / 'data.bin'),
        'restored_targets': observations,
    }, indent=2))


if __name__ == '__main__':
    main(*(Path(value).resolve() for value in sys.argv[1:]))
