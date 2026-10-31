"""Run from the pinned experimental/riscv tree on PYTHONPATH; emits synthetic evidence JSON."""
import hashlib
import importlib.metadata
import json
import platform
import resource
import time
from pathlib import Path
from unittest.mock import patch

import torch
from chipformer.rv import firmware, ref, tiny
from chipformer.rv import spec as S
from chipformer.rv.asm import assemble


def arithmetic(a, b):
    return f"""_start: li t0, {a}
li t1, {b}
mul a0, t0, t1
addi a0, a0, 2
la s0, slot
sw a0, 0(s0)
li a0, 0
lbu a0, 0(s0)
li a7, 1
ecall
li a7, 93
ecall
.data
slot: .word 0
"""


cases = [
    ("7*9+2, store and reload", arithmetic(7, 9), "A"),
    ("8*8+2, changed operands", arithmetic(8, 8), "B"),
    ("illegal instruction", "_start: .word 0x0000000b", ""),
]
torch.set_num_threads(4)
start = time.monotonic()
model, circuit = tiny.build()
build_seconds = time.monotonic() - start
rows = []
blocked_calls = 0


def blocked(*args, **kwargs):
    global blocked_calls
    blocked_calls += 1
    raise AssertionError("Reference interpreter called during model generation")


# Prove the guard throws, then reset the count before any measured generation.
with patch.object(ref.Machine, "record", blocked):
    try:
        ref.Machine.from_program(assemble(cases[0][1])).record()
    except AssertionError:
        assert blocked_calls == 1
    else:
        raise AssertionError("The reference guard did not fire")
blocked_calls = 0

for name, source, expected_output in cases:
    prog = assemble(source)
    reference = ref.Machine.from_program(prog)
    expected_trace = reference.run(1000)[1:]
    machine = ref.Machine.from_program(prog)
    start = time.monotonic()
    with patch.object(ref.Machine, "run", blocked), patch.object(ref.Machine, "record", blocked):
        got = firmware.run(model, circuit, machine, max_new=200)
    elapsed = time.monotonic() - start
    text = firmware.output_text(got)
    assert got == expected_trace, name
    assert text == expected_output, (name, text)
    assert blocked_calls == 0
    rows.append({
        "name": name, "source": source, "expectedOutput": expected_output,
        "actualOutput": text, "traceMatchesReference": True,
        "generatedTokens": len(got), "lastToken": S.name(got[-1]),
        "faultTokens": [S.name(t) for t in got if S.family(t)[0] == "FLT"],
        "traceSha256": hashlib.sha256(json.dumps(got).encode()).hexdigest(),
        "seconds": elapsed, "referenceCallsDuringGeneration": blocked_calls,
    })
    print(json.dumps(rows[-1]), flush=True)

result = {
    "sourceCommit": "f07a0b2e38271454c4d455dc2b9bf78d3d399170",
    "scope": "Standalone compiled CPU in stock Qwen modules; not the merged pretrained 4B chat model",
    "platform": platform.platform(), "device": str(next(model.parameters()).device),
    "dtype": str(next(model.parameters()).dtype), "threads": torch.get_num_threads(),
    "versions": {n: importlib.metadata.version(n) for n in ["torch", "transformers", "numpy", "safetensors"]},
    "parameters": sum(p.numel() for p in model.parameters()),
    "hiddenSize": model.layout.hidden, "layers": model.config.num_hidden_layers,
    "buildSeconds": build_seconds, "peakRssBytes": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
    "guardSelfTestPassed": True, "referenceCallsDuringGeneration": blocked_calls,
    "cases": rows,
}
Path(__import__("sys").argv[1]).write_text(json.dumps(result, indent=2) + "\n")
