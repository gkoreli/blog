# interp-engine editorial synthesis (living document)

Status: skeleton written 2026-09-01 before the worker reports; claim table and verdict cells are filled in as evidence lands. Sections marked TODO are waiting on `01`–`04`.

## Article passport

- Article / working URL: `/oss-radar-06-interp-engine`
- Governing form: OSS Radar research synthesis, project deep dive (`oss-radar` skill, `references/project-deep-dive.md`)
- Living center: a hook name is not a tensor. Neuronpedia's own inference server read a Gemma Scope SAE off the raw MLP output because TransformerLens's block-level `hook_mlp_out` and the raw module output share a name on Llama and differ on Gemma. Nothing raised; a whole SAE source returned zeros. interp-engine exists partly because of that number. The author runs the same workload (CAA steering on gemma-2-2b through TransformerLens on MPS) and has to decide whether to trust his own hook choices.
- Why now: announced 2026-08-31; PyPI 1.5.1 on 2026-09-01; no outside field report exists yet (to confirm in `02`). The author's Apple Silicon reproduction is the first outside evidence.
- Portfolio role candidate: bridge. The concrete artifact (an engine and its parity table) and the author's live stake (his research harness runs on the thing being replaced) are inseparable.
- Protected material: the Neuronpedia mistake told plainly with its numbers (FVU 9.8 against 0.26, L0 8 against 85); the author's own harness as the reason for caring; the reproduction numbers; the decision at the end.
- Concrete entities: interp-engine, Neuronpedia, Decode Research, Johnny Lin, TransformerLens (HookedTransformer v2, TransformerBridge v3), nnsight/nnterp, SAELens, Gemma Scope, vLLM, gemma-2-2b, gpt2, Apple Silicon MPS, B200.
- Owned result: the MPS parity and steering runs in `04-local-reproduction.md`.
- Claim boundaries: throughput numbers are B200-only and belong to the vLLM backends, which need CUDA and Linux; the eager backend gives parity and API, not speed. The validator's "agrees" has a tolerance and dtype that `01` must state. No claim that TransformerLens is dormant (3.8.1 released 2026-09-01). No claim that the field is switching engines; the evidence is one maintainer's production stack.
- Series relationships: predecessor issue #05 (Bun 1.4, the runtime absorbing jobs) and #04 (Herdr, the multiplexer becoming a runtime) for the "serving engine as the new bench" thread; continuation issue #07 planned on DFlash 2; boundary companion: the author's own research program (not yet public).

## Verdict sentence (first 100 words)

interp-engine is Neuronpedia's production inference engine, released 2026-08-31 under Apache-2.0. It names 34 hook points once across 50-plus architectures, checks each against TransformerLens and nnsight, and runs them inside vLLM for throughput. Its correctness claim is stronger than its speed claim: the parity table is reproducible on a laptop, the speed needs a CUDA machine and a static tap set. Provable-wrong claim: **on Apple Silicon, interp-engine's eager backend reproduces TransformerLens's resid_post, attn_out, and mlp_out on gemma-2-2b to floating-point round-off, and steering through it matches a hand-written TransformerLens hook.** If `04` disagrees, the verdict changes.

## Structure (five parts, headings adapted)

1. Verdict: the name and the tensor. The Neuronpedia mistake, the engine, the limit.
2. Shipped system: one address, three engines. Trace `Address("mlp_out_post", 4)` on eager and on vLLM; the sandwich block; why CUDA graphs and hooks fight; what vllm-static bakes in. Component: `FlowDiagram` for the capture path if prose gets long; `CompareTable` for the point-name mapping (interp-engine / TL / nnsight) on Gemma.
3. Product theory and direction: the maintainer thesis (interpretability needs a serving engine) against the skeptic (researchers need gradients and arbitrary hooks; this is Neuronpedia's hosting convenience) and the ecosystem view (the validator is the durable contribution). Direction states from `02`.
4. Audit limits: what "agrees" tolerates; the DeepSeek ❌ and gemma-4 ⚠️ rows; B200-only benchmarks; the 6 points vLLM cannot serve; no gradients; single organisation; agent-authored code.
5. What runs on a laptop: the author's MPS reproduction (parity, steering, throughput), told as what changed in his own harness.
6. Decision: who should try now (SAE/steering work on supported families with a CUDA box; anyone consuming block-level hook names who can adopt the mapper), who should wait (gradient-based work, patching, unsupported families, MPS-only users wanting speed), two tests that would change the verdict.

Closing paragraph names DFlash 2 as issue #07 in one sentence under the serving-engine thesis. No recap.

## Claim table

| Claim | Product says | Code or test | Evidence state | Inference | Why it matters |
|---|---|---|---|---|---|
| 34 standardized points; all on eager, 28 on vLLM | README, SUPPORTED_POINTS.md | TODO `01` (points.py / arch.py) | Code-inspected | none | the "one name" claim |
| TL block-level `hook_mlp_out` fires after Gemma's post-sublayer norm; raw `mlp.hook_out` differs | ENGINE_HOOK_MAPPINGS.md "Raw output versus residual contribution" | TODO `01` mapper code; `04` measured diff on gemma-2-2b | Code-inspected + Reproduced | none | the living center |
| Neuronpedia served gemmascope-mlp-16k off the wrong tensor; FVU 9.8 vs 0.26; L0 8 vs 85 | ENGINE_HOOK_MAPPINGS.md | maintainers' own report; not reproduced | Reported | the author infers this motivated the validator | stakes |
| gemma-2-2b eager 31 → vllm-static 214 tok/s (6.9x); 8 concurrent 1,238 (41x); B200 bf16 | README benchmark table | benchmarks/results-latest.md | Reported (maintainer benchmark) | none | speed claim scope |
| "Over 40x vs HF transformers" is the 8-concurrent aggregate, not single-stream | blog post vs README | TODO `03` | Code-inspected (docs) | none | honesty of the headline |
| vLLM backends need CUDA and Linux; eager runs on MPS/CPU | pyproject marker; load.py docstring | TODO `01`; `04` runs eager on MPS | Code-inspected + Reproduced | none | who gets what |
| Validator: eager fp32 reference vs bf16 vLLM, TL v2/v3, nnsight; gemma-2-2b all ✅; gpt2 all ✅ | validator/README.md, results | TODO `01` tolerance and layers | Code-inspected (results files) | none | correctness claim |
| DeepSeek-V4-Flash vLLM ❌; gemma-4 vLLM ⚠️ | validator table | TODO `01` | Reported (maintainer sweep) | none | limit of "every architecture" |
| Steering arithmetic shared between eager and vLLM worker | code comments | TODO `01` steer.py vs vllm_capture/steering.py | Code-inspected | none | steering parity |
| MPS parity to round-off on gemma-2-2b and gpt2 | (author) | `04` | Reproduced | none | the provable-wrong claim |
| No gradients through vLLM; attn_probs by recompute; 6 points unreachable | SUPPORTED_POINTS.md, validator README | TODO `01` | Code-inspected | none | who should wait |
| Neuronpedia dropped its hard TransformerLens dependency from graph-steering endpoints (Aug 2026) | Neuronpedia releases | TODO `02` commit SHAs | Code-inspected (other repo) | none | direction |
| No outside field report by 2026-09-01 | (search) | TODO `02` | Reported (absence) | the author's run is the first | why this article |

## Theory map (to fill from `02`)

| Theory | Whose view | Evidence for | Evidence against | Direction state | What would disprove it |
|---|---|---|---|---|---|
| Interpretability at production scale must run inside a serving engine | maintainer | TODO | TODO | Stated | TODO |
| Hosting convenience; researchers keep TL/nnsight for gradients and patching | skeptic | TODO | TODO | Speculative | TODO |
| The validator is the durable contribution; the engine is replaceable | ecosystem | TODO | TODO | Enabled | TODO |

## Ecosystem map (to fill from `02`)

| Role | Product or layer | Evidence |
|---|---|---|
| Replaces | TODO | |
| Wraps | TODO | |
| Extends | TODO | |
| Relies on | TODO | |
| May enter | TODO | |

## Open questions for the reports

- Does eager on MPS refuse anything (fp16 refusal, attn_implementation="eager" requirement)?
- Does the steer mask express "from final prompt token onward"? If not, what is the nearest mask?
- What exact tolerance does the validator use, and at which dtype pairs?
- Are there any interp-engine issues or PRs from outside Decode Research?
