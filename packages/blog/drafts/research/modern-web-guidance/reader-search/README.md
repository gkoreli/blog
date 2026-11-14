# Reader-style blog search investigation

November 14, 2026, America/Los_Angeles. **Executed:** current delivery checks for all 46 article pages, a finer 3,980-unit local E5 index, 114 fixed engineering cases, development-before-validation architecture selection, and actual browser navigation to source paragraphs. [Findings and limits](report.md), [source and failure review](source-review.md), [all normalized results](results/summary.json), [browser and build acceptance](acceptance.json). The original MWG and E5 experiments remain unchanged.

Initial observed problem: a natural-language article-location question returned unrelated passages, while a short topic term had no literal occurrence in the local article corpus. Neither vector similarity nor generic word overlap establishes that an answer exists. Raw author queries, page captures and operational records remain outside Git. Public examples and evaluation cases are separately authored and identified.

The current public index was fetched directly on November 14 and lists 46 articles, matching the earlier source snapshot's slug set. A search engine's cached index response was older and was not accepted as current production evidence. The live HTML capture records each status, response hash and cache condition; it does not equate CDN delivery with uncached origin content or with reader use.

Work in this directory is separate from reproducing MWG's seven-line calculation. General passage search continues to use the matched local E5 encoder. No Gemini article index or production search deployment is implied.

## What runs

The [loopback server](server.mjs) renders a native GET form and readable source results without client JavaScript. A query goes through the same local E5 model used for document vectors. Keyword, semantic and unchanged reciprocal rank fusion are available. The original 866 passage units choose five distinct articles; the finer index chooses up to three distinct source-block excerpts within each candidate. Optional context exposes the original passage matches. No generated answer is added.

The full question is the default; focusing a recognized article-location question is an explicit option. This default follows validation and is documented in [amendment 02](amendment-02.md). Missing lexical terms are disclosed, and wholly unmatched suggestions start collapsed. Neither behavior is a calibrated answerability detector. Query text is not logged by the server; native GET URLs may remain in browser history.

## Reproduce or run locally

First follow the [original E5 setup](../passage-search/README.md#run-it-on-the-same-sources), using the pinned sources, model and runtime. Reuse its corpus, passages and vector receipt. Prepare the finer units with the same local encoder, then build their vectors with the unchanged original builder:

```sh
node prepare-units.mjs /tmp/blog-corpus.json /absolute/runtime /tmp/blog-passage-model /tmp/blog-source-units.json
node ../passage-search/build-index.mjs /tmp/blog-source-units.json /absolute/runtime /tmp/blog-passage-model /tmp/blog-unit-cache /tmp/blog-unit-index
```

Capture the current public inventory with an HTTP client, preserving its response headers and body outside Git. `capture-live.mjs` accepts that posts index and fetches every article without retry. Run `verify-live.mjs` against the corresponding source corpus. A fresh capture verifies current targets; it cannot recreate the historical response bytes. Source and extraction timestamps also prevent regenerating identical JSON hashes from the same text.

Create a local JSON configuration. Values can be absolute paths or paths relative to the configuration file:

```json
{
  "passageFile": "/tmp/blog-passages.json",
  "passageVectors": "/tmp/blog-index/document-vectors.f32",
  "passageReceipt": "/tmp/blog-index/index-receipt.json",
  "blockFile": "/tmp/blog-source-units.json",
  "blockVectors": "/tmp/blog-unit-index/document-vectors.f32",
  "blockReceipt": "/tmp/blog-unit-index/index-receipt.json",
  "liveFile": "/tmp/blog-live-verification.json",
  "runtime": "/absolute/runtime",
  "model": "/tmp/blog-passage-model"
}
```

```sh
node server.mjs /tmp/blog-search-config.json /tmp/new-server-receipt.json
node --test reader.test.mjs hierarchy.test.mjs page.test.mjs
```

Open the printed loopback URL. An optional final numeric argument pins its loopback port. The loader verifies the pinned model asset hashes, runtime version, matching encoder configuration, document/vector checksums, dimensions, every vector norm and the live/index article inventories. Model loading and inference reject remote model fetches. The server accepts only local Host and Origin values and limits query size and queued inference. This remains an experimental local process, without a production index-refresh or public hosting path.

## Retained evidence

- [Protocol](protocol.md), [114 compiled cases](cases.json), [input freeze](input-freeze.json), [finer-unit manifest](unit-manifest.json) and [live capture coverage](live-coverage.json). Initial freeze commit: [`cfbacaaf`](https://github.com/gkoreli/blog/commit/cfbacaaf).
- [Development amendment](amendment-01.md), committed as [`95151f4c`](https://github.com/gkoreli/blog/commit/95151f4c) before validation. The finer index lost article discovery cases on development, so it became an excerpt-selection stage while passage candidates retained article order.
- Complete [development matrix](results/matrix-development.json), [validation matrix](results/matrix-validation.json), [development hierarchy](results/hierarchy-development.json) and [validation hierarchy](results/hierarchy-validation.json). Repeated metadata resolves through the two manifests. Every condition, top-ten unit list, top-five article list, score and raw-receipt hash is retained; no relevance labels were replaced.
- [Analysis](analyze-results.mjs) audits the retained local receipts, both freezes, row identities, metrics, query equivalence and hierarchy article order before writing fresh derived outputs. It intentionally refuses overwriting evidence; use an isolated analysis checkout for regeneration. Raw text, vectors, HTML, operational logs and author queries remain outside Git.
- [Navigation coverage](navigation-coverage.json) checks deterministic unique text targets in the captured text for every finer unit. [Rendering check](rendering-check.json) verifies every extracted block against a separate production build. Neither is a claim about current deployment or all-browser behavior.
- [Server integration](server-integration.json): all 114 existing cases × six ranking/focus conditions agree with the frozen hierarchy. [Integration harness history](source-review.md#integration-harness-history) retains the initial Host-header test failure. Repetition supplies no new relevance cases.

The [report](report.md) records what works, retained misses, the inherited recollection-label defect, post-validation interface changes and the next bounded decision. These results do not establish general visitor-search accuracy, a semantic-search win or MWG transfer to blog bodies.
