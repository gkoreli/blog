# Upstream contribution preparation

No upstream PR has been submitted. Local evidence and patch preparation are complete for the bounded checks recorded in [the findings](02-formal-verification.md); maintainer review, additional real broadcasts and other runtime architectures remain separate work.

## Current recommendation: one palette function

The [17-line patch](repro/scoped/candidate.patch) is now the preferred performance contribution. [Research 04](04-native-comparisons-and-smaller-scope.md) supersedes the broader scope described below. It leaves scratch layout, scoring, cache state, RLE and error paths unchanged and uses standard byte comparisons to skip proven-interior work.

Proposed title: `avcodec/dvbsubdec: skip uniform palette-reconstruction work`.

Proposed description: Interior pixels contribute only diagonal counts discarded before ordering. Skip sixteen pixels when bounded byte comparisons prove all neighbors match, attempting the batch only after the scalar interior test succeeds. Return the existing rank-zero result directly for a compact uniform bitmap. Preserve the original matrix, score recurrence, tie handling and unselected palette entries.

The real forced-reconstruction FATE workload is 4.989× faster than merged upstream and has 1.173× the previous larger candidate's throughput. The generated forced corpus is 6.024× faster than upstream, but 7.8% slower than the larger candidate. The supplied-CLUT real default median is 2.65% slower than upstream in this run, and checkerboards have a small isolated-function cost. Include those limits and [the raw samples](results/scoped-benchmarks.json); no universal speedup or default-neutrality claim.

Validation: 96,758 normal/sanitized differential cases, full normal/sanitized FATE, all four modes on real/generated packets, explicit bounded C checks/mutations and finite traversal models. The independent robustness patches apply and retain their 27 passing regressions, but stay outside this performance PR. Recheck upstream and independent quiet-host/default-path evidence before submission. No upstream contribution has been posted.

## Earlier patch organization

The [reproduction README](repro/formal/README.md) documents the five sequential patches. The [combined patch](repro/formal/candidate-hardened.patch) is a convenience; `check-series.py` verifies the series produces the exact [final source](repro/formal/hardened.c).

Keep optimization and bug fixes separately reviewable:

1. Count palette boundaries and order present colors, with bounded native-word interior skipping.
2. Replace repeated clipped RLE fill loops with the shared native fill helper.
3. Avoid the palette copy that the computed-palette branch fully overwrites.
4. Propagate subtitle-output failures through explicit end, page and emulated end paths; clear the output flag during failure cleanup; preserve the page version/timeout when output fails.
5. Reject page/CLUT segments shorter than their two-byte headers.

The latter two change failure behavior intentionally. They are pre-existing defects reproduced against merged upstream, not output-equivalence optimizations. Present them as focused bug fixes, potentially separate submissions from the performance changes. The lazy workspace prototype is excluded. The [four-line boundary alternative](repro/formal/small-boundary-alternative.patch) preserves the initial smaller experiment; it is an alternative to the broader palette refactor, not a sixth patch to apply on top. Its historical measurement and sources remain separate from the hardened candidate.

## Earlier broader optimization description

Palette reconstruction currently counts edges for every pixel and scans every palette index during selection. Count only boundary contributions, initialize adjacency rows as needed, order present colors in ascending index order, and skip eight interior pixels when native reads prove their neighbors match. Keep the score recurrence, integer rounding, strict tie comparison and palette writes unchanged.

A public FATE sample and 176 generated packets match upstream output in all four `compute_clut` modes. Boundary/score helpers have explicitly bounded CBMC checks; the wide predicate and arithmetic obligations have broader symbolic domains. The error/cache TLA+ models are abstractions backed by native regressions, without a checked C-to-model refinement proof. Include the current benchmark medians and conditions from [the benchmark receipt](results/benchmarks.json), and state that default decoding of the real sample shows no established benefit.

## Independent robustness description

`save_subtitle_set` can fail after setting `got_output`. Its callers discard the status, an inner `ret` shadows the decoder status, and the emulated-end path ignores its result. Return construction errors to the caller, clear the output flag during allocation cleanup, and avoid marking a page version consumed before output construction succeeds. Separately require both bytes of the page/CLUT headers before parsing them.

Native allocation injection tests four output allocation points across all three routes, followed by same-context retries. Additional cases exercise an inner-parser error and each short header. All 27 checks pass for the fix, while the merged upstream negative control fails. Full normal and sanitized FATE plus successful-packet byte comparisons pass. This does not establish correct behavior for every malformed DVB input or allocation site.

## Remaining delivery

- Recheck current upstream before submission; the pinned baseline does not prove today's head is unchanged.
- Decide with the review evidence whether to submit the small boundary skip first or the broader refactor, and keep robustness fixes separate.
- Run on another architecture and add more real subtitle samples where available.
- Submit through FFmpeg's supported contribution route with its required identity/sign-off; preserve patch hashes and subsequent maintainer feedback here.
- Develop the engineering article from the worklist and exact prompts. Do not describe a local patch as merged, accepted or deployed.
