# Core rendering optimization experiment

Follow-up requested October 20, 2026 Pacific. This is a new investigation of the draft's measured mount and narrow-update costs. The [original reproduction](../repro/README.md) and its release-0.56.0 results remain historical evidence.

## Variants

All variants start at Nisli `4afde49c728a330e10ce887a38b8013d63b58498`. Their exact changes are saved as patches:

| Label | Change from baseline |
|---|---|
| baseline | Pinned source, no changes |
| scheduler | [Skip array copy/sort for zero or one pending effect](variants/scheduler.patch) |
| promise | [Single-effect fast path plus a reused resolved Promise](variants/promise.patch), isolating the scheduling primitive |
| path-cache | [Promise variant plus cached child-index paths to binding targets](variants/path.patch) |
| candidate | [Promise scheduling with uncaught-exception reporting, plus cached target indices and a native TreeWalker](variants/candidate.patch) |

The bare Promise variant is an experimental ablation. The final candidate adds a wrapper that reports an unexpected scheduler failure through a queued throw, preserving the uncaught-exception channel rather than creating an unhandled rejection. Ordinary effect exceptions retain their existing containment. The regression tests exercise both sorted cascades after a single writer and the exceptional reporting path.

Both binding caches discover locations from the browser-parsed template; neither implements an HTML parser or removes the runtime boundary markers. All targets are resolved before binding expands/removes siblings. Attribute parsing still happens on the targeted elements. Templates with `html:inner` retain the original live walker because that sink replaces descendants before discovery. The final TreeWalker uses the standard numeric element/comment mask, avoiding a new global `NodeFilter` requirement in SSG.

## Reproduction

Run from this directory with Node 24.14.1. Use the dependency package/lock from `../repro/`; install into an unused temporary runtime as described there. `NISLI_REPO` must identify an existing Nisli Git repository with the pinned commit.

```sh
export NISLI_REPO=/absolute/path/to/nisli
export NISLI_BENCH_RUNTIME=/absolute/path/to/temporary/benchmark-runtime
export NISLI_CORE_VARIANTS="$(mktemp -d /tmp/nisli-core-variants.XXXXXX)"
for variant in baseline scheduler promise path candidate; do
  mkdir -p "$NISLI_CORE_VARIANTS/$variant"
  git -C "$NISLI_REPO" archive 4afde49c728a330e10ce887a38b8013d63b58498 packages/core/src |
    tar -x -C "$NISLI_CORE_VARIANTS/$variant"
  if [ "$variant" != baseline ]; then
    patch -d "$NISLI_CORE_VARIANTS/$variant" -p1 < "variants/$variant.patch"
  fi
done
export NISLI_BASELINE_ROOT="$NISLI_CORE_VARIANTS/baseline"
export NISLI_SCHEDULER_ROOT="$NISLI_CORE_VARIANTS/scheduler"
export NISLI_PROMISE_ROOT="$NISLI_CORE_VARIANTS/promise"
export NISLI_PATH_ROOT="$NISLI_CORE_VARIANTS/path"
export NISLI_CANDIDATE_ROOT="$NISLI_CORE_VARIANTS/candidate"
node run.mjs
```

Open `http://127.0.0.1:48175` and press **Run paired comparison**. `NISLI_BENCH_PORT` selects another unused port. The server writes `optimization-results.json` and a timestamped copy in the temporary runtime. `--build-only` rebuilds without starting a second server. Outputs and dependencies remain outside the site and Nisli's active development output directories.

## Method and interpretation

- Same dependencies/compiler settings as the original experiment. All five Nisli variants and narrow Lit run in the same production page, with separate module instances and distinct custom-element names.
- Three warmups and fifteen measured rounds. Async update and mount comparisons rotate the variant order. Macrotask yields occur outside timed intervals so browser control can progress. Synchronous flush probes are grouped by variant and are supporting diagnostics, not the main comparison.
- The original-shaped panel has 1,000 rows. Every one of 10,000 writes to the first output gets six shared microtask turns and an immediate text check. The output host must retain identity. This follow-up uses one closure-owned model per root component so it can expose phases; it does not reuse the original root prop adapter verbatim. The row template and per-cell signal bindings are the same across the Nisli variants.
- Additional mount-only fixtures increase static structure or bind several attributes/text slots per row. Signal allocation and TemplateResult construction are separately timed. Their near-zero samples are below the browser timer's useful granularity; zero is not a claim of no work. Mount remainder includes clone/binding/effect setup/connection and drain overhead; it is not a CPU profile attributing that entire remainder to any one function.
- A separate framework-free test schedules the same reused callback through `queueMicrotask` or a reused settled Promise, with the same drain and correctness check. It helps isolate the observed scheduling difference without reactive-graph code.
- Explicit-flush probes do 100,000 writes through either a direct effect or a template binding. They include enqueueing callbacks that are drained after the timed loop. They are not pure reactive-graph timings or a recommendation to flush after every write.
- Behavior probes check stale-result suppression, request abort on disconnect, retained/removed lifetimes, native/fallback moves and focus, async intermediate views, native implied tbody/SVG, earlier-sibling expansion, events/modifiers, mixed attributes, classes, refs, repeated mounts, and disposal.
- The first-seen mount is one sample per implementation, including first-use parse/discovery. It is not a cold network/page-start benchmark. Main tables use warm medians.
- One arm64 macOS 27.0.1 host, Chrome 155 in Codex's in-app browser. No CPU throttling, forced GC, paint/layout timing, allocation/retained-heap profile, second browser engine, or OpenClaw workload. A Promise advantage here does not establish the same ranking in other engines.

The exploratory runs are retained under [exploratory/](exploratory/). Some overlap the broader regression-check process and have different harness revisions. Do not pool them with the final repeated measurements. Source and harness hashes identify the recorded revisions; the initial path-cache run predates the harness hash field. Only the final harness is retained as runnable source, so the exploratory files are historical observations rather than byte-for-byte replay targets. The initial [patch](exploratory/path-cache.patch) records that prototype.

## Final repeated result

Both final runs used the same source/harness hashes and started after the regression builds completed: [run 1](results-run-1.json), [run 2](results-run-2.json). [summary.json](summary.json) pools the thirty measured samples per case. Separate mount-only cases expose phases; the update comparison also records its own mount samples.

| Operation | Baseline, ms | Candidate, ms | Lower elapsed time |
|---|---:|---:|---:|
| Mount original-shaped 1,000 rows, mount-only case | 9.00 | 7.25 | 19% |
| Mount static-heavy 1,000 rows | 40.25 | 30.05 | 25% |
| Mount binding-heavy 1,000 rows | 16.70 | 14.25 | 15% |
| 10,000 verified updates | 6.15 | 3.50 | 43% |

Narrow Lit's paired update median was 2.80 ms and its mount median in that same update comparison was 6.50 ms. Nisli's candidate remained slower. The candidate update loop was 3.7 ms versus baseline 6.4 in run 1 and 3.4 versus 5.8 in run 2. These are throughput changes in this fixture, not application responsiveness or cross-engine rankings.

Single-effect sorting alone moved the pooled update median from 6.15 to 5.90 ms, a small change. The bare Promise ablation reached 3.50 ms. The separate framework-free callback comparison measured 5.15 ms for `queueMicrotask` versus 2.60 ms for the reused Promise. Together these ablations identify the scheduling choice as a substantial cost in this Chrome workload; they do not explain its engine-internal implementation.

The independently built counter grew from 23,737 minified / 8,237 gzip bytes to 24,916 / 8,630: **+393 gzip bytes (4.8%)**. [Size record](size-results.json); same [counter source/build method](../repro/README.md#counter-bundle-measurement). No application-wide bundle claim follows from this counter.

All recorded behavior checks passed in both final runs. Local core tests passed 470/470, up from the baseline's 465. Full workspace tests passed 2,343 tests across core, router, engine, SSG, Ledger, UI, and www. Root typecheck and the isolated root build passed. No main-CI or npm-release claim is made; the core candidate is an isolated local branch.
