## Findings, ordered by severity

Audit cutoff: SHA-256 `9d8a1f124fb165fe68d2f30f877f7081bdbe5d889c1f8e82dbb01f507fb370da`. The file remained stable through the final check. I made no changes.

### Blockers

1. The opening overstates both the TransformerLens problem and interp-engine’s validation.

At [022…ts:51](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:51):

> “there is a fair chance you read the wrong tensor”

TransformerLens’s block-level `hook_mlp_out` deliberately returns the residual contribution. It is wrong only when a caller assumes that name means the raw MLP module output. “Fair chance” has no prevalence evidence.

At lines 53–54:

> “the wrong tensor is 87% similar … far enough to turn a trained lens into noise”

The reproduced value is cosine `0.8736638`, not “87% similarity.” The local run did not pass that tensor through an SAE, so “turn a trained lens into noise” improperly combines a reproduced cosine with a separate maintainer-reported production failure.

At lines 55–56:

> “every tap gets one name, and every name is checked against the other tools”

The 34 points are a vocabulary union; architectures expose subsets. The validator covers 27 point types, and many engine/model cells are unsupported or not requested. Evidence: [SUPPORTED_POINTS.md:3](/private/tmp/claude-501/-Users-goga-Documents-goga-blog/7fed1700-9c71-4dfb-9eb3-c8a61c669103/scratchpad/interp-engine/docs/SUPPORTED_POINTS.md:3), [spec.py:305](/private/tmp/claude-501/-Users-goga-Documents-goga-blog/7fed1700-9c71-4dfb-9eb3-c8a61c669103/scratchpad/interp-engine/validator/comparison/spec.py:305).

At [022…ts:76](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:76):

> “The correctness holds.”

That is contradicted by the article’s own DeepSeek failure and Gemma-4 warnings. The reproduced state is only: two models, eager backend, fp32/MPS, four matched points at five layers, one 29-token prompt.

Exact replacement for the lede:

> interp-engine is Neuronpedia’s Apache-2.0 inference engine, announced August 31. It defines 34 canonical point names across model families and records cross-engine comparisons for 27 point types; not every model or engine covers every point. On my Apple Silicon run, 20 matched gemma-2-2b point-layer pairs stayed within 5.3e-4 of TransformerLens. The published speed result—6.9× for one stream and 41× at eight requests—comes from static taps on a B200, not from the eager path I tested.

2. The explanatory introduction mischaracterizes both SAEs and the evidence.

At [022…ts:61](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:61):

> “Interpretability work is largely reading those taps and training small lenses, called sparse autoencoders”

Sparse autoencoders are not generally called “lenses,” and mechanistic interpretability is not largely synonymous with SAE training.

Also unsupported:

- “the site where much of the field browses model internals” (lines 70–71)
- “nobody was reading that number” (lines 73–74)
- “and then they built the engine” (line 76), which asserts an unproved causal chronology

Exact replacement:

> Some interpretability workflows capture activations and train sparse autoencoders on one chosen tensor. Feeding an SAE a different tensor can preserve the shape while break the learned feature basis. Neuronpedia reports that failure for gemma-2-2b: FVU rose from 0.26 to 9.8, active features fell from 85 to 8, and the endpoint returned zeros.

3. The vLLM prefix-cache behavior is wrong, and “every point reachable” is false.

At [022…ts:145](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:145):

> “prefix caching off, or salted per request when a steer would poison a cached prefix. That keeps every point reachable”

At the audited commit, prefix caching is on by default. Capture and steering requests receive a unique `cache_salt`; ordinary generation can reuse prefixes. Six canonical points remain unavailable on vLLM. Evidence: [PERFORMANCE.md:17](/private/tmp/claude-501/-Users-goga-Documents-goga-blog/7fed1700-9c71-4dfb-9eb3-c8a61c669103/scratchpad/interp-engine/docs/PERFORMANCE.md:17), [SUPPORTED_POINTS.md:23](/private/tmp/claude-501/-Users-goga-Documents-goga-blog/7fed1700-9c71-4dfb-9eb3-c8a61c669103/scratchpad/interp-engine/docs/SUPPORTED_POINTS.md:23).

Exact fix:

> A Python hook fires during CUDA-graph recording but not replay, so the hooked backend uses `enforce_eager=True`. Prefix caching stays on; capture and steering requests receive a unique `cache_salt`, while plain generation can reuse prefixes. This preserves the 28 vLLM-supported canonical points, not all 34. One-stream decode is 31.5 tok/s against eager’s 30.9, but batching still raises eight-request aggregate throughput to 226 tok/s against 30.1.

Make the same correction in the source card at line 436.

4. The rendered read time is now 16 minutes, not 14.

The rendered H1 plus body through the final decision is approximately 3,049 words. `ceil(3049 / 200) = 16`.

- Current metadata: [022…ts:42](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:42), `14 min read`
- Exact fix: `readTime: '16 min read'`
- Alternatively, cut below 2,800 words to retain 14 minutes.

The description is also 158 characters, slightly over the requested ~155, and overclaims all 34 points being checked.

Exact replacement, 138 characters:

> interp-engine defines 34 canonical hooks and compares 27 point types across engines. I test eager parity on a Mac and scope its B200 speed claim.

The 49-character `seoTitle` passes and is handles-first. H1 count passes: one in the preamble, none in the body.

5. The first-100-word structure test fails.

The lede is 121 words. Its first 100 words contain no date, no bounded present limit, and no valid provable-wrong claim. The precise limit appears later. The proposed replacement lede above satisfies the required name, date, job, market focus, limit, and falsifiable reproduced result.

6. The decision tests are not fully specified, and the close does not stop.

At [022…ts:356](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:356):

- The Apple test does not name the three prompt lengths.
- The RTX 4090 test omits bf16, request count, matched task, repository state, runtime, and acceptance check.
- One run should not promote all Mac users to “supported”; it would verify that configuration.

Exact replacement:

> An fp16 eager run on this Apple M5 across every applicable point at four layers and 64-, 512-, and 2,048-token prompts would pass at mean cosine ≥0.9999, max absolute error ≤0.002, and identical greedy tokens. A bf16 Qwen3-4B comparison on one RTX 4090, using the same pinned stack, 8,192-token context, prompts, generation length, and acceptance check in eager and static modes, would pass at ≥5× one-stream and ≥20× eight-request aggregate throughput with no cross-request contamination.

Also fix the typo at line 360:

> “hardware researchers own” → “hardware that researchers own”

The final paragraph makes the decision, then continues into Herdr, Bun, and an unsupported DFlash 2 preview. Delete everything after:

> “…the hardware most researchers have.”

That leaves one decision and stops, as required.

### Major findings

7. The GPU source card is false as written.

At [022…ts:466](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:466):

> “no passing consumer-GPU row”

`VERIFIED.md` has a passing eager Qwen3-4B run on an RTX 5090. What is absent is a passing consumer-GPU vLLM/static row. Evidence: [VERIFIED.md:64](/private/tmp/claude-501/-Users-goga-Documents-goga-blog/7fed1700-9c71-4dfb-9eb3-c8a61c669103/scratchpad/interp-engine/gpu-sizer/VERIFIED.md:64).

Exact fix:

> Verified vLLM/static fits: Qwen3-4B on A40 and B200; no passing consumer-GPU vLLM row

Likewise change line 350 to:

> Wait if you expected the speedup on a Mac, free Colab, or a consumer GPU; no vLLM/static result is verified there.

8. The validator description implies uniform six-engine coverage.

At [022…ts:181](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:181):

> “It runs each model through eager, hooked vLLM, static vLLM, TransformerLens 2 and 3, and nnsight”

The sweep has six active paths, but numerous model/engine cells are unsupported and many point-engine pairs are not requested.

Exact fix:

> The sweep attempts six active engine paths for each committed model and records the point-engine pairs each path supports; unsupported and unasked cells remain explicit.

9. The local throughput verdict is too kind and not apples-to-apples.

At [022…ts:326](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:326):

> “the eager backend costs almost nothing over bare transformers”

The measured loss is 19.1%, about one fifth. The sentence immediately admits this. Also, interp-engine generates and recaptures once, whereas TransformerLens hooks every cached decode position, so “my current harness is the slow one” compares different capture semantics.

Exact fix:

> On gemma-2-2b, interp-engine’s generate-then-recapture path is 19% slower than bare Transformers and 3.3× faster than this TransformerLens per-position caching loop. Those are different capture strategies, not a general engine ranking.

10. Several numerical renderings need correction or clarification.

- `87% similar` must be `cosine 0.874`.
- Matched cosines `0.99999` at lines 282 and 284 are not conventional five-decimal rounding; the raw values round to `1.00000`.
- The two DeepSeek vLLM values are `0.235296` and `0.235934`; at three decimals they are `0.235` and `0.236`, not both `0.235`.
- The raw memory difference is `4.546 GB`, which rounds to `4.5 GB` at one decimal. `4.6` results only from subtracting already-rounded table cells.
- “injected it at four times its own norm” should be “injected four times the vector”; the raw vector norm was 81.253 and the delta norm 325.011.

11. The TransformerLens source quotation is not exact.

At line 93:

> “so hook_attn_out captures that which is added.”

The source says:

> `We do it before the hook so hook_attn_out captures "that which is added to the residual stream"`

The comment concerns `hook_attn_out`; the adjacent MLP implementation applies the same ordering but has no equivalent comment. Evidence: [transformer_block.py:181](/private/tmp/claude-501/-Users-goga-Documents-goga-blog/7fed1700-9c71-4dfb-9eb3-c8a61c669103/scratchpad/repro/.venv/lib/python3.12/site-packages/transformer_lens/components/transformer_block.py:181), [transformer_block.py:228](/private/tmp/claude-501/-Users-goga-Documents-goga-blog/7fed1700-9c71-4dfb-9eb3-c8a61c669103/scratchpad/repro/.venv/lib/python3.12/site-packages/transformer_lens/components/transformer_block.py:228).

Exact fix:

> TransformerLens applies the second norm before both block-level hooks. Its attention comment says: `We do it before the hook so hook_attn_out captures "that which is added to the residual stream".`

12. The launch quotations differ from the editor-verified capitalization.

[06-editorial-synthesis.md:87](/Users/goga/Documents/goga/blog/packages/blog/drafts/research/interp-engine/06-editorial-synthesis.md:87) verifies:

- `“Over 40x the throughput vs HF transformers”`
- `“This is the v1 of interp-engine …”`

The body and source card use lowercase `over` and `this`. Capitalize both if retained. The source-card phrase `"this is the v1"` has no body claim and should simply be removed.

13. The close adds unsupported facts outside the article’s evidence.

Lines 370–374 claim that DFlash 2 only mattered after landing in vLLM and llama.cpp and that it runs through MLX on this Mac. None of the supplied evidence supports those claims. They also violate the one-decision close. Remove them rather than add another research lane.

14. Cursor involvement is stated too strongly.

At lines 242–243:

> “thirteen commits co-signed by the Cursor agent”

Git establishes 13 `Co-authored-by: Cursor` trailers, not a measurable share of authorship or even that Cursor produced each change.

Exact fix:

> Thirty-one commits since August 20, one human author identity across two emails, thirteen commits with Cursor co-author trailers, and seven release tags in twelve days.

## Every checked number

| Article value | Verdict | Evidence/result |
|---|---|---|
| Issue `06`; publication `2026-09-02` | Editorial values | Internally consistent; publication date is scheduled rather than evidentiary |
| `14 min` | **Fail** | Rendered H1 + body ≈3,049 words → 16 minutes |
| `34` canonical points | Match, qualified | 27 base + 7 conditional mHC points; no architecture necessarily exposes all 34 |
| `28` on vLLM; `6` unavailable | Match | `SUPPORTED_POINTS.md:3-4,23-38` |
| `27 of 34` validator point types | Match | `spec.py:305-337` |
| `35` rows in committed table | Match | Recomputed from rendered README table; distinct from 62 result-detail files present |
| README `50+`; `31` verified architectures; `46` unaudited | Match, reported | `validator/README.md:7,94-103` |
| `2 → 1` | Qualified shorthand | Two tensor meanings collapsed under “MLP output”; exact hook strings differ across tools |
| `87%` | **Fix** | Raw cosine `0.8736638`; cosine is not a percentage |
| `0.87` | Match if labeled cosine | Rounded from `0.8736638`; “fools a lens” was not reproduced |
| `5e-4` | Match, coarse | Raw maximum `5.340576e-4`; `5.3e-4` is clearer |
| FVU `9.8` vs `0.26`; L0 `8` vs `85` | Match, Reported | `ENGINE_HOOK_MAPPINGS.md:64-69` |
| Layer `4` mapping rows | Match | Mapping table at `ENGINE_HOOK_MAPPINGS.md:23-47` |
| Three backends | Match | eager, hooked vLLM, static vLLM |
| `31.5` vs `30.9` tok/s | Match, Reported | Benchmark `results-latest.md:95` |
| Batch window `16,384 → 1,024` | Match | `PERFORMANCE.md:167-170` |
| Benchmark table: `30.9/31.5/214/354` | Match | `results-latest.md:95` |
| Benchmark table: `30.1/226/1,238/1,733` | Match | `results-latest.md:119` |
| Capture `34.9/85.3/90.2 ms` | Match | `results-latest.md:135` |
| Generate+capture `1,132/1,051/185 ms` | Match | `results-latest.md:167` |
| Lens `3.3/202/202/205 ms`, top `10` | Match | `results-latest.md:189-203` |
| `6.9×` one stream | Match | `214 / 30.9 = 6.9256`, rounds to 6.9× |
| `41×` at `8` requests | Match | `1,238 / 30.1 = 41.1296`, rounds to 41× |
| Static loses `40%` vs vanilla | Match | `(354−214)/354 = 39.55%` |
| B200, bf16, `2026-08-19`, engine `1.2.0`, vLLM `0.26.0` | Match, Reported | `results-latest.md:5,48-55` |
| Audited engine `1.5.1`; vLLM floor `0.28.0` | Match | `pyproject.toml:3,49-50,87-89` |
| Raw-HF thresholds `0.002`, `0.9999` | Match | `spec.py:512-516` |
| Loose thresholds cosine `0.99`, relative error `0.5` | Match | Same evidence; waivers can lower cosine for named checkpoints |
| First/middle/last plus ¾ depth at ≥`16` layers | Match | `spec.py:425-459` |
| Gemma whole-tensor cosine >`0.997`; worst token `0.961` | Match | Minimum whole tensor `0.997493`; `final_norm` worst token `0.961009` |
| Gemma source-card counts `38`, `36`, `36`, `32` | Match | Result details lines 11–15 |
| DeepSeek layer `42`, cosine `0.235` | Partial | Hooked `0.235296`; static `0.235934` → `0.236` at three decimals |
| Gemma-4 `12B`, `26B`, `31B` | Match | 12B/26B warnings; 31B pass |
| Two sub-billion CI models; one L4 job | Match, Code-inspected in research | Full sweep remains manual/self-hosted |
| Migration `2026-08-21`, `1,119` files | Match, Reported | Local research record; original URL not rechecked |
| TransformerLens `3.8.1`, `2026-09-01` | Match, Reported | Local research record; PyPI not rechecked |
| nnsight `0.7.0` | Match, Reported | Local research record; release page not rechecked |
| Zero external issues and PRs | Match as of `2026-09-01`, Reported absence | Time-sensitive; must be rechecked before publication |
| `31` commits since Aug 20; `13` Cursor trailers; `7` tags in `12` days | Match | Recomputed from audited git history |
| One human author | Qualified | 25 non-bot commits use two identities attributable to Johnny Lin |
| Transformers `5.14.1` vs `5.16.1` | Match | README requirement vs Gemma-4 validator environment |
| TransformerLens `3.5.1` local run | Match | Reproduction environment |
| Four points × five layers = `20` matched Gemma comparisons | Match | Raw JSON contains 20 matched rows |
| One `29`-token prompt; fp32/MPS | Match | `04-local-reproduction.md:25-32` |
| Max matched difference `5.3e-4` | Match | Raw `0.0005340576` |
| Matched table `0.99999` values | **Rounding fix** | The two shown values conventionally round to `1.00000` |
| Naive cosines `.874/.803/.895` and `.829/.712/.791` | Match | Correct three-decimal rounding |
| Naive absolute range `15–272`; matched <`0.001` | Match | Raw `15.1268–272.4521`; matched max `0.0005341` |
| Six sentiment pairs; layers `13` and `6`; multiplier `4×` | Match; wording fix | Delta was four times the vector, not “four times its norm” |
| Logit max `7.7e-5`; `20` identical tokens | Match | Raw maxima `7.7486e-5` Gemma, `6.8665e-5` gpt2 |
| Throughput setup `128+64`, one warm-up, three runs | Match | `04-local-reproduction.md:56-65` |
| MPS rates `7.6/6.2/1.9`, `57.8/85.9/39.6` | Match | Correct one-decimal rounding |
| Memory `11.1/12.4/17.0 GB` | Match | Correct decimal-GB rounding |
| “one fifth” speed loss | Match | 19.08% |
| `4.6 GB` memory difference | **Fix** | Raw difference `4.546 GB` → `4.5 GB`; 4.6 comes from subtracting rounded cells |
| Machine with `24` | Match but add unit | `24 GiB unified memory` |
| Qwen3-4B A40/B200 static fits | Match | `VERIFIED.md:28-31` |
| “no consumer-GPU row” | **False** | RTX 5090 eager row passes; only consumer vLLM/static evidence is absent |
| Proposed Apple: four layers, three lengths, `.9999/.002` | Proposed but incomplete | Lengths should be fixed at 64/512/2,048 |
| Proposed RTX 4090: `8,192`, `5×`, `20×` | Proposed but incomplete | Needs bf16, eight-request aggregate, same task/state/runtime/check |
| Third issue in a row | Internally checkable | Both internal slugs exist; claim is editorial, not evidence |
| DFlash `2` claims | **Unsupported here** | No supplied evidence |

## Sources audit

All 17 items have a non-empty `why`. No whole card is orphaned, but the launch card contains the unused `"this is the v1"` quotation.

| Source card | Verdict |
|---|---|
| Audited README | Claim matches. Change “Every code claim” to “Every interp-engine code claim”; external/live claims are not pinned to this commit. |
| Launch post | Claims match the editor’s record, but `Over` and `This` need original capitalization; remove unused v1 quote. |
| Hook-mapping guide | Pass. |
| Supported points | Pass. |
| TransformerLens source | Content matches; URL uses mutable tag `v3.5.1`, not a commit SHA. Replace with the release commit SHA after resolving it. |
| Validator spec | Pass. |
| Gemma result details | Pass. |
| DeepSeek result details | Change to `0.235 hooked / 0.236 static` or “about 0.235.” |
| Benchmark report | Pass. Prefer exact `vLLM 0.26.0`. |
| Performance guide | **Fail:** says prefix caching defaults off; audited docs say it defaults on with per-request salting. |
| Neuronpedia migration | Matches local research; network page unchecked. |
| Neuronpedia inference README | Claim matches local research, but `blob/main` violates the pin rule. Pin it to `17bc39171bf11c68bf5bf52013b11afe8e8b1f81` if that revision contains the statement. |
| TransformerLens PyPI | Release claim matches research. It does not source the separate TransformerBridge/native-HF claim; add the v3 migration guide card. |
| nnsight releases | Matches research; network page unchecked. |
| GPU verification | **Fail:** consumer eager RTX 5090 row exists. Qualify as “no consumer-GPU vLLM/static row.” |
| MPS selection | Pass. |
| Research artifacts | Pass locally; public URL uses `tree/main`, so pin it to the publication commit if immutable provenance is required. |

Material-link completeness:

- The hook-mapping and migration links have cards.
- The repository entity link is covered by the pinned README card.
- The Neuronpedia homepage link carries the unsupported “much of the field” claim and has no matching source card. Remove that market claim or add a suitable source.
- The two internal series links resolve locally; they are editorial links, not evidence.
- Missing cards for material claims: `validator/README.md`/CI workflows, `pyproject.toml`, git history, gradients/RPC code, and the TransformerLens v3 migration guide.

## Structure verdict

- Verdict in first 100 words: **Fail**
- One falsifiable, correctly bounded claim in first 100 words: **Fail**
- Five-part deep-dive substance: **Pass conceptually**—verdict, shipped system, theory, limits/local reproduction, decision are present, though spread over six H2s
- End-to-end shipped-system trace: **Pass after correcting cache behavior and vLLM coverage**
- Maintainer thesis plus sound rival: **Pass**
- Shipped/reported/proposed separation: **Mostly pass; opening and causal chronology violate it**
- Try/wait advice: **Pass**
- Two fully specified tests: **Fail**
- One-decision close: **Fail**
- Narrow market scope: **Mostly pass; the DFlash/Herdr/Bun ending breaks focus**

## Prose verdict against the writing rules

| Check | Verdict and exact fix |
|---|---|
| Figures of speech | **Fail.** “A Gemma-2 block is a sandwich” → “A Gemma-2 block normalizes both before and after each sublayer.” “charts … with a straight face” → “the resulting charts still look valid.” “whole lens went dark” → “the SAE source returned no active features.” |
| Avoidable long/jargon words | Mostly pass for necessary technical terms. “The incumbents are converging…” is abstract; replace with “TransformerLens now wraps native HF models, while nnsight now serves traces through vLLM.” |
| Passive voice | **Fail in several avoidable places.** “are recorded into the graph” → “CUDA graph capture records the `copy_` and `add_` operations.” “Layers are sampled…” → “The validator samples the first, middle, last, and three-quarter-depth layers.” |
| “not X but Y” limit | **Fail across metadata/sources.** Description says “parity table, not speed”; source whys say “contribution, not raw output” and “here, not in the summary table.” Rewrite declaratively. |
| Three-example lists | **Fail.** Coverage names three omitted points and “four others”; either name all seven or say “Seven points, including `resid_pre` and `attn_probs`, are excluded.” The wait paragraph also stacks too many cases; group them into fast-path research limits and unverified architectures. |
| Announcing | **Clear fail.** Delete lines 131–133 (“This section and the next…”), lines 179–181 (“this is the section to read…”), “Read the headline against that table,” “Two things surprised me,” and “Two results would change this verdict.” State the content directly. |
| Consecutive punchline endings | **Fail.** The first three paragraphs end on a rule, a silent model-family failure, and “datacenter GPU.” The replacement lede consolidates the verdict and removes this cadence. |
| Mechanical rhythm | **Fail.** “interp-engine wants… TransformerLens wants… nnsight wants…” is a three-beat template. Replace with one comparative sentence. |
| Jokes | Two low-value jokes: “renders it with a straight face” and “thin in the way a two-week-old project is thin.” Delete both. |
| Straw man | The skeptic section is sound. The source why “Kills the story that the incumbent is dormant” creates a story the article never seriously advances. Replace with “Shows TransformerLens was actively releasing during the launch window.” |
| Explaining the title | **Pass.** The body demonstrates the title without explicitly explaining it. |
| Explaining the article | **Fail.** The skip instruction, “section to read,” and final series explanation are editorial scaffolding. Remove them. |

## Adversarial pass

interp-engine maintainers would reasonably dispute:

- That a TransformerLens user had a “fair chance” of reading a wrong tensor; the mistake requires assuming the block-level contribution hook is raw output.
- That every tap/name is cross-checked before serving.
- “The correctness holds,” given the published DeepSeek failures and Gemma warnings.
- Prefix caching being off by default.
- “Every point reachable” under vLLM.
- “Gives up most of what vLLM is for,” because hooked vLLM still delivers 226 vs 30.1 aggregate tok/s at concurrency eight.
- The lack of any consumer-GPU passing row.
- Treating Cursor trailers as measured agent authorship.

A TransformerLens maintainer would reasonably dispute:

- Calling `hook_mlp_out` itself wrong. It deliberately names the residual contribution; `blocks.N.mlp.hook_out` is the raw module output.
- Saying two tensors have the same exact hook name. The collision is across tool conventions and conceptual labels, not within TransformerLens’s two hook strings.
- “version 2 reimplemented them.” The validator’s `tlens_v2` means the legacy `HookedTransformer` path running under a later package version. Say “legacy HookedTransformer uses its own model implementations.”
- The speed comparison as a general harness ranking: the two measured capture strategies perform different work.
- The shortened attention comment being used as though it were the exact MLP comment.

Where the article is unfair:

- To TransformerLens in the opening.
- To hooked vLLM on prefix caching and retained batching throughput.
- To consumer hardware by overlooking the verified RTX 5090 eager row.

Where it is too kind:

- “The correctness holds.”
- “Every name is checked.”
- Calling a 19% gemma slowdown “almost nothing.”
- Inferring that cosine 0.87 is enough to fool an SAE without running that SAE.
- Treating one prompt and two models as broad platform parity.

## URLs not checked over the network

Contents of the pinned interp-engine links were verified against the local clone, but HTTP reachability was not checked:

- `https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/README.md`
- `https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/docs/ENGINE_HOOK_MAPPINGS.md`
- `https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/docs/SUPPORTED_POINTS.md`
- `https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/validator/comparison/spec.py`
- `https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/validator/comparison/results/google/gemma-2-2b/0_result_details.md`
- `https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/validator/comparison/results/deepseek-ai/DeepSeek-V4-Flash-0731/0_result_details.md`
- `https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/benchmarks/results-latest.md`
- `https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/docs/PERFORMANCE.md`
- `https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/gpu-sizer/VERIFIED.md`
- `https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/interp_engine/select.py`
- `https://github.com/TransformerLensOrg/TransformerLens/blob/v3.5.1/transformer_lens/components/transformer_block.py`

These relied solely on the supplied research/editor records and should be rechecked by the editor:

- `https://www.neuronpedia.org/blog/interp-engine`
- `https://www.neuronpedia.org`
- `https://github.com/hijohnnylin/neuronpedia/commit/17bc39171bf11c68bf5bf52013b11afe8e8b1f81`
- `https://github.com/hijohnnylin/neuronpedia/blob/main/apps/inference/README.md`
- `https://pypi.org/project/transformer-lens/`
- `https://github.com/ndif-team/nnsight/releases`
- `https://github.com/decoderesearch/interp-engine`
- `https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/interp-engine`

The two root-relative internal links were checked locally and resolve to existing post slugs.

Model and effort: `gpt-5.6-sol`, high reasoning effort.