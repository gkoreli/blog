---
id: TASK-0127
title: Decide whether Turnstile is proportionate for newsletter signup
status: in_progress
parent_id: FLDR-0010
created_at: '2026-09-07T05:09:30.902Z'
updated_at: '2026-09-09T01:57:04.430Z'
type: task
---
P1 proportionate newsletter protection decision. Goga wants a simple implementation and asks why he cannot keep his own platform. The agent's Buttondown recommendation was not a selected migration. Current recommendation: keep the existing Worker, D1, and Resend integration, verify the reported parallel repair, and fix concrete remaining gaps. A Buttondown account or URL is not a dependency. Follow the [current scope](../../packages/blog/drafts/research/newsletter-reliability/03-protection-options.md#current-scope-simple-signup-on-our-existing-platform).

Public signup is normal. Distinguish control of the supplied mailbox, automated-request assessment, limits on email sending, and reliable state transitions. Reuse existing services and pending state; no new framework, queue, or exhaustive comparison is automatically required. Keep the Turnstile policy decision separate from platform ownership. Verify signup, confirmation, unsubscribe, resubscription, failure reporting, and bounded resend behavior. General client logging and historical recovery remain separate unfinished work.

The latest TASK-0124 note records an owner-reported parallel signup fix; retrieve its acceptance receipt before repeating credential work or asserting that signup is still broken. This session has not independently verified it. The dated checkpoints below preserve earlier proposals; their migration and custom-build next steps do not override this scope.

## Investigation checkpoint

Initial threat model and three design candidates documented with primary sources: packages/blog/drafts/research/newsletter-reliability/03-protection-options.md. No comparative abuse or completion measurements yet; no final removal decision made.

## September 8 PDT / September 9 UTC prior-art checkpoint

Completed the source review in [original rationale and 2026 prior art](../../packages/blog/drafts/research/newsletter-reliability/05-prior-art-2026.md). Git history establishes an urgent free-stack launch and a later aesthetic preference for an invisible widget; the preserved record contains no comparative selection study. Current provider guidance, pinned listmonk v6.2.0 modules, ALTCHA integration requirements, 2026 subscription-bombing evidence, and Resend send semantics widen the comparison to a maintained hosted signup flow and self-hosted verification. The earlier conversational preference for a widget-free trial is qualified by first-message abuse and operational ownership. Updated 03-protection-options.md and the unpublished article; five complete shaping prompts are preserved.

The protocol now separates enforcement policy, verifier choice, and ownership; specifies common failure cases, expected invariants, rollout stops, and reversal evidence. Numeric send/storage/retry/wait budgets and comparative results remain unset. No real signup test, production SQL, credential change, provider purchase, or protection removal occurred. Next: finish TASK-0124, specify shared send controls and recoverable delivery in TASK-0126, and compare the provider's exact supported signup path. This task remains in progress.

## Implementation decision — September 9 UTC

The owner requested building protection and the article in parallel. Keep the existing platform and Turnstile, enforce both public confirmation routes through one D1 admission transaction, and use bounded Resend retries with a stable body/key. Starting policy: one admission per normalized address per ten minutes, three/address/24h, 25 aggregate/hour and 100 aggregate/24h. These are blog defaults, not validated universal thresholds or the provider's quota. See [design and remaining tradeoffs](../../packages/blog/drafts/research/newsletter-reliability/09-design-and-implementation.md) and [ORM rationale](../../packages/blog/drafts/research/newsletter-reliability/13-data-access-decision.md). Earlier unset-budget and provider-migration instructions above are historical; the current worklist is [00-worklist-index.md](../../packages/blog/drafts/research/newsletter-reliability/00-worklist-index.md). No removal decision or provider comparison result is claimed.
