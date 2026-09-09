---
id: TASK-0129
title: Repair resubscription and invalid confirmation states with lifecycle tests
status: in_progress
parent_id: FLDR-0010
created_at: '2026-09-07T05:21:00.609Z'
updated_at: '2026-09-09T01:57:04.677Z'
type: task
---
P1 correctness discovered during the reliability audit. Real in-memory SQLite with production handlers reproduced: resubscribing while a retained row is unsubscribed or bounced reaches a plain INSERT and throws UNIQUE constraint failed: subscribers.email; an unknown confirmation token returns HTTP 200 and claims the subscription is active when there are zero active rows. Evidence: packages/blog/drafts/research/newsletter-reliability/repro/lifecycle.mjs and lifecycle-results.json. These are local reproductions, not additional observed production incidents. Define explicit transitions for new/pending/active/unsubscribed/bounced addresses, preserving suppression and consent rules; never claim active from a missing token. Test concurrent submissions, expired/invalid confirmation, repeat confirmation and resubscription, and record safe server outcomes. Complete only after appropriate regression checks and deployed behavior validation.

## Implementation checkpoint — September 9 UTC

The local implementation preserves earlier unexpired confirmation links, makes GET a preview and POST the activation action, rejects unknown/expired/used tokens, revokes all issued tokens on activation or opt-out, preserves unsubscribe links across ordinary resubscription, and suppresses signed complaints/bounces and explicit confirmation opt-outs. Legacy inactive rows retain uncertainty as legacy-inactive. The block lasts under the existing 90-day inactive retention policy; it is not permanent. Meaningful lifecycle regressions pass; see [verification](../../packages/blog/drafts/research/newsletter-reliability/10-verification.md). Live recipient completion and activation are separate receipts; task remains open until that acceptance is reconciled.
