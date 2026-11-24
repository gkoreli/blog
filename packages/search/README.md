# @gkoreli/search

Article and passage search for publications. The first consumer is [gkoreli.com](https://gkoreli.com/search). This is a workspace package; it has not been released to npm.

```ts
import { prepareArticle } from '@gkoreli/search/html';
import { buildSearchIndex, createSearch } from '@gkoreli/search';

const prepared = prepareArticle({
  id: 'my-post', url: '/my-post', title: 'My post', html: renderedArticleBody,
});
// Publish prepared.html so result anchors exist in the actual article.
const bundle = await buildSearchIndex([prepared.article]);
const search = await createSearch(bundle.index);
const results = await search.search('a topic I remember');
// results.articles[].passages[] contains source text, preview ranges, context and URL.
```

## Boundary and model

An `ArticleDocument` owns ordered `SourcePassage`s and their native anchors. IDs are caller-owned; indexing never turns an arbitrary query into an article identity. HTML extraction is a build adapter, not a crawler. Pass trusted rendered article content, without the surrounding navigation. It preserves unique authored IDs and creates content-based anchors otherwise. Duplicate text receives a deterministic suffix. Inline formatting changes preserve the text anchor; substantive text edits can change it. Hidden content, scripts, controls and `data-search-ignore` content are omitted. `omitTags` applies publication policy without deleting displayed text.

The application exposes `buildSearchIndex` and `createSearch`, then one `search` operation. It owns query interpretation, candidate retrieval, article grouping, passage selection, scope and provenance. Packed candidate units, the finer excerpt index, MiniSearch serialization, rank fusion and vector layout are internal. HTML, inference, bytes and UI remain adapters. The core has no Node imports, DOM, Cloudflare binding, hosted account, publication slug or framework type.

Word search uses MiniSearch 7.2.0 BM25+ and OR matching. Article discovery uses title/heading/body boosts 3/2/1; paragraph selection uses heading/body so a repeated article title cannot stand in for source evidence. Prefix and bounded fuzzy recovery can precede a weak partial exact hit when they cover more query terms. Within equal coverage, exact results precede recovered results. Queries retain negation and topic category words, remove common function words and fixed article-location framing, and support quoted phrases. Inputs are bounded to 512 characters and 40 useful terms. English preparation and tokenization are intentional limits, not multilingual quality claims.

A query consisting of a series name and issue number can resolve directly from a published title such as `Field Notes #08: Seedlings`. It accepts an optional hash and leading zeros, and a first-word shorthand when the issue match is unique. Both modes return the scoped article link with `matchedBy: 'issue-number'` and an empty passage list. Ambiguous references and longer topic queries use ordinary retrieval.

Related mode fuses exact lexical and dense ranks at reciprocal-rank constant 60. Candidate lists become distinct article ranks before fusion; finer units independently select up to three source passages within each. It uses the original question for embeddings. Article/section scope and quoted phrases constrain both stages. `limit` and `passagesPerArticle` are bounded overrides. Rank scores are internal: results are neither confidence estimates nor a guarantee that the requested answer exists.

## Optional embeddings

```ts
const bundle = await buildSearchIndex(articles, { encoder });
const search = await createSearch(bundle.index, {
  encoder, loadVectors: () => loadBytes(vectorFile),
});
await search.search('a vague recollection', { mode: 'related', article: 'my-post' });
```

`EmbeddingEncoder` declares a stable `space`, dimensions and `encode(text, purpose, signal)`. An index records that identity. Related search rejects different spaces even when their array lengths match. Queries produce one vector; documents may produce multiple complete chunks. Finite, nonzero vectors are normalized. Multiple document chunks use their best similarity. The index and float32 bytes have integrity checks and source-unit identities. Opened source objects are frozen, including passage arrays, tags and headings. A result cannot alter the corpus through shared references. Word search never loads the vector file or invokes the encoder.

E5 runtimes are **optional peer dependencies** in v0.2. A word-only consumer installs MiniSearch and the HTML parser without transformer/native runtimes. Consumers using E5 explicitly install the pinned `@huggingface/transformers@3.8.1`, `onnxruntime-web@1.22.0-dev.20250409-89f8206ba4` and `onnxruntime-common@1.22.0-dev.20250409-89f8206ba4` peers needed by those adapters. The blog declares them itself. This installation boundary does not shrink model files or inference memory.

Optional subpaths implement pinned E5-small-v2:

- `e5-node`: build-time local CPU inference using Transformers.js 3.8.1; supply verified local files and an optional document-only content cache.
- `e5-web`: self-hosted, single-thread ONNX Runtime WASM in a dedicated browser worker. Supply the verified asset manifest, base URL and optional progress callback. Tokenization, `query: `/`passage: ` prefixes, mean pooling and L2 normalization match the Node recipe. Documents split below 480 tokens; oversized queries fail explicitly. No silent document truncation.
- `e5-assets`: verifies four released files at revision `02af79985278377e65c724a76275707cb0333c70`, caches outside Git, splits ONNX transport below 25 MiB per file, and emits fingerprinted assets. Splitting does not reduce total size. First build needs network access; subsequent verified files and document embeddings can be reused.

Node and browser E5 factories return a `ManagedEncoder`. Call `await encoder.close()` after the build or other owned use; it rejects new work, drains accepted calls and releases the model once. `createSearch` borrows an encoder and does not close it. The HTTP session below owns the encoder it creates. Inference calls are serialized, and intermediate tensors are disposed even on failure.

These adapters use a transformer. They do not implement MWG's seven-line encoder. The core accepts another compatible encoder without a change to its search interface.

## HTTP session

```ts
import { createHttpSearch } from '@gkoreli/search/http';

const search = createHttpSearch({
  manifestUrl: new URL('/search-manifest.json', location.href).href,
  // Omit this factory for word-only deployments. Import E5 only after opt-in.
  createEncoder: async configuration => {
    const { createBrowserE5 } = await import('@gkoreli/search/e5-web');
    const { readE5WebFiles } = await import('@gkoreli/search/e5');
    return createBrowserE5(readE5WebFiles(configuration), { baseUrl: location.href });
  },
});
const result = await search.search('the detail I remember');
const more = await search.search('the detail I remember', {
  article: 'my-post', passagesPerArticle: 8,
});
// result.articles[].totalPassages describes available ranked source passages.
await search.close();
```

Run browser inference in a dedicated worker. Calling related mode is an explicit application decision; this module supplies no consent UI. The absolute manifest URL selects the origin; index/vector URLs must use that origin. Manifest format 1 contains `index`, `vectors`, `space` and adapter-owned `model` configuration. The index remains format 2. Assets and serialized model configuration identify cached state; a content refresh keeps a compatible model and opens just one pair of lexical indexes for both modes. Failed loads can retry. After 60 seconds of active use the next search rechecks metadata; `refreshAfterMs` changes that interval. A failed periodic check retains an already-open corpus for offline use. A retired index/vector (404/410) forces one fresh manifest attempt. Persistent failure rejects rather than looping. `onStatus` reports index/model/refresh phases, and a fetch port supports other HTTP hosts and deterministic fixtures.

`close()` rejects new searches, waits for accepted work and releases owned models. Related searches should still be scheduled by the host when only the newest typed query matters. The blog worker owns that transport scheduling, while the session owns corpus/model lifecycle. A new model configuration retires the previous model after in-flight session searches finish. The session does not persist queries or provide an answerability decision.

## Consumer responsibilities

Publish the transformed article HTML and its index atomically. Persist the index and optional vectors; keep raw research captures, model caches and private author notes outside Git. Serve fingerprinted data with immutable caching and the manifest with freshness checks. An open client must handle retired data URLs across deployments; the HTTP adapter handles retirement and freshness. The blog's form/dialog, worker transport, no-JavaScript route, download consent and publication exclusions live in `packages/blog`. Do not put private text into an index merely because its source file is available.

The browser adapter needs WASM permission in the site's CSP and self-hosted runtime glue/WASM URLs. Model download, memory and CPU costs depend on the device. Browser caching may be evicted. Node timing does not establish browser performance. The bundled UI returns source passages and context rather than generating an answer. Word matches use preview ranges as text; consumers must not render source text as executable HTML.

`pnpm -C packages/search test` checks extraction/anchors, query semantics, retrieval boundaries, corruption/model mismatches, lazy loading, complete E5 inputs and cache behavior. [Comparison evidence](../blog/drafts/research/modern-web-guidance/search-package/README.md) records the source-aware blog trials and their limits. Tests and dogfooding do not establish independent reader accuracy or third-party adoption.

See [v0.2 changes and migration](CHANGELOG.md) and the [mixed ranking comparison](../blog/drafts/research/modern-web-guidance/search-package-v02/README.md). A larger passage budget is useful for inspection but does not revise the fixed three-passage scores.
