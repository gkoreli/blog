# Development selection before validation

November 14, 2026. The initial [freeze](input-freeze.json) and all 36 development rows remain unchanged. No validation result has been opened. Development contains 14 short topics, 14 framed questions, four separately authored recollections and four no-known-answer probes.

The finer source-block index did not improve article discovery consistently. Original-passage hybrid found the selected article among the first three distinct articles for all 14 topics and all 14 framed questions. Source-block hybrid reached 13/14 topics; its focused variant also reached 13/14 framed questions. Original-passage hybrid placed 13/14 first in both forms; source-block variants did not improve that. All four recollections reached their selected article first across the compared variants.

The selected product architecture therefore retains the original passage index for article candidates, and uses the finer index only to choose up to three distinct source blocks **within each candidate article**. The paragraph stage cannot add or reorder articles. This is an engineering constraint, not a new measured article-relevance gain. Known-block display is a separate, incomplete-label check; displaying three paragraphs is a different text budget from displaying three packed passages.

Optional focus removes recognized article-location framing and keeps the original question available. Development did not show a hybrid article-at-three gain from focus; the initial exploratory failure and the explicit, reversible topic control motivate retaining it for the reader trial. Four framing templates remain unrecognized and unchanged. No model-written query expansion or answerability threshold is introduced.

The new hierarchy code and evaluator are committed before running either hierarchy development or reserved validation. Validation will retain the original 12-condition matrix plus raw/focused hierarchical results, and inspect losses rather than tuning their labels or excluding them. No changes are made to the original 44-query comparison or either encoder.
