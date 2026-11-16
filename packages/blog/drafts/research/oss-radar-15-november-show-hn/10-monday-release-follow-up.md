# Monday consequential-release follow-up

November 16, 2026, America/Los_Angeles. The [Sunday evening acceptance](08-review-and-readiness.md#november-15-evening-acceptance) remains historical. This pass found consequential changes in two entries and revised their advice. The closed 603-submission inventory and nine-project selection are unchanged. Publication remains paused; the manifest is empty.

## What changed

The [dated freshness record](results/release-freshness-2026-11-16.json) checks seven release collections, the two unversioned projects' heads and ten relevant head/issue/PR states. Yogurt advanced from 0.3.24 to **0.3.34**; AgentRun from beta.38 through beta.39 to **beta.40**. The other five release collections, Fursoy/Neovim heads, font report and cited open proposals retain the consequential states used by the manuscript. This is a bounded live-fact check, not another whole-project audit or a new launch selection.

The prior accepted source hash was `f159a21cc8cbeb8fbf9dcf250080ef635994ea24ff280a25c9882b6fb6414cb3`. Revised source is `589cbb345324436c517e694f77c3833d98a6d539eea1afea3cb5cc020fa14aee`. Earlier results and render receipts are not overwritten.

## Yogurt: the original reporter's recording really needed another fix

Read all ten [issue 30 comments](https://github.com/FrigadeHQ/yogurt/issues/30), inventoried the 28-commit comparison from 0.3.24 to 0.3.34, and inspected consequential recovery/store/startup/filter/test changes. The first recovery release did not fix the reporter's old recording. A migration in 0.3.31 recognized pre-tracking stopped meetings; 0.3.32 also included meetings marked done after their empty notes were written. The reporter [confirmed transcription and summarization](https://github.com/FrigadeHQ/yogurt/issues/30#issuecomment-6917599061) on November 16. Their later report of names appearing in transcript text led to 0.3.34's prompt-label filter change. Their summary result is testimony, not a local summary-model trial.

Pinned current source: `2004c7fc3d77538a648bf28632e49d484349a057`. Its [store migration and candidate query](https://github.com/FrigadeHQ/yogurt/blob/2004c7fc3d77538a648bf28632e49d484349a057/app/src/main/store.ts) mark old stopped/done meetings without any segments once, under SQLite user version 2. Startup invokes catch-up even when setup emits no new state, and empty enhanced notes can be rewritten. Partial transcripts remain excluded deliberately to avoid duplicate lines. The maintainer acknowledged the requested manual transcribe-again action; it is not represented as shipped.

Before execution, declared a fresh persisted-store contrast: the same old stopped and done empty meetings, with no tracking flags, plus a pending partial transcript, under 0.3.24 and 0.3.34. Check actual candidate names, pending state and another reopen after marking empty meetings handled. The [authored fixture](repro/yogurt-legacy-recovery.test.ts) uses Node SQLite directly to construct legacy state, without accessing a private class field or altering source.

The [result](results/yogurt-legacy-recovery-01.json) shows 0.3.24 selected neither old empty meeting; 0.3.34 selected both. Neither release selected the partial transcript. Current handled empty meetings stayed handled after reopen. All **56 unchanged upstream tests** in store/backfill/hallucination passed, alongside the one authored current test; the baseline authored test passed separately. Node 24.22.3, Vitest 5.0.4 and the declared import dependencies were reused in isolated temporary source/runtime paths. No Electron UI, real meeting, microphone, new native recognition or summary run occurred. The actual decoder/model recognition remains a dated 0.3.24 result from Sunday.

Reader consequence: describe confirmed recovery and legacy-state handling positively, while retaining the distinct partial-transcription limit. Do not present the original first-release failure as the reporter's final outcome.

## AgentRun: grading must know whose answer it is

Pinned beta.40 source: `bb7fb3eab9ad592fe81a57c1389744856889da7b`. Read the shipped promotion/scoring/refit paths, the workflow-first cost rule, cost aggregation and its store reader, plus relevant beta.39/40 release and upgrade sections. The current replay accepts agent, handed-back and workflow-path grades. Automatic promotion still has the fewer-than-five dry-run exception; an actual replay's settlement requires at least five scored rows. The manual replay endpoint's five-input requirement does not remove the automatic exception.

Declared synthetic scoring and cost-selection comparisons before execution. The [fixture](repro/agentrun-current-learning.mjs) imports exact published beta.38/40 modules, with package/module identities in the [receipt](results/agentrun-current-learning-01.json). No source patch, provider, mail, paid tool or server was used.

- One correct autonomous answer plus nineteen hand-backs still yields 100% and passes the scoring predicate. All-hand-back rows fail. Five successful rows plus fifteen failed rows still produce a five-row score: failed rows are reported separately, not counted as wrong answers.
- Five unchanged workflow answers previously graded wrong fail beta.40's scorer. Without expected fields, a different answer on such a row counts right; supplying an expected answer makes a different nonmatching answer fail, while the expected match passes. This is a checked matching rule, not evidence that the different answer is semantically correct.
- The beta.38 scorer accepts an arithmetic zero-versus-zero tie on those same wrong-workflow rows. That is **not a reproduced beta.38 service defect**: its normal replay selector chose agent-path grades, not these workflow-path rows. The article uses the supported current case and omits that misleading product-level comparison.
- A clean authored cost series has twenty served rows averaging 1 unit. Inserting an expensive replay row and manual-agent row after takeover makes beta.38's aggregate count 22 rows and average 91.818182, while beta.40 still counts the twenty served rows and averages 1. These are artificial values, not money spent or a measured cost saving. The current store reader calls the same summary function; the full API/service was not exercised.

Beta.40 lets an active replay finish and queues a newer revision, and its cost summary excludes nonserving runs. Beta.39's documented upgrade contract adds SQLite columns while retaining schema version 11, and moves Postgres to 14; Postgres rollback to beta.38 requires the pre-upgrade backup. Beta.40 documents no further store migration from beta.39. No database upgrade or current-release process-kill trial is claimed; Sunday's beta.38 crash/fencing results retain their version.

Reader consequence: retain coverage and failed-denominator qualifications, explain why expected answers matter, recognize serving-only cost reporting, and replace stale upgrade advice with the version/backend distinction. Passing the scoring predicate is not a complete promotion decision or proof of learned task quality.

## Review, acceptance and handoff

Only Yogurt and AgentRun's entries, the dated research range and relevant source links changed. The other seven entries and cross-project interpretation were preserved. The revised copy was checked against the source and receipts, then reread for reader usefulness and plain prose; it remains a Radar selection rather than two standalone engineering explanations.

The [new exact-source render receipt](results/article-render-2026-11-16.json) accepts this manuscript at site baseline `d36660154b394310a8591b672336b36a636d8fc8`: 36 valid Markdown posts, 47 built posts, policy/HTML checks, generated representations, local links and fresh desktop/mobile inspection passed. The owned loopback preview was stopped. Earlier source hashes and test boundaries remain historical. Final scoped JSON, documentation links/anchors, fixture syntax and diff checks passed before source delivery.

The release stays held regardless of acceptance. Preserve the new hash and check only consequential changed facts; if release is explicitly resumed, reconcile the dated slot and use the existing publisher with separate deployment/live verification. The next weekly discovery step is selecting #16's source mix. No future issue is selected by these two release checks.
