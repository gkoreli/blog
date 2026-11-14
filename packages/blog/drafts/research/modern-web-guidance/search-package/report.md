# Comparing search approaches for this publication

November 14, 2026. This comparison informed the reusable package; it does not compare MWG's learned table with E5. The matching MWG/Gemini blog index remains unbuilt.

## Conditions and selection

The [initial freeze](input-freeze.json) fixes the unchanged 46-article snapshot `19d8f897`, 866 packed passages, 3,980 finer units, original E5 vectors, engine versions, code and 51 agent-authored cases. Fifteen topics each have three correlated forms; six additional cases have no known answer. Ten article groups supplied development cases (30 answerable, three negative), and five supplied reserved checks (15 answerable, three negative). Source reading and earlier retrieval results influenced topic and label construction. These are source-aware checks, not independent reader accuracy or representative traffic.

The [first amendment](amendment-01.md), committed before its blog queries, added native whole-page Pagefind, exact MiniSearch/E5 fusion and a pinned cross-encoder. The [product choice](amendment-02.md) was committed before reserved output was opened: exact word search with non-preempting prefix/fuzzy recovery, and optional E5/exact-MiniSearch related search. No weights, labels or per-question rules were retuned from the reserved outcomes.

MiniSearch 7.2.0 uses BM25+, fields weighted 3/2/1, OR matching; its tolerant condition allows bounded fuzzy/final-term prefix matches. Pagefind 1.6.0 uses default English ranking, with raw and prepared queries. Controlled records share content granularity; a separate native index uses 46 retained rendered article bodies and Pagefind heading sections. E5 remains the original pinned q8 model and Transformers.js 3.8.1 recipe. The cross-encoder reranks the union of the first 20 lexical and 20 dense candidates per index. Exact options, pins, locks and hashes are in the protocol and amendments.

## Results, without replacing missed labels

Article means the selected article appears among the first three distinct results. Passage means that article also shows a selected source block among its three excerpts. A useful alternative can still miss the selected label. The complete normalized [rows and summaries](results/summary.json) retain every condition, including negatives, top candidates, source IDs and raw-receipt hashes.

| Method | Development article / 30 | Development article + passage / 30 | Reserved article / 15 | Reserved article + passage / 15 |
| --- | ---: | ---: | ---: | ---: |
| Original BM25 | 29 | 24 | 14 | 8 |
| E5 alone | 29 | 24 | 13 | 9 |
| Original E5 + BM25 | 28 | 25 | 14 | 10 |
| MiniSearch exact | 29 | 25 | 14 | 7 |
| MiniSearch tolerant | 29 | 24 | 15 | 9 |
| E5 + tolerant MiniSearch | 28 | 26 | 15 | 11 |
| E5 + exact MiniSearch | 29 | 27 | 14 | 10 |
| Retrieve + cross-encoder rerank | 30 | 23 | 15 | 9 |
| Pagefind custom records, raw | 14 | 9 | 9 | 5 |
| Pagefind custom records, prepared | 14 | 9 | 9 | 5 |
| Native whole-page Pagefind, raw | 17 | Not comparable | 9 | Not comparable |
| Native whole-page Pagefind, prepared | 17 | Not comparable | 9 | Not comparable |

Native Pagefind returns heading-linked excerpt sections, so no invented three-full-source-block score is assigned to it. Its development article counts by topic/recollection/typo were 9/1/7 out of ten each; reserved counts were 4/0/5 out of five. Long conversational recollections were difficult under these native query semantics. This does not establish that Pagefind is generally a poor static-site search engine. Its zero results on the negative cases are likewise not proof of a semantic no-answer detector.

The chosen exact-MiniSearch/E5 hybrid's reserved article counts were 4/5, 5/5 and 5/5 by form; joint passage counts were 4/5, 3/5 and 3/5. The tolerant hybrid did better on this reserved set. That does not retroactively make it the preselected winner. All non-Pagefind conditions returned results on all six no-known-answer cases. No calibrated refusal threshold was trained.

## Source review of chosen-path misses

The development audit in [the product decision](amendment-02.md) retained exact/tolerant differences and the cross-encoder's executable-discovery miss. All seven cross-encoder development passage targets were present in its candidate pools: these were ranking/selection outcomes, not missing corpus candidates. Several returned passages were useful alternatives; no labels were replaced.

Reserved chosen-path misses were read against the frozen source:

| Case | What the output actually supplied |
| --- | --- |
| S05 recollection, exact words | Qwenputer coordination/provenance and the explanation that the processor weights are written, rather than the selected no-optimizer construction paragraph. Relevant alternative, less direct. |
| S05 typo, both chosen paths | The short compiler/no-training introduction answers the central point; the selected construction paragraph was absent. Retained as a label miss. |
| S07 recollection, both paths | Word search emphasized payload/serializer details. Related search exposed CPU-per-response and memory-versus-energy limits, without the selected 58%/54% comparison. The exact requested measurements were missing. |
| S07 typo, words | The concluding memory/serializer lesson and bytecode/startup discussion, without the selected comparison paragraph. |
| S08 topic, both paths | The selected signed-client article was absent from the first five. This is an article-discovery failure. |
| S08 recollection, both paths | Other passages explain identity versus readership and unknown triggers. Useful alternatives, without the selected signed-crawler paragraph. |
| S14 typo, both paths | Related sleep, exciting-work and priority passages, without the preselected explanation. Source labels remain incomplete. |
| S15 typo, words | Buzz billing/Nostr possibilities instead of the MeshLLM sharing mechanism. This misses the requested detail. The chosen related path showed the target. |

The cross-encoder's reserved failures similarly include useful Qwenputer alternatives and missing Bun/procrastination detail. Its article improvements did not establish better paragraph selection: joint counts were nine versus the preselected hybrid's ten on the reserved positives. It stays an executed comparison, not the shipped default.

## Costs and execution boundaries

The cross-encoder's five files total 23,857,086 bytes in addition to E5. Its two candidate-pool reranks had a median about 820 ms in one uncontrolled native development run, excluding initialization. Those figures do not describe browser latency or a universal reranker result. Its weights were used locally for research, not redistributed.

The record-level Pagefind builds took about 0.50 and 1.82 seconds and wrote 1,773,095 and 2,819,039 bytes respectively, including unused UI assets. Native whole-page build and asset hashes have their own receipt. These all-output totals are not measured network transfers. Two preparation failures occurred before successful blog indexing: a callback argument error and an import-only package-resolution error. Their logs and failed empty output remain retained locally. All six completed evaluation runs have their own start/completion receipts; no ranking run failed or was replaced.

One audit correction matters for old native timing descriptions: the retained original E5 loader passes snake-case session-option names, while the inspected Transformers.js backend forwards options to ONNX Runtime's camel-case API. Its nominal 2/1 thread settings were not verified as applied. The new package uses typed `intraOpNumThreads`/`interOpNumThreads`. Preserve historical timings as observed runs, not a controlled thread-count comparison.

[DocSearch source](https://github.com/algolia/docsearch/tree/d715ca1f9ff107ca30b16937a86cbb9a1d740db4) informed keyboard conventions, hierarchy and focus behavior. Its client calls Algolia. No hosted Algolia account/index ranking trial, crawler-quality trial, commercial SLO or industry-wide winner is claimed.

## Package acceptance is separate

The integrated package uses current rendered content, stable native anchors, different internal packing/tokenization and a publication omission policy. Its initial build contains 46 articles and 3,954 source passages. [The label bridge](package-labels.json) maps all 63 selected-block occurrences into that corpus using equality or containment of whitespace-compacted source text before the 51-case package rankings. The source snapshot has changed since the original controls. Package rows, browser differences and delivered behavior need separate reporting; the prototype counts above are not automatically assigned to this implementation.
