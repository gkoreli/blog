# Show what an unassessed vendor check means

October 30, 2026 UTC. Continues [the two production cache-evidence chains](104-vendor-cache-production-acceptance.md). This iteration prepares public explanations and repairs a report-version compatibility bug. It does not identify readers, recalibrate population accuracy or recover historical publisher headers.

## Evidence became available before every report could read it

Research 103 advanced the collection stamp to `2026-10-30.1` without changing Fetch Metadata parsing or the classifier. The public parser report still accepted only collection `2026-10-29.6`. **Valid new-format records could appear unrecognized**, with their fields unassessed, even though the collector stored them correctly. The production acceptance in Research 104 checked vendor-cache storage and its validator; it did not test this separate parser report.

The maintained [native reproducer](../../../scripts/check-vendor-cache-summary.mjs) uses the actual current collector and a pinned `7bebbab` report. The same stored parsing facts produce one unrecognized record before the repair and one recognized record after it, including its true activation claim. Common headline, classification and other report outputs agree. The native fixture fixes its observation time before both report comparisons; parsing facts are not rewritten. Node also tests the actual current collector, so a future collection bump cannot silently escape this gate.

The repair explicitly accepts the two compatible collection stamps with parser record `2026-10-29.2` and classifier `2026-10-29.3`. An unrelated earlier or future collection remains unsupported. This changes reporting compatibility, not headers, classifications or historical rows. Production prevalence of the reporting error is not measured here. The automated fixture's activation claim is not a human label or a new population-calibration observation.

## A public explanation needs denominators

A native disclosure beneath Published network checks now presents `vendorCache` coverage, access paths and accepted policy context. Each included event appears once among recognized, unrecorded and inconsistent records. Recognized records separate no applicable feed, guards only and recorded access. Historical records cannot inherit today's policy facts.

The synthetic 95-record fixture makes the overlap visible:

| Question | Event counts |
|---|---:|
| Recognized / historical-unreported / inconsistent | 53 / 17 / 25 |
| No applicable method / guards only / cache access | 2 / 1 / 50 |
| Known policy / unknown policy / both | 44 / 8 / 2 |
| Positive reuse context / blocked context / both | 12 / 34 / 2 |

Thus `44 + 8 − 2 = 50` events have access facts, and `12 + 34 − 2 = 44` have accepted policy context. The six access counts sum to 55 across those 50 events because sources overlap. A repeated path within one event counts once. Blockers also overlap; they must not be added as independent requests. These are labelled fixtures, not site traffic.

A cooldown stays unassessed and may carry the last accepted policy without a membership snapshot. A positive interval describes that validation, not freshness now. A failed check with no accepted context remains unknown. Guards do not become fetches. The panel explains these limits beside the counts; native HTML details keeps it closed initially. No new tracking or raw headers are collected.

## Build one bounded projection, reject incomplete results

The [server projection](../../../../analytics/src/vendor-cache-report.ts) reuses the existing stored network validator, groups identical JSON facts and expands only recognized cache-era checks. At most four assessed sources contribute access/policy masks; closed blocker masks preserve overlapping causes. The decoder rejects unsupported values, duplicate groups, missing coverage and impossible access-policy combinations. The [shared contract](../../../../analytics/src/vendor-cache-report-contract.ts) checks partitions and marginal bounds on both server and client. BigInt intermediates preserve exact overlap arithmetic even when safe integer marginals have a sum beyond the safe integer range.

[SQLite's JSON documentation](https://www.sqlite.org/json1.html) explains typed extraction, immediate-child expansion and JSON-aware aggregation. Its [CTE materialization guidance](https://www.sqlite.org/lang_with.html#materialization_hints) explains the optimization fence; materialization alone does not prove a read saving. [Cloudflare's JSON contract](https://developers.cloudflare.com/d1/sql-api/query-json/) documents the native operations and malformed-input boundary. [Source cross-references](vendor-cache-summary-sources.json) connect those contracts, the cache directives and the compatibility repair to code and controls.

[Native acceptance](vendor-cache-summary-native.json) covers 95 individually assessed record cases, the mixed cohort, empty results, all-history reporting, eighteen decoder negatives, current collection and explicit compatibility cases. A separate set-based oracle derives expected events from labelled publisher conditions and constructed source combinations, independently of the SQL masks/decoder. Compiled Node and workerd agree. Owner, referral, path and time exclusions apply before aggregation. The closest pinned baseline preserves all common mixed-report output; only the isolated parser regression intentionally changes its metadata interpretation.

## Added visibility has a measured local cost

| Matched native fixture | Before reads | After reads | Increase |
|---|---:|---:|---:|
| 512 historical rows | 34,797 | 35,874 | 3.1% |
| 512 current rows, repeated facts | 44,233 | 45,538 | 3.0% |
| 512 current rows, distinct times | 44,233 | 48,558 | 9.8% |

All report statements write zero rows in these local measurements. The distinct-time fixture prevents repeated synthetic facts from hiding expansion cost. These are local query meters, not production savings or a global quota budget. The 95-case mixture rises 13,724→14,321 reads with common output preserved.

Actual 7d/all SQL is 76,736/77,107 bytes with seven bindings. The new projection uses six JSON key/value pairs and its internal object three. These stay within the [documented D1 limits](https://developers.cloudflare.com/d1/platform/limits/) of 100,000 statement bytes, 100 bindings and 32 function arguments. Native local execution does not substitute for production acceptance.

## Browser and delivery boundary

[Browser checks](vendor-cache-summary-browser.json) compare all 25 rendered values with the independently checked synthetic report. Native keyboard collapse and pointer reopen pass. Default desktop width is 1,280 with a 728-pixel panel; at 390 pixels, document width remains 390 and no diagnostic row overflows. Missing diagnostics, contradictory counts and HTTP 503 hide the dashboard; retry restores the valid report. The owned preview stops, its terminal is awaited, the temporary tab closes and the viewport resets. These are automated local checks, not physical-device or human trials.

[Checks](vendor-cache-summary-checks.json) pass 317 analytics tests, 166 site tests, workspace types, 22 Markdown validations, the isolated 33-post build and Worker dry-run. The maintained membership-only diagnostic passes forty controls after explicitly excluding additive cache/metadata fields absent from its older `c8e6bec` baseline. Its first stale comparison fails and is preserved; this is separate from the new `7bebbab` comparison, not evidence of a new production membership change.

The full-stats cache advances to `2026-10-30.2`. Collector, classifier, signature verifier, schema, exclusions, article-readership report and article/prompts stay unchanged. No production site request, data SELECT, credential change or diagnostic activation occurs in this slice. Wrangler's prior D1 authentication error is neither retried nor declared repaired.

The private 78-file archive preserves source snapshots, the pinned baseline, the older comparison failure, native reports/meters and synthetic UI captures under manifest SHA-256 `c9bb9f88e38c294b8fa98e65d229fc13cbeeaf37dc578a82609472f1c6a0933c`. October 31 is review, not automatic deletion. Links and recorded code hashes reconcile.

Source delivery, activation and public report/cache/asset/cost acceptance remain separate. The broader goal stays active. Next: accept this exact release with an excluded readiness request and a narrowly selected public report, preserve actual cache/meter behavior and avoid broad data rescans. Human trials remain deferred; native-provider agreement, source authenticity, search-query access, reader growth and privacy/retention work remain open.
