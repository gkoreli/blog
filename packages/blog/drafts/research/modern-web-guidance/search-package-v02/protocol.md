# Search package v0.2

This is a new iteration after [v0.1](../search-package/README.md), not a replacement for its measurements. [Accepted work](../../../../../../docs/worklist/blog-search/v0.2.md).

## Frozen comparison plan

Compare v0.1 with four bounded alternatives: remove repeated article-title evidence from lexical paragraph selection; fuse distinct article ranks rather than packed-unit ranks; order word recovery by matched query-term coverage before score; and combine those three policies. Keep MiniSearch 7.2.0, E5 revision, source text, candidate packing, float32 vectors, query preparation, RRF constant 60, five displayed articles and three excerpts per article fixed. These policies are development hypotheses, not promised improvements. Do not tune weights or query-specific synonyms after observing results.

The old 51 cases are known development/regression cases. For selection, maximize the sum of word and related joint article-at-three/selected-passage hits on their 45 positive forms; break ties by summed article-at-three, then fewer policy changes. Publish individual regressions. Returning an article for a negative is not an answerability success. No similarity threshold or calibrated abstention is introduced.

Before any new comparison rankings, freeze ten additional topics with two agent-authored question forms each and four no-known-answer prompts. Select source passages from ten articles not targeted by the old positive set. Labels are question-specific source-aware selections, not exhaustive relevance judgments. Prior corpus familiarity remains; these are confirmation cases, not independent reader validation. Select the policy using only the known set, save that decision, then execute the confirmation set once. Retain failures and do not relabel after rankings.

The larger passage budget in the new reader interaction is a separate product feature. Relevance counts continue to use three excerpts per article. Model warm-up and timings are execution observations, not an end-user latency guarantee. Current production and browser results need dated, separate receipts.
