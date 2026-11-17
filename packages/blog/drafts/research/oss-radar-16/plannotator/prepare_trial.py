#!/usr/bin/env python3
"""Prepare pinned source using owned component dependencies, without installing.

Usage: python prepare_trial.py UPSTREAM_SOURCE COMPONENT_DEPENDENCIES
"""
import hashlib
import json
from pathlib import Path
import sys

source, dependencies = (Path(arg).resolve() for arg in sys.argv[1:])
here = Path(__file__).resolve().parent
assert json.loads((source / "package.json").read_text())["version"] == "0.28.67"
manifest = json.loads((here / "source-hashes.json").read_text())
for name, expected in manifest.items():
    path = (source / name).resolve()
    assert path.is_relative_to(source), name
    data = path.read_bytes()
    assert hashlib.sha256(data).hexdigest() == expected["sha256"], name
    assert len(data) == expected["bytes"], name


def link(name, target):
    path = source / "node_modules" / name
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() or path.is_symlink():
        assert path.is_symlink() and path.resolve() == target.resolve(), f"Use a fresh workspace: {name} already exists"
    else:
        path.symlink_to(target, target_is_directory=True)


for package in (source / "packages").glob("*/package.json"):
    name = json.loads(package.read_text()).get("name", "")
    if name.startswith("@plannotator/"):
        link(name, package.parent)
for name in ("@modelcontextprotocol/client", "zod"):
    target = dependencies / "node_modules" / name
    assert target.exists(), f"Install the supplied component lock first: {name}"
    link(name, target)
for origin, name in (("inbox_trial.ts", "oss-radar-inbox-trial.ts"),
                     ("source-hashes.json", "oss-radar-source-hashes.json")):
    target = source / name
    data = (here / origin).read_bytes()
    if target.exists():
        assert target.read_bytes() == data, f"Refusing to overwrite {name}"
    else:
        target.write_bytes(data)
print(f"Verified {len(manifest)} source files and prepared the component fixture")
