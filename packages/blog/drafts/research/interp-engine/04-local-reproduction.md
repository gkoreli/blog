# interp-engine eager vs TransformerLens on Apple Silicon

## Outcome

The requested MPS measurements could not be produced in this managed execution session. The host is an Apple M5 Mac and `system_profiler SPDisplaysDataType` reports `Metal: Supported`, but the isolated PyTorch process reports **Reproduced: `torch.backends.mps.is_built() == True`**, **Reproduced: `torch.backends.mps.is_available() == False`**, and **Reproduced: `torch.mps.device_count() == 0`**. Creating `torch.ones(1, device="mps")` raises **Reproduced: `RuntimeError: The MPS backend is supported on macOS 14.0+. Current OS version can be queried using sw_vers`**, even though `sw_vers` reports **Reproduced: macOS 26.5.2**.

This was reproduced with cached PyTorch **Reproduced: 2.8.0** and again with the final explicit pin, **Reproduced: 2.13.0**. The latter is the version recorded in every JSON result. This establishes that the failure was not fixed by selecting the newer locally available MPS build. It does not establish whether the root cause is the managed sandbox's Metal entitlement/device visibility or a host-level PyTorch issue.

No CPU result was substituted. The requested CPU fallback applied only if Gemma exhausted MPS memory; MPS never became available, and no model forward pass was started. vLLM was neither installed nor tested: **Reproduced: `importlib.util.find_spec("vllm") is None`**.

## Environment

| Item | Exact value | Evidence status |
| --- | ---: | --- |
| interp-engine | 1.5.1, installed from the read-only source clone at SHA `74716092e5bad8beca1e27193ec9980a8e9a4e85` | Reproduced |
| TransformerLens | 3.5.1 | Reproduced |
| transformers | 5.14.1 | Reproduced |
| torch | 2.13.0 | Reproduced |
| Python | 3.12.12 | Reproduced |
| Machine | arm64, Apple M5 with 10 GPU cores | Reproduced |
| macOS | 26.5.2, build 25F84 | Reproduced |
| Requested device | MPS | Reproduced |
| PyTorch MPS build | built = true | Reproduced |
| PyTorch MPS runtime | available = false; device count = 0 | Reproduced |
| dtype | float32 | Reproduced |
| seed | 1729 | Reproduced |
| Hugging Face mode | `HF_HUB_OFFLINE=1` on every measurement invocation | Reproduced |
| uv environment health | 82 packages; `uv pip check`: all compatible | Reproduced |

The offline Gemma snapshot is **Reproduced: `c5ebcd40d208330abc697524c919956e692655cf`**. Its config, tokenizer, index, and all three safetensor shards are present. The offline GPT-2 snapshot is **Reproduced: `607a30d783dfa663caf39e06633721c8d4cfcd7e`**. Its config, tokenizer files, and `model.safetensors` are present. Hugging Face stores this GPT-2 checkpoint under the legacy canonical cache namespace `models--gpt2`; the scripts label the requested article model as `openai-community/gpt2` and pass TransformerLens its `gpt2` alias. Both configs and tokenizers load successfully offline: **Reproduced: `Gemma2Config` / `GemmaTokenizer`, vocabulary 256,000** and **Reproduced: `GPT2Config` / `GPT2Tokenizer`, vocabulary 50,257**.

## 1. Capture parity

The script implements the requested fixed English prompt, captures four points at all requested layers, and uses the exact mappings in `docs/ENGINE_HOOK_MAPPINGS.md`:

- `resid_post` to `blocks.L.hook_resid_post`
- `resid_mid` to `blocks.L.hook_resid_mid`
- raw `attn_out` to `blocks.L.attn.hook_out`
- raw `mlp_out` to `blocks.L.mlp.hook_out`

It also computes Gemma's deliberately wrong comparison, interp-engine raw `mlp_out` versus TransformerLens block-level `blocks.L.hook_mlp_out`. The mapping document says the latter is the post-sublayer-normalized residual contribution on Gemma-2, not the raw MLP module output.

| Model | Requested layers | Per-point shapes and metrics | Status |
| --- | --- | --- | --- |
| google/gemma-2-2b | 0, 6, 13, 19, 25 | No max/mean absolute differences or last-token cosines produced | Reproduced: blocked at MPS preflight |
| openai-community/gpt2 | 0, 3, 6, 9, 11 | No max/mean absolute differences or last-token cosines produced | Reproduced: blocked at MPS preflight |

Result: [results/capture_parity.json](results/capture_parity.json).

## 2. Steering parity

The script defines six same-frame positive/negative sentiment pairs and would construct the CAA vector as the mean of `(positive final-token resid_post - negative final-token resid_post)` in interp-engine eager. It applies the exact same raw vector times **Reproduced configuration: 4.0** at `resid_post` layer **Reproduced configuration: 13 for Gemma** and **Reproduced configuration: 6 for GPT-2**.

interp-engine's `position_mask` is an exclusion mask, an API detail that is easy to reverse accidentally. “From the final prompt token onward” is exactly expressible: exclude prompt positions `0..prompt_len-2`; the eager steering context always steers subsequently generated positions. The TransformerLens hook implements the identical absolute-position rule. Separate fresh contexts are used for the next-token logits pass and generation because interp-engine's eager mask hook tracks consumed positions. Greedy generation is configured for 20 tokens with EOS stopping disabled.

| Model | Point/layer | Vector norm and delta norm | Logit diff / argmax | First 20 greedy tokens | Status |
| --- | --- | --- | --- | --- | --- |
| google/gemma-2-2b | resid_post / 13 | Not produced | Not produced | Not produced | Reproduced: blocked at MPS preflight |
| openai-community/gpt2 | resid_post / 6 | Not produced | Not produced | Not produced | Reproduced: blocked at MPS preflight |

Result: [results/steering_parity.json](results/steering_parity.json).

## 3. MPS throughput

The script prepares an exact 128-token prompt, requests 64 new greedy tokens, performs one warm-up and three measured runs, synchronizes MPS around the timer, and samples `torch.mps.current_allocated_memory()` and `torch.mps.driver_allocated_memory()` every 2 ms. The selected capture layer is 13 for Gemma and 6 for GPT-2.

| Model | Implementation | Requested workload | Median tokens/s | Peak memory | Status |
| --- | --- | --- | ---: | ---: | --- |
| google/gemma-2-2b | interp-engine eager `capture_generation` | 128 + 64 tokens, 1 warm-up + 3 runs | Not produced | Not produced | Reproduced: blocked at MPS preflight |
| google/gemma-2-2b | TransformerLens generate + caching hook | 128 + 64 tokens, 1 warm-up + 3 runs | Not produced | Not produced | Reproduced: blocked at MPS preflight |
| google/gemma-2-2b | plain transformers, no hooks | 128 + 64 tokens, 1 warm-up + 3 runs | Not produced | Not produced | Reproduced: blocked at MPS preflight |
| openai-community/gpt2 | interp-engine eager `capture_generation` | 128 + 64 tokens, 1 warm-up + 3 runs | Not produced | Not produced | Reproduced: blocked at MPS preflight |
| openai-community/gpt2 | TransformerLens generate + caching hook | 128 + 64 tokens, 1 warm-up + 3 runs | Not produced | Not produced | Reproduced: blocked at MPS preflight |
| openai-community/gpt2 | plain transformers, no hooks | 128 + 64 tokens, 1 warm-up + 3 runs | Not produced | Not produced | Reproduced: blocked at MPS preflight |

An important interpretation detail is encoded in the script and should accompany eventual numbers: interp-engine eager `capture_generation` first generates with a KV cache and then performs one full recapture forward over `prompt + generated[:-1]`. TransformerLens captures the prefill and decode positions directly through a caching hook during KV-cached generation. Thus the requested columns price different implementation strategies, not only different hook frameworks. Plain transformers is the no-hook baseline.

Result: [results/throughput_mps.json](results/throughput_mps.json).

## Exact commands

The requested initial setup commands were attempted first:

```sh
uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python 'interp-engine==1.5.1' 'transformer-lens>=3.0'
```

The first command initially failed because uv could not initialize its cache under `/Users/goga/.cache/uv` in the managed sandbox (`Operation not permitted`). Pointing uv at a workspace cache created the venv:

```sh
UV_CACHE_DIR=.uv-cache uv venv --python 3.12 .venv
```

The normal package install then failed after three retries because this session had no DNS route to `https://pypi.org/simple/transformer-lens/`. The already-present uv archives were copied into a writable workspace cache; cached wheel contents were repacked locally and installed with uv. interp-engine itself was installed into this venv from the exact read-only 1.5.1 baseline clone:

```sh
UV_CACHE_DIR=.uv-cache uv pip install --python .venv/bin/python --no-deps wheelhouse/*.whl
UV_CACHE_DIR=.uv-cache uv pip install --python .venv/bin/python --no-build-isolation --no-deps /private/tmp/claude-501/-Users-goga-Documents-goga-blog/7fed1700-9c71-4dfb-9eb3-c8a61c669103/scratchpad/interp-engine
UV_CACHE_DIR=.uv-cache uv pip check --python .venv/bin/python
```

The final check returned **Reproduced: `Checked 82 packages`** and **Reproduced: `All installed packages are compatible`**. Nothing was installed into another Python environment.

Device probes:

```sh
system_profiler SPDisplaysDataType
sw_vers
HF_HUB_OFFLINE=1 .venv/bin/python - <<'PY'
import torch
print(torch.__version__)
print(torch.backends.mps.is_built())
print(torch.backends.mps.is_available())
print(torch.mps.device_count())
print(torch.ones(1, device="mps"))
PY
```

Measurement invocations, run exactly as follows:

```sh
HF_HUB_OFFLINE=1 .venv/bin/python scripts/capture_parity.py
HF_HUB_OFFLINE=1 .venv/bin/python scripts/steering_parity.py
HF_HUB_OFFLINE=1 .venv/bin/python scripts/throughput_mps.py
```

Each returned **Reproduced: exit status 2** after writing its JSON result, meaning “blocked at required device preflight.” Syntax validation passed:

```sh
.venv/bin/python -m py_compile scripts/common.py scripts/capture_parity.py scripts/steering_parity.py scripts/throughput_mps.py
```

## What this evidence does and does not show

It shows, first-hand and reproduced, that this execution sandbox cannot expose the Mac's Metal GPU to either tested PyTorch MPS build, despite the host reporting Metal support. It also verifies the exact software environment, offline model snapshots, hook mapping choices, steering mask semantics, and runnable measurement implementations.

It does **not** provide evidence for hook-point numerical parity, steering numerical/text parity, or MPS throughput. There are no model-derived numerical claims to publish from this run. Running the same three commands from a process where `torch.backends.mps.is_available()` is true is required before using the article's intended claims. The scripts intentionally refuse CPU substitution so a blocked MPS run cannot be mistaken for Apple GPU evidence.

## API surprises and errors

1. Gemma's raw-output mapping is non-obvious: interp-engine `mlp_out` maps to `blocks.L.mlp.hook_out`; `blocks.L.hook_mlp_out` is a different, post-sublayer-normalized tensor by design.
2. `steer(..., position_mask=...)` takes positions to exclude, not positions to include. The requested mask is nevertheless exactly expressible.
3. interp-engine eager `capture_generation` is generate-then-recapture; it is not an eager decode-time capture hook. Throughput comparisons must state that extra full forward.
4. The managed session denied uv's normal cache initialization and had no PyPI DNS route. Cached artifacts and the pinned local source clone were used without reading credentials or any `.env` file.
5. The blocking MPS traceback is summarized in all three JSONs. No model-specific traceback exists because the shared device preflight correctly stopped before loading weights.

## Uncertainty

The precise reason Metal is invisible remains unresolved. The evidence is consistent with sandbox GPU/Metal restrictions, but the PyTorch exception text presents it as an OS-version check even on macOS 26.5.2. Because no unsandboxed command execution was available, that distinction could not be tested. The measurement scripts have been syntax-checked but their model-forward paths could not be runtime-validated here.

Execution assignment: **Reproduced: model `gpt-5.6-sol`, reasoning effort `high`**.

Files created:

- [REPORT.md](/private/tmp/claude-501/-Users-goga-Documents-goga-blog/7fed1700-9c71-4dfb-9eb3-c8a61c669103/scratchpad/repro/REPORT.md)
- [capture_parity.py](/private/tmp/claude-501/-Users-goga-Documents-goga-blog/7fed1700-9c71-4dfb-9eb3-c8a61c669103/scratchpad/repro/scripts/capture_parity.py)
- [steering_parity.py](/private/tmp/claude-501/-Users-goga-Documents-goga-blog/7fed1700-9c71-4dfb-9eb3-c8a61c669103/scratchpad/repro/scripts/steering_parity.py)
- [throughput_mps.py](/private/tmp/claude-501/-Users-goga-Documents-goga-blog/7fed1700-9c71-4dfb-9eb3-c8a61c669103/scratchpad/repro/scripts/throughput_mps.py)
- [common.py](/private/tmp/claude-501/-Users-goga-Documents-goga-blog/7fed1700-9c71-4dfb-9eb3-c8a61c669103/scratchpad/repro/scripts/common.py)
- [capture_parity.json](/private/tmp/claude-501/-Users-goga-Documents-goga-blog/7fed1700-9c71-4dfb-9eb3-c8a61c669103/scratchpad/repro/results/capture_parity.json)
- [steering_parity.json](/private/tmp/claude-501/-Users-goga-Documents-goga-blog/7fed1700-9c71-4dfb-9eb3-c8a61c669103/scratchpad/repro/results/steering_parity.json)
- [throughput_mps.json](/private/tmp/claude-501/-Users-goga-Documents-goga-blog/7fed1700-9c71-4dfb-9eb3-c8a61c669103/scratchpad/repro/results/throughput_mps.json)
- `.gitignore`
- `.venv/` isolated Python environment