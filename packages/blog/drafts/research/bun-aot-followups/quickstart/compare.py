#!/usr/bin/env python3
"""Compare two existing executables; Python standard library, no pip install."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import statistics
import subprocess
import tempfile
import time


def expected(rows, rounds):
    checksum = sum(i + (i * 17) % 1009 + len("row-" + str(i)) for i in range(0, rows, 2))
    return {"rows": rows, "rounds": rounds, "checksum": checksum * rounds % 1000000007}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--jit", type=Path, required=True)
    parser.add_argument("--aot", type=Path, required=True)
    parser.add_argument("--runs", type=int, default=10)
    parser.add_argument("--bun", default="bun", help="Compiler used to build these files, for the result record")
    parser.add_argument("--out", type=Path, default=Path("comparison.json"))
    args = parser.parse_args()
    assert args.runs >= 2 and args.runs % 2 == 0, "Use an even number of runs"
    paths = {"jit": args.jit.resolve(), "aot": args.aot.resolve()}
    env = dict(os.environ)
    rows, rounds = int(env.get("ROWS", "250000")), int(env.get("ROUNDS", "40"))
    reference = expected(rows, rounds)
    records = []
    with tempfile.TemporaryDirectory(prefix="bun-compare-") as tmp:
        log = Path(tmp) / "time.txt"
        for block in range(-1, args.runs):
            for mode in (("jit", "aot") if block % 2 == 0 else ("aot", "jit")):
                prefix = []
                if platform.system() == "Darwin":
                    prefix = ["/usr/bin/time", "-l", "-o", str(log)]
                elif platform.system() == "Linux" and Path("/usr/bin/time").exists():
                    prefix = ["/usr/bin/time", "-v", "-o", str(log)]
                start = time.perf_counter_ns()
                p = subprocess.run([*prefix, str(paths[mode])], env=env, capture_output=True, timeout=120)
                elapsed = (time.perf_counter_ns() - start) / 1e6
                assert p.returncode == 0 and not p.stderr, p.stderr.decode(errors="replace")
                assert json.loads(p.stdout) == reference, (mode, p.stdout, reference)
                record = {"mode": mode, "block": block, "elapsed_ms": elapsed,
                          "stdout_sha256": hashlib.sha256(p.stdout).hexdigest()}
                if prefix:
                    text = log.read_text()
                    if platform.system() == "Darwin":
                        for key, label in (("peak_physical_bytes", "peak memory footprint"),
                                           ("peak_rss_bytes", "maximum resident set size")):
                            match = re.search(r"^\s*(\d+)\s+" + label, text, re.MULTILINE)
                            assert match, "Missing memory counters; run outside restrictions that block /usr/bin/time"
                            record[key] = int(match.group(1))
                    else:
                        match = re.search(r"Maximum resident set size \(kbytes\):\s*(\d+)", text)
                        assert match, "Missing GNU time counters"
                        record["peak_rss_bytes"] = int(match.group(1)) * 1024
                if block >= 0:
                    records.append(record)
    summary = []
    for mode, path in paths.items():
        values = [x for x in records if x["mode"] == mode]
        item = {"mode": mode, "executable_bytes": path.stat().st_size,
                "executable_sha256": hashlib.sha256(path.read_bytes()).hexdigest(), "n": len(values)}
        for key in ("elapsed_ms", "peak_physical_bytes", "peak_rss_bytes"):
            if key in values[0]:
                item[key] = {"median": statistics.median(x[key] for x in values),
                             "min": min(x[key] for x in values), "max": max(x[key] for x in values)}
        summary.append(item)
    revision = subprocess.check_output([args.bun, "--revision"], text=True).strip()
    source = Path(__file__).with_name("example.ts")
    result = {"platform": platform.platform(), "bun_revision": revision,
              "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
              "expected_output": reference,
              "method": "Fresh processes; one warmup per mode; alternating order; warm filesystem caches; elapsed includes launch and any time wrapper. Memory is physical footprint/RSS on macOS, RSS on Linux, unavailable on other platforms.",
              "observations": records, "summary": summary}
    args.out.write_text(json.dumps(result, indent=2) + "\n")
    for row in summary:
        print(f"{row['mode']}: {row['elapsed_ms']['median']:.1f} ms, {row['executable_bytes']/1e6:.1f} MB file")
        for key in ("peak_physical_bytes", "peak_rss_bytes"):
            if key in row:
                print(f"  {key}: {row[key]['median']/1e6:.1f} MB")
    print(f"Outputs match the independent checksum. Saved {args.out}")


if __name__ == "__main__":
    main()
