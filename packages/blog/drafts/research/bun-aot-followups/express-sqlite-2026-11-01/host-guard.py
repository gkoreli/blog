#!/usr/bin/env python3
"""Wait for a quiet window; interrupt our own process group on known study overlap."""
import argparse
import json
import os
import signal
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path


def external_activity():
    lines = subprocess.check_output(['ps', '-axo', 'pid=,ppid=,pcpu=,comm='], text=True)
    rows = [line.split(None, 3) for line in lines.splitlines() if line.strip()]
    owned = {os.getpid()}
    while True:
        more = owned | {int(pid) for pid, ppid, cpu, cmd in rows if int(ppid) in owned}
        if more == owned:
            break
        owned = more
    return [{'pid': int(pid), 'cpu_percent': float(cpu), 'command': cmd}
            for pid, ppid, cpu, cmd in rows
            if int(pid) not in owned and float(cpu) > 10
            and any(marker in cmd for marker in
                    ['bun-aot-projects-20261101/', 'bun-aot-validation-20261031/'])]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--quiet-seconds', type=float, default=60)
    parser.add_argument('--max-wait-seconds', type=float, default=1800)
    parser.add_argument('--receipt', type=Path, required=True)
    parser.add_argument('command', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    if not args.command or args.receipt.exists():
        parser.error('Provide a command and a fresh receipt path')
    command = args.command[1:] if args.command[0] == '--' else args.command
    samples = []
    quiet_since = time.monotonic()
    started = quiet_since
    last_notice = 0
    result = {'status': 'waiting', 'quiet_seconds_required': args.quiet_seconds, 'samples': samples}
    proc = None
    try:
        while True:
            now = time.monotonic()
            active = external_activity()
            samples.append({'at': datetime.now(timezone.utc).isoformat(), 'stage': 'waiting',
                            'active_external_study': active})
            if active:
                quiet_since = now
            if now - quiet_since >= args.quiet_seconds:
                break
            if now - started > args.max_wait_seconds:
                result['status'] = 'wait_expired'
                return 75
            if now - last_notice >= 30:
                print('Quiet-window guard:', len(active), 'known active processes;',
                      round(now - quiet_since), 'quiet seconds', flush=True)
                last_notice = now
            time.sleep(1)
        print('Quiet window observed; starting the serial study', flush=True)
        result['status'] = 'running'
        proc = subprocess.Popen(command, start_new_session=True)
        while proc.poll() is None:
            active = external_activity()
            samples.append({'at': datetime.now(timezone.utc).isoformat(), 'stage': 'running',
                            'active_external_study': active})
            if active:
                result['status'] = 'interrupted_external_activity'
                print('New external study activity; interrupting only our study', flush=True)
                os.killpg(proc.pid, signal.SIGINT)
                proc.wait(timeout=30)
                return 75
            time.sleep(1)
        result.update(status='completed' if proc.returncode == 0 else 'study_failed',
                      study_exit_code=proc.returncode)
        return proc.returncode
    finally:
        if proc is not None and proc.poll() is None:
            os.killpg(proc.pid, signal.SIGINT)
            proc.wait(timeout=30)
        args.receipt.parent.mkdir(parents=True, exist_ok=True)
        args.receipt.write_text(json.dumps(result, indent=2) + '\n')


if __name__ == '__main__':
    raise SystemExit(main())
