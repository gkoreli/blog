# Reproduce the C and state-model checks

The supplied tool lock targets macOS ARM64, Python 3.12+ and a C compiler. The checked run used Apple clang 21.0.0, CBMC 6.11.0, Z3 4.15.4, TLC 2.19 (tools v1.7.4), and Temurin JRE 21.0.13+9. Solver/library/compiler correctness is outside these proofs. Other platforms need native tool packages and new evidence.

## Proofs and model checking

From this directory, choose fresh disposable directories:

```sh
python3 bootstrap-tools.py --out /tmp/dvb-tools
python3 check-series.py
python3 verify.py --tools /tmp/dvb-tools --out /tmp/dvb-proofs
```

The tool bootstrap was exercised from fresh downloads; its CBMC, Java, Z3 and TLC binaries match the checked installation byte-for-byte. The tool bootstrap verifies the pinned downloads' SHA-256 hashes before extraction/installation. TLC opens a local Java management socket; a sandbox may need to allow that local operation. The runner fixes TLC's seed, fingerprint polynomial and worker count. Raw logs and solver counterexamples are in the selected output directory; `formal-results.json` records accepted exit codes, durations, commands, compact summaries and log hashes. Success requires all obligations, explicit reachability controls and expected mutation/model counterexamples. Timeouts stop the process group and fail the run.

`generate.py` extracts the exact helper bodies from `hardened.c`, checks that they are unchanged from the earlier optimization, and records hashes. `reduced.h` explicitly changes the palette domain from 256 to three; it does not establish a 256-color theorem. The `AV_RN64` shim uses `memcpy` to implement its documented unaligned native-read semantics. CBMC's library models of `memcpy`/`memset` are trusted; this is not a proof of those libraries or FFmpeg's architecture-specific load implementations.

| C obligation | Exact scope |
|---|---|
| `rle.c` | Extracted helper versus the old fill-loop semantics; capacity 0–16, starting position 0–capacity, run 0–284, color 0–255; all initial bytes. Compare complete buffer, pointer advancement and pixel count. Run length 284 covers the readers' maximum decoded run. Does not prove the bit readers' input consumption. |
| `block.c` | Exact extracted eight-pixel predicate versus scalar neighbor equality; all 240 bits in a three-row, ten-byte window; positive/negative stride. |
| `bounds.c` | Guard arithmetic for widths/heights up to 1,310,720, valid interior x/y. Storage validity, representable stride arithmetic and nonaliasing remain preconditions. |
| `arithmetic.c` | Full bounded integer ranges for run clipping, score update and 64-bit numerator/division. Requires boundary count 1–1,310,720 and outside+selected+new adjacency ≤ four times that count. Establishing this invariant for every bitmap remains the mathematical argument. |
| `statistics.c` | Extracted collector with a three-color domain, every 2×2 bitmap; compare boundary, outside and off-diagonal adjacency counts against an independent definition, plus symmetry. The wide loop is not entered here. |
| `ordering.c` | Extracted scorer with three colors, boundary counts 0–3, outside/edge counts 0–7, symmetric matrix and total score contributions ≤ four times boundary count. Compare complete order/count against recomputed scores, including absent colors, integer division and ties. |
| `copy.c` | Source-bound slices of the unchanged palette-copy statements; all 1,024 output-byte positions, initial palette bytes, 4/16/256 colors, both branches. Allocations/cache computation are outside the slice. |

All seven checks enable bounds, pointer, signed-overflow, conversion and loop-unwinding assertions. Reachability runs separately show the assumptions admit a completed execution. Three mutants must fail an equivalence assertion: run length +1, omitted upper-neighbor comparison, and non-strict tie comparison. These controls reduce harness mistakes; they do not prove that the specifications capture every intended requirement.

A 3×3 statistics attempt timed out at 180 seconds; a broader ranking attempt was stopped without a result. The accepted smaller domains are explicit above. No unsuccessful attempt is counted as a proof.

## TLA+ models and their C link

`PaletteCache.tla` models one region, three bitmap revisions, palette arrival/removal, reset, output construction and failure. Four configurations check the real modes -2, -1, 0 and 1. It follows the `has_computed_clut` invalidation at the end of `dvbsub_parse_pixel_data_block` and the selection/cache branches in `save_subtitle_set`. `compute_clut=-2` deliberately preserves the first palette across pixel updates. The naive always-fresh invariant must fail for that mode; that counterexample is expected behavior, not a defect. Output policy, conditional freshness, cache ordering and absence of partial output pass in their finite models.

`OutputFailure.tla` models the four allocations needed for one output rectangle, cleanup, saver return, caller return, decoder return and page-version commitment. Route values correspond to explicit display end, page output (`compute_edt=1` with a prior timestamp), and emulated display end. Before the fix, page/end wrappers discard saver errors; the outer decoder status is shadowed, and the fallback ignores its return. The model abstracts those statements to the return transitions. Every legacy route must produce a failure-reporting counterexample; every fixed route must pass. The page path commits its version only after output succeeds.

This correspondence is inspected and backed by native tests; there is no machine-checked refinement relation from the full C decoder to TLA+. Multiple regions, full input grammar, timestamp arithmetic, concurrent calls and every allocation site in FFmpeg are outside the models. These are finite safety checks, not a liveness proof or all-state theorem.

## Fresh decoder, faults, sanitizers and benchmarks

Copy the whole `repro` directory to a disposable location, then:

```sh
cd /tmp/dvb-repro/baseline
python3 bootstrap.py
python3 bootstrap.py --sanitized
cd ../formal
python3 decoder.py --baseline ../baseline --san-repo ../baseline/ffmpeg-san --out /tmp/dvb-decoder
# Wait for proof/build jobs to finish before timing.
python3 benchmark.py --baseline ../baseline --decoder-out /tmp/dvb-decoder --out /tmp/dvb-benchmarks
```

The baseline bootstrap fetches the exact FFmpeg commit, verifies the public FATE sample hash, configures the minimal codec/demuxer/muxer set, generates 176 packets with FFmpeg's own encoder, and builds the comparison variants. The normal bootstrap was exercised from a fresh checkout during this stage. The sanitized decoder checks used the earlier separately configured, fully instrumented checkout; a second fresh sanitizer bootstrap was not repeated.

`decoder.py` rebuilds both object **and archive** after source replacement, runs normal/sanitized FATE, compiles the native failure harness, and compares real/generated outputs against freshly executed upstream decoders in all four modes. Its 27 fault/retry/header checks include four output allocation points across three routes, retries on the same context, an inner-parser error, and short page/CLUT headers. Baseline and upstream negative controls must fail. The source include intercepts only allocation calls inside `save_subtitle_set`; it does not replace FFmpeg's global allocator or exhaust the machine.

The benchmark uses identically compiled wrapper sources, process CPU time, rotating order and raw samples/medians. It compares merged upstream, the prior optimization, and the hardened candidate. It records binary/input hashes and compiler/platform metadata. Timing is empirical, affected by the host and workloads; passing proofs cannot establish a universal performance ratio. Do not run timed jobs alongside this suite's solvers/builds.

The earlier differential palette/RLE harnesses and scripts are preserved under `baseline/`. Their historical results remain separate; the new error/header fixes leave the palette and RLE helpers byte-identical. The generated corpus contains 176 constructed packets, not a representative collection of broadcast traffic.

## Review artifacts

The three baseline optimization patches followed by `04-output-errors.patch` and `05-short-headers.patch` reproduce `hardened.c` byte-for-byte. `check-series.py` verifies that and emits `candidate-hardened.patch`. Treat the robustness fixes as separate behavior changes: they return errors for allocation failures/short headers which the reference could accept. Valid-sample output equivalence is a different claim.

See [the worklist](../../00-worklist-index.md) and [formal findings](../../02-formal-verification.md). No upstream submission or article publication is implied by these local checks.
