#!/usr/bin/env python3
"""Serial build, correctness, warm/cold measurements and serializer control."""
import argparse
import atexit
import hashlib
import json
import os
import platform
import shutil
import subprocess
import sys
import threading
import time
from datetime import datetime, timezone
from pathlib import Path

source = Path(__file__).resolve().parent
tool = source.parents[3] / 'tools/bun-aot-check/compare.py'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--work', type=Path, required=True)
    parser.add_argument('--bun', type=Path, required=True)
    parser.add_argument('--wait-pid', type=int)
    args = parser.parse_args()
    if args.wait_pid:
        deadline = time.monotonic() + 1800
        while True:
            try:
                os.kill(args.wait_pid, 0)
            except ProcessLookupError:
                break
            if time.monotonic() > deadline:
                raise RuntimeError('Known external benchmark still live; no measurements started')
            print('Waiting for known live external benchmark PID', args.wait_pid, flush=True)
            time.sleep(30)
    work = args.work.resolve()
    bun = args.bun.resolve()
    phase = ['setup']
    stop = threading.Event()
    foreign_samples = []

    def watch():
        while not stop.is_set():
            try:
                lines = subprocess.check_output(['ps', '-axo', 'pid=,ppid=,pcpu=,comm='], text=True)
                rows = [line.split(None, 3) for line in lines.splitlines() if line.strip()]
                owned = {os.getpid()}
                while True:
                    more = owned | {int(pid) for pid, ppid, cpu, cmd in rows if int(ppid) in owned}
                    if more == owned:
                        break
                    owned = more
                selected = [{'pid': int(pid), 'cpu_percent': float(cpu), 'command': cmd}
                            for pid, ppid, cpu, cmd in rows
                            if int(pid) not in owned and float(cpu) > 10
                            and any(marker in cmd for marker in
                                    ['bun-aot-projects-20261101/', 'bun-aot-validation-20261031/'])]
                foreign_samples.append({'at': datetime.now(timezone.utc).isoformat(),
                                        'phase': phase[0], 'active_external_study': selected})
            except Exception as error:
                foreign_samples.append({'at': datetime.now(timezone.utc).isoformat(), 'error': str(error)})
            stop.wait(1)

    watcher = threading.Thread(target=watch, daemon=True)
    watcher.start()

    def finish_watch():
        stop.set()
        watcher.join(timeout=3)
        (work / 'foreign-work.json').write_text(json.dumps(foreign_samples, indent=2) + '\n')

    atexit.register(finish_watch)
    control = (source / 'fastify.mjs').read_text().replace(
        'const app = Fastify({ logger: false });',
        'const app = Fastify({ logger: false });\napp.setSerializerCompiler(() => JSON.stringify);')
    assert control != (source / 'fastify.mjs').read_text()
    (work / 'fastify-json.mjs').write_text(control)
    metadata = {
        'started_at': datetime.now(timezone.utc).isoformat(),
        'platform': platform.platform(), 'logical_cpus': os.cpu_count(),
        'node': subprocess.check_output(['node', '--version'], text=True).strip(),
        'pnpm': subprocess.check_output(['pnpm', '--version'], cwd=work, text=True).strip(),
        'bun_revision': subprocess.check_output([str(bun), '--revision'], text=True).strip(),
        'bun_sha256': digest(bun),
        'database_bytes': (work / 'fixture.sqlite').stat().st_size,
        'database_sha256': digest(work / 'fixture.sqlite'),
        'source_hashes': {name: digest(work / name) for name in
                          ['express.mjs', 'fastify.mjs', 'fastify-json.mjs', 'database.mjs',
                           'package.json', 'pnpm-lock.yaml', 'cases.json']},
        'reader_tool_sha256': digest(tool),
    }
    (work / 'inputs.json').write_text(json.dumps(metadata, indent=2) + '\n')
    (work / 'host-before-private.txt').write_text(subprocess.check_output(
        ['ps', '-axo', 'pid,ppid,pcpu,etime,comm'], text=True))
    (work / 'power-before-private.txt').write_text(subprocess.check_output(['pmset', '-g', 'batt'], text=True))
    for framework in ['express', 'fastify']:
        phase[0] = framework + '-warm'
        print('BEGIN WARM', framework, flush=True)
        subprocess.run([
            sys.executable, str(tool), '--bun', str(bun), '--project', str(work),
            '--entry', framework + '.mjs', '--cases', str(work / 'cases.json'),
            '--out', str(work / (framework + '-warm')), '--runs', '6',
            '--warmup', '3', '--seconds', '8', '--connections', '8',
        ], check=True)
        print('BEGIN COLD', framework, flush=True)
        phase[0] = framework + '-cold'
        subprocess.run([
            sys.executable, str(source / 'cold-study.py'), '--project', str(work),
            '--warm-results', str(work / (framework + '-warm')),
            '--out', str(work / (framework + '-cold')), '--runs', '6',
        ], check=True)
    # Build only two control modes; preserve the serializer as the single change.
    binaries = []
    builds = []
    phase[0] = 'json-control-build'
    for mode, flags in [('jit', []), ('aot', ['--aot'])]:
        path = work / ('fastify-json-' + mode)
        start = time.perf_counter()
        with (work / ('build-json-' + mode + '-private.log')).open('wb') as log:
            subprocess.run([str(bun), 'build', 'fastify-json.mjs', '--compile', '--format=esm',
                            *flags, '--outfile', str(path)], cwd=work, stdout=log, stderr=log, check=True)
        builds.append({'mode': mode, 'flags': flags, 'seconds': time.perf_counter() - start,
                       'sha256': digest(path), 'bytes': path.stat().st_size})
        binaries.extend(['--binary', mode + '=' + str(path)])
    (work / 'control-builds.json').write_text(json.dumps(builds, indent=2) + '\n')
    print('BEGIN WARM fastify-json', flush=True)
    phase[0] = 'json-control-warm'
    subprocess.run([
        sys.executable, str(tool), '--project', str(work), *binaries,
        '--cases', str(work / 'cases.json'), '--out', str(work / 'fastify-json-warm'),
        '--runs', '6', '--warmup', '3', '--seconds', '8', '--connections', '8',
    ], check=True)
    assert metadata['database_sha256'] == digest(work / 'fixture.sqlite')
    (work / 'host-after-private.txt').write_text(subprocess.check_output(
        ['ps', '-axo', 'pid,ppid,pcpu,etime,comm'], text=True))
    (work / 'completed.json').write_text(json.dumps({
        'completed_at': datetime.now(timezone.utc).isoformat(), 'database_unchanged': True,
        'warm_runs': 48, 'cold_runs': 36, 'cold_windows': 180,
    }, indent=2) + '\n')


if __name__ == '__main__':
    main()
