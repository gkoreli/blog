# OSS Radar participant due diligence

Use with the [series format](oss-radar-format.md). A featured entry should reflect sustained understanding of the project and a reasoned judgment, supported by inspectable work. Allocate enough of the week to learn each participant; the work can take hours. Do not fill a roster first and then rush shallow reviews to match its size.

## Discovery portfolio

Maintain a small, qualified pool rather than treating one launch site as the publication's only source.

| Source | Useful evidence | Boundary |
| --- | --- | --- |
| Show HN and comparable launch discussions | Problem, maintainer explanations, first questions and reported attempts | Votes and comments are attention, not adoption; indexed samples have biases |
| GitHub home/feed, followed projects and recommendations | Leads worth investigating and changes in projects already of interest | Inspect the linked repository; a personal feed is not a reproducible public census. Do not publish private feed contents or private-repository information |
| Public releases, changelogs, RFCs and recent commit/PR history | What shipped, what is proposed, and which implementation changed | Default branch can be ahead of the version a user installs; commits are not outcomes |
| Earlier Radar cohorts, including #1's 32 projects | A dated starting point for a useful return visit | Recheck old claims; archived article copy is not proof of present behavior or a historical code state |
| Maintainer engineering posts and firsthand issue/user discussions | Design rationale, operating friction, contrary cases and changes in direction | Attribute reports; a statement of intent is not a completed result |

An issue can follow one cohort or curate several sources under a clear editorial rationale. Record origin and selection reason per participant. Mix new and returning projects when useful; do not impose a weekly quota for either. Keep engineering follow-ups distinct from Radar issue numbers.

## Dossier before prose

Keep the dossier in the issue's research directory and link any reused accepted work. Use compact records rather than repeating this whole workflow under every project.

1. **Identity and stake:** repository, maintainers, license, shipped version/source SHA, discovery source/date, user/job, adjacent alternatives and the reason this project deserves reader time.
2. **History to present:** reconstruct the relevant starting point, pivotal design/product changes and consequential work over the recent weeks. For a return visit, compare the earlier take with actual evidence now. Pin historical code when available; label missing baselines. Explain what persisted, changed, pivoted or remains unproven.
3. **Architecture and control:** trace one consequential action end to end: input → called implementation → state/store → local or remote services → output/side effect. Map what the project replaces, wraps, extends and relies on. Read defaults, feature flags, failure paths, tests and operational responsibilities.
4. **Claim audit:** list consequential product claims beside the exact supporting code/test/report and a plausible competing interpretation. Separate inspected, reproduced, maintainer-reported, user-reported and proposed states. Check license/model/service terms when they affect the use case.
5. **Meaningful trial:** declare the claim, representative input, baseline or negative control and acceptance before execution. Run an actual supported path where feasible. Keep failures and version mismatches. A no-hardware/model/provider condition remains a limit; do not call a narrow component test a complete product evaluation. Inspect generated artifacts or side effects, rather than accepting an exit code alone.
6. **People and friction:** read the relevant maintainer explanation, user reports, issues/PRs and rival approaches. Seek both useful experience and objections. Separate independent use from maintainer demos and statements of intent. No comments or reports is an absence of testimony, not negative sentiment. Contact requires separate authorization.
7. **Judgment and future:** explain who can use it now, which benefits survived the checks, what operating cost remains and what result would change the take. Connect any future to shipped design and missing work; label stated, in-progress, enabled or speculative direction. Do not infer a pivot, market moat or impending success from stars/commit counts.

## Working record

| Field | Record |
| --- | --- |
| State | Discovered → selected → source-understood → exercised or explicitly bounded → written → reviewed |
| Source/history | Dated links, pinned revisions, releases, important merged/open work and unavailable baseline |
| Claim → evidence → consequence | The product claim, what was actually inspected/run/reported, contrary evidence, and the reader implication |
| Trial | Declared input/control, environment, all retained attempts, artifact/result, limits and a checked reproduction where useful |
| People | Attributed firsthand reports and maintainer responses, disagreement and coverage limits |
| Time | Actual dated effort if recorded; otherwise unknown. Planned hours are not hours spent |
| Next action | The single unresolved check most likely to change the entry's judgment |

Completion is not a numerical score. Finish when the entry's consequential claims are supported, corrected, narrowed or explicitly left open, and it contributes something distinct to the issue. Reduce the featured set if essential work cannot be completed honestly; disclose the selection instead of padding entries.

## From dossiers to publication

Write problem/user, technical distinction, evidence and take as connected reader prose. Include history for a return visit where it changes the present interpretation. Use discussion and experiments to qualify the judgment, rather than append them as a research diary. Preserve meaningful uncertainty and a concrete hard question.

Review each entry against its dossier, then review the cohort as a whole: actual shared patterns, exceptions, alternative explanations, unequal importance and the resulting distillation. Recheck consequential current facts and the actual installed/released version before final rendering. Private author prompts and raw operational captures remain outside public Git. The [weekly worklist](../../../../docs/worklist/oss-radar-weekly/README.md) owns current priorities and publication authorization.
