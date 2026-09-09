---
id: TASK-0137
title: Bound subscription confirmation sending with atomic D1 admission
status: done
parent_id: FLDR-0010
evidence:
  - >-
    Implementation 86dad93, final 100-test suite/typechecks/build and actual
    local workerd D1 receipt in 10-verification.md.
  - >-
    Authorized live signup, secret-binding repair, provider acceptance, Gmail
    Spam receipt and final active state:
    packages/blog/drafts/research/newsletter-reliability/15-live-signup-acceptance.md.
    TASK-0142 and TASK-0145 retain the separate unfinished operational work.
created_at: '2026-09-09T01:24:06.130Z'
updated_at: '2026-09-09T02:48:13.282Z'
type: task
---
Implement subscription-bombing protection on the existing Worker + D1 + Resend platform. Both signup and resend must pass the same atomic admission policy: per-address cooldown and rolling-day cap, plus aggregate hourly/day limits. Preserve valid confirmation links on rejected or failed retries, keep inactive/suppressed states correct, and bound provider retries with a stable key and payload. No new queue/framework or migration to a newsletter platform. Store design, source evidence, review, and test receipts under packages/blog/drafts/research/newsletter-reliability/, indexed by 00-worklist-index.md. Acceptance: meaningful concurrent/local D1 and mocked-provider regressions, controlled request/state verification, and distinct code/deployment/live-email receipts. TASK-0126 tracks broader diagnostics, TASK-0129 lifecycle correctness, TASK-0128 the article.

## Local acceptance — September 9 UTC

Both endpoints now share the guarded D1 batch and per-address/global rolling policy. 37 server tests and 25 client tests pass, plus actual local workerd D1: 48 concurrent same-address store calls admitted one; four shifted 60-call waves admitted 25 each and stopped at 100/day; a failing subscriber write rolled back its reservation. No real provider call or production attack traffic was used. [Verification receipt](../../packages/blog/drafts/research/newsletter-reliability/10-verification.md) and [design](../../packages/blog/drafts/research/newsletter-reliability/09-design-and-implementation.md) distinguish implementation, migration, deployment, and live-email acceptance. The latter stages remain separate pending entries until recorded.

## Committed implementation and partial live acceptance — September 9 UTC

Code `86dad93` is committed and pushed; final combined checks pass (100 blog tests, all workspace typechecks, production build). Migration 0005 is applied. Version e8c69b0d-3174-4e8f-a3f9-5788f2868686 was activated at 100%, and four bounded live HTTP checks verified the changed guards/copy. This is not complete signup acceptance: a designated recipient is still needed, and the missing production webhook signing-secret connection is TASK-0142. Exact results, known access limits and next actions are in [14-handoff.md](../../packages/blog/drafts/research/newsletter-reliability/14-handoff.md). Do not repeat the migration or rotate a verifier key from old incident evidence.

## Completed live acceptance — September 9, 02:38 UTC

The owner-designated address completed the real flow after a fresh production verifier-binding repair: valid browser challenge, ordinary unsubscribe/re-subscribe of the existing active row, one provider-accepted confirmation, receipt in Gmail Spam, GET preview with pending state preserved, and POST activation. Final D1 checks show active state, preserved original creation/opt-out values, and revoked confirmation hash. No direct SQL repair, extra test recipient or historical address recovery occurred. Seven direct diagnostic statements reported seven reads and zero writes, excluding Worker endpoint work. [Exact receipt and runtime versions](../../packages/blog/drafts/research/newsletter-reliability/15-live-signup-acceptance.md).

TASK-0145 tracks Spam placement and sender authentication investigation; TASK-0142 tracks the still-unconnected signed bounce/complaint events. General diagnostic ingestion/alerts remain open. These limits do not prevent completing this task's implemented and observed acceptance criteria.
