# Controlled comparator protocol

November 14, 2026. New comparison; no historical result or label is changed. The accepted package work is in the [worklist](../../../../../../docs/worklist/blog-search/README.md).

## Questions and selection

The new pack has 15 source topics, each in a compact, vague-recollection and single-typo form, plus six prompts with no known answer: 51 cases. Selected answer blocks address those questions rather than inheriting an unrelated article topic. Labels remain incomplete and source-aware; both topic selection and alternatives are influenced by previous source/retrieval inspection. Do not call these independent human judgments, visitor queries or unseen reader accuracy. The three related forms are correlated. The six negative labels do not prove semantic absence.

Select ten development and five reserved article groups by the fixed SHA256 rule in `prepare-cases.mjs`. Keep all forms of a topic together. Inspect development first. Any method/configuration change after that needs a dated amendment before validation. Never call a selection based on validation untouched. Prior 114-case results remain regression evidence; their reserved rows are already known and cannot serve as a new holdout.

## Common controlled inputs

Reuse the unchanged 46-article source snapshot, 866 packed passages and 3,980 source-block units, with their saved vectors. Source body text, title and heading context are available to every method. No inferred synonyms or hand-authored per-query rewrites. Keep both indexes: the best passage selects each distinct article; the best three distinct source blocks inside each candidate provide excerpts. All methods receive the same eligible body content. Engine-native tokenization, stemming, field weighting and query semantics differ and must be stated rather than described as identical algorithms.

Freeze source/vector hashes, the pack, code, method options and install locks before any blog comparator query. Non-blog, two-record fixtures only establish adapter operation. No training, graded relevance-score calibration or no-answer threshold is planned.

## Conditions fixed before development

- Existing BM25, dense E5 and their k=60 rank fusion: unchanged original implementations and query text. E5 retains the original pinned model, q8 CPU runtime, prefixes, pooling, normalization and token ceiling. New library releases are not silently substituted.
- MiniSearch 7.2.0, exact and tolerant variants. Fields are title, heading and body, with fixed boosts 3, 2 and 1. The OR combination permits partial lexical overlap. The tolerant variant permits a one-edit/20%-length fuzzy match for terms of at least five characters and a prefix on the final term of at least three characters. Keep its native BM25+ parameters. Record actual matches and query preprocessing.
- Pagefind 1.6.0, native default ranking over custom records, with English processing and the same unit text/title metadata. Run the raw question and a separately labeled prepared-keyword variant. Keep native query semantics and title metadata weighting. This controlled record comparison is not its whole-page crawler or native heading-section product.
- E5 plus tolerant MiniSearch via the same k=60 reciprocal rank fusion. Candidate/article/excerpt grouping stays common. It is an additional declared hybrid, not the original historical E5+BM25 result.

Prepared lexical queries remove only recognized article-location framing, then a fixed list of common function words. Preserve topic/category words, numbers and negation. Semantic queries retain the whole original question. Record the exact submitted text for every condition. Short topics, recollections and typos are reported separately.

## Outcomes, cost and audit

Primary: selected article among the first three distinct articles. Also report first article, selected block among three excerpts inside that article, and their joint outcome. Keep five article candidates and complete top-ten unit ranks/scores for every condition. Retain full-ranking digests and hashes of raw receipts; keep full body dumps outside Git. Review every development/validation regression in the chosen product path, and useful unlabeled alternatives, without replacing labels.

Record index build time, retained bytes and relevant initialization/query boundaries. Pagefind's generated WASM engine is queried in Node with a confined local-file fetch adapter; MiniSearch is JavaScript; E5 encoding is local native CPU. These are not browser-network timing comparisons or measurements of MWG's microsecond loop. A later browser/deployment trial must validate the actual integrated path independently.

No hosted Algolia relevance trial is implied by inspecting DocSearch. Likewise, code inspection of reranking or hosted search documentation supplies no measured comparator result. If remaining failures justify a reranker experiment, define a new pinned candidate pool/configuration and amendment before running it.

Product choices may trade relevance, startup, payload, privacy, static hosting and maintenance. Do not describe the eventual choice as universally best. Preserve failures, incomplete judgments, unsupported topics, index/version boundaries and costs in the dedicated article section.
