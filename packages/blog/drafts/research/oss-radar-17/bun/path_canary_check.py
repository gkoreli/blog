"""Recheck the config symlink after Bun's path refactor on macOS ARM64.

Use: python3 path_canary_check.py STABLE_BUN NOV20_CANARY NEW_CANARY FRESH_OUTPUT
"""

from hashlib import file_digest
import json
from pathlib import Path
import platform
import sys

sys.dont_write_bytecode = True
from aot_trials import invoke, path_trial


def main(stable, previous, current, output):
    inputs = (('stable', stable), ('nov20_canary', previous), ('new_canary', current))
    output.mkdir()
    versions = {}
    for label, binary in inputs:
        revision = invoke(output, output / f'{label}-revision.log', binary, '--revision')
        revision.check_returncode()
        with binary.open('rb') as handle:
            digest = file_digest(handle, 'sha256').hexdigest()
        versions[label] = {'revision': revision.stdout.strip(), 'sha256': digest}
    result = {
        'machine': {'macos': platform.mac_ver()[0], 'arch': platform.machine()},
        'binaries': versions,
        'path_resolution': path_trial(output / 'path', stable, previous, current),
    }
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main(*(Path(arg).resolve() for arg in sys.argv[1:]))
