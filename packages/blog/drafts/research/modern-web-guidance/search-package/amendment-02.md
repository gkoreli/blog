# Product selection before reserved checks

November 14, 2026. The initial, native Pagefind and reranking development runs completed. Reserved validation remains unopened. Keep all conditions and rows; do not rewrite the initial freeze.

## Chosen direction

Use **MiniSearch exact lexical ranking as the fast word-search path**, retaining prefix/fuzzy recovery without allowing those expanded matches to replace an existing exact-ranked result. Use **E5 plus exact MiniSearch, k=60 fusion**, for an explicit related-search path. Article discovery and selection of source paragraphs remain separate operations, with native, stable paragraph anchors. The package should keep parsing, model inference, asset transport and UI outside its search domain, and expose a small typed build/search interface. The integrated package still needs its own source/label mapping and end-to-end checks; these prototype counts are not automatically assigned to new code.

Development evidence informing that choice:

- Exact MiniSearch selected the article among the first three for 10/10 short topics, 9/10 recollections and 10/10 typo cases. Its selected-block joint counts were 10, 8 and 7. Tolerance did not gain article-at-three cases and lost a selected-block recollection hit. Keeping expanded lexical matches as recovery preserves the measured exact list; the new recovery behavior still needs package tests.
- E5 plus exact MiniSearch selected the article for 10/10 topics, 10/10 recollections and 9/10 typos, with selected-block joint counts 10, 9 and 8. It corrected the tolerant hybrid's OpenClaw article regression. This supports a related-search option; it does not make semantic ranking a universal default or establish reader accuracy.
- The cross-encoder placed the selected article first in all 30 answerable development cases. Its selected-block joint counts were 10/10 topics, 7/10 recollections and 6/10 typos. Source review found useful alternatives for several misses, but it also returned generic evaluation material instead of the requested executable-discovery explanation. Every target was present in its relevant candidate pool for these misses. No labels are replaced.
- Reranking the two candidate pools took a median about 820 ms across this one development run, excluding model initialization; machine load was uncontrolled. Its five additional files total about 23.86 MB. This prototype measurement is not browser latency or a universal model verdict. Do not ship that extra model as the default on the evidence available. Keep the executed comparison and source review.
- Native whole-page Pagefind selected the article for 9/10 topics, 1/10 recollections and 7/10 typos; its custom-record counts were 7, 0 and 7. Native sections receive separate reporting, with no invented equivalence to three full source-block excerpts. This is a specific English, source-aware question set, not a conclusion that Pagefind is generally unsuitable for static sites.

## Serving and product costs

Word search should work immediately, without loading a transformer. Related search must make its first-use download cost clear and leave word search usable. Both paths return source text and links rather than a generated answer. Similarity is not confidence; no answerability threshold was trained. A remembered emoji project remains unverified even if a related icon passage is retrieved.

Cloudflare's [current static-asset limit](https://developers.cloudflare.com/workers/platform/limits/#static-assets) is 25 MiB per file. The E5 quantized ONNX file exceeds it. Hosting or transport must respect that limit, without pretending that splitting a download reduces total model size. Inference should stay out of the Cloudflare Worker; a browser adapter and optional compatible provider keep that cost outside the portable lexical domain. The final transport, payload and browser behavior require actual verification before acceptance.

Use Cmd/Ctrl+K and a normal search link/page, native dialog behavior, Escape/focus return and editable-field protection. Search URLs can reach operational request logs; do not promise that a native GET query never reaches the server. Interactive local search should not send typed queries to a third-party search or embedding API.

## Reserved boundary

Run the same frozen initial eight conditions and amendment-01 additions on the 18 reserved cases. Do not tune weights, labels or query-specific rules from their outcomes. Report any product change after inspection explicitly. The new package's parser, anchors, corpus exclusions, serialization, model compatibility and actual UI are engineering work requiring separate acceptance; they are not covered by selecting an existing ranker.
