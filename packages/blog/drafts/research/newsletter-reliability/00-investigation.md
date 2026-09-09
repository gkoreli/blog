# Newsletter reliability investigation

Started September 6, 2026 Pacific; captures continue September 7 UTC. Worklist: FLDR-0010, TASK-0123 through TASK-0130. Source revision at the initial audit: `3d92b10b7a495ab537646b141e2dc9bbba7e20e7`.

Current resume point: [14-handoff.md](14-handoff.md), after implementation `86dad93` and live-acceptance checkpoint `f6185f5`. Migration 0005 is applied. One authorized subscription completed after a fresh verifier-binding repair, with its confirmation received in Gmail Spam. The platform and Turnstile are retained with shared sending limits. [00-worklist-index.md](00-worklist-index.md) includes the later tasks and all research; [15-live-signup-acceptance.md](15-live-signup-acceptance.md) records the exact result. Earlier proposals below are investigation history, not instructions to repeat completed work.

## Question and living center

A friend could not subscribe. The production verifier rejected the server's secret, while the form suggested retrying or allowing bot protection. Goga is skeptical of the protection and wants to know whether earlier readers met the same failure, and whether our browser diagnostics can answer that question.

The governing form is an evidence-led engineering investigation, currently a field note. The live question is whether the protection and operational burden are proportionate to this newsletter's abuse exposure. An invalid credential is an integration failure; it does not measure Turnstile's ability to distinguish abuse from legitimate requests.

The captured flow had a confirmed configuration failure and incomplete diagnostic coverage. The September 9 live test independently found and repaired a verifier-binding failure and completed one subscription. That establishes the tested path, not continuous historical availability or a population success rate. A future removal decision would still need evidence about reader completion and an explicit policy for bounded first-message sending.

## Evidence stages

Page delivered → script/widget available → form submitted → challenge token returned → subscription API reached → verifier outcome → pending subscription saved → confirmation email accepted by provider → email delivered → confirmation followed → subscription active.

Each stage needs its own observation. A page response does not establish form availability; a queued beacon does not establish a stored report; a `202` does not establish email delivery. No stage in this system authenticates a count of distinct people.

## Artifacts

- `01-evidence.md`: retained logs, historical record, capture limits, and claims ledger.
- `02-client-audit.md`: implementation coverage and local failure probes.
- `03-protection-options.md`: primary sources, threats, and candidate decisions.
- `04-recovery.md`: whether addresses can be recovered, completed checks, and remaining access limits.
- `05-prior-art-2026.md`: original Turnstile rationale, current newsletter practices, hosted and self-hosted alternatives, counterevidence, and decision protocol.
- `repro/audit.mjs`: local synthetic probes; never contacts production or sends email.
- `repro/lifecycle.mjs`: real SQLite probes for inactive-address resubscription and unknown confirmation tokens.
- `article.md`: provisional article draft, outside the publishing directory.
- `source.prompts.md`: exact human prompts that shaped this investigation.

Private operational captures are stored separately from the repository. Public artifacts omit credentials, addresses, challenge/confirmation tokens, raw IPs, provider message IDs and complete visitor records. The later authorized test receipt includes its opaque operation IDs to connect sanitized stages; these are not visitor identities or historical recovery evidence. Public summaries are author-produced evidence, not independent access to Cloudflare's private logs.

## Earlier work order — September 8 PDT

Goga's September 8 PDT follow-up separates simplicity from outsourcing. [TASK-0127's current scope](03-protection-options.md#current-scope-simple-signup-on-our-existing-platform) recommends keeping the existing platform and repairing concrete gaps. Buttondown is an optional alternative; no migration was selected and no provider URL is required to continue.

1. Reuse the reported parallel repair's receipt and verify any remaining signup, confirmation, unsubscribe, and resubscription acceptance gaps (TASK-0124, TASK-0129).
2. Preserve evidence and continue bounded recovery of older stored attempts, without activating unconfirmed addresses (TASK-0123, TASK-0130).
3. Repair specific browser logging, send-outcome, and diagnostic-ingestion gaps (TASK-0125, TASK-0126). Use existing application state for bounded recovery before adding infrastructure.
4. Decide proportionate protection for both signup and resend, separately from ownership (TASK-0127). Do not build multiple alternatives as a prerequisite for a working form.
5. Develop the unpublished article from the actual decision and result (TASK-0128).

At this checkpoint, the session had not independently verified the reported production repair. The later live receipt supplies that tested flow with its own limits. The article must continue to distinguish reports, proposals, local tests and observations.

## September 8 PDT / September 9 UTC research checkpoint

The [prior-art review](05-prior-art-2026.md) reconstructed the urgent April launch from Git and widened the comparison beyond challenge settings to ownership of the signup operation. Current providers combine pre-send protection with other controls; listmonk provides a self-hosted proof-of-work example with material limitations. The review qualifies the earlier preference for a widget-free trial and adds a concrete comparison protocol. Production repair, comparative tests, and the architectural decision remain unfinished. The draft and five shaping prompts are preserved; this pass ran no production SQL or email tests.

## Later September 8 PDT / September 9 UTC scope correction

The owner wanted a simple adopted capability for a personal blog. The agent then recommended Buttondown's hosted signup, with a small migration and completion check. The owner did not select that migration; the next section records his correction. Six complete shaping prompts had been preserved at this point. No account was created, subscriber imported, email sent, or runtime changed in this update.

## Follow-up: ownership remains a valid choice

Goga questioned why a public POST requires moving platforms. The recommendation above was the agent's inference, not an owner-selected migration. The current scope keeps the existing platform, reuses the reported repair evidence, and addresses the remaining concrete defects. Seven shaping prompts are preserved. The latest TASK-0124 checkpoint supersedes the earlier unqualified claim that signup remains unrepaired; this pass inspected local code and notes, with no new production query, email, or runtime change.
