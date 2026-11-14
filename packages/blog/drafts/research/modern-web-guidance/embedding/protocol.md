# Static embedding reproduction protocol

November 13, 2026, America/Los_Angeles. This is a separate mechanism investigation after the completed interface study. It does not reopen or replace that study.

## Question and boundaries

Can the released static query embedder be reproduced from its published data formats, does its warm timing fit the reported tens of microseconds, and what does the learned table contribute to retrieval? Distinguish runtime embedding, cold-process search, package size, retrieval relevance and delivered interface behavior.

Use the existing clean source checkout at commit `596acbc75a330508591b07cd9e198b219341f619`, the official npm `modern-web-guidance@1.0.0` archive and its installed package. Verify archive integrity against registry metadata and every installed regular file against the archive. Verify source/package query-table identity. Do not install historical native stacks, call a model API, retrain the word table or claim reproduction of the historical speedup, training process or private telemetry benchmark.

## Fixed measurements

- A separately written reference implementation reads the vocabulary, signed Int8 table and float32 scales. Recreate tokenization, unknown-hyphen fallback, float32 accumulation and normalization. Compare all coordinates against the original source on the public test queries, curated out-of-scope queries and fixed controls. This is source-informed implementation replication, not a blind or independently trained model.
- Three fresh Node processes, run sequentially. Each warms the source embedder with 2,000 queries, then measures 30 batches of 1,000 calls over six task-related short queries. Consume returned coordinates to discourage unused computation. Record all batch averages, process timings and environment. Repeat a length experiment at 1, 4, 16 and 64 distinct known vocabulary entries. Those synthetic length inputs test work scaling, not natural-language quality.
- In each process, measure table initialization and the first embedding separately. Measure 12 fresh CLI search subprocesses over the six short queries with telemetry and optional file logging disabled. Include subprocess startup, corpus loading, ranking and stdout; do not describe a filesystem-cache-warm fresh process as a physical cold boot. No competing study workers; ordinary machine load remains uncontrolled.
- Replay the checked-in **agent test split** and all 90 curated OOS queries against the **packaged corpus**, holding K=10 fixed. Compare original dense-only ranking, original BM25-only ranking, hybrid fusion, and dense-only ranking with a deterministic permutation of whole word-vector/scale assignments (seed `20261113`). The permutation is a destructive control, not a proposed alternative model.
- Relevance uses the upstream pooled qrels, not new human labels: report the fraction of in-domain test queries with at least one grade-2 annotated guide in the top ten. Include orientation guides; this deliberately simple metric is **not** the upstream leaf-only Hit@K. The denominator is in-domain queries with any grade-2 qrel, whether or not that guide survives in the packaged corpus. Report exclusions, absent labels and unjudged returned candidates. An unjudged guide is not established irrelevant. Report OOS admission separately.
- Preserve per-query IDs/rankings and repeatability digests. Compare hybrid results with the official CLI on the 12 timing calls. The private 4,000-query telemetry set and original teacher API baseline remain untested.
- Controls fixed in `cases.json` cover order, removed negation, unknown terms, hyphen fallback and repeated words. Report equivalence or differences; do not infer that the consuming agent loses the original task.
- Measure compressed archive bytes, regular-file bytes, individual generated-table bytes and search/scanner bundle bytes. The historical 507 MB figure is reported upstream, not measured here. Do not divide unpacked historical bytes by compressed current bytes.

Freeze protocol, controls and reproduction scripts before measured runs. Retain failures and disclose necessary harness repairs. Stop when these bounded claims are supported or explicitly limited; write a reviewable article draft afterward. Publication remains a later decision.
