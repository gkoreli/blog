---
id: TASK-0127
title: Decide whether Turnstile is proportionate for newsletter signup
status: in_progress
parent_id: FLDR-0010
created_at: '2026-09-07T05:09:30.902Z'
updated_at: '2026-09-07T05:33:54.422Z'
type: task
---
P1 architecture decision. Start from threats: repeated confirmation email to third parties, distributed sending abuse, DB/cost exhaustion, automated signup, reader access and delegated-agent access. Compare a repaired mandatory widget, challenge only after justified abuse signals, and a flow built around IP plus per-address/global send budgets, pending dedup/cooldowns and double opt-in. Double opt-in proves confirmation after initial email and does not prevent confirmation-email abuse; the existing 3/60s per-IP binding alone is not a global budget. Test browser/script blocking, slow network, token expiry, configuration error, verifier outage, limiter/DB/email failure. Use primary sources and measured local behavior, no blanket claims about Turnstile efficacy or false-positive rates. Record the smallest adequate design, the accepted abuse/availability tradeoff, rollback, and evidence that would reverse the choice. No security-policy removal during the evidence audit.

## Investigation checkpoint

Initial threat model and three design candidates documented with primary sources: packages/blog/drafts/research/newsletter-reliability/03-protection-options.md. No comparative abuse or completion measurements yet; no final removal decision made.
