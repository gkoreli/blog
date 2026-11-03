# Native comparisons and a smaller palette-only contribution

November 3, 2026 (America/Los_Angeles). Goga requested further authoritative reading and iteration while keeping the upstream contribution concise. The preferred performance patch now adds **17 lines and removes one**, entirely inside `compute_default_clut`. The earlier broad refactor, row-layout experiments, RLE cleanup and robustness fixes remain inspectable evidence rather than being silently discarded.

## What the sources changed in the design

[FFmpeg's pinned developer guidance](https://github.com/FFmpeg/FFmpeg/blob/aab6cec3e8415154b3f0570f8d131db07a9901de/doc/developer.texi) specifies C11 and small self-contained patches, with functional and cosmetic changes kept separate. Its SIMD/DSP guidance and existing [native read helpers](https://github.com/FFmpeg/FFmpeg/blob/aab6cec3e8415154b3f0570f8d131db07a9901de/libavutil/intreadwrite.h) favor portable primitives over introducing a dispatch layer for this patch. The public upstream HEAD was checked and still matches our pinned baseline; [receipt](results/scoped-upstream-head.json).

[WG14 N1570, §7.24.4.1](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf#page=383) defines `memcmp` as byte comparison. These objects are pixel-byte arrays, not structs with padding. Shifted overlapping read-only ranges are permitted; this function does not require nonoverlap. The [C++ draft's `<cstring>` specification](https://eel.is/c++draft/c.strings) gives these functions the C library's meaning. Our design inference is that a C++ conversion adds no primitive needed here: C11 already expresses the comparison.

Apple clang 21 lowers the fixed-size predicate to inline paired scalar loads/comparisons for ARM64 and SIMD comparisons for an x86-64 cross-target, without comparison-function calls in either tiny predicate. [ARM64 output](results/scoped-predicate-arm64.s), [x86 output](results/scoped-predicate-x86_64.s). This is inspected output, not a promise about every compiler or the whole decoder. The x86 target was compiled, not executed. No handwritten ISA code or dependency is added.

[Lamport's safety/refinement notes](https://lamport.org/tla/proving-safety.pdf), especially Part II, distinguish observable behavior from implementation steps. That distinction helps us model a sixteen-pixel batch as covering the same indices as sixteen scalar steps while changing no retained counts. Our model checks traversal; the C predicate checks that omitted contributions are zero. Their correspondence is inspected, not a machine-checked refinement from the full C decoder.

## What we rejected

The screens compare real/generated output bytes in all four modes. Their three-round timings select candidates; they are not the final benchmark. [Initial](results/scoped-screen.json), [transposed layout](results/scoped-transpose.json), [sparse rows](results/scoped-sparse.json), and [division guard](results/scoped-division.json) preserve raw samples. The early transpose screen overlapped a brief build and is provisional. The published experiment generator reproduces the screened sources exactly; [hashes](results/scoped-variant-hashes.json).

Whole-bitmap uniform detection is useful for constructed flat images. The public sample contains 66 rectangles of 720×36 pixels, with **zero uniform rectangles and zero wholly uniform-neighborhood interior rows**. [Profile receipt](results/scoped-sample-profile.json). Whole-row comparisons therefore add overhead without helping that sample. Larger blocks lose opportunities; stopping after two misses loses blank spans later in a subtitle row. A division guard was retested from the initial experiment without an established useful gain, so it is omitted.

A row-owned histogram and first-use clearing looked attractive in the decoder screen: 33 added lines / 12 removed, no new allocation. But the [pattern screen](results/scoped-rejected-row-micro.csv) exposes large random-image slowdowns, reaching about **29% above upstream**. The decoder screen alone would have hidden them. That version is rejected despite its real-sample gain; its [whole-decoder](results/scoped-rejected-row-benchmarks.json), [machine checks](results/scoped-rejected-row-checks.json), and [scratch-model counterexample](results/scoped-rejected-scratch-counterexample.txt) remain available.

## Selected patch

The simpler design attempts a wide comparison **only after the existing scalar neighbor test establishes an interior pixel**. Random boundary pixels never enter it. The original matrix, clearing, score recurrence, tie handling and palette-writing suffix remain byte-identical. No helper, private-field change, allocation, cache flag, RLE modification or error-path change is included. [Patch](repro/scoped/candidate.patch), [source/scope checks](results/scoped-source.json).

A compact uniform bitmap has only one selected color, whose rank-zero palette entry is zero. A shifted whole-buffer comparison recognizes that case and writes exactly that entry, preserving every other palette byte. Scratch is unobservable on return; any later ordinary computation still performs the original full clear.

For an interior block at `p`, comparing 17 bytes at `p-1` and `p` proves equality across 18 horizontal pixels, including both endpoint neighbors. The two 16-byte vertical comparisons prove all target pixels match above and below. Thus all sixteen are interior and contribute only diagonal counts which the original algorithm discards. The scalar interior test already excludes every outside-edge sentinel, so it also establishes the row/column bounds needed for those comparisons. The remaining-width guard keeps the right endpoint in its row. `x += 15` plus the original loop increment advances exactly sixteen pixels.

This preserves the scoring algorithm rather than replacing it with a cleaner implementation that would need a new general ranking-equivalence proof. The existing algorithm's correctness/conformance is not established by leaving it unchanged; the claim is equivalence of these local transformations under valid-bitmap/storage preconditions.

## Validation and verification limits

Normal and ASan/UBSan differential runs pass **96,758 bitmap cases**, comparing complete palettes and active histogram entries except on uniform early returns. Cases include exact buffers, block thresholds, padding, negative strides, all 256 uniform colors, near-uniform mutations, poisoned scratch and sequential reuse. The full decoder and libraries pass normal/sanitized FATE and public/generated comparisons in all four modes. The two robustness patches apply independently after this patch; their integration also passes output comparisons, FATE and all 27 fault/retry/header checks. [Decoder receipt](results/scoped-decoder.json).

[Machine checks](results/scoped-checks.json) cover every byte pattern in the fixed block window, inferred guard arithmetic over the decoder's pixel bound, and a bounded complete-call domain: all sixteen pairs of two-color, two-pixel bitmaps, with arbitrary initial scratch/palette and either stride direction. Each positive obligation has a reachable-completion control. Omitting the upper comparison or shortening 17 bytes to 16 must fail an equivalence assertion. [Exact domains and commands](repro/scoped/README.md).

The finite traversal model checks ten widths across the batch threshold and proves the visited prefix has no gap or duplicate. A 17-step advance instead of 16 produces [the expected counterexample](results/scoped-coverage-counterexample.txt). The earlier cache/failure models remain separate; this patch changes neither flow.

Two fully symbolic call attempts timed out at 180 seconds. A shared-union adapter also produced a byte-copy counterexample; replacing it with production-like separate structs and decomposing the tiny input domain made the intended checks pass. We classify neither adapter output as a decoder defect nor a confirmed solver bug. The guard harness initially allowed indices outside the decoder loop invariant; restoring that precondition removed its spurious overflow case. These diagnostics reinforce that proof adapters and assumptions need review too.

## Performance acceptance

The selected pattern screen removes the rejected version's large random-image slowdown: tested 4/16/64-color random cases improve against upstream. It still has costs: 256-color noise is roughly unchanged or slightly slower, and checkerboards are about **2–5% slower** in this isolated function screen. The previous larger refactor remains faster on several constructed patterns. [All 24 cases](results/scoped-micro.csv). No all-input performance-neutrality claim is accepted.

The final whole-decoder run uses nine balanced rotating rounds, process CPU time and matching wrapper flags, with no proof/build jobs running. [Raw samples and hashes](results/scoped-benchmarks.json).

| Workload | Passes / rounds | Upstream CPU s | Previous broad candidate | Selected 17-line patch | Upstream / selected |
|---|---|---:|---:|---:|---:|
| Real sample, forced reconstruction | 200 / 9 | 1.295233 | 0.304595 | 0.259612 | 4.989× |
| Generated corpus, forced | 20 / 9 | 1.655132 | 0.254784 | 0.274747 | 6.024× |
| Generated corpus, default mixed CLUT availability | 20 / 9 | 0.847300 | 0.156579 | 0.166855 | 5.078× |
| Real sample, default supplied CLUT | 3,000 / 9 | 0.873627 | 0.890913 | 0.896788 | 0.974× |
| Generated corpus, never reconstruct | 20 / 9 | 0.058021 | 0.057017 | 0.058099 | 0.999× |

The small patch has 1.173× the previous candidate's throughput on the real forced path (14.8% less CPU time). It is 7.8% slower than that candidate on generated forced decoding and 6.6% slower on generated default decoding. This is a scope/performance tradeoff, not an across-workload improvement over the larger refactor.

The default real-sample median is 2.65% above upstream, while this sample does not invoke reconstruction in that mode. The mechanism is unestablished; compiler layout and host variation are possible explanations, not findings. Default-path neutrality remains unaccepted. Keep a quieter independent host/architecture check before any broad performance claim or upstream submission.

The preferred review scope is this one-function patch, with the uniform and interior-count arguments, real/generated output checks and benchmark receipt. The 27-check robustness fixes remain separate submissions. The earlier matrix-layout candidate is rejected, and the old broad candidate remains available if reviewers prefer its constructed-workload tradeoff. Uniform-image function peaks must not be presented as general FFmpeg speedups. Runtime evidence remains ARM64-only. No upstream submission or article publication is claimed.
