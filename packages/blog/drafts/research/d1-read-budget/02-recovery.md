# D1 Recovery and Measured Report Cost

September 7, 2026 UTC. This is the current acceptance record following the [quota incident](00-incident.md) and [initial deployment checks](01-verification.md). The owner reported completing a Workers Paid upgrade. The agent did not change billing, and no upgrade approval remains pending for that completed action.

## Stored observations and scanned reads

The database is small. A bounded count at **06:19:56 UTC** returned **7,010 stored page observations**; D1 reported **3,117,056 bytes** for the whole database, about 3.1 MB. This is the observation-table count, not a count of every row in all eight database tables. The count query itself consumed 7,010 reads and wrote nothing.

The earlier **182,388** number measures the cumulative rows scanned to calculate one report. It is not stored-row cardinality, report-row count, or visitor count. The nine original statements repeated observation selection and referral assessment against 2,349 rules before calculating their panels. Repeated reads count again. The [original full-report benchmark](../readers-vs-bots/18-matomo-referral-policy-verification.md) and [Cloudflare's accounting definition](https://developers.cloudflare.com/d1/platform/pricing/) establish those different units.

The exhaustion capture's query profile contains **225 referral-matcher statement executions consuming 5,028,734 reads**. That is consistent with about 25 nine-statement reports. It does not prove twenty-five distinct callers or requests: direct verification SQL also appears in query profiles, and interrupted or scoped calls can differ. The same requested UTC-day interval produced different hourly and adaptive-profile totals; they remain separate captures.

## Successful production comparison

At **06:18:37 UTC**, the revised query succeeded against production D1. It used the same fixed August 8–September 6 window and clock as the archived earlier report. Its complete public response was deeply equal to the retained response, including **937 included observations plus 35 excluded**.

| Measurement | Original report | Revised report |
|---|---:|---:|
| D1 statements | 9 | 1 |
| D1 `rows_read` | 182,388 | 33,259 |
| D1 rows written | 0 | 0 |
| Summed database execution | 111.17 ms | 29.1998 ms |

The revised report used **81.7647% fewer measured reads** in this comparison. The old statements and the new statement were executed at different times, so this is not a simultaneous transaction or Worker-latency benchmark. Response equality verifies this retained cohort; it does not establish every future window's cost. The one statement still scans its materialized population for different aggregates.

## Successful live cache reuse

Two requests at **06:19:55 and 06:21:53 UTC** returned HTTP 200 and `X-Stats-Cache: HIT` from Cloudflare's SEA location. Both sent `Cache-Control: no-cache`; the second reordered supported filters and added an irrelevant parameter. The received JSON bytes were identical, and all exposed referrer names were approved. Path totals, time-series totals, and referral categories reconciled with the headline total.

Both reports retained `updatedAt: 2026-09-07T06:11:48.211Z` and an expiry of `07:11:48 GMT`. The rolling August 9–September 7 window contained **1,028 included and 38 excluded observations**. Those counts belong to this live window and must not be substituted for the fixed historical cohort. The first verification attempt incorrectly asserted the old 35 exclusions against the live window; the assertion was corrected using the saved response, without fetching that report again.

These were existing cache hits, so the handler did not generate either report through D1. The captures establish reuse in that location. They do not establish who filled the cache, a global cache-hit rate, or protection against every distinct filter, eviction, data center, or concurrent isolate.

## Verification budget and preserved evidence

This recovery check used two successful direct D1 statements: **33,259 + 7,010 = 40,269 metered reads**, with **zero writes**. Its two live report requests were cache hits. Metadata requests, local fixture comparisons, and the previous static-page/invalid-state checks are separate activities; no production filter sweep was run after the upgrade.

[Machine-readable measurements](recovery-measurements.json) include query metadata, inventory, report/capture timestamps, aggregate reconciliation, cache headers, and response hashes. [Private file commitments](recovery-evidence-manifest.json) cover the scripts and original results under the author's `analytics-evidence/2026-09-07-d1-read-budget/post-upgrade/` archive. Raw results and unapproved hostname aggregates remain private. Hashes commit to those bytes; the author needs the private files to reproduce the evidence.

The [local-query attribution audit](04-local-query-attribution.md) links **190,811 pre-exhaustion reads** directly to the saved analytics benchmark. Four additional saved HTTP report checks have no per-request D1 metadata. The preserved calls' conservative hourly envelope is 190,811–1,531,718 reads; that is a bound on those specific calls, not on all operator or agent activity. Other small queries in machine-shared Wrangler logs are not assigned to this task without linked evidence. The scoped audit cannot attribute the remaining activity to an attacker, an owner browser, or another session. Worker logs/traces were not examined for that wider attribution.

## Current meaning and remaining work

Production D1 access, the revised report, and cache reuse are verified. The read-budget implementation task can close. No policy, stored observation, classification, or schema changed during this recovery check.

An upgrade removes the free daily cap; it does not erase the query-cost defect that required engineering. The cache still has location and cardinality limits. Observe a declared operating window through metadata before deciding whether another optimization is necessary. Do not spend more production reads merely to reconfirm the completed benchmark.

Newsletter signup, confirmation, and unsubscribe were not exercised with real subscriber credentials or a fabricated signup. Their separate reliability work remains open. The precise outage interval and any missed observations or signup attempts are unmeasured; do not claim that rejected work was queued, recovered, or replayed. The [handoff](03-handoff.md) identifies the next bounded actions.
