# interp-engine editorial synthesis

Status: filled 2026-09-01 after `01`, `02`, `03` landed. The reproduction section is filled from `04` and the rerun results once the MPS runs finish outside the Codex sandbox.

## Article passport

- Article / working URL: `/oss-radar-06-interp-engine`
- Governing form: OSS Radar research synthesis, project deep dive (`oss-radar` skill, `references/project-deep-dive.md`)
- Living center: a hook name is not a tensor. Neuronpedia's own inference server read a Gemma Scope SAE off the raw MLP output because TransformerLens's block-level `hook_mlp_out` and the raw module output share a name on Llama and differ on Gemma. Nothing raised; a whole SAE source returned zeros. interp-engine spells the two apart and ships the comparison table that would have caught it. The author runs the same workload (CAA steering on gemma-2-2b through TransformerLens on MPS) and has to decide whether his own hook choices are the right tensors.
- Why now: announced 2026-08-31; PyPI 1.5.1 on 2026-09-01; Neuronpedia migrated its inference, autointerp, and graph services onto it in one 1,119-file rewrite on 2026-08-21 (`17bc391`); no outside field report exists. The author's Apple Silicon run is the first outside evidence.
- Portfolio role: bridge. The concrete artifact (an engine and its parity table) and the author's live stake (his harness runs on the thing being replaced) are inseparable.
- Protected material: the Neuronpedia mistake with its numbers (FVU 9.8 against 0.26, L0 8 against 85); the author's harness as the reason for caring; the reproduction numbers; one decision at the end.
- Claim boundaries: throughput numbers are B200-only, bf16, interp-engine 1.2.0 on vLLM 0.26 (August 19 run); the eager backend gives parity and API, not speed; on a Mac, bf16-native checkpoints go to CPU unless fp16 is requested. "Agrees" in the validator means cosine ≥0.99 and relative error ≤0.5 for TransformerLens and fused pairs, and max abs ≤0.002 with cosine ≥0.9999 only for raw-HF pairs. No claim that TransformerLens is dormant (3.8.1 released 2026-09-01; weekly August releases). No claim that the field is switching; the evidence is one maintainer's production stack.
- Series relationships: predecessor #05 (Bun 1.4) and #04 (Herdr) for the serving-engine thread; continuation #07 planned on DFlash 2.

## Verdict sentence (first 100 words)

interp-engine is Neuronpedia's production inference engine, released under Apache-2.0 and announced August 31. It gives 34 hook points one name each across architectures, checks them against TransformerLens and nnsight on 35 committed models, and runs them inside vLLM for throughput. Its correctness claim is stronger than its speed claim. The speed needs a CUDA box and a fixed tap set; the parity table can be checked on a laptop. Provable-wrong claim: **on Apple Silicon, interp-engine's eager backend reproduces TransformerLens's resid_post, attn_out, and mlp_out on gemma-2-2b to floating-point round-off, and steering through it matches a hand-written TransformerLens hook.**

## Structure

1. **Verdict.** The name and the tensor: the Neuronpedia mistake, the engine, the limit.
2. **Shipped system.** One address, three engines. `Address("mlp_out_post", 4)` on eager: HF forward, module hooks, architecture facts detect the post-feedforward norm structurally. The sandwich block. Then vLLM: hooks fire during graph recording but not replay, so hooked mode runs `enforce_eager=True` and pays 4–11x on decode; static mode wraps modules before graph capture so `copy_`/`add_` taps replay inside the graph. Component: `CompareTable` for the Gemma point map; `FlowDiagram` for eager → hooked vLLM → static vLLM if prose gets long.
3. **Product theory.** Maintainer thesis (interpretability at production scale runs inside a serving engine) against the skeptic (researchers keep TransformerLens and nnsight for gradients, patching, arbitrary hooks) and the ecosystem view (the validator outlasts the engine). Evidence for segmentation: TransformerLens 3 now wraps native HF; nnsight 0.7.0 ships a vLLM server. Direction: Path A serving control plane (Enabled; product Speculative), Path B canonical point ABI and conformance suite (Enabled; standard Speculative).
4. **Audit limits.** What "agrees" tolerates; worst-token cosines around 0.96 behind green cells; DeepSeek-V4-Flash ❌ (layer 42 `mlp_out` cosine 0.235); Gemma-4 12B/26B ⚠️ unexplained; 35 committed rows not "50+"; validator compares 27 of 34 points; the full comparison is a manual self-hosted workflow; benchmark is one B200 with older versions; single maintainer, 31 commits, 13 with Cursor trailers; vLLM internals monkeypatched with no upper bound.
5. **What runs on a laptop.** The author's MPS run: parity, the deliberately wrong pairing, steering, throughput. Told as what changed in his harness.
6. **Decision.** Who should try now, who should wait, two verdict-changing tests (an MPS parity run at fp16 across all points; a consumer-GPU static-throughput run). Close on DFlash 2 as #07 in one sentence.

## Claim table

| Claim | Product says | Code or test | Evidence state | Inference | Why it matters |
|---|---|---|---|---|---|
| 34 standardized points; all on eager, 28 on vLLM | README; SUPPORTED_POINTS.md:3-4 | registry: 27 base + 7 mHC-only (`points.py:147-229, 311-392, 483-495`); 6 marked unavailable on vLLM (`points.py:177-228`) | Code-inspected | "34" is a vocabulary union; no single model has all 34 | the "one name" claim |
| TL block-level `hook_mlp_out` fires after Gemma's post-sublayer norm; raw `mlp.hook_out` differs | ENGINE_HOOK_MAPPINGS.md:58-72 | facts detect post-feedforward norm structurally (`facts.py:524-642`); resolver splits `mlp_out`/`mlp_out_post` (`model.py:820-829`); mapper (`mappers.py:318-375`); tests (`test_sandwich_norms.py:70-201`); measured in `04` | Code-inspected + Reproduced | none | the living center |
| Neuronpedia served gemmascope-mlp-16k off raw `mlp_out` for `blocks.4.hook_mlp_out`; FVU 9.8 vs 0.26; L0 8 vs 85; endpoint returned zeros | ENGINE_HOOK_MAPPINGS.md:63-69 | maintainers' own report; not reproduced | Reported | author infers this motivated the validator | stakes |
| gemma-2-2b: eager 30.9, hooked vLLM 31.5, static 214, vanilla vLLM 354 tok/s single stream; 8 concurrent 30.1 / 226 / 1,238 / 1,733; capture one point 34.9 ms eager vs 85–90 ms vLLM; logit lens 3.3 ms vs 202 ms | README:79-99 | benchmarks/results-latest.md:89-137, 143-228; B200, bf16, interp-engine 1.2.0, vLLM 0.26, 2026-08-19 | Reported | none | scope of the speed claim; capture and lens are slower on vLLM |
| "Over 40x vs HF transformers" is the 8-concurrent aggregate | blog post | README:79-99; gemma single-stream 6.9x | Reported + Reproduced | none | headline honesty |
| vLLM backends need CUDA and Linux; eager runs on CUDA/MPS/CPU; bf16-native checkpoints go to CPU on MPS unless fp16 requested | pyproject markers; load.py docstring | `select.py:90-97, 193-223`; `vllm_backend.py:254-279`; `pyproject.toml:44-89` | Code-inspected | none | who gets what; the author's own default would have been CPU |
| Validator: raw-HF pass = max abs ≤0.002 and cosine ≥0.9999; TL/fused pass = cosine ≥0.99 and relative error ≤0.5; below that a warning; cosine <0.5 or shape mismatch fails | validator README | `validator/comparison/spec.py:471-516`; `aggregate.py:229-254` | Code-inspected | none | what a green cell means |
| gemma-2-2b: vLLM bf16 38 agree; TL v2/v3 fp32 36 agree; nnsight 32 agree; no static row; worst-token cosine 0.961 on `final_norm`, 0.961 on `mlp_out.25` | results table | `results/google/gemma-2-2b/0_result_details.md:9-15, 70-83` | Reported | none | green hides token-level drift |
| gpt2: all engines fp32, zero differences, layers 0/6/11 | results table | `results/openai-community/gpt2/0_result_details.md` | Reported | none | pilot model is clean |
| DeepSeek-V4-Flash ❌ on both vLLM modes: layer 42 `mlp_out` 0.235, `mlp_stream_collapse` 0.048, `resid_streams` 0.310; no independent engine in that cell | results table | `results/deepseek-ai/.../0_result_details.md:87-104` | Reported | cause not isolated | limit of "every architecture" |
| Gemma-4 12B and 26B ⚠️ on vLLM (29 agree / 25 differ); 31B green; TL3 and nnsight pass | validator README:40-42 | `engine_bugs.py:134-145` does not attribute | Reported | unexplained | do not say "Gemma 4 works" |
| "50+ models" | validator README:3-10 | 35 committed model rows; 31 verified architectures on 32 checkpoints; 46 unaudited (README:90-103) | Reproduced | count is stale or differently defined | coverage honesty |
| Validator compares 27 of 34 points (not `resid_pre`, `mlp_in`, `attn_probs`, `attn_gate`, `expert_weights`, `expert_indices`, `lm_head`); layers first/middle/last (+3/4 depth ≥16 layers) | (none) | `spec.py:305-337, 418-459` | Code-inspected | none | coverage honesty |
| CI runs gpt2 CPU parity, small Gemma-3 270M and Qwen3.5 0.8B, one L4 vLLM job; the full cross-engine comparison is a manual self-hosted workflow | (none) | `.github/workflows/engine-tests.yml`, `comparison.yml`, `validator-tests.yml` | Code-inspected | committed results lag versions | "validated" needs a date |
| Steering: additive, orthogonal, projection_cap; eager and vLLM duplicate the formulas and a CPU parity test compares them; position_mask excludes prompt positions; decode tokens always receive the delta | code comments | `steer.py:159-223`; `vllm_capture/steering.py:53-107`; `tests/test_steer_math_parity.py`; `vllm_capture/requests.py:70-136` | Code-inspected | none | steering parity and "from final token onward" is expressible |
| Hooked vLLM needs `enforce_eager=True` and no prefix caching; static mode records `copy_`/`add_` taps into CUDA graphs; static caps `max_num_batched_tokens` at 1,024 | PERFORMANCE.md | `vllm_plugin.py:92-112`; `vllm_capture/static.py:1146-1385, 1818-1837`; PERFORMANCE.md:121-182 | Code-inspected | none | the fight between hooks and graphs |
| No gradients through vLLM; eager supports through-forward gradients with `requires_grad=True` | GRADIENTS.md | `autograd_support.py:41-58, 216-263`; `model.py:294-301` | Code-inspected | none | who should wait |
| Eager accepts callable hooks and dotted HF module paths; vLLM exposes a closed RPC list | (none) | `hooks.py:159-218`; `model.py:608-658`; `vllm_plugin.py:132-200` | Code-inspected | none | patching stays on eager |
| Neuronpedia moved inference, autointerp, graph to interp-engine on 2026-08-21 (`17bc391`, 1,119 files); inference README says it "replaced the previous TransformerLens + nnsight stack"; graph app depends on `interp-engine==1.3.3` with no transformer-lens | Neuronpedia repo | commit and READMEs (other repo, live main) | Reported | none | direction; the reversal from the January 2026 nnsight stack |
| TransformerLens active: 3.8.1 on 2026-09-01; nnsight 0.7.0 (May 2026) ships a vLLM server | PyPI, releases | web | Reported | incumbents are converging, not retreating | rival theory |
| No outside field report; zero issues and PRs on the repo at check time | (search) | `02` §7 | Reported (absence) | the author's run is the first | why this article |
| Repo: first commit 2026-08-20 "1.3.3"; 31 commits; 13 with Cursor co-author trailers; 7 releases in 12 days; one human author | git | `git log`, `shortlog`, `tag` | Reproduced | agent-assisted, share unknown | provenance |
| MPS parity to round-off on gemma-2-2b and gpt2; steering argmax equal; MPS throughput | (author) | `04` rerun | Reproduced | none | the provable-wrong claim |

## Theory map

| Theory | Whose view | Evidence for | Evidence against | Direction state | What would disprove it |
|---|---|---|---|---|---|
| Interpretability at production scale must run inside a serving engine | maintainer | 8 concurrent Llama-3.1-8B: 32 → 419 hooked → 1,536 static tok/s on B200; Neuronpedia moved three services onto it; nnsight 0.7.0 also moved into vLLM | hooked mode loses graphs (4–11x decode penalty); static serves only declared points; capture and lens are slower than eager on vLLM; no gradients | Stated and shipped | production users keep separate eager research jobs; throughput gain vanishes under real capture traffic |
| Hosting convenience; researchers keep TL/nnsight for gradients, patching, arbitrary hooks | skeptic | TL3 keeps caches, patching, weights; nnsight keeps trace programs and remote execution; TL releases weekly | eager backend has all 34 points and forward gradients; Neuronpedia removed a real TL+nnsight stack; the package is a standalone API | Enabled as a niche; "convenience only" not established | independent researchers adopt it for work unrelated to Neuronpedia |
| The validator is the durable contribution; the engine is replaceable | ecosystem | validator records semantics, versions, per-point diffs, bugs across six execution paths; it already documents a real production mapping error | semantics and success criteria are coupled to interp-engine's registry; not an independent benchmark | Enabled; standard status Speculative | it stops catching failures or nobody outside uses it |

## Ecosystem map

| Role | Product or layer | Evidence |
|---|---|---|
| Replaces | hand-written HF hooks and decode loops; inside Neuronpedia, the TL + nnsight inference stack | AGENT_INTEGRATION.md:137-152; Neuronpedia inference README |
| Wraps | Hugging Face Transformers (eager attaches hooks to the native forward) | COMPATIBILITY.md:3-7 |
| Wraps / extends | vLLM (per-request capture, steering, static taps on the worker path) | PERFORMANCE.md:8-26; vllm_plugin.py |
| Rival | TransformerLens 2 (HookedTransformer) and 3 (TransformerBridge, now wrapping native HF); nnsight/nnterp/NDIF; pyvene | TL v3 migration guide; nnsight 0.7.0 release |
| Extends / consumes | SAELens (SAEs encode the captured tensors) | SAELens repo; Neuronpedia preloads SAEs |
| Relies on | torch, transformers (no upper bound), vLLM ≥0.28 (no upper bound; private worker seams monkeypatched), checkpoint module structure | pyproject.toml; `_tree.py:161-186`; `static.py:1818-1837` |
| May enter | SGLang backend (adapter paused); cross-engine point standard | validator README:134-141 |

## Decision inputs

Try now: Linux/CUDA teams serving concurrent capture or residual steering with fixed taps; teams that can pin vLLM, transformers, torch, and the engine together and replay their own parity before upgrades; anyone consuming block-level hook names who can adopt the mapper; eager users who want one vocabulary over raw HF.

Wait: Apple Silicon users expecting the speedup; free-Colab and consumer-GPU users needing a verified static configuration (VERIFIED.md has A40 and B200 only); gradient-based and patching work on the fast backend; multi-GPU users needing head-level tensors; sparse-MoE neuron-basis work; DeepSeek-V4-Flash and Gemma-4 12B/26B exact-parity users.

Verdict-changing tests (from `03`): (1) Apple Silicon eager parity at fp16 across every applicable point at four layers with 64/512/2,048-token prompts, pass at mean cosine ≥0.9999 and max abs ≤0.002 with identical greedy tokens; (2) RTX 4090 Qwen3-4B bf16 static run at 8,192 context, pass at ≥5x single-stream and ≥20x aggregate over eager with no cross-request contamination.

## Quotes verified by the editor (WebFetch, 2026-09-01)

From the launch post (Johnny Lin, 2026-08-31): "A high-performance interpretability engine built from scratch to run all our production Neuronpedia work"; "34 standardized hook points across all architectures, from GPT2 to Gemma 4 - even multi-residual-streams"; "Over 40x the throughput vs HF transformers" (DeepSeek-V4-Flash); Jacobian Lens "~7x faster"; "This is the v1 of interp-engine - we expect to improve performance significantly over the coming months."

## Open questions closed

- Eager on MPS: allowed with explicit `device="mps"`; automatic selection sends bf16-native checkpoints to CPU (`select.py:90-97`).
- Mask: `position_mask` lists excluded prompt positions; excluding `[0, prompt_len-2]` gives "final prompt token onward"; decode tokens are always steered.
- Tolerance: stated above.
- Outside issues or PRs: none at check time.
