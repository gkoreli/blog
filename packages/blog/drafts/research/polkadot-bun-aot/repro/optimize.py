#!/usr/bin/env python3
"""Compare documented compiler options; keep failures and correctness gates."""

import argparse
import json
from pathlib import Path
import statistics
import subprocess
import math

import run as base


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("stage", choices=("build", "check", "measure"))
    parser.add_argument("--checkout", type=Path, required=True)
    parser.add_argument("--bun", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--only", help="Build just this candidate, retaining the other build records")
    parser.add_argument("--modes", help="Comma-separated accepted candidates for a separate measurement batch")
    parser.add_argument("--batch", default="optimization", help="Separate result-file prefix for each measurement batch")
    args = parser.parse_args()
    root, bun, out = args.checkout.resolve(), args.bun.resolve(), args.out.resolve()
    out.mkdir(parents=True, exist_ok=True)
    assert base.digest(bun.read_bytes()) == base.BUN_BINARY_SHA256
    assert subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=root, text=True).strip() == base.CLI_COMMIT
    env, hashes = base.fixture(root, out)
    asset_flags = ["--asset", base.ASSET]
    common = ["--aot", "--trim", *asset_flags]
    variants = {
        "baseline": (root / "src/cli.ts", common),
        "no-source": (root / "src/cli.ts", [*common, "--no-compile-function-source"]),
        "no-codegen": (root / "src/cli.ts", [*common, "--disallow-code-generation-from-strings=strict"]),
        "no-source-codegen": (root / "src/cli.ts", [*common, "--no-compile-function-source", "--disallow-code-generation-from-strings=strict"]),
        "wasm-import": (root / "src/cli-aot-wasm.ts", common),
        "jit-bytecode": (root / "src/cli.ts", ["--bytecode", *asset_flags]),
        "noble-source": (root / "src/cli.ts", common),
    }
    # Keep the WASM import reachable without changing ordinary CLI output.
    (root / "src/cli-aot-wasm.ts").write_text(
        'import wasmPath from "../node_modules/verifiablejs/pkg-nodejs/verifiablejs_bg.wasm";\n'
        'import "./cli.ts";\n'
        'if (process.env.DOT_WASM_PROBE === "1") console.error(wasmPath);\n'
    )
    if args.stage == "build":
        records = json.loads((out / "optimization-builds.json").read_text()) if args.only else []
        if args.only:
            assert args.only in variants
            records = [r for r in records if r["mode"] != args.only]
        for mode, (entry, flags) in variants.items():
            if args.only and mode != args.only:
                continue
            command = [str(bun), "build", str(entry), "--compile", *flags, "--outfile", str(out / ("dot-" + mode))]
            package = root / "node_modules/@noble/hashes/package.json"
            original = package.read_bytes()
            try:
                if mode == "noble-source":
                    data = json.loads(original)
                    exports = {}
                    for name, target in data["exports"].items():
                        assert isinstance(target, str) and target.endswith(".js")
                        source = "./src/" + Path(target).stem + ".ts"
                        assert (package.parent / source).exists()
                        exports[name] = {"aot": source, "default": target}
                    data["exports"] = exports
                    package.write_text(json.dumps(data, indent=2) + "\n")
                    base.save(out / "noble-exports-patch.json", {"version": data["version"],
                              "original_package_sha256": base.digest(original), "exports": exports})
                result, elapsed = base.run(command, cwd=root)
            finally:
                if package.read_bytes() != original:
                    package.write_bytes(original)
            (out / (mode + ".build.stdout")).write_bytes(result.stdout)
            (out / (mode + ".build.stderr")).write_bytes(result.stderr)
            binary = out / ("dot-" + mode)
            record = {"mode": mode, "flags": flags, "returncode": result.returncode,
                      "build_ms": elapsed, "warnings": result.stderr.decode(errors="replace").splitlines()}
            if result.returncode == 0:
                record.update({"bytes": binary.stat().st_size, "sha256": base.digest(binary.read_bytes())})
            records.append(record)
            base.save(out / "optimization-builds.json", records)
            print(mode, result.returncode, record.get("bytes"), flush=True)
        return
    builds = json.loads((out / "optimization-builds.json").read_text())
    modes = [x["mode"] for x in builds if x["returncode"] == 0]
    if args.stage == "check":
        records = []
        reference = {}
        profile = f'(version 1) (allow default) (deny file-read* (subpath {json.dumps(str(root))}))'
        for mode in modes:
            for name, tail in base.cases().items():
                result, _ = base.run([str(out / ("dot-" + mode)), *tail], cwd=out, env=env)
                record = {"mode": mode, "case": name, **base.output_record(result)}
                try:
                    base.validate(name, result, hashes)
                    if mode == "baseline":
                        reference[name] = base.output_record(result)
                    assert base.output_record(result) == reference[name], "output differs from baseline"
                    record["matches_baseline"] = True
                except (RuntimeError, AssertionError) as error:
                    record["failure"] = str(error)
                (out / f"check-{mode}-{name}.stdout").write_bytes(result.stdout)
                (out / f"check-{mode}-{name}.stderr").write_bytes(result.stderr)
                records.append(record)
            result, _ = base.run(["/usr/bin/sandbox-exec", "-p", profile,
                                  str(out / ("dot-" + mode)), *base.cases()["member-full"]], cwd=out, env=env)
            record = {"mode": mode, "case": "standalone-member", **base.output_record(result)}
            try:
                base.validate("member-full", result, hashes)
                record["standalone_pass"] = True
            except (RuntimeError, AssertionError) as error:
                record["failure"] = str(error)
            records.append(record)
            base.save(out / "optimization-checks.json", records)
            print(mode, sum(bool(x.get("failure")) for x in records if x["mode"] == mode), "failed checks", flush=True)
        return
    checks = json.loads((out / "optimization-checks.json").read_text())
    modes = [m for m in modes if not any(x.get("failure") for x in checks if x["mode"] == m)]
    if args.modes:
        selected_modes = args.modes.split(",")
        assert all(m in modes for m in selected_modes), "Only candidates that passed every check may be measured"
        modes = selected_modes
    assert "baseline" in modes
    selected = ("help", "hash-file-16mib", "inspect-account", "member-full")
    observations = []
    for case in selected:
        tail = base.cases()[case]
        for mode in modes:
            for _ in range(2):
                result, _ = base.run([str(out / ("dot-" + mode)), *tail], cwd=out, env=env)
                base.validate(case, result, hashes)
        blocks = len(modes) * max(4, math.ceil(20 / len(modes)))
        for block in range(blocks):
            order = modes[block % len(modes):] + modes[:block % len(modes)]
            if (block // len(modes)) % 2:
                order = list(reversed(order))
            for position, mode in enumerate(order):
                log = out / f"time-{args.batch}-{case}-{block}-{mode}.txt"
                result, elapsed = base.run(["/usr/bin/time", "-l", "-o", str(log),
                                            str(out / ("dot-" + mode)), *tail], cwd=out, env=env)
                base.validate(case, result, hashes)
                assert not result.stderr
                observations.append({"mode": mode, "case": case, "block": block, "position": position,
                                     "elapsed_ms": elapsed, **base.memory(log.read_text()), **base.output_record(result)})
            base.save(out / (args.batch + "-observations.json"), observations)
        print("measured", case, flush=True)
    summary = []
    for case in selected:
        for mode in modes:
            rows = [x for x in observations if x["case"] == case and x["mode"] == mode]
            summary.append({"mode": mode, "case": case, "n": len(rows), **{
                key: {"median": statistics.median(x[key] for x in rows),
                      "min": min(x[key] for x in rows), "max": max(x[key] for x in rows)}
                for key in ("elapsed_ms", "peak_rss_bytes", "peak_physical_bytes")}})
    base.save(out / (args.batch + "-summary.json"), summary)


if __name__ == "__main__":
    main()
