The current draft is not publication-ready yet. The structure now follows the owner’s chosen significance → findings → background sequence, and most `07` corrections landed, but two hard factual/provenance defects and several narrower overclaims remain.

Audit target SHA-256: `95fa31f36baca688cfd7d79264e60036414bfc2a1474b7d41a7b07309b6b5186`. The interp-engine clone was clean at baseline `74716092e5bad8beca1e27193ec9980a8e9a4e85`.

## Findings, ordered by severity

### Blocker — the final two source cards render incorrectly

At [022…ts:538](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:538), the reproduction card lacks `ref` and `url`. At [022…ts:542](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:542), duplicate `ref` and `url` keys overwrite the intended `GRADIENTS.md` reference.

The rendered result is:

- Reproduction evidence: blank reference.
- Gradient/RPC evidence: links to the general research directory, not `GRADIENTS.md`.

Exact fix:

```ts
{
  claim: 'Reproduction scripts, JSON results and environment for the Apple Silicon parity, steering and throughput runs',
  why: 'Every number in the laptop section comes from these files; rerun them to check me.',
  ref: 'Research artifacts',
  url: RESEARCH_URL,
},
{
  claim: 'No gradients through vLLM; eager supports through-forward gradients; the vLLM worker exposes a closed set of remote calls',
  why: 'Sources the limits that put gradient and patching work on the eager backend.',
  ref: 'docs/GRADIENTS.md',
  url: `${AT}/docs/GRADIENTS.md`,
},
```

The normal package typecheck passes because its `tsconfig` includes only `src/`, not `posts/`; it does not catch this post-level object problem.

### Blocker — `5e-4` understates the measured maximum

The post says “agreed … to `5e-4`,” “at most `5e-4`,” and “largest disagreement … `5e-4`” at [line 58](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:58), [line 71](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:71), and [line 120](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:120).

The JSON maximum is `0.0005340576171875`. [Line 319](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:319) already rounds it correctly.

Exact fix: replace all three earlier occurrences with `5.3e-4`.

### Major — metadata and opening still overstate validation coverage

The alternative headline says every tap is checked against both tools; the description implies all 34 points are checked; and the lede can be read as saying all 27 validator points are checked against both TransformerLens and nnsight:

- [Alternative headline](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:21)
- [Description](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:24)
- [Lede](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:55)

The validator defines 27 requested point types, but engine/model support varies and numerous cells are unasked or unsupported.

Exact fixes:

```ts
alternativeHeadline:
  'Same hook name, different tensor: interp-engine defines canonical taps and records cross-engine checks for 27 point types',
description:
  'interp-engine defines 34 canonical hooks and compares 27 point types across engines. I test eager parity on a Mac and scope its B200 speed claim.',
```

In the lede:

> interp-engine (Apache-2.0) defines 34 canonical point names and records cross-engine comparisons for 27 point types; each model and engine covers a subset.

### Major — several claims exceed the available evidence

- [Line 57](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:57): “the first run outside their lab” is unprovable. Research found no earlier public outside report by September 1; that does not establish the first actual outside run.

  Exact fix: “an outside run” or “the first outside run I found by September 1.”

- [Lines 110–111](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:110): “nothing was reading that number” remains unsupported from `07`.

  Exact fix: delete that clause. The documented evidence is that nothing raised and the endpoint returned zeros.

- [Lines 335–338](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:335): the local reproduction did not run the mismatched tensor through an SAE, so “will encode it into something that looks like sparse features” is not established.

  Exact fix:

  > A cosine of 0.87 is a plausible-looking wrong result: it is far from random and has the right shape. On gpt2 the same naive pairing is exact…

- [Lines 83–85](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:83): “the piece nobody else has” is a universal market claim the research did not prove.

  Exact fix: “the project’s distinctive piece is the cross-engine comparison.”

- [Lines 248–251](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:248): “far more than most tools offer” lacks a systematic comparison.

  Exact fix: “It is useful evidence, and it is still not a certificate.”

- [Lines 177–179](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:177): “the same trick every interpretability library uses” is another unsupported universal.

  Exact fix: “It is a conventional hook-based capture path…”

### Major — three speed statements are too broad or contradicted by the article

- [Line 58](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:58): evidence shows where the advertised result was measured, not that it inherently requires a datacenter GPU.

  Exact fix: “the advertised speed was measured on a datacenter GPU.”

- [Lines 75–76](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:75): “A laptop gets no speedup” is too broad. The post’s gpt2 table shows `85.9` tok/s for interp-engine against `57.8` for bare Transformers, although the capture methods differ.

  Exact fix: “My gemma-2-2b laptop run got no speedup.”

- [Lines 169–172](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:169): “only one of them is fast” ignores hooked vLLM’s eight-request result, `226` versus eager’s `30.1`.

  Exact fix: “The same request can run three ways; only the static path delivers the advertised single-stream gain.”

- [Lines 210–212](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:210): “The eager path is correct anywhere and costs nothing” is false as written. Source support does not prove model-wide correctness, and the local Gemma measurement found a 19% speed cost plus extra memory.

  Exact fix: “The eager path runs on CPU, MPS, or CUDA; the published speed evidence applies to datacenter CUDA with taps declared up front.”

### Major — validator failure and sampling rules are incomplete

At [lines 217–225](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:217):

- `0.99` cosine and `0.5` relative error are the default loose-tier gates; checkpoint waivers can lower the cosine gate to `0.90–0.97`.
- A loose-tier cell also fails when a requested signal is missing, not only for shape mismatch or cosine below `0.5`.
- The three-quarter-depth layer is added only at 16 or more layers; hybrid trunks may also add the first attending layer.

Exact replacement for the relevant sentences:

> A pair involving TransformerLens or a fused kernel normally passes at cosine 0.99 and relative error 0.5; named checkpoint waivers can lower the cosine gate. A tolerance miss becomes a warning. A missing signal, shape mismatch, or cosine below 0.5 is a failure. The validator samples the first, middle, and last layers, adds three-quarter depth for trunks with at least 16 layers, and may add an early attending layer for hybrid trunks.

Also change [line 229](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:229) from “green across the board” to “every requested stored cell is green.”

### Moderate — announcement and quotation wording needs correction

- [Lines 52–54](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:52): August 31 is the announcement date. The repository existed August 20 and Neuronpedia migrated August 21.

  Exact fix: “On August 31 … announced the engine it had already moved into production…”

- [Line 75](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:75): if retained inside quotation marks, use the verified `“Over 40x”`, not `“Over 40×”`.

- [Lines 258–260](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:258): the research record gives the exact commit-message clause as `“interp-engine: Migrated inference, autointerp and graph services to new engine.”` The current quotation drops `interp-engine:`.

- [Lines 260–262](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:260): the January source said nnsight powered “several inference backends,” not unqualified “its backends.”

### Moderate — the mapper is not the only safe route

The section close at [lines 158–164](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:158) says a model-aware translator is “the only safe way across.” The project’s guide also says directly requesting the contribution point is safe when a model cannot be passed to the mapper.

Exact fix:

> A name is not a tensor. Use the model-aware mapper when possible; otherwise ask for the contribution point when consuming a block-level hook name.

### Moderate — the decision tests and final stop still need work

The Apple test at [lines 401–407](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:401) does not name its independent comparator, prompt count, precise layers, token-level floor, or generation length. Those details exist in `03`.

Exact condensed fix:

> Compare interp-engine eager against same-dtype plain-Transformers hooks on this Apple M5 at fp16, using at least eight prompts of 64, 512, and 2,048 tokens, every applicable point at layers 0, 13, 19, and 25, and 32-token greedy generation. A pass requires exact shapes, mean cosine ≥0.9999, max absolute error ≤0.002, no token below cosine 0.99, and identical greedy token IDs.

The actual decision paragraph at [lines 414–417](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:414) is a strong ending. The following series paragraph at [lines 419–423](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:419) violates the OSS Radar rule to make one decision and stop.

Exact fix: delete lines 419–423.

## Every checked number

Repeated values are grouped. This covers reader-facing facts, source-card facts, dates, versions, and proposed-test thresholds; SHA fragments, URL digits, table highlight indices, and the decorative `canvasSeed` are not evidence claims.

| Lines | Number or date | Verdict |
|---|---|---|
| 19, 23, 31, 36–42 | Issue `06`; publication `2026-09-02`; “September 2026” | Editorial/scheduled values; internally consistent |
| 42 | `17 min` | Pass: about 3,334 rendered words through the decision → `ceil(3334/200) = 17` |
| 24–25 | Description length `155` characters | Pass on length; validation scope still needs correction |
| 20 | `seoTitle` length `59` characters | Pass: within the requested ~40–60 range |
| 52 | August `31`, 2026 | Reported announcement date; change “released” to “announced” |
| 55, 430 | Apache `2.0` | Pass |
| 25, 56, 80, 224, 430–475 | `34` canonical points; `27` validator point types | Pass with qualification: 34 is a vocabulary union; engine/model coverage is not uniform |
| 186, 448 | `28` vLLM-served points; `6` unavailable | Pass |
| 224 | `7` excluded validator point types | Pass |
| 58, 71, 120 | `5e-4` maximum | **Fail:** raw maximum is `5.340576e-4`; use `5.3e-4` |
| 65–67, 119, 336 | Cosine `0.87` | Pass: rounded from `0.873663783` |
| 70–72 | `20` Gemma comparisons; `20` generated tokens | Pass |
| 75, 207, 436 | `“Over 40x”` | Exact launch quote only with lowercase `x`; announcement context remains network-unchecked |
| 75–76, 207–208 | `8` requests; `41×`; `6.9×` | Pass: `1238/30.1 = 41.13`; `214/30.9 = 6.93` |
| 79–80, 221–223 | Cosine `0.99`; relative error `0.5` | Pass as default loose-tier gates; checkpoint waivers qualify them |
| 80, 240–241, 466 | `35` rows; README `50+`; `31` verified architectures; `46` unaudited | Pass: 35 rows recounted locally |
| 83, 257–260, 502 | `3` services in `1` commit | Pass as externally reported: inference, autointerp, graph |
| 109–111, 442 | FVU `9.8` vs `0.26`; L0 `8` vs `85` | Pass, Reported from the hook-mapping guide |
| 118 | `2 → 1` | Qualified shorthand: two tensor meanings were collapsed under an “MLP output” translation, not one identical literal hook string |
| 147–153 | Layer `4` mapping examples | Pass as illustrative indices |
| 186–188 | `31.5` vs `30.9`; eight-request `226` vs `30.1` tok/s | Pass |
| 191, 496 | `16,384 → 1,024` batch-token window | Pass |
| 197 | `30.9 / 31.5 / 214 / 354` | Pass |
| 198 | `30.1 / 226 / 1,238 / 1,733` | Pass |
| 199 | `34.9 / 85.3 / 90.2 ms` | Pass |
| 200 | `32` tokens; `1,132 / 1,051 / 185 ms` | Pass |
| 201 | Top `10`; `3.3 / 202 / 202 / 205 ms` | Pass |
| 208 | Static loses `40%` of vanilla decode | Pass: `(354−214)/354 = 39.55%` |
| 195, 210, 490 | B200, bf16, engine `1.2.0`, vLLM `0.26.0`, August `19`, 2026 | Pass, Reported; body should use exact `0.26.0` |
| 210–211 | Audited engine `1.5.1`; vLLM floor `0.28.0` | Pass; body abbreviates the latter to `0.28` |
| 220 | `6` active validator paths; TransformerLens `2` and `3` | Pass with explicit unsupported/unasked cells |
| 221–223 | Raw-HF `0.002 / 0.9999`; failure cosine `0.5` | Numeric values pass; failure conditions are incomplete |
| 224 | Three-quarter sampling at `16+` layers | Number omitted from body; needed to qualify the sampling rule |
| 229–231, 478 | Gemma vLLM bf16 versus fp32; whole cosine `>0.997`; worst token `0.961` | Pass: minimum whole tensor `0.997493`, worst final-norm token `0.961009` |
| 231 | gpt2 fp32 and no stored differences | Pass, Reported |
| 232, 484 | DeepSeek layer `42`; cosine `0.235` hooked / `0.236` static | Pass; body’s “near 0.235” is acceptable |
| 233–234, 398 | Gemma-4 `12B`, `26B-A4B`, `31B` | Pass: first two warn; 31B passes |
| 241–243 | `2` sub-billion CI models; `1` L4 job | Pass, Code-inspected |
| 257–263, 502 | August `21`, 2026; `1,119` files | Pass, Reported; HTTP source not rechecked |
| 261 | January 2026 | Pass; wording should say “several inference backends” |
| 271, 514 | TransformerLens `3.8.1`, September `1`, 2026 | Pass, Reported |
| 272, 520 | nnsight `0.7.0` | Pass, Reported; release date in research is May 5, 2026 |
| 281–282 | `0` outside issues and `0` outside PRs | Reported absence as of September 1; time-sensitive and not rechecked |
| 285–287 | About `2` weeks; `31` commits since August 20; `13` Cursor trailers; `7` tags in `12` days | Counts pass; “one human author” remains an inference from two Johnny Lin identities |
| 289–290 | Transformers `5.14.1` vs `5.16.1` | Pass |
| 299 | TransformerLens `3.5.1` local run | Pass |
| 316–321 | `4` points × `5` layers; `1` 29-token prompt; `20` Gemma comparisons | Pass |
| 319 | `5.3e-4` | Pass |
| 325–330 | Matched `1.00000`; naive MLP `.874/.803/.895`; attention `.829/.712/.791`; gpt2 `1.00000` | Pass after conventional rounding |
| 339–340 | Naive max-absolute range `15–272`; matched `<0.001` | Pass: raw `15.1268–272.4521`; matched max `0.0005341` |
| 343–349 | `6` sentiment pairs; layers `13` and `6`; scale `4×`; logits `7.7e-5`; `20` identical tokens | Pass |
| 354–358 | `128 + 64` tokens; fp32; `1` warm-up; `3` timed runs | Pass |
| 364–366 | MPS rates `7.6/6.2/1.9` and `57.8/85.9/39.6` | Pass |
| 365 | Memory `11.1/12.4/17.0 GB` | Pass |
| 372–374 | `19%` slower; `3.3×` faster; `4.5 GB`; `24 GiB` | Pass |
| 390, 526 | Qwen3-4B on A40/B200; RTX 5090 eager only | Pass |
| 402–404 | Apple M5; fp16; `4` layers; `64/512/2,048`; `0.9999/0.002` | Proposed, not run; task specification remains incomplete |
| 404–407 | Qwen3-4B bf16; RTX 4090; `8,192`; `5×`; `20×`; `8` requests | Proposed, not run |
| 420–422 | Third issue; OSS Radar `#04/#05`; Bun `1.4` | Editorially checkable and internally valid; remove because the close must stop |
| 478 | `38`, `36`, `36`, `32` agreed Gemma cells | Pass against the committed result detail |

## Resolution of every numbered finding in `07`

| `07` finding | Current state |
|---|---|
| 1. Opening overstates TransformerLens and validation | **Partially resolved.** “Fair chance,” percentage similarity, SAE-noise claim, and “correctness holds” are gone. Metadata and lede still imply broader cross-engine coverage, and “first run outside their lab” is unsupported. |
| 2. Introduction mischaracterizes SAEs/evidence | **Partially resolved.** SAE definition and market claim were fixed; “nothing was reading that number” remains. |
| 3. Prefix-cache behavior and vLLM coverage | **Resolved.** Prefix caching is on with per-request salts; coverage is now 28 of 34. |
| 4. Read time and description | **Partially resolved.** `17 min` is correct. Description is now exactly 155 characters but still overstates validation scope. |
| 5. First-100-word structure | **Resolved structurally.** The first 100 words contain the project, date, job, numerical result, and hardware limit. Claim bounding still needs the fix above. |
| 6. Decision tests and close | **Partially resolved.** The prior replacement was applied and unsupported DFlash material removed, but the Apple comparator/test details remain incomplete and the series paragraph still follows the decision. |
| 7. False consumer-GPU source claim | **Resolved.** RTX 5090 eager is acknowledged; absence is limited to vLLM/static. |
| 8. Uniform six-engine validator coverage | **Resolved.** Unsupported and unasked cells are now explicit. |
| 9. Laptop throughput too kind/not comparable | **Resolved.** The post says 19%, gives the 3.3× result, and distinguishes capture strategies. |
| 10. Numerical renderings | **Resolved**, except the newly repeated `5e-4` maximum regression. The five numerical corrections named in `07` landed. |
| 11. TransformerLens quotation | **Resolved.** The exact attention comment is used and the MLP ordering is described separately. |
| 12. Launch-quote capitalization | **Mostly resolved.** Body and source card use exact capitalization; the bullet changes quoted `40x` to `40×`. |
| 13. Unsupported DFlash close | **Resolved.** Those claims are gone. |
| 14. Cursor involvement | **Resolved.** It now says “commits with Cursor co-author trailers.” |

## Rewritten-parts prose review

The chosen opening structure works. It starts with significance, presents six promises, and only then explains the background. The two background paragraphs explain the failure in human terms before the article enters the detailed tensor mapping. This should not be reverted to a specification-style lede.

The main opening weaknesses are evidence scope and density, not order. The first paragraph introduces `27/34`, TransformerLens, nnsight, cosine tolerance, and datacenter hardware before the plain-language explanation. Bounding the validation sentence and changing “released” to “announced” will make that density honest without changing the structure.

Delete [lines 93–96](/Users/goga/Documents/goga/blog/packages/blog/posts/022-oss-radar-06-interp-engine.ts:93). “Each of those claims is paid for below” announces the article and delays the background; the bullet list already establishes the contract.

The section discipline otherwise largely passes:

- “A wrong tensor…” states its point immediately; its final paragraph needs only the “only safe way” correction.
- “One address…” correctly signals the technical register; “only one is fast” and the final “correct anywhere and costs nothing” sentence need factual tightening.
- “What a green cell means” opens and closes on the validator’s meaning; remove the unsupported market comparison.
- “Whose layer is this” opens with the ownership question and closes on the durable-validator thesis; correct the migration quotation and January attribution.
- “What runs on my Mac” has the strongest first/last pair: personal stake first, concrete harness change last.
- “Who should use it” gives clear try/wait advice and a strong decision sentence. Delete the series paragraph so that decision remains the ending.

## URLs not checked

Per instruction, I used no browser or network.

Local content was verified at the pinned interp-engine clone, but HTTP reachability was not checked for every `https://github.com/decoderesearch/interp-engine/blob/7471609…` URL, including:

- `README.md`
- `docs/ENGINE_HOOK_MAPPINGS.md`
- `docs/SUPPORTED_POINTS.md`
- `validator/README.md`
- `validator/comparison/spec.py`
- Gemma, DeepSeek, benchmark, performance, GPU-sizing, selection, and gradient source paths

These external or mutable pages remain dependent on the supplied research records rather than a fresh network check:

- `https://www.neuronpedia.org`
- `https://www.neuronpedia.org/blog/interp-engine`
- `https://github.com/decoderesearch/interp-engine` — including current issues/PR state
- `https://github.com/hijohnnylin/neuronpedia/commit/17bc39171bf11c68bf5bf52013b11afe8e8b1f81`
- `https://github.com/hijohnnylin/neuronpedia/blob/17bc39171bf11c68bf5bf52013b11afe8e8b1f81/apps/inference/README.md`
- `https://pypi.org/project/transformer-lens/`
- `https://transformerlensorg.github.io/TransformerLens/content/migrating_to_v3.html`
- `https://github.com/ndif-team/nnsight/releases`
- `https://github.com/TransformerLensOrg/TransformerLens/blob/4ba2187b182faf964225c6eb9076c858cada0672/transformer_lens/components/transformer_block.py`
- `https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/interp-engine`

The two internal OSS Radar links resolve locally.

Model: `gpt-5.6-sol`  
Reasoning effort: high