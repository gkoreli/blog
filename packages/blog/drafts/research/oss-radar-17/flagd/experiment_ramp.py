"""Exercise flagd's documented experiment ramp and same-seed control.

In a disposable guest, run: python3 experiment_ramp.py FLAGD_BINARY FRESH_OUTPUT
The same invented identities visit every flag before and after the file edit.
"""

from collections import Counter
from hashlib import file_digest
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import time
from urllib.error import URLError
from urllib.request import ProxyHandler, Request, build_opener


OUTCOMES = ('excluded', 'test', 'control')
KEYS = [f'fixture-{index:03}' for index in range(128)]
EXPERIMENTS = ('flat', 'two-stage', 'same-seed')


def experiment(targeting):
    return {
        'state': 'ENABLED', 'variants': {name: name for name in OUTCOMES},
        'defaultVariant': 'excluded', 'targeting': targeting,
    }


def two_stage(enrollment, split_seed):
    def fractional(seed, *weights):
        return {'fractional': [
            {'cat': [{'var': '$flagd.flagKey'}, seed, {'var': 'targetingKey'}]},
            *weights,
        ]}

    return {'if': [
        {'and': [
            {'!!': [{'var': 'targetingKey'}]},
            {'==': [fractional('-gate-', ['in', enrollment], ['out', 100 - enrollment]), 'in']},
        ]},
        fractional(split_seed, ['test', 1], ['control', 1]),
    ]}


def activate(path, enrollment):
    phase = str(enrollment)
    arm = enrollment // 2
    flags = {'flags': {
        'phase': {'state': 'ENABLED', 'variants': {phase: phase}, 'defaultVariant': phase},
        'flat': experiment({'fractional': [['excluded', 100 - enrollment], ['test', arm], ['control', arm]]}),
        'two-stage': experiment(two_stage(enrollment, '-split-')),
        'same-seed': experiment(two_stage(enrollment, '-gate-')),
    }}
    pending = path.with_suffix('.next')
    pending.write_text(json.dumps(flags))
    pending.replace(path)


def open_ports():
    handles = [socket.socket() for _ in range(4)]
    try:
        for handle in handles:
            handle.bind(('127.0.0.1', 0))
        return [handle.getsockname()[1] for handle in handles]
    finally:
        for handle in handles:
            handle.close()


def main():
    binary, output = (Path(arg).resolve() for arg in sys.argv[1:])
    output.mkdir(mode=0o700)
    flags = output / 'flags.json'
    rpc, management, sync, ofrep = (str(port) for port in open_ports())
    opener = build_opener(ProxyHandler({}))
    endpoint = f'http://127.0.0.1:{rpc}/flagd.evaluation.v2.Service/ResolveString'

    def resolve(flag_key, identity=None):
        context = {} if identity is None else {'targetingKey': identity}
        payload = {'flagKey': flag_key, 'context': context}
        request = Request(endpoint, data=json.dumps(payload).encode(),
                          headers={'Content-Type': 'application/json'})
        with opener.open(request, timeout=2) as response:
            return json.load(response)

    def assignments(enrollment):
        deadline = time.monotonic() + 20
        while time.monotonic() < deadline:
            try:
                if resolve('phase')['value'] == str(enrollment):
                    return {flag: [resolve(flag, key)['value'] for key in KEYS] for flag in EXPERIMENTS}
            except (OSError, URLError):
                pass
            time.sleep(0.15)
        raise RuntimeError(f'Daemon did not serve enrollment {enrollment}')

    activate(flags, 20)
    with (output / 'daemon.log').open('wb') as log:
        daemon = subprocess.Popen([str(binary), 'start', '--uri', f'file:{flags}', '--port', rpc,
                                   '--management-port', management, '--sync-port', sync, '--ofrep-port', ofrep],
                                  cwd=output, stdout=log, stderr=log,
                                  env={'HOME': os.environ['HOME'], 'PATH': '/usr/bin:/bin'})
        try:
            before = assignments(20)
            activate(flags, 80)
            after = assignments(80)
            missing_identity = {flag: resolve(flag) for flag in EXPERIMENTS}
        finally:
            if daemon.poll() is None:
                daemon.terminate()
            try:
                daemon.wait(timeout=8)
            except subprocess.TimeoutExpired:
                daemon.kill()
                daemon.wait(timeout=5)

    observed = {}
    for flag in EXPERIMENTS:
        transition = Counter(zip(before[flag], after[flag], strict=True))
        observed[flag] = {
            'at_20': dict(Counter(before[flag])), 'at_80': dict(Counter(after[flag])),
            'transitions': {f'{a}->{b}': count for (a, b), count in sorted(transition.items())},
            'missing_identity': missing_identity[flag],
        }
    with binary.open('rb') as executable:
        digest = file_digest(executable, 'sha256').hexdigest()
    receipt = {'synthetic_identities': len(KEYS), 'binary_sha256': digest,
               'observations': observed, 'daemon_exit_status': daemon.returncode}
    (output / 'results.json').write_text(json.dumps(receipt, indent=2) + '\n')


if __name__ == '__main__':
    main()
