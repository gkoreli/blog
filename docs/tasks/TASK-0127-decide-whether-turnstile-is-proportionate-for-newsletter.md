---
id: TASK-0127
title: Decide whether Turnstile is proportionate for newsletter signup
status: in_progress
parent_id: FLDR-0010
created_at: '2026-09-07T05:09:30.902Z'
updated_at: '2026-09-09T00:38:40.684Z'
type: task
---
P1 architecture decision. Start from threats: repeated confirmation email to third parties, distributed sending abuse, DB/cost exhaustion, automated signup, reader access and delegated-agent access. Compare a repaired mandatory widget, challenge only after justified abuse signals, and a flow built around IP plus per-address/global send budgets, pending dedup/cooldowns and double opt-in. Double opt-in proves confirmation after initial email and does not prevent confirmation-email abuse; the existing 3/60s per-IP binding alone is not a global budget. Test browser/script blocking, slow network, token expiry, configuration error, verifier outage, limiter/DB/email failure. Use primary sources and measured local behavior, no blanket claims about Turnstile efficacy or false-positive rates. Record the smallest adequate design, the accepted abuse/availability tradeoff, rollback, and evidence that would reverse the choice. No security-policy removal during the evidence audit.

## Investigation checkpoint

Initial threat model and three design candidates documented with primary sources: packages/blog/drafts/research/newsletter-reliability/03-protection-options.md. No comparative abuse or completion measurements yet; no final removal decision made.

## September 8 PDT / September 9 UTC prior-art checkpoint

Completed the source review in [original rationale and 2026 prior art](../../packages/blog/drafts/research/newsletter-reliability/05-prior-art-2026.md). Git history establishes an urgent free-stack launch and a later aesthetic preference for an invisible widget; the preserved record contains no comparative selection study. Current provider guidance, pinned listmonk v6.2.0 modules, ALTCHA integration requirements, 2026 subscription-bombing evidence, and Resend send semantics widen the comparison to a maintained hosted signup flow and self-hosted verification. The earlier conversational preference for a widget-free trial is qualified by first-message abuse and operational ownership. Updated 03-protection-options.md and the unpublished article; five complete shaping prompts are preserved.

The protocol now separates enforcement policy, verifier choice, and ownership; specifies common failure cases, expected invariants, rollout stops, and reversal evidence. Numeric send/storage/retry/wait budgets and comparative results remain unset. No real signup test, production SQL, credential change, provider purchase, or protection removal occurred. Next: finish TASK-0124, specify shared send controls and recoverable delivery in TASK-0126, and compare the provider's exact supported signup path. This task remains in progress.
