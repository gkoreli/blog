#!/usr/bin/env python3
"""Offline, pinned Polkadot CLI comparison on macOS arm64. Standard library only."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import statistics
import subprocess
import time

CLI_COMMIT = "8e85fdac1fb81c5996a4ecc4c93178a54f37f2d5"
BUN_REVISION = "1.4.4-canary.1+73b53109f"
BUN_BINARY_SHA256 = "2480b715f5c61e9d0a0a0062c2435614ffadea9795d7fd24e47f0a48ee0ede15"
LOCK_SHA256 = "fa2162fa9c5a2f08b7519112c3510ca122e26d998ddf78f11cb7289706e7663f"
ASSET = "node_modules/verifiablejs/pkg-nodejs/verifiablejs_bg.wasm"
MODES = ("node-package", "bun-source", "jit", "aot-asset", "aot-trim-asset")
BUILD_MODES = {
    "jit": [],
    "jit-asset": ["--asset", ASSET],
    "aot": ["--aot"],
    "aot-trim": ["--aot", "--trim"],
    "aot-asset": ["--aot", "--asset", ASSET],
    "aot-trim-asset": ["--aot", "--trim", "--asset", ASSET],
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def save(path, value):
    path.write_text(json.dumps(value, indent=2) + "\n")


def run(command, *, cwd, env=None):
    start = time.perf_counter_ns()
    result = subprocess.run(command, cwd=cwd, env=env, capture_output=True, timeout=120)
    return result, (time.perf_counter_ns() - start) / 1e6


def output_record(result):
    return {
        "returncode": result.returncode,
        "stdout_sha256": digest(result.stdout),
        "stdout_bytes": len(result.stdout),
        "stderr_sha256": digest(result.stderr),
        "stderr_bytes": len(result.stderr),
    }


def fixture(checkout, out):
    home = out / "dot-home"
    chain = home / "chains" / "polkadot"
    chain.mkdir(parents=True, exist_ok=True)
    metadata = (checkout / "src/commands/__fixtures__/polkadot-metadata.bin").read_bytes()
    (chain / "metadata.bin").write_bytes(metadata)
    # All selected metadata commands can use this fixture without connecting.
    save(home / "config.json", {"chains": {"polkadot": {"rpc": "ws://127.0.0.1:9"}}})
    # DOT_NO_UPDATE_CHECK alone does not suppress startBackgroundCheck in this revision.
    save(home / "update-check.json", {
        "lastCheck": int(time.time() * 1000), "latestVersion": "1.25.1"
    })
    payload = bytes(range(256)) * 65536  # Deterministic 16 MiB file.
    (out / "payload.bin").write_bytes(payload)
    env = {
        **os.environ, "DOT_HOME": str(home), "DOT_OUTPUT": "",
        "DOT_NO_UPDATE_CHECK": "1", "CI": "1", "NO_COLOR": "1", "FORCE_COLOR": "0",
    }
    return env, {"metadata_sha256": digest(metadata), "payload_sha256": digest(payload)}


def cases():
    return {
        "version": ["--version"],
        "help": ["--help"],
        "hash-small": ["hash", "sha256", "hello"],
        "hash-file-16mib": ["hash", "sha256", "--file", "payload.bin"],
        "hash-blake2": ["hash", "blake2b256", "hello"],
        "hash-twox": ["hash", "twox128", "hello"],
        "inspect-account": ["inspect", "System.Account", "--chain", "polkadot", "--json"],
        "inspect-all": ["inspect", "--chain", "polkadot", "--json"],
        "const-list": ["const.System", "--chain", "polkadot", "--json"],
        "invalid-hash": ["hash", "nonesuch", "hello"],
        "completion": ["__complete", "--", "ins"],
        "member-lite": ["verifiable", "member", "alice", "--output", "json"],
        "member-full": ["verifiable", "member", "alice", "--entropy-key", "candidate", "--output", "json"],
        "skill-show": ["skill", "show"],
    }


def validate(name, result, fixture_hashes):
    expected_exit = 1 if name == "invalid-hash" else 0
    if result.returncode != expected_exit:
        raise RuntimeError(f"{name}: exit {result.returncode}; {result.stdout[-300:]!r} {result.stderr[-300:]!r}")
    if name in ("hash-small", "hash-file-16mib"):
        expected = hashlib.sha256(b"hello").hexdigest() if name == "hash-small" else fixture_hashes["payload_sha256"]
        assert result.stdout.strip() == ("0x" + expected).encode(), name
    elif name.startswith("member-"):
        expected = {
            "member-lite": "0xbb6ee099b568f1844d62fc00e6305c2e83aa8da30ce59e664ef39e089204d43c",
            "member-full": "0x5f915576987547d3e55bb4129ac8cae1d338f8933073dc74272b4c825f738592",
        }[name]
        assert json.loads(result.stdout)["memberKey"] == expected, name
    elif name == "inspect-account":
        value = json.loads(result.stdout)
        assert (value["pallet"], value["item"], value["category"]) == ("System", "Account", "storage")
    elif name == "inspect-all":
        assert any(p["name"] == "System" for p in json.loads(result.stdout)["pallets"])
    elif name == "const-list":
        assert any(c["name"] == "SS58Prefix" for c in json.loads(result.stdout)["constants"])
    elif name == "help":
        assert b"Usage:" in result.stdout
    elif name == "version":
        assert result.stdout.startswith(b"dot/1.25.1 darwin-arm64 ")
    elif name == "invalid-hash":
        assert b"nonesuch" in result.stderr + result.stdout
    elif name == "skill-show":
        assert b"dot-cli" in result.stdout
    elif name == "completion":
        assert b"inspect" in result.stdout


def build(args, out):
    records = []
    for mode, flags in BUILD_MODES.items():
        command = [str(args.bun), "build", "src/cli.ts", "--compile", *flags,
                   "--outfile", str(out / ("dot-" + mode))]
        result, elapsed = run(command, cwd=args.checkout)
        (out / ("build-" + mode + ".stdout")).write_bytes(result.stdout)
        (out / ("build-" + mode + ".stderr")).write_bytes(result.stderr)
        record = {
            "mode": mode, "flags": flags, "entry": "src/cli.ts",
            "returncode": result.returncode, "elapsed_ms": elapsed,
            "warnings": result.stderr.decode(errors="replace").splitlines(),
        }
        if result.returncode == 0:
            binary = out / ("dot-" + mode)
            record.update({"bytes": binary.stat().st_size, "sha256": digest(binary.read_bytes())})
        records.append(record)
        save(out / "build-results.json", records)
        print(f"built {mode}: {result.returncode}", flush=True)
        if result.returncode:
            raise RuntimeError(result.stderr.decode(errors="replace"))
    # Mirror package.json's external-dependency build and shebang step.
    result, _ = run([str(args.bun), "build", "src/cli.ts", "--outfile", "dist/cli.mjs",
                     "--target", "node", "--packages", "external"], cwd=args.checkout)
    assert result.returncode == 0, result.stderr
    path = args.checkout / "dist/cli.mjs"
    path.write_text(path.read_text().replace("#!/usr/bin/env bun", "#!/usr/bin/env node").replace("// @bun\n", ""))


def prefixes(args, out):
    return {
        "node-package": [str(args.node), str(args.checkout / "dist/cli.mjs")],
        "bun-source": [str(args.bun), str(args.checkout / "src/cli.ts")],
        **{mode: [str(out / ("dot-" + mode))] for mode in BUILD_MODES},
    }


def check(args, out, env, hashes):
    commands = prefixes(args, out)
    records, reference = [], {}
    for mode in MODES:
        for name, tail in cases().items():
            result, _ = run(commands[mode] + tail, cwd=out, env=env)
            # Retain command output privately for inspection; publish hashes only.
            (out / f"check-{mode}-{name}.stdout").write_bytes(result.stdout)
            (out / f"check-{mode}-{name}.stderr").write_bytes(result.stderr)
            validate(name, result, hashes)
            record = {"mode": mode, "case": name, **output_record(result)}
            # Runtime identification is supposed to differ between Node and Bun.
            if name != "version":
                if name not in reference:
                    reference[name] = output_record(result)
                assert output_record(result) == reference[name], (mode, name)
                record["matches_node_package_bytes_and_exit"] = True
            records.append(record)
    # Keep the missing-asset failure as evidence instead of measuring broken crypto.
    for mode in ("aot", "aot-trim"):
        result, _ = run(commands[mode] + cases()["member-full"], cwd=out, env=env)
        assert result.returncode == 1 and b"verifiablejs_bg.wasm" in result.stdout
        records.append({"mode": mode, "case": "member-full", **output_record(result),
                        "expected_failure": "Unembedded verifiablejs_bg.wasm: ENOENT"})
    save(out / "correctness-results.json", records)
    print(f"checked {len(records)} mode/case combinations", flush=True)


def standalone(args, out, env, hashes):
    # The binaries and DOT_HOME are outside the checkout. Deny all reads from
    # the checkout, including its dependencies, source and generated Node entry.
    profile = f'(version 1) (allow default) (deny file-read* (subpath {json.dumps(str(args.checkout))}))'
    reference = {(r["mode"], r["case"]): r for r in json.loads((out / "correctness-results.json").read_text())}
    commands = prefixes(args, out)
    control, _ = run(["/usr/bin/sandbox-exec", "-p", profile,
                      *commands["node-package"], "--version"], cwd=out, env=env)
    assert control.returncode != 0, "Negative control: checkout must be unreadable"
    records = [{"mode": "node-package", "case": "version", **output_record(control),
                "expected_failure": "Node entry in the denied checkout cannot be read"}]
    for mode in ("jit", "jit-asset"):
        broken, _ = run(["/usr/bin/sandbox-exec", "-p", profile,
                         *commands[mode], *cases()["member-full"]], cwd=out, env=env)
        assert broken.returncode == 1 and b"verifiablejs_bg.wasm" in broken.stdout
        records.append({"mode": mode, "case": "member-full", **output_record(broken),
                        "expected_failure": "WASM path still resolves to the denied checkout, even with --asset"})
    for mode in ("aot-asset", "aot-trim-asset"):
        for name, tail in cases().items():
            result, _ = run(["/usr/bin/sandbox-exec", "-p", profile,
                             *commands[mode], *tail], cwd=out, env=env)
            validate(name, result, hashes)
            expected = reference[(mode, name)]
            assert all(value == expected[key] for key, value in output_record(result).items()), (mode, name)
            records.append({"mode": mode, "case": name, **output_record(result),
                            "matches_unrestricted_check": True})
    save(out / "standalone-results.json", records)
    print(f"checked {len(records) - 3} standalone commands plus three negative controls", flush=True)


def memory(stderr):
    values = {}
    for key, label in (("peak_rss_bytes", "maximum resident set size"),
                       ("peak_physical_bytes", "peak memory footprint")):
        match = re.search(r"^\s*(\d+)\s+" + label + r"\s*$", stderr, re.MULTILINE)
        if not match:
            raise RuntimeError(f"Missing {label}: run outside restrictions that block time's system counters")
        values[key] = int(match.group(1))
    return values


def measure(args, out, env, hashes):
    commands = prefixes(args, out)
    selected = ("version", "help", "hash-file-16mib", "inspect-account", "member-full")
    records = []
    for name in selected:
        tail = cases()[name]
        for mode in MODES:
            for _ in range(2):
                result, _ = run(commands[mode] + tail, cwd=out, env=env)
                validate(name, result, hashes)
        reference_stdout = None
        for block in range(args.blocks):
            # Rotating order, reversed every five blocks: each mode occupies every
            # position equally at the default twenty-block count.
            order = list(MODES[block % len(MODES):] + MODES[:block % len(MODES)])
            if (block // len(MODES)) % 2:
                order.reverse()
            for position, mode in enumerate(order):
                metric_path = out / f"time-{name}-{block}-{mode}.txt"
                command = ["/usr/bin/time", "-l", "-o", str(metric_path), *commands[mode], *tail]
                result, elapsed = run(command, cwd=out, env=env)
                validate(name, result, hashes)
                if name != "version":
                    if reference_stdout is None:
                        reference_stdout = result.stdout
                    assert result.stdout == reference_stdout, (mode, name, block)
                assert not result.stderr, (mode, name, result.stderr)
                record = {"case": name, "mode": mode, "block": block, "position": position,
                          "elapsed_ms": elapsed, **memory(metric_path.read_text()), **output_record(result)}
                records.append(record)
            save(out / "measurements.json", records)
        print(f"measured {name}: {args.blocks} blocks x {len(MODES)} modes", flush=True)
    summary = []
    for name in selected:
        for mode in MODES:
            rows = [r for r in records if r["case"] == name and r["mode"] == mode]
            record = {"case": name, "mode": mode, "n": len(rows)}
            for key in ("elapsed_ms", "peak_rss_bytes", "peak_physical_bytes"):
                vals = [r[key] for r in rows]
                record[key] = {"median": statistics.median(vals), "min": min(vals), "max": max(vals)}
            summary.append(record)
    save(out / "summary.json", summary)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("stage", choices=("build", "check", "standalone", "measure"))
    parser.add_argument("--checkout", type=Path, required=True)
    parser.add_argument("--bun", type=Path, required=True)
    parser.add_argument("--node", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--blocks", type=int, default=20)
    args = parser.parse_args()
    for key in ("checkout", "bun", "node", "out"):
        setattr(args, key, getattr(args, key).resolve())
    assert platform.system() == "Darwin" and platform.machine() == "arm64"
    revision = subprocess.check_output([str(args.bun), "--revision"], text=True).strip()
    assert revision == BUN_REVISION, revision
    assert digest(args.bun.read_bytes()) == BUN_BINARY_SHA256, "Compiler bytes changed"
    head = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=args.checkout, text=True).strip()
    assert head == CLI_COMMIT, head
    assert digest((args.checkout / "bun.lock").read_bytes()) == LOCK_SHA256, "Dependency lock changed"
    assert subprocess.check_output([str(args.node), "--version"], text=True).strip() == "v24.14.1"
    args.out.mkdir(parents=True, exist_ok=True)
    env, hashes = fixture(args.checkout, args.out)
    metadata = {
        "cli_commit": head, "bun_revision": revision, "node_version": "v24.14.1",
        "bun_binary_sha256": digest(args.bun.read_bytes()),
        "lock_sha256": digest((args.checkout / "bun.lock").read_bytes()),
        "platform": platform.platform(), "machine": platform.machine(), **hashes,
        "method": "Fresh processes; warm filesystem caches; two untimed warmups per mode/case; balanced rotating/reversed order; elapsed includes Python launch plus /usr/bin/time wrapper; no disk-cache flush, CPU pinning or dedicated machine",
        "started_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    save(args.out / (args.stage + "-metadata.json"), metadata)
    if args.stage == "build":
        build(args, args.out)
    elif args.stage == "check":
        check(args, args.out, env, hashes)
    elif args.stage == "standalone":
        standalone(args, args.out, env, hashes)
    else:
        assert args.blocks > 0 and args.blocks % 10 == 0, "Use a multiple of ten for balanced order"
        measure(args, args.out, env, hashes)


if __name__ == "__main__":
    main()
