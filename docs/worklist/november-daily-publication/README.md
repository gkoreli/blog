# November daily publication

Started November 5, 2026, Pacific time. Owner wants a new article each day this
month, published at 08:00; the November 5 article is already published and its
later publication time is accepted. The environment's America/Los_Angeles
timezone is the stated assumption. This task covers prepared-article scheduling;
the optional writing-reminder preference was asked separately and is unanswered.

## Implementation choice

25 release dates remain: November 6–30. A hosted GitHub Actions schedule starts
at 08:00 Pacific and promotes only the finished article explicitly listed for
that date. No automatic drafting or publication of arbitrary existing drafts.
An empty day fails visibly. The clock guard prevents early, December or later-year
publication, and missed dates are not caught up automatically.

The owner was told that 08:00 is the release trigger; checks, deployment and
GitHub scheduling delays mean public availability follows later. Exact timed
visibility would require a separate server-side release design.

## Artifacts

- [Queue procedure](../../../packages/blog/scheduled/README.md)
- [Dated release manifest](../../../packages/blog/publication-schedule.json)
- [Workflow](../../../.github/workflows/november-publication.yml)
- [Selection and promotion](../../../packages/blog/src/lib/publication-schedule.ts)
- [CLI and live acceptance](../../../packages/blog/src/pipeline/publish-scheduled.ts)
- [Focused regression checks](../../../packages/blog/test/publication-schedule.test.ts)

## Delivery and acceptance

Local checks passed November 5: workspace typecheck, validation of all 31 Markdown
posts, eight new scheduling tests plus the existing cross-timezone date test,
and an isolated production build of all 42 posts. The focused checks cover the
Pacific 08:00 boundary, campaign/year limits, missing days, duplicate entries,
path restrictions, prompt preservation, slug collisions, repeat runs and
TypeScript metadata rollback. Nine relative documentation links resolve and code
fences balance. The active development output was not touched; no private local
environment files were copied into the isolated build.

The queue has no articles. No scheduled article publication has occurred.
Remaining: scoped commit/push, hosted check of the registered workflow, and the
first real queued-article release. The last step needs a finished article and
cannot be established by an empty-queue dry run. Next bounded action: deliver the
checked source and run the hosted check. Keep source delivery, hosted workflow
activation and actual live publication acceptance separate below.
