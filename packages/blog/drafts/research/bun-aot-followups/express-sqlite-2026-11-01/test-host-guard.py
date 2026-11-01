#!/usr/bin/env python3
"""Exercise guard completion, refusing a busy host and signalling only its child."""
import importlib.util
import json
import signal
import subprocess
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch

path = Path(__file__).with_name('host-guard.py')
spec = importlib.util.spec_from_file_location('host_guard', path)
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)
foreign = {'pid': 999999, 'cpu_percent': 100, 'command': 'simulated-other-study'}
results = []
with tempfile.TemporaryDirectory(prefix='bun-aot-guard-test-') as folder:
    root = Path(folder)
    receipt = root / 'busy.json'
    argv = ['host-guard.py', '--quiet-seconds', '60', '--max-wait-seconds', '1',
            '--receipt', str(receipt), '--', sys.executable, '-c', 'raise SystemExit(99)']
    with patch.object(sys, 'argv', argv), patch.object(guard, 'external_activity', return_value=[foreign]), \
         patch.object(guard.time, 'monotonic', side_effect=[0, 2]), \
         patch.object(guard.subprocess, 'Popen') as spawn:
        assert guard.main() == 75
        spawn.assert_not_called()
    assert json.loads(receipt.read_text())['status'] == 'wait_expired'
    results.append({'case': 'busy-host-never-launches', 'passed': True})

    receipt = root / 'complete.json'
    argv = ['host-guard.py', '--quiet-seconds', '0', '--receipt', str(receipt),
            '--', sys.executable, '-c', 'pass']
    with patch.object(sys, 'argv', argv), patch.object(guard, 'external_activity', return_value=[]):
        assert guard.main() == 0
    assert json.loads(receipt.read_text())['status'] == 'completed'
    results.append({'case': 'quiet-host-completes', 'passed': True})

    receipt = root / 'interrupted.json'
    argv = ['host-guard.py', '--quiet-seconds', '0', '--receipt', str(receipt),
            '--', sys.executable, '-c', 'import time; time.sleep(60)']
    real_kill = guard.os.killpg
    real_spawn = subprocess.Popen
    children = []
    signals = []

    def spawn(*args, **kwargs):
        child = real_spawn(*args, **kwargs)
        children.append(child)
        return child

    def send(group, sig):
        assert children and group == children[0].pid and group != foreign['pid']
        signals.append((group, sig))
        return real_kill(group, sig)

    with patch.object(sys, 'argv', argv), \
         patch.object(guard, 'external_activity', side_effect=[[], [foreign]]), \
         patch.object(guard.subprocess, 'Popen', side_effect=spawn), \
         patch.object(guard.os, 'killpg', side_effect=send):
        assert guard.main() == 75
    assert json.loads(receipt.read_text())['status'] == 'interrupted_external_activity'
    assert len(signals) == 1 and signals[0][1] == signal.SIGINT
    assert children[0].poll() is not None
    results.append({'case': 'overlap-interrupts-only-owned-child-group', 'passed': True})

print(json.dumps(results, indent=2))
