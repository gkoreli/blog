# interp-engine eager vs TransformerLens on Apple Silicon

Check date: 2026-09-01 (evening, America/Los_Angeles). interp-engine baseline `74716092e5bad8beca1e27193ec9980a8e9a4e85`, installed from the pinned clone as 1.5.1. Every number below is **Reproduced** on the author's machine. Scripts and raw JSON: `repro/scripts/` and `repro/results/` beside this file.

## How this ran

A Codex worker wrote the harness and environment inside its sandbox, where torch reported `mps.is_built() = True` and `mps.is_available() = False` on two PyTorch builds (2.8.0 and 2.13.0); macOS's sandbox hides the Metal device from child processes. The worker's first report recorded that blocker and no model numbers. The editor then ran the same scripts from an unsandboxed shell, where MPS was available, after two harness fixes:

1. The capture script had used `blocks.N.attn.hook_out` and `blocks.N.mlp.hook_out`, which exist only on TransformerLens 3's `TransformerBridge`. The harness loads the `HookedTransformer` class, whose block-level `hook_attn_out` and `hook_mlp_out` fire **after** Gemma-2's post-sublayer norms (`transformer_block.py`, "we do it before the hook so hook_attn_out captures that which is added"). The matched pairing is therefore interp-engine's `*_post` points against those hooks; the raw points have no hook in that class. The naive pairing (raw `mlp_out` / `attn_out` against the block-level names) was kept as the demonstration, with gpt2 as the control.
2. TransformerLens calls hooks as `fn(activation, hook=hook)`; two hook functions took the second argument positionally and were changed to accept the keyword.

Environment: Python 3.12.12, torch 2.13.0, transformers 5.14.1, transformer-lens 3.5.1, interp-engine 1.5.1, macOS 26.5.2, Apple M5, 24 GiB unified memory. Both engines in float32 on MPS. TransformerLens loaded with `from_pretrained_no_processing` (no layer-norm folding, no weight centering) so tensors are comparable. `HF_HUB_OFFLINE=1`; models from the local cache at revisions `c5ebcd40` (google/gemma-2-2b) and `607a30d7` (gpt2). TransformerLens warned on load: "MPS backend may produce silently incorrect results (PyTorch 2.13.0)". Its weights were confirmed on `mps:0`; the "Moving model to device: cpu" line in the logs is an intermediate step of its loader.

Commands:

```sh
cd repro && export HF_HUB_OFFLINE=1
.venv/bin/python scripts/capture_parity.py
.venv/bin/python scripts/steering_parity.py
.venv/bin/python scripts/throughput_mps.py
```

## 1. Capture parity

One 29-token prompt (with BOS). Four points at five layers per model. Metrics over the whole `[1, 29, d_model]` tensor plus the last-token cosine.

Matched pairings (interp-engine point ↔ TransformerLens hook):

| Model | Points | Layers | Max abs diff (worst cell) | Last-token cosine (all cells) |
|---|---|---|---:|---:|
| gemma-2-2b | resid_post ↔ hook_resid_post, resid_mid ↔ hook_resid_mid, attn_out_post ↔ hook_attn_out, mlp_out_post ↔ hook_mlp_out | 0, 6, 13, 19, 25 | 5.3e-4 (resid_post, L25) | ≥ 0.99999 |
| gpt2 | same four | 0, 3, 6, 9, 11 | 1.7e-4 (mlp_out_post, L3) | ≥ 0.99999 |

Naive pairings (raw interp-engine point ↔ TransformerLens block-level hook):

| Pairing | gemma L0 | L6 | L13 | L19 | L25 | gpt2 (all layers) |
|---|---:|---:|---:|---:|---:|---:|
| mlp_out ↔ hook_mlp_out, last-token cosine | 0.874 | 0.871 | 0.803 | 0.821 | 0.895 | 1.00000 |
| mlp_out ↔ hook_mlp_out, max abs diff | 135 | 126 | 196 | 50 | 272 | ≤ 1.7e-4 |
| attn_out ↔ hook_attn_out, last-token cosine | 0.829 | 0.758 | 0.712 | 0.735 | 0.791 | 1.00000 |
| attn_out ↔ hook_attn_out, max abs diff | 53 | 38 | 15 | 22 | 158 | ≤ 9.9e-5 |

Reading: where names mean the same tensor the engines agree to fp32 round-off. The naive pairing on Gemma is a plausible-looking wrong tensor (cosine 0.71–0.90) and is exact on gpt2, which has no post-sublayer norm.

## 2. Steering parity

CAA-style vector: mean over six sentiment contrast pairs of (positive − negative) `resid_post` at the final token, extracted with interp-engine eager. Injected at 4× the raw vector (delta norm 325 on gemma-2-2b, 144 on gpt2) from the final prompt token onward on an 11-token prompt: interp-engine `steer` with `position_mask = [0 … prompt_len−2]` (excluded prompt positions; decode tokens always steered), TransformerLens with a forward hook adding the same delta at the same positions. Greedy, 20 new tokens.

| Model | Point / layer | Steered next-token logits, max abs diff | Argmax equal | 20 greedy tokens equal |
|---|---|---:|---|---|
| gemma-2-2b | resid_post / 13 | 7.7e-5 | yes (674) | yes |
| gpt2 | resid_post / 6 | 6.9e-5 | yes (284) | yes |

Unsteered next-token logits also matched (max abs diff 5.5e-5 and 9.2e-5). At this strength both models produce degenerate text ("a spirit of the spirit of the spirit…"); parity holds in that regime too. The mask "from the final prompt token onward" was exactly expressible in both engines.

## 3. Throughput on MPS

128-token prompt, 64 greedy new tokens, one warm-up, three timed runs, median tokens per second. Capture at `resid_post.13` (gemma) / `resid_post.6` (gpt2). Semantics differ: interp-engine's `capture_generation` generates, then runs one recapture forward over prompt + generated; TransformerLens captures each position during KV-cached decoding; plain transformers has no hooks. Peak memory is a 2 ms sample of `torch.mps.driver_allocated_memory`.

| Model | Plain transformers | interp-engine eager + capture | TransformerLens + caching hook |
|---|---:|---:|---:|
| gemma-2-2b tok/s | 7.65 | 6.19 | 1.86 |
| gemma-2-2b peak driver memory | 11.1 GB | 12.4 GB | 17.0 GB |
| gpt2 tok/s | 57.8 | 85.9 | 39.6 |
| gpt2 peak driver memory | 1.8 GB | 2.4 GB | 1.2 GB |

Reading: no laptop speedup exists or was claimed; the eager backend costs about a fifth of plain-transformers speed on gemma-2-2b for the recapture pass, and TransformerLens's decode loop is the slow path on this machine.

## What this does and does not show

It shows first-hand that on Apple Silicon the eager backend matches `HookedTransformer` on the residual and contribution points at fp32, that steering arithmetic matches a hand-written hook, and that the naming trap the maintainers describe is large on Gemma-2 and absent on gpt2. It does not test the vLLM backends (CUDA only), fp16 or bf16 behaviour, attention-matrix points, more than one prompt, or prompts longer than 128 tokens. Two runs are a demonstration, not the fp16 four-layer sweep proposed in `03` as a verdict-changing test.
