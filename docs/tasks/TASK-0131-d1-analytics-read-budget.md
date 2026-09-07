---
id: TASK-0131
title: Reduce public analytics D1 reads and verify the operating budget
status: in_progress
parent_id: FLDR-0009
created_at: '2026-09-07T05:40:00.000Z'
updated_at: '2026-09-07T05:40:00.000Z'
type: task
---

Cloudflare reported 77% of the free daily rows-read allowance after the referral-policy release. One public report already measured 182,388 reads across nine repeated assessments. Correct the query and delivery cost while preserving the public reporting contract and retained evidence.

[Decision](../adr/0016.7-budget-d1-reads-and-cache-public-reports.md), [incident and sources](../../packages/blog/drafts/research/d1-read-budget/00-incident.md).

- [x] Capture service metadata, distinguish UTC-day allowance from rolling windows, identify expensive query shapes, and bound attribution claims.
- [x] Add canonical report caching, expiry/freshness disclosure, coalesced fills, and error handling.
- [x] Complete one-statement projection and verify it through the local D1 runtime.
- [x] Verify old/new output parity locally across 148 cases.
- [ ] Measure one bounded production candidate's scanned reads after D1 access returns; the quota rejected the attempt at 05:41:47 UTC.
- [x] Run analytics/blog tests, workspace typechecks, and production build.
- [ ] Commit/push the correction, verify a live cold report and canonical cache reuse, and archive acceptance evidence.
- [x] Correct published cost interpretation and earlier ADR bookkeeping without rewriting historical benchmark values.

No paid-plan change, data deletion, or policy migration is part of this repair. Caching is local to a Cloudflare data center; this correction is not a global denial-of-wallet guarantee.
