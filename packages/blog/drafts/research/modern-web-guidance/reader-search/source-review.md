# Source reading, retained failures and label limits

November 14, 2026. Post-hoc engineering interpretation. All query labels and measured ranks remain frozen. The tables below supply explanations, not a replacement relevance score. Source bodies, full text directives, raw author queries and page captures remain outside Git.

## Source code read

| Inspected implementation | What it established |
| --- | --- |
| [MWG `static-embedder.ts` at 596acbc7](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/static-embedder.ts) | Token encoding produces row/fraction pairs; folded scale and signed-byte rows feed accumulation; normalization follows the seven-line loop. The table carries learned representations. The original released-weight reproduction remains unchanged. |
| [Reused MWG BM25/fusion source](../passage-search/vendor/README.md) | Token processing, lexical zero-match behavior and reciprocal rank fusion are separate from embedding. The experiment retains this implementation, including k=60. |
| [E5 model card](https://huggingface.co/intfloat/e5-small-v2) and [pinned ONNX conversion](https://huggingface.co/Xenova/e5-small-v2/tree/02af79985278377e65c724a76275707cb0333c70) | Matched query/document transformer, English retrieval, prefixes, mean pooling and normalization. Model scores are not calibrated confidence. |
| Installed `@huggingface/transformers@3.8.1`, `src/pipelines.js` and `src/utils/tensor.js` | The feature extractor tokenizes padded/truncated inputs, executes the model, mean-pools using the attention mask and normalizes. The local wrapper counts complete input tokens before inference and refuses more than 480, so the experiment does not silently rely on truncation. No model training was reproduced. |
| [Local retrieval](../passage-search/retrieval.mjs), [grouping](ranking.mjs), [hierarchy](hierarchy.mjs) and [navigation](navigation.mjs) | Dense ranking scans normalized vectors; lexical ranking and fusion remain available. First/best passage chooses an article, finer units supply excerpts without reordering it. Text-link verification and relevance are distinct. |
| [Current Moving Icons package](https://github.com/jis3r/icons/blob/main/package.json), [exports](https://github.com/jis3r/icons/blob/main/src/lib/index.ts), [activity component](https://github.com/jis3r/icons/blob/main/src/lib/icons/activity.svelte) | Package description, Svelte 5 peer dependency and actual SVG/path/CSS-animation implementation support animated icons. Read during the current search diagnosis; no project install or historical-version reproduction. |

The current Moving Icons blob identities returned by GitHub were `5bf0fb7f5273b29c4e3a62698619e432f8691a67` for package metadata, `48a08e4af82c968597ab96a4d86d1c595e2b60cf` for exports, and `54f11f2e8b1bbdbae26f84fdfc9b99f0032c34b0` for the inspected component. The branch links can change; these blob identities identify the observed bytes. This limited reading establishes neither an emoji project nor a general audit of the icon library.

## Every article-at-three validation regression

The [machine summary](results/summary.json) enumerates every gain and loss for query focus, finer versus passage article candidates, and semantic/hybrid versus keyword article candidates. The union of article-at-three loss cases is below. Repeated topic/framed forms stay separate in the raw results.

| Cases | Regression and source interpretation |
| --- | --- |
| R10-topic, R10-reader | Keywords found the essay about assuming engineering would bring users first. Dense passage ranking preferred broader agent/product-engineering material. Hybrid lost the short topic; removing location framing also moved the framed target out of the first five. Finer units recover it in some conditions, but those conditions were not substituted for the architecture selected on development. |
| R11-reader | Finer focused hybrid lost the article that passage focused hybrid recovered. The intended detail is an evaluation agent failing to recognize an executable on PATH. Whole-question hybrid also misses that article here. Generic evaluation and launch material is not an answer to the executable-discovery question. |
| R24-reader | Finer BM25 moved the selected identity-versus-reader-intent article beyond the first three. Generic first-person framing admitted irrelevant short statements; the original passage stage retained the article. The corpus also has related signature-limit explanations in other articles; the single article label is incomplete. |
| R29-reader | Semantic passage ranking missed the selected OpenClaw/Nisli article while ranking the 117-pull-request retrospective first. That retrospective explicitly describes focus/scroll/state loss under subtree replacement: a useful cross-article alternative, retained as a selected-article miss. Finer semantic units recovered the labeled article. |
| R30-topic, R30-reader | Finer semantic ranking moved the selected analytics-evidence article to fourth, behind related instrumentation and fetcher investigations. The topic is shared across those articles; the selected article and its request-versus-readership statement remain the frozen target. Keywords and hybrid retained it. |

For whole-question hybrid versus whole-question keyword, gains were R11-topic, R28-reader and V07; loss was R10-topic. For focused hybrid versus focused keyword, gains were R11-topic, R11-reader and V07; losses were R10-topic and R10-reader. Topic focus exchanged R10-reader for R11-reader under hybrid, without a net article-at-three gain. No competing condition was hidden after observing these changes.

## Selected-block misses

This reviews every validation topic/framed case that whole-question hybrid failed to satisfy jointly: the article among the first three and the frozen target block among three excerpts. The same rows are still misses in the machine result. An alternative may cover only part of a question.

| Cases | Source review of the returned excerpts |
| --- | --- |
| R09-topic | Correct signal-stack article first. Blocks b0042 and b0040 explain the process-wide/per-thread distinction directly; the preselected b0014 explanation was not shown. Useful alternative, not a corrected hit. |
| R10-topic | Selected essay absent from the first five candidate articles. Article-discovery miss; no target excerpt can be selected. |
| R11-topic | Correct evaluation article third, but excerpts discuss general evaluation honesty and a baseline PATH setting instead of the agent's command-discovery failure. Actual detail miss. |
| R11-reader | Correct article absent from the first five whole-question hybrid candidates. |
| R12-topic | Correct retrospective first. Core-behavior ownership and the mutation diagram are relevant; the no-edit-button aspect is not stated in the three excerpts. Partial coverage. |
| R14-topic | Correct OpenWiki article second. Blocks b0013 and b0026 describe operational task files and shared memory outside a summary introduction. Useful, differently worded evidence; the exact target remained missed. |
| R16-reader | Correct AgentPort article first. A prior-art table and a nearby AgentPort paragraph distinguish page actions from ownership, consent and transport. Useful alternatives to the preselected paragraph. |
| R24-topic, R24-reader | Correct identity-evidence article first/second. Block b0047 explicitly separates a signing identity from the initiating person's identity or purpose. That is useful for the question despite missing the selected introduction. |
| R27-topic, R27-reader | Correct essay first. The introduction and evening-planning material describe meaningful work delaying sleep and other commitments. Useful alternatives; exact selected block not shown. |
| R33-topic, R33-reader | Correct tsrs article first. The cache/history explanation, checker-setting description and two-file result table cover changed diagnostics more specifically than the selected introductory block. Useful alternatives retained as misses. |
| R37-topic, R37-reader | Correct Hob article first. The excerpts cover network-blocked file tasks, the model download and setup boundary. They omit the selected introduction's task-duration number, but that number is not the entire query. Useful partial alternative, without relabeling. |

Topic focus lost three joint framed-block hits, R09-reader, R10-reader and R12-reader, and gained none. R10 loses the article candidate; the other two change which blocks are selected within the correct article. This drove the explicitly post-validation full-question default.

## Recollection block-label defect

The twelve recollections inherited the selected block of each article's other topic. Some inheritance is a different aspect. V10's shared-model question inherited a signed-key target. The article is correctly identified; the inherited block is not a valid paragraph answer label for that question. The preparation code and every row are preserved. There is no repaired paragraph-accuracy percentage.

Five reserved recollections missed their inherited block under hybrid:

| Case | Post-hoc source observation |
| --- | --- |
| V03, Qwenputer | Returned b0009 explains that the compiler fills model tensors without an optimizer or training examples. That is useful for the actual recollection despite missing a different introduction. |
| V04, Hob | Returned b0002 describes both file tasks with networking blocked. The inherited target was the download/runtime tradeoff. |
| V09, tsrs | Returned b0017/b0020/b0021 describe checker settings, cache/order effects and additional error behavior. Useful detail beyond the selected introduction. |
| V10, Buzz | Article third. Selected excerpts did not explain lending a model. The third original passage did contain the sharing section. An expandable view adds that passage with a larger text budget; the original three-excerpt result is unchanged. |
| V12, Claude Code status | Returned b0008 describes the additional full-transcript summary request. The inherited target was an introduction. |

This separates incomplete labels from actual retrieval failures; it does not claim that all remaining results are useful. Independent question-specific labels are the next evaluation need.

## Integration harness history

The first server check completed its existing-case rank comparisons, then failed the Host contract: the Node 24 `fetch` client replaced the explicitly supplied Host header, so the request did not exercise the intended rejection. No final success receipt was written. Its failure log remains local. This was a test-transport defect, not evidence that the server accepted a request carrying the rejected Host value.

The corrected [check](verify-server.mjs) uses `node:http` for explicit HTTP contracts, adds a started receipt and saves completed rank comparisons before contract checks. A complete repeat passed 684 query/condition comparisons, seven rejection contracts, the full-question default and escaping/no-script checks. The server's host policy was unchanged. [Final receipt](server-integration.json). Repeating the same cases provides integration evidence, not additional relevance data or an independent performance sample.
