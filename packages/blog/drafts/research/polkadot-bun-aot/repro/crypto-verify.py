#!/usr/bin/env python3
"""Measure an offline ring-proof verification, with a tampered-message control."""

import argparse
import json
import os
from pathlib import Path
import statistics
import subprocess

import run as base


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--checkout", type=Path, required=True)
    parser.add_argument("--bun", type=Path, required=True)
    parser.add_argument("--node", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--jit", type=Path, required=True)
    parser.add_argument("--fixture", type=Path, required=True)
    parser.add_argument("--check-only", action="store_true")
    args = parser.parse_args()
    root, out, bun = args.checkout.resolve(), args.out.resolve(), args.bun.resolve()
    assert base.digest(bun.read_bytes()) == base.BUN_BINARY_SHA256
    env, _ = base.fixture(root, out)
    fixture = json.loads(args.fixture.read_text())
    proof = fixture["proof"]
    tail = ["verifiable", "verify", "--proof", proof["proof"], "--context", "dotns",
            "--message", "0xabcd", "--members", fixture["members"], "--output", "json"]
    commands = {
        "node-package": [str(args.node.resolve()), str(root / "dist/cli.mjs")],
        "jit": [str(args.jit.resolve())],
        "aot-asset": [str(out / "dot-baseline")],
        "aot-wasm-import": [str(out / "dot-wasm-import")],
    }
    checks = []
    reference = None
    for mode, prefix in commands.items():
        for valid in (True, False):
            modified = list(tail)
            if not valid:
                modified[modified.index("0xabcd")] = "0xabce"
            result, _ = base.run(prefix + modified, cwd=out, env=env)
            assert result.returncode == (0 if valid else 1), (mode, result.stdout, result.stderr)
            if valid:
                payload = json.loads(result.stdout)
                assert payload["valid"] is True and payload["alias"] == proof["alias"]
                if reference is None:
                    reference = result.stdout
                assert result.stdout == reference, mode
            else:
                assert b"invalid" in result.stdout + result.stderr
            checks.append({"mode": mode, "valid_message": valid, **base.output_record(result)})
    profile = f'(version 1) (allow default) (deny file-read* (subpath {json.dumps(str(root))}))'
    for mode in ("aot-asset", "aot-wasm-import"):
        for valid in (True, False):
            modified = list(tail)
            if not valid:
                modified[modified.index("0xabcd")] = "0xabce"
            result, _ = base.run(["/usr/bin/sandbox-exec", "-p", profile,
                                  *commands[mode], *modified], cwd=out, env=env)
            assert result.returncode == (0 if valid else 1)
            if valid:
                assert result.stdout == reference and not result.stderr
            else:
                assert b"invalid" in result.stdout + result.stderr
            checks.append({"mode": mode, "valid_message": valid, "checkout_reads_denied": True,
                           **base.output_record(result)})
    base.save(out / "proof-checks.json", checks)
    if args.check_only:
        print("Verified 8 ordinary proof checks and 4 with checkout reads denied.")
        return
    modes = list(commands)
    observations = []
    for mode in modes:
        for _ in range(2):
            result, _ = base.run(commands[mode] + tail, cwd=out, env=env)
            assert result.returncode == 0 and result.stdout == reference
    for block in range(20):
        order = modes[block % 4:] + modes[:block % 4]
        if (block // 4) % 2:
            order.reverse()
        for position, mode in enumerate(order):
            log = out / f"time-proof-{block}-{mode}.txt"
            result, elapsed = base.run(["/usr/bin/time", "-l", "-o", str(log),
                                        *commands[mode], *tail], cwd=out, env=env)
            assert result.returncode == 0 and result.stdout == reference and not result.stderr
            observations.append({"mode": mode, "block": block, "position": position,
                                 "elapsed_ms": elapsed, **base.memory(log.read_text()), **base.output_record(result)})
        base.save(out / "proof-observations.json", observations)
    summary = []
    for mode in modes:
        rows = [r for r in observations if r["mode"] == mode]
        summary.append({"mode": mode, "n": len(rows), **{
            k: {"median": statistics.median(r[k] for r in rows), "min": min(r[k] for r in rows),
                "max": max(r[k] for r in rows)} for k in ("elapsed_ms", "peak_rss_bytes", "peak_physical_bytes")}})
    base.save(out / "proof-results.json", {"fixture_sha256": base.digest(args.fixture.read_bytes()),
        "bun_revision": subprocess.check_output([str(bun), "--revision"], text=True).strip(),
        "cli_commit": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=root, text=True).strip(),
        "checks": checks, "summary": summary,
        "method": "Twenty fresh whole processes per mode after two warmups; rotating/reversed order; fixed synthetic one-member proof; warm filesystem caches; elapsed includes launch and time wrapper; shared macOS laptop. No network, real account, transaction signing/submission, or security audit."})
    print(json.dumps(summary, indent=2), flush=True)


if __name__ == "__main__":
    main()
