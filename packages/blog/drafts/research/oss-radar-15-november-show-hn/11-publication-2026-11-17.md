# November 17 publication

November 17, 2026, America/Los_Angeles. **[Issue #15 is published](https://gkoreli.com/oss-radar-15-november-launches) and live acceptance passed. Automatic publishing remains paused.** This was a separately authorized one-time release after the missed Monday slot; the hosted publisher was not re-enabled, the manifest stayed empty and the preparation automation was not changed.

## Source and current corrections

The closed 603-submission population, eight OSS launches and Takumi return are unchanged. The held November 16 manuscript remains a historical snapshot at SHA-256 `589cbb345324436c517e694f77c3833d98a6d539eea1afea3cb5cc020fa14aee`. The retained [manuscript snapshot](article.md) matches the published source at SHA-256 `5ef0fc0c5fb840001091c4d4f75b58222fef09047d1e847de11fe7d1884618d8`. Its [selected post source](../../../posts/046-oss-radar-15-november-launches.md) uses the actual November 17 release date and URL `https://gkoreli.com/oss-radar-15-november-launches`. The earlier accepted draft remains in Git history and dated receipts; Monday publication is not claimed.

The [bounded freshness record](results/release-freshness-2026-11-17.json) covers seven release collections and ten relevant head/issue/PR states. Three projects released newer versions; Fursoy also changed substantially after the pinned RTL. Only consequential copy was revised; passing older experiments were not rerun to acquire a new date.

**AgentRun beta.42 changes the promotion judgment.** Source is [`3b10f6fa540d37acf237d230207baa691402dcbe`](https://github.com/Parcha-ai/agentrun/tree/3b10f6fa540d37acf237d230207baa691402dcbe). Read the [release](https://github.com/Parcha-ai/agentrun/releases/tag/v0.1.0-beta.42), [merged design #3032](https://github.com/Parcha-ai/agentrun/pull/3032), the actual defaults/predicate/matching module and the called `checkRows`/`settleCheck`/`decideCheck` path. The new check uses the agent's own recorded answers and autonomous coverage, rather than the prior grade comparison. Failed or unstarted reserved inputs remain failures; skipped writes are excluded. A check without usable inputs stops instead of promoting on a dry run.

Before executing, declared a small contrast through unchanged current functions and actual defaults. Five [scoring conditions and three matching controls](results/agentrun42-check-01.json) passed:

- Default settings are twenty runs, 80% agreement and 70% autonomous coverage.
- One autonomous matching answer in twenty inputs fails; fourteen autonomous answers with twelve matches passes, while eleven matches fails.
- All hand-backs and no inputs fail. JSON key order does not change matching; two identical incorrect arithmetic answers still match.

The [fixture](repro/agentrun42-check.mjs) calls actual `checkPasses`, `checkShares`, `sameAnswer` and `loopOf` functions bundled from four exact raw source files. Node 24.14.1, TypeBox **1.3.27** matching the beta.42 manifest, and esbuild 0.27.3 were used. Source hashes and the actual bundle hash are in the receipt. A cached dependency runtime supplied TypeBox; none of its installed package files was changed. No provider, full promotion service, database upgrade or new crash run occurred. Earlier beta.38/beta.40 results retain their versions. The prose and distillation now recognize the new coverage requirement while distinguishing agreement from correctness. Beta.41/42's current backend-specific upgrade contract replaces the older upgrade advice.

**Agweb 0.4.0 changes platform and interaction advice.** Its [release](https://github.com/paul-nameless/agweb/releases/tag/v0.4.0) lowers the declared minimum from macOS 26 to 15.4 and describes moved-tab notices and non-article extraction improvements. [Issue 3](https://github.com/paul-nameless/agweb/issues/3) closed after the maintainer said the fixes merged. The entry recognizes those additions as reported release behavior; actual profile, click and restart trials stay attached to 0.2.0/0.3.0. No new-platform trial is claimed.

Yogurt advanced to 0.3.39. The 35-commit comparison does not change `app/src/main/store.ts` or `app/src/main/asr/backfill.ts`; prior recovery tests remain explicitly versioned rather than generalized to every newer capture/queue/UI path. Fursoy's five new commits change RTL and verification tooling. The entry now explicitly dates its eight-block synthesis scope to the inspected November 15 revision. Previous executions are not transferred to new RTL, and no fresh processor qualification is claimed. Other consequential cited states remain in the freshness record.

## Local release acceptance

The isolated checkout is `/private/tmp/oss-radar-15-release-20261117/site`, based on `a9fe8547e63bc4f451c0cd47dfaf9ce68c5af2f0`. No shared development output was touched. Node 24.14.1 and pnpm 9.15.4 match repository pins; frozen dependencies were installed offline with scripts disabled.

Workspace typecheck passed, **36 Markdown posts** validated and the final production build generated **47 posts**. Policy and built-HTML validation passed. The [render receipt](results/article-render-2026-11-17.json) records the exact source, canonical/date/H1, generated representations and resolved page links. The search index contains the new beta.42 passage. The social card hash is unchanged from the accepted card. Desktop and narrow-width candidate reading were inspected. The final production page subsequently passed its own desktop/mobile reading check, recorded separately below.

Retained setup/check failures: metadata validation initially ran before fresh workspace dependencies had been built; typecheck built them and validation then passed. Sandboxed `tsx` IPC was refused; the same isolated production command passed with its required local-socket permission. The first authored representation check wrongly expected `posts.json` to contain full canonical URLs; it was corrected to inspect its actual slug/date schema. These were setup/harness corrections, not article or production defects.

## Delivery and served acceptance

Source commit [`2e9ec8003ca29aaf66d63f3bb938a896789906fd`](https://github.com/gkoreli/blog/commit/2e9ec8003ca29aaf66d63f3bb938a896789906fd) was accepted on main. The existing Cloudflare integration built/deployed the one-time release. At **15:14:06 UTC**, the [live receipt](results/publication-live-2026-11-17.json) accepted ten controlled responses: article HTML, explicit and negotiated Markdown, CSL-JSON, BibTeX, posts index, RSS, sitemap, Radar archive and OG PNG. The index date is November 17; both Markdown paths match the isolated build exactly, and the social image matches its accepted hash. HTML contains one H1, all nine project entries, the current version-specific passages and the correct canonical URL.

The production page was also read at desktop width 1280 and mobile 390×844. Its matching title/date and beta.42 passage were visible, with document widths equal to the viewport at both sizes. The temporary viewport was reset. Raw responses and browser captures remain outside Git; the public receipt contains normalized status/content evidence.

The provider's [GitHub build check](https://github.com/gkoreli/blog/runs/134136487400) still reported in progress when last read at 15:16:43 UTC, despite the served content already passing. That metadata is not represented as a completed check; source delivery and actual served acceptance supply the release result. These controlled checks establish publication, not readership, adoption or distribution.

GitHub workflow **408698342** returned **disabled_manually** after publication. The manifest remains empty. The one-time authorization did not resume Monday publication, modify the preparation heartbeat, post to X, send external messages, contact maintainers or spend on paid services. Future issue research continues through the weekly worklist; automatic publication requires separate resumption. Private publication choices were preserved in the approved private archive without copying their wording into these public records.
