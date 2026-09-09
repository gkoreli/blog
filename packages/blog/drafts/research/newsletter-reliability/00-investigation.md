# Newsletter reliability investigation

Started September 6, 2026 Pacific; captures continue September 7 UTC. Worklist: FLDR-0010, TASK-0123 through TASK-0130. Source revision at the initial audit: `3d92b10b7a495ab537646b141e2dc9bbba7e20e7`.

## Question and living center

A friend could not subscribe. The production verifier rejected the server's secret, while the form suggested retrying or allowing bot protection. Goga is skeptical of the protection and wants to know whether earlier readers met the same failure, and whether our browser diagnostics can answer that question.

The governing form is an evidence-led engineering investigation, currently a field note. The live question is whether the protection and operational burden are proportionate to this newsletter's abuse exposure. An invalid credential is an integration failure; it does not measure Turnstile's ability to distinguish abuse from legitimate requests.

Working claim: the existing flow has a confirmed configuration failure and incomplete diagnostic coverage. A claim that Turnstile should be removed needs further evidence about abuse, alternative controls, and reader completion. A successful controlled signup would establish that tested path, not a population success rate.

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

Private operational captures are stored separately from the repository. Public artifacts omit credentials, addresses, challenge/confirmation tokens, raw IPs, request identifiers, and complete visitor records. Public summaries are author-produced evidence, not independent access to Cloudflare's private logs.

## Work order

Goga's September 8 PDT simplicity constraint now governs the order. [TASK-0127's current direction](03-protection-options.md#current-direction-adopt-a-maintained-newsletter-service) recommends a maintained service with a hosted signup page. The next missing input is the actual newsletter's public URL. Provider selection and production acceptance remain open.

1. Verify the supported signup, confirmation, unsubscribe, resubscription, and export flow; replace the blog entry point and retire the old sender only with a safe migration (TASK-0127).
2. Preserve evidence and continue bounded recovery of older stored attempts, without activating unconfirmed addresses (TASK-0123, TASK-0130).
3. Keep general browser logging and diagnostic-ingestion repairs (TASK-0125, TASK-0126). Reassess newsletter-specific repairs against the chosen service; do not build a custom delivery framework in parallel.
4. Retain the existing credential and lifecycle findings (TASK-0124, TASK-0129). Repair the custom path if it must remain in service; otherwise close those implementation items only after verified retirement, with the evidence preserved.
5. Develop the unpublished article from the actual decision and result (TASK-0128).

The present investigation does not claim a repaired production flow. The article can describe unresolved work, but must not claim that a proposed control was deployed or successful.

## September 8 PDT / September 9 UTC research checkpoint

The [prior-art review](05-prior-art-2026.md) reconstructed the urgent April launch from Git and widened the comparison beyond challenge settings to ownership of the signup operation. Current providers combine pre-send protection with other controls; listmonk provides a self-hosted proof-of-work example with material limitations. The review qualifies the earlier preference for a widget-free trial and adds a concrete comparison protocol. Production repair, comparative tests, and the architectural decision remain unfinished. The draft and five shaping prompts are preserved; this pass ran no production SQL or email tests.

## Later September 8 PDT / September 9 UTC scope correction

The owner wants a simple adopted capability for a personal blog. The current recommendation is Buttondown's hosted signup, with a small migration and completion check. Building the earlier comparison candidates is no longer the next action. Six complete shaping prompts are preserved. No account was created, subscriber imported, email sent, or runtime changed in this update.
