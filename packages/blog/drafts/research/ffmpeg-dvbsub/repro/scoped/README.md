# Smaller palette-only optimization

The selected patch adds 17 lines and removes one in `compute_default_clut`. The matrix, initialization on the ordinary path, score formula, ordering, palette loop, decoder state, allocations and RLE readers remain unchanged. This replaces the proposed broad performance refactor as the preferred upstream review scope. The independently tested robustness fixes remain separate.

## Reproduce

Use Python 3.12+, clang and the pinned verification tools from [the earlier tool lock](../formal/tool-lock.json). Bootstrap a disposable copy of [the baseline](../baseline/bootstrap.py); the FFmpeg commit is `aab6cec3e8415154b3f0570f8d131db07a9901de`. Supply separate configured normal and fully sanitized checkouts. No script should write into a live site checkout/build directory.

```sh
python3 ../formal/bootstrap-tools.py --out /tmp/dvb-tools
python3 generate.py --out /tmp/dvb-local
python3 native.py --out /tmp/dvb-local --repo /tmp/dvb-baseline/ffmpeg
python3 checks.py --out /tmp/dvb-local-proofs --tools /tmp/dvb-tools
python3 decoder.py --out /tmp/dvb-local-decoder --baseline /tmp/dvb-baseline \
  --repo /tmp/dvb-baseline/ffmpeg --san-repo /tmp/dvb-baseline/ffmpeg-san
```

`generate.py` checks that only `compute_default_clut` changes and that its entire scratch/scoring suffix stays byte-identical. It emits the source, patch and hashes. The checked [patch](candidate.patch) is exactly that generated patch. `profile.py --dump /tmp/dvb-local-decoder/ref-real-1.bin --out /tmp/profile.json` reproduces the uniform-rectangle/row counts from the real-fixture dump.

The normal and sanitizer configurations follow the earlier baseline bootstrap; this stage reused those configured isolated checkouts, rather than claiming another fresh platform/bootstrap.

`native.py` creates the pinned checkout include link needed by the optional microbenchmark and extracts the actual function and tests 96,758 cases in normal and ASan/UBSan builds. It compares complete palettes and normalized active histogram entries, with arbitrary initial palette bytes, poisoned/reused scratch, exact-size buffers, widths 1–70, padding, negative strides and all 256 uniform colors. Uniform early returns deliberately do not materialize scratch statistics, so those compare the palette rather than scratch. Pinned upstream is the reference, not a new interpretation of DVB color semantics.

`decoder.py` builds the palette-only patch and an integration with the two separate robustness patches, in normal and sanitizer checkouts. It removes both codec object and archive before every rebuild, runs FATE, compares the real and 176 generated packet fixtures in all four modes, and runs all 27 fault/retry/header checks on the integration. It restores source files afterward; generated object/archive files may still belong to the last variant, so subsequent builders must rebuild rather than trust timestamps.

## Exact machine-check domains

- The C block predicate covers every byte pattern in three 18-byte rows and either stride direction. It checks equivalence to sixteen scalar four-neighbor tests, with bounds/pointer checks. `memcmp` is modeled according to its library contract; its machine implementation and compiler are trusted.
- Guard arithmetic covers valid loop positions and dimensions whose product is at most 1,310,720. The scalar interior predicate implies that none of the four neighbors is outside, because outside is encoded as zero and real colors as 1–256. The proof checks those inferred bounds before using the wide comparisons. Valid distinct bitmap/palette/scratch storage and representable row-stride arithmetic remain preconditions.
- Complete-call equivalence uses two colors and a 2×1 bitmap, twice on reused contexts. All sixteen pairs of bitmap patterns are separate solver obligations, with arbitrary initial scratch/palette and independent positive/negative stride choices. The full function is extracted, with the palette bound explicitly reduced from 256 to two; this is not a general 256-color theorem.
- Every positive C obligation has a reachable-completion control. Two mutants must fail: omit the upper-row comparison; shorten the shifted comparison from 17 to 16 bytes, losing the final right neighbor.
- `LoopCoverage.tla` checks scalar/batch traversal for widths 1, 2, 17, 18, 19, 32, 33, 34, 64 and 65. Covered indices must remain exactly the prefix before `x`. Advancing by 17 rather than 16 must produce a counterexample. The model overallows safe batches independently of pixel content; the C predicate supplies the zero-contribution condition. This is a finite model plus inspected correspondence, not a checked C-to-TLA+ refinement theorem.

The script records commands, exit codes, durations, property summaries, log hashes and checked generated-source hashes. It fails on unexpected exits or timeouts and terminates the solver process group. Explicitly decomposing the small call domain avoids an expensive fully symbolic solve. The earlier union adapter's counterexample and timed-out attempts are research diagnostics, not proof results or decoder defects.

The old palette cache/failure models remain historical evidence for the independently scoped stateful fixes. The final performance patch introduces no cache or failure-path change. The [rejected scratch model](rejected/ScratchRows.tla) belongs to the rejected row-layout experiment and is not a proof target for this patch. Its [archived reproduction](rejected/README.md) remains separate.

## Benchmarks and code generation

After all proof/build jobs finish, run these serially:

```sh
python3 micro.py --out /tmp/dvb-local
# Reproduce the previous broad candidate through ../formal/decoder.py first.
python3 benchmark.py --out /tmp/dvb-local-benchmarks --baseline /tmp/dvb-baseline \
  --decoder /tmp/dvb-local-decoder --previous /tmp/dvb-previous-decoder
clang -O3 -S native-predicate.c -o /tmp/predicate-arm64.s
clang -O3 -target x86_64-apple-macos13 -S native-predicate.c -o /tmp/predicate-x86.s
```

The microbenchmark extracts functions into a small context adapter and measures 24 random/uniform/textlike/checker/block cases. It is an adversarial pattern screen, not the whole decoder. It uses eight repetitions per sample and seven rotating rounds. Whole-decoder timings use nine balanced rotating rounds, matching `-O3` wrappers, process CPU time, raw samples, medians and input/binary hashes. ARM64 runtime evidence and x86 compile inspection must remain separate. Function speedups on uniform images are not the speedup of normal FFmpeg decoding.

`experiments.py` recreates the exploratory initial/transpose/sparse/division variants with `--stage`, and optionally `--generate-only`. The published generator's output was compared byte-for-byte with the actual screened source files. The early transpose screen overlapped a brief build and is provisional. The first micro pass for the final local guard overlapped validation; it was excluded from acceptance and repeated after all validation processes completed. Rejected variants and results are retained so the article can explain the selection rather than tell a hindsight-only success story.

FFmpeg's `tools/patcheck candidate.patch` was run with GNU grep/xargs. Its only remaining hint is a missing changelog entry, which its output explicitly permits ignoring for minor changes. macOS BSD tools and unrelocated bottle attempts failed; those are not accepted checks. The compact style receipt and isolated tool-download hashes are saved in research results. No style-tool dependency belongs in the PR.

See [the research findings](../../04-native-comparisons-and-smaller-scope.md), [worklist](../../00-worklist-index.md) and [third-party license](../COPYING.LGPLv2.1).
