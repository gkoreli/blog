# Changes

## 0.2.0

- Added `@gkoreli/search/http`: one owned session for shared word/related corpus loading, lazy model creation, freshness checks, one retired-asset recovery and shutdown.
- E5 runtime packages are optional peers. Word-only installations omit Transformers.js and ONNX Runtime. E5 users explicitly install their adapter dependencies.
- E5 adapters return a managed encoder with `close()`. Inference is serialized, accepted calls drain before release, and tensors are disposed on success and failure.
- Source passages and their nested arrays are frozen on opening an index. Results cannot mutate indexed source through shared references.
- Paragraph word ranks use headings/body; article titles remain article discovery evidence. Word recovery prioritizes query-term coverage; related article lists are deduplicated before reciprocal-rank fusion.
- Article results include `totalPassages`; `passagesPerArticle` still defaults to three and accepts up to twenty. This is a larger display budget, not a different relevance cutoff.

The index remains format 2 and the HTTP manifest remains format 1. No corpus-format migration is required. v0.1 readers can still open the generated index; they retain v0.1 ranking and UI until reloaded. The workspace package remains private and has no npm release.

Ranking evidence is mixed: known development cases improved; two selected-paragraph confirmation cases regressed. See the [v0.2 record](../blog/drafts/research/modern-web-guidance/search-package-v02/README.md).

## 0.1.0

Initial article/passages domain, portable index, HTML anchor adapter, exact/tolerant words, optional related intent, E5 adapters and blog dogfood integration. [Original record](../blog/drafts/research/modern-web-guidance/search-package/README.md).
