# Keyword search held up against a local semantic passage index

November 14, 2026, America/Los_Angeles. **The local search runs and returns article passages, but this comparison does not support replacing keywords with semantic-only ranking.** On the fixed known-answer-at-three metric, BM25 reached **32/36**, E5 **27/36**, and hybrid **33/36**. Hybrid's net gain was one selected question, with losses retained. [Protocol](protocol.md), [input freeze](input-freeze.json), [all result rows](results/run-01.json), [summary](results/summary.json).

This is a separate general passage-search experiment using a full local E5 transformer on both sides. It does not establish the transfer quality of MWG's query table, reproduce its training or create its matching Gemini document index.

## What ran

All 46 publication-source articles at `19d8f8971d1d74b9118c7819bfbb55aa26f7ba9d` were extracted, including actual rendering of the TypeScript posts in isolated SSG temporary directories. Drafts were excluded. The [manifest](corpus-manifest.json) records 4,550 text blocks and 733,820 eligible non-whitespace characters, including headings. Navigation, scripts/styles, controls, hidden decoration, SVG/canvas and image-only content were excluded. Coverage checks account for every eligible character exactly once; this is not a claim to index images or interactive state.

Heading-local packing produced **866 passages**. Their bodies cover 715,293 non-whitespace characters; headings and titles supply context. Ten oversized source blocks were split without loss or overlap. Actual model inputs, including the document prefix, context and special tokens, had at most **386 tokens**, below the frozen 480-token cap. Token counting runs without truncation before inference. Every saved 384-coordinate document vector was finite and unit-normalized within tolerance.

The encoder was `Xenova/e5-small-v2`, revision `02af79985278377e65c724a76275707cb0333c70`, q8, mean pooling and L2 normalization. Passage inputs used `passage: ` and query inputs `query: `. Transformers.js 3.8.1 ran its native CPU backend with two intra-op threads and one inter-op thread on an Apple M5, macOS arm64, Node 24.14.1. The model loaded from verified local files; remote models were disabled and fetch calls rejected during inference. No cloud embedding API or new training was used.

BM25 and E5 saw the same title/heading/body text apart from E5's required prefix. The lexical baseline retained the pinned MWG ranker's k1=1.2, b=0.75, plural stemming and stopwords, including removal of `not`. This is one specific keyword implementation. Hybrid fused the uncut positive-score BM25 list and all 866 dense ranks at k=60, with no weight or threshold tuning. Multiple passages from one article could occupy the returned positions.

## Labels and primary outcome

The 36 answerable queries were authored by the agent after reading selected source paragraphs: one short query and one natural-language question for each of 18 source articles. Eight further prompts were separately marked expected-no-answer. They are neither visitor logs nor independently human-labeled questions. Source-aware wording and terms can favor a lexical baseline; these cases do not estimate unseen-reader behavior.

The questions, selected answer blocks and their mapping to passage IDs were committed **before rankings** in `ebdc9f38`. Primary success means at least one of those **known answer passages appears in the first three results**. Another relevant passage can receive no credit. No post-hoc relabeling is folded into these results.

| Metric on 36 answerable queries | BM25 | E5 | Hybrid |
| --- | ---: | ---: | ---: |
| Known answer at 1 | 22/36 | 19/36 | 24/36 |
| **Known answer at 3 — primary** | **32/36** | **27/36** | **33/36** |
| Known answer at 5 | 33/36 | 28/36 | 34/36 |
| Known answer at 10 | 33/36 | 33/36 | 34/36 |
| Mean reciprocal known-answer rank through 10 | 0.734 | 0.648 | 0.785 |
| Target article among first 3 passages | 35/36 | 33/36 | 35/36 |

| Primary outcome by query form | BM25 | E5 | Hybrid |
| --- | ---: | ---: | ---: |
| Short queries, n=18 | 15/18 | 14/18 | 17/18 |
| Natural-language questions, n=18 | 17/18 | 13/18 | 16/18 |

Against BM25 at three, E5 had **one win, six losses and 29 ties**; hybrid had **three wins, two losses and 31 ties**. The first process is primary. All three fresh evaluation processes returned identical complete ranking lists; they repeat the same 44 queries, rather than supplying 132 independent cases. No evaluation process failed or was replaced.

A paired bootstrap over the 18 source-article groups gives a descriptive 95% interval for hybrid minus BM25 of **−11.1 to +19.4 percentage points**, around the observed +2.8-point difference. E5 minus BM25 was −13.9 points, with a descriptive interval of −30.6 to 0.0. Ten thousand resamples used a fixed seed. These intervals describe resampling this curated set; they are not confidence about all readers or blogs.

## Every disagreement at the primary cutoff

Ranks below identify the first frozen known-answer passage through ten; a dash means none in ten. All nine questions where any method's primary success differs are retained. The comments are **post-hoc agent review**, not blinded human judgments or revised scores.

| Query | BM25 / E5 / hybrid known rank | Review |
| --- | --- | --- |
| Q03, Turnstile readiness callbacks | 1 / 6 / 3 | E5's early passages discuss retries and the fake readiness API. They locate the article but precede the selected repeated-callback explanation. |
| Q09, signed requests and readership | — / 7 / 3 | Fusion brings the selected signature-versus-purpose passage into three. Early dense results discuss agent/browser attribution in a different article. |
| Q10, whether a signature proves a person initiated reading | 1 / — / 3 | E5 leads with signature coverage and browser evidence, related topics that do not supply the same initiator distinction. |
| Q21, Hob offline model download | 4 / 1 / 2 | E5 promotes the labeled introduction. BM25's second result already gives the model's download size and timings: a useful alternative that the primary labels do not credit. |
| Q22, prerequisite download and offline file-task duration | — / 4 / 1 | Hybrid retrieves the labeled introduction first. E5's first result is the detailed download/runtime section, also useful despite missing the frozen label. |
| Q24, lending editing actions and the remaining connection problem | 3 / 9 / 2 | E5 finds the correct article but other sections, then an editing-app example. Fusion restores the explicit WebMCP/trust/transport explanation. |
| Q25, skills, MCP and an optional interface | 1 / 6 / 1 | E5's first results emphasize host compatibility and service interfaces rather than the selected distinction among instructions, tools and UI. |
| Q26, when a visual interface is needed | 3 / — / — | Dense and hybrid show editing examples and ownership alternatives. BM25 alone places the selected criteria in three; examples are related but are a different answer. |
| Q28, a special text index and open-web citations | 1 / 7 / 4 | E5 leads with OpenScholar citation/revision material. Keyword search directly retrieves the llms.txt evidence claim; fusion pushes that known answer to fourth. |

One further shared miss matters: **Q01, prompt-cache prefix edits**. None returned the selected introduction in ten, yet all three retrieved explanations from the correct article in their first three. E5's first passage explains causal attention and why appending leaves earlier work valid. This is an obvious incomplete-label example. The observed primary score remains a known-answer retrieval count, not an overall usefulness or correctness rate.

## Uncovered topics still get results

All three methods returned nonempty lists for **all eight expected-no-answer prompts**. These included weather, sourdough, visas and other subjects outside the selected blog inventory. Dense top scores ranged **0.770–0.835**. Those values are directional similarities, not 77–84% confidence. No calibrated refusal rule was implemented. This small authored set is not a representative false-positive estimate.

The browser check made this concrete: the sourdough query returned passages about agent products and workflow, while a deliberately unknown token string returned zero keyword matches. Matching words and vector proximity both need interpretation. The UI displays source passages and makes no generated answer or claim that an answer exists.

## Cost, size and clocks

| Boundary | Measured value |
| --- | ---: |
| Four model/tokenizer/config files, raw | **34,726,727 bytes** |
| Float32 document vectors, 866 × 384 × 4 | **1,330,176 bytes** |
| Initial document build, model initialization included | **25.49 s** |
| Document build cache hits | **0 of 109 batches** |
| Model initialization in three query processes | **121–128 ms** |
| Warm query encoding, median / p95 | **2.97 / 4.41 ms** |
| BM25 ranking, median / p95 | **0.60 / 1.87 ms** |
| Dense scan, median / p95 | **0.46 / 0.95 ms** |
| Hybrid sum of encoding + both ranks + fusion, median / p95 | **4.32 / 6.61 ms** |

Warm summaries use 129 observations: 43 per process after excluding its first query in the recorded seeded order. They mix answerable and expected-no-answer inputs. P95 uses the nearest-rank definition. The build used batches of eight; query inference used one input at a time. Model size excludes the runtime's JavaScript and native dependencies; vector size excludes text, URLs and the keyword index. Query component timings exclude request transport, JSON construction, browser rendering and startup. Concurrent machine load and filesystem caching were uncontrolled.

There was no embedding-provider API charge in this local method. Model downloads, CPU time, electricity, storage, hosting and existing subscription costs are not measured dollar savings. These millisecond transformer measurements must not be compared as a matched speed test with MWG's microsecond static loop.

## Preparation, browser acceptance and disposition

Before the freeze, text extraction was corrected to keep tiny inline fragments with their semantic block and separate neighboring table text; the earlier local capture is retained. A two-text synthetic encoder preflight verified shape and norms before article ranking. Runtime installation emitted optional-script warnings, but its bundled native CPU backend worked without enabling scripts. These are setup observations, not discarded relevance attempts.

The first server launch inside the restricted shell could not bind loopback (`EPERM`); launching the same server with the local-server permission succeeded. This affected interface startup, not the frozen index or evaluations. In the actual in-app browser, checks covered the default Turnstile result, full-passage expansion, Hob's hybrid/keyword difference, the citation query's keyword/semantic difference, sourdough, an empty keyword result, length/token-limit errors, suggested questions and restored hybrid results. There were no recorded browser warnings/errors and no page-wide overflow at the tested 1280-pixel viewport. This is selected functional acceptance, not accessibility certification or a production-load test.

The usable artifact is a local passage-search comparison. The evidence favors retaining BM25 as the baseline and keeping hybrid available for further author review. It does not establish that a semantic layer generally improves this blog, that current visitors need it, or that the seven-line MWG model would perform the same way. Production integration and publication remain distinct actions. The [reproduction instructions](README.md) preserve the concrete next action: try new passage-finding questions in the local interface, and record any later evaluation as a separate set rather than tuning this one silently.
