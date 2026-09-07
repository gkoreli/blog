# Own-verification attribution audit — 2026-09-07

## Finding

The preserved evidence confirms that our own verification contributed materially, but it does not support the claim that our recorded verification alone burned the 5 million-row free allowance.

At the 05:43:07 UTC exhaustion capture, the account hourly dataset reports 5,055,350 rows read for the day, of which 5,054,729 belong to the blog database. The exact, deduplicated pre-exhaustion total linked by the analytics evidence and Wrangler D1 metadata is **190,811 rows read**:

- **182,388**: nine referral-policy candidate aggregate statements.
- **8,423**: one no-policy baseline totals statement.
- **0**: one successful query-plan statement.

That exact total is **3.77%** of the blog database's 5,054,729 rows in the account hourly dataset. The nine candidate statements alone were already expensive despite the small stored dataset because each statement independently scanned the selected observations, rebuilt the distinct-host/suffix assessment against 2,349 rules, and then performed its own aggregate.

The shared machine's Wrangler logs also contain twelve small successful executions totaling 126 reads between 05:01 and 05:23 UTC. They are not linked by the scoped artifacts to this analytics verification and concurrent newsletter investigation used the same log directory, so this audit records them as **other local inspections**, not as analytics-owned reads.

## Confirmed API report captures without per-request D1 metadata

Four additional successful report requests are explicitly preserved as our own activity:

1. One pre-policy default browser report at 00:09:36 UTC, made by `verify-matomo.mjs`. The then-live implementation executed eight aggregate statements.
2. One post-policy default browser report at 00:24:47 UTC.
3. One post-policy all-traffic report at 00:25:26 UTC.
4. One post-policy path-scoped browser report at 00:25:26 UTC.

The three post-policy reports each executed nine referral-suffix statements, so together with the nine direct candidate statements, **36 referral-suffix executions** are confirmed as ours. The preserved query-insights artifact contains 187 referral-suffix executions in total; thus at least 36 of those executions, **19.25% by count**, are directly tied to preserved verification. Query insights aggregates executions by query profile and does not retain per-request D1 metadata here, so the 27 API statement reads cannot be separated exactly from other calls with the same SQL profile.

All four API captures and the 190,811-row initial CLI verification occurred in the 00:00 UTC hourly bucket. That entire blog bucket contains 1,531,718 rows read. A conservative bound for these scoped, preserved analytics calls is therefore **190,811 to 1,531,718 rows**, or **3.77% to 30.30%** of the blog daily total. The lower bound omits the four API report costs; the upper bound attributes every read in their whole hour to these calls and is deliberately generous.

Therefore at least **3,523,011 rows** of the 5,054,729 blog hourly total fall outside the maximum hourly envelope of these preserved calls. They may be external public endpoint traffic or other local/manual activity not represented by the scoped evidence; these artifacts cannot distinguish those sources. Worker logging and tracing are enabled, but no request-level Worker trace set was included in the directories authorized for this audit, so this note makes no claim about what may be attributable from other retained telemetry.

## Datasets kept separate

- **Account hourly dataset:** `2026-09-07T00:00:00Z` through the 05:43:07 capture; 5,055,350 account rows and 5,054,729 blog rows. This is the free-limit exhaustion view used for the denominator above.
- **GraphQL query-profile dataset in the same exhaustion artifact:** the saved GraphQL text binds `d1QueriesAdaptiveGroups` to `$today` and totals 5,266,594 rows across 719 executions. The request variables also contain an unused `$sinceYesterday` value; reading the variables without checking the field binding caused the earlier draft's incorrect window description. Although both datasets request the same day, adaptive query-profile and hourly aggregates differ and must not be forced to reconcile.
- **`insights-24h.json`:** 4,606,568 rows across 546 executions in the saved top-profile result, including 3,976,806 rows across 187 referral-suffix executions. It is a separately captured/adaptive profile view and is not added to either GraphQL total.

These are overlapping summaries of database activity. None is added to the Wrangler execution metadata.

## Deduplication method and evidence

1. Treat a Wrangler log with `success: true` and a D1 `rows_read` value as a metered execution result, but attribute it to this analytics task only when a scoped artifact links the execution.
2. Match the eleven 00:09 logs to the saved artifacts by their unique ordered row-read sequence. `matomo-query-results.json`, `matomo-baseline-totals.json`, `matomo-d1-plan.json`, and `matomo-summary.json` describe the same eleven executions and are not added again.
3. Count the four timestamped HTTP report artifacts as confirmed calls, but do not invent row totals because their response captures contain public JSON rather than D1 execution metadata.
4. Exclude deployment/version logs, metric API captures, local parity runs, static page checks, and the invalid stats-state request from D1 read attribution.
5. Record the twelve small successful executions between 05:01 and 05:23 as 126 other local inspection reads without assigning analytics ownership. Exclude the 05:27 compound-select compilation failure and 05:41 free-limit rejection: neither has successful D1 result metadata.

Primary artifacts:

- `<private-evidence-root>/2026-09-07-referral-policy/matomo-query-results.json`
- `<private-evidence-root>/2026-09-07-referral-policy/matomo-baseline-totals.json`
- `<private-evidence-root>/2026-09-07-referral-policy/matomo-d1-plan.json`
- `<private-evidence-root>/2026-09-07-referral-policy/verify-matomo.mjs`
- `<private-evidence-root>/2026-09-07-referral-policy/published-browser-report.json`
- `<private-evidence-root>/2026-09-07-referral-policy/live-selection-checks.json`
- `<private-evidence-root>/2026-09-07-d1-read-budget/metrics-at-exhaustion.json`
- `<private-evidence-root>/2026-09-07-d1-read-budget/insights-24h.json`
- `<private-wrangler-logs>/wrangler-2026-09-07_00-09-26_220.log` through `wrangler-2026-09-07_00-09-36_110.log`
- Shared-machine small-query logs at 05:01, 05:02, 05:07, 05:10, and 05:23 UTC, recorded without task ownership.

## After the upgrade

These are outside the free-limit exhaustion interval and did not cause it. The scoped acceptance record and Wrangler metadata link **40,269** reads to analytics acceptance: 33,259 for the successful consolidated fixed-window candidate and 7,010 for the observation inventory. A separate 13-read successful execution appears in the shared-machine log but is not linked to the analytics artifacts, so it remains unattributed. Keep all post-upgrade accounting separate from the 190,811 exact pre-exhaustion total.

The consolidated candidate returned the preserved historical response with 33,259 reads instead of 182,388, an 81.7647% reduction, and wrote zero rows. The later live cache HIT checks did not add report-generation reads according to the parent's acceptance record.
