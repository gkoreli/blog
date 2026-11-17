#!/usr/bin/env python3
"""Verify owned pinned source/submodules and install only the authored fixture.

Usage: python prepare_trial.py UPSTREAM_SOURCE
It does not download, compile, start a service or change upstream Go files.
"""
import hashlib
import json
from pathlib import Path
import sys

source = Path(sys.argv[1]).resolve()
here = Path(__file__).resolve().parent
manifest = json.loads((here / "source-hashes.json").read_text())
for name, expected in manifest.items():
    path = (source / name).resolve()
    assert path.is_relative_to(source), name
    data = path.read_bytes()
    assert len(data) == expected["bytes"], name
    assert hashlib.sha256(data).hexdigest() == expected["sha256"], name
target = source / "internal/health/monitor/radar_monitor_trial_test.go"
fixture = (here / "radar_monitor_trial_test.go").read_bytes()
if target.exists():
    assert target.read_bytes() == fixture, "Refusing to overwrite another fixture"
else:
    target.write_bytes(fixture)
print(f"Verified {len(manifest)} source/module files and prepared the monitor fixture")
