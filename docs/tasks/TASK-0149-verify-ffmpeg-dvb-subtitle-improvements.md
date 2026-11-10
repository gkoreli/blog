---
id: TASK-0149
title: Verify FFmpeg DVB subtitle improvements and preserve article research
status: done
parent_id: FLDR-0003
created_at: '2026-11-03T08:34:54Z'
updated_at: '2026-11-10'
type: task
---

## Current disposition — November 10, 2026

**Closed by owner; completed bounded research retained.** Goga withdrew the
article, upstream submission and optional further verification. `done` records
this closure, not a claim that all proposed experiments ran, a general proof was
established, default-path timing was resolved or a PR/article was published.
The [research worklist](../../packages/blog/drafts/research/ffmpeg-dvbsub/00-worklist-index.md)
preserves the results and limits. No next action remains unless Goga explicitly
reopens the topic. See the [article disposition register](../../packages/blog/drafts/README.md).

## Historical task record

## Requested outcome

Investigate the optimization claimed in Romain Hédouin's X post, find the upstream contribution, improve the same decoder, machine-check the C transformations, model stateful behavior with TLA+, fix findings, and preserve reproducible proofs and benchmarks for an upstream contribution and future engineering article.

## Canonical record

[Research worklist](../../packages/blog/drafts/research/ffmpeg-dvbsub/00-worklist-index.md) owns the current state, evidence map, limits and next bounded action. [Exact shaping prompts](../../packages/blog/prompts/ffmpeg-dvbsub-verification.prompts.md) preserve the supplied article direction. Raw logs, downloaded tools, binaries and bitmap captures stay outside Git.

## Acceptance and current state

- The original merged PR and its narrow performance scope are identified.
- Earlier candidate sources, timing samples, differential/sanitizer evidence and reproduction scripts are preserved with their historical limits.
- Seven C obligations have successful bounded checks with unwinding assertions and reachable-completion controls; three mutation controls must fail. Full 256-color collector/ranking equivalence remains a mathematical argument rather than a general machine proof.
- Finite cache/output-failure models distinguish intentional compute-once reuse from actual discarded failures. All four modes and three fixed output routes pass; expected legacy/naive invariants produce counterexamples.
- Separate error-propagation/retry and short-header patches pass 27 native regressions, successful-output comparisons, normal/sanitized FATE and decoder tests.
- A fresh normal baseline bootstrap succeeds; the sanitizer checkout is separately instrumented and rebuilt, without claiming a second fresh sanitizer bootstrap.
- Benchmark gains and default-path limits are recorded separately from correctness checks. The worklist owns current timing acceptance.
- A five-patch series and draft upstream descriptions are prepared. No upstream PR is submitted, no article is published, and no cross-platform or universal regression guarantee is claimed.

Research/check delivery follows the repository's scoped commit-and-push preference. Article drafting, broader proofs, additional broadcast/architecture coverage and upstream submission remain explicit follow-up work, rather than silently marked complete.

## November 3 native-comparison iteration

The preferred performance scope is now a 17-line addition/one-line deletion inside the existing palette function. Its matrix and scorer stay unchanged. The 33-line transposed/sparse candidate was rejected for large random-image slowdowns; all screens and source hashes remain in the canonical worklist. The final patch has 49 accepted proof/control/model results, 96,758 normal/sanitized differential cases, full-decoder checks and independent robustness-fix integration.

The final real forced-path gain is 4.989× against upstream and 1.173× throughput versus the larger candidate, with generated-pattern/default-path tradeoffs recorded explicitly. Default real decoding is 2.65% slower in the median of this run; neutrality is not accepted. The investigation and article evidence are delivered separately from the unsubmitted upstream PR. Current sources, results, reproduction and remaining review are owned by [Research 04](../../packages/blog/drafts/research/ffmpeg-dvbsub/04-native-comparisons-and-smaller-scope.md).
