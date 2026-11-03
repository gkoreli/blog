# Source claim and earlier experiments

Captured November 3, 2026 (America/Los_Angeles). These results preceded the machine-checking stage and are preserved rather than silently replaced by reruns.

## What the original contribution established

Romain Hédouin's [post](https://x.com/RomainHedouin/status/2117405081599377748) points to an optimization in FFmpeg's optional DVB subtitle palette reconstruction. [PR 25687](https://code.ffmpeg.org/FFmpeg/FFmpeg/pulls/25687) was merged November 2 as [a1a7737](https://github.com/FFmpeg/FFmpeg/commit/a1a7737c4bcace8615f70b8f2cc7fc515ca26522). It maintains running scores instead of recomputing contributions from all already-selected colors. The score-selection phase changes from cubic to quadratic in the palette-size bound; it does not make all FFmpeg decoding quadratic or 61 times faster.

The PR's 1.1×–61× numbers concern the function's tested cases. Its whole-decoder forced-reconstruction FATE case went from 2.1 to 0.83 seconds; the default FATE case stayed at 1.77 seconds. These are the author's reported measurements, not ours. Default decoding often has a transmitted palette and never enters the optimized path.

The author's [October 17 workflow description](https://x.com/RomainHedouin/status/2111574153920745816) describes many small-model searches, stronger-model filtering/implementation/testing, adversarial sessions and line-by-line human review. His [follow-up](https://x.com/RomainHedouin/status/2111579871017337028) describes narrow search patterns such as invariant assignments in loops and inefficient nested logic. This supports a general discovery method; we do not have the exact search transcript for this patch or a measured filtering success rate.

## Our saved experiment

The pinned checkout is `aab6cec3e8415154b3f0570f8d131db07a9901de`; its decoder file matches the merged optimization. The earlier baseline experiment is preserved under [repro/baseline](repro/baseline/results.txt), including sources, sequential patches, scripts, hashes and timing samples.

The first small patch skips pixels whose four neighbors have the same color: their only adjacency updates are diagonal values which are later discarded. The broader candidate counts boundaries directly, orders only present colors, skips eight proven-interior pixels using FFmpeg's native unaligned reads, bounds unsuccessful block probing, clips ten RLE fill loops through one helper, and avoids a palette copy overwritten in full. The scratch matrix remains inline and is one row smaller. No independent speedup was established for the RLE cleanup.

| Historical forced-reconstruction real sample | Median CPU seconds, 100 complete passes / seven rotating rounds |
|---|---:|
| Author's merged version | 0.669766 |
| Our initial boundary skip | 0.175428 |
| Broader candidate | 0.155102 |

That is 4.318× against merged upstream and 1.131× against our initial patch. The constructed 176-packet corpus gave 6.545× in forced mode and 5.383× in mixed default mode. The real sample's default mode and corpus never-compute mode showed no established benefit. One ARM64 host, constructed inputs and selected code paths cannot establish a universal gain.

The earlier 59,278 palette cases and 876,432 RLE cases include byte equivalence and sanitizer runs. Whole-decoder normal and sanitizer runs compared the public sample and generated packets in four modes. These are finite tests, not proof of all-input correctness.

A rejected lazy-allocation prototype exposed a reason to inspect stateful failure paths: existing callers could swallow allocation errors. It remains excluded. The accepted candidate does not add allocation sites. The current stage fixes those legacy failures separately.

## Sources used for the implementation and verification

- [ETSI EN 300 743 V1.6.1](https://www.etsi.org/deliver/etsi_EN/300700_300799/300743/01.06.01_60/en_300743v010601p.pdf), especially object pixel data, non-modifying color and default CLUT behavior. The greedy reconstruction is FFmpeg's heuristic, not an ETSI-mandated algorithm.
- [Pinned FFmpeg decoder](https://github.com/FFmpeg/FFmpeg/blob/aab6cec3e8415154b3f0570f8d131db07a9901de/libavcodec/dvbsubdec.c), [native-read helpers](https://github.com/FFmpeg/FFmpeg/blob/aab6cec3e8415154b3f0570f8d131db07a9901de/libavutil/intreadwrite.h), and [decoder option documentation](https://github.com/FFmpeg/FFmpeg/blob/aab6cec3e8415154b3f0570f8d131db07a9901de/doc/decoders.texi).
- [CBMC manual](https://diffblue.github.io/cbmc/man/cbmc.html), for bounds, unwinding, SMT solvers and coverage. [CBMC project](https://github.com/diffblue/cbmc) supplies tool implementation and releases.
- [TLA+ tools](https://github.com/tlaplus/tlaplus), [pinned tools release](https://github.com/tlaplus/tlaplus/releases/tag/v1.7.4), and [TLC model-checking guidance](https://nightly.tlapl.us/doc/model/tlc-options-page.html). The model is an abstraction, not automatically a proof of the C implementation.
- [Clang AddressSanitizer](https://clang.llvm.org/docs/AddressSanitizer.html), [UndefinedBehaviorSanitizer](https://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html), and [LLVM benchmarking guidance](https://www.llvm.org/docs/Benchmarking.html). Sanitizers observe executed paths; timings remain empirical.
