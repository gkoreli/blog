---
id: TASK-0149
title: Verify FFmpeg DVB subtitle improvements and preserve article research
status: in_progress
parent_id: FLDR-0003
created_at: '2026-11-03T08:34:54Z'
updated_at: '2026-11-03T08:42:42Z'
type: task
---

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
