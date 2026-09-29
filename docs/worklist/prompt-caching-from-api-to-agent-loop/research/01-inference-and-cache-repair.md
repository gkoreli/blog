# Inference cache dependencies and alternatives

Research checked on **2026-09-28 America/Los_Angeles**; fetched repository HEAD timestamps fall on September 29 UTC. This inference sub-investigation ran no paid API calls or trained-model inference; the separate [live API experiment](05-live-anthropic-experiment.md) ran afterward. The research worker treated the blog repository as read-only. Scratch clones are under `/tmp/prompt-cache-inference-20260928/`.

The central answer: **ordinary prefix caching preserves computation whose causal inputs remain unchanged. Arbitrary edits to an earlier system prompt generally invalidate downstream deep-layer KV state. Real approaches to modular reuse and cache repair exist, but the approaches reviewed here modify the attention computation or approximate the fully recomputed state. They do not establish a universal correctness-preserving hot-swap operation.**

## 1. The mechanism worth teaching

For a conventional causal transformer, a simplified dependency is:

```text
h[i, 0] = token embedding (+ positional information, depending on model)

K[i, layer], V[i, layer] = projections of h[i, layer - 1]

h[i, layer] =
    attention over permitted earlier/current positions
    + residual/MLP processing
```

This is a dependency graph, not a cache of token strings. The causal mask prevents later tokens from changing earlier states. Earlier tokens can influence later hidden states, which become later layers' K/V vectors. The foundation is decoder masking and attention in [Attention Is All You Need, §3.1–3.2](https://arxiv.org/abs/1706.03762).

Derived implications, under fixed weights, tokenization, positions, attention mask and relevant model configuration:

- Appending text leaves already processed prefix states reusable.
- Changing token j preserves states strictly before the first changed model input; downstream states may need recomputation.
- Equal-length replacement avoids shifting subsequent positions, but does not avoid changing their attention history.
- An insertion or deletion can change both attention history and positions.
- Identical suffix text does not imply identical suffix state.
- Human judgment that two prompts mean the same thing does not establish equality of model activations.

In ordinary architectures, first-layer K/V projections of unchanged token embeddings can remain unchanged when positions stay fixed. Contamination appears in attention outputs and deeper layers. Therefore say **downstream cached computation is no longer generally valid**, not that every float after the edit necessarily changes at every layer.

Exact reuse should mean preserving the intended reference computation. It should not promise universal bitwise equality across GPU kernels, batching, precision, hardware or random sampling. vLLM treats batch-invariant execution as a separate feature with kernel/configuration requirements. [vLLM batch invariance](https://docs.vllm.ai/en/stable/features/batch_invariance/)

## 2. Improve the Jenga analogy

**Changing one tower does not destroy every other tower.** A server can retain a tree of histories:

```text
stable root
├── system variant A → history → branch 1
│                             └→ branch 2
└── system variant B → history → branch 3
```

Switching back to an already computed exact path can hit that path if it remains resident. Ordinary prefix caching cannot transplant A's downstream states into a newly created B path merely because the visible suffix is identical.

Caching is incremental within a causal path, while the cache can contain many paths, branches, earlier versions and requests from separate conversations. Retention, routing and namespace rules determine accessibility.

## 3. vLLM: inspected hash chain and lookup

Commit: `28f673957671d8d4c5672c2085b3f22c79c0b0b5`.

- [`generate_block_hash_extra_keys`, lines 611–647](https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/vllm/v1/core/kv_cache_utils.py#L611): includes LoRA identifiers, multimodal data, prompt embeddings and an initial cache salt as applicable.
- [`hash_block_tokens`, lines 650–680](https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/vllm/v1/core/kv_cache_utils.py#L650): hashes `(parent_block_hash, current_token_ids, extra_keys)`.
- [`FullAttentionManager.find_longest_cache_hit`, lines 743–838](https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/vllm/v1/core/single_type_kv_cache_manager.py#L743): traverses a contiguous prefix and stops when a required block is absent.
- [`KVCacheManager.get_computed_blocks`, lines 264–321](https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/vllm/v1/core/kv_cache_manager.py#L264): caps reusable length at `request.num_tokens - 1`, explaining that the final token must be recomputed to obtain logits.

Interpretation: parent hashes encode causal provenance. Removing the parent hash would increase apparent matches while allowing reuse of state computed under different prefixes. That would be an incorrect cache key, not a cache optimization.

Documentation/code discrepancy: the live [design page](https://docs.vllm.ai/en/latest/design/prefix_caching/) says only full blocks are cached. Inspected current code also has a fine-grained lookup path when `alignment_tokens < block_size`, probing interior hash boundaries. The pinned [feature documentation](https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/docs/features/automatic_prefix_caching.md) describes `--prefix-match-unit` and hybrid Mamba checkpoint conditions. Avoid an eternal full-block-only claim.

APC principally saves prefill work. It does not remove generating new tokens or attending to cached context during decoding. Capacity and scheduling improvements may indirectly change throughput; these differ from skipping prefill. [Pinned feature documentation](https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/docs/features/automatic_prefix_caching.md#L49)

## 4. SGLang: inspected radix-tree lookup

Commit: `2ff52e3ceb0bcfdc8ba1dd0367b39ce0370bbfaf`.

- [`RadixKey.match` / `match_at`, lines 177–219](https://github.com/sgl-project/sglang/blob/2ff52e3ceb0bcfdc8ba1dd0367b39ce0370bbfaf/python/sglang/srt/mem_cache/radix_cache.py#L177): finds first divergent token and rounds match down to configured page size.
- [`RadixCache.match_prefix`, lines 354 onward](https://github.com/sgl-project/sglang/blob/2ff52e3ceb0bcfdc8ba1dd0367b39ce0370bbfaf/python/sglang/srt/mem_cache/radix_cache.py#L354): longest-prefix matching with namespace separation.
- [`_match_prefix_helper` and `_split_node`, lines 639–689](https://github.com/sgl-project/sglang/blob/2ff52e3ceb0bcfdc8ba1dd0367b39ce0370bbfaf/python/sglang/srt/mem_cache/radix_cache.py#L639): follows child nodes, splits on divergence, retains branches.
- [`_check_compatible`, lines 165–175](https://github.com/sgl-project/sglang/blob/2ff52e3ceb0bcfdc8ba1dd0367b39ce0370bbfaf/python/sglang/srt/mem_cache/radix_cache.py#L165): requires compatible extra keys and cache salts.

Interpretation: vLLM's hash chain and SGLang's tree are alternative indexing/management approaches to matching compatible prior computation. A radix tree does not make arbitrary suffix reuse valid. These were static code inspections, not execution tests.

## 5. Research approaches and correctness classifications

| Approach | What it changes | Classification |
|---|---|---|
| Prefix matching | Reuses states under the same causal prefix | Intended computation preserved, subject to implementation/numerical conditions |
| Prompt Cache | Modules with schema-defined positions/scaffolding | Modified/approximated attention context |
| CacheBlend | Chunks reused with selective token recomputation | Approximate repair; empirically evaluated quality |
| PIE | Repairs positional encoding after code edits, retains suffix state | Approximation to recomputation |
| Cache-Craft | Selects/repairs reusable RAG chunk caches | Approximate reuse with quality evaluation |
| CacheGen | Compresses/transports KV state | Storage/transport, not repair of changed causal history |

**Prompt Cache.** Section 3.1 explicitly describes independent module encoding as analogous to masking tokens outside the module, and calls it an approximation. Schemas preserve positional organization; they do not restore omitted cross-module dependencies. The paper also discusses scaffolding, so do not reduce the design to every module always independently encoded. [Paper §3.1–3.4](https://arxiv.org/html/2311.04934v2)

Inspected repository commit: `9027040d4b4e3fce911b060590dd4a71783b12b9`. Entry points: [`SchemaCache._process`](https://github.com/yale-sys/prompt-cache/blob/9027040d4b4e3fce911b060590dd4a71783b12b9/promptcache/cache_engine.py#L186), building scaffolds and positioned states; [`CacheEngine.process`](https://github.com/yale-sys/prompt-cache/blob/9027040d4b4e3fce911b060590dd4a71783b12b9/promptcache/cache_engine.py#L388), assembling selected modules and argument positions. Static inspection only.

**CacheBlend.** Its stated objective is minimizing deviation from fully recomputed attention. It corrects positions, selectively recomputes high-deviation tokens and reuses other entries. Reported F1/ROUGE and latency improvements concern tested models/workloads. They do not prove equality of hidden states, distributions or arbitrary agent decisions. Directly relevant research, behind a quality-evaluation gate for the user's invariant. [Paper §4 and §7](https://arxiv.org/html/2405.16444v3)

**PIE.** This ICLR 2025 paper distinguishes semantic effects from shifted-position effects. It removes/reapplies rotary positions to suffix keys, retains values, and evaluates code insertion/deletion/editing on DeepSeek-Coder. Section 3.1 explicitly formulates approximation to fully recomputed distributions. Section 3.2 says small semantic impact was observed empirically in its code tasks. It cannot support a general claim that changing a system instruction is safe. [Let the Code LLM Edit Itself When You Edit the Code, §3](https://proceedings.iclr.cc/paper_files/paper/2025/file/9530635032b95cea9585bd800d308300-Paper-Conference.pdf)

**Cache-Craft.** Accepted SIGMOD 2025; identifies reusable chunk caches, performs partial recomputation, and manages storage/eviction. Its abstract reports production and synthetic workloads. Useful follow-up for systems policy beyond a fixed repair ratio; not fully dissected here. [Paper](https://arxiv.org/abs/2502.15734)

**CacheGen.** Encodes/compresses KV tensors and adapts loading/compression to bandwidth. Addresses moving useful state, not validity after context edits. Quality claims are empirical; do not call all compression lossless. [Paper](https://arxiv.org/abs/2310.07240)

## 6. LMCache implementation and version-sensitive setup

Commit: `1d8716508371ab5c95de0d963160e1e64de467ef`.

- [`LMCBlender.process_qkv`, lines 60–124](https://github.com/LMCache/LMCache/blob/1d8716508371ab5c95de0d963160e1e64de467ef/lmcache/v1/compute/blend/blender.py#L60): configured check layers compute squared key differences, select a fraction using `torch.topk`, and update selected old K/V entries.
- [`server.py`, lines 203 onward](https://github.com/LMCache/LMCache/blob/1d8716508371ab5c95de0d963160e1e64de467ef/lmcache/v1/multiprocess/server.py#L203): current MP server supports `engine_type == "blend"`, requires `lmcache_driven` or `auto` transfer mode.
- [Pinned docs](https://github.com/LMCache/LMCache/blob/1d8716508371ab5c95de0d963160e1e64de467ef/docs/source/kv_cache_optimizations/cacheblend.rst): `lmcache server ... --engine-type blend`.

The first pointer is in-process blending code; the complete new MP selective-recompute execution path was not traced. MP enablement and legacy selection were inspected separately.

Live docs span generations: [configuration page](https://docs.lmcache.ai/dev/api_reference/configurations.html) says blending unsupported; [legacy docs](https://docs.lmcache.ai/kv_cache_optimizations/blending.html) are deprecated; [current docs](https://docs.lmcache.ai/kv_cache_optimizations/cacheblend.html) document MP mode. Pin instructions to a tested version before offering a runnable recipe. No installation/execution acceptance here.

## 7. Architectural exceptions

- Sliding-window attention: an old token outside the current window may already have affected retained deep-layer states. Stacked layers extend dependency reach approximately as layers × window width. For a purely finite local-attention architecture, a same-length edit can eventually lie outside relevant dependency cones. This is model-specific reasoning, not generic API support. [Mistral 7B §2](https://arxiv.org/html/2310.06825v1)
- Block-independent/custom masks: reuse can be exact relative to that masked computation while differing from ordinary dense causal inference. Name the reference mask.
- First-layer projections: some work is token/position-local; reusing it does not preserve the whole deep cache.
- Recurrent/SSM/hybrid models: state checkpoint semantics differ; do not extrapolate token-wise transplant claims. vLLM's hybrid Mamba docs show special checkpoint requirements.
- RoPE correction changes coordinate position of keys, not what the token learned from preceding content. Position correctness and history correctness differ.

## 8. Practical recommendations derived from evidence

Hosted-API harness:

1. Serialize reproducibly: stable tools/schema ordering, instructions, no unnecessary clocks/random IDs at the start.
2. Put mutable state late when this preserves authority and behavior.
3. Use append-only corrections where the desired task can correctly be represented as an update. Exact caching of that new prompt does not establish equivalence to an in-place edit.
4. Version prompts intentionally; real instruction changes justify recomputation.
5. Reuse warmed variants/branches where retention/routing permits. Revisiting can hit an existing path.
6. Measure first divergent token/block; classify changed input, unsupported feature, eviction/expiry, routing, namespaces, thresholds and actual defects.

Self-hosting:

- Improve retention, placement, routing, granularity and prefetch without changing computation.
- Treat selective repair as explicit approximation.
- Validate edits changing negation, permissions, amounts, identity, tool parameters and cited evidence. Aggregate benchmark agreement does not settle those cases.
- Measure cold/warm TTFT, output latency, end-to-end latency, bytes retained, cache-hit tokens, repair cost and task correctness separately.

Useful article sentence: **An avoidable cache miss is an engineering defect only after we establish that the computation was actually reusable.**

## 9. Recent leads, not accepted conclusions

[Models Take Notes at Prefill: KV Cache Can Be Editable and Composable](https://arxiv.org/html/2606.17107v1) closely matches this user's question: downstream states carrying conclusions, append-only errata and RoPE-positioned skill transplantation. It uses terms including lossless/indistinguishable, but logit cosine below 1 and task agreement are not mathematical equivalence. Limitations include unreliable selective edits and incomplete architecture coverage. Research lead with authors' claims attributed; no reproduction or repo audit.

[PatchKV](https://arxiv.org/abs/2609.26219) targets edited interior spans with preserved suffixes, predicted repair regions and offloaded-state restoration. Abstract only inspected. August submission date versus September arXiv identifier is an unresolved metadata oddity. Omit numerical claims until verified through paper/code.

## 10. Suggested experiment and infographic

A small deterministic multi-layer causal-attention program can demonstrate:

- Original sequence, equal-length early edit.
- Fresh recomputation versus stale suffix reuse.
- First-layer token-local KV agreeing while deeper suffix KV diverges.
- Prefix reuse plus suffix recomputation matching the fresh path.
- Appending and revisiting branches.
- Optional extension: explicit block-diagonal mask and its changed reference computation.

Label it a toy dependency demonstration, not a provider benchmark or language-quality test. A paired infographic should show token × layer dependency propagation and a prefix tree of retained branches.

## 11. Independent audit of parent's numerical lab

Read and executed `/Users/goga/Documents/goga/blog/docs/worklist/prompt-caching-from-api-to-agent-loop/lab/kv_dependency.py` after the research report. No blog edits. The program has three layers, width eight, sixteen token IDs, seeded random parameters and absolute positional features. It is untrained, single-head, uses Python floating-point arithmetic, and sequentially processes tokens for both reference and reused paths.

Result: **clean for its stated purpose**. Full script assertions passed. Observations:

| Measurement | Result |
|---|---:|
| Cold versus valid-prefix reuse max logit delta | 0.0 |
| Cold versus stale suffix splice max logit delta | 0.3399351139175004 |
| Unchanged token layer-one KV max delta | 0.0 |
| Unchanged token layer-two KV max delta | 0.14263336329948884 |
| Unchanged token layer-three KV max delta | 0.4358405552301371 |
| Append versus cold max logit delta | 0.0 |
| Old branch revisit versus cold max logit delta | 0.0 |
| Dependency-hash common prefix blocks | 1 |

Independent supplementary audit imported the module and checked valid-prefix reuse against cold execution for six variants: replace first token, replace middle token, delete middle token, insert middle token, truncate suffix, append token. All produced identical reference logits (max delta 0.0). Those supplementary cases were run from an ephemeral script and are not included in the committed lab.

Limits worth retaining in the article:

- Zero deltas are exact in this program because both paths use the same token-by-token arithmetic order. They do not establish bitwise invariance of parallel GPU prefill versus decode.
- Nonzero logits demonstrate a different computation, not an incorrect answer, hallucination or measured language-quality degradation.
- The seeded example demonstrates existence and mechanism; it does not prove every edit changes every suffix activation.
- Absolute positional features mean the experiment does not implement or test RoPE repair.
- Hashes are one-token chained blocks with a model label, an illustration rather than a faithful provider cache key or block policy.
- Retained branch availability is simulated by retaining `old_cache`; the program has no eviction, namespace/routing policy or provider retention behavior.
- The stale-splice experiment correctly recomputes the edited token using the preserved prefix before reattaching old suffix states; the observed mismatch therefore is not merely a failure to recompute the replacement itself.

No repair required. Optional explanatory improvement only: describe the toy as a simplified single-head causal transformer rather than implying a production trained architecture, and explicitly tie exact-zero deltas to this execution order.
