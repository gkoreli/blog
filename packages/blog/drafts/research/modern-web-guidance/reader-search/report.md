# Finding an article is not the same as finding its paragraph

November 14, 2026. This is a later engineering investigation using the matched local **E5-small-v2** index, following the [original passage comparison](../passage-search/report.md). It does not use Modern Web Guidance's seven-line encoder. The original MWG calculation, guide replay and E5 32/27/33 result remain unchanged.

The working prototype can take a remembered description, retrieve distinct articles, display source excerpts and link into matching live text. It still misses relevant details and returns suggestions when no answer is known. The literal emoji topic had no verified article answer; animated icon libraries are a plausible related interpretation, not proof of the remembered project.

## What was actually covered

A direct, no-cache-request fetch of the public `posts.json` returned 46 articles on November 14 at 19:17 UTC. Its slug set matched the source snapshot. All 46 article pages then returned HTTP 200, with no retry or replacement. Response hashes, cache headers, dates and status are retained in [live coverage](live-coverage.json). Some responses were CDN cache hits; this records delivered HTML, not an uncached-origin or visitor-usage claim. An older web-search cache was rejected as current evidence.

The unchanged source files are identified by commit `19d8f8971d1d74b9118c7819bfbb55aa26f7ba9d` and the [original corpus manifest](../passage-search/corpus-manifest.json). The extractor covers eligible article text, excluding scripts, navigation, SVG/canvas and hidden control text. It does not index every possible word in an image, video or interaction.

| Corpus/index fact | Observed |
| --- | ---: |
| Published article sources and corresponding live pages | 46 |
| Extracted source blocks, including headings | 4,550 |
| Non-whitespace body characters, excluding heading-only blocks | 715,293 |
| Original packed passages | 866 |
| New source-block units, with oversized blocks split | 3,980 |
| Source blocks requiring a split | 10 |
| Largest complete finer-unit model input | 474 tokens |
| Additional finer-unit vectors | 6,113,280 bytes |
| Finer-index build, including model initialization | 38.63 seconds |
| Cached build batches reused | 0 of 498 |

The finer units cover exactly the same body characters without loss or overlap. Headings provide context. A unit may be a paragraph, list item, table or code block; three selected units are not necessarily three prose paragraphs. The original 866 vectors take another 1,330,176 bytes. Both stages reuse the original pinned q8 CPU encoder, `query: ` / `passage: ` prefixes, mean pooling, L2 normalization and 384 coordinates, with a 480-token ceiling and no silent truncation. Its four model files total 34,726,727 bytes, apart from runtime dependencies. These are E5 costs, not measurements of MWG's loop.

## The architecture followed development evidence

The [fixed protocol](protocol.md) covers one source-aware topic for each article in short and framed forms, 12 additional vague recollections without project names, and ten prompts with no known answer label: **114 cases**. Fourteen article groups supply 36 development cases; 32 reserved groups supply 78 validation cases. Paired forms and any recollection of an article stay together. The split is deterministic, and four of eight framing templates are not recognized by query focus.

These are agent-authored questions after source reading. Some topics overlap earlier work. Reserving article groups limits this engineering selection step; it does not make the questions independent reader observations, make labels complete, or establish absence for negative cases. The initial [freeze](input-freeze.json) was committed before new rankings.

The initial matrix compared passage versus finer-block indexing, raw versus focused questions, and BM25, dense E5 and unchanged `k = 60` reciprocal rank fusion. On development, passage hybrid found the selected article in the first three for all 14 short topics and all 14 framed questions. The finer hybrid index lost a case in each form. Smaller excerpts were not automatically better article candidates.

Before opening validation, [amendment 01](amendment-01.md) therefore retained the original passage index for article discovery and added the finer index only for selecting excerpts **inside those candidate articles**. The best passage determines each distinct article's position; repeated matches do not add a vote for a long article. The finer stage cannot change that order. It selects up to three distinct source blocks for each of five candidate articles. No model training, fusion-weight tuning or refusal-threshold training occurred.

## Reserved article discovery results

The metric here is a selected article among the first **three distinct articles**. It differs from the original study's selected passage among three results. Report the forms separately; the two 32-question columns share underlying article topics.

| Passage-selected article ranking | Short topics | Framed questions | Additional recollections |
| --- | ---: | ---: | ---: |
| Whole question, BM25 | 31/32 | 30/32 | 7/8 |
| Whole question, E5 | 31/32 | 29/32 | 8/8 |
| Whole question, hybrid | 31/32 | 31/32 | 8/8 |
| Topic focus, BM25 | 31/32 | 31/32 | 7/8 |
| Topic focus, E5 | 31/32 | 30/32 | 8/8 |
| Topic focus, hybrid | 31/32 | 31/32 | 8/8 |

For whole-question hybrid, the selected article was first for 28/32 topics, 26/32 framed questions and 7/8 recollections. The vague Buzz recollection placed Buzz third. Hybrid had gains and losses against keywords; identical aggregate topic counts hide different missed articles. Every ranking and the gain/loss IDs are in the [summary](results/summary.json) and [source review](source-review.md).

All six reserved no-known-answer prompts received results from every method; so did the four development prompts. Similarity and a nonempty list do not establish that the requested topic exists. A missing literal term is useful evidence to display, not a semantic no-answer decision.

## Paragraph selection remains a separate weakness

The next metric requires both the selected article among the first three and its frozen target block among the three selected excerpts.

| Excerpt ranking inside passage candidates | Short topics | Framed questions |
| --- | ---: | ---: |
| Whole question, BM25 | 22/32 | 21/32 |
| Whole question, E5 | 20/32 | 20/32 |
| Whole question, hybrid | 23/32 | 26/32 |
| Topic focus, BM25 | 22/32 | 22/32 |
| Topic focus, E5 | 20/32 | 18/32 |
| Topic focus, hybrid | 23/32 | 23/32 |

These targets are incomplete. The post-hoc [review of every whole-question hybrid target miss](source-review.md#selected-block-misses) found alternative explanations of signal-stack scope, Web Bot Auth limits and TypeScript checker behavior in the correct articles. It also retained actual misses: the command-discovery explanation was absent from selected excerpts, and a task-manager result covered core ownership without the no-edit-button detail. No returned alternative was promoted into the frozen labels, and there is no corrected utility percentage.

A separate preparation defect limits the recollection paragraph counts more seriously: `prepare-cases.mjs` inherited each recollection's block ID from the article's other selected topic. In V10, a shared-model question inherited a signed-key block. The article label remains usable, but that block is not a valid exact-answer target for this question. The original rows remain available; their inherited 3/8 block-hit count is **not interpreted as recollection answer quality**. Useful alternatives and the actual Buzz sharing miss are recorded separately, without relabeling or a corrected percentage.

## Browser trials and changes made afterward

These were actual native form submissions and source-link clicks in the in-app browser, separate from API ranking checks:

| Trial | Observed outcome |
| --- | --- |
| Animated icons for Svelte 5 | OSS Radar #01 first; selected excerpts identify Moving Icons. A clicked link scrolled the live Markdown article to its explanation and visibly highlighted the text. |
| A local report writer after networking was blocked | Hob article first; selected text described the executed file tasks and local model. |
| A PDF with hidden words still present | PaperPilot article first; selected text explained the retained extractable secret. |
| A tablet receiving a desktop installer | User-Agent article first; selected text described the Android/Linux download error. |
| A processor built into model layers without example-based learning | Qwenputer article first; selected text described compiled tensors and the absence of optimizer/training data. |
| A progress caption needing another model request | Claude Code status article first; selected text described the separate full-transcript request. |
| Frozen vague shared-model recollection V10 | Buzz third. Selected excerpts missed the sharing explanation; its third original passage contained it. |
| A separately worded shared-model recollection | Buzz second, with useful sharing excerpts. Expanding source context and clicking its link reached the live TypeScript article's shared-model paragraph, with visible highlight. Different wording changed results. |
| Literal emoji keyword | No keyword results. Semantic suggestions existed, with a missing-term notice and collapsed disclosure. No emoji-project answer was verified. |

The current `jis3r/icons` package and one actual Svelte component were also inspected: it is an animated SVG icon library. This supports the icon interpretation; it does not establish an emoji project or recreate the historical Radar review. [Sources and inspected blob identities](source-review.md#source-code-read).

Three product decisions follow these observations **after validation**, documented in [amendment 02](amendment-02.md):

1. Keep the whole question by default. Focus had no net hybrid article-at-three gain and reduced framed selected-block hits from 26/32 to 23/32; development also fell from 12/14 to 10/14. Topic focus remains available. Choosing the default after observing both frozen conditions is a product decision, not an untouched estimate for that choice.
2. Repair focus so it preserves project/tool/library qualifiers instead of reducing a project description to a bare noun. All 114 measured search texts are identical under the repaired normalizer. That means the pack did not exercise the defect; targeted contract tests are not unseen relevance evidence.
3. Add expandable context from the three original passage matches. It can expose a relevant section that excerpt ranking missed. It adds text and inspection effort, and is excluded from the frozen three-excerpt counts. No answer is generated.

## Exact-text links and rendering

For every link, the prototype seeks a unique phrase in the **captured live article text**, percent-encodes text-directive punctuation, and retains a heading fallback where one exists. Otherwise it offers an honestly labeled section/article link. With an empty query, 3,851 of the 3,980 finer units had a unique target and 129 used fallbacks. That is substring-target availability, not relevance, proof of scrolling, or all-browser support. The [Text Fragments specification](https://wicg.github.io/scroll-to-text-fragment/) defines the mechanism. Page edits and browser behavior can invalidate it. The two observed live highlights supply narrower navigation evidence.

The capture comparison also found a real site renderer defect: 19 of 4,550 source blocks differed because linked Markdown labels exposed literal backticks or emphasis. The custom link renderer interpolated raw token text. Delegating to Marked's native link renderer preserves parsed inline labels, escaping and titles, then adds the existing external-link attributes. Six focused Markdown tests passed. A separate production build passed and contained all **4,550/4,550** extracted source blocks after normalization. [Build comparison](rendering-check.json). This is source/build acceptance; the live capture predates the fix and is retained unchanged.

The interface is server-rendered and works without client JavaScript. The owned loopback server verifies model/index identities, rejects remote model loading, saves no query log, and caps query size and queued inference. All **684 existing-case condition checks** agreed with the frozen article and excerpt orders. Seven HTTP contracts and the escaping/default checks passed. The first integration harness used `fetch` to try setting Host; Node replaced that header, causing a test failure after the rank comparisons. The corrected transport and complete repeat are disclosed in [harness history](source-review.md#integration-harness-history). The repeat adds no relevance cases.

Desktop browser inspection found no horizontal page overflow at 1,280 pixels. A requested 390-pixel browser override continued to render at 1,280, including in a fresh tab; it was reset. There is **no mobile-layout acceptance claim** from that attempt. Full repository type checking and 457 blog tests passed, as did ten focused reader-search tests. No search route was deployed to the public site, and the manuscript remains a separate unpublished engineering draft.

## What this supports next

The prototype is useful enough for further source inspection: several remembered descriptions found the right article and real text, with working live paragraph links. Keywords remain competitive, and exact-excerpt selection and answerability remain unresolved. Keep the comparison controls available; a semantic result should not replace inspecting the source.

Before a public search feature, the next bounded check is independent, naturally phrased reader questions with passage judgments prepared for those questions, including verified absent topics. A fresh corpus/version needs its own capture and labels. Production integration also needs an explicit refresh and serving decision; this experiment does not quietly turn the local Node transformer into a Cloudflare or browser-inference deployment.

MWG transfer would be a different experiment: build compatible Gemini document vectors, then evaluate the seven-line query encoder against those vectors on the same product questions. It has not been run here. This E5 work establishes neither that MWG's loop works on arbitrary blog bodies nor that semantic search generally beats keywords.
