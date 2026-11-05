---
id: TASK-0142
title: Connect Resend bounce and complaint events to subscriber suppression
status: open
parent_id: FLDR-0010
created_at: '2026-09-09T02:13:15.441Z'
updated_at: '2026-11-05T16:50:30Z'
type: task
---
Production version e8c69b0d-3174-4e8f-a3f9-5788f2868686 (100% deployment September 9, 2026 at 02:07:43 UTC) has no RESEND_WEBHOOK_SECRET binding. The code's signed bounce/complaint suppression passes local tests but cannot process live events without that connection. Resend's /webhooks dashboard redirects the signed-out Chrome session to /login; the previously available provider credential had send-only/read-limited access. Do not infer that a webhook exists or create duplicate endpoints blindly.

Next bounded action: obtain access to the existing Resend account, inspect existing webhooks, configure https://gkoreli.com/api/webhooks/resend for email.bounced and email.complained, and set its signing secret privately as the Worker RESEND_WEBHOOK_SECRET. Do not put keys, recipient addresses or real token URLs in Git or ordinary diagnostics; do not rotate the unrelated Turnstile or send key. Verify a signed provider event and resulting suppression with a designated test record, distinguishing local fixture evidence from live account setup. Main worklist and receipts: packages/blog/drafts/research/newsletter-reliability/00-worklist-index.md and 10-verification.md.

November 5 initial check: production binding-name inspection lacks `RESEND_WEBHOOK_SECRET`. The local key returns `401 restricted_api_key` on `/webhooks` and `/domains`, so existing endpoints/domain settings remain uninspected through that credential. This does not prove absence of an account webhook. Native browser control reports a locked computer; Goga clarifies it is not locked and requests the in-app browser, which works.

November 5 later account correction: Google login opens a team containing only another project's domain. The agent creates a bounce/complaint endpoint before checking that scope and temporarily installs its signing secret on the blog Worker. One inert native-provider bounce control is API-accepted, but no signed callback or suppression is observed. The wrong-team endpoint is disabled and the new Worker secret removed; fresh binding-name inspection confirms the original four required secrets remain. No send key or unrelated project setting is changed. GitHub login is not already available. The owner is asked for the correct existing Resend login/team; do not request a password or create a broad API credential. This task remains open, with no claimed live feedback connection. [Current setup investigation](../../packages/blog/drafts/research/newsletter-reliability/28-managed-verification-and-diagnostics.md) and [sanitized acceptance/limits](../../packages/blog/drafts/research/newsletter-reliability/subscription-recovery-live-acceptance.json).
