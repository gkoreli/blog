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

Setup and hosted activation are complete. The owner's later article selection
and its release preparation follow below. GitHub notification preferences were
not changed. The first actual cron-triggered publication remains separate from
the earlier empty-queue check and the later isolated release rehearsal.

## November 5 Pacific: Turnstile selected for November 6

Goga selected **Cloudflare Turnstile: What Kept Breaking My Signup Form** as the
next article and asked this chat to coordinate a substantive improvement through
its original builder. The exact instruction is the seventh message in the
[selected prompt record](../../../packages/blog/drafts/research/newsletter-reliability/turnstile-pain-points.prompts.md).
The original builder's existing thread, **Investigate client_errors subscription…**,
completed the revision in `7f02173`. It led with the fake-versus-real API failure,
added a diagnostic map, clarified callback/retry boundaries, compressed tangents
and preserved the unknown causes and measurement limits. Its
[revision record](../../../packages/blog/drafts/research/newsletter-reliability/31-turnstile-diagnostic-method-revision.md)
and [draft](../../../packages/blog/drafts/research/newsletter-reliability/turnstile-pain-points.md)
remain discoverable in the existing research worklist.

The coordinator independently reviewed the full prose and requested two narrow
corrections: remove unsupported attribution of the old secret's installation,
and distinguish observed results from verifier policies in the diagnostic map.
Both corrections were applied before release preparation.

The reviewed body and seven exact selected prompts are frozen in the November 6
queue, registered in the [manifest](../../../packages/blog/publication-schedule.json).
The H1 and slug are retained; the search title and description adopt the builder's
revised diagnostic positioning. No unmeasured research footprint is added. The
earlier private-authorization omission remains disclosed in the research record;
agent instructions are not presented as human prompts.

[Release-rehearsal receipt](2026-11-06-turnstile-checks.json): an isolated copy
blocks promotion at 07:59:59 and selects this article at 08:00 Pacific. All 32
Markdown posts validate and the production pipeline builds 43 posts. Output
checks pass for one H1, two tables, canonical/date, final search title/description,
the full Markdown body, seven-prompt page, post index, RSS, sitemap and llms index.
The checked body/prompt hashes match the builder's final revision. The tsx CLI
could not create its local IPC pipe; equivalent `node --import tsx` entrypoints
ran the same referral-policy check and production build successfully. No shared
development output or private environment file was used.

Prepared source is outside `posts/` and `prompts/`. It is intended for the
**November 6, 2026, 08:00 America/Los_Angeles** release attempt (16:00 UTC).
Queue delivery and a hosted non-publishing check are recorded after they finish.
Actual timed promotion, Cloudflare deployment and live publication remain
unverified until that run. Next bounded action after queue activation: inspect
the release's commit/push and live-check result; do not infer acceptance from this
rehearsal or the article's scheduled date.
