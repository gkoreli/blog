"""Check a new Hot Updater release with the original bare React Native fixture.

Use: python3 current_release_check.py PACKAGE_VERSION FRESH_OUTPUT
"""

import json
from pathlib import Path
import platform
import subprocess
import sys

sys.dont_write_bytecode = True
from fingerprint_trial import (
    NEW_METHOD, PLATFORMS, SPEC_PATH, build_numbers, create, hash_at_build,
    install, ios_build_script, seed, summarize, write,
)


def hashes(observations):
    return {name: observations[name]['hash'] for name in PLATFORMS}


def main(version, output):
    output.mkdir()
    project = output / version
    seed(project, version)
    release = install(project)
    record, _ = create(project, 'baseline')
    assert record['inputs']['adapter'] == 'bare'
    baseline = hashes(hash_at_build(project, 'build-baseline'))
    assert baseline == hashes(record)
    build_numbers(project, 38)
    store_bump = hashes(hash_at_build(project, 'build-numbers'))
    build_numbers(project, 37)
    write(project, SPEC_PATH, NEW_METHOD)
    spec_edit = hashes(hash_at_build(project, 'codegen-spec'))
    ios = {}
    for kind in ('Debug', 'Release'):
        result = ios_build_script(project, kind)
        ios[kind] = {'hash': result['hash'], 'warned': bool(result['warning'])}
    result = {
        'version': version,
        'machine': {'system': platform.freedesktop_os_release()['PRETTY_NAME'],
                    'arch': platform.machine(), 'python': platform.python_version(),
                    'node': subprocess.check_output(['node', '--version'], text=True).strip(),
                    'npm': subprocess.check_output(['npm', '--version'], text=True).strip()},
        'release': release, 'baseline': summarize(record), 'store_build_bump': store_bump,
        'shared_spec_edit': spec_edit, 'ios_build_headers_after_spec_edit': ios,
    }
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main(sys.argv[1], Path(sys.argv[2]).resolve())
