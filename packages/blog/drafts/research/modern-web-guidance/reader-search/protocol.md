# Reader-style search and paragraph navigation checks

November 14, 2026. New engineering checks following the original frozen E5 comparison. Neither the original 32/27/33 count nor MWG's source/table/guide replay is changed. This phase tests finding a known article, locating a source block and actually navigating to it.

## Population and split

The corpus is the same 46 publication sources and eligible text as before. Direct live capture checks all 46 public article URLs and records failures without retry or replacement. Raw page bodies, source text, exact author queries and operational captures stay outside Git. Public cases are written here from source reading. One topic per article is expressed as a short topic and an article-location question, for 92 paired probes. Eight fixed framing templates isolate framing effects; four are not recognized by the normalizer. Twelve separately authored recollections omit project names and templates; ten further prompts have no known answer label. Total: 114. Report these forms separately. Some sources/topics/labels overlap earlier research. These are synthetic, source-aware engineering cases, not visitor logs, independent human judgments or proof of true absence.

Before ranking, freeze query text, selected block IDs, the deterministic article-group split and scripts. Fourteen articles (28 query forms) are development; 32 articles (64 forms) are reserved validation. Both forms of an intent stay together. Inspect development first; document any change before opening validation. A validation result is not permission to tune the validation cases and call them untouched. No score threshold is being trained as an answerability detector.

## Conditions

Reuse the exact local E5-small-v2 q8 encoder and its query/document prefixes, mean pooling, normalization, 384 dimensions and 480-token input cap. Compare the original 866 passage units with a new source-block index: one paragraph/list item/table/code block per unit with title/heading context; oversized blocks split without loss or overlap. Both use the same eligible body text. Record the new unit count, hashes, norms, build time and cache use.

For each index, evaluate raw query and optional removal of explicit article-location framing. Topic words and constraints, including negation, must remain; no generated synonyms, per-case substitutions or model-written answers. Record actual search text. Run BM25, E5 dense ranking and unchanged k=60 reciprocal rank fusion. Group the uncut rankings by article at the first (best) unit; do not reward an article for having many matching units. Keep every raw top-ten unit list and the top-five distinct articles.

Primary engineering metric: the selected article appears among the first three **distinct articles**. Also record first article and selected source block in the first ten units. These differ from the original passage-at-three metric. Labels are incomplete; retain useful alternatives separately. No-answer cases report returned matches and literal-term evidence, not calibrated refusal accuracy. Query forms share one underlying article/topic and are not independent samples.

## Navigation and product behavior

Offer an exact-paragraph link only when an actual source-text phrase uniquely occurs in the captured live article text; otherwise label a section/article fallback honestly. Text fragments use percent-encoded text and a heading fallback where available. A substring check establishes a target in the capture; selected real-browser navigation must separately verify scrolling/highlight. A changed page or unsupported browser can invalidate a text directive. Do not publish full text directives or raw paragraph dumps as public evidence.

The interface should return distinct articles and readable source paragraphs, retain access to keyword/semantic/hybrid modes and the full question, and identify literal topic terms absent from the index without claiming that no semantic answer can exist. Similarity is not confidence. Keep all searches local after model loading, and retain source/capture dates. No public search route or article release is implied.

Development may select query focus and index granularity. Acceptance requires inspecting every validation regression rather than reporting only gains, source coverage and real navigation checks, meaningful renderer/query/link tests, and the appropriate isolated build. Preserve the complete original experiment. New article prose must keep the seven-line MWG explanation central and identify these later E5 engineering checks separately.
