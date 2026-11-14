# Claim and source dispositions

Checked November 13, 2026. The official engineering report was reread in the in-app browser. Runtime and training source were inspected in the clean pinned checkout; the official registry archive was downloaded and integrity-checked. Model2Vec’s official README was consulted for background. No unrelated social replies or private provider datasets were used.

| Claim | Evidence state | Basis | Boundary / disposition |
| --- | --- | --- | --- |
| The short-query runtime is token lookup, weighted row accumulation and normalization | Code-inspected and reproduced | Pinned embedder; separate reference; all coordinate comparisons | Accepted for this release; seven-line accumulation excludes other embedding work |
| Query data has 29,165 rows × 256 signed bytes, plus scales/vocabulary | Inspected and archive-verified | All 280 archive files match installed package; source/query tables match | Accepted; table is trained data, not a replacement for arbitrary model functions |
| Teacher word initialization, query fitting and quantization happen before release | Code-inspected / primary documented | Pinned train-query-words.ts and rag/README.md | Accepted as implementation/provenance description; training, dataset provenance and exclusion fidelity not independently rerun |
| Full guide chunks use teacher vectors; runtime queries use the static table | Code-inspected / primary documented | Pinned search, loader, build/training documentation | Accepted architecture description; no new symmetric-document quality test |
| Roughly 30 µs warm embedding is plausible | Locally reproduced compatible scale | Three processes, 3.46–3.53 µs median batch means on six short queries | Different hardware, query mix and measurement window; no matched 7,500× speedup claim |
| Warm embedding is the same as full CLI search | Rejected | Fresh CLI medians 85.7–86.8 ms; init and import separate | Keep units and clocks next to claims |
| Current official 1.0.0 tarball is 7.1 MB | Not reproduced at tested artifact | Official archive 8,794,985 bytes; file payloads 16,503,129 bytes | Report the measured artifact; historical discrepancy not explained |
| 507 MB old installation versus a current compressed archive gives a compression ratio | Rejected | Upstream labels differ | No normalized historical installation or old-runtime rerun |
| Learned word assignments matter to known-answer retrieval | Reproduced mechanism control | Fixed permutation: dense 499/504 → 18/504 with same loop and corpus | Known pooled labels, many unjudged candidates, one destructive seed; not a competing retriever |
| Hybrid gives a known grade-2 hit on 501/504 eligible public test queries | Replayed | Fixed K=10, upstream qrels; all rows retained | Includes orientation guides, differs from upstream leaf metric; no independent human relabeling or private telemetry benchmark |
| Nonempty search reliably establishes in-domain intent | Counterexample on curated public set | Hybrid admitted all 90 OOS queries; all-unknown control empty | No representative population estimate or observed downstream misuse |
| Word order, removed negation and unknown terms retain contextual meaning | Counterexamples / inspected limits | Fixed controls and tokenizer | Word-order vectors can differ through float32 rounding; original task still visible to agent |
| Equal dense vectors imply equal hybrid results | Rejected | Unknown-hyphen control has same dense vector, different keyword ranking | Test complete search in addition to vectors |
| Better retrieval generally improves delivered code | Not established | Separate primary interface study: baseline18/18, skill18/18, supplied16/18 | Six selected fixtures, one model, ceiling; observed native-dialog simplification is narrower |

All three measured processes completed without a reproduction failure. The frozen receipt field `cosine` is a unit-vector dot product: it is not a defined cosine for zero vectors, and float32 norm error can produce values slightly above one. The result summary records this interpretation; frozen scripts and receipts remain unchanged.
