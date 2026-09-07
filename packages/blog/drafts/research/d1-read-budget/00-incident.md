# D1 Daily Read Allowance Investigation

Started September 6, 2026 PDT / September 7 UTC after the owner supplied a Cloudflare 77% daily-read alert. The email's reset is September 8 at 00:00 UTC, equivalent to September 7 at 17:00 PDT. The private email and account details are not reproduced here.

**Current status:** the owner subsequently reported a Workers Paid upgrade. At 06:18–06:21 UTC, the revised production report passed the retained-result comparison at **33,259 reads (81.7647% fewer)**, and live cache reuse was verified. [Recovery evidence](02-recovery.md), [handoff](03-handoff.md). The exhaustion and blocked checks below describe earlier checkpoints.

## Finding

Our public analytics report repeatedly evaluated the new referral policy. The earlier production benchmark already measured **182,388 rows read across nine statements** for one report. That is 3.65% of a five-million-read daily allowance. We should have evaluated that operating budget before accepting the implementation's latency. This investigation corrects the acceptance claim while preserving the original measured numbers and referral evidence.

That total is cumulative database read work: add the nine returned `meta.rows_read` values once. Re-reading the same data in another query counts again. The report did not contain 182,388 distinct observations, and it did not require 182,388 visitors. The execution plan shows repeated observation and referral assessment plus index use; these measurements do not allocate the total precisely among tables, indexes, and intermediate results. See [Cloudflare's metric definition](https://developers.cloudflare.com/d1/platform/pricing/).

[Sanitized metrics](usage-at-alert.json) record the September 7 account total at 05:11:32 UTC: **3,889,701 rows read (77.79%)**, with 3,889,143 in the blog database and 558 elsewhere. The account had only 430 rows written in that capture. Rows read are scanned database rows, not visitors, observations stored, or returned report rows.

The separate adaptive query profile contains 37 groups and 4,072,463 rows read. Queries containing the referral matcher's `suffixes` CTE account for 3,835,924 reads across 180 executions, approximately 94.2% of that profile. The hourly totals and query-profile totals differ; preserve that discrepancy rather than adding or treating them as one ledger. Twenty nine-statement reports would produce 180 statements, but these metrics do not attribute requests to owners, agents, or external clients. They do not establish an attack on `/api/stats` or connect its callers to the suspicious referrer.

## Mechanism and impact

At baseline `3d92b10`, `queryStats()` issues nine aggregates, plus the earliest-observation query for `range=all`. Each aggregate repeats the materialized referral source and hostname match. The public Worker directly calls the handler. Its response header advertises sixty-second freshness after the database work; it has no explicit Worker cache. The dashboard's `fetch()` also uses `cache: 'no-store'`. The dashboard does not poll; requests follow initial load, changed selection, history navigation, or retry.

The account cap is shared. D1-backed newsletter operations and observation writes can fail if it is exhausted. The Worker serves static assets independently and schedules eligible observation writes with `ctx.waitUntil`, so a D1 failure does not by itself make article HTML unavailable.

At **05:41:47 UTC**, the revised candidate query was rejected because the account had exhausted its free daily read allowance. A metadata-only capture at **05:43:07 UTC** reported **5,055,350 account reads**. The quota error establishes that this request was blocked; the displayed aggregate slightly above five million is retained as received. No successful candidate result or billed-read reduction is claimed. After a quota rejection, inspect service metadata before attempting more production SQL. Neither rejected candidate returned row-read metadata, so their metered cost is unknown, not assumed zero.

At **06:11:07 UTC**, a separate newsletter investigation successfully read the thirteen retained client-error rows, with `rows_read: 13` and `rows_written: 0`. [Sanitized recheck](../newsletter-reliability/recovery-log-recheck.json). That observation alone did not explain restored access, establish a plan change or reset, or validate the revised analytics query. The subsequent owner report and [06:18–06:21 production acceptance](02-recovery.md) supply later evidence; the earlier small read must not be credited with establishing those results.

## Evidence and method

| Evidence | Scope and limitation |
|---|---|
| Owner's alert | Reports 77% of five million daily reads; trigger for investigation, not caller attribution. |
| GraphQL account hourly metrics | Current UTC-day totals, captured at 05:11:32 UTC. Full response retained privately; SHA-256 in `usage-at-alert.json`. |
| GraphQL adaptive query profile | SQL shape, execution count, and scanned reads; no bound parameter values or caller identity. Separate dataset from hourly metrics. |
| Wrangler `d1 info` | Rolling 24-hour metadata, including 4,481,124 rows read at its capture. Not the daily-counter value. |
| Wrangler `d1 insights` | Rolling 24-hour query profile; 49 groups, 4,606,568 reads at its capture. Timing and window differ from the daily view. |
| Earlier production benchmark | [Artifact 18](../readers-vs-bots/18-matomo-referral-policy-verification.md): fixed August 8–September 6 window; nine separate read-only queries, 182,388 reads and 111.17 ms summed database execution. |
| Source inspection | Baseline `3d92b10`; costly SQL, Worker routing, browser fetch, and real-time wording in generated discovery material. |

Production evidence is retained outside Git with access restricted to the author. Public artifacts contain aggregates, methods, and hashes. Those hashes commit to private bytes; they do not let a reader independently reconstruct the account metrics without access to the captures. The prior `readers-vs-bots` research accounting is not expanded or relabeled by this later incident.

## Correction

[ADR-0016.7](../../../../../docs/adr/0016.7-budget-d1-reads-and-cache-public-reports.md) records one shared report assessment, an hour-bounded edge cache, truthful freshness disclosure, and bounded verification. A first candidate matched the old output in local SQLite but failed production compilation with `too many terms in compound SELECT`; it was not deployed. That failure requires a D1-runtime check before release in addition to Node fixtures.

The revised report matches the old projection in 148 local cases, including execution through Miniflare's D1 binding. The filter's policy version, retained observations, name suppression, and historical report captures remain valid. The claim requiring correction is operational adequacy: correct counts and short query duration did not establish a sustainable public endpoint. [Verification](01-verification.md) separates local acceptance from the production checks blocked by the cap.

## Authoritative references

Checked September 7, 2026 UTC:

- [Cloudflare D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/): daily account allowances, scanned-row definitions, metered SQL access, and exhaustion/reset behavior.
- [Cloudflare D1 metrics and analytics](https://developers.cloudflare.com/d1/observability/metrics-analytics/): hourly usage, query profiles, and fields used in this capture.
- [Cloudflare Workers Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/): explicit cache operations, per-data-center storage, expiry, and unsupported stale behavior.
- [Cloudflare Cache API example](https://developers.cloudflare.com/workers/examples/cache-api/): request-time `match` and `put` integration.
- [Cloudflare D1 limits](https://developers.cloudflare.com/d1/platform/limits/): SQL size, parameters, duration, and batching boundaries.
- [SQLite WITH documentation](https://sqlite.org/lang_with.html): materialized common table expressions and their evaluation boundary.
