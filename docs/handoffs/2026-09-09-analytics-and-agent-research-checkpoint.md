# Analytics and agent-readership research: break checkpoint

September 9 UTC / September 8 PDT, 2026. TASK-0141 is complete, its research is committed, and the referrer-context implementation has passed production acceptance. The author is taking a break. Resume from these artifacts rather than repeating the research or treating proposed experiments as work already underway.

## Completed work

| Outcome | Saved result and release |
|---|---|
| Matomo comparison and agent-subscription research | [TASK-0141](../tasks/TASK-0141-compare-blog-analytics-with-matomo-and-research-agent.md), **done**, pushed in `c42ab3a`. [Artifact index](../../packages/blog/drafts/research/agent-readership/00-worklist-index.md) links the comparison, two delegated protocol reviews, experiment designs, four exact prompts, and measured receipts. |
| Referrer analysis for the HN launch | `efdfe1b`; [findings](../../packages/blog/drafts/research/article-024-hacker-news/05-referrer-analysis.md), [committed analyzer](../../packages/blog/scripts/analyze-referrer-evidence.ts), SQL, and sanitized aggregates. The private scratch analyzer is no longer the only copy of the method. |
| Referrer categories and internal page transitions | Runtime `c338059`, receipt `1cb8c7a`; migration 0009, local tests/D1/browser checks, nine excluded scripted requests, bounded report query, and live cache reuse. [Acceptance](../../packages/blog/drafts/research/article-024-hacker-news/07-transition-release-acceptance.md). |
| Article 024's bounded revision and footprint | Remain complete. The [September 7 checkpoint](2026-09-07-publication-checkpoint.md) owns the release accounting and older recovery archive. This later research and bookkeeping do not change its frozen prompts or footprint. |

Two small checks support the new research. The feed returned 25 distinct item GUIDs and a subsequent zero-body 304 at 02:15:51 UTC. Our local verifier rejected Matomo's placeholder-signature fixture without a network request. The reports distinguish those executions from code inspection: Matomo's full stack and subscription interoperability were not run. The local signature reproducer, source hashes, and exact versions are committed.

TASK-0141 fulfilled a research request. Its proposed experiments extend that result; they are not missing acceptance criteria or a reason to reopen the task. Creating a work record should lead to execution, a readable artifact, validation, and an explicit completion report. Use the artifact link as the primary handoff to the author.

## Findings to preserve

- **Matomo overlap:** server collection without JavaScript, cookieless configurations, AI reports, and page transitions already exist; its Funnels plugin provides more complete conversion analysis. We reuse its referrer-spam list. Our inspected ChatGPT-provider comparison supports a specific signature-verification difference, with no measured overall accuracy, reliability, or cost advantage. [Comparison](../../packages/blog/drafts/research/agent-readership/01-matomo-and-agent-subscriptions.md).
- **Authorization:** existing OAuth mechanisms and active agent-specific proposals address delegated permission. Microsub/IndieAuth already let a client manage a person's reader subscriptions. AP2 supplies a commerce precedent for advance permission. Keep published standards, individual drafts, documented implementations, and tested interoperability distinct. A valid signer, an account's grant, a successful follow, delivery, and human reading are different observations. [Delegation](../../packages/blog/drafts/research/agent-readership/02-delegation-prior-art.md), [subscriptions](../../packages/blog/drafts/research/agent-readership/03-agent-subscription-protocols.md).
- **Publication visibility:** agents can follow our public feed through their own reader without creating a publisher account. The page counter excludes feed polling. Lack of a publisher-side subscription record cannot establish that no one follows through a reader.
- **Referrers:** before the new capture, missing stored hostnames merged absent, unusable, and discarded internal referrals. The 652-row historical set cannot be assigned wholly to direct visits, HN, or bots. New categories and recognized internal paths improve visibility from deployment onward; they do not recover lost paths or prove complete journeys.
- **Audience measurement:** the HN response demonstrates increased recorded access and a reader's question. It does not establish classification accuracy or explain why this article performed well. The historical 372 → 95 rule effect and 95-versus-14 script-counter disagreement remain bounded findings.

The initial HN report has **1,616 Browser observations**, including **753 with an HN referrer**, over September 3–9 UTC with September 9 partial. The later acceptance report has **1,619**, split into 966 external and 653 historical unknowns. Their timestamps differ; do not overwrite the first cohort with the later total. The later selected report contained no included organic internal transitions yet.

The report acceptance used 58,204 D1 reads for its 12-section query. That is neither an account-wide total nor a like-for-like comparison with the earlier 33,259-read benchmark. Reuse saved captures and the shared query-budget rules before running production SQL.

## Work to resume, with its actual status

| Work | Status and next bounded step |
|---|---|
| [TASK-0119: identity and purpose](../tasks/TASK-0119.md) | Open implementation: separate the current grouping while preserving signer and UA evidence; retain the known/unknown trigger distinction. Provenance repair and scripted owner exclusion have already passed their stated checks. |
| [TASK-0120: browser/beacon calibration](../tasks/TASK-0120.md) | Open experiments: inspect available traces and run labelled real-browser cases. Nine supplied-header HTTP controls do not complete these trials. Verify exclusion for the actual client and UTC day before generating new controls. |
| [TASK-0135: HN learning](../tasks/TASK-0135-measure-article-024-hacker-news-launch-and-choose-the-follow.md) | Launch capture, referrer analysis, and implementation are complete. Further observation and the choice of a launch follow-up article remain open. The September 14, 05:13:22 UTC review is a target, not a scheduled job. |
| Agent subscription lifecycle | Proposed extension in [experiment 1](../../packages/blog/drafts/research/agent-readership/04-experiments-and-decision.md#experiment-1-an-authorized-agent-follows-a-publication). When this direction resumes, select and pin a disposable reader/server pair; test follow, new items, restart/recovery, unfollow, and grant revocation. Publication-specific permission is a subsequent extension. |
| Matomo comparison by execution | Proposed extension in [experiment 2](../../packages/blog/drafts/research/agent-readership/04-experiments-and-decision.md#experiment-2-compare-the-same-requests-in-matomo-and-this-blog). Reuse TASK-0120's known-request work instead of creating another calibration program. |

The [ten-post lane](../folders/FLDR-0008.md) retains its existing article slots and separate Trellner exploration. The new research adds no automatic publication commitment. Article 025's separate [research and release record](../../packages/blog/drafts/research/referrer-spam/00-article-passport.md) remains independently maintained.

The two delegated research turns are finished. No recurring capture, browser experiment, or subscription job was scheduled by this thread. An open task records work to resume; it does not mean an agent continues working during the break.

## Newsletter and private evidence boundaries

Newsletter implementation and live acceptance were being handled in parallel. Read its [current handoff](../../packages/blog/drafts/research/newsletter-reliability/14-handoff.md), [verification record](../../packages/blog/drafts/research/newsletter-reliability/10-verification.md), and [worklist](../../packages/blog/drafts/research/newsletter-reliability/00-worklist-index.md) before making an availability claim or changing credentials. Earlier retained subscriber counts in the HN capture are dated observations; they must not be presented as current totals or proof that no signup attempt occurred.

Public methods and sanitized results are in Git. The original Matomo downloads remain at `~/.local/share/gkoreli/analytics-evidence/2026-09-09-agent-readership/`. HN/referrer captures are under `~/.local/share/gkoreli/analytics-evidence/2026-09-09-article-024-hn/`. The receipts record source hashes, scope, and limitations. Raw operational captures, session logs, credentials, and subscriber addresses stay outside public artifacts.

The isolated referrer candidate remains at `/Users/goga/.local/share/gkoreli/worktrees/referrer-context-20260909`, based on `c235029d6560a0e894c835e6af0cf3aa7bc829e6`. At this checkpoint, **all 18 staged runtime files matched their contents in release `c338059` byte for byte**. Its untracked `.dev.vars` is local configuration. There is no unmatched implementation in those 18 files to merge.

The saved `transition-acceptance/runtime-release.patch` has SHA-256 `26a44a8dbd33522645ab119091fc16e61b9d8f66d5bdf27d98e366d3b8688365`. The released files can be recovered directly from Git at `c338059`; use a fresh checkout and compare with current `main` before reusing an older candidate. The older article-024 archive and its recovery instructions remain in the September 7 checkpoint. No worktree was reset, cleaned, deleted, or merged during this handoff.

## Bookkeeping validation

The review covered 14 documents, 145 local links, three local heading fragments, and seven task/folder frontmatters. Whitespace checks passed. Article 024 and its research directory remain unchanged from `c42ab3a`, with the same 21 Markdown artifacts; the four agent-readership prompts are unchanged. All 18 referrer-candidate files matched the recorded release. No application code changed or application tests were repeated for this handoff. Concurrent newsletter and article-025 bookkeeping has separate records and commits.
