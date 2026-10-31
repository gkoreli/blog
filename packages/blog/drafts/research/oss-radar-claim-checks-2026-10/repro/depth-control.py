#!/usr/bin/env python3
"""Recheck tsrs's published two-file constraint-cache example on installed compilers.

Fixture adapted from oxc-project/tsrs notes/determinism-base-constraint-depth.md
at e18fb617ee516917342dcda27063ab67acc79e49 (Apache-2.0).
"""

import argparse
import json
import os
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--compilers", type=Path, required=True)
parser.add_argument("--output", type=Path, required=True)
parser.add_argument("--node", default="node")
options = parser.parse_args()
options.output.mkdir(parents=True, exist_ok=True)
fixture = options.output / "fixture"
fixture.mkdir(exist_ok=True)
(fixture / "a.ts").write_text('const f: typeof victim = <U extends Box>(x: U, y: { b: string }) => x.b;\n')
(fixture / "b.ts").write_text('interface Box { a: Box; b: string }\n'
    'function victim<T extends Box>(x: T, y: T["a"]["a"]["a"]["a"]["a"]["a"]["a"]["a"]["a"]["a"]): string {\n'
    '  return x.b;\n}\n')
environment = {key: value for key, value in os.environ.items()
               if not key.startswith(("TSRS_", "TS_GO_"))
               and key not in {"GOMAXPROCS", "GOMEMLIMIT", "GOGC", "RAYON_NUM_THREADS"}}
resolver = """
for (const name of ['ts70','ts71','tsrs']) {
 const {default: resolve} = await import(`${process.argv[1]}/node_modules/${name}/lib/getExePath.js`);
 console.log(JSON.stringify({name,path:resolve()}));
}
"""
resolved = subprocess.check_output([options.node, "--input-type=module", "-e", resolver,
                                    str(options.compilers.resolve())], text=True)
paths = {row["name"]: row["path"] for row in map(json.loads, resolved.splitlines())}
results = []
for files in [["a.ts", "b.ts"], ["b.ts", "a.ts"]]:
    (fixture / "tsconfig.json").write_text(json.dumps({"compilerOptions": {
        "strict": True, "noEmit": True, "target": "es2020", "types": []}, "files": files}) + "\n")
    for package, mode in [("ts70", []), ("ts71", []), ("tsrs", ["--fast", "false"]), ("tsrs", ["--fast"])]:
        for count in [1, 2, 4, 8]:
            args = [paths[package], "-p", ".", "--pretty", "false", "--checkers", str(count), *mode]
            completed = subprocess.run(args, cwd=fixture, env=environment, capture_output=True, text=True, timeout=30)
            results.append({"files": files, "compiler": package, "mode": mode, "checkers": count,
                            "exitCode": completed.returncode, "stdout": completed.stdout,
                            "stderr": completed.stderr})
artifact = options.output / "results.json"
artifact.write_text(json.dumps({"source": "oxc-project/tsrs@e18fb617ee516917342dcda27063ab67acc79e49",
                               "results": results}, indent=2) + "\n")
print(json.dumps(results, indent=2))
