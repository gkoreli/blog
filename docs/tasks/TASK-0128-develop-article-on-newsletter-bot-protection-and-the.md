---
id: TASK-0128
title: Develop article on newsletter bot protection and the failures our logs missed
status: done
parent_id: FLDR-0010
created_at: '2026-09-07T05:09:30.966Z'
updated_at: '2026-11-10'
type: task
---

## Current disposition — November 10, 2026

**Closed by owner.** Goga retired the standalone subscription-bombing manuscript
and any obligation to update or publish it. Completed research and engineering
remain available. The separate Turnstile article source was promoted in
`3efc3435` and now lives in
[posts](../../packages/blog/posts/043-cloudflare-turnstile-signup-failures.md),
with its [prompts](../../packages/blog/prompts/cloudflare-turnstile-signup-failures.prompts.md).
This source-history fact is not fresh production acceptance. `done` closes this
article task; it does not complete separate maintenance tasks. Earlier
instructions to keep this task in progress are superseded. See the
[article disposition register](../../packages/blog/drafts/README.md).

## Historical task record

P2 editorial. Governing form: evidence-led engineering investigation with an active field-note state. Owned trigger: Goga's friend could not subscribe, invalid production Turnstile secret, and uncertainty about earlier readers. Test whether the newsletter's protection and observability are proportionate; do not presuppose Turnstile is bad. Draft alongside evidence. Show the value and gaps of existing first-party logging, earlier April incident, retention and identity limits, alternatives and current repair status. Protect the skepticism as an unresolved question. Exact human prompts must be preserved intact; no invented or trimmed owner quotes. Draft and research live outside posts/ pending author review and publication decision. Apply shape-article, blog-writing investigation reference, discovery/share passes when release is intended, and final prose/fact-check passes.

## Current publication handoff — November 6 Pacific

Goga confirms that today's article is already published and **Turnstile goes
November 7, 2026 at 08:00 America/Los_Angeles**. The corrected schedule/source
was committed and pushed in `ceef0a41`. The [manifest](../../packages/blog/publication-schedule.json)
selects the [finished article](https://github.com/gkoreli/blog/blob/ceef0a41dce62b9f04f6d82abaa13b87d4d88b32/packages/blog/scheduled/2026-11-07/043-cloudflare-turnstile-signup-failures.md)
and its [eight exact prompts](https://github.com/gkoreli/blog/blob/ceef0a41dce62b9f04f6d82abaa13b87d4d88b32/packages/blog/scheduled/2026-11-07/cloudflare-turnstile-signup-failures.prompts.md).
No Turnstile release is selected for November 6. Its body and prompt bytes are
preserved; only queued date metadata and directory changed. Local queue validation
passed after the move. The [publication worklist](../worklist/november-daily-publication/README.md)
owns the remaining November 7 promotion, push, deployment and live checks.

Engineering/article preparation is accepted; actual Turnstile publication remains
pending. Keep this task in progress. The broader subscription-bombing draft has
its own nine-prompt record and remains unpublished; the Turnstile companion has
eight selected prompts. Earlier November 6 rehearsal and delivery receipts retain
their original dates and are not proof of the rescheduled publication. This date
confirmation is operational bookkeeping, outside the article's shaping prompts.

## Dated investigation checkpoints

**November 6, 09:40 UTC delivery:** The revised hosted queue check passes on
actual checkout 17efb44b; that source has its own native activation and served-byte
acceptance. A separate non-publishing Actions-token control reaches Cloudflare
and 100% activation, preserving its initial build failure and later success;
the temporary workflow/control are removed after capture. The [delivery
receipt](../worklist/november-daily-publication/2026-11-06-turnstile-delivery-checks.json)
and [Research 32 audit](../../packages/blog/drafts/research/newsletter-reliability/32-four-hour-engineering-iteration.md)
separate implementation, eight-prompt article/rehearsal, no-send production
verification, source delivery and future article publication. The wider article
task remains in progress through scheduled publication; no population conversion
improvement or new mailbox cycle is claimed.

**November 6, 08:43 UTC preparation:** [Research 32](../../packages/blog/drafts/research/newsletter-reliability/32-four-hour-engineering-iteration.md)
records the expanded code/article work, independent reviews and distinct native
receipts. The revised Turnstile body and eight complete selected prompts pass
the current 44-post rehearsal and desktop/narrow checks. A prompt wrapping defect
is repaired without editing its bytes. The November 6 08:00 Pacific entry is
restored; the [publication worklist](../worklist/november-daily-publication/README.md)
owns the revised hosted check and future timed publication. Current source and
activation association plus the fixed-window audit still remain in progress.

**November 5 Pacific / November 6 UTC expanded goal:** The owner requests four additional hours improving code and article with DDD, authoritative/native-source inspection, useful logging, refactoring and original-builder delegation. [Research 32](../../packages/blog/drafts/research/newsletter-reliability/32-four-hour-engineering-iteration.md) owns the fixed 06:07:25–10:07:25 UTC window, file ownership, first reproduced defects and requirement-by-requirement acceptance. The previous November 6 manifest entry is held during revision; source remains preserved. Eight selected prompts now include the complete new direction. Re-register the release only after integrated code/article acceptance; prior editorial completion below does not close this wider work.

**November 5 publishing handoff:** The coordinator accepted builder revision `7f02173` after a full prose review and isolated 43-post release rehearsal. The reviewed article and seven selected prompts are registered for the November 6 08:00 Pacific attempt in the [publication worklist](../worklist/november-daily-publication/README.md). Queue source `d4e5544` is pushed, and the populated queue passes its hosted non-publishing check. This resolves the queue decision left to the publishing chat below. Actual article publication and live acceptance remain pending the scheduled release.

**November 5 Pacific / November 6 UTC substantive revision:** [Research 31](../../packages/blog/drafts/research/newsletter-reliability/31-turnstile-diagnostic-method-revision.md) records the owner's delegation through the publishing chat, its independent editorial review and the revised [full draft](../../packages/blog/drafts/research/newsletter-reliability/turnstile-pain-points.md). The article now opens on the agent-introduced readiness regression, supplies a six-stage symptom/check/finding map and follows one argument about proving handoffs. Native loading, delivered configuration, report phase, recovery and completed signup are distinguished. Operational tangents are compressed; the separately accepted signed feedback is one linked follow-up. Secret-installer uncertainty, report identity/history limits, cached-client action compatibility and one-cycle bounds remain explicit. Seven complete selected human prompts now include the exact latest request; the private operational authorization remains omitted with disclosure. This revision changes no runtime, post, release metadata or scheduler. The publishing chat owns final review and any November 6 queue decision after source delivery.

**November 5 Turnstile companion draft:** The owner now requests an article about Turnstile's pain points. [Full draft](../../packages/blog/drafts/research/newsletter-reliability/turnstile-pain-points.md) and [shape/claim/review record](../../packages/blog/drafts/research/newsletter-reliability/29-turnstile-article-shape-and-review.md) reuse the accepted investigations without reopening production tests. Working title: Cloudflare Turnstile: What Kept Breaking My Signup Form. It covers the invalid secret, public-key rendering failure, agent-introduced `ready()`/defer regression, idle error noise, mode/appearance/execution choices, bounded recovery, report storage and full signup acceptance. Six selected complete prompts are preserved; the operational test-address authorization remains private with explicit omission disclosure. The original subscription-bombing draft retains its separate center and history. Primary source, positioning, engineering and prose passes are recorded; the new article remains outside `posts/`, without publication metadata or a frozen research footprint. Next: owner feedback on the full draft, then a separate publication decision and isolated release checks.

Initial field-note draft and exact three shaping prompts written: packages/blog/drafts/research/newsletter-reliability/article.md and source.prompts.md. Added recovery limits from the owner's latest question. This is an unpublished working draft; production repair, provider-history review and the protection decision remain unresolved.

## September 8 PDT / September 9 UTC draft update

The draft now reconstructs the April launch rationale from pinned Git records and connects the protection decision to 2026 prior art and operational ownership. Its original retention snapshot is labeled historical after the Paid upgrade. The [new source comparison](../../packages/blog/drafts/research/newsletter-reliability/05-prior-art-2026.md) records limits and counterevidence; source.prompts.md preserves five complete shaping prompts. No comparative performance verdict or successful production repair is claimed. The article remains an unpublished field note outside posts/.

## Parallel article checkpoint — September 9 UTC

Rebuilt the unpublished draft around the owner's requested subject, Subscription Bombing: How I Protect My Blog, while server and browser implementation ran alongside it. The [worklist index](../../packages/blog/drafts/research/newsletter-reliability/00-worklist-index.md) links the article passport, primary source/claim ledgers, design, independent review, server/client/D1 verification, and ORM decision. All research Markdown remains in the existing directory. Nine complete shaping prompts are preserved. The draft distinguishes the historical secret failure from an unobserved bombing attack, local test results from production acceptance, admissions from provider API calls, and implemented safeguards from remaining limits. Publication is not authorized by drafting and has not occurred.

## Break checkpoint — September 9 UTC

The unpublished draft now includes implementation 86dad93, the fresh verifier-binding repair and one completed authorized flow, preserving the Gmail Spam result. Nine exact shaping prompts remain; test-address authorization and this housekeeping are operational records, not additions to the public prompt page. Review article.md and its claim/source ledgers in the worklist folder. No article route, release metadata or frozen research footprint exists. [14-handoff.md](../../packages/blog/drafts/research/newsletter-reliability/14-handoff.md) is the current resume point; avoid older acceptance-pending instructions.
