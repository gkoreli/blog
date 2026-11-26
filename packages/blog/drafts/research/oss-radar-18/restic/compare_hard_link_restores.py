"""Compare restic's populated-destination restores on two released binaries.

Use: python3 -B compare_hard_link_restores.py OLD_RESTIC NEW_RESTIC FRESH_OUTPUT
"""

import json
import os
from pathlib import Path
import platform
from random import Random
import re
import shutil
import subprocess
import sys

from restore_links_trial import digest, same_file


VERIFIED = re.compile(r'finished verifying (\d+) files')


def main(old_binary, new_binary, output):
    output.mkdir()
    password = output / 'fixture-password.txt'
    password.write_text('synthetic-local-repository\n')
    options = ['--repo', str(output / 'repo'), '--password-file', str(password)]
    env = {'PATH': os.environ['PATH'], 'HOME': os.environ['HOME'], 'LC_ALL': 'C'}

    def run(binary, label, *args, allow_failure=False):
        cache = output / f'{binary.name}-cache'
        result = subprocess.run(
            [binary, *options, '--cache-dir', str(cache), *args],
            cwd=output, env=env, capture_output=True, text=True, timeout=90,
        )
        (output / f'{label}.log').write_text(result.stdout + result.stderr)
        if result.returncode and not allow_failure:
            raise RuntimeError(f'{label} exited {result.returncode}; see its scratch log')
        return result

    def backup(label):
        result = run(old_binary, label, 'backup', '--host', 'fixture', '--json', 'src')
        events = (json.loads(line) for line in result.stdout.splitlines())
        return next(event['snapshot_id'] for event in events if event['message_type'] == 'summary')

    def blobs(snapshot, label):
        tree = run(old_binary, label, 'cat', 'tree', f'{snapshot}:/src')
        return next(node['content'] for node in json.loads(tree.stdout)['nodes'] if node['name'] == 'data.bin')

    source = output / 'src'
    source.mkdir()
    data = source / 'data.bin'
    labels = source / 'labels.txt'
    stock = Random(18).randbytes(8 * 1024 * 1024)
    labels.write_text('fixture labels\n')
    data.write_bytes(stock)
    os.utime(data, (1700000000, 1700000000))
    initial_hash = digest(data)
    run(old_binary, 'init', 'init')
    old_snapshot = backup('backup-initial')
    base = output / 'base'
    run(old_binary, 'base', 'restore', old_snapshot, '--target', str(base))

    offset = len(stock) // 2
    with data.open('r+b') as handle:
        handle.seek(offset)
        handle.write(b'REVISED')
    os.utime(data, (1700003600, 1700003600))
    updated_snapshot = backup('backup-updated')
    updated_hash = digest(data)
    updated_mtime_ns = data.stat().st_mtime_ns
    old_blobs = blobs(old_snapshot, 'tree-initial')
    updated_blobs = blobs(updated_snapshot, 'tree-updated')
    shared = len(set(old_blobs) & set(updated_blobs))
    assert 0 < shared < len(updated_blobs), 'Need both matching and changed chunks'
    base_data = base / 'src/data.bin'
    assert digest(base_data) == initial_hash

    def restore(binary, label, target, overwrite, verify):
        target_data = target / 'src/data.bin'
        inherited_link = same_file(base_data, target_data)
        args = ['restore', updated_snapshot, '--overwrite', overwrite, '--target', str(target)]
        if verify:
            args.append('--verify')
        result = run(binary, label, *args, allow_failure=True)
        metadata = target_data.stat()
        current_hash = digest(target_data)
        verified = VERIFIED.search(result.stdout + result.stderr)
        return {
            'exit_code': result.returncode,
            'sha256': current_hash,
            'matches_snapshot': current_hash == updated_hash,
            'size': metadata.st_size,
            'zero_bytes': target_data.read_bytes().count(b'\0'),
            'mtime_matches_snapshot': metadata.st_mtime_ns == updated_mtime_ns,
            'link_shared_before': inherited_link,
            'link_shared_after': same_file(base_data, target_data),
            'earlier_copy_unchanged': digest(base_data) == initial_hash,
            'labels_link_shared': same_file(base / 'src/labels.txt', target / 'src/labels.txt'),
            'files_verified': int(verified[1]) if verified else None,
        }

    versions = {}
    for binary, prefix in ((old_binary, 'previous'), (new_binary, 'current')):
        ordinary = output / f'{prefix}-ordinary'
        seeded = output / f'{prefix}-linked'
        verified = output / f'{prefix}-linked-verify'
        shutil.copytree(base, ordinary, copy_function=shutil.copy2)
        for target in (seeded, verified):
            shutil.copytree(base, target, copy_function=os.link)
        versions[prefix] = {
            'version': run(binary, f'{prefix}-version', 'version').stdout.strip(),
            'binary_sha256': digest(binary),
            'ordinary_copy': restore(binary, f'{prefix}-ordinary', ordinary, 'if-changed', False),
            'hard_link': restore(binary, f'{prefix}-linked', seeded, 'if-changed', False),
            'hard_link_with_verify': restore(binary, f'{prefix}-linked-verify', verified, 'if-changed', True),
            'if_changed_retry_with_verify': restore(binary, f'{prefix}-retry', seeded, 'if-changed', True),
            'always_retry_with_verify': restore(binary, f'{prefix}-always-retry', seeded, 'always', True),
        }

    print(json.dumps({
        'environment': {'platform': platform.system(), 'arch': platform.machine()},
        'snapshot_blobs': {'initial': len(old_blobs), 'updated': len(updated_blobs), 'shared': shared},
        'expected_snapshot': {'sha256': updated_hash, 'size': data.stat().st_size,
                              'zero_bytes': data.read_bytes().count(b'\0')},
        'earlier_copy_sha256': initial_hash,
        'versions': versions,
    }, indent=2))


if __name__ == '__main__':
    main(*(Path(arg).resolve() for arg in sys.argv[1:]))
