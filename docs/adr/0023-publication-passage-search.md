# ADR-0023: Publication search owns articles and source passages

Accepted November 14, 2026. [Delivery worklist](../worklist/blog-search/README.md), [comparison and limits](../../packages/blog/drafts/research/modern-web-guidance/search-package/report.md).

The [v0.2 amendment](#v02-session-and-retrieval-boundaries) supersedes the v0.1 recovery ordering and unit-level article fusion described below. Historical comparison artifacts remain unchanged.

## Decision

Build `@gkoreli/search` as a reusable workspace package. An article owns ordered source passages, native anchors and publication identity. Expose `prepareArticle` through the HTML adapter, `buildSearchIndex`, `createSearch` and the engine's `search` operation. Keep candidate packing, lexical indexes, vector rows, rank fusion and grouping inside the module. HTML parsing, inference, file transport, Cloudflare serving and the Nisli publication interface are adapters. The domain depends on none of those hosts. Do not introduce a repository interface or service abstraction merely to forward one implementation call.

Use exact MiniSearch BM25+ for immediate word search, appending bounded fuzzy/prefix recovery after existing exact ranks. Related ideas is an explicit opt-in: pinned local E5-small-v2 embeddings plus exact lexical ranks, fused at reciprocal-rank constant 60. The document encoder and query adapter declare and check the same model-space identity. Equal vector length alone is insufficient. Reject corrupt indexes/vectors and incomplete/non-finite embeddings. Preserve the original question for semantic inference and negation/category words in lexical preparation.

A broader candidate projection finds distinct articles. Finer source units select paragraphs within each candidate; source context remains available separately. Keep full source text, preview ranges and actual destination URLs in results. Do not generate an answer, expose similarity as confidence, or treat nonempty results as proof that a remembered topic exists. Quoted phrases, article scope and section filters constrain retrieval. Searchable material is published article content, with explicit omission of private source-note blocks. Drafts, raw research captures and author conversations never become an indexing input.

Publish generated paragraph anchors into the HTML actually served, including TypeScript article snapshots. Preserve unique authored IDs, use text-derived anchors otherwise and handle collisions. Content edits can change generated anchors; do not promise permanent paragraph URLs across substantive rewrites. Keep per-article coverage and check generated targets against actual output.

## Delivery and interface

The build caches verified model files and document embeddings outside Git and emits a fingerprinted index, separate float32 vectors, model parts, runtime WASM/glue and fresh manifest. Packed/excerpt units are reconstructed internally from source articles to avoid shipping repeated text. The quantized ONNX file is split below Cloudflare's 25 MiB per-file limit; this changes transport, not total size. Retain model/runtime notices. First build can download pinned assets; later builds reuse content-addressed document vectors.

Interactive searches run in a dedicated browser worker. Word search loads no transformer. Related mode explains its roughly 54 MB additional raw model/runtime/vector cost and requires an explicit enable action. Keep word search usable during model loading. Suppress stale responses and serialize semantic inference. Recheck the manifest after a minute of active use and retry once from fresh metadata when a data asset is retired (404/410); retain an already loaded model. Persistent failures offer reload or word search. Browser caching is useful but evictable. Self-host model assets and avoid a third-party query or embedding API. Browser/device performance needs its own acceptance; Node inference and MWG loop timings are different measurements.

Provide a regular `/search` GET form with server-rendered word results without JavaScript. These query URLs can reach infrastructure logs; do not promise that every search stays on-device. Interactive searches do not store query history. Use native links for results and native `<dialog>` behavior, Cmd/Ctrl+K, `/` outside editable controls, Escape, focus return, arrow navigation and a visible mobile search control. No manual Tab-trap loop or JSX runtime is needed. Preserve readable source content without scripting.

## Basis and rejected defaults

The method choice was recorded before reserved comparator output. Exact MiniSearch is a small, useful word-search baseline. E5/exact lexical fusion improved selected paragraph counts in development but is optional because it adds payload/inference and can worsen article discovery. The integrated current-corpus counts also show that tradeoff. Source-aware labels are incomplete; publish actual misses and useful alternatives without replacing labels after seeing results.

Pagefind's native static-site index and heading sections were executed and retained, alongside controlled record-level conditions. It struggled with the conversational questions in this selected English pack; that is not a general verdict on Pagefind. DocSearch informed interaction conventions, but its hosted Algolia ranking/crawler was not evaluated. The additional cross-encoder improved selected article ordering while missing some requested paragraph detail and adding a second model and computation. Retain it as research rather than shipping it by default.

MWG's seven-line query encoder remains a separate reproduction. The matching Gemini/MWG full-blog document index was not built. E5 product results must never be attributed to that encoder or used to validate its upstream training, historical installation footprint or private benchmark claims.

## v0.2 session and retrieval boundaries

Accepted November 14, 2026. [Iteration](../worklist/blog-search/v0.2.md), [controlled comparison](../../packages/blog/drafts/research/modern-web-guidance/search-package-v02/README.md).

Keep the article aggregate and source identity immutable after opening the index. Return source passages, bounded previews, context and total available ranked passages; source evidence is distinct from ranking confidence. The portable core borrows inference and byte-loading ports. E5 adapters own model resources and expose an idempotent `close()` that drains accepted work. Runtime tensor cleanup applies to failure paths too. E5 runtimes become optional peers rather than mandatory word-search dependencies.

Add a deep HTTP session adapter with `search` and `close`, configured by an absolute manifest URL and optional lazy managed-encoder factory. It owns shared index/model loading, retries after failed creation, freshness checks, model reuse across content refresh, one forced retry after asset retirement, and safe model retirement/shutdown. Both reader intents use one opened core engine. Leave newest-query scheduling and progress presentation in the blog worker; neither belongs in article identity or ranking. Do not introduce a host-neutral repository abstraction merely to wrap fetch. Index format 2 and manifest format 1 remain compatible with existing readers.

Select distinct article ranks before related-mode reciprocal-rank fusion. Rank lexical paragraphs using their heading/body rather than the repeated article title. For word recovery, prioritize matched query-term coverage, then exact evidence, then BM25+ score. These fixed policies were chosen by the declared known-set rule; the new source-aware confirmation set did not establish a general relevance gain. Retain its selected-paragraph regressions. Keep three excerpts for relevance comparisons even when the UI lets the reader expand an article to eight, thirteen, eighteen or twenty. Expansion scopes the existing query, preserves its ranking prefix and focuses the first newly displayed source link.

The publication adapter extends existing omissions for identified author source-note blocks without turning private prompts into a new searchable corpus. This changes the integrated corpus; frozen same-input experiments retain their original snapshot. Delivery checks must use the actual new index and all actual paragraph destinations separately.
