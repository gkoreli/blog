# Full-article passage search: local E5, keywords and hybrid

November 14, 2026, America/Los_Angeles. **Executed:** 46 article bodies, 866 passages, one local document index and three fresh-process evaluations of 44 fixed queries. BM25 retrieved a preselected answer passage in the first three results for **32/36** answerable cases, local E5 for **27/36**, and hybrid for **33/36**. These are source-aware agent-authored cases with incomplete labels, not reader-search accuracy. [Findings and complete disagreement review](report.md), [machine summary](results/summary.json), [fixed protocol](protocol.md).

This experiment uses the same **E5-small-v2** model for passage and query embeddings. It is separate from the [MWG calculation reproduction](../embedding/README.md) and the [earlier metadata-only example](../blog-search/README.md). No Gemini document embeddings, new training or production search were created. The seven-line MWG query encoder is not used here.

## What the interface does

The [local server](server.mjs) loads the model once, embeds a query, scans saved passage vectors and computes BM25 plus reciprocal rank fusion. The browser displays actual source passages and article links, with available source heading anchors. Switch between Keyword, Semantic and Hybrid to inspect the same query. Six suggested questions come from the frozen comparison. This is passage retrieval; it does not generate an answer.

The server listens only on loopback and saves no search queries. It computes all three rankings per submitted query so method switching can reuse results. The model and article text remain local after setup; no embedding API key is needed. This is a Node CPU experiment, not browser inference or a Cloudflare deployment. See the [browser acceptance record](acceptance.json).

## Inputs and evidence

- Pre-measurement commit: [`ebdc9f38`](https://github.com/gkoreli/blog/commit/ebdc9f38). The [freeze](input-freeze.json) hashes the protocol, scripts, question labels, manifests, runtime lock and four model files. Later reporting and UI files are outside that input freeze.
- [Corpus manifest](corpus-manifest.json): article source hashes, rendered HTML hashes, passage IDs, source block IDs, token counts, text hashes and URLs. Full source-text captures and cached vectors are deliberately outside Git. Reconstruct from the identified article sources; do not publish a second raw text dump.
- [Questions](questions.json) and [compiled labels](queries.json): 18 source topics, one short and one natural-language query each, plus eight expected-no-answer cases. Labels were mapped before any full-text rankings. Earlier metadata-demo probes are excluded.
- [Process 1](results/run-01.json), [process 2](results/run-02.json), [process 3](results/run-03.json): every top-ten result, score, timing and frozen known-answer outcome. Raw receipts retain the full uncut ranking lists locally; their hashes and ranking digests are public. All three full-ranking digests agree. Repetition does not create more distinct relevance cases.
- [Analysis](analyze.py) verifies frozen inputs, vector norms, result identities and primary outcomes before summarizing. Its fixed-seed, 10,000-resample article-cluster bootstrap is descriptive for these selected topics. The frozen primary labels are unchanged after review.

## Run it on the same sources

Use Node **24.14.1** and the repository's pnpm dependencies. In this directory, install the isolated, locked research runtime and download the pinned model to a fresh local folder:

```sh
npm ci --ignore-scripts --prefix runtime
node download-model.mjs /tmp/blog-passage-model
```

The measured setup worked with the registry package's bundled native CPU runtime; install scripts were not needed. The four downloaded model files total **34,726,727 bytes**, excluding the JavaScript/native runtime dependencies. Their hashes are checked before writing.

From `packages/blog`, export the publication-source bodies into a fresh output file:

```sh
node --import tsx drafts/research/modern-web-guidance/passage-search/prepare-corpus.mjs /absolute/blog-repo /tmp/blog-corpus.json
```

From this directory, prepare passages and verify their stable content identities against the frozen manifest:

```sh
node prepare-passages.mjs /tmp/blog-corpus.json ./runtime /tmp/blog-passage-model /tmp/blog-passages.json
node verify-inputs.mjs /tmp/blog-corpus.json /tmp/blog-passages.json /tmp/blog-passage-model
node build-index.mjs /tmp/blog-passages.json ./runtime /tmp/blog-passage-model /tmp/blog-vector-cache /tmp/blog-index
node evaluate.mjs /tmp/blog-passages.json /tmp/blog-index/document-vectors.f32 ./queries.json ./runtime /tmp/blog-passage-model /tmp/blog-evaluation-01.json 20261114
node server.mjs /tmp/blog-passages.json /tmp/blog-index/document-vectors.f32 ./runtime /tmp/blog-passage-model /tmp/blog-search-server.json
```

Open the printed loopback URL. Every output path must be fresh; existing measurement files are not silently replaced. For three fresh processes, repeat evaluation with separate output files and seeds `20261115` and `20261116`. Index batch size is eight; cache keys include the ordered batch and model configuration. This matters because quantized inference can depend on batching.

Use article bytes identified by the manifest, available at source commit `19d8f8971d1d74b9118c7819bfbb55aa26f7ba9d`; later edits or new posts form a different corpus. Extraction timestamps change exact JSON file hashes on regeneration. `verify-inputs.mjs` therefore checks stable source/passage identities as well as reporting whether exact historical file hashes match. `analyze.py /path/to/original-local-captures` audits the retained original experiment; it intentionally refuses a different raw capture instead of silently rewriting its freeze. A new corpus or label set needs its own record.

## Sources and attribution

[E5's primary model card](https://huggingface.co/intfloat/e5-small-v2) specifies English retrieval, query/passage prefixes, pooling and normalization. The [pinned ONNX conversion](https://huggingface.co/Xenova/e5-small-v2/tree/02af79985278377e65c724a76275707cb0333c70) identifies the actual model files. Runtime: [Transformers.js](https://huggingface.co/docs/transformers.js/en/pipelines), pinned here to 3.8.1. The unchanged [upstream BM25 and fusion implementation](vendor/README.md) is Apache-2.0; its license is retained. These primary sources establish the model/runtime recipe, not this blog's relevance outcomes.
