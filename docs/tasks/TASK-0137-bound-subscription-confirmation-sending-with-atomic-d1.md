---
id: TASK-0137
title: Bound subscription confirmation sending with atomic D1 admission
status: in_progress
parent_id: FLDR-0010
created_at: '2026-09-09T01:24:06.130Z'
updated_at: '2026-09-09T02:14:45.933Z'
type: task
---
Implement subscription-bombing protection on the existing Worker + D1 + Resend platform. Both signup and resend must pass the same atomic admission policy: per-address cooldown and rolling-day cap, plus aggregate hourly/day limits. Preserve valid confirmation links on rejected or failed retries, keep inactive/suppressed states correct, and bound provider retries with a stable key and payload. No new queue/framework or migration to a newsletter platform. Store design, source evidence, review, and test receipts under packages/blog/drafts/research/newsletter-reliability/, indexed by 00-worklist-index.md. Acceptance: meaningful concurrent/local D1 and mocked-provider regressions, controlled request/state verification, and distinct code/deployment/live-email receipts. TASK-0126 tracks broader diagnostics, TASK-0129 lifecycle correctness, TASK-0128 the article.

## Local acceptance — September 9 UTC

Both endpoints now share the guarded D1 batch and per-address/global rolling policy. 37 server tests and 25 client tests pass, plus actual local workerd D1: 48 concurrent same-address store calls admitted one; four shifted 60-call waves admitted 25 each and stopped at 100/day; a failing subscriber write rolled back its reservation. No real provider call or production attack traffic was used. [Verification receipt](../../packages/blog/drafts/research/newsletter-reliability/10-verification.md) and [design](../../packages/blog/drafts/research/newsletter-reliability/09-design-and-implementation.md) distinguish implementation, migration, deployment, and live-email acceptance. The latter stages remain separate pending entries until recorded.

## Committed implementation and partial live acceptance — September 9 UTC

Code `86dad93` is committed and pushed; final combined checks pass (100 blog tests, all workspace typechecks, production build). Migration 0005 is applied. Version e8c69b0d-3174-4e8f-a3f9-5788f2868686 was activated at 100%, and four bounded live HTTP checks verified the changed guards/copy. This is not complete signup acceptance: a designated recipient is still needed, and the missing production webhook signing-secret connection is TASK-0142. Exact results, known access limits and next actions are in [14-handoff.md](../../packages/blog/drafts/research/newsletter-reliability/14-handoff.md). Do not repeat the migration or rotate a verifier key from old incident evidence.
