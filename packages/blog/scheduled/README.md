# Weekly OSS Radar queue

Publish one reviewed OSS Radar each Monday, with release attempts beginning at **08:00 America/Los_Angeles**, starting November 16, 2026. The [weekly production worklist](../../../docs/worklist/oss-radar-weekly/README.md) owns research, field work, experiments, implementation, writing and editing throughout the week. This replaces the bounded November daily campaign for future scheduled releases; its dated history remains in the [older worklist](../../../docs/worklist/november-daily-publication/README.md).

The [manifest](../publication-schedule.json) lists release-ready snapshots. Unfinished work stays outside it. The hosted publisher never chooses another draft to fill an empty slot.

## Queue a reviewed issue

1. Complete the writing skill's [OSS research and weekly standards](../../../.agents/skills/writing/references/oss-research.md). Record reader value, actual source understanding, meaningful experiments, a usable artifact, material limits and editorial/release acceptance in the issue's research directory.
2. Save the reviewed release snapshot at `scheduled/YYYY-MM-DD/NNN-article-slug.md` or `.ts`. The date must be a Monday on or after the schedule's start; metadata must use that date and `section: oss-radar`. Keep one matching body H1. TypeScript imports must work from the final `posts/` location. An authoring draft may remain as an explicitly identified research snapshot.
3. Add one date/file entry to [the manifest](../publication-schedule.json). Dates and slugs must be unique. Listing the reviewed snapshot selects it for that Monday's release under the standing weekly publication instruction.
4. Run `pnpm -C packages/blog publication check` and relevant checks, including an isolated promotion/build rehearsal for a new article. Commit and push the scoped source, evidence and manifest to `main`.

Raw author prompts and working notes remain in the approved private writing archive. Do not queue them. The publisher rejects `prompts: true` and moves only the named article. Assets belong in their normal package locations. Queue source is public in GitHub but absent from the generated site, feeds and discovery files until promotion.

## Release and recovery

[The hosted workflow](../../../.github/workflows/november-publication.yml) retains its historical filename and Actions history, but now runs on Mondays at 08:00 Pacific throughout the year. It uses the pinned runtime and pnpm version, selects only that Monday's reviewed source, checks types/metadata and the production build, then commits and pushes using the repository's personal Git identity. The existing Cloudflare integration deploys the commit.

The job then checks the live article, Markdown, correct index date, RSS and sitemap. Source delivery, deployment and served-content acceptance are separate results. No new Cloudflare credential is needed. GitHub's scoped job token supplies push authorization; personal commit metadata does not change that authentication.

**08:00 is the release trigger.** GitHub scheduling, validation and deployment can delay live availability. The IANA time zone keeps the morning schedule through daylight saving time; this is not an exact-minute visibility guarantee.

An unfilled Monday fails visibly. Fix the queue and use **Run workflow → publish** on that same Monday after 08:00; retries check a promoted article rather than publish it twice. Other weekdays and times before 08:00 do not promote source. Missed weeks are not automatically caught up. A push conflict fails safely: start a fresh run against current main and repeat checks; do not force-push an unchecked tree.

A separately authorized immediate catch-up may use normal repository delivery with its actual publication date. It does not re-enable a paused publisher or change the Monday gate; [the November 17 release](../drafts/research/oss-radar-15-november-show-hn/11-publication-2026-11-17.md) records this distinction.

Use **Run workflow → check** for hosted queue validation without publication. To cancel a queued release, remove its manifest entry before its run. Disable the workflow to stop automatic releases. The preparation heartbeat must not become a second publisher.

[GitHub schedule semantics](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) document possible delays and dropped runs. [Time-zone syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onschedule) documents IANA zones. [Cloudflare Git integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/) supplies the existing deployment path. Setup, hosted activation and dated release acceptance belong in the [weekly worklist](../../../docs/worklist/oss-radar-weekly/README.md).
