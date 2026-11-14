# Modern Web Guidance’s seven-line embedder, reproduced

Modern Web Guidance can embed a short search query in a few microseconds because much of its learned behavior ships as a table. I reproduced the calculation, matched 628 embedding calls per process coordinate for coordinate, and replayed its public retrieval test split.

The useful engineering idea is deciding which work belongs before release. A large model produces the guide vectors and initializes the word table. Training adjusts that table for short web-development queries. The installed CLI mostly looks up rows, adds them, and searches a small corpus.

My local tests support that design within its intended scope. They also expose boundaries that the small loop cannot show: full search takes milliseconds, a relevant result does not establish correct generated code, and the admission gate returned web guides for all 90 curated out-of-scope queries I replayed.

## The knowledge arrives in the data files

Paul Irish’s [engineering report](https://developer.chrome.com/blog/mwg-technical-deep-dive) describes Modern Web Guidance moving from a native dependency stack through TensorFlow.js to static query embeddings. Its guides help coding agents find current implementation advice without loading the entire catalog into their context.

The released package I inspected contains **29,165 vocabulary entries**, each associated with **256 signed-byte coordinates**. Beside that table are one float32 scale per entry and the vocabulary’s strings. The source and installed query tables matched byte for byte. [Archive inventory and hashes](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/modern-web-guidance/embedding/results/package-receipt.json).

A word’s row is a learned numerical representation. The coordinates do not have convenient labels such as “accessibility” or “animation.” Their directions make certain queries close to certain guide chunks under a dot-product comparison.

The [training code](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/train-query-words.ts) explains where those rows come from. It gets word embeddings from `gemini-embedding-001`, truncates and normalizes them to 256 dimensions, then adjusts word vectors and weights so their combinations approximate teacher embeddings of complete training queries. Finally it quantizes the vectors to signed bytes and folds each row’s quantization scale into its word weight.

I inspected that path and used the shipped weights. I did not rerun its model API calls or training. The project documents a 32,915-query training population; my reproduction does not independently validate that population or its separation from evaluation data. [Table provenance](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/README.md#committed-table-provenance).

This belongs to the family of static embedding techniques illustrated by [Model2Vec](https://github.com/MinishLab/model2vec): use an expensive model to help construct a compact model whose runtime performs much less work.

## What the seven lines calculate

For a query such as `confirm destructive action`, the encoder finds known vocabulary entries. Each encoded pair contains a row index `i` and a contribution fraction `f`. A directly recognized word gets fraction 1; an unknown hyphenated word can fall back to known parts.

Here is the accumulation loop, with the dimension written explicitly:

```js
for (const [i, f] of enc) {
  const wt = scales[i] * f;
  const offset = i * 256;
  for (let k = 0; k < 256; k++) {
    out[k] += wt * table[offset + k];
  }
}
```

`table` supplies the signed-byte coordinates. `scales[i]` combines the learned importance of that word with the multiplier needed to reconstruct its quantized row. `out` accumulates floating-point values.

The [surrounding function](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/static-embedder.ts) clears the output first and normalizes the sum afterward, dividing each coordinate by the vector’s length. The complete embedding path also loads data and tokenizes text. Seven lines identify the inner arithmetic, rather than the whole implementation.

For three directly recognized words, the inner loop makes 768 weighted coordinate additions. After initialization, work grows approximately with the number of recognized token contributions times 256. It does not run transformer attention over the query.

The compact table still carries learned parameters. Its 7,466,240 signed-byte values alone occupy **7.47 MB uncompressed**. Storing that same number of coordinates as float32 would require 29.86 MB before vocabulary and scales. Quantization changes the storage representation; training supplies the useful values.

## Keep expensive document work before release

The two sides of search have different jobs:

| Stage | Work |
| --- | --- |
| Before release: guide chunks | Embed full text with the teacher model; ship the resulting vectors |
| Before release: query model | Build and tune the word table; ship vocabulary, rows and scales |
| During a query | Tokenize, sum known rows, normalize, rank guide chunks |

The packaged corpus had **2,016 chunks across 208 guides**. Query vectors were compared with those precomputed document vectors. The search then combined dense ranking with BM25 keyword ranking using reciprocal rank fusion. [Inspected search path](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/search.ts).

That asymmetry matters. The short-query table is trained for combinations of query words. The guide paragraphs retain representations produced by the full teacher model. Replacing both sides with a sum of word rows would be another model change requiring another evaluation.

## Microseconds for embedding, milliseconds for search

I froze a [reproduction protocol and reference implementation](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/modern-web-guidance/embedding) before measurement. The reference reads the published data formats and recreates tokenization, hyphen fallback, float32 accumulation and normalization. It is source-informed code, rather than a blind reimplementation or a separately trained model.

Across three fresh Node processes, **all 628 checked embedding calls per process matched every coordinate exactly**. The recreated hybrid rankings also matched all **36 fresh CLI search calls**. Those checks connect the small implementation to the shipped behavior.

On an Apple M5 running Node 24.14.1:

| Boundary | Observed range across three processes |
| --- | ---: |
| Warm short-query embedding, median batch mean | **3.46–3.53 µs/query** |
| Query-table initialization | 3.99–4.38 ms |
| First embedding after initialization | 0.16–0.33 ms |
| Fresh CLI search, median of 12 calls per process | **85.7–86.8 ms** |

Each warm process had 2,000 warmup calls followed by 30 batches of 1,000 calls over six fixed short queries. This measured `embedSync`, including tokenization and normalization, with tables resident and the runtime warmed. Fresh CLI timing included process startup, data loading, ranking and output. Filesystem caches and ordinary machine load were uncontrolled. [Complete measurements](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/modern-web-guidance/embedding/results/summary.json).

These results make the report’s **30 µs warm embedding** plausible. They do not reproduce its historical hardware comparison or establish a speedup against the old native and TensorFlow.js stacks, which I did not run.

A synthetic length check also behaved as expected: 1, 4, 16 and 64 distinct known entries took roughly 2.96, 3.58, 6.00 and 15.71 µs. These were fixed vocabulary-order strings, useful for checking work scaling rather than language quality.

Package size needs its own boundary. The official `1.0.0` archive I downloaded was **8.79 MB compressed**, with **16.50 MB of regular-file contents**. Every one of its 280 files matched the installed package. It includes the word table, guide data and a 4.99 MB scanner bundle.

That differs from the report’s historical 7.1 MB tarball figure; I did not establish why. Its old **507 MB unpacked dependency installation** also uses a different size boundary. A useful size comparison keeps compressed downloads, unpacked contents and process memory separate.

## The same loop needs the right table

To test the data’s contribution, I shuffled the assignments between words and complete vector/scale rows with a fixed seed. The arithmetic and row distribution stayed intact. Words received other words’ learned representations.

I replayed the upstream public agent test split against the packaged corpus. Of its 514 queries, 504 were labeled in-domain and had at least one guide judged a direct answer. My metric asks whether one of those known grade-2 guides appears in the first ten results.

| Retrieval method | Known direct-answer hit in top 10 |
| --- | ---: |
| Learned dense query table | **499/504** |
| BM25 keywords alone | **496/504** |
| Hybrid dense + BM25 | **501/504** |
| Dense with shuffled word-vector assignments | **18/504** |

The destructive control makes the learned assignments’ role visible. The tiny accumulator stayed in place while known-answer retrieval deteriorated sharply.

The hybrid also recovered five binary hits that BM25 missed, with no reverse losses on this set. Against dense retrieval it gained four and lost two. Those are bounded replay results, rather than a general ranking guarantee. [Every query and ranking](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/modern-web-guidance/embedding/results/quality.json).

The relevance judgments are the project’s pooled labels, primarily generated by an LLM. I did not independently relabel them. Some returned guides are unjudged: 795 of the hybrid’s 5,040 candidates. They are not thereby established irrelevant. My metric also includes orientation guides, so it differs from the project’s leaf-only Hit@K. I did not reproduce its private 4,000-query telemetry benchmark or cloud-model comparison.

A hit means a known useful candidate appeared somewhere in ten results. The consuming agent still has to select, read and correctly apply it.

## The shortcuts have visible edges

The tokenizer removes `not`. In a fixed control, `animate dialog` and `not animate dialog` produced exactly equal vectors and identical search rankings. The consuming agent retains the original instruction, but this search path does not preserve that distinction.

Word order also does not receive a learned contextual representation. Reversing `animate dialog` preserved the mathematical sum and tested ranking, with small float32 rounding differences. Unknown words can contribute nothing. A newly coined single-word API name needs a vocabulary update for dense recognition, although keyword search may still find it in guide text.

The two rankers can diverge even when embeddings match. `dialog` and the deliberately unknown compound `dialog-qzxwvvunknown` produced the same dense vector through hyphen fallback. Their hybrid rankings differed because the keyword tokenizer retained the compound. Testing only the embedder would have missed that distinction.

The scope gate deserves separate attention. **All 90 curated out-of-scope queries received hybrid results**, including all 40 nearby web topics outside the catalog and all 50 farther-away topics. BM25 alone admitted 87. These are admission counts on a selected public set, not a population estimate or evidence that an agent subsequently misused the guides.

For a product that must refuse unrelated requests, these observations support testing an explicit scope decision rather than treating a nonempty top ten as proof of relevance.

## Finding a guide and improving code are different results

I also ran a separate [interface study](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/modern-web-guidance/study/report.md): six small fixtures adapted from my blog’s responsibilities, three conditions and three repetitions, using one requested model configuration with checks in Chromium and WebKit.

In the primary 54-attempt batch, baseline instructions and ordinary MWG availability each passed **18/18** attempts. Directly supplied guides passed **16/18**. The baseline ceiling left little room to show a correctness gain. Guided dialogs did avoid manual Tab loops found in all three baseline dialogs while passing the same checks. Two supplied-guide dialogs missed the required focus return in WebKit.

That study also required a harness repair: its first 54 attempts remain diagnostic evidence, and a complete new balanced batch supplies the primary comparison. The report preserves both batches and the execution limits.

The implementation benefit I can point to is a specific simplification. The wider claim that better retrieval consistently produces better interface code remains open on harder tasks.

For a bounded, offline documentation catalog, this design offers a concrete option: spend more work preparing a release, keep runtime query computation small, and preserve keyword search for exact identifiers. Evaluate the retrieved candidates and the consumer’s behavior separately. The learned table makes the small loop useful; those checks establish where it is useful enough.

---

| Reference | What it establishes |
| --- | --- |
| [Local vector search for coding agents](https://developer.chrome.com/blog/mwg-technical-deep-dive), November 12, 2026 | Maintainer’s historical architecture, timing and footprint report |
| [Pinned static embedder](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/static-embedder.ts) and [training code](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/train-query-words.ts) | Inspected runtime calculation and table-generation method |
| [Model2Vec](https://github.com/MinishLab/model2vec) | Background on distilling static embeddings |
| [Public benchmark documentation](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/benchmarks/README.md) | Dataset and relevance-label provenance |
| [Local reproduction](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/modern-web-guidance/embedding), November 13, 2026 | Frozen protocol, agent-assisted scripts, full results, inventory and measurement limits |
