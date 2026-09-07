---
id: TASK-0129
title: Repair resubscription and invalid confirmation states with lifecycle tests
status: open
parent_id: FLDR-0010
created_at: '2026-09-07T05:21:00.609Z'
updated_at: '2026-09-07T05:21:00.609Z'
type: task
---
P1 correctness discovered during the reliability audit. Real in-memory SQLite with production handlers reproduced: resubscribing while a retained row is unsubscribed or bounced reaches a plain INSERT and throws UNIQUE constraint failed: subscribers.email; an unknown confirmation token returns HTTP 200 and claims the subscription is active when there are zero active rows. Evidence: packages/blog/drafts/research/newsletter-reliability/repro/lifecycle.mjs and lifecycle-results.json. These are local reproductions, not additional observed production incidents. Define explicit transitions for new/pending/active/unsubscribed/bounced addresses, preserving suppression and consent rules; never claim active from a missing token. Test concurrent submissions, expired/invalid confirmation, repeat confirmation and resubscription, and record safe server outcomes. Complete only after appropriate regression checks and deployed behavior validation.
