---
id: TASK-0127
title: Decide whether Turnstile is proportionate for newsletter signup
status: in_progress
parent_id: FLDR-0010
created_at: '2026-09-07T05:09:30.902Z'
updated_at: '2026-09-09T01:01:05.167Z'
type: task
---
P1 newsletter adoption decision. Goga's latest requirement is a simple, safe capability suitable for a personal blog. The recommendation is Buttondown's hosted signup page, using its standard confirmation and abuse protection. Provider selection remains open; the next missing input is the real newsletter's public signup URL. Follow the [current adoption scope](../../packages/blog/drafts/research/newsletter-reliability/03-protection-options.md#current-direction-adopt-a-maintained-newsletter-service).

Verify the supported signup, confirmation, unsubscribe, resubscription, visible error recovery, and export behavior with a designated authorized recipient. Then replace the blog entry point and retire old signup/sending paths while preserving confirmed subscriptions and working legacy opt-outs. Record the accepted provider dependency, cost, tested result, and integration rollback. Do not build custom verifier variants, an outbox framework, or an exhaustive comparative benchmark as prerequisites. General client logging and historical recovery remain separate work. No account, migration, send, or runtime change has occurred.

The dated checkpoints below preserve the earlier investigation. Their custom-build next steps are superseded by this scope; they are not outstanding prerequisites.

## Investigation checkpoint

Initial threat model and three design candidates documented with primary sources: packages/blog/drafts/research/newsletter-reliability/03-protection-options.md. No comparative abuse or completion measurements yet; no final removal decision made.

## September 8 PDT / September 9 UTC prior-art checkpoint

Completed the source review in [original rationale and 2026 prior art](../../packages/blog/drafts/research/newsletter-reliability/05-prior-art-2026.md). Git history establishes an urgent free-stack launch and a later aesthetic preference for an invisible widget; the preserved record contains no comparative selection study. Current provider guidance, pinned listmonk v6.2.0 modules, ALTCHA integration requirements, 2026 subscription-bombing evidence, and Resend send semantics widen the comparison to a maintained hosted signup flow and self-hosted verification. The earlier conversational preference for a widget-free trial is qualified by first-message abuse and operational ownership. Updated 03-protection-options.md and the unpublished article; five complete shaping prompts are preserved.

The protocol now separates enforcement policy, verifier choice, and ownership; specifies common failure cases, expected invariants, rollout stops, and reversal evidence. Numeric send/storage/retry/wait budgets and comparative results remain unset. No real signup test, production SQL, credential change, provider purchase, or protection removal occurred. Next: finish TASK-0124, specify shared send controls and recoverable delivery in TASK-0126, and compare the provider's exact supported signup path. This task remains in progress.
