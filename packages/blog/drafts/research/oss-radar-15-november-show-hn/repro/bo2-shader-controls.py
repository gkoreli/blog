"""Build unchanged vendored code and the bridge fixture; never reads game assets."""
import concurrent.futures
import json
import os
from pathlib import Path
import subprocess
import sys
import time

source, root, receipt = map(Path, sys.argv[1:])
root.mkdir(parents=True, exist_ok=False)
vendor = source / "third_party/HLSLcc"
include = ["-I" + str(vendor / x) for x in [".", "include", "src", "src/internal_includes", "src/cbstring"]]
files = sorted((vendor / "src").glob("*.cpp")) + sorted((vendor / "src/cbstring").glob("*.c"))
started = time.monotonic()

def compile_one(path):
    obj = root / (path.stem + ".o")
    cpp = path.suffix == ".cpp"
    cmd = ["clang++" if cpp else "clang", "-std=c++11" if cpp else "-std=c99", "-O1", *include, "-c", str(path), "-o", str(obj)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    (root / (path.stem + ".log")).write_text(r.stdout + r.stderr)
    r.check_returncode()
    return obj

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    objects = list(pool.map(compile_one, files))
exe = root / "shader-controls"
fixture = Path(__file__).with_suffix(".cpp")
r = subprocess.run(["clang++", "-std=c++17", "-O1", "-I" + str(source), *include, str(fixture), *map(str, objects), "-o", str(exe)], capture_output=True, text=True)
(root / "link.log").write_text(r.stdout + r.stderr)
r.check_returncode()
r = subprocess.run([str(exe)], env={**os.environ, "BO2_TR_CACHE": "0"}, capture_output=True, text=True)
(root / "run.log").write_text(r.stdout + r.stderr)
r.check_returncode()
line = next(x for x in r.stdout.splitlines() if x.startswith("RADAR_RESULT "))
result = json.loads(line.removeprefix("RADAR_RESULT "))
result.update(source="ea6f78e0a41a374e5748635da99bafcc2d062d0b", compiledSources=len(files), elapsedSeconds=round(time.monotonic() - started, 3), gameAssetsUsed=False, metalRuntimeCompilationPerformed=False)
receipt.write_text(json.dumps(result, indent=2) + "\n")
print(json.dumps(result))
