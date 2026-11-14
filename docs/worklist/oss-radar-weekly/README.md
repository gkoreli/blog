# Weekly OSS Radar production

**Automatic publication paused — November 14, 2026:** the [hosted workflow](https://github.com/gkoreli/blog/actions/workflows/november-publication.yml) (`408698342`, now named “Weekly OSS Radar publication”) is disabled. GitHub returned `disabled_manually`, with no queued or running jobs when checked. This pauses the planned November 16 automatic release and subsequent Monday releases. The setup acceptance below records the earlier activation.

Started November 14, 2026, America/Los_Angeles. One OSS Radar issue each Monday, with the hosted release attempt at **08:00 Pacific**, beginning November 16. This replaces the [November daily campaign](../november-daily-publication/README.md) for future scheduled releases. Other publication work and retired article dispositions retain their own scope.

## Reader promise

Help an engineer make a decision or understand a useful implementation through source reading and work they can inspect or repeat. Each issue needs a specific reader problem, an original observation or explanation beyond the README, evidence that can change the advice, and a practical consequence. A project announcement, a list of features or time spent researching is insufficient by itself.

Choose one main project unless a cohort answers a shared question. Depth comes from tracing and exercising consequential behavior, not covering more repositories or accumulating benchmark counts. A negative result or unfinished integration can be valuable when the supported lesson and remaining uncertainty are clear.

## Working rhythm

Two recurring work starts each day: **09:00 and 14:00 Pacific**, in the existing OSS Radar chat. These are substantive working sessions, not reminders. Actual session length depends on the work and runtime; scheduled starts are not a claim about hours already spent.

| Day | Main work | Required result |
| --- | --- | --- |
| Monday, after release | Check publication acceptance; scout current primary sources and choose the next reader problem | One active issue, a short alternative list and a bounded question |
| Tuesday | Read announcements, source, tests, discussions and relevant alternatives; trace the called path | Versioned claim map, dependency/operator map and declared experiment controls |
| Wednesday | Install, integrate, instrument and exercise representative work | Actual inputs, outputs, failed attempts and useful implementation evidence |
| Thursday | Challenge the first explanation; compare a baseline, failure or negative control | A result that supports, changes or narrows the product interpretation |
| Friday | Build the explanation around the supported result; finish the reusable artifact | Complete manuscript and runnable example, fixture, patch or decision aid |
| Saturday | Review claims against source and results; test the reader's reproduction path; edit prose | Resolved consequential discrepancies and a readable release candidate |
| Sunday | Recheck live facts; render the real site in isolation; freeze the ready source | Reviewed article queued by 17:00 Pacific, with a release-readiness record |
| Monday 08:00 | Hosted publisher promotes the dated queue entry and checks deployment | Separate source, deployment and served-content acceptance |

Stages may overlap. Reuse accepted work rather than repeat measurements for a new date. Each session must advance a concrete milestone and save its conditions, evidence, limits and next bounded action. A setup failure is evidence about setup, not an evaluation result. Continue investigating when uncertainty changes the advice; stop repeating passed checks when nothing relevant changed.

Field work can use an owned application, a representative synthetic workflow or attributed firsthand public reports. Do not invent readers, customers or adoption. Contacting maintainers or readers, posting on external platforms and spending on paid services require their own authorization. X account operation remains stopped; preparation of copy is separate from publication on the blog.

## Release standard

Before placing an issue in the publication manifest, record the following in its research directory:

1. **Value:** name the reader, the job or decision, and the passage that delivers the promised payoff. The opening should make the useful result clear immediately.
2. **Understanding:** pin the release/source revisions and trace the important user action through called code, state, network and returned result. Reconcile consequential release-versus-main differences.
3. **Evidence:** test the claim that matters, with a meaningful comparison or control. Keep observed, reproduced, source-inspected, maintainer-reported and proposed claims distinct. Explain the conditions that could change the conclusion.
4. **Something usable:** supply a checked reproduction, worked integration, small tool, patch or decision guide that lets the reader act. A build should answer the article's question; do not manufacture an extra product merely to have an artifact.
5. **Adoption judgment:** explain fit, alternatives and the operating responsibilities that matter. Include counterevidence and limits that affect the decision. Do not infer demand or effectiveness from stars and launch attention.
6. **Editorial acceptance:** check factual/code accuracy, usefulness to a reader unfamiliar with the work, and plain prose in separate passes. Remove repeated staging labels, drafting conversations and claims unsupported by the actual result.
7. **Release acceptance:** check current consequential issues/terms, metadata, links, one matching H1, exact scheduled date, real generated HTML, Markdown/citations/discovery outputs and social card. Build in an isolated checkout. Preserve prompts privately and sync scoped captures before handoff.

The worklist is not a numerical quality score. Record the reason an issue is ready and the limits that remain. If essential evidence is missing, finish the experiment, narrow the supported article or explicitly hold the release. Do not publish an arbitrary draft to fill the slot. The scheduler fails visibly when a Monday has no reviewed queue entry.

## Current issue and next work

| Release | Issue | State | Next bounded action |
| --- | --- | --- | --- |
| November 16, 2026 | #15 — How Modern Web Guidance's seven-line embedder works | Reviewed source queued; local rehearsal and hosted queue check accepted | Sunday recheck current evidence and the dated source before the release |
| November 23, 2026 | #16 — topic to be selected | [Three pinned leads qualified](scouting/2026-11-14.md); Bright Lines has an executed hook-process probe | Select the reader question after #15's release; if Bright Lines proceeds, freeze and exercise the missing host-level controls |

Issue #15 uses the [existing MWG research](../../../packages/blog/drafts/research/modern-web-guidance/README.md), including the static-embedding reproduction, public retrieval replay and short-metadata browser example. It adds no claim of independent training, teacher document embeddings, production blog search or a general retrieval-quality advantage. Its [release preparation](../../../packages/blog/drafts/research/modern-web-guidance/weekly-release-2026-11-16.md) owns acceptance details.

After the cadence is established, develop one fully reviewed reserve issue and a small qualified topic list. A reserve still needs live-fact checks before its dated release. Do not reopen retired drafts without owner direction.

## Scheduling and continuity

- [Queue and recovery procedure](../../../packages/blog/scheduled/README.md)
- [Release manifest](../../../packages/blog/publication-schedule.json)
- [Hosted workflow](../../../.github/workflows/november-publication.yml), retaining its historical filename and Actions history while changing to weekly publication
- [Selection/promotion](../../../packages/blog/src/lib/publication-schedule.ts) and [focused checks](../../../packages/blog/test/publication-schedule.test.ts)
- [OSS writing/research guidance](../../../.agents/skills/writing/references/oss-research.md)

The hosted Monday job is the only automatic publisher. Preparation sessions may queue a reviewed article; they must not publish it early, catch up a missed date on another weekday or create a second publisher. 08:00 starts the release attempt; GitHub scheduling, checks and deployment can delay live availability. No exact-minute guarantee is made.

## November 14 setup acceptance

- Preparation heartbeat `build-the-weekly-oss-radar` is active in the existing OSS Radar chat, with daily 09:00 and 14:00 local starts. Its instructions require substantive phase-appropriate work and a saved milestone, rather than a reminder. The expired X conversation-scanning automation was paused; no X account operation is part of this schedule.
- Weekly promotion tests passed **14/14**, including the Pacific release boundary, December and daylight saving time, other weekdays, missing issues, duplicate Monday releases, collision/rollback and private-prompt rejection. Workspace typecheck and the actual manifest check passed.
- Rehearsed the dated issue in a separate checkout: 07:59:59 Pacific did not promote; 08:00 did; exact article bytes survived and a retry was idempotent. Metadata validation passed for 36 Markdown posts; the production build generated 47 total posts. HTML, Markdown, citations, index, RSS, sitemap, discovery files and the social image passed inspection. The rendered article and freshly rebuilt catalog example were also checked in the browser. Details belong in the [issue readiness record](../../../packages/blog/drafts/research/modern-web-guidance/weekly-release-2026-11-16.md).
- Scoped source delivered to main at `20dff0323787ebe0d8dfbc23b09cb8632c9f6729`. GitHub workflow `408698342` is active with the weekly display name and the time-zone-aware Monday schedule. [Hosted check run 43617079152](https://github.com/gkoreli/blog/actions/runs/43617079152) succeeded against that source; its log accepted one reviewed issue starting November 16. Validation/build, source promotion/push and live verification were skipped in this non-publishing mode, as intended. Local checks above supply the rehearsal evidence. This run does not prove the future scheduled wakeup or Cloudflare's deployment of the article.

November 14, 09:00 working session: reconciled the new MWG/E5 release addenda without duplicating their completed evaluations or editing the queued article. Qualified three current primary-source leads for the following issue. Bright Lines' unchanged 28-test suite passed; six additional hook-process controls reproduced its crash-wrapper behavior and a counter-lock stall at the configured 10-second deadline. The [scout and reproducible fixture](scouting/2026-11-14.md) distinguish those observations from documented host timeout behavior. This remains candidate work, with no guard installation, actual tool command or model-provider call.

Next bounded action: Sunday recheck current MWG evidence and queued bytes, using the latest E5/editorial addenda rather than the earlier six-table receipt alone. Keep the [qualified leads](scouting/2026-11-14.md) for the following issue's selection after release; a full Bright Lines article still requires host-level acceptance and normal-workflow controls. No future Monday wakeup, live release or reader outcome is claimed in advance.
