# Adversarial adoption review: interp-engine

Baseline: `74716092e5bad8beca1e27193ec9980a8e9a4e85`, 2026-09-01. The clone remained unmodified.

Evidence labels:

- **Code-inspected** — read directly at the baseline SHA.
- **Reproduced** — recomputed from repository metadata or committed JSON.
- **Reported** — project benchmark/result or external page; I did not rerun the model.
- **Proposed** — a test that has not been run.

## Findings, ordered by adoption impact

### 1. High impact: the speed headlines are true only under narrow conditions

The [announcement’s](https://www.neuronpedia.org/blog/interp-engine) “over 40x” wording does not identify one unique benchmark row. The repository supports it only as aggregate throughput with eight concurrent requests, using the opt-in static-tap backend on a B200:

| Model | Eager HF | vLLM-static | Ratio |
|---|---:|---:|---:|
| Gemma-2-2B | 30.1 | 1,238 | 41.1x |
| Qwen3-4B | 23.9 | 1,018 | 42.6x |
| Llama-3.1-8B | 32.2 | 1,536 | 47.7x |
| Qwen3.8-27B | 9.5 | 386 | 40.6x |
| DeepSeek-V4-Flash | 3.2 | 402 | 125.6x |

These are aggregate tokens per second, not single-user latency. Eager requests serialize while vLLM batches them. **Evidence: Reported and Code-inspected.** `README.md:79-99`; `benchmarks/results-latest.md:113-127`.

The “~7x faster” Jacobian Lens claim maps most naturally to the Gemma-2-2B single-stream generation row: 30.9 tok/s eager versus 214 tok/s with static taps, or 6.9x. Ordinary capture-capable vLLM is 31.5 tok/s, rounded to 1.0x. An eager-only user gets no comparable acceleration. **Evidence: Reported.** `README.md:81-89`; `benchmarks/results-latest.md:89-99`.

That row does not benchmark Jacobian Lens calculation itself. The committed lens readout benchmark is 3.3 ms eager versus 202 ms through either vLLM backend on Gemma-2-2B. That difference is process-boundary overhead, and the benchmark explicitly measures only 512 residual rows to top-10 tokens. Therefore the ~7x claim should be read as end-to-end generation throughput for a lens-serving configuration, not “the Jacobian calculation runs seven times faster.” **Evidence: Reported; interpretation is Inference.** `benchmarks/results-latest.md:189-213`.

The benchmark conditions are unusually favorable: Linux, B200 with 178.4 GiB, CUDA 13, bf16, 512 prompt tokens, 128 generated tokens, and vLLM 0.26.0. Differences below about 10% are declared noise. **Evidence: Reported.** `benchmarks/results-latest.md:16-24,39-56`.

The fastest capture-capable backend also changes the product:

- `vllm-static` uses a fixed tap set and more VRAM.
- Its static buffers reduce `max_num_batched_tokens` from 16,384 to 1,024.
- Hyper-connection models need four times the tap-buffer width.
- A static and compiled engine cannot share one process.
- The documentation and newer benchmark disagree about whether static capture/lens latency has been measured, showing documentation drift. **Evidence: Code-inspected.** `docs/PERFORMANCE.md:121-182`; compare `docs/PERFORMANCE.md:183-189` with `benchmarks/results-latest.md:129-159,189-199`.

Actual activation capture can be slower than eager. On Gemma-2-2B, one-layer capture is 34.9 ms eager versus 85.3/90.2 ms vLLM/static; all-layer capture is 112 ms versus 381/334 ms. Transporting tensors out of the worker is the stated cause. **Evidence: Reported.** `benchmarks/results-latest.md:129-159`.

**Adoption consequence:** do not use “40x” in a capacity plan unless the workload has concurrency, fixed taps, Linux/CUDA, enough extra VRAM, and generation dominates capture transport.

---

### 2. High impact: most personal research machines do not get the advertised backend

The vLLM extra is Linux-only and the backend requires CUDA. On macOS the extra intentionally installs nothing. On GPU-less Linux it can install several gigabytes of CUDA dependencies that cannot be used. **Evidence: Code-inspected.** `pyproject.toml:44-48,73-89`; `docs/USAGE.md:20-27,35-48`.

Hardware verification is much narrower than the GPU catalog:

- Successful vLLM runs are recorded on A40 and B200.
- Successful `vllm-static` runs exist only for Qwen3-4B on A40 and B200.
- RTX 5090 has one verified eager Qwen3-4B fit, not a vLLM fit.
- RTX 4090, T4 and L4 have no passing row in `VERIFIED.md`.
- One Gemma-3-12B static run on A40 crashed; Gemma-3 B200 reruns under vLLM 0.28 remained pending. **Evidence: Reported and Reproduced from verified/pending JSON.** `gpu-sizer/VERIFIED.md:26-40,59-65,77-102`.

What users actually get:

| Environment | Practical result |
|---|---|
| Single consumer NVIDIA GPU | vLLM may work, but the committed fit evidence does not validate it. Static taps add graph and activation buffers. RTX 4090 has catalog capacity data, not an end-to-end verified configuration. |
| Apple Silicon | Eager PyTorch only. Native bf16 or unknown-dtype models automatically fall back to CPU unless fp16 is explicitly requested; fp16/fp32-native checkpoints may use MPS. There is no committed MPS parity or throughput result. |
| Free Colab T4 | The notebook says roughly 7B fits in fp16 with reduced cache settings. T4 has no bf16. Installing vLLM replaces Colab’s Torch stack, may require a restart, and first graph build takes minutes. This configuration is not in `VERIFIED.md`. |
| Paid/server A40 or B200 | This is the evidence-backed path. Qwen3-4B dynamic and static configurations have measured fits. |

**Evidence: Code-inspected and Reported.** `interp_engine/select.py:90-97,137-148,193-220`; `notebooks/interp_engine_vllm.ipynb:24-38,55-66,99-100`; `gpu-sizer/README.md:35-65`; `interp_engine/memory.py:390-403,435-450,495-511`.

**Adoption consequence:** Apple, Colab and consumer-GPU researchers should evaluate interp-engine as an eager standardization layer first. They should not budget around the B200 throughput claims.

---

### 3. High impact: the fast backend excludes major interpretability workflows

The six canonical points absent from vLLM are:

- `attn_gate`
- `mlp_pre`
- `mlp_pre_linear`
- `expert_weights`
- `expert_indices`
- `lm_head`

`attn_probs` and `attn_scores` are served by off-kernel recomputation, not by observing the fused attention kernel. Under tensor parallelism, `z`, `value`, `mlp_act`, four QK-normalization points, and attention recomputation are also refused because rank zero sees only a shard. **Evidence: Code-inspected.** `docs/SUPPORTED_POINTS.md:12-38,47-63`.

vLLM cannot carry gradients through the model. Its runner uses `torch.inference_mode`, most kernels lack backward implementations, and the engine reports `through_forward=False` for every vLLM configuration. **Evidence: Code-inspected.** `interp_engine/protocol.py:100-107`; `docs/GRADIENTS.md:121-142`.

This blocks:

- gradient attribution through the model;
- integrated gradients;
- fitting a Jacobian or other probe that requires model-forward gradients;
- differentiable causal tracing;
- rollout differentiation.

Eager supports through-forward gradients when loaded with `requires_grad=True` and captured with `detach=False`, at the cost of retaining activations. Generation remains deliberately non-differentiable. **Evidence: Code-inspected.** `interp_engine/model.py:294-301`; `interp_engine/capture.py:157-177`; `docs/GRADIENTS.md:89-119`.

“Interp-engine has no arbitrary hooks or activation patching” is false globally but substantially true for vLLM:

- Eager exposes the raw HF model and point resolver.
- `HookManager.read` accepts a callable.
- `HookManager.write` accepts a callable that replaces module input or output.
- Unknown point names can be dotted HF module paths.

That is enough to implement arbitrary eager activation patching, although there is no high-level patching experiment API comparable to TransformerLens helpers. **Evidence: Code-inspected.** `interp_engine/hooks.py:1-11,159-218`; `interp_engine/model.py:294-301,608-622,641-658`.

The vLLM worker exposes a closed list of capture, steering, attention and lens RPC methods. It cannot accept an arbitrary Python hook callable over worker tensors. **Evidence: Code-inspected; absence verified by inspection.** `interp_engine/vllm_plugin.py:132-200`.

Other limitations:

- Sparse MoE layers refuse the neuron-basis points `mlp_pre`, `mlp_pre_linear` and `mlp_act`, generally on both backends, because experts are fused rather than separate hookable modules. Gemma 4’s dense branch is a documented exception. **Evidence: Code-inspected.** `docs/ARCHITECTURE_QUIRKS.md:518-535`.
- The fp16 refusal is not blanket. Ordinary fp16 capture works. Some through-forward gradient configurations are refused where fp16 overflow is known; use fp32 or bf16. **Evidence: Code-inspected.** `interp_engine/autograd_support.py:123-176`.
- `vllm-generate` turns capture, steering and lens operations off entirely. **Evidence: Code-inspected.** `docs/PERFORMANCE.md:148-151`.

**Adoption consequence:** standardized capture and fixed residual steering migrate well. Open-ended intervention research still belongs on eager HF, TransformerLens or nnsight.

---

### 4. High impact for novel models: “agreement” is useful evidence, not a correctness guarantee

The validator’s thresholds are deliberately loose for fused engines:

| Pair | Pass gate |
|---|---|
| Raw HF vs raw HF | max absolute error ≤0.002 and cosine ≥0.9999 |
| TransformerLens involved | cosine ≥0.99 and relative error ≤0.5 |
| vLLM/SGLang involved | cosine ≥0.99 and relative error ≤0.5 |

A fused or TransformerLens tolerance miss becomes a warning, not a failure. Shape mismatch, missing signal, or cosine below 0.5 is a failure. Per-checkpoint waivers can lower cosine to 0.90–0.97. **Evidence: Code-inspected.** `validator/comparison/spec.py:471-516,518-599`; `validator/comparison/aggregate.py:229-268`.

Comparisons use the checkpoint’s native dtype, not necessarily the same dtype. Gemma-2-2B compares an eager float32 reference with vLLM bf16 and reports 38 agreements. Some whole-tensor passes hide much worse individual tokens: its `final_norm` passes at cosine 0.998966 while the worst token is 0.961009. **Evidence: Reported.** `validator/comparison/results/google/gemma-2-2b/0_result_details.md:9-15,74-83`.

Concrete adverse rows:

- DeepSeek-V4-Flash is ❌ on both vLLM modes: four structural failures, including final-layer `mlp_out` cosine 0.235, `mlp_stream_collapse` 0.048, and `resid_streams` 0.310. Attention scores are not compared because MLA exposes no q/k tensors for recomputation. **Evidence: Reported.** `validator/comparison/results/deepseek-ai/DeepSeek-V4-Flash-0731/0_result_details.md:9-16,85-119,154-158`.
- Gemma-4-12B is ⚠️: vLLM has 29 agreements and 25 differences. Gemma-4-26B-A4B has the same 29/25 split. Gemma-4-31B passes 54/0, so the issue is model-specific rather than “Gemma 4 works.” **Evidence: Reported.** `validator/comparison/results/google/gemma-4-12B-it/0_result_details.md:9-16,100-117`; `validator/comparison/results/google/gemma-4-26B-A4B-it/0_result_details.md:9-16`; `validator/comparison/results/google/gemma-4-31B/0_result_details.md:9-16`.

The reference has been wrong before. Transformers 5.14.1 omitted DeepSeek-V2’s YaRN scaling; eager attention was therefore the bad baseline until Transformers 5.15 fixed it. The current `REFERENCE_BUGS` registry is empty, so there are no active filed `ref🐞` cases at this SHA. **Evidence: Code-inspected.** `validator/docs/ENGINE_DIFFERENCES.md:428-461`; `validator/comparison/engine_bugs.py:200-218`.

Gemma-2-2B and GPT-2 report zero “not compared” gaps among the cells requested of each engine. That does not mean all 34 points were checked:

- Their stored matrices cover sampled layers only: Gemma layers 0/13/19/25 and GPT-2 layers 0/6/11.
- They omit `value`, `z` and `attn_probs`.
- Framework-specific dashes mean a point was not asked of that engine.
- The validator source admits a vLLM `value` bug survived because no comparison row existed; it returned fused q/k/v under the value name. **Evidence: Reported and Code-inspected.** `validator/comparison/results/google/gemma-2-2b/0_result_details.md:3-19,21-68`; `validator/comparison/results/openai-community/gpt2/0_result_details.md:3-20,22-55`; `validator/comparison/spec.py:200-207`.

There is also a fundamental correlated-implementation risk. The project documents a Gemma-4 tensor where eager and vLLM once agreed at cosine 0.9999 on the same semantically wrong half-feed-forward tensor. Both backends now refuse it. **Evidence: Code-inspected.** `interp_engine/vllm_capture/_tree.py:665-688`.

**Adoption consequence:** the validator is a major strength, but a new architecture needs a task-specific independent parity test. A green summary glyph is not sufficient for token-level analyses or an untested point.

---

### 5. Medium-high impact: maintenance and dependency risk are unusually concentrated

This is a very young project. At the baseline:

- The history begins 2026-08-20.
- There are 31 commits through 2026-09-01.
- All 25 non-bot commits use two identities belonging to Johnny Lin; six are release-bot commits.
- Seven releases were tagged in twelve days, from v1.3.3 through v1.5.1.
- The repository is under the single `decoderesearch` organization. **Evidence: Reproduced** with `git log`, `git shortlog`, `git tag`, and `git remote`.

The brief says 14 stars. The [official GitHub repository](https://github.com/decoderesearch/interp-engine) displayed 13 when checked on 2026-09-01. Either count implies little outside adoption evidence; the one-star discrepancy does not change the conclusion. **Evidence: Reported.**

The vLLM integration depends heavily on internal implementation details:

- It accesses `worker.model_runner.model` and unwraps private graph wrappers.
- It monkeypatches `vllm.v1.worker.gpu_worker.Worker.load_model`.
- It patches names imported into the DeepSeek-V4 model module.
- Its per-request demultiplexer depends on private batch-order fields verified against vLLM 0.25.1. **Evidence: Code-inspected.** `interp_engine/vllm_capture/_tree.py:161-186`; `interp_engine/vllm_capture/static.py:1818-1837`; `interp_engine/vllm_capture/mhc.py:272-308`; `interp_engine/vllm_capture/_demux.py:20-50`.

The package declares `vllm>=0.28.0` with no ceiling. The maintainers explicitly expect worker attribute or logits-processor changes to break capture and then be fixed. **Evidence: Code-inspected.** `pyproject.toml:49-71,87-89`; `docs/PERFORMANCE.md:56-70`.

Committed validator results show the churn:

- 55 vLLM cells use 0.26.0.
- 2 use 0.27.1.
- 5 use 0.28.0.

The representative sequence is Gemma-2-2B on 0.26, DeepSeek-V4 on 0.27.1, and Gemma 4 on 0.28. **Evidence: Reproduced from JSON.** `validator/comparison/results/google/gemma-2-2b/vllm.json:461-499`; `validator/comparison/results/deepseek-ai/DeepSeek-V4-Flash-0731/vllm.json:705-743`; `validator/comparison/results/google/gemma-4-12B-it/vllm.json:653-690`.

Transformers is similarly open-ended: `>=4.57.1`, no upper bound. Only 4.57.1 config handling and the current CI-resolved version are tested; intermediate versions are inferred. **Evidence: Code-inspected.** `pyproject.toml:9-24`; `docs/COMPATIBILITY.md:9-33`.

Documentation already contradicts the executable evidence:

- README says Gemma 4 requires Transformers 5.14.1.
- The Gemma-4 validator successfully loads vLLM 0.28 with Transformers 5.16.1.
- The engine-bug notes say the old Gemma-4 load failure no longer applies.
- `docs/PERFORMANCE.md` still names vLLM 0.27.1 as the floor while `pyproject.toml` requires 0.28.0. **Evidence: Code-inspected and Reported.** `README.md:128-132`; `validator/comparison/results/google/gemma-4-12B-it/vllm.json:653-690`; `validator/comparison/engine_bugs.py:134-145`; `docs/PERFORMANCE.md:43-51`; `pyproject.toml:49-62,87-89`.

**Adoption consequence:** pin vLLM, Transformers, Torch and the engine together. Upgrade only after replaying your own capture parity suite. Do not treat the unconstrained dependency ranges as production compatibility guarantees.

---

### 6. Medium impact: naming lock-in is real, but tensor lock-in is low

`Address` is an engine-specific, closed coordinate model: canonical name, flattened layer, and optional residual stream. It has a strict string grammar and intentionally rejects unknown coordinates. **Evidence: Code-inspected.** `interp_engine/address.py:8-38,95-106,166-239`.

Portability aids are better than average:

- TransformerLens names map both directions.
- nnsight/nnterp standardized accessors map both directions.
- Mappings refuse concepts that do not have a faithful equivalent.
- TransformerLens translation is model-aware for sandwich norms and hyper-connections. **Evidence: Code-inspected.** `interp_engine/mappers.py:318-392,442-507`; `docs/PORTING.md:1-32`.

Captured data are ordinary PyTorch tensors. Protocol capture returns a `dict[Address, Tensor]` on CPU by default; the synchronous cache is a thin dataclass around the same dictionary. **Evidence: Code-inspected.** `interp_engine/protocol.py:179-211`; `interp_engine/capture.py:96-136`.

Steering vectors are also plain tensors or lists, but the layer/point/operation structure is an interp-engine dataclass and its worker serialization is engine-specific. There is no exporter that generates a TransformerLens or plain-HF hook program. **Evidence: Code-inspected.** `interp_engine/steer_specs.py:16-19,22-89,89-133`.

Eager users can reach the underlying HF model and raw dotted module paths, so leaving the library does not strand the weights or tensors. Moving a vLLM steering deployment away requires rewriting the intervention machinery. **Evidence: Code-inspected.** `interp_engine/model.py:294-301,608-658`.

**Decision:** data lock-in is low; experiment-code lock-in is moderate. Store checkpoint revision, Transformers version, dtype, prompt tokens and the formatted address beside exported tensors. The cache itself does not guarantee that provenance.

---

### 7. Lower direct impact: AI authorship is not the principal risk

There is solid evidence of agent involvement, but not enough to prove that the codebase was “largely written by AI”:

- 13 of 31 commit messages contain `Co-authored-by: Cursor`. **Evidence: Reproduced** from `git log`.
- `AGENTS.md` explicitly targets Cursor, Codex, Amp, Cline, Windsurf, Claude, Gemini, Copilot and Aider. **Evidence: Code-inspected.** `AGENTS.md:236-251`; `CLAUDE.md:1`; `.gemini/settings.json:1-5`.
- README tells users to delegate integration to an agent and contrasts installation with spending ten million AI tokens building an engine. Those are usability/marketing claims, not provenance. **Evidence: Code-inspected.** `README.md:63-65,122-126`.

The risk case is that agents can create a large, internally consistent system faster than independent users can test it. The short history, documentation drift, past missing validator rows and correlated-backend bug demonstrate that risk without needing assumptions about authorship.

The strength case is that the repository contains unusually explicit refusal paths, generated benchmark tables, point-registry checks, cross-engine artifacts, and comments that document previously silent failures. Agent-friendly instructions may help preserve those invariants.

**Decision:** AI involvement is a neutral provenance fact. The material risks are maintainer concentration, dependency churn and incomplete independent coverage. The validator makes agent involvement less concerning, but does not erase those risks.

## Who should try now / who should wait

### Who should try now

- Linux/CUDA teams serving many concurrent capture or residual-steering requests, especially with fixed taps.
- Teams able to pin the full environment and run model-specific parity before upgrades.
- A40 or B200 users starting with the verified Qwen3-4B configurations.
- Researchers who want a standardized wrapper around raw HF and are comfortable using eager for gradients or custom hooks.
- Neuronpedia-adjacent workloads that closely resemble the measured Jacobian Lens serving path.

Start as a replaceable component, not the sole stored representation of an experiment.

### Who should wait

- Apple Silicon users expecting the published speedup.
- Free-Colab or consumer-GPU users who need a known-good vLLM/static configuration.
- Researchers needing gradients through the fast backend.
- Users relying on arbitrary activation patching inside vLLM workers.
- Multi-GPU users needing head-level activations or attention matrices.
- Sparse-MoE researchers needing a neuron basis or exact expert assignments.
- DeepSeek-V4-Flash users, and Gemma-4-12B/26B users requiring exact vLLM/eager parity.
- Production teams that cannot pin and regression-test vLLM/Transformers upgrades.

## Two tests that would change the verdict

### 1. Apple Silicon eager parity test

**Evidence state: Proposed.**

**Task:** Run Gemma-2-2B on an Apple Silicon machine with at least 24 GiB unified memory. Compare interp-engine eager against independent plain-Transformers hooks on MPS at identical fp16, using at least eight prompts spanning 64, 512 and 2,048 tokens. Test every applicable canonical point at layers 0, 13, 19 and 25, plus 32-token greedy generation.

**Pass mark:**

- No CPU fallback, NaNs, missing captures or OOM.
- Exact shapes for every requested point.
- Mean cosine ≥0.9999 and max absolute difference ≤0.002 against same-dtype HF hooks.
- No individual token below cosine 0.99.
- Identical greedy token IDs.
- Peak memory and throughput published beside the result.

A pass would move Apple users from “unverified eager fallback” to a defensible adoption group. A failure would justify documenting MPS as installation compatibility only.

### 2. Consumer-GPU static-throughput test

**Evidence state: Proposed.**

**Task:** Run Qwen3-4B bf16 on one RTX 4090 24 GiB under Linux with the declared vLLM floor. Test eager, hooked vLLM and `vllm-static` with default residual taps, 8,192 context, 512-token prompts and 128 generated tokens. Measure one request and eight concurrent requests, one-layer/all-layer capture, startup time, peak memory and KV capacity.

**Pass mark:**

- Static backend loads without reducing context below 8,192 or exceeding 90% card memory.
- Captures have cosine ≥0.999 against eager and identical greedy tokens on the fixed corpus.
- At least 5x eager single-stream generation and 20x eager aggregate throughput at concurrency eight.
- No cross-request capture or steering contamination.
- Full configuration, versions and raw benchmark JSON are committed.

A pass would make the headline relevant to common research hardware. An OOM, major context reduction, or small gain would confirm that the current speed case is datacenter-specific.

## Files inspected

Material files included:

- Root: `README.md`, `pyproject.toml`, `AGENTS.md`, `CLAUDE.md`, `.gemini/settings.json`, `CONTRIBUTING.md`.
- Engine: `address.py`, `autograd_support.py`, `capture.py`, `hooks.py`, `mappers.py`, `memory.py`, `model.py`, `protocol.py`, `select.py`, `steer.py`, `steer_specs.py`, `vllm_backend.py`, `vllm_plugin.py`, and selected `vllm_capture/` modules.
- Documentation: `USAGE.md`, `PERFORMANCE.md`, `SUPPORTED_POINTS.md`, `GRADIENTS.md`, `PORTING.md`, `COMPATIBILITY.md`, `ARCHITECTURE_QUIRKS.md`, `ENGINE_HOOK_MAPPINGS.md`, `INTERNALS.md`.
- Benchmarks and sizing: `benchmarks/results-latest.md`, `gpu-sizer/README.md`, `gpu-sizer/VERIFIED.md`, verified/pending JSON, and the vLLM Colab notebook.
- Validator: `README.md`, `spec.py`, `aggregate.py`, `engine_bugs.py`, comparison documentation, and result Markdown/JSON for Gemma-2-2B, GPT-2, DeepSeek-V4-Flash and Gemma 4.

## Commands run

Read-only commands included:

- `git status`, `rev-parse`, `log`, `shortlog`, `tag`, and remote inspection.
- `rg`, `find`, `nl`, `sed`, and `jq`.
- JSON aggregation for GPU verification and vLLM-version counts.
- Text web search/open for the official GitHub repository and announcement URL.
- `curl` was attempted but DNS was unavailable in the shell sandbox.

No tests, model downloads or GPU benchmarks were run. No `.env` or secret file was read. “Reproduced” above means repository metadata or committed-result aggregation, not reproduction of the ML measurements.

## Uncertainty

- The announcement URL could not be fetched through the available text endpoint. Its quoted wording comes from the assignment; repository benchmarks independently support the narrow interpretations above.
- GitHub showed 13 stars when checked, while the brief says 14.
- Consumer-GPU, MPS and T4 conclusions are absence-of-verification findings, not claims that the configurations cannot work.
- Stored validator cells span different engine versions and dates. They are evidence of tested combinations, not a fresh validation of v1.5.1 as a whole.

Model used: **gpt-5.6-sol**. Reasoning effort: **high**.