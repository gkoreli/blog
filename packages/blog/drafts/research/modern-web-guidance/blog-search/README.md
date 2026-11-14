# Trying the query loop on a blog catalog

November 14, 2026, America/Los_Angeles. A runnable, local browser demonstration loads the released MWG 1.0.0 word table and searches a snapshot of **46 blog post titles and tags**. This extends the [earlier literal runtime reproduction](../embedding/README.md) with an application example. It does not install search on the production site.

## What actually ran

- Existing Markdown and TypeScript metadata validators produced the [46-post source snapshot](results/posts-source.json) from `posts/`, at source commit `036058876bea2150042c02390445582b39dd04db`. Draft directories were excluded. This is a working-copy publication-source snapshot, not a fresh capture of production behavior. An automated read of the public posts.json endpoint returned HTTP 403, so it was not used as the corpus; no production incident diagnosis follows.
- The [builder](build-demo.mjs) checked all three model-file hashes against the earlier official archive receipt. It embedded each title plus tags, then compared those vectors and five control queries with the frozen reference implementation: **51 exact vector matches**. [Build receipt](results/build-receipt.json).
- The real browser loaded the model and catalog into a Web Worker. Query embedding and ranking ran there. The local static server delivered files; it did not embed search queries. The query model's three files total **7,899,553 bytes before transport compression**. The learned table is substantial even though its accumulation loop is short.
- In the in-app browser, `signup form` returned the Turnstile article first. Switching to keyword-only mode left one literal match. Entering `Bun memory` put the Bun/Express/Fastify article first. An unknown-token query in static mode returned no results. Returning to hybrid mode restored the Bun result. These are exploratory interaction checks, not a representative relevance benchmark.
- No teacher-model API call, new training, full-article embedding, production route, analytics event or site deployment was added. The demo UI identifies the narrower representation. [Complete probe rankings](results/probes.json) retain five example queries under all three modes.

## The important shortcut in this demo

Both sides use the query table: a visitor query and a post's short title-and-tags string. Descriptions are shown as snippets but are not indexed. This demonstrates loading, actual arithmetic, indexing, scoring and displaying links without a model account.

It is **not MWG's asymmetric full-document pipeline**. The query table was trained for short web queries. Using it for blog metadata is an exploratory transfer, with weak matches visible in the outputs. For example, `newsletter bots` did not place the Turnstile post in the first five; its indexed title and tags do not mention newsletters. This does not isolate whether the model, missing body text or ranking choices caused the miss.

The lexical mode is deliberately simple unique-token overlap, not BM25. Hybrid uses reciprocal rank fusion over that list and the static-vector list. These are a teaching baseline and demonstration, not the earlier frozen MWG retrieval replay or a production-quality comparison.

## How a full-article version would work

The seven-line function is a query encoder. A complete search needs a document index, ranking and a user interface:

```text
Before publishing:
article sections → compatible document embedder → saved vectors + URL + snippet

When a reader searches:
query → loaded word table + weighted-sum loop → query vector
      → compare with saved article vectors → rank results → article links
```

To follow the inspected MWG 1.0.0 design, the proposed build path is:

1. Export each published article's readable text and split it into bounded sections. Include title and useful topic metadata with each section.
2. Embed those sections with **gemini-embedding-001**, task type **RETRIEVAL_DOCUMENT**. The inspected upstream build requests 768 coordinates, keeps the first 256 and L2-normalizes them. Save those vectors; regenerate changed chunks by content hash. This document-embedding step was **not executed for this blog demo**.
3. At runtime, load the compatible query table once. Encode each short query with the loop, compare its normalized vector with the saved document vectors, and retain the best matching section per article.
4. Compare with a lexical baseline; optionally combine lexical and dense ranks. Test real reader questions and useful rejection/fallback behavior before adopting it.

The document and query vectors must inhabit a compatible learned space. Having 256 coordinates on both sides is insufficient. The shipped table is tuned against gemini-embedding-001; pairing it with an unrelated or newly selected embedding model is a new compatibility experiment.

The [pinned MWG document preparation](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/embed-guide-chunks.ts) supplies the reference recipe. Google's [current embedding documentation](https://ai.google.dev/gemini-api/docs/embeddings#supported-task-types), checked November 14, still lists gemini-embedding-001 and the query/document task distinction; it also documents manual normalization for reduced dimensions. This supports a proposed integration path, not proof of a completed provider integration here.

A browser Worker makes visitor-side queries local after assets load, with a model download around 7.9 MB raw in this example. A server-side implementation can keep the model download on the server and send back result JSON. The delivery and privacy tradeoffs differ. Neither deployment was benchmarked as a production service here.

## Run the example

Use the existing package and Node 24. From `packages/blog`, where the existing tsx dependency resolves:

```sh
node --import tsx drafts/research/modern-web-guidance/blog-search/snapshot-posts.mjs /absolute/blog-repo /tmp/posts-source.json
```

From this demonstration directory, build into a new folder:

```sh
node build-demo.mjs /path/to/modern-web-guidance-package /tmp/posts-source.json /tmp/blog-search-demo
python3 -m http.server 8097 --bind 127.0.0.1 --directory /tmp/blog-search-demo
```

Open `http://127.0.0.1:8097/`. The generated folder is standalone HTML/CSS/ES modules, three model files, catalog data, the upstream [Apache-2.0 license](LICENSE.upstream) and [third-party notices](THIRD_PARTY_NOTICES.upstream). Native article links remain available without JavaScript. No dependency installation is needed; model files are copied from the already verified package rather than committed to this repository.

Setup corrections: the metadata helper's path arguments were changed to use an explicit resolve callback before its successful run; the tsx invocation was moved into packages/blog so it could resolve the installed dependency. Failed setup attempts remain operational notes, not measured search attempts. Prior study protocols, scripts and measurements are unchanged.
