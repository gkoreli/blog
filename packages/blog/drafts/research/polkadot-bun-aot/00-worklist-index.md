# Polkadot CLI with Bun AOT

Check date: 2026-10-28 (Pacific). Follow-up to [OSS Radar #08](../../../posts/031-oss-radar-08-bun-aot.md), outside its frozen research accounting.

## Requested outcome

Test a real project considering a Rust rewrite, measure Bun AOT startup, memory and executable size, check useful behavior, and prepare reproducible results for its maintainers. The [open feasibility proposal](https://github.com/paritytech/polkadot-cli/issues/218) cites startup and memory among several reasons for Rust; it is not an approved implementation. This experiment cannot settle the other reasons or establish Rust equivalence.

## Inputs and method

- Polkadot CLI main, version 1.25.1, commit `8e85fdac1fb81c5996a4ecc4c93178a54f37f2d5` (October 23). Use the checked-in Bun lock without changes.
- Current official macOS arm64 Bun canary, revision `1.4.4-canary.1+73b53109f`, full commit `73b53109f704b85ca889ef4e76285eb083c8d5f6`, downloaded October 28. ZIP SHA-256 `72a0f84c6a632790592ad363cb231d8e090cbaf1356d0b1cd9785698646b77d8`, matching GitHub release metadata. The mutable canary label is not the version pin.
- This is a newer compiler than the article's October 27 preview. Keep those results separate.
- Use the same source and compiler for source/JIT executable/AOT/AOT+trim comparisons. Start with help/version, deterministic hashing and cached metadata inspection. Retain compilation failures and output mismatches.
- Isolate application configuration with `DOT_HOME` in scratch storage. Seed a fresh update-check cache: `DOT_NO_UPDATE_CHECK` only suppresses the notification in this source, not its background fetch.
- Fresh processes, warmed filesystem caches, alternating mode order, repeated measurements. Report wall time, peak RSS and peak physical footprint separately; do not call fresh-process startup a cold-disk test.
- No production chain, real accounts, transaction submission, upstream code change, or maintainer message is needed to prepare the experiment.

## Acceptance

- [x] Confirm current proposal state and code baseline.
- [x] Build unchanged source in the compared configurations, or record concrete failure.
- [x] Check output and exit status on real offline commands, including cached metadata work.
- [x] Run repeated startup/memory measurements after correctness checks.
- [x] Record exact commands, hashes, observations, conditions and limits in a reproduction package.
- [x] Prepare a concise maintainer-facing result; public evidence-link acceptance is part of delivery below.
- [ ] Validate, commit and push only this experiment's files.

Private command captures, downloaded compiler, checkout, dependencies and executables remain under `/tmp/polkadot-aot-20261028`, `/tmp/polkadot-aot-tools-20261028` and `/tmp/polkadot-aot-results-20261028`. The earlier exploratory timing run is preserved separately at `/tmp/polkadot-aot-pre-standalone-20261028`; it is not the accepted public table. Publish scripts and selected structured observations, not raw operational logs.

## Status

[Results](01-results.md), [reproduction](repro/README.md) and [maintainer draft](02-maintainer-draft.md) are prepared. The final accepted run has 500 observations across five modes and five offline commands, plus a 70-check command matrix, two preserved AOT missing-asset failures, 28 AOT standalone checks and three negative controls. All six compiled executable hashes still matched the build inventory after measurement. A tracked-file diff confirmed the CLI source, package and lock were unchanged.

Cached metadata inspection: JIT executable 42.1 ms / 39.6 MB peak physical footprint; AOT+asset 18.5 ms / 19.4 MB. The portable AOT+asset executable is 70.7 MB, or 59.7 MB with trimming. The full crypto command uses about 48.8 MB and gains less speed. This does not certify live queries, signing, transaction parity, the full upstream suite, other platforms or equivalence to Rust.

The WASM packaging failure is important: ordinary JIT works only while it can read the original dependency path, even with `--asset`. Both AOT+asset variants passed all selected commands with checkout reads blocked. Disk comparisons label this asymmetry; no broken executable is presented as a valid portable package.

## Claim checks

| Claim | Evidence state | Basis and limit |
| --- | --- | --- |
| A rewrite is being considered for startup/memory and other reasons | Proposed | Issue #218, open with zero comments at the October 28 check; discusses an older CLI, not an approved rewrite |
| Current package targets Node | Code-inspected | Pinned package build and bin entry; Node 24.14.1 comparison mirrors that recipe |
| Cached metadata peak physical memory roughly halves | Reproduced | Twenty fresh processes per mode, same fixture/compiler; short offline command, not sustained memory |
| AOT reduces these command latencies | Reproduced | Five commands, balanced order, every observation retained; process/harness overhead included |
| Correct AOT packaging needs the WASM asset | Reproduced | Missing-file failure without it; 28 successful isolated checks with it |
| AOT deserves a compatibility trial before an efficiency-only rewrite | Inference | Does not address the proposal's separate native-library and product goals |

Next action: validate the evidence, links and scoped diff, commit/push this experiment, then independently verify its public evidence link. No maintainer contact has been sent.
