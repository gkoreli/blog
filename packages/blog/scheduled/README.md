# November article queue

Publish one finished article each day from **November 6–30, 2026**, with release
attempts starting at **08:00 America/Los_Angeles**. November 5 is already covered
by [AI Fetchers, Browsers, and Crawlers](https://gkoreli.com/ai-fetcher-browser-crawler-headers).

**Current selection, confirmed November 6:** today's article is already
published through another builder. The [finished Turnstile article](2026-11-07/043-cloudflare-turnstile-signup-failures.md)
and [exact prompts](2026-11-07/cloudflare-turnstile-signup-failures.prompts.md)
are selected for **November 7, 2026 at 08:00 America/Los_Angeles**. No Turnstile
release is selected for November 6; November 8–30 need approved entries. The
[publication worklist](../../../docs/worklist/november-daily-publication/README.md)
records the date correction, accepted preparation and remaining live checks.

The [manifest](../publication-schedule.json) lists finished articles selected for
release. A schedule cannot publish an unfinished article. Writing reminders are
separate from this release workflow.

## Queue a finished article

1. Finish and review the article through the appropriate writing skill.
2. Put its final source at `scheduled/YYYY-MM-DD/NNN-article-slug.md` or `.ts`
   within this package. Set its publication date to that day. TypeScript imports
   must work from the final `posts/` location.
3. For a collaborative article, put its exact shaping prompts at
   `scheduled/YYYY-MM-DD/article-slug.prompts.md` and set `prompts: true` below.
   Exposed essays and OSS Radar follow their existing exceptions.
4. Add one entry to [publication-schedule.json](../publication-schedule.json):

   ```json
   { "date": "2026-11-07", "file": "043-article-slug.md", "prompts": true }
   ```

5. Run `pnpm -C packages/blog publication check`, then commit and push the scoped
   sources and schedule. Listing an article in this queue authorizes its release
   on that day. Keep unfinished work in `drafts/` without a schedule entry.

Assets belong in their normal package locations. Queued article and prompt files
are outside the SSG's discovered directories, so they do not appear in the live
site or generated feeds before promotion. **The GitHub repository is public**;
this mechanism does not make source files private.

## Release and recovery

[The hosted workflow](../../../.github/workflows/november-publication.yml) uses
the pinned Node runtime and pnpm version. It promotes only today's explicitly
listed source and prompts, runs types, metadata validation and an isolated runner
build, then commits and pushes to `main` using the repository's personal identity.
The existing Cloudflare Git integration performs deployment.

The job checks the live article, Markdown, index date, RSS and sitemap after the
push. A successful push and a successful live check are separate results. No
Cloudflare credential is added to GitHub. Automatic releases use GitHub's scoped
`GITHUB_TOKEN`; personal author metadata does not change that authentication.

**08:00 is the release trigger, not a guaranteed live instant.** GitHub scheduling
can be delayed or dropped, and validation/build/deployment take time. This is
appropriate for a morning publication habit. Exact timed visibility would need
predeployment and a server-side release gate for every article representation.

If a run fails, inspect [Actions](https://github.com/gkoreli/blog/actions/workflows/november-publication.yml).
Missing articles fail visibly without publishing a different draft. Re-run using
**Run workflow → publish** after fixing the queue. Before 08:00, that command is a
no-op. After an article is committed, retries verify it without republishing it.
Concurrent changes to `main` make the push fail safely; start a fresh run against
current `main` to repeat validation. Do not force-push or merge an unchecked tree.
Missed days never automatically publish on a later date.

Use **Run workflow → check** for a hosted check without publishing. Watch the
first actual article release; an empty-queue check cannot prove the
GitHub-token-to-Cloudflare deployment path. Configure GitHub Actions failure
notifications in your account if you want email/push alerts; they are not enabled
by this repository change.

The scheduler and runtime guard are bounded to November 2026. December and later
years cannot publish through this campaign. Disable the workflow after November
30 to avoid idle annual wakeups. To cancel an individual queued release, remove
its schedule entry and push before its run; disabling the workflow stops all
automatic releases.

Sources: [GitHub schedule semantics](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule),
[Cloudflare Git integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/).
Implementation and activation evidence: [worklist](../../../docs/worklist/november-daily-publication/README.md).
