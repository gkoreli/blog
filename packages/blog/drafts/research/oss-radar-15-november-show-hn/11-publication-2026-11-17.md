# November 17 publication

November 17, 2026, America/Los_Angeles. **A one-time immediate release of #15 is authorized; automatic publication remains paused.** The Monday slot was missed while the publisher was disabled and the manifest empty. The earlier re-enablement request was rejected by automatic approval review. The subsequent scoped authorization covers this issue only, so the hosted workflow and publication schedule remain unchanged. Source delivery and live acceptance are separate steps below.

## Source and current corrections

The closed 603-submission population, eight OSS launches and Takumi return are unchanged. The held November 16 manuscript remains a historical snapshot at SHA-256 `589cbb345324436c517e694f77c3833d98a6d539eea1afea3cb5cc020fa14aee`. The current reviewed [draft](article.md) is the corrected candidate at SHA-256 `5ef0fc0c5fb840001091c4d4f75b58222fef09047d1e847de11fe7d1884618d8`. Its [selected post source](../../../posts/046-oss-radar-15-november-launches.md) uses the actual November 17 release date and URL `https://gkoreli.com/oss-radar-15-november-launches`. The earlier accepted draft remains in Git history and dated receipts; Monday publication is not claimed.

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

Workspace typecheck passed, **36 Markdown posts** validated and the final production build generated **47 posts**. Policy and built-HTML validation passed. The [render receipt](results/article-render-2026-11-17.json) records the exact source, canonical/date/H1, generated representations and resolved page links. The search index contains the new beta.42 passage. The social card hash is unchanged from the accepted card. Desktop and narrow-width candidate reading were inspected; final served reading is a separate acceptance step.

Retained setup/check failures: metadata validation initially ran before fresh workspace dependencies had been built; typecheck built them and validation then passed. Sandboxed `tsx` IPC was refused; the same isolated production command passed with its required local-socket permission. The first authored representation check wrongly expected `posts.json` to contain full canonical URLs; it was corrected to inspect its actual slug/date schema. These were setup/harness corrections, not article or production defects.

## Delivery and served acceptance

The exact accepted source is promoted to `posts/` and delivered through the normal main-branch/Cloudflare path for this one-time release. The automatic publisher stays disabled and the manifest stays empty. No hosted workflow or preparation-automation setting is changed. Future automatic releases remain held until separately resumed.

Production article, Markdown, discovery/date records and live reading still require acceptance after the source push. No X operation, external message, maintainer contact or paid service is part of this release. Raw author material remains private.
