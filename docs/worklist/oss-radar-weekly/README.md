# Weekly OSS Radar production

**Automatic publication paused — November 14, 2026:** the [hosted workflow](https://github.com/gkoreli/blog/actions/workflows/november-publication.yml) (`408698342`, now named “Weekly OSS Radar publication”) is disabled. GitHub returned `disabled_manually`, with no queued or running jobs when checked. This pauses the planned November 16 automatic release and subsequent Monday releases. The setup acceptance below records the earlier activation.

Started November 14, 2026, America/Los_Angeles. One OSS Radar issue each Monday, with the hosted release attempt at **08:00 Pacific**, beginning November 16. This replaces the [November daily campaign](../november-daily-publication/README.md) for future scheduled releases. Other publication work and retired article dispositions retain their own scope.

## Reader promise

Assemble a coherent project selection from declared sources, explain its participants, and distill what matters across the set. The [series format](../../../.agents/skills/writing/references/oss-radar-format.md) follows issues #1 and #14: sources → projects → patterns → reasoned distillation. An issue may follow a cohort or curate a useful mix of launches, GitHub discoveries and returning projects. Each participant follows the [due-diligence workflow](../../../.agents/skills/writing/references/oss-radar-due-diligence.md), including history/recent changes, called code, claim audits, meaningful trials, firsthand reports and an actual take.

Single-project engineering explanations remain engineering articles. The MWG embedder manuscript's earlier #15 assignment was withdrawn November 14, and its queue/manifest entry removed. Completed research is retained. Future-issue scouting must not displace the next cohort issue's unfinished work. A negative trial can strengthen a project review when its actual lesson and limits are clear.

## Working rhythm

Two recurring work starts each day: **09:00 and 14:00 Pacific**, in the existing OSS Radar chat. These are substantive working sessions, not reminders. Actual session length depends on the work and runtime; scheduled starts are not a claim about hours already spent.

| Day | Main work | Required result |
| --- | --- | --- |
| Monday, after release | Check publication acceptance; select the next source mix/cohort | One active issue, discovery provenance and a declared selection |
| Tuesday | Read the selected projects' announcements, code, tests, discussions and alternatives | Per-project claim/product maps and declared consequential trials |
| Wednesday | Install, integrate, instrument and exercise representative work | Actual inputs, outputs, failed attempts and useful implementation evidence |
| Thursday | Challenge the first explanation; compare a baseline, failure or negative control | A result that supports, changes or narrows the product interpretation |
| Friday | Write the project reviews, cross-project patterns and distillation | Cohesive manuscript supported by the project's source and trial records |
| Saturday | Review claims against source and results; test the reader's reproduction path; edit prose | Resolved consequential discrepancies and a readable release candidate |
| Sunday | Recheck live facts; render the real site in isolation; freeze the ready source | Reviewed source and readiness record by 17:00 Pacific; queue only when publication is authorized |
| Monday 08:00 | When authorized, hosted publisher promotes the dated queue entry and checks deployment | Separate source, deployment and served-content acceptance; currently paused |

Stages may overlap. Reuse accepted work rather than repeat measurements for a new date. Each session must advance a concrete milestone and save its conditions, evidence, limits and next bounded action. A setup failure is evidence about setup, not an evaluation result. Continue investigating when uncertainty changes the advice; stop repeating passed checks when nothing relevant changed.

Field work can use an owned application, a representative synthetic workflow or attributed firsthand public reports. Do not invent readers, customers or adoption. Contacting maintainers or readers, posting on external platforms and spending on paid services require their own authorization. X account operation remains stopped; preparation of copy is separate from publication on the blog.

## Release standard

Before placing an issue in the publication manifest, record the following in its research directory:

1. **Value and form:** identify the sources and selection rationale, and make the useful findings immediate. Deliver project reviews, cross-project interpretation and an earned distillation in the recurring format.
2. **Understanding:** record the full source population, dates, sample/inclusion rules and biases. Pin each reviewed project's revisions; trace consequential actions through called code and dependencies. Reconcile release-versus-main differences.
3. **Evidence:** test the claim that matters, with a meaningful comparison or control. Keep observed, reproduced, source-inspected, maintainer-reported and proposed claims distinct. Explain the conditions that could change the conclusion.
4. **Useful substance:** the cohort reviews and distillation must help a reader decide what matters. Retain checked reproductions, integrations or fixtures when they support a project judgment; do not require an artificial tool build or turn an entry into an unrelated tutorial.
5. **Adoption judgment:** explain fit, alternatives and the operating responsibilities that matter. Include counterevidence and limits that affect the decision. Do not infer demand or effectiveness from stars and launch attention.
6. **Editorial acceptance:** check factual/code accuracy, usefulness to a reader unfamiliar with the work, and plain prose in separate passes. Remove repeated staging labels, drafting conversations and claims unsupported by the actual result.
7. **Release acceptance:** check current consequential issues/terms, metadata, links, one matching H1, exact scheduled date, real generated HTML, Markdown/citations/discovery outputs and social card. Build in an isolated checkout. Preserve prompts privately and sync scoped captures before handoff.

The worklist is not a numerical quality score. Record the reason an issue is ready and the limits that remain. If essential evidence is missing, finish the experiment, narrow the supported article or explicitly hold the release. Do not publish an arbitrary draft to fill the slot. The scheduler fails visibly when a Monday has no reviewed queue entry.

## Current issue and next work

| Release | Issue | State | Next bounded action |
| --- | --- | --- | --- |
| November 16, 2026 | #15 — November launches and Takumi revisited | [First manuscript and participant research](../../../packages/blog/drafts/research/oss-radar-15-november-show-hn/README.md); provisional selection, no ready source queued; publication paused | Close consequential remaining checks, then refresh the closed inventory and review the full manuscript on Sunday |
| November 23, 2026 | #16 — source/cohort to be selected | Earlier [project leads](scouting/2026-11-14.md) retained as research, without selecting a standalone Radar issue | Select a source after #15 is complete; current issue takes priority |

Issue #15 continues #14's Show HN source with a new bounded window. Its first inventory has 584 submissions and eight direct-GitHub candidates at 50+ points; Klad's main application is explicitly source-available and excluded from OSS reviews. Seven open-source candidates remain under review; November 14 is still an open UTC partition. The [issue record](../../../packages/blog/drafts/research/oss-radar-15-november-show-hn/README.md) owns final selection, project evidence and manuscript readiness. The [MWG engineering research](../../../packages/blog/drafts/research/modern-web-guidance/README.md) is separate.

The [source portfolio](sources.md) also includes public GitHub activity and returns to earlier cohorts. Takumi is the first return-visit dossier: historical/current source comparison and a two-version native-renderer control are recorded with their limits. Show HN is one discovery source, not a permanent restriction on the publication.

After the cadence is established, develop one fully reviewed reserve issue and a small qualified topic list. A reserve still needs live-fact checks before its dated release. Do not reopen retired drafts without owner direction.

## Scheduling and continuity

- [Queue and recovery procedure](../../../packages/blog/scheduled/README.md)
- [Release manifest](../../../packages/blog/publication-schedule.json)
- [Hosted workflow](../../../.github/workflows/november-publication.yml), retaining its historical filename and Actions history while changing to weekly publication
- [Selection/promotion](../../../packages/blog/src/lib/publication-schedule.ts) and [focused checks](../../../packages/blog/test/publication-schedule.test.ts)
- [OSS writing/research guidance](../../../.agents/skills/writing/references/oss-research.md)

The hosted Monday job remains disabled under the publication pause. Preparation may finish reviewed source but must not re-enable or bypass that pause, publish early or create a second publisher. When release is authorized, the existing Monday job is the sole automatic path. Its 08:00 trigger does not guarantee exact-minute availability.

## November 14 setup acceptance

- Preparation heartbeat `build-the-weekly-oss-radar` is active in the existing OSS Radar chat, with daily 09:00 and 14:00 local starts. Its instructions require substantive phase-appropriate work and a saved milestone, rather than a reminder. The expired X conversation-scanning automation was paused; no X account operation is part of this schedule.
- Weekly promotion tests passed **14/14**, including the Pacific release boundary, December and daylight saving time, other weekdays, missing issues, duplicate Monday releases, collision/rollback and private-prompt rejection. Workspace typecheck and the actual manifest check passed.
- Rehearsed the dated issue in a separate checkout: 07:59:59 Pacific did not promote; 08:00 did; exact article bytes survived and a retry was idempotent. Metadata validation passed for 36 Markdown posts; the production build generated 47 total posts. HTML, Markdown, citations, index, RSS, sitemap, discovery files and the social image passed inspection. The rendered article and freshly rebuilt catalog example were also checked in the browser. Details belong in the [issue readiness record](../../../packages/blog/drafts/research/modern-web-guidance/weekly-release-2026-11-16.md).
- Scoped source delivered to main at `20dff0323787ebe0d8dfbc23b09cb8632c9f6729`. GitHub workflow `408698342` is active with the weekly display name and the time-zone-aware Monday schedule. [Hosted check run 43617079152](https://github.com/gkoreli/blog/actions/runs/43617079152) succeeded against that source; its log accepted one reviewed issue starting November 16. Validation/build, source promotion/push and live verification were skipped in this non-publishing mode, as intended. Local checks above supply the rehearsal evidence. This run does not prove the future scheduled wakeup or Cloudflare's deployment of the article.

November 14, 09:00 working session: reconciled the new MWG/E5 release addenda without duplicating their completed evaluations or editing the queued article. Qualified three current primary-source leads for the following issue. Bright Lines' unchanged 28-test suite passed; six additional hook-process controls reproduced its crash-wrapper behavior and a counter-lock stall at the configured 10-second deadline. The [scout and reproducible fixture](scouting/2026-11-14.md) distinguish those observations from documented host timeout behavior. This remains candidate work, with no guard installation, actual tool command or model-provider call.

November 14 format correction supersedes the prior MWG release assignment and one-project default. The research fixture above remains valid, but does not select Bright Lines as a standalone Radar issue. The preparation heartbeat now follows the source/cohort contract and prioritizes #15 through the weekend.

November 14 Saturday milestone: added the canonical [format](../../../.agents/skills/writing/references/oss-radar-format.md), [participant due diligence](../../../.agents/skills/writing/references/oss-radar-due-diligence.md) and broader [discovery portfolio](sources.md). Built a 584-entry provisional launch inventory, checked licenses and recent releases, read consequential implementation/discussion paths and wrote participant dossiers plus the [first cohort manuscript](../../../packages/blog/drafts/research/oss-radar-15-november-show-hn/article.md). Controls exercised the real Neovim plugin, ZigZag CLI, small JAX mechanisms, Yogurt MCP/queue modules, AgentRun kernel/bridge, released Agweb app and two published Takumi versions. The Takumi comparison retained two passing conditions before a source-derived same-object condition reproduced the registration change; identical PNGs alone missed it. Agweb's official release passed the five-workspace cookie/storage control after a retained source-build environment failure. Scope and failures stay in the issue record. Per-project elapsed totals were not recorded.

The existing preparation heartbeat now reads both canonical guides and the source portfolio, permits useful mixed-source issues/return visits, and requires substantial participant work. It retains its daily 09:00/14:00 starts and the publication pause. GitHub returned `disabled_manually` for publisher 408698342 again during this session; the manifest contains no articles. No X or external publication was performed.

Next bounded action: refresh the closed November 11–14 inventory on Sunday, then perform factual/usefulness/prose reviews of the actual manuscript. Reconcile the final roster/count/date and distinguish the tested components from unrun whole-product claims. Preserve the disabled publisher. No future release or reader outcome is claimed in advance.
