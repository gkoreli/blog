#!/usr/bin/env python3
"""Compare installed native compilers on an unchanged public blog checkout (macOS)."""

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


def digest(data):
    return hashlib.sha256(data).hexdigest()


def text_command(args):
    return subprocess.check_output(args, text=True).strip()


def cpu_load():
    values = text_command(["ps", "-A", "-o", "%cpu="]).split()
    return round(sum(float(value) for value in values), 1)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fixture", type=Path, required=True)
    parser.add_argument("--compilers", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--source-commit", required=True)
    parser.add_argument("--node", default="node")
    parser.add_argument("--profile", type=Path)
    options = parser.parse_args()
    fixture = options.fixture.resolve()
    compiler_root = options.compilers.resolve()
    output = options.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    resolver = """
const root = process.argv[1];
for (const name of ['tsrs', 'ts70', 'ts71']) {
  const {default: resolve} = await import(`${root}/node_modules/${name}/lib/getExePath.js`);
  console.log(JSON.stringify({name, path:resolve()}));
}
"""
    resolved = text_command([options.node, "--input-type=module", "-e", resolver, str(compiler_root)])
    binaries = {row["name"]: Path(row["path"]) for row in map(json.loads, resolved.splitlines())}
    variants = [
        ("typescript-7.0", "ts70", []),
        ("typescript-7.1-beta", "ts71", []),
        ("tsrs-default", "tsrs", ["--fast", "false"]),
        ("tsrs-fast-4", "tsrs", ["--fast"]),
    ]
    profile = json.loads(options.profile.read_text()) if options.profile else {
        "lockfile": "pnpm-lock.yaml",
        "projects": {
            "site": {"config": "packages/blog/tsconfig.json", "incremental": True,
                     "negativeControl": "packages/blog/src/compiler-negative-control.ts"},
            "worker": {"config": "packages/blog/src/worker/tsconfig.json", "incremental": False,
                       "negativeControl": "packages/blog/src/worker/compiler-negative-control.ts"},
        },
    }
    projects = {name: item["config"] for name, item in profile["projects"].items()}
    environment = dict(os.environ)
    excluded = [key for key in environment if key.startswith(("TSRS_", "TS_GO_"))
                or key in {"GOMAXPROCS", "GOMEMLIMIT", "GOGC", "RAYON_NUM_THREADS"}]
    for key in excluded:
        del environment[key]
    result = {
        "schemaVersion": 1, "status": "running", "sourceCommit": options.source_commit,
        "platform": platform.platform(), "machine": platform.machine(),
        "cpu": text_command(["sysctl", "-n", "machdep.cpu.brand_string"]),
        "logicalCpus": int(text_command(["sysctl", "-n", "hw.logicalcpu"])),
        "memoryBytes": int(text_command(["sysctl", "-n", "hw.memsize"])),
        "nodeVersion": text_command([options.node, "--version"]),
        "clearedEnvironmentNames": excluded,
        "lockfileSha256": digest((fixture / profile["lockfile"]).read_bytes()),
        "profile": profile,
        "projects": {name: {"config": path, "sha256": digest((fixture / path).read_bytes())}
                     for name, path in projects.items()},
        "binaries": {name: {"version": text_command([str(path), "--version"]),
                            "sha256": digest(path.read_bytes())} for name, path in binaries.items()},
        "preflight": [], "negativeControls": [], "samples": [], "cpuSnapshots": [],
    }
    artifact = output / "results.json"

    def save():
        artifact.write_text(json.dumps(result, indent=2) + "\n")

    def run(project, variant, label, timed=False):
        name, package, extra = variant
        incremental = output / f"cold-{project}.tsbuildinfo"
        incremental.unlink(missing_ok=True)
        cache_args = (["--incremental", "true", "--tsBuildInfoFile", str(incremental)]
                      if profile["projects"][project]["incremental"] else ["--incremental", "false"])
        args = [str(binaries[package]), "-p", projects[project], "--noEmit", *cache_args,
                "--pretty", "false", "--checkers", "4", *extra]
        command = ["/usr/bin/time", "-l", *args] if timed else args
        start = time.perf_counter()
        completed = subprocess.run(command, cwd=fixture, env=environment, capture_output=True, text=True, timeout=120)
        elapsed = time.perf_counter() - start
        native_output = completed.stdout.replace(str(fixture) + "/", "")
        errors = completed.stderr.replace(str(fixture) + "/", "")
        (output / f"{label}-{project}-{name}.stdout.txt").write_text(native_output)
        (output / f"{label}-{project}-{name}.stderr.txt").write_text(errors)
        diagnostics = re.findall(r"^(.+?)\((\d+),(\d+)\): error TS(\d+): (.*)$", native_output, re.MULTILINE)
        row = {"project": project, "variant": name, "exitCode": completed.returncode,
               "diagnostics": diagnostics, "outputSha256": digest(native_output.encode()),
               "diagnosticSetSha256": digest(json.dumps(sorted(diagnostics)).encode()),
               "command": [package, *args[1:]]}
        if timed:
            peak = re.search(r"(\d+)\s+maximum resident set size", errors)
            if peak is None:
                raise RuntimeError(f"Native memory measurement missing: {label} {project} {name}")
            row.update(wallSeconds=elapsed, peakRssBytes=int(peak.group(1)))
        elif errors:
            row["stderr"] = errors
        return row

    save()
    try:
        baseline = {}
        for project in projects:
            for variant in variants:
                row = run(project, variant, "preflight")
                result["preflight"].append(row)
                if row["exitCode"] not in (0, 1, 2) or row.get("stderr"):
                    raise RuntimeError(f"Unexpected preflight failure: {project} {variant[0]}")
                baseline[(project, variant[0])] = row
        result["referenceParity"] = []
        for project in projects:
            reference = baseline[(project, "typescript-7.1-beta")]
            for variant in variants:
                row = baseline[(project, variant[0])]
                matches = (row["exitCode"], row["diagnosticSetSha256"]) == (
                    reference["exitCode"], reference["diagnosticSetSha256"])
                result["referenceParity"].append({"project": project, "variant": variant[0], "matches": matches})
                if variant[1] == "tsrs" and not matches:
                    raise RuntimeError(f"Reference diagnostics differ; no timings accepted: {project} {variant[0]}")
        save()
        for project in projects:
            control = fixture / profile["projects"][project]["negativeControl"]
            if control.exists():
                raise RuntimeError("Refusing to overwrite an existing control file")
            try:
                control.write_text('export const compilerNegativeControl: number = "deliberate type error";\n')
                for variant in variants:
                    row = run(project, variant, "negative")
                    row["detectedExpectedError"] = any(d[0].endswith("compiler-negative-control.ts") and d[3] == "2322"
                                                       for d in row["diagnostics"])
                    result["negativeControls"].append(row)
                    if not row["detectedExpectedError"] or row["exitCode"] == 0:
                        raise RuntimeError(f"Negative control missed: {project} {variant[0]}")
            finally:
                control.unlink(missing_ok=True)
        save()
        for project in projects:
            for variant in variants:
                row = run(project, variant, "warmup")
                expected = baseline[(project, variant[0])]
                if (row["exitCode"], row["outputSha256"]) != (expected["exitCode"], expected["outputSha256"]):
                    raise RuntimeError(f"Warmup differs from preflight: {project} {variant[0]}")
            for round_index in range(5):
                result["cpuSnapshots"].append({"project": project, "round": round_index + 1,
                                              "totalCpuPercentBeforeRound": cpu_load()})
                order = variants[round_index % 4:] + variants[:round_index % 4]
                for variant in order:
                    row = run(project, variant, f"run-{round_index + 1}", timed=True)
                    row["round"] = round_index + 1
                    result["samples"].append(row)
                    expected = baseline[(project, variant[0])]
                    if (row["exitCode"], row["outputSha256"]) != (expected["exitCode"], expected["outputSha256"]):
                        raise RuntimeError(f"Measured diagnostics changed: {project} {variant[0]}")
                    save()
        result["summary"] = []
        for project in projects:
            for name, _, _ in variants:
                rows = [row for row in result["samples"] if row["project"] == project and row["variant"] == name]
                times = [row["wallSeconds"] for row in rows]
                memories = [row["peakRssBytes"] for row in rows]
                result["summary"].append({"project": project, "variant": name, "runs": len(rows),
                    "medianWallSeconds": statistics.median(times), "minWallSeconds": min(times),
                    "maxWallSeconds": max(times), "medianPeakRssBytes": statistics.median(memories)})
        result["status"] = "complete"
    except Exception as error:
        result.update(status="failed", failure=str(error))
        raise
    finally:
        save()
    print(json.dumps({"status": result["status"], "summary": result["summary"],
                      "cpuSnapshots": result["cpuSnapshots"]}, indent=2))


if __name__ == "__main__":
    main()
