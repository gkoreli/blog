# interp-engine source and correctness audit

Baseline: commit `74716092e5bad8beca1e27193ec9980a8e9a4e85`  
Package version at baseline: 1.5.1 (`pyproject.toml:3`)  
License: Apache-2.0 (`pyproject.toml:6`)  
Audit date: 2026-09-01

## Executive finding

The working thesis is supportable, with qualifications:

> interp-engine moves interpretability hooks into vLLM and ships unusually broad cross-engine validation. Its correctness evidence is stronger than its performance evidence for users without CUDA.

The correctness evidence includes semantic point definitions, architecture-specific resolvers, algebraic regression tests, parity tests, and committed multi-engine comparisons. It is not conclusive: the full validator is manually run, its “50+ models” description exceeds the 35 committed model rows, and DeepSeek-V4-Flash currently fails both vLLM paths.

The performance headline needs narrowing. The published Gemma-2-2B result is 6.9× for one decoding stream and 41× aggregate throughput at eight concurrent requests. Therefore “over 40× vs HF Transformers” refers to the concurrent result, not single-stream latency or throughput. The measurements were made on an NVIDIA B200 in bf16 and do not establish a CPU or MPS speedup.

Evidence labels used below:

- **Code-inspected:** directly established from source, tests, or workflow definitions at the baseline SHA.
- **Reproduced:** established with local, read-only commands or source parsing.
- **Reported:** taken from committed result files, benchmark artifacts, or the supplied announcement rather than rerun here.
- **Proposed:** an editorial interpretation based on the cited evidence.

---

# Claim table

| Claim | Product says | Code or test | Evidence state | Inference | Why it matters |
|---|---|---|---|---|---|
| There are 34 standardized points. | README says 34 eager points and 28 vLLM points. | The registry contains 27 base points and seven conditional mHC points (`interp_engine/points.py:147-229`, `interp_engine/points.py:311-392`, `interp_engine/points.py:483-495`; counts checked by source parsing). | Code-inspected, Reproduced | “34” is the union of the public vocabulary. Not every architecture exposes all 34. | Standardization means stable semantics and addressing, not that every model physically contains every point. |
| Dynamic vLLM hooks expose “every point.” | The `load_model` documentation uses that wording. | Six registry entries are explicitly unavailable on vLLM (`interp_engine/load.py:75-77`, `interp_engine/points.py:177-228`). | Code-inspected | The documentation sentence is too broad. | Integrators must check point support rather than relying on that sentence. |
| Gemma-2’s raw MLP output differs from its residual contribution. | Mapping documentation warns about this naming collision. | Architecture facts detect the extra post-feedforward norm; the resolver distinguishes `mlp_out` from `mlp_out_post` (`interp_engine/facts.py:524-642`, `interp_engine/model.py:820-829`). | Code-inspected | None. | Confusing the two produces plausible but wrong activations. |
| Eager and vLLM steering share one delta implementation. | Comments and tests describe identical steering math. | Eager and worker code contain separate implementations; parity tests compare them (`interp_engine/steer.py:208-223`, `interp_engine/vllm_capture/steering.py:53-107`, `tests/test_steer_math_parity.py:1-13`). | Code-inspected | They share formulas and tests, not the same function. | The parity test, rather than code reuse, is the guard against backend drift. |
| Capturing requires CUDA graphs and prefix caching to be disabled. | Standalone hooked-vLLM defaults do this. | Dynamic hooks need ordinary Python forwards; the wrapped `VLLMModel` can retain prefix caching by salting affected requests. Static mode records tensor operations into graphs (`interp_engine/vllm_plugin.py:92-112`, `interp_engine/vllm_backend.py:1062-1066`, `interp_engine/vllm_capture/graphs.py:1-20`). | Code-inspected | The rule is mode-dependent, not absolute. | Deployment behavior differs between the standalone plugin, wrapped requests, and static capture. |
| Validator coverage is “50+ models.” | Validator README says 50+. | The committed generated table has 35 model rows; the same README describes 31 verified architectures on 32 checkpoints (`validator/README.md:3-10`, `validator/README.md:90-103`). | Reproduced, Reported | The “50+” line is stale or counts something other than committed model rows. | Readers should not treat 50+ as the reproducible committed coverage. |
| Agreement means values are approximately equal. | Validator presents numerical tolerances and status glyphs. | Raw-HF hard agreement requires maximum absolute error ≤0.002 and cosine similarity ≥0.9999; looser-reference comparisons use cosine ≥0.99 and relative error ≤0.5, otherwise warnings (`validator/comparison/spec.py:471-516`, `validator/comparison/aggregate.py:229-254`). | Code-inspected | A warning is not the same evidentiary standard as a raw-HF pass. | Green and warning cells should not be collapsed into one “validated” category. |
| Gemma-2-2B agrees across engines. | Its result row is green. | vLLM, TransformerLens 2/3, and nnsight pass, but worst-token similarity is lower than whole-tensor similarity for several late-layer tensors (`validator/comparison/results/google/gemma-2-2b/0_result_details.md:70-83`). | Reported | Whole-tensor metrics can hide localized token errors. | The detailed report is more informative than the summary glyph. |
| DeepSeek-V4-Flash is validated on vLLM. | It appears in the comparison matrix. | Both hooked and static vLLM fail four points at layer 42 (`validator/comparison/results/deepseek-ai/DeepSeek-V4-Flash-0731/0_result_details.md:87-104`). | Reported | The cause is unresolved because no independent backend result is present. | It is a material exception to a blanket correctness claim. |
| Gemma-4 is fully settled. | Some rows are warnings and one is green. | The 12B and 26B models contain vLLM warnings while TL3 and nnsight pass; the current warnings are not attributed to the earlier fixed vLLM issue (`validator/README.md:40-42`, `validator/comparison/engine_bugs.py:134-145`). | Reported, Code-inspected | The warnings remain unexplained. | Users should distinguish “not a hard failure” from “root-caused.” |
| “Over 40×” is representative single-stream speed. | Root README publishes the headline speed table. | Gemma-2-2B is 6.9× single-stream and 41× at concurrency eight (`README.md:79-99`). | Reported, Reproduced | “Over 40×” is the aggregate eight-request result. | This materially changes how the benchmark should be described. |
| The eager backend supports CPU and Apple Silicon. | Device selection documentation says CUDA, MPS, or CPU. | Automatic selection falls back from CUDA to MPS to CPU, and non-CUDA requests force eager mode (`interp_engine/select.py:7-19`, `interp_engine/select.py:142-223`). | Code-inspected | Source support is established; performance and model-wide MPS compatibility are not. | Non-CUDA readers can use the API but should not inherit the B200 speed claim. |
| Dependency bounds provide broad compatibility. | The base package has low Torch and Transformers floors. | Runtime facts identify models needing newer or particular Transformers versions; vLLM and quantization are optional platform-specific extras (`pyproject.toml:22-27`, `pyproject.toml:44-124`, `interp_engine/facts.py:2325-2413`). | Code-inspected | The declared floor is not a promise of numerical correctness for every listed architecture. | Loose bounds simplify installation but weaken result reproducibility. |
| Development was agent-assisted. | README explicitly addresses AI agents and mentions ten million tokens. | Thirteen commits carry Cursor co-author trailers; the repository contains multi-agent instructions and tool-specific pointers (`README.md:63-65`, `README.md:122-126`, `AGENTS.md:236-247`, `CLAUDE.md:1`). | Reproduced, Code-inspected | Agent assistance is well supported; its share of authorship is not measurable from these artifacts. | This is relevant provenance, but not evidence for or against correctness. |
| The validator is continuously regenerated in CI. | The repository has validator workflows and committed reports. | Normal validator CI scores committed results without loading models; the cross-engine comparison workflow is manual/self-hosted (`.github/workflows/validator-tests.yml:47-81`, `.github/workflows/comparison.yml:1-30`). | Code-inspected | The artifacts can lag the current engine and dependency versions. | Correctness reports need dates and version context. |

---

# 1. Eager capture path and standardized points

## Finding

The eager path is a conventional Hugging Face forward pass with module pre-hooks, post-hooks, and a small number of non-module readers. “Standardized” means that callers use one canonical point vocabulary and `Address` format while architecture facts resolve those names to model-specific modules, tensor sides, and transformations.

It does not mean that every architecture has all 34 points. The number is the union of 27 base points and seven mHC-only points.

## Call path

1. `load_model` validates the backend and chooses vLLM or eager. Automatic selection prefers vLLM on CUDA and otherwise chooses eager CUDA, MPS, or CPU (`interp_engine/load.py:53-87`).
2. The eager branch constructs `EagerModel`, chooses the attention implementation, and forwards model-loading arguments (`interp_engine/load.py:201-216`).
3. `EagerModel` loads a Hugging Face causal LM, places it on the selected device, switches it to evaluation mode, disables parameter gradients, reads its configuration, and resolves the architecture (`interp_engine/model.py:211-229`, `interp_engine/model.py:250-312`).
4. Public point names are exposed through the registry, while `_resolve_address` turns a canonical `Address` into an architecture-specific module, tensor side, and optional extraction transform (`interp_engine/model.py:575-622`).
5. `capture` normalizes requested addresses and calls `run_with_cache`; returned tensors are moved to CPU before the public result is returned (`interp_engine/model.py:931-955`).
6. `run_with_cache` groups aliases, resolves addresses, installs hooks, performs the real model forward under `torch.no_grad`, and removes the hooks afterward (`interp_engine/capture.py:218-253`, `interp_engine/capture.py:304-345`).
7. `HookManager` implements input pre-hooks and output hooks, including tuple-path access and cleanup (`interp_engine/hooks.py:163-234`).
8. `Cache` is keyed by canonical `Address` objects and retains captured tensors according to the requested cache policy (`interp_engine/capture.py:96-136`).

`Address` includes point name, optional layer, optional expert, and optional stream coordinates. Its parser and serializer define the stable external grammar used by capture and steering (`interp_engine/address.py:95-106`, `interp_engine/address.py:166-264`).

**Evidence state:** Code-inspected.

## What the 34 points are

The 27 base names are:

`embeddings`, `resid_pre`, `attn_in`, `q_norm_in`, `q_norm_out`, `k_norm_in`, `k_norm_out`, `value`, `attn_scores`, `attn_probs`, `z`, `attn_gate`, `attn_out`, `attn_out_post`, `resid_mid`, `mlp_in`, `mlp_pre`, `mlp_pre_linear`, `mlp_act`, `router_logits`, `expert_weights`, `expert_indices`, `mlp_out`, `mlp_out_post`, `resid_post`, `final_norm`, and `lm_head` (`interp_engine/points.py:147-229`).

The seven mHC-only names are:

`resid_streams`, `attn_stream_collapse`, `attn_stream_write`, `attn_stream_mix`, `mlp_stream_collapse`, `mlp_stream_write`, and `mlp_stream_mix` (`interp_engine/points.py:311-392`).

`points_for` adds those seven only when the architecture reports multiple residual streams (`interp_engine/points.py:483-495`). Registry tests pin the base/conditional counts, address scopes, width rules, mechanisms, and vLLM support metadata (`tests/test_points_registry.py:47-83`, `tests/test_points_registry.py:110-161`, `tests/test_points_registry.py:195-213`).

Each `PointSpec` mechanically defines:

- Scope: global, layer, expert, or stream.
- Expected width.
- Whether the point is exposed on vLLM.
- Capture mechanism.
- Whether it can be read, written, or both.
- Semantics used by architecture resolution.

These fields are defined in `interp_engine/points.py:56-137`.

The resolver then maps those abstract entries to actual modules and sides:

- Residual boundaries: `interp_engine/model.py:660-681`
- Attention and MLP modules: `interp_engine/model.py:682-694`
- `resid_mid` and pre-MLP normalization: `interp_engine/model.py:695-755`
- Q/K norm locations: `interp_engine/model.py:757-768`
- MLP neuron points: `interp_engine/model.py:769-790`
- Router and expert points: `interp_engine/model.py:791-819`
- Post-sublayer contribution points: `interp_engine/model.py:820-829`
- Head output `z`: `interp_engine/model.py:830-834`
- Value capture and refusals: `interp_engine/model.py:847-877`
- Non-module points such as attention matrices: `interp_engine/model.py:881-887`

Shape conversion and fused-module splitting occur after the hook reads the underlying tensor. This includes fused gate/up projections, routing tensors, value/head reshaping, and Hugging Face attention output extraction (`interp_engine/capture.py:347-415`).

**Evidence state:** Code-inspected and Reproduced for the count.

## Gemma-2 sandwich norms

Gemma-2 has post-attention and post-feedforward normalization inside each block. The architecture facts encode its block algebra and distinguish the raw sublayer output from the tensor actually added to the residual (`interp_engine/facts.py:524-585`).

For a Gemma-2-shaped block:

- `attn_out`: raw attention output before `post_attention_layernorm`.
- `attn_out_post`: normalized attention contribution that is added to `resid_pre`.
- `resid_mid`: the residual after that attention contribution has been added, before `pre_feedforward_layernorm`.
- `mlp_out`: raw MLP output before `post_feedforward_layernorm`.
- `mlp_out_post`: normalized MLP contribution that is added to `resid_mid`.
- `resid_post`: final block output, `resid_mid + mlp_out_post`.

The architecture resolver identifies the pre-feedforward and post-feedforward norm modules structurally rather than assuming one fixed Hugging Face class layout (`interp_engine/facts.py:588-642`, `interp_engine/arch.py:1180-1208`). Regression tests reconstruct the sandwich equations and ensure that raw outputs and residual contributions remain distinct (`tests/test_sandwich_norms.py:70-126`, `tests/test_sandwich_norms.py:144-158`, `tests/test_sandwich_norms.py:170-201`).

For a Llama-shaped block without post-sublayer norms:

- `attn_out_post` aliases the raw attention output.
- `resid_mid` is the block state after adding attention.
- `mlp_out_post` aliases the raw MLP output.
- `resid_post` is the block output after adding that MLP output.

The Llama module convention named `post_attention_layernorm` is a pre-MLP normalization. It is not a normalization of the attention output. This ambiguity is one of the conditions handled in the architecture facts (`interp_engine/facts.py:533-642`).

**Evidence state:** Code-inspected.

## Gemma-2 attention logit softcapping

The architecture quirks record attention and final-logit softcaps (`interp_engine/arch.py:37-120`). Gemma-2’s architecture entry states that its real Hugging Face forward implements embedding scaling and softcapping (`interp_engine/arch.py:162-168`, `interp_engine/arch.py:1180-1208`).

For eager capture, the attention-score wrapper delegates to the model-family attention forward, preserving the family’s actual Q/K transformations and softcap behavior (`interp_engine/attn_scores.py:1-31`, `interp_engine/attn_scores.py:79-147`). The score reconstruction order is scale, tanh softcap, then masking (`interp_engine/attn_scores.py:52-76`). `attn_probs` capture requires eager attention rather than an opaque fused attention path (`interp_engine/capture.py:248-253`).

**Evidence state:** Code-inspected.

## TransformerLens naming trap

The documented trap is real.

TransformerLens’ block-level `hook_mlp_out` may refer to the MLP’s contribution to the residual stream. On a sandwich-norm model, that is interp-engine’s `mlp_out_post`, not its raw `mlp_out`. The mapping documentation spells out the collision and describes a previous production mismatch (`docs/ENGINE_HOOK_MAPPINGS.md:25-49`, `docs/ENGINE_HOOK_MAPPINGS.md:58-72`; also `validator/README.md:134-148`).

The mapper implements this distinction:

- Architecture-stable raw and post-contribution mappings are separated in `interp_engine/mappers.py:41-78`.
- Contribution-oriented names are handled separately (`interp_engine/mappers.py:133-137`).
- Model-aware TransformerLens mappings choose raw versus post-normalized points according to sandwich-norm facts (`interp_engine/mappers.py:318-375`).
- Q/K norm mapping also avoids treating TransformerLens’ `hook_normalized` as equivalent to a weight-applied normalization output (`interp_engine/mappers.py:341-355`).

**Evidence state:** Code-inspected.

---

# 2. Steering path

## Finding

There are three steering methods: additive, orthogonal scaling, and projection capping. Eager and vLLM implement the same formulas but do not call the same function. CPU parity tests are the mechanism that keeps them aligned.

## Methods and arithmetic

`STEER_METHODS` is:

```text
additive
orthogonal
projection_cap
```

It is declared with legacy defaults in `interp_engine/steer.py:159-196`.

Given hidden state \(h\), vector \(v\), and normalized direction \(\hat v = v/\|v\|\):

| Method | Delta added to hidden state |
|---|---|
| `additive` | `coefficient * vector` |
| `orthogonal` | `(coefficient - 1) * dot(h, v̂) * v̂` |
| `projection_cap` | `(clamp(dot(h, v̂), min, max) - dot(h, v̂)) * v̂` |

Vector normalization is performed in fp32 and rejects zero or non-finite norms (`interp_engine/steer.py:84-101`). The orthogonal and projection-cap formulas are defined at `interp_engine/steer.py:104-156`; dispatch is at `interp_engine/steer.py:208-223`.

The newer structured specifications define:

- `Additive`: vector plus scale.
- `Orthogonal`: coefficient, default 1.
- `ProjectionCap`: optional minimum and maximum projection.
- `SteeringSpec`: target point defaults to `resid_post`; no stream selects/broadcasts over the stream dimension when one exists.

See `interp_engine/steer_specs.py:22-50`, `interp_engine/steer_specs.py:61-86`, and conversion logic at `interp_engine/steer_specs.py:89-133`.

Legacy defaults are coefficient 1, method `additive`, point `resid_post`, no normalization, no stream selection, and no projection bounds (`interp_engine/steer.py:159-196`).

**Evidence state:** Code-inspected.

## Mask and token-position semantics

A provided `position_mask` marks prompt positions to exclude from steering. `None` means steer all positions. `SteerMask.SPECIAL_TOKENS` builds an exclusion mask for special prompt tokens (`interp_engine/steer.py:39-81`).

During eager execution, each operation receives the current sequence positions, applies its prompt mask, and mutates only the selected locations. Multiple steering operations execute sequentially (`interp_engine/steer.py:279-310`, `interp_engine/steer.py:328-398`).

The vLLM request state applies the prompt mask only during full prefill. Decode tokens are not prompt positions and therefore receive the steering delta on every decode forward (`interp_engine/vllm_capture/requests.py:70-136`, `interp_engine/vllm_capture/requests.py:626-649`).

Thus:

- An excluded prompt token is not directly modified.
- All generated tokens receive the delta unless the operation is otherwise inactive.
- Steering persists operationally because the modifier is applied during every decode step.
- Earlier steered states also affect later generation through the model’s causal KV state.

The last point is an inference from the repeated per-step modifier and causal decoding, not a separate persistence buffer.

**Evidence state:** Code-inspected; causal persistence characterization is Proposed.

## Eager/vLLM parity

The eager implementation is `steer_delta` (`interp_engine/steer.py:208-223`). The worker implementation repeats the same expressions in `interp_engine/vllm_capture/steering.py:53-107`.

The test suite explicitly imports both and compares additive, orthogonal, and projection-cap outputs on CPU (`tests/test_steer_math_parity.py:60-82`, `tests/test_steer_math_parity.py:183-209`). It also records one behavioral difference at a lower layer: the normal client rejects a zero vector, while the isolated worker helper clamps its normalization denominator (`tests/test_steer_math_parity.py:143-151`).

Therefore the accurate claim is:

> Eager and vLLM share steering arithmetic through duplicated formulas plus parity tests. They do not share a single delta function.

**Evidence state:** Code-inspected.

---

# 3. vLLM path

## Finding

The vLLM integration installs a named extension in each worker and avoids serializing arbitrary functions. Dynamic mode uses Python hooks and request-scoped state. Static mode installs wrappers before CUDA graph capture so `copy_` and `add_` tensor operations become part of graph replay.

## Worker injection

The plugin exposes named worker methods instead of serializing arbitrary Python callables into workers, explicitly citing the security and deployment implications (`interp_engine/vllm_plugin.py:23-31`).

The integration:

1. Patches worker model loading.
2. Loads the vLLM model.
3. Installs the interp-engine extension before graph capture.
4. Invokes named methods on every worker and verifies rank-specific results.

See `interp_engine/vllm_plugin.py:82-89`, `interp_engine/vllm_plugin.py:132-143`, and the capture/steering worker calls at `interp_engine/vllm_plugin.py:208-268`.

**Evidence state:** Code-inspected.

## CUDA graphs and prefix caching

Ordinary forward hooks execute while CUDA graphs are being recorded, but Python hook code does not execute again during graph replay. This is the central dynamic-capture limitation (`interp_engine/vllm_capture/graphs.py:1-20`).

For the standalone hooked-vLLM configuration, safe defaults set `enforce_eager=True` and disable prefix caching (`interp_engine/vllm_plugin.py:92-112`):

- CUDA graphs are disabled because replay bypasses Python forward hooks.
- Prefix caching is disabled because a cached prompt can bypass the token forwards from which activations would have been captured or modified.

The higher-level `VLLMModel` path is more nuanced. It can retain prefix caching and salts requests affected by interventions so incompatible cache entries are not reused (`interp_engine/vllm_plugin.py:92-112`, `interp_engine/vllm_backend.py:1062-1066`).

Therefore “graphs and prefix caching must be off” is accurate for standalone dynamic hooks, but not a universal rule across all modes.

**Evidence state:** Code-inspected.

## `vllm-static`

Static mode resolves points, allocates stable read/write buffers, and wraps modules before CUDA graph recording (`interp_engine/vllm_capture/static.py:244-320`, `interp_engine/vllm_capture/static.py:894-1015`).

Its wrapper emits actual tensor operations:

- Steering/write buffers are applied with in-place `add_`.
- Captured tensors are transferred to stable buffers with `copy_`.
- The operations run inside the wrapped module forward and are therefore recorded into the CUDA graph.

See `interp_engine/vllm_capture/static.py:1146-1216`, execution ordering at `interp_engine/vllm_capture/static.py:1219-1321`, and the concrete `add_`/`copy_` operations at `interp_engine/vllm_capture/static.py:1364-1385`.

The worker’s `load_model` is monkeypatched so these wrappers are installed before graph recording (`interp_engine/vllm_capture/static.py:1818-1837`). A built-in self-test checks that captured values change and that a sentinel write survives graph replay (`interp_engine/vllm_backend.py:1273-1326`).

Static mode intentionally creates graph breaks around selected operations and disables some compilation behavior through environment configuration (`interp_engine/vllm_capture/static.py:170-188`).

**Evidence state:** Code-inspected.

## Six unavailable vLLM points

The six of 34 marked unavailable are:

| Point | Reason recorded in the registry |
|---|---|
| `attn_gate` | The relevant Q projection output may be doubled/interleaved and tensor-parallel, so the intended gate is not reliably exposed. |
| `mlp_pre` | vLLM commonly fuses gate and up projections and shards them under tensor parallelism. |
| `mlp_pre_linear` | Same fused `gate_up` and tensor-parallel limitation. |
| `expert_weights` | Top-k weights remain inside the fused MoE operation. |
| `expert_indices` | Top-k indices remain inside the fused MoE operation. |
| `lm_head` | vLLM’s `compute_logits` path may fold transforms and does not expose a stable equivalent module boundary. |

The entries and reasons are in `interp_engine/points.py:177-228`. The published support count is 28 of 34 (`docs/SUPPORTED_POINTS.md:3-4`).

Tensor parallelism further restricts `z`, `value`, `mlp_act`, Q/K norm points, and recomputed attention matrices because the necessary full tensors are sharded (`docs/SUPPORTED_POINTS.md:57-63`).

**Evidence state:** Code-inspected.

## No gradients

vLLM execution runs in inference mode, which is stronger than `no_grad`, and its fused kernels do not expose the backward graph required for activation gradients (`interp_engine/autograd_support.py:41-58`). The capability check always reports through-forward gradient support as unavailable for vLLM (`interp_engine/autograd_support.py:216-263`), and the vLLM wrapper surfaces that refusal (`interp_engine/vllm_backend.py:1354-1374`).

This is not merely an unimplemented helper. The vLLM forward path itself is designed for inference.

**Evidence state:** Code-inspected.

## `attn_scores` and `attn_probs` recomputation

vLLM’s paged-attention kernel does not materialize a complete attention matrix. interp-engine captures post-RoPE Q/K/V tensors and reconstructs scores outside the kernel, including scale, softcap, causal/sliding-window masks, and attention sinks (`interp_engine/vllm_capture/attn.py:1-37`, `interp_engine/vllm_capture/attn.py:177-260`). Probabilities are then computed from the reconstructed scores (`interp_engine/vllm_capture/attn.py:263-291`).

Limits include:

- Softmax attention only.
- Single-GPU requirements for the full matrices in the current implementation.
- Explicit refusals for unknown attention quirks rather than silently guessing (`interp_engine/vllm_backend.py:283-345`).
- Tensor-parallel refusal and architecture-specific head/KV geometry checks (`interp_engine/vllm_backend.py:516-588`).
- Capture is request-scoped and may operate on a one-token decode request (`interp_engine/vllm_backend.py:2654-2685`).

The reconstruction performs an explicit QK matrix multiply (`interp_engine/vllm_capture/attn.py:200-242`), so its memory is quadratic in captured sequence length. That complexity statement is an inference from the visible tensor shape and matmul.

**Evidence state:** Code-inspected; complexity characterization is Proposed.

---

# 4. Correctness and validator methodology

## Finding

The validator is substantive, but the breadth and status glyphs require careful reading:

- The committed matrix has 35 model rows, not an independently reproduced “50+.”
- The comparison specification covers 27 selected points, not all 34.
- Raw-HF comparisons use a stricter pass criterion than comparisons against wrappers with known semantic or implementation differences.
- The ordinary validator CI checks committed artifacts. It does not regenerate the full cross-engine matrix.
- DeepSeek-V4-Flash currently has hard failures on both vLLM implementations.
- There are no current cases registered as “the interp-engine reference is wrong.”

## Coverage and sampled layers

The validator README says “50+ models” (`validator/README.md:3-10`). Counting the committed generated model rows produced 35. The same document separately reports 31 verified architectures on 32 checkpoints, 59 configurations that resolve, 46 unaudited configurations, and two broken configurations (`validator/README.md:90-103`).

The validator’s union contains 27 points: 20 conventional points plus seven mHC points (`validator/comparison/spec.py:305-337`). It does not compare these seven public points:

`resid_pre`, `mlp_in`, `attn_probs`, `attn_gate`, `expert_weights`, `expert_indices`, and `lm_head`.

Layers are sampled at the first, middle, and last block. Models with at least 16 layers also get a three-quarter-depth block. Hybrid models add the first attending layer if the skeleton sample would miss it (`validator/comparison/spec.py:418-459`).

**Evidence state:** Code-inspected and Reproduced.

## Engines and dtypes

The engine list includes interp-engine eager as the reference, hooked vLLM, static vLLM, TransformerLens 2, TransformerLens 3, nnsight, nnterp, and other conditionally supported adapters (`validator/comparison/spec.py:375-398`).

The dtype policy is model-dependent. It considers native dtype, float16 numerical exceptions, quantization, and memory constraints (`validator/comparison/run_engine.py:74-127`). vLLM can be downcast to bf16 for configurations that cannot run its comparison path in fp32 (`validator/comparison/run_engine.py:149-158`).

Therefore the validator is not globally “eager fp32 versus vLLM bf16.” That description is accurate for the committed Gemma-2-2B cell, but GPT-2 compares both eager and vLLM in fp32.

**Evidence state:** Code-inspected.

## Agreement thresholds

For a raw Hugging Face reference:

- Maximum absolute error must be ≤0.002.
- Cosine similarity must be ≥0.9999.

For looser comparisons such as TransformerLens or fused paths:

- Cosine similarity must be ≥0.99.
- Relative error must be ≤0.5.
- Falling outside those looser limits can produce a warning rather than the same hard-failure classification used for raw-HF parity.

Threshold definitions are at `validator/comparison/spec.py:471-516`; status aggregation is at `validator/comparison/aggregate.py:229-254`. Any explicit shape/value mismatch or cosine below 0.5 is a hard failure (`validator/comparison/spec.py:822-826`).

The reports also calculate worst-token metrics, but those are reported diagnostics rather than the primary glyph criterion (`validator/comparison/aggregate.py:70-103`).

**Evidence state:** Code-inspected.

## Exact result: `openai-community/gpt2`

Environment and sample:

- Hardware: NVIDIA B200
- Layers: 0, 6, 11
- Reference: interp-engine eager, fp32, engine `1.1.0+dirty`

Rows:

| Engine | Status | Dtype | Version | Agree | Differ | Fail | N/A |
|---|---:|---:|---:|---:|---:|---:|---:|
| interp-engine vLLM | ✅ | fp32 | vLLM 0.26 | 29 | 0 | 0 | 0 |
| interp-engine static | ✅ | fp32 | vLLM 0.27.1 | 27 | 0 | 0 | 0 |
| TransformerLens 2 | ✅ | fp32 | — | 24 | 0 | 0 | 0 |
| TransformerLens 3 | ✅ | fp32 | — | 24 | 0 | 0 | 0 |
| nnsight | ✅ | fp32 | — | 21 | 0 | 0 | 0 |

The detail file states that nothing differs (`validator/comparison/results/openai-community/gpt2/0_result_details.md:3`, `validator/comparison/results/openai-community/gpt2/0_result_details.md:9-16`, `validator/comparison/results/openai-community/gpt2/0_result_details.md:57-59`).

**Evidence state:** Reported.

## Exact result: `google/gemma-2-2b`

Environment and sample:

- Hardware: NVIDIA B200
- Layers: 0, 13, 19, 25
- Reference: interp-engine eager, fp32, engine 1.0.1

Rows present in the result:

| Engine | Status | Dtype | Agree | Differ | Fail | N/A |
|---|---:|---:|---:|---:|---:|---:|
| interp-engine vLLM | ✅ | bf16 | 38 | 0 | 0 | 0 |
| TransformerLens 2 | ✅ | fp32 | 36 | 0 | 0 | 0 |
| TransformerLens 3 | ✅ | fp32 | 36 | 0 | 0 | 0 |
| nnsight | ✅ | fp32 | 32 | 0 | 0 | 0 |

There is no static-vLLM row in this result file (`validator/comparison/results/google/gemma-2-2b/0_result_details.md:3`, `validator/comparison/results/google/gemma-2-2b/0_result_details.md:9-15`).

Worst-token diagnostics include:

| Point | Whole cosine | Worst-token cosine | Relative error |
|---|---:|---:|---:|
| `final_norm`, whole model | 0.998966 | 0.961009 | 0.2842 |
| `mlp_act`, layer 25 | 0.999120 | 0.968381 | 0.2551 |
| `mlp_out`, layer 25 | 0.999446 | 0.960698 | 0.2794 |
| `mlp_out_post`, layer 25 | 0.997493 | 0.989014 | 0.1620 |

These are still classified green by the report’s primary criteria (`validator/comparison/results/google/gemma-2-2b/0_result_details.md:70-83`).

**Evidence state:** Reported.

## DeepSeek-V4-Flash failure

For `deepseek-ai/DeepSeek-V4-Flash-0731`:

- Hardware: NVIDIA B200
- Layers: 0, 21, 32, 42
- Reference dtype: bf16
- TransformerLens 2/3 and nnsight are unsupported for this cell.

Rows:

| Engine | Status | Agree | Differ | Fail | N/A |
|---|---:|---:|---:|---:|---:|
| Hooked vLLM | ❌ | 38 | 12 | 4 | 4 |
| Static vLLM | ❌ | 37 | 11 | 4 | 4 |

The four layer-42 failures include:

- `mlp_out`: cosine 0.235296
- `mlp_out_post`: cosine 0.235296
- `mlp_stream_collapse`: cosine 0.048101
- `resid_streams`: cosine 0.309540

See `validator/comparison/results/deepseek-ai/DeepSeek-V4-Flash-0731/0_result_details.md:3`, `:9-16`, and `:87-104`.

Because both vLLM implementations fail and no independent engine is available in that cell, the artifact establishes a discrepancy but does not isolate its cause.

**Evidence state:** Reported; attribution assessment is Proposed.

## Gemma-4 warnings

The summary reports:

- Gemma-4 12B: warnings for hooked and static vLLM; TransformerLens 3 and nnsight pass.
- Gemma-4 26B: the same pattern.
- Gemma-4 31B: green vLLM/static entries.

See `validator/README.md:40-42`.

For 12B, hooked vLLM reports 29 agreements and 25 differences with no hard failures; static reports 28 agreements and 24 differences. TransformerLens 3 has 36 agreements and nnsight has 32 (`validator/comparison/results/google/gemma-4-12B-it/0_result_details.md:3`, `:9-16`, `:89-141`).

For 26B, the aggregate pattern is the same. One notable late-layer warning is `mlp_out_post` at layer 22, with cosine 0.933253 for hooked vLLM and 0.929612 for static (`validator/comparison/results/google/gemma-4-26B-A4B-it/0_result_details.md:3`, `:9-16`, `:91-141`).

The bug registry says earlier Gemma-4 issues were fixed and does not attribute these current warnings to the old issue (`validator/comparison/engine_bugs.py:134-145`). Since TransformerLens 3 and nnsight both wrap Hugging Face execution rather than constituting wholly independent implementations, the passing rows narrow the problem but do not fully root-cause it.

**Evidence state:** Reported and Code-inspected.

## Cases marked 🐞

The visible matrix attributes known problems to external comparison engines, including:

- OLMo-2 and OLMo-3: TransformerLens issue 1648.
- BLOOM: TransformerLens issue 1639 and nnterp issue 51.
- Granite 3.0 and 3.3: TransformerLens issue 1648.

See `validator/README.md:28-45`. Additional issue records include OLMo-3 issue 1620, DeepSeek-V2 issue 1645, and a paused SGLang Gemma-2 issue 33915 (`validator/comparison/engine_bugs.py:67-188`).

The registry’s current “reference engine is wrong” collection is empty (`validator/comparison/engine_bugs.py:191-218`). Therefore, at this baseline, there are no registered 🐞 cases where interp-engine’s eager reference is acknowledged as wrong with a filed issue.

**Evidence state:** Code-inspected.

## What CI actually runs

The normal engine workflow runs real model weights:

- CPU GPT-2 golden/parity tests.
- Small Gemma-3 270M and Qwen3.5 0.8B tests.
- An L4 GPU job that exercises real vLLM.
- Large Gemma-2, GPT-OSS, and Qwen3.6 tests are categorized separately and are not part of every normal run.

Workflow definitions are at `.github/workflows/engine-tests.yml:5-31`, `:104-166`, and `:168-220`. Exact model fixtures are listed in `tests/harness.py:69-107`; GPT-2 numerical parity is exercised in `tests/test_parity_gpt2.py:17-140`, with small-model and XL smoke cases at `tests/test_parity_gpt2.py:147-194`.

The ordinary validator workflow performs weight-free scoring and consistency checks over committed result files (`.github/workflows/validator-tests.yml:1-13`, `:47-81`). The complete cross-engine comparison is a manually dispatched workflow using self-hosted hardware (`.github/workflows/comparison.yml:1-30`, `:41-180`).

So the accurate summary is:

> CI runs real small models and a real GPU/vLLM path, but it does not continuously regenerate the complete cross-engine validator corpus.

**Evidence state:** Code-inspected.

---

# 5. Benchmarks

## Finding

The published benchmark is a controlled B200/bf16 serving benchmark. It does not measure CPU or MPS. Its most prominent >40× result is aggregate throughput at eight concurrent requests.

## Environment and protocol

The latest committed report contains 22 benchmark cells from an August 19 run (`benchmarks/results-latest.md:5-7`).

Environment:

- GPU: NVIDIA B200, 178.4 GB
- Driver: 580.105
- CUDA: 13
- PyTorch: 2.11
- vLLM: 0.26
- Transformers: 5.14.1
- interp-engine: 1.2.0
- Python: 3.12
- Linux
- Benchmark dtype: bf16

See `benchmarks/results-latest.md:44-70`.

Results are medians after warm-up. Throughput is token-normalized, and both eager and vLLM paths use bf16 (`benchmarks/results-latest.md:16-24`).

Workloads are defined at `benchmarks/bench_spec.py:348-387` and described in `benchmarks/README.md:173-205`:

| Workload | Prompt | Generation | Concurrency |
|---|---:|---:|---:|
| Decode | 512 | 128 | 1 |
| Concurrent decode | 512 | 128 | 8 |
| Capture | 512 | 0 | 1 |
| Capture during generation | 128 | 32 | 1 |
| Steering | 128 | 32 | 1 |
| Logit lens | 512 | top 10 only | 1 |

Most cells use three measured repetitions; the concurrency-eight cells use two.

Prefix caching is disabled for all compared variants (`benchmarks/README.md:160-168`).

The eager baseline is a raw Hugging Face forward using eager attention (`benchmarks/README.md:215-220`). Concurrency eight is simulated serially on eager rather than by an asynchronous serving scheduler (`benchmarks/README.md:263-285`). For capture-during-generation, eager first generates and then reruns the sequence to capture activations, so the algorithm is not identical to vLLM’s in-flight capture (`benchmarks/README.md:278-282`).

**Evidence state:** Reported and Code-inspected.

## Gemma-2-2B rows

| Measurement | HF eager | Hooked vLLM | Static vLLM | Vanilla vLLM |
|---|---:|---:|---:|---:|
| Decode throughput | 30.9 tok/s | 31.5 tok/s | 214 tok/s | 354 tok/s |
| Time to first token | 34.2 ms | 78.0 ms | 76.4 ms | 28.7 ms |
| Eight-request aggregate | 30.1 tok/s | 226 tok/s | 1,238 tok/s | 1,733 tok/s |
| Capture one middle point | 34.9 ms | 85.3 ms | 90.2 ms | — |
| Capture all supported points | 112 ms | 381 ms | 334 ms | — |
| Generate 32 and capture | 1,132 ms | 1,051 ms | 185 ms | — |
| Generate 32, capture, steer | 1,150 ms | 1,113 ms | 190 ms | — |
| Logit lens top 10 | 3.3 ms | 202 ms | 202 ms | 205 ms |

The report derives steering additions of approximately:

- Eager: +18 ms
- Hooked vLLM: +62 ms
- Static vLLM: +4–5 ms

Sources: `benchmarks/results-latest.md:89-137`, `benchmarks/results-latest.md:143-228`.

**Evidence state:** Reported.

## Meaning of “over 40×”

The README’s relative table gives Gemma-2-2B:

- Static vLLM single-stream: 6.9× eager throughput.
- Static vLLM, eight concurrent requests: 41× eager aggregate throughput.

See `README.md:79-99`.

No Gemma single-stream figure exceeds 40×. The “over 40× vs HF Transformers” phrase therefore refers to the concurrency-eight aggregate result. It is not the one-request result.

This result should also be dated: it used interp-engine 1.2.0 and vLLM 0.26, while the audited source is interp-engine 1.5.1 and currently declares vLLM ≥0.28.

**Evidence state:** Reported and Reproduced.

---

# 6. Device support

## Finding

The eager backend is source-supported on CUDA, MPS, and CPU. Nothing fundamental in ordinary eager capture requires CUDA. vLLM is explicitly restricted to Linux plus CUDA. Quantization extras introduce additional device and version constraints.

## Eager selection

Automatic selection follows this order:

1. CUDA: vLLM if available and compatible, otherwise eager CUDA.
2. MPS: eager, subject to native dtype safety.
3. CPU: eager.

See `interp_engine/select.py:7-19` and MPS checks at `interp_engine/select.py:48-97`. An explicit non-CUDA device forces the eager backend (`interp_engine/select.py:142-223`; public description at `interp_engine/load.py:70-87`).

The eager wrapper passes the chosen placement through Hugging Face model loading and installs device-agnostic PyTorch hooks afterward (`interp_engine/model.py:250-292`).

**Evidence state:** Code-inspected.

## CUDA-specific eager behavior

`cuda_preflight` is a diagnostic. It becomes a no-op when CUDA is not built or when a non-CUDA device was explicitly requested (`interp_engine/cuda_preflight.py:131-178`). It does not make the eager capture path CUDA-only.

There is a float16 nuance:

- The architecture facts record float16 attention instability for some GPT-NeoX/Phi-shaped models (`interp_engine/facts.py:723-747`).
- The differentiable through-forward API refuses those known-unsafe fp16 cases (`interp_engine/autograd_support.py:123-176`).
- The validator may upgrade the eager reference dtype (`validator/comparison/run_engine.py:74-107`).

Ordinary non-differentiable capture is not categorically refused merely because its dtype is fp16. Documentation that summarizes this as “fp16 refused” is broader than the standard capture behavior.

**Evidence state:** Code-inspected.

## vLLM and quantization

The runtime refuses vLLM outside Linux/CUDA (`interp_engine/vllm_backend.py:254-279`). Packaging mirrors that limit: the `vllm` extra installs vLLM only under a Linux platform marker and is deliberately a no-op on macOS (`pyproject.toml:44-89`).

Optional quantization has further constraints:

- Quant kernels and Accelerate are separate extras with bounded versions (`pyproject.toml:90-110`).
- AWQ/GPTQ support is CUDA-oriented and depends on `gptqmodel` plus Accelerate (`pyproject.toml:112-124`).

**Evidence state:** Code-inspected.

---

# 7. Dependencies, pins, and adoption constraints

## Finding

The minimal eager installation is deliberately broad, but broad lower bounds should not be confused with validated numerical compatibility for every architecture.

## Declared constraints

Base package:

- Python `>=3.11,<3.14` (`pyproject.toml:8`)
- PyTorch `>=1.10`
- Transformers `>=4.57.1`
- NumPy `>=1.24`
- Einops (`pyproject.toml:22-27`)

Optional extras:

- vLLM `>=0.28`, Linux only (`pyproject.toml:44-89`)
- Quant kernels `>=0.15.2,<0.17`, plus Accelerate `>=1` (`pyproject.toml:90-110`)
- AWQ/GPTQ through `gptqmodel>=5` and Accelerate, CUDA-oriented (`pyproject.toml:112-124`)
- TransformerLens parity tooling through a separate extra (`pyproject.toml:125-131`)

**Evidence state:** Code-inspected.

## Transformers version qualifications

The README says:

- Gemma 4 requires Transformers 5.14.1 because of a vLLM compatibility issue.
- DeepSeek-V2 requires Transformers ≥5.15 and the quantization extra.

See `README.md:128-134`.

Runtime compatibility facts also warn about model/version combinations that load but may be numerically incorrect (`interp_engine/facts.py:2325-2413`). The compatibility document explicitly distinguishes configuration parsing from correct implementation and notes that intermediate Transformers releases may not be tested (`docs/COMPATIBILITY.md:1-20`, `docs/COMPATIBILITY.md:28-56`).

This creates two adoption cautions:

1. `transformers>=4.57.1` is a package installation floor, not a universal numerical-validity guarantee.
2. There are no upper bounds on Transformers or vLLM, so future dependency changes can alter private module structure or numerical behavior without the resolver changing.

There is also a likely documentation-version mismatch: the README’s exact Gemma-4 5.14.1 note refers to an older vLLM problem, while the current package floor is vLLM 0.28 and the bug registry says the earlier Gemma-4 issue was fixed in that line (`validator/comparison/engine_bugs.py:134-138`). This audit did not run the relevant model combinations, so the exact safe version range remains unresolved.

Static capture additionally depends on vLLM implementation details such as worker monkeypatching, module wrappers, and graph-recording seams (`interp_engine/vllm_capture/static.py:1146-1216`, `interp_engine/vllm_capture/static.py:1818-1837`). That is an ongoing compatibility surface even where the public dependency constraint permits an upgrade.

**Evidence state:** Code-inspected; characterization of upgrade risk is Proposed.

---

# 8. Provenance

## Finding

The baseline repository is young, rapidly versioned, and visibly agent-assisted. Git records one apparent primary human contributor under two identities, GitHub Actions release commits, and frequent Cursor co-author trailers.

## Local history

Read-only Git inspection established:

- Baseline commit: `74716092e5bad8beca1e27193ec9980a8e9a4e85`
- Total commits reachable at baseline: 31
- First commit: `bba0376`, dated 2026-08-20
- First subject: `feat: interp-engine 1.3.3`
- First author: Johnny Lin
- Thirteen commits contain a `Co-authored-by: Cursor <cursoragent@cursor.com>` trailer.
- Six version-stamp commits were authored by GitHub Actions.
- Tags progress from v1.3.3 through v1.5.1.

The author counts recorded by Git are:

- Johnny Lin email identity: 19 commits
- `johnny` GitHub noreply identity: 6 commits
- `github-actions[bot]`: 6 commits

It is reasonable to infer that the two human identities represent the same person, but Git itself records them separately.

**Evidence state:** Reproduced; identity consolidation is Proposed.

## PRs visible in the local log

The local history shows:

- PR #3: merge commit, 2026-08-28
- PR #4: integrated as a squash-style commit with `(#4)` in its subject
- PR #5: merge commit, 2026-09-01
- PR #9: merge commit, 2026-09-01

Thus all four are present in the baseline history and were merged or otherwise integrated. This establishes their repository state at this commit, not their live GitHub metadata as of the audit date.

**Evidence state:** Reproduced.

## Agent-development signals

Repository-level signals include:

- `AGENTS.md` contains explicit instructions for agent delegation and multi-agent work (`AGENTS.md:236-247`).
- `CLAUDE.md` points Claude-based tools to the shared instructions (`CLAUDE.md:1`).
- `.gemini/settings.json` configures Gemini’s instruction context (`.gemini/settings.json:1-5`).
- README text explicitly addresses AI agents (`README.md:63-65`).
- The README says development consumed “ten million tokens” (`README.md:122-126`).
- Thirteen commit trailers credit Cursor.

These facts support the description “agent-assisted development.” They do not reveal what fraction of implementation, design, or review was performed by an agent.

**Evidence state:** Code-inspected and Reproduced.

## Live GitHub state

`gh auth status` found a configured account, but its credential was invalid. Direct network/API access also failed from the audit environment. I therefore could not reliably list open and closed issues or PRs as of 2026-09-01.

No token value or `.env` file was read or printed.

The supplied announcement is [Neuronpedia’s interp-engine blog post](https://www.neuronpedia.org/blog/interp-engine), reportedly published 2026-08-31. The page could not be independently retrieved from this environment, so its date and wording remain **Reported** from the assignment rather than web-verified.

---

# Editorial conclusions

## Strongest supportable claims

1. interp-engine defines a real semantic abstraction over architecture-specific module layouts. The abstraction is enforced through point metadata, canonical addresses, architecture facts, resolvers, and regression tests.
2. The Gemma-2 sandwich-norm distinction is implemented, not merely documented. Raw MLP output and residual contribution are separate points.
3. vLLM capture and steering are integrated at worker level. Static mode genuinely records tensor reads and writes into CUDA graphs.
4. The project’s correctness work is broader than a normal unit-test suite: it includes real-model parity tests and committed cross-engine comparisons.
5. CPU and MPS are supported by the eager path, while vLLM and all published speed evidence are CUDA-specific.

## Claims that need qualification

1. **“34 points”** means a vocabulary union. Seven are conditional on mHC architectures, and six are unavailable on vLLM.
2. **“Every point on vLLM”** is contradicted by registry metadata.
3. **“50+ models validated”** is not represented by the 35 committed model rows.
4. **“Over 40×”** is an eight-concurrent-request aggregate result. Gemma-2-2B single-stream is 6.9×.
5. **“Shared steering math”** means duplicate formulas guarded by parity tests, not one shared delta implementation.
6. **“Correct”** should not erase warnings or failures. DeepSeek-V4-Flash has hard vLLM failures, and Gemma-4 12B/26B have unresolved warnings.
7. **“CI validated”** should distinguish small real-model CI from the manually refreshed full validator corpus.

---

# Uncertainty and unresolved risks

- I did not rerun model tests. The base interpreter in this environment did not have PyTorch installed, and the repository was required to remain read-only.
- Correctness result files are committed artifacts. They use varying engine and dependency versions and are not automatically regenerated by ordinary CI.
- The benchmark used interp-engine 1.2.0 and vLLM 0.26, older than this 1.5.1 baseline and its vLLM ≥0.28 declaration.
- Benchmark evidence comes from one NVIDIA B200 configuration in bf16. It says nothing about CPU or MPS performance.
- The DeepSeek-V4-Flash failure is real in the committed report, but its cause is not isolated.
- Current Gemma-4 warnings are not root-caused.
- The validator README’s “50+” count could use a definition not recoverable from the committed table.
- Live GitHub issue and PR state could not be checked because authentication was invalid and network access failed.
- The announcement page was not retrievable, so its publication details were not independently verified.
- Source support for MPS and CPU does not guarantee that every upstream model or operation works efficiently on those devices.
- Static vLLM capture depends on private or semi-private upstream implementation seams, while vLLM has no upper version bound.
- This was a targeted source audit of the requested paths, not a line-by-line review of the entire repository.

---

# Files inspected

## Root and metadata

- `README.md`
- `pyproject.toml`
- `AGENTS.md`
- `CLAUDE.md`
- `.gemini/settings.json`
- Git commit, tag, author, and merge metadata

## Engine

- `interp_engine/load.py`
- `interp_engine/select.py`
- `interp_engine/model.py`
- `interp_engine/address.py`
- `interp_engine/hooks.py`
- `interp_engine/capture.py`
- `interp_engine/points.py`
- `interp_engine/arch.py`
- `interp_engine/facts.py`
- `interp_engine/mappers.py`
- `interp_engine/attn_scores.py`
- `interp_engine/steer.py`
- `interp_engine/steer_specs.py`
- `interp_engine/autograd_support.py`
- `interp_engine/cuda_preflight.py`
- `interp_engine/vllm_plugin.py`
- `interp_engine/vllm_backend.py`
- `interp_engine/vllm_capture/steering.py`
- `interp_engine/vllm_capture/requests.py`
- `interp_engine/vllm_capture/static.py`
- `interp_engine/vllm_capture/graphs.py`
- `interp_engine/vllm_capture/attn.py`

## Documentation and tests

- `docs/SUPPORTED_POINTS.md`
- `docs/ENGINE_HOOK_MAPPINGS.md`
- `docs/COMPATIBILITY.md`
- `tests/test_points_registry.py`
- `tests/test_sandwich_norms.py`
- `tests/test_steer_math_parity.py`
- `tests/test_parity_gpt2.py`
- `tests/harness.py`

## Validator

- `validator/README.md`
- `validator/comparison/spec.py`
- `validator/comparison/aggregate.py`
- `validator/comparison/run_engine.py`
- `validator/comparison/engine_bugs.py`
- GPT-2, Gemma-2-2B, DeepSeek-V4-Flash, and Gemma-4 detailed result files
- `.github/workflows/validator-tests.yml`
- `.github/workflows/comparison.yml`
- `.github/workflows/engine-tests.yml`

## Benchmarks

- `benchmarks/README.md`
- `benchmarks/results-latest.md`
- `benchmarks/bench_spec.py`

---

# Commands run

All commands were read-only:

- `git rev-parse HEAD`
- `git status --short`
- `git rev-list --count HEAD`
- `git log` with date, author, subject, merge, and trailer formats
- `git shortlog`
- `git tag`
- `git show`
- `git config --get core.hooksPath`
- `rg` and `rg --files`
- `find`
- `nl`, `sed`, and targeted file reads
- Python AST/source parsing to count registry entries and committed validator rows
- `gh auth status`
- `gh issue list` and `gh pr list` attempts
- `curl`/text web retrieval attempts
- A Python import diagnostic, which established that the base interpreter lacked `torch`

Five citation groups were spot-checked by reopening the relevant files before completion: the point registry, eager resolver, steering math, validator thresholds/results, and benchmark rows.

No repository files were modified. No secret or `.env` content was accessed.

---

# Execution disclosure

Model: `gpt-5.6-sol`  
Reasoning effort: `high`