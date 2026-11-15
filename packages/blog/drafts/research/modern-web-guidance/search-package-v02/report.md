# Search v0.2: deeper ownership, mixed relevance

November 14–15, 2026. v0.2 improves package ownership and passage inspection. Its selected ranking policy improved the known cases and lost one selected paragraph in each mode on the newly frozen confirmation forms. That does not establish general relevance superiority. The [protocol](protocol.md), [input freeze](input-freeze.json), [selection](selection.json) and complete rankings are retained. The [v0.1 evidence](../search-package/README.md) is unchanged.

## What changed

The article aggregate owns ordered source passages and immutable identity. The portable engine owns query interpretation, ranking, grouping and source excerpts. An HTTP adapter now owns shared corpus loading, freshness, one recovery after retired data assets, lazy model creation and shutdown. The blog worker retains newest-query scheduling and UI events. Words and Related share one opened engine rather than opening a second pair of lexical indexes. This is an ownership/code-path observation, not a measured heap reduction.

The Node/browser E5 adapters return a managed encoder. Accepted calls serialize and drain before idempotent release. Intermediate tensors use failure-safe cleanup. The package borrows caller-supplied encoders; the HTTP session owns the models it creates. Failed creation can retry; content refresh preserves compatible models; a changed model configuration retires old resources after in-flight searches complete. Focused fixtures exercise those boundaries, including an interrupted close, failed inference, failed creation, offline refresh, changed model configuration, corpus retirement and persistent failure.

E5 packages became optional peers. A clean local-tarball consumer under pnpm 9.15.4 installed four packages: this package, MiniSearch 7.2.0, parse5 8.1.1 and entities 9.0.0. Word search and HTML extraction executed successfully, with no Transformers.js, ONNX Runtime or Sharp package installed. [Receipt](consumer-check.json). This is an installation boundary; no npm release occurred and browser model size is not reduced. E5 consumers explicitly declare the pinned peers. Index format 2 and manifest format 1 remain compatible with v0.1 readers; the result DTO adds `totalPassages`.

## Same-input ranking comparison

The fixed input was the then-current public index, SHA-256 `11dc9dcd0ddefd510f8446f550173438a5e0dfbc7308d97107eb6d864fc0dfe9`, with 46 articles and 3,954 passages. One matching float32 vector file was used in every condition. Node 24.14.1, Apple M5/macOS, pinned E5-small-v2 revision `02af79985278377e65c724a76275707cb0333c70`, q8 CPU adapter, 384 dimensions, complete inputs, original query preparation and RRF constant 60 stayed fixed. The v0.1 runtime was copied before implementation; research variants changed only the internal policy constant in isolated copies of the new compiled package. No model retraining or new embedding space was involved.

Three hypotheses were declared before ranking:

1. Select lexical paragraphs using heading/body evidence, keeping article-title evidence for article discovery.
2. Deduplicate each related-mode candidate list to article ranks before fusion.
3. Let bounded spelling/prefix recovery with greater query-term coverage precede weak partial exact hits; within equal coverage, prefer exact evidence and then score.

MiniSearch exposes original matched query terms separately from expanded document terms in its [result contract](https://lucaong.github.io/minisearch/types/MiniSearch.SearchResult.html). The recovery policy uses that information rather than matching displayed snippets. [Reciprocal rank fusion](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) combines rank positions; deduplicating before article fusion makes the ranked object explicit. The model adapter's release boundary uses [ONNX Runtime's session release API](https://onnxruntime.ai/docs/api/js/interfaces/InferenceSession.html#release), checked against the pinned installed types. These sources explain mechanisms; the local measurements determine this product's outcomes.

The old 51 cases were all known: 45 positive forms over fifteen topics, six negatives. They cannot become a new holdout. The selection rule maximized summed Words/Related joint hits, then article hits, then fewer changes. Five conditions ran; no per-case tuning followed.

| Known positives (45 forms) | Words article@3 | Words joint | Related article@3 | Related joint |
| --- | ---: | ---: | ---: | ---: |
| v0.1 | 43 | 31 | 42 | 35 |
| Paragraph heading/body only | 43 | 34 | 42 | 35 |
| Distinct-article fusion only | 43 | 31 | 43 | 36 |
| Recovery coverage only | 44 | 33 | 42 | 35 |
| Combined, selected | 44 | 36 | 43 | 36 |

“Joint” requires the selected article among the first three distinct articles and a selected source passage among that article's first three excerpts. It is not recall over all relevant text. The combined policy gained Words cases S02-recollection, S07-typo, S10-recollection, S10-typo and S12-typo, plus Related S09-recollection, with no joint regressions on this known set. [Every development rank](results-development.json).

The additional pack froze ten topics from ten other articles, two positive forms each, and four no-known-answer prompts, before these rankings. Questions and selected source paragraphs are agent-authored and source-aware; prior corpus familiarity remains. Labels are incomplete, paired forms are correlated, and there are no independent visitor judgments. The policy was selected and saved before opening this pack once.

| Confirmation positives (20 forms) | Words article@3 | Words joint | Related article@3 | Related joint |
| --- | ---: | ---: | ---: | ---: |
| v0.1 | 19 | 16 | 20 | 18 |
| Selected combined policy | 20 | 15 | 20 | 17 |

Words lost V05-question's selected explanation of ghx multi-file GraphQL batching; Related lost V10-question's selected explanation that evaluation did not create a usage habit. Neighboring material remained useful, but neither selected miss was relabeled. More passages and context are inspection tools, not grounds to recalculate the three-excerpt score. Both modes returned articles for all six old negatives and all four new negatives. No threshold, refusal guarantee, significance claim or population accuracy is inferred. [Every confirmation rank](results-confirmation.json).

We retain the fixed combined policy for its explicit evidence boundaries and known-case corrections, with the confirmation regressions documented. It is a product tradeoff, not a benchmark victory. The original corpus, model identity, labels and selection rule remain fixed in the comparison. The protocol's later navigation/link correction has [original/current hashes and exact reconstruction](protocol-amendment-01.json); no experimental condition changed.

## Actual package and browser acceptance

Publication policy extended omissions for identified author source-note blocks in two additional articles. The integrated index therefore differs from the fixed comparison: **46 articles, 3,946 passages, 4,827 vector rows**. Raw index size is **5,716,902 bytes**, vectors **7,414,272**, and additional related model/runtime/vector assets **53,294,664**. All 3,946 indexed destinations appeared exactly once in their built article HTML; every selected label target remained present. Local index SHA-256 is `d228114a06e0bcceac2a6c5c4d8e6a42d3edc7b0ae6267268372026b570168ff`.

The [acceptance runner](acceptance.mjs) checked the actual built HTML and replayed all 75 previously observed cases. A local-only page also sent the same cases through the **actual bundled blog search worker** in the in-app WebKit browser, including its self-hosted WASM E5 adapter. [Normalized acceptance](acceptance.json) retains all ranks, index identity, raw receipt hashes and recomputed counts.

| Integrated corpus | Words article@3 | Words joint | Related article@3 | Related joint |
| --- | ---: | ---: | ---: | ---: |
| Old 45 positive forms, Node and browser | 43 | 35 | 43 | 36 |
| New 20 positive forms, Node and browser | 20 | 15 | 20 | 17 |

All ten negatives again returned articles in both modes. Aggregate counts agree; **134 of 150 complete per-mode rankings** are identical between Node and browser. Different runtime inference is involved, but this run did not isolate the cause of each ordering difference. Do not call the rankings numerically identical. The integrated Words S10-recollection article dropped outside three after the source omissions changed the lexical corpus; this explains the difference from the fixed-corpus 44/36 count. It is retained as a miss.

The first local browser attempts failed because the fixture served ONNX's `.mjs` runtime as `application/octet-stream`. Temporary diagnostics were confined to the isolated checkout, the server MIME mapping was fixed, and the shipping worker was restored before successful replay. The first summary also omitted N-prefixed old negatives when grouping by S; normalization now counts all 75 rows. Raw attempts remain outside Git. The initial sandboxed build stopped at tsx's IPC socket; the isolated permitted build passed. None of those incomplete attempts is counted as acceptance.

## Reader interaction

Article results expose `totalPassages`. “More passages” scopes the existing query and expands the displayed budget from three to eight, then thirteen, eighteen and twenty. It retains the ranking prefix, focuses the first newly displayed link and leaves refinement available at the cap. There is no second relevance cutoff hidden in the benchmark.

Manual browser checks opened a ghx selected explanation in fourth place through expansion and Enter, with its real article target highlighted. The Moving Icons/Svelte query exposed the actual library explanation. Cmd+K opened the native dialog; Escape now closes immediately even with a nonempty search input, retains the query and returns focus. A 390px embedded layout fixture exposed an overflowing expansion label and the native dialog's default max-width; both were repaired and remeasured. The browser viewport override did not affect the existing tabs, so this is a CSS viewport fixture, not a physical-phone or touch-keyboard trial. No new claim of complete keyboard/accessibility coverage is made; v0.1's host Tab-navigation limitation remains recorded.

Thirty package tests, 460 blog tests, workspace typechecks, content validation and isolated full builds passed during implementation. Source delivery, automatic activation and current production acceptance are recorded separately in the [delivery record](../../../../../../docs/worklist/blog-search/delivery-v0.2.md). Browser warm-up, payload size and functional checks are not a latency SLO or a low-memory device profile.

## Next questions, not accepted claims

Independent reader tasks, multilingual preparation, calibrated no-answer decisions, low-memory device cost, compact/sharded indexes and smaller compatible models remain proposals. The [manuscript](../article.md) keeps MWG's released-weight reproduction separate from all E5 product work. The matching Gemini/MWG full-blog document index is still unbuilt. No article publication or npm release occurred in this iteration.
