"""Compile and measure the paired validators with an explicitly supplied Bun binary."""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import platform
import statistics
import subprocess
import time


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bun", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path, help="New directory; existing output is never overwritten")
    parser.add_argument("--literal-control", action="store_true")
    args = parser.parse_args()
    bun = args.bun.resolve(strict=True)
    output = args.out.resolve()
    output.mkdir(parents=True, exist_ok=False)
    sources = Path(__file__).resolve().parent
    if args.literal_control:
        sources = sources / "controls"
    env = dict(os.environ, DO_NOT_TRACK="1", BUN_ENABLE_CRASH_REPORTING="0")
    result = {
        "startedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "platform": platform.platform(),
        "bunRevision": subprocess.check_output([str(bun), "--revision"], text=True, timeout=15).strip(),
        "bunSha256": hashlib.sha256(bun.read_bytes()).hexdigest(),
        "control": "literal" if args.literal_control else "runtime-threshold",
        "method": "One discarded whole-process warmup, then five rotated-order fresh-process wall times per executable; startup included, ambient OS load uncontrolled.",
        "sourceSha256": {}, "builds": [], "rows": [], "inputControls": [],
    }

    def save():
        (output / "results.json").write_text(json.dumps(result, indent=2) + "\n")

    commands = []
    for kind, filename in [("static", "60-validator-static.ts"), ("generated", "61-validator-generated.ts")]:
        source = sources / filename
        result["sourceSha256"][filename] = hashlib.sha256(source.read_bytes()).hexdigest()
        for mode in ["jit", "aot"]:
            executable = output / f"validator-{kind}-{mode}"
            command = [str(bun), "build", "--compile", "--production", "--format=esm"]
            if mode == "aot":
                command.append("--aot")
            command += [str(source), "--outfile", str(executable)]
            built = subprocess.run(command, env=env, text=True, capture_output=True, timeout=90)
            (output / f"build-{kind}-{mode}.log").write_text(built.stdout + built.stderr)
            result["builds"].append({"kind": kind, "mode": mode, "command": command, "returncode": built.returncode})
            save()
            if built.returncode:
                raise RuntimeError("Build failed; retained diagnostic, no incomplete timing comparison")
            commands.append((kind, mode, executable))

    for repetition in range(6):
        offset = repetition % len(commands)
        for kind, mode, executable in commands[offset:] + commands[:offset]:
            start = time.perf_counter()
            run = subprocess.run([str(executable)], env=env, text=True, capture_output=True, timeout=15)
            elapsed = time.perf_counter() - start
            row = {"kind": kind, "mode": mode, "repetition": repetition, "warmup": repetition == 0,
                   "seconds": elapsed, "returncode": run.returncode, "stdout": run.stdout,
                   "stderr": run.stderr, "oracleMatches": run.returncode == 0 and run.stdout == "RESULT 2550000\n"}
            result["rows"].append(row)
            save()
            if not row["oracleMatches"]:
                raise RuntimeError("Correctness mismatch; measurements retained")

    if not args.literal_control:
        for threshold in [0, 18, 29, 61]:
            expected = sum(age >= threshold for age in [17, 19, 60]) * 1_000_000
            expected += sum(age >= threshold for age in range(40)) * 25_000
            for kind, mode, executable in commands:
                run = subprocess.run([str(executable), str(threshold)], env=env, text=True, capture_output=True, timeout=15)
                matches = run.returncode == 0 and run.stdout == f"RESULT {expected}\n"
                result["inputControls"].append({"threshold": threshold, "kind": kind, "mode": mode,
                                                "expected": expected, "returncode": run.returncode,
                                                "stdout": run.stdout, "stderr": run.stderr, "matchesOracle": matches})
                save()
                if not matches:
                    raise RuntimeError("Input-control mismatch; measurements retained")

    result["medians"] = {f"{kind}-{mode}": statistics.median(
        row["seconds"] for row in result["rows"]
        if row["kind"] == kind and row["mode"] == mode and not row["warmup"]
    ) for kind, mode, _ in commands}
    result["completedAt"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    save()
    print(json.dumps({"control": result["control"], "medians": result["medians"]}, indent=2))


if __name__ == "__main__":
    main()
