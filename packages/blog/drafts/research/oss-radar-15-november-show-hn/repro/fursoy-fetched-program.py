"""Actual S1 frontend execution, with an authored integer oracle; no Sail/Linux claim."""
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import subprocess
import sys
import time

source, root, receipt = map(Path, sys.argv[1:4])
root.mkdir(parents=True, exist_ok=False)
spec = importlib.util.spec_from_file_location("fursoy_runner", source / "tools/run_s1_sail_cosim.py")
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
obj = root / "obj"
cmd = ["verilator", "--cc", "--exe", "--build", "--assert", "-j", "4", "-Wno-fatal", "-Wno-UNOPTFLAT", "-Wno-WIDTH", "-Wno-CASEINCOMPLETE", "--x-assign", "0", "--x-initial", "0", "-CFLAGS", "-O3", "-Irtl/core", "--top-module", "fursoy_s1_core", "--Mdir", str(obj), *map(str, runner.CORE_RTL), str(runner.TB_CPP)]
start = time.monotonic()
if len(sys.argv) > 4:
    executable = Path(sys.argv[4])
else:
    with (root / "build.log").open("w") as log:
        subprocess.run(cmd, cwd=source, stdout=log, stderr=subprocess.STDOUT, check=True)
    executable = obj / "Vfursoy_s1_core"

# Standard RV64I/M instruction formats. No host cross-assembler or guest executable is required.
def addi(rd, rs, imm):
    return ((imm & 4095) << 20) | (rs << 15) | (rd << 7) | 0x13

def alu(rd, rs1, rs2, funct7=0):
    return (funct7 << 25) | (rs2 << 20) | (rs1 << 15) | (rd << 7) | 0x33

def bne(rs1, rs2, offset):
    imm = offset & 8191
    return ((imm >> 12) << 31) | (((imm >> 5) & 63) << 25) | (rs2 << 20) | (rs1 << 15) | (1 << 12) | (((imm >> 1) & 15) << 8) | (((imm >> 11) & 1) << 7) | 0x63

def sd(rs, base, imm):
    return (((imm >> 5) & 127) << 25) | (rs << 20) | (base << 15) | (3 << 12) | ((imm & 31) << 7) | 0x23

def ld(rd, base, imm):
    return ((imm & 4095) << 20) | (base << 15) | (3 << 12) | (rd << 7) | 0x03

def jump(offset):
    return (((offset >> 20) & 1) << 31) | (((offset >> 1) & 1023) << 21) | (((offset >> 11) & 1) << 20) | (((offset >> 12) & 255) << 12) | 0x6f
cases = []
for name, operation in [("multiply", "mul"), ("changed-instruction-control", "add")]:
    # x12 = 7*9, x13 = 10+...+1; store both, then load them into x15/x16.
    words = [addi(10, 0, 7), addi(11, 0, 9), alu(12, 10, 11, int(operation == "mul")),
             addi(13, 0, 0), addi(14, 0, 10), alu(13, 13, 14), addi(14, 14, -1), bne(14, 0, -8),
             0x1000 | (5 << 7) | 0x17, addi(5, 5, -32), sd(12, 5, 0), sd(13, 5, 8),
             0x0330000f, ld(15, 5, 0), ld(16, 5, 8), jump(0xffc - 60)]
    image = bytearray(0x1010)
    struct.pack_into('<' + 'I' * len(words), image, 0, *words)
    struct.pack_into('<I', image, 0xffc, addi(0, 0, 0))
    binary = root / (name + '.bin')
    binary.write_bytes(image)
    trace = root / (name + ".jsonl")
    run = [str(executable), "--trace-out", str(trace), "--htif-pc", "80000ffc", "--max-cycles", "20000", "--seg", f"80000000:{binary}"]
    r = subprocess.run(run, cwd=source, capture_output=True, text=True, timeout=30)
    (root / (name + ".log")).write_text(r.stdout + r.stderr)
    r.check_returncode()
    events = [json.loads(x) for x in trace.read_text().splitlines()]
    regs = {}
    for e in events:
        if e["type"] == "retire" and e["rd"] and not e["fp_dest"] and not e["vec_dest"]:
            regs[e["rd"]] = int(e["gpr"], 16)
    matched = regs.get(15) == 7 * 9 and regs.get(16) == sum(range(1, 11))
    assert not any(e["type"] == "trap" for e in events)
    assert matched == (operation == "mul")
    assert regs[15] == (63 if operation == "mul" else 16) and regs[16] == 55
    cases.append({"case": name, "loadedProduct": regs[15], "loadedSum": regs[16], "expectedProduct": 63, "expectedSum": 55, "matched": matched, "retiredEvents": len(events), "lastCycle": max(e["cycle"] for e in events), "traceSha256": hashlib.sha256(trace.read_bytes()).hexdigest()})
result = {"source": "377ae9563ab1b88ee0a037f2223ab49822968396", "checkedAt": datetime.now(timezone.utc).isoformat(), "frontendEnabled": True, "harness": "verification/s1_sail_cosim_tb.cpp", "harnessSha256": hashlib.sha256(runner.TB_CPP.read_bytes()).hexdigest(), "harnessBinarySha256": hashlib.sha256(executable.read_bytes()).hexdigest(), "cases": cases, "elapsedSeconds": round(time.monotonic() - start, 3), "harnessBuildReused": len(sys.argv) > 4, "commandDifferencesFromSailRunner": ["--assert enabled", "-Wno-fatal retains known lint warnings", "authored instruction words replace ELF/cross-assembler inputs"], "scope": "Authored integer/multiply/loop/store/load program and changed-instruction negative control; no Sail differential, Linux boot, FP/vector, timing or hardware result."}
receipt.write_text(json.dumps(result, indent=2) + "\n")
print(json.dumps(result))
