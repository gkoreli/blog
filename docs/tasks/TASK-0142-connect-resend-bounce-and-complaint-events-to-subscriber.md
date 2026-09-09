---
id: TASK-0142
title: Connect Resend bounce and complaint events to subscriber suppression
status: open
parent_id: FLDR-0010
created_at: '2026-09-09T02:13:15.441Z'
updated_at: '2026-09-09T02:13:15.441Z'
type: task
---
Production version e8c69b0d-3174-4e8f-a3f9-5788f2868686 (100% deployment September 9, 2026 at 02:07:43 UTC) has no RESEND_WEBHOOK_SECRET binding. The code's signed bounce/complaint suppression passes local tests but cannot process live events without that connection. Resend's /webhooks dashboard redirects the signed-out Chrome session to /login; the previously available provider credential had send-only/read-limited access. Do not infer that a webhook exists or create duplicate endpoints blindly.

Next bounded action: obtain access to the existing Resend account, inspect existing webhooks, configure https://gkoreli.com/api/webhooks/resend for email.bounced and email.complained, and set its signing secret privately as the Worker RESEND_WEBHOOK_SECRET. Do not put keys, recipient addresses or real token URLs in Git or ordinary diagnostics; do not rotate the unrelated Turnstile or send key. Verify a signed provider event and resulting suppression with a designated test record, distinguishing local fixture evidence from live account setup. Main worklist and receipts: packages/blog/drafts/research/newsletter-reliability/00-worklist-index.md and 10-verification.md.
