---
id: TASK-0129
title: Repair resubscription and invalid confirmation states with lifecycle tests
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
created_at: '2026-09-07T05:21:00.609Z'
updated_at: '2026-09-09T02:48:13.474Z'
type: task
---
P1 correctness discovered during the reliability audit. Real in-memory SQLite with production handlers reproduced: resubscribing while a retained row is unsubscribed or bounced reaches a plain INSERT and throws UNIQUE constraint failed: subscribers.email; an unknown confirmation token returns HTTP 200 and claims the subscription is active when there are zero active rows. Evidence: packages/blog/drafts/research/newsletter-reliability/repro/lifecycle.mjs and lifecycle-results.json. These are local reproductions, not additional observed production incidents. Define explicit transitions for new/pending/active/unsubscribed/bounced addresses, preserving suppression and consent rules; never claim active from a missing token. Test concurrent submissions, expired/invalid confirmation, repeat confirmation and resubscription, and record safe server outcomes. Complete only after appropriate regression checks and deployed behavior validation.

## Implementation checkpoint — September 9 UTC

The local implementation preserves earlier unexpired confirmation links, makes GET a preview and POST the activation action, rejects unknown/expired/used tokens, revokes all issued tokens on activation or opt-out, preserves unsubscribe links across ordinary resubscription, and suppresses signed complaints/bounces and explicit confirmation opt-outs. Legacy inactive rows retain uncertainty as legacy-inactive. The block lasts under the existing 90-day inactive retention policy; it is not permanent. Meaningful lifecycle regressions pass; see [verification](../../packages/blog/drafts/research/newsletter-reliability/10-verification.md). Live recipient completion and activation are separate receipts; task remains open until that acceptance is reconciled.

## Completed live acceptance — September 9, 02:38 UTC

The owner-designated address completed the real flow after a fresh production verifier-binding repair: valid browser challenge, ordinary unsubscribe/re-subscribe of the existing active row, one provider-accepted confirmation, receipt in Gmail Spam, GET preview with pending state preserved, and POST activation. Final D1 checks show active state, preserved original creation/opt-out values, and revoked confirmation hash. No direct SQL repair, extra test recipient or historical address recovery occurred. Seven direct diagnostic statements reported seven reads and zero writes, excluding Worker endpoint work. [Exact receipt and runtime versions](../../packages/blog/drafts/research/newsletter-reliability/15-live-signup-acceptance.md).

TASK-0145 tracks Spam placement and sender authentication investigation; TASK-0142 tracks the still-unconnected signed bounce/complaint events. General diagnostic ingestion/alerts remain open. These limits do not prevent completing this task's implemented and observed acceptance criteria.
