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

Source delivered directly to `main` in
[`9382248`](https://github.com/gkoreli/blog/commit/9382248d34cfd6c2b58599b21195540dec6b1a77).
The unrelated, untracked Ahrefs captures were left untouched.

Activation observed November 5: GitHub registered workflow `408698342` as active.
The manually dispatched, non-publishing
[hosted check](https://github.com/gkoreli/blog/actions/runs/42118994554) succeeded
on that exact commit. Checkout, runtime pin extraction, Node setup, pnpm setup,
frozen-lockfile installation and the empty-queue check all passed. Promotion,
validation, commit/push and live acceptance steps were skipped as intended.
No scheduled article was published, and this manual run does not prove the
future cron wakeup or the GitHub-token-to-Cloudflare article deployment path.

Setup and hosted activation are complete. The queue has no articles. Remaining:
finish and explicitly queue the November 6 article, then inspect the first actual
08:00 release's source delivery and live acceptance. The job will fail visibly
if nothing is queued. GitHub notification preferences were not changed. The
first real publication needs finished source and cannot be established by an
empty-queue dry run; no speculative draft is selected on the owner's behalf.
