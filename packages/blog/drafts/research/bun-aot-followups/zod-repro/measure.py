#!/usr/bin/env python3
"""Build the small fixture and compare fresh processes; no extra packages."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import statistics
import subprocess
import time


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bun", type=Path, required=True)
    parser.add_argument("--project", type=Path, default=Path.cwd())
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--runs", type=int, default=20)
    args = parser.parse_args()
    bun, project, out = args.bun.resolve(), args.project.resolve(), args.out.resolve()
    out.mkdir(parents=True, exist_ok=True)
    assert args.runs > 0 and args.runs % 4 == 0
    version = json.loads((project / "node_modules/zod/package.json").read_text())["version"]
    revision = subprocess.check_output([str(bun), "--revision"], text=True).strip()
    builds = []
    for mode, flags in (("jit", []), ("aot", ["--aot"]), ("aot-no-codegen", ["--aot", "--trim", "--disallow-code-generation-from-strings=strict"])):
        command = [str(bun), "build", "bench.ts", "--compile", *flags, "--outfile", str(out / mode)]
        result = subprocess.run(command, cwd=project, capture_output=True, timeout=120)
        (out / (mode + ".build.stderr")).write_bytes(result.stderr)
        assert result.returncode == 0, result.stderr
        builds.append({"mode": mode, "flags": flags, "bytes": (out / mode).stat().st_size,
                       "sha256": hashlib.sha256((out / mode).read_bytes()).hexdigest()})
    modes = ("jit-default", "aot-default", "jit-jitless", "aot-jitless")

    def command(mode):
        if mode == "aot-no-codegen":
            return [str(out / mode)]
        engine, config = mode.split("-")
        return [str(out / engine)] + (["--jitless"] if config == "jitless" else [])

    # Pin enough positive and negative cases to catch a fake validation speedup.
    verify_env = {**os.environ, "INPUT": json.dumps([
        {"id": 1, "name": "a", "enabled": True},
        {"id": 2, "name": "b", "enabled": False, "extra": "stripped"},
        {"id": "1", "name": "a", "enabled": True},
        {"id": 1, "name": "a"}, None, [],
    ])}
    reference = None
    for mode in (*modes, "aot-no-codegen"):
        result = subprocess.run(command(mode) + ["--verify"], cwd=project, env=verify_env, capture_output=True, timeout=30)
        assert result.returncode == 0 and not result.stderr
        payload = json.loads(result.stdout)
        assert [x["success"] for x in payload] == [True, True, False, False, False, False]
        assert "extra" not in payload[1]["data"]
        if reference is None:
            reference = result.stdout
        assert result.stdout == reference, mode
    env = {**os.environ, "ITERATIONS": "2000000"}
    env.pop("INPUT", None)
    records = []
    for mode in modes:
        for _ in range(2):
            p = subprocess.run(command(mode), cwd=project, env=env, capture_output=True, timeout=30)
            assert p.returncode == 0 and json.loads(p.stdout) == {"passed": 2000000}
    for block in range(args.runs):
        order = list(modes[block % 4:] + modes[:block % 4])
        if (block // 4) % 2:
            order.reverse()
        for position, mode in enumerate(order):
            start = time.perf_counter_ns()
            p = subprocess.run(command(mode), cwd=project, env=env, capture_output=True, timeout=30)
            elapsed = (time.perf_counter_ns() - start) / 1e6
            assert p.returncode == 0 and not p.stderr and json.loads(p.stdout) == {"passed": 2000000}
            records.append({"mode": mode, "block": block, "position": position, "elapsed_ms": elapsed,
                            "passed": 2000000, "stdout_sha256": hashlib.sha256(p.stdout).hexdigest()})
        (out / "observations.json").write_text(json.dumps(records, indent=2) + "\n")
    # Separate opt-out control. Its policy changes behavior and is not a fix for all apps.
    policy = []
    for repeat in range(args.runs):
        start = time.perf_counter_ns()
        p = subprocess.run([str(out / "aot-no-codegen")], cwd=project, env=env, capture_output=True, timeout=30)
        assert p.returncode == 0 and not p.stderr and json.loads(p.stdout) == {"passed": 2000000}
        policy.append({"mode": "aot-no-codegen", "repeat": repeat, "elapsed_ms": (time.perf_counter_ns()-start)/1e6})
    result = {"bun_revision": revision, "bun_sha256": hashlib.sha256(bun.read_bytes()).hexdigest(),
              "zod_version": version, "fixture_sha256": hashlib.sha256((project / "bench.ts").read_bytes()).hexdigest(),
              "iterations": 2000000, "runs_per_mode": args.runs, "builds": builds,
              "method": "Fresh whole processes, two untimed warmups per default/jitless mode, balanced rotating/reversed order; filesystem caches warm; shared macOS laptop. Code-generation-denied control is a separate sequential batch.",
              "validation_cases": 6, "validation_modes": 5, "outputs_match_across_modes": True,
              "summary": [{"mode": m, "median_ms": statistics.median(x["elapsed_ms"] for x in records if x["mode"] == m),
                           "min_ms": min(x["elapsed_ms"] for x in records if x["mode"] == m),
                           "max_ms": max(x["elapsed_ms"] for x in records if x["mode"] == m)} for m in modes],
              "codegen_denied_median_ms": statistics.median(x["elapsed_ms"] for x in policy)}
    (out / "policy-observations.json").write_text(json.dumps(policy, indent=2) + "\n")
    (out / "results.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result["summary"], indent=2), flush=True)


if __name__ == "__main__":
    main()
