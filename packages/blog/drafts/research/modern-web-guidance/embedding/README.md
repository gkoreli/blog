# Static query embedding: reproduction and limits

November 13, 2026, America/Los_Angeles. **The released query calculation was reproduced exactly on 628 calls per process in three fresh processes.** Warm short-query embedding took 3.46–3.53 µs per call by process median batch means. Fresh CLI search took 85.7–86.8 ms by process median. These fit the plausibility of the upstream 30 µs warm claim, without reproducing its hardware or historical speedup.

This investigation is distinct from the [completed interface study](../study/report.md). Its reviewable [article draft](../article.md) explains the mechanism and connects the evidence boundaries.

## Fixed inputs and method

The [protocol](protocol.md), [controls](cases.json), [reference implementation](reference.mjs), [measurement runner](reproduce.mjs) and [archive verifier](measure-package.py) were frozen in commit `d2da369f` before measurement. The [input manifest](frozen-inputs.json) preserves their hashes. No measured run failed or was replaced; the three runs execute sequentially with the same pinned inputs.

- Source: [`596acbc75a330508591b07cd9e198b219341f619`](https://github.com/GoogleChrome/modern-web-guidance-src/tree/596acbc75a330508591b07cd9e198b219341f619), clean checkout; Node 24.14.1, Apple M5, macOS arm64. Exact OS release and CPU observations are in the receipts.
- Package: official npm `modern-web-guidance@1.0.0`. Registry SHA-512 integrity verified; **all 280 regular-file payloads** matched the existing installed package. The [archive receipt](results/package-receipt.json) includes every file's size/hash and the official archive URL.
- Query tables: source/package vocabulary, signed Int8 rows and float32 scales match byte for byte. **29,165 words × 256 coordinates**, 2,016 packaged chunks across 208 guides.
- The separately written implementation follows inspected source and published formats; it is not a blind implementation, a new model or independent training. Original BM25 and RRF functions and the original corpus loader are reused for retrieval ablations. All 36 timed CLI calls matched the recreated hybrid rankings.
- Warm measurement: 2,000 warmup calls, 30 batches of 1,000 measured calls per process over six fixed short queries. The checksum consumes output; normalization makes the consumed coordinate depend on the complete vector. Source `embedSync` includes tokenization, accumulation, normalization and conversion to a number array. It excludes table initialization, corpus load, ranking and CLI work. There is no query-result cache in the inspected embedder.
- Ordinary machine load and filesystem caches were uncontrolled. These are batch means, not individual-call tail latencies; process repetitions do not establish a cross-machine distribution. Earlier pilot timings used a different query mix and execution window; they remain historical observations, not a matched comparator.

## Measurements

| Measurement | Process 1 | Process 2 | Process 3 |
| --- | ---: | ---: | ---: |
| Median warm batch mean, µs/query | 3.530 | 3.466 | 3.462 |
| Query-table initialization, ms | 4.378 | 4.111 | 3.992 |
| First embedding after initialization, ms | 0.328 | 0.185 | 0.162 |
| Median fresh CLI search, ms | 85.668 | 86.809 | 86.308 |
| Embedding calls reproduced exactly | 628 | 628 | 628 |

All **160,768 coordinate comparisons per process** matched exactly. These are repeated calls, not 628 unique strings. The three [process receipts](results/replicate-01.json) retain every batch and subprocess observation; [run 2](results/replicate-02.json) and [run 3](results/replicate-03.json) are separate executions. The [summary](results/summary.json) includes environment, timing boundaries and result digests.

The synthetic length experiment's medians across process medians were **2.96, 3.58, 6.00 and 15.71 µs** for 1, 4, 16 and 64 distinct known entries. These fixed vocabulary-order strings test arithmetic work scaling; they are not representative language queries or a document-embedding quality test.

The official tarball measured **8,794,985 bytes compressed** and **16,503,129 bytes of regular-file payloads**, excluding the Node executable and filesystem allocation. The query Int8 table is 7,466,240 raw bytes; scales add 116,660 bytes and vocabulary JSON adds 316,653 bytes. The package also includes a 4,992,779-byte scanner bundle and the guide corpus. This release measurement differs from the engineering report's historical 7.1 MB tarball. No explanation of that historical difference was independently established. Neither current figure is a valid compressed-versus-unpacked ratio against the reported old 507 MB dependency installation.

## Public retrieval replay

Replayed the checked-in **514-query agent test split**, plus all **90 curated OOS queries**, using the packaged corpus and K=10 in every ablation. Exactly 504 test queries were in-domain and had at least one upstream grade-2 judgment. Nine had no grade-2 guide and one was labeled out-of-domain; all ten exclusions are explicit in the receipts. No grade-2 target among the 504 was absent from the package.

| Method | At least one known grade-2 guide in top 10 | Curated OOS admitted |
| --- | ---: | ---: |
| Dense query table | 499/504 | 90/90 |
| BM25 only | 496/504 | 87/90 |
| Hybrid | 501/504 | 90/90 |
| Dense, word-vector assignments shuffled | 18/504 | 90/90 |

The permutation moves whole rows and their scales together with one fixed seed. It deliberately breaks learned word assignments while retaining the accumulation algorithm and vector distribution. It is a mechanism control, not a useful competing retriever. Hybrid had four hit gains and two losses relative to dense, and five gains with zero losses relative to BM25 on this binary metric.

These are **upstream pooled relevance labels**, primarily LLM-generated, not new independent human judgments. Our simple grade-2 hit metric includes orientation guides and differs from upstream leaf-only Hit@K. It measures the presence of one known useful result, not the usefulness of all ten or code correctness. Some returned candidates are unjudged: hybrid 795/5,040, dense 1,304/5,040, BM25 998/5,031, permutation 4,534/5,040. Missing judgments are not proof of irrelevance and limit the destructive-control score's interpretation.

All three processes returned identical [per-query rankings](results/quality.json), SHA-256 `9af03653bda53d0763e24392f7e51f8d88e2bfb013c03eb269564b944a4b9afa`. All three hybrid misses remain present: `aq0615` (toggle a hidden panel) and `aq0901` / `aq0910` (word-order variants asking for a scroll-driven reveal). The maintained private telemetry benchmark, its cloud-embedding comparison, training-query exclusion claims and original generation-to-generation percentages were not independently replayed.

All 40 near-miss and 50 far-OOS cases received hybrid results. This establishes admission on that curated set, not a population false-positive estimate or an observed misuse by an agent. The consumer still sees its original task.

## Small controls with consequential distinctions

- `animate dialog` and `not animate dialog` have exactly equal vectors and identical hybrid rankings: `not` is removed by the shared tokenizer.
- Reversing the two words preserves the mathematical sum and tested ranking, with small float32 rounding differences. Do not call those vectors bitwise equal.
- An unknown word appended to `dialog` contributes nothing. An all-unknown query produces a zero vector and no hybrid result.
- `dialog` and `dialog-qzxwvvunknown` have identical dense vectors through hyphen fallback, but different hybrid rankings because BM25 keeps the hyphenated token. Equal embeddings do not imply equal full-search behavior.
- The frozen receipts' field named `cosine` stores a dot product of near-unit vectors. The all-unknown zero-vector pair has no defined cosine; tiny values above one on other pairs reflect float32 normalization error. The summary preserves this interpretation explicitly rather than changing the original receipts.

## Reproduce

Use Node 24.14.1 and the pinned source checkout. The archive verifier reads members without extracting them. Download the official [registry metadata](https://registry.npmjs.org/modern-web-guidance/1.0.0) and [archive](https://registry.npmjs.org/modern-web-guidance/-/modern-web-guidance-1.0.0.tgz), then verify against an unpacked package:

```sh
python3 measure-package.py /path/package.tgz /path/metadata.json /path/package /path/package-receipt.json
node reproduce.mjs /path/package /path/modern-web-guidance-src /tmp/mwg-replica-01
node reproduce.mjs /path/package /path/modern-web-guidance-src /tmp/mwg-replica-02
node reproduce.mjs /path/package /path/modern-web-guidance-src /tmp/mwg-replica-03
```

Each output directory must be new. No package installation, model API or regeneration of learned weights occurs during these scripts. Telemetry and optional file logging are disabled. No network-egress capture was performed, so this is a code/method statement rather than packet-level proof. Raw execution stdout/stderr and the downloaded archive remain outside Git.

`python3 verify.py` checks the saved results without launching new measurements. Final acceptance verified the six frozen local files, three process receipts, 604 ranking rows, eligible denominators, archive inventory totals and matched-CLI counts. Script syntax, Markdown structure, 72 local links and owned article-evidence links also passed review. No production build was needed for this draft-only change.

The source-informed reference preserves the upstream [MIT license](LICENSE.upstream). See the pinned [embedder](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/static-embedder.ts), [training script](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/train-query-words.ts), [search pipeline](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/search.ts) and [benchmark documentation](https://github.com/GoogleChrome/modern-web-guidance-src/blob/596acbc75a330508591b07cd9e198b219341f619/src/rag/benchmarks/README.md) for provenance. No further benchmark or publication is automatically scheduled.
