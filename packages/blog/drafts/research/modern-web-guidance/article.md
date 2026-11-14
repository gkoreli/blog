# How Modern Web Guidance’s seven-line embedder works

Modern Web Guidance turns a short search query into 256 numbers by looking up learned word vectors, weighting them and adding them. Those numbers help find relevant implementation guides. Its seven-line loop performs the sum; the trained table and surrounding code make that sum useful for search.

Paul Irish’s [engineering report](https://developer.chrome.com/blog/mwg-technical-deep-dive) puts warm query embedding at **30 microseconds**. I reproduced the runtime calculation using the released table and measured the original implementation locally. The results support microsecond-scale embedding, while leaving the training process, historical speedup and private retrieval benchmark as upstream claims.

## Read the loop as a weighted sum

The released `modern-web-guidance@1.0.0` package contains **29,165 vocabulary entries**, each associated with **256 signed-byte coordinates**. An embedding is this kind of numerical representation: search compares its direction with the directions of stored guide vectors.

For `confirm destructive action`, the encoder finds the recognized words’ vocabulary rows. It produces pairs `[i, f]`: `i` identifies a row, and `f` says how much that occurrence contributes. A directly recognized word gets `f = 1`.

Here is the [accumulation loop](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/static-embedder.ts), with the dimension constant written as `256`:

```js
for (const [i, f] of enc) {
  const wt = scales[i] * f;
  const offset = i * 256;
  for (let k = 0; k < 256; k++) {
    out[k] += wt * table[offset + k];
  }
}
```

The table stores its rows consecutively in one flat array. Row 0 occupies positions 0–255, row 1 occupies 256–511, and so on. Therefore `i * 256` finds the beginning of word `i`’s row, and `offset + k` selects its coordinate `k`.

`scales[i]` combines two multipliers: the word’s learned weight and its quantization scale. Quantization stores coordinates as small integers; the scale converts them back to weighted floating-point contributions. The release has already folded the weight and scale together. At query time, `wt` multiplies that stored value by `f` once, and the inner loop reuses it for all 256 coordinates.

`out[k] += ...` adds the contribution to the query’s coordinate `k`. It combines words coordinate by coordinate. The output stays 256 numbers long regardless of how many words contributed.

For three directly recognized words, the inner loop makes **768 weighted coordinate additions**. Work grows approximately with recognized token contributions times 256. The table is already loaded; this path performs no transformer attention over the query.

The fraction `f` handles a particular fallback. When an unknown hyphenated token has several known parts, each known part receives an equal share. With two known parts, each gets `f = 0.5`. Words with no recognized entry or usable hyphen parts contribute nothing.

## Normalize the sum after the loop

The surrounding function clears `out` before accumulation and normalizes it afterward: divide every coordinate by the vector’s length. The seven lines cover the weighted sum, while these additional steps prepare its input and output.

For a small worked example, suppose two recognized words have the following **made-up, two-dimensional rows**. These illustrate the arithmetic; they are not MWG’s learned values.

| Word | Stored row | Scale, with `f = 1` | Contribution |
| --- | --- | ---: | --- |
| First word | `[4, 0]` | `0.25` | `[1, 0]` |
| Second word | `[0, 4]` | `0.125` | `[0, 0.5]` |

Their sum is `[1, 0.5]`. Its length is `sqrt(1² + 0.5²)`, approximately `1.118`. Dividing both coordinates by that length gives approximately **`[0.894, 0.447]`**.

The direction reflects both contributions, and the length is now one. With normalized query and document vectors, a dot product compares their directions: more aligned vectors receive higher scores. An all-unknown query remains a zero vector and supplies no dense directional signal.

MWG does this in 256 dimensions. Individual coordinates have no assigned labels such as “accessibility” or “animation”; useful relationships come from how the rows were learned.

## The expensive preparation happens before release

The [upstream training script](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/train-query-words.ts) initializes word vectors with `gemini-embedding-001`, truncates and normalizes them to 256 dimensions, then adjusts vectors and weights so their sums approximate teacher embeddings of complete training queries. It quantizes the result to signed bytes and folds each row’s quantization scale into its word weight.

I inspected that code and used the shipped table. **I did not rerun training or the teacher API calls.** The project’s [documented 32,915-query training population](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/README.md#committed-table-provenance), and its exclusion of evaluation queries, remain upstream provenance claims. This approach belongs to the static embedding family illustrated by [Model2Vec](https://github.com/MinishLab/model2vec).

The release pipeline also prepares guide vectors differently from queries:

| Before release | During a search |
| --- | --- |
| Embed guide chunks with the full teacher model and ship their vectors | Compare the query vector with those stored vectors |
| Build and tune the query word table | Look up recognized words, sum their weighted rows and normalize |

That is the asymmetry: full-model document vectors on one side, a compact approximation for short queries on the other. Replacing document embeddings with sums of word rows would require its own evaluation.

The inspected package held **2,016 chunks across 208 guides**. Its [search path](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/search.ts) combines dense vector ranking with BM25 keyword ranking. Reciprocal rank fusion combines their rank positions, allowing exact identifiers and semantic matches to contribute.

## What I reproduced with MWG

I froze a [protocol and source-informed reference implementation](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/modern-web-guidance/embedding) before measurement. The reference recreated tokenization, hyphen fallback, float32 accumulation and normalization after inspecting the source. It used the published vocabulary, table and scales. Retrieval checks reused upstream’s corpus loader, BM25 ranker and rank-fusion function.

| Evidence | What it establishes |
| --- | --- |
| Every coordinate matched on **628 embedding calls per process**, across three processes | The separate implementation reproduced the original query calculation on those calls, including repeats |
| Recreated hybrid rankings matched **36 fresh CLI search calls** | The reconstructed search agreed with the shipped CLI on six selected queries, each called twice per process |
| Archive integrity and all **280 installed file payloads** matched | The inspected files match the official npm 1.0.0 archive; source and packaged query tables also match |
| Training source and documentation inspected | A documented method and provenance; no independent retraining or training-data audit |

This reproduces computation using released weights. It does not independently establish how those weights were obtained or that they equal full-model embeddings on unseen queries.

## Warm embedding and fresh search need separate clocks

The timing below measures **upstream’s original `embedSync`**, whose results the reference matched. Environment: Apple M5, macOS arm64, Node 24.14.1, pinned source commit `596acbc75a330508591b07cd9e198b219341f619`.

| Boundary | Observed range across three processes |
| --- | ---: |
| Warm short-query embedding, median batch mean | **3.46–3.53 µs/query** |
| Query-table initialization | 3.99–4.38 ms |
| First embedding after initialization | 0.16–0.33 ms |
| Fresh-process CLI search, median of 12 calls per process | **85.7–86.8 ms** |

Each process had 2,000 warmup calls followed by 30 batches of 1,000 measured calls over six fixed short queries. Warm embedding included tokenization, accumulation, normalization and output-array conversion. It excluded initialization and ranking. Fresh CLI timing included process startup, data loading, ranking and output. Filesystem caches and ordinary machine load were uncontrolled. [Full measurements](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/modern-web-guidance/embedding/results/summary.json).

These results are compatible with the reported **30 µs warm embedding**. They are not a matched reproduction of that timing: hardware, queries and measurement conditions differ. I did not run the historical native or TensorFlow.js stacks, so their relative speedups remain upstream results.

Size needs the same care. The query table contains **7.47 MB of signed-byte coordinates**; the same coordinate count as float32 would take 29.86 MB, before scales and vocabulary. The complete official 1.0.0 archive measured **8.79 MB compressed**, with **16.50 MB of regular-file contents**, including guides and a scanner bundle. [File inventory](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/modern-web-guidance/embedding/results/package-receipt.json).

The engineering report lists a historical 7.1 MB tarball and an older 507 MB unpacked dependency installation. I did not establish the reason for the current archive difference or recreate that installation. Those differently scoped figures do not yield a like-for-like compression ratio.

## The learned rows make MWG’s loop useful

To test the table’s contribution, I shuffled assignments between words and complete vector/scale rows with a fixed seed. The accumulation algorithm and row distribution stayed intact; words received other words’ representations.

The replay used upstream’s public agent test split and **its existing relevance judgments**, primarily LLM-generated. Of 514 queries, 504 were labeled in-domain and had at least one grade-2 direct-answer guide. Nine had no grade-2 guide; one was labeled out-of-domain. My metric asks whether one known grade-2 guide appears in the first ten results. It includes broad orientation guides, so it differs from upstream’s leaf-only Hit@K.

| MWG guide ranking | Known direct-answer guide in first 10 |
| --- | ---: |
| Learned dense query table | **499/504** |
| BM25 keywords alone | **496/504** |
| Hybrid dense + BM25 | **501/504** |
| Dense with shuffled word-vector assignments | **18/504** |

The destructive control makes the learned assignments’ contribution visible. Keeping the arithmetic while breaking those assignments sharply reduced known-answer hits. It is a mechanism check with one fixed permutation, rather than a proposed competing retriever.

Some returned guides are unjudged: 795 of the hybrid’s 5,040 candidates. Missing judgments do not establish irrelevance. I did not independently relabel the dataset, reproduce the private 4,000-query telemetry benchmark, or compare with live cloud-model embeddings. [All replay rows and rankings](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/modern-web-guidance/embedding/results/quality.json).

## What MWG’s representation leaves out

The shared tokenizer removes `not`. In a fixed control, `animate dialog` and `not animate dialog` produced exactly equal vectors and identical search rankings. Reversing `animate dialog` preserved the mathematical sum and tested ranking, with small float32 rounding differences. The weighted sum has no learned word-order term, and the tokenizer discards this negation. The consuming agent still has the original task.

Equal dense vectors also need not produce equal full-search results. `dialog` and the deliberately unknown compound `dialog-qzxwvvunknown` produced the same vector through hyphen fallback. Their hybrid rankings differed because the keyword tokenizer retained the compound. This is why I checked complete search as well as the embedding calculation.

The admission gate returned hybrid results for **all 90 curated out-of-scope queries** I replayed: 40 nearby web topics outside the catalog and 50 farther-away topics. These are counts on a selected public set, not a population estimate or evidence of subsequent agent misuse. A product that must refuse unrelated requests needs to test that decision explicitly; a nonempty result list alone does not establish scope.

Finding useful guidance also differs from applying it correctly. In my separate [six-fixture interface study](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/modern-web-guidance/study/report.md), baseline instructions and ordinary MWG availability each passed 18/18 primary attempts; supplied guides passed 16/18. Guided dialogs avoided manual Tab loops while passing the same checks, but the baseline ceiling left no observed correctness gain. That report retains the first diagnostic batch, the harness repair and the complete repeated comparison. It does not isolate the embedder’s effect on generated code.

## Trying MWG’s loop as blog search

On November 14, I added a [local browser demonstration](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/modern-web-guidance/blog-search) over 46 post titles and tags from the blog’s source tree. A Web Worker loads the released MWG word table, encodes a query and ranks precomputed metadata vectors. In the browser, `Bun memory` put my Bun/Express/Fastify article first; `signup form` put the Turnstile article first.

This demo uses the query table to encode short metadata on both sides. It has no teacher embeddings for article bodies. Some matches were weak: `newsletter bots` missed the Turnstile post in the first five. The artifact demonstrates MWG’s calculation in a browser; it does not establish full-article search quality. Its three query-model files total about **7.9 MB before compression**.

Using the loop for article passages would require a compatible document index. The inspected MWG pipeline uses `gemini-embedding-001` with `RETRIEVAL_DOCUMENT`, requests 768 coordinates, then keeps and normalizes the first 256. A blog would run that preparation over bounded article sections and save each vector with its URL and snippet. At search time, the loop would encode the query for comparison with those saved vectors, alongside a keyword baseline.

**I have not built that matching Gemini article index.** Document and query vectors need a compatible learned space; equal array lengths alone do not establish compatibility. The metadata demo uses MWG; the separate E5 work below supplies the document and query model for the search package. Its results cannot establish MWG transfer quality.

## Separate experiment: E5 passage search on the blog

To test general passage retrieval, I built a [second local index](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/modern-web-guidance/passage-search) over all 46 article bodies, split into **866 passages**. It uses **E5-small-v2, a full transformer, for both passages and queries**. This experiment measures E5 retrieval on the blog; it does not test MWG’s seven-line encoder or its learned table on article bodies.

Following [E5’s retrieval recipe](https://huggingface.co/intfloat/e5-small-v2), the local model receives `passage: ` before document text and `query: ` before a search, producing normalized 384-coordinate vectors. The interface returns source passages and links, with BM25 keyword ranking, E5 semantic ranking and their rank fusion available for comparison.

Before ranking, an agent wrote **36 questions after reading selected source paragraphs**: one short query and one natural-language question for each of 18 article topics. I froze those questions and their selected answer passages. The questions did not come from visitor logs, and the passage labels were not independently graded by people. The metric counts whether a preselected answer passage appears in the first three results.

| Blog passage ranking | Known answer passage in first 3 |
| --- | ---: |
| BM25 keywords | **32/36** |
| Local E5 semantic ranking | **27/36** |
| Hybrid | **33/36** |

Hybrid gained three cases and lost two against keywords. It placed the Hob introduction first for the download-and-runtime question; keywords led with an unrelated prompt-cache passage. For the llms.txt citation-evidence question, keywords found the selected answer first, while E5 led with OpenScholar material and hybrid placed the answer fourth.

The labels miss some useful alternatives. For a short prompt-cache query, all three methods found explanations in the right article but missed the selected introduction; I retained that known-answer miss. Three fresh processes produced identical rankings for the fixed set, without adding distinct relevance cases. [The full report](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/modern-web-guidance/passage-search/report.md) retains every result, disagreement, timing and model-size measurement.

All three methods also returned results for all **eight expected-no-answer prompts**; a sourdough question produced unrelated passages. On this selected set, semantic-only ranking found fewer known answers than keywords, and hybrid’s one-case net gain does not establish a general improvement. These scores cannot compare E5 with MWG: the guide replay used different content, labels and a different cutoff.

A later [reader-search pass](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/modern-web-guidance/reader-search/report.md) separated article discovery from paragraph selection and checked live source links. Removing article-location framing reduced selected-block hits from **26/32 to 23/32** on its reserved source-aware questions. Finding the article did not guarantee finding the requested detail. Those checks led to a separate product investigation, rather than additional reproduction of MWG.

## Our approach: article search with source paragraphs

I built [`@gkoreli/search`](https://github.com/gkoreli/blog/tree/main/packages/search) inside this blog's monorepo to test that distinction in an actual reader interface. The [blog search](https://gkoreli.com/search) has two modes: **Words** for names and exact details, and optional **Related ideas** for a description whose wording differs from the source. Both return the article's own text and paragraph links.

Before choosing defaults, I compared the original BM25/E5 controls with MiniSearch BM25+, fuzzy/prefix search, Pagefind's generated search engine and an additional cross-encoder reranker. I also read DocSearch's keyboard, result and client code. **DocSearch calls hosted Algolia; I did not run an Algolia ranking or crawler trial.** Native whole-page Pagefind received its own index alongside controlled record-level comparisons. [Versions, all conditions, failures and rankings](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/modern-web-guidance/search-package/report.md).

The new pack had fifteen topics in three correlated forms and six no-known-answer cases. An agent constructed the questions and selected passages after source reading and earlier retrieval work. Ten article groups informed development; five supplied reserved checks. These are useful source-aware checks, with incomplete labels. They do not estimate independent reader accuracy.

The decision recorded before opening reserved results was exact MiniSearch for fast word search, with prefix/fuzzy recovery after existing exact ranks, plus E5/exact-keyword rank fusion for related ideas. On the 15 reserved positives, the chosen hybrid found **14 selected articles and 10 selected paragraphs**; the tolerant hybrid found 15 and 11. I retained the earlier choice and both results. The cross-encoder found all 15 articles but nine selected paragraphs. It also added 23.86 MB of files and substantial native computation, so it became a comparison rather than the default.

The reusable package then needed its own checks. An article owns ordered source passages; HTML extraction adds anchors to the HTML actually served. Broader units select distinct articles, and finer units select their excerpts. Parsing, inference, storage and UI stay outside the search domain, behind a small interface:

```ts
const search = await createSearch(indexText, {
  encoder,
  loadVectors: () => loadBytes(vectorFile),
});
const results = await search.search('a detail I remember', {
  mode: 'related',
});
```

The index records its embedding space and checks the vector file's integrity. A different model with 384 output numbers is rejected. Documents and queries use the same pinned E5 recipe; these are transformer embeddings, independent of MWG's word table.

The integrated current-corpus index contains **46 articles and 3,954 source passages**. All 63 selected-block label occurrences mapped to it before package ranking, and every generated passage target existed once in its article HTML. Current parsing, packing and source content differ from the earlier controls. In the actual browser worker, Words found the selected article in **43/45** answerable cases and its selected paragraph in **31/45**; Related ideas scored **42/45** and **35/45**. Related improved the paragraph count while losing one article-at-three case overall. Both returned material for all six no-known-answer cases. [Separate package acceptance](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/modern-web-guidance/search-package/package-acceptance.md) retains the misses and Node/browser differences. Replaying the serving build’s index after its vector bytes changed preserved those case outcomes.

A broad emoji recollection illustrates the limit. It returned OSS Radar #01, but word search's excerpts were generic, and related search surfaced an animated-icon library. That does not confirm an emoji project. A more specific Moving Icons/Svelte query exposed the source explanation; arrow navigation and Enter opened and highlighted that paragraph. Showing source text lets the reader inspect this distinction.

The interface uses a regular search page and a native dialog opened with Cmd/Ctrl+K. Word search loads no transformer. Related search explicitly enables roughly **53.3 MB of additional raw model, runtime and vector files**, which the browser may cache. The lexical index is another 5.72 MB raw; one production Brotli response measured 1.22 MB. The oversized ONNX file is split for the host's per-file limit, without reducing its total size. This is a materially heavier client than MWG's query table.

Interactive queries run in a browser worker with self-hosted assets. The plain GET form works without JavaScript and sends its query in the URL to the site, where infrastructure logs can retain it. The product returns passages to inspect, with no generated answer or confidence percentage. Browser/device cost, refusal behavior and incomplete relevance labels remain part of the engineering problem.

MWG moves expensive work into the data prepared before release. The loop can stay small because it assembles a query vector from that data. Adopting it means preparing a compatible document index and checking the complete search path on the questions the product needs to answer.

---

| Reference | Evidence supplied |
| --- | --- |
| [Local vector search for coding agents](https://developer.chrome.com/blog/mwg-technical-deep-dive), November 12, 2026 | Maintainer’s architecture, historical footprint, timings and quality results |
| [Pinned static embedder](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/static-embedder.ts) and [training code](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/train-query-words.ts) | Inspected runtime calculation and training implementation |
| [Model2Vec](https://github.com/MinishLab/model2vec) | Background on distilling static embeddings |
| [Public benchmark documentation](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/benchmarks/README.md) | Upstream datasets, relevance judgments and metric definitions |
| [Local reproduction](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/modern-web-guidance/embedding), November 13, 2026 | Frozen protocol, agent-assisted scripts, exact comparisons, measurements, full replay rows and limits |
| [Separate local E5 passage comparison](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/modern-web-guidance/passage-search), November 14, 2026 | Full-article index, fixed questions and labels, keyword/semantic/hybrid results, local interface and limits; not an MWG transfer benchmark |
| [Reader-search engineering checks](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/modern-web-guidance/reader-search), November 14, 2026 | Live article coverage, reserved source-aware cases, excerpt-selection failures and actual paragraph navigation; a later E5 product experiment |
| [Search package comparisons and acceptance](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/modern-web-guidance/search-package), November 14, 2026 | Controlled lexical/static/dense/reranker comparisons, current-corpus package checks, actual browser worker and source navigation; separate from MWG reproduction |
