# Keyword ranking source

`bm25.ts` is an unchanged copy of [GoogleChrome/modern-web-guidance-src](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/bm25.ts) at commit `596acbc75a330508591b07cd9e198b219341f619`. It provides BM25, English minimal plural stemming and reciprocal rank fusion. [Upstream Apache-2.0 license](LICENSE.upstream).

Here every document ID is a unique passage ID; the upstream max-pooling-by-ID behavior therefore does not merge different passages. Default k1=1.2, b=0.75 and fusion k=60 remain fixed. The shared tokenizer removes stopwords including `not`; this implementation choice is retained and is a limit of this particular lexical baseline.
