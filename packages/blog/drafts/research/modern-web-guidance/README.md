# Modern Web Guidance: static embedding reproduction and interface study

November 13, 2026, America/Los_Angeles. **Static embedding reproduction and an article draft are complete.** The [draft](article.md) explains the learned table, warm versus full-search timing, public retrieval replay and behavior limits. The [reproduction record](embedding/README.md) preserves three processes, exact vector comparisons, fixed controls and full measurements. The draft remains outside the publication pipeline; no production trial patch was applied.

The earlier [interface study](study/report.md) remains separate: baseline and ordinary MWG availability passed 18/18 checked attempts each; directly supplied guides passed 16/18. Its first 54-attempt batch had a launcher defect and remains diagnostic evidence; a complete repaired 54-attempt batch supplies the primary result. [Primary artifact index](study/campaign-02/artifacts.md), [execution limits](study/campaign-02/execution-audit.json). The initial source review and small retrieval pilot below remain historical evidence.

## Editorial decision

The [current editorial decision](embedding/editorial.md) centers the standalone draft on how learned data makes the seven-line query calculation useful. The new reproduction contributes implementation equality, timing boundaries, package integrity and public retrieval ablations. The completed interface study supplies a distinct downstream check, with no observed pass-rate gain and a narrower code-simplification finding.

The launch itself is already covered by the [OSS Radar #14 entry](../../../posts/045-oss-radar-14-november-show-hn.md). The standalone draft explains the transferable architecture and its tested limits rather than repeating that announcement. [Claim dispositions](embedding/claims.md) separate reproduced results from inspected training code and untested historical comparisons.

## What the two announcements establish

- [First post, November 12](https://x.com/ChromiumDev/status/2120963302582898775): points to Paul Irish's [local search engineering report](https://developer.chrome.com/blog/mwg-technical-deep-dive). This concerns the engine used to find relevant implementation guides.
- [Second post, November 12](https://x.com/ChromiumDev/status/2121014221563396156): promotes version 1.0, its skills and scanner, and reports a historical GitHub trending position. That popularity statement is the author's report, not an independently verified adoption or effectiveness result.
- [Version 1.0 announcement, November 10](https://developer.chrome.com/blog/modern-web-guidance-v1): describes browser expertise, compatibility policies, accessibility review and a deliberately limited modernization scanner, with Chrome, Firefox and Edge participating.

Both posts were read in the in-app browser on November 13. Replies were not systematically sampled or analyzed. Direct web fetch of X failed before browser access succeeded. No private account observations are part of this record.

## Mechanism and claim boundaries

The runtime is a small retrieval system, not seven lines replacing an entire model or package. Guide chunks receive teacher-model embeddings during publication. Queries use a bundled, trained word-vector table: tokenize, accumulate weighted vectors, normalize. Dense ranking is combined with BM25 keyword ranking. Relevant guides are retrieved into the agent's context on demand.

The engineering report's **30 microseconds** measures warm query embedding. Its own table separately reports **185 milliseconds** for cold CLI search. Its footprint table also distinguishes **507 MB unpacked** from a **7.1 MB compressed tarball**; those numbers should not be presented as a like-for-like compression ratio. The broad reported quality increase spans chunking, ranking, result-count and embedding changes; it does not isolate the seven-line loop's causal contribution.

Inspected implementation baseline: [`596acbc75a330508591b07cd9e198b219341f619`](https://github.com/GoogleChrome/modern-web-guidance-src/tree/596acbc75a330508591b07cd9e198b219341f619). Relevant files:

- [`src/rag/static-embedder.ts`](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/static-embedder.ts): token encoding, weighted accumulation and normalization.
- [`src/rag/bm25.ts`](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/bm25.ts): tokenizer, stopwords and lexical ranking; `not` is a stopword.
- [`src/rag/search.ts`](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/search.ts): reciprocal rank fusion and the query-level admission gate.
- [`src/rag/README.md`](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/README.md) and [`benchmarks/README.md`](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/benchmarks/README.md): table training, guide embedding, evaluation populations and leakage controls. These are upstream methods and results, not independently reproduced training or benchmark claims.

A November 13 GitHub API check returned main at `3bb177a6de62b7fd8cd0432c33756e6f3c9ece9d`. Comparing these commits showed no changed `src/rag/` files; the current static embedder blob was also independently fetched and matched the local Git blob `cd3f892467057f4ec75ba34f652fa0d4875a430f`. Guide and scanner changes exist elsewhere. This preserves the pinned reproduction without describing its corpus as current main.

## Local pilot

The [eleven synthetic cases](repro/queries.json) were fixed before the first pilot search. Three broad web tasks have one designated target each; a fourth target query is explicitly seeded from the upstream article. The designated guides are diagnostic anchors, not exhaustive relevance judgments: the accordion query's top-ranked `accordion` guide may be useful even though its designated intrinsic-size guide ranks fifth.

The [fixture](repro/retrieval-pilot.mjs) ran the already downloaded **modern-web-guidance 1.0.0** CLI three times per case. It set `DISABLE_TELEMETRY=1` and disabled optional file logging. Environment: Apple M5, macOS arm64, Node 24.14.1. No skill installation, repository scan, model API or generated implementation was needed. Network egress was not instrumented.

The [final structured results](results.json) record every query, returned ID sequence, repetition timing, package hash, source commit and matching source/package query-table hashes.

| Diagnostic | Result | Supports and limits |
| --- | --- | --- |
| Three selected in-domain queries | Designated guides at ranks 4, 5 and 1 | These target guides are discoverable in this small artificial set; no population accuracy estimate |
| Upstream destructive-action example | `dialog` at rank 2 | The historical empty-result example no longer returns empty at this package baseline; exact top rank differs from the report's example |
| Four unrelated queries: Postgres, Python, Kubernetes, pizza | Each returned ten web guides | Admission does not reliably mean the query is in scope; no representative false-positive rate or downstream misuse claim |
| Unknown-token control | Empty result | Not every string receives guides |
| `animate dialog` versus `not animate dialog` | Exactly identical vectors and ordered IDs | This tokenizer removes `not`; guide search cannot distinguish this pair. The consuming agent still sees the original task and may handle it correctly |
| Repetition | Identical ordered IDs across three calls for all eleven cases | Repeatability under this frozen package and inputs |

Final-run warm source `embedSync` timing was about **12 microseconds/query**, measured across 30 batches of 1,000 queries after a 1,000-query warmup. CLI per-query medians ranged **199–312 ms**, with a median of those medians of **225 ms**. A preliminary run produced roughly 7 microseconds and 166 ms respectively. These are two local diagnostics under uncontrolled machine load, not stable comparative speed estimates. Table loading, ranking, process startup and output handling are outside the warm embedding measurement. The final fixture verifies that its source word tables match the packaged tables before measuring.

Reproduce with Node 24 and an existing package/source snapshot:

```sh
node repro/retrieval-pilot.mjs \
  /absolute/path/to/modern-web-guidance-package \
  /absolute/path/to/modern-web-guidance-src \
  /absolute/path/to/new-result.json
```

The fixture imports unchanged source modules for the embedding measurement and invokes the packaged CLI for search. It does not recreate training, replay the full upstream benchmark, or validate behavior in a browser. The source and package identities are checked/reported separately. Artificial queries and source-aware target selection are consequential limits.

## Initial experiment proposal — superseded by the completed study

Use six small, owned interface tasks: a confirmation dialog, an expanding panel, a navigation menu, inline form errors, reliable visit-end analytics and a reduced-motion interaction. Define functional behavior and explicit browser targets before execution. Include at least one intentional compatibility fallback and one task where no modernization is needed.

Run the same tasks in isolated fresh contexts under three conditions:

1. Existing project instructions without MWG.
2. MWG available normally, with no prompt telling the agent which guide to use.
3. The relevant guide supplied directly, to separate discovery failure from implementation failure.

Freeze one agent/model configuration, tool access, time/token caps, task snapshots and grader version. Three repetitions per task and condition would be **54 runs**. This is a proposed study size, not executed work or a spend commitment. Randomize run order. Keep trials in isolated fixtures and avoid changing the production blog.

Primary outcomes: completed task behavior, keyboard/focus semantics, browser compatibility and regressions. Also record whether the skill activated, which guides were used, browser verification, patch size, added dependencies, elapsed time and uncached tokens where actually exposed. Count crashes and timeouts in the task denominator and report them separately, rather than dropping incomplete pairs. Blind the human artifact review to condition where possible. Automated accessibility checks cover selected mechanics; they do not establish full accessibility compliance.

Test alternative explanations: the model already knows the task; added guidance helps only when explicitly supplied; the grader favors one implementation; a modern API violates the stated browser target; irrelevant retrieval costs attention without changing the outcome. Publish neutral or negative results with the same task boundaries.

An optional later retrieval study should compare BM25-only, dense-only and hybrid ranking at fixed K and corpus, with separately labeled short, long, API-name, negated and unrelated queries. Fresh user-authored tasks should stay outside training/tuning. Retain individual results and label uncertainty; this pilot is not that benchmark.

## Acceptance and handoff

The pilot ran twice; the final repeat added source/package table-identity checks and conventional even-sample median calculation. Ordered retrieval outcomes agreed. Source links, local links, result invariants, fixture syntax and scoped public diff were checked. Raw author messages are preserved only in the approved private archive. Existing [scanner trials](../oss-radar-14-november-show-hn/04-local-trials.md#modern-web-guidance) retain their original November 11 scope.

The executed interface study and its two campaign boundaries supersede this initial next-step proposal. The later static-embedding reproduction and public replay are documented separately above; they do not claim completion of the optional novel-query, independently labeled retrieval study. Next bounded action: author review of the [article draft](article.md) and [new reproduction evidence](embedding/README.md). No further experiment or publication is automatically scheduled.
