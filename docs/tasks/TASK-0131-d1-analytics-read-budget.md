---
id: TASK-0131
title: Reduce public analytics D1 reads and verify the operating budget
status: done
parent_id: FLDR-0009
created_at: '2026-09-07T05:40:00.000Z'
updated_at: '2026-09-07T06:38:06.221Z'
type: task
---
Cloudflare reported 77% of the free daily rows-read allowance after the referral-policy release. One public report already measured 182,388 reads across nine repeated assessments. Correct the query and delivery cost while preserving the public reporting contract and retained evidence.

[Decision](../adr/0016.7-budget-d1-reads-and-cache-public-reports.md), [incident and sources](../../packages/blog/drafts/research/d1-read-budget/00-incident.md).

- [x] Capture service metadata, distinguish UTC-day allowance from rolling windows, identify expensive query shapes, and bound attribution claims.
- [x] Add canonical report caching, expiry/freshness disclosure, coalesced fills, and error handling.
- [x] Complete one-statement projection and verify it through the local D1 runtime.
- [x] Verify old/new output parity locally across 148 cases.
- [x] Measure one bounded production candidate after access returns: 33,259 reads versus 182,388, with the retained response unchanged and zero writes.
- [x] Run analytics/blog tests, workspace typechecks, and production build.
- [x] Commit/push the correction and archive deployment, served-artifact, and validation-path evidence.
- [x] Verify successful live reports and canonical cache reuse: two equivalent requests returned identical HTTP 200 cache hits.
- [x] Correct published cost interpretation and earlier ADR bookkeeping without rewriting historical benchmark values.

The owner reported completing the Workers Paid upgrade; the agent did not change billing. No data deletion or policy migration was performed. Caching is local to a Cloudflare data center; this correction is not a global denial-of-wallet guarantee.

Released as `316eb00`, activated September 7 at 05:49:21 UTC. All 79 tests, 148 differential cases through local D1, workspace typechecks, build, and served-artifact checks passed. After the owner upgrade, [production acceptance](../../packages/blog/drafts/research/d1-read-budget/02-recovery.md) completed at 06:18–06:21 UTC with 81.7647% fewer measured reads and verified cache reuse. The earlier quota block and pending approval are historical; neither is an outstanding acceptance condition.

## September 7 break checkpoint

The earlier newsletter checkpoint established only that a thirteen-read query succeeded at 06:11 UTC. The subsequent owner report and analytics checks establish the completed upgrade, successful full report, measured read savings, and cache reuse. Do not repeat those checks to recover context. Stored page observations numbered 7,010 at the 06:19 count; the old 182,388 baseline is cumulative work across nine statements. [Analytics handoff](../../packages/blog/drafts/research/d1-read-budget/03-handoff.md), [shared reliability checkpoint](../handoffs/2026-09-07-reliability-checkpoint.md). A later operating-window observation and separate newsletter reliability work remain open; this implementation/acceptance task is complete.
