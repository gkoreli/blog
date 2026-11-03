# Machine checks, state models and decoder fixes

November 3, 2026 (America/Los_Angeles). The earlier [equivalence argument](repro/baseline/proof.txt) remains a conditional mathematical argument. This stage adds checked obligations and finite state models; it does not turn the whole decoder into an all-input, all-platform proof.

## C checks

Seven obligations passed CBMC with bounds, pointer, signed-overflow, conversion and unwinding assertions enabled. Each has a separate reachable-completion control. [The exact domains](repro/formal/README.md#proofs-and-model-checking) distinguish full-range arithmetic from reduced palette domains. [The result receipt](results/formal-results.json) records commands, exits, times, compact properties and raw-log hashes.

The strongest direct helper results are the clipped fill and eight-pixel predicate: the fill agrees with the original loop over every allowed state of a 16-byte buffer and every reader run length; the native-word predicate agrees with scalar neighbor equality for all byte patterns in the checked window and either stride direction. Guard and score arithmetic range over the decoder's pixel bound under explicit valid-storage and statistics invariants. The copy slice checks every output-byte position and all three palette sizes.

The collector and greedy ordering checks deliberately reduce the palette domain to three colors. The collector covers every 2×2 bitmap. Ordering covers symmetric nonnegative edge matrices under the documented small count bounds, including ties and absent colors. These checks do not prove the full 256-color implementation for every valid rectangle; that general argument remains mathematical, backed by the prior larger differential suite. A 3×3 attempt timed out after 180 seconds and a broader ranking attempt was stopped without a result. They are not successes.

Three deliberately wrong variants are rejected by an equivalence assertion: fill one extra byte; omit the upper-neighbor comparison; select the later color on ties. Their failure is part of the acceptance gate. Reachability/mutation checks improve confidence in the harness; they cannot establish that every intended property has been specified.

## Stateful findings and fixes

The TLA+ palette model checks -2, -1, 0 and 1 over one region and three revisions, with palette arrival/removal, reset and output construction. The ordinary freshness invariant is conditional on the selected mode. An always-fresh invariant fails for -2 because compute-once intentionally reuses its cached palette after pixel changes. That trace is documented expected behavior, not a cache bug. [The public trace](results/tlc-cache-once-naive-counterexample.txt) helps keep the mode's contract visible.

The output-failure model reproduces the legacy concern identified during the earlier lazy-workspace inspection: start output, fail an allocation, clean up rectangles, discard the saver status, return success while the output flag remains set. [Its counterexample](results/tlc-output-false-end-counterexample.txt) has a corresponding native C reproducer. End/page wrappers discard the saver return, the decoder shadows its outer `ret`, and the emulated display-end call ignores its result.

The separate [error-propagation patch](repro/formal/04-output-errors.patch):

- clears `got_output` on allocation cleanup;
- returns failures through explicit display end, page output and emulated display end;
- removes the decoder status shadow;
- commits page version/timeout after successful prior-output construction, preserving retryability after failure.

Native tests also demonstrate that page and CLUT parsers accept payloads shorter than their two-byte headers. The separate [header patch](repro/formal/05-short-headers.patch) rejects them before reading the second byte. This is a logical segment-boundary check; the padded decoder packet API means acceptance alone is not proof of an exploitable out-of-allocation read.

All 27 native checks pass: four allocation points across three routes, a retry after each, an inner-parser error and both short headers. Negative controls against the original merged decoder and the earlier optimization fail as expected. Normal and fully instrumented ASan/UBSan decoder builds pass FATE and compare byte-for-byte with merged upstream on the public sample plus 176 generated packets, across all four palette modes. [Decoder receipt](results/decoder-results.json).

Every fixed error-model route passes; every legacy route produces the expected counterexample. This remains a finite abstraction with inspected C correspondence and native tests, not a checked refinement proof. One-region allocation models do not cover every multi-region failure, timestamp edge case, malformed stream or allocator in FFmpeg. No lazy allocation was introduced.

## Reproduction and performance

[The reproduction instructions](repro/formal/README.md) pin source and tool downloads, extract functions from the actual candidate, check the five-patch series, require negative controls, separate raw output from public summaries, and preserve benchmark samples. A fresh normal bootstrap from the pinned public commit succeeds. The sanitizer checkout was separately rebuilt with full instrumentation; its original configuration was reused, rather than claiming a second fresh sanitizer bootstrap.

The fixes deliberately change failure behavior; successful decoded output remains equivalent on the checked fixtures. The final run with matching wrapper flags records these medians (CPU seconds):

| Workload / mode | Merged upstream | Optimization | Hardened | Upstream / hardened |
|---|---:|---:|---:|---:|
| Real sample, forced, 100 passes / 7 rounds | 0.688275 | 0.157394 | 0.156070 | 4.410× |
| Generated, forced, 10 passes / 5 rounds | 0.850931 | 0.130114 | 0.128516 | 6.621× |
| Generated, default, 10 passes / 5 rounds | 0.440251 | 0.079505 | 0.078918 | 5.579× |
| Real sample, default, 1,000 passes / 7 rounds | 0.304311 | 0.308677 | 0.309430 | 0.983× |
| Generated, never compute, 10 passes / 5 rounds | 0.029603 | 0.029907 | 0.029369 | 1.008× |

The forced/mixed cases support a substantial gain on these workloads. The last two do not establish a benefit; the real default median is about 1.7% slower. That is a review concern, not evidence of performance neutrality. [The initial short run](results/benchmarks-initial.json) used the same optimization level but an extra wrapper compile define for the hardened program; the final run matches those flags and supersedes it for direct comparison. No timing receipt is deleted.
 Timing remains a separate empirical claim. [Current benchmark samples](results/benchmarks.json) and [the longer default-path control](results/benchmarks-default-long.json) remain separate. The latter uses 10,000 passes and nine rotating rounds: upstream median 3.201101 seconds, optimized 3.331652, hardened 3.259399. The hardened median is 1.8% above upstream, while individual runs vary far more (upstream 2.995–4.072 seconds, hardened 3.021–3.845). This is inconclusive about a small default-path cost; default-path performance neutrality is not accepted. Do not hide that limit behind the forced-path speedup. Historical medians remain [in the baseline record](01-source-and-baseline.md), with their original conditions.

## Remaining limits

The exact 256-color ranking and collector do not have a general machine-checked proof here. The C memory model, standard-library models, AV_RN64 contract, solver and compiler are trusted. Runtime evidence is ARM64-only. More real subtitle samples, another runtime architecture and independent maintainer review remain useful. No upstream PR is submitted and no article is published.
