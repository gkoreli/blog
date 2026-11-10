# User-Agent findings from our retained Cloudflare data

Started November 10, 2026, America/Los_Angeles. Continues [worklist 136](136-user-agent-trust-and-hardening.md) after the owner explicitly asks to inspect Wrangler/Cloudflare logs and extract findings from our own data. The [source/local hardening acceptance](138-user-agent-hardening-acceptance.md) remains accepted under its original scope. This continuation does not reopen retired articles or unrun human/native-provider experiments.

## Bounded questions

1. Which real retained headers exhibit frozen OS patterns, compatibility products, app/WebView forms, missing claims or contradictions?
2. Which recognizable product declarations remain uncatalogued, and what would their recognition actually change?
3. How do stored name, role, provider-category and verification states overlap, with historical profiles and exclusions explicit?
4. Which observations can enter the article as real measured examples, and which require source review or controlled reproduction?

Inspect existing retained logs before collecting new fields. Use a frozen recent window and document result limits, sampling/retention and selection. Keep Worker log events, eligible D1 page observations and public included events separate. Raw captures, headers, addresses, exact operational identifiers and session logs remain private.

## Access, cost and execution plan

The current Wrangler `d1 info blog-analytics --json` attempt at 21:03 UTC returns authentication error 10000. Its captured error is not evidence of unavailable production binding access, quota exhaustion or zero data. No CLI observation SELECT is retried without fresh positive query access. The already-signed-in native Cloudflare dashboard loads the intended account and Worker; use its documented read interfaces where the CLI lacks current authorization or historical log capability.

Start with metadata and a bounded retained-log view. For any new D1 data query: inspect schema/indexes, native-test the exact SELECT locally, and keep a post-execution review threshold of 100,000 reads per statement / 200,000 total for this continuation; stop further data SELECTs on exceedance. These are review thresholds, not server-enforced caps. Avoid the full report's six-statement cold fill, measured at 839,029 reads in the separate [November 10 recovery](../d1-read-budget/05-public-stats-503-2026-11-10.md). Reuse saved captures when they answer the question. Do not change logging, billing, credentials, security settings or retention to manufacture a larger study.

## Acceptance and progress

- [x] Read latest worklists, retained-header research, D1 schema, query rules and same-day recovery evidence.
- [x] Preserve current CLI access failure and establish signed-in dashboard access independently.
- [x] Capture a frozen, bounded recent log selection with actual fields, counts and coverage limits.
- [x] Analyze supplied claims offline with the checked library; preserve genuine unknowns and compare relevant historical interpretations without rewriting them.
- [x] Reconcile the new D1 aggregate against its exact selector; preserve unavailable per-statement meters and stop further production SELECTs.
- [x] Distill consequential findings into the active article and concrete library follow-ups; avoid a catalogue addition without authoritative source review.
- [x] Check scoped artifacts and preserve private evidence commitments. The scoped Git commit/push records delivery; next action and limits are below.

## Frozen log population and export pitfalls

The signed-in native Worker log query selects `gkoreli-com`, November 9 00:00 through November 10 00:00 UTC. The initial unfiltered 1,000-record export contains **191 `cf-worker-event`, 653 span and 156 application-log records**, despite entering through the Invocations view. That export reaches only 20:05–23:56 and cannot be treated as 1,000 requests or a complete day. The first download wait initially reaches an export modal rather than a file; only the subsequent completed download establishes saved bytes.

Add `$metadata.type = "cf-worker-event"` explicitly. Its 2,000-record export is timestamp-descending, reaches the cap and begins at 04:05:43.365. A second export under the same filter, 00:00–06:00, returns 535 records below the cap. The overlapping 120 complete records match exactly as a multiset. Their canonical full-record multiset union preserves **2,415 records: 2,414 fetch envelopes and one scheduled invocation**. The saved native request identifiers are distinct for all 2,414 fetch envelopes in this capture. No envelope reports `truncated`.

An initial ID-only merge fails its consistency assertion: **97 metadata ID values occur on different envelopes**, with 115 additional records sharing those values. Deduplicating by `$metadata.id` alone would lose distinct records. This is an observed property of these exports, not a universal Cloudflare identity contract. Preserve complete-record multiplicity and the exact overlap; do not infer one row from an arbitrary identifier. A first shape probe also assumed every exported record had `$workers`; the mixed-event data falsifies that assumption. A later early-window check correctly separates the scheduled event rather than treating it as HTTP.

The requested period is a complete UTC day and the two exports cover it under the inspected ordering/overlap checks. This does **not** independently establish unsampled completeness or that every edge request invoked this Worker. [Cloudflare's current Workers Logs documentation](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) and [query documentation](https://developers.cloudflare.com/workers/observability/query-builder/) describe their own collection/query boundaries. The frozen request envelopes include assets, APIs, feeds, failed probes and page-shaped paths. Their source timestamps range from 00:00:07.163 to 23:56:29.518 UTC.

## Supplied-header results

[Machine receipt 140](140-own-data-user-agent-findings.json) retains closed counts, exact export commitments, the merge checks and the separate D1 result. Offline assessment runs current source against the retained header text; it does not reclassify stored traffic or authenticate a requester.

| Finding | Captured records | Interpretation |
| --- | ---: | --- |
| Supplied UA values, including missing as one state | 222 distinct values | Header diversity in this capture, not clients or people |
| Missing User-Agent | 29 / 2,414 | Missing text; no inferred operator or human label |
| Chromium selected alongside a Safari product token | 1,158 | Compatibility products cannot be counted independently as installed browsers |
| Complete documented Windows/macOS compatibility-version patterns | 1,049 | 694 Windows NT 10.0 and 355 Mac OS X 10_15_7; actual OS remains unresolved |
| WebView marker | 25 | Supplied embedded-browser indication; not genuine hardware proof |
| Supplied mobile hint | 520 non-mobile; 1,894 absent | No mobile boolean supplied in this cohort; absence is not a bot verdict |
| Catalogue declaration state | 1,743 none / 671 single / 0 multiple | Local name extraction, not verified software identity |
| Top-level provider category | 481 nonempty / 1,933 empty | Category is separate from native verification-boolean availability |
| Provider category with no catalogue name | 89 | 72 Search Engine Crawler, 10 AI Crawler, 6 Page Preview, 1 AI Search |
| Native verified-bot boolean available | 0 / 2,414 | Unavailable is not false; no managed-native comparison follows |
| New browser/OS diagnostic selection differs from pre-hardening source | 0 / 2,414 | Contradiction repairs remain controlled-counterexample evidence, without a demonstrated frequency here |
| CUBOT / FEVER text; conflicting OS/browser claims; unsupported mobile hint | 0 in this capture | Bounded negative results, not universal absence or reasons to erase regression controls |

There are 1,467 recorded 200 responses, 741 recorded 404 responses, five absent response statuses and other statuses in the receipt. All 2,414 records are HTTP request envelopes, not successful article observations. Neither this overall denominator nor a rough path-shape subset can substitute for the collector's eligibility and exclusion rules.

Concrete name-review leads include **Sofyabot 64**, **Twitterbot 6**, **FreshRSS 16**, **Elseweb 13**, **Webpulse 46** and **Feedparser 17** supplied occurrences. Sofyabot's 64 carry Search Engine Crawler category; Twitterbot's six carry Page Preview category. These are leads, not authenticated operators, catalogue defects or automatically accepted new declared roles. Catalogue additions require the registry's authoritative-source/role/codec/profile workflow. Recognizing every library name is not inherently the right policy.

## A real counterexample corrects the new explanation

Profile `user-agent-claims/2026-11-10.1` marks 1,051 envelopes as matching a frozen platform pattern. Two Firefox-shaped records supply only `Mac OS X 10.15`. They do not contain the complete documented frozen `10_15_7` version; selecting major 10/minor 15 cannot establish that match. The original raw headers stay private, and the short value above is the decision-relevant fragment.

The pure assessment now requires complete supported version patterns and advances to **`user-agent-claims/2026-11-10.2`**. Exactly two retained caution lists change, giving 1,049 matches; reported platform/browser fields remain identical. Counterexamples additionally cover nearby macOS/Windows/iOS versions and an Android `K-Touch` model lookalike; the latter is constructed, not observed in this captured day. It previously passed the `K` word boundary and now cannot substitute for the documented full `K` marker.

Collection, client-form, request-evidence and incoming-request profiles remain `2026-11-10.1`; classifier/catalogue/verifier/codec/history remain unchanged. This repair changes a reusable explanation, not stored audience categories. A full-version match can still be genuine old software or copied text; the caution does not prove reduction or recover the actual OS.

## Separate D1 observation boundary

The existing native D1 dashboard exposes current database metadata, independently of the failed CLI. Its rolling Last 24 hours tile rounds to 5M reads and 39.32 MB storage / 13 tables. That is neither a UTC-day allowance nor this task's read cost. A native-tested constant `SELECT 1` succeeds in Console, providing current query access through that route without observation selection.

One native-tested time-indexed aggregate then selects all `page_observations` from November 9 00:00 inclusive to November 10 00:00 exclusive. Six local fixture rows test both date edges, separate ingestion/daily owner states, null classification, signature coverage and optional evidence absence; the plan uses the known time index. The Console's single-line input strips line breaks without adding spaces; the first submitted representation consequently fails near `page_observations`. Preserve it. The exact one-line normalization is tested against native D1 before one corrected data SELECT succeeds.

The returned aggregate has **595 retained page observations**, with **388 no-candidate / 207 single-candidate / zero multiple-candidate** classification records. All 595 retain classification, signature detail and client-form records, and zero retain optional browser/OS request evidence. There are **101 stored verified signature outcomes**, with **zero recorded true User-Agent coverage flags**. No signature is reverified. All records have collection/classifier `2026-11-06.1`; ingestion owner flags and matching daily owner marks are zero.

This selection does not apply current referral exclusions and is not a public included-view report. Its 595 rows are not joined exactly to the 2,414 log envelopes, so the difference is not a loss rate or proof of skipped eligible requests. The Console reports response time 232 ms / query time 18.89 ms, **without per-statement rows-read/written meters**. The declared cost threshold therefore cannot be accepted as measured. Stop further production data SELECTs; do not call the failed/successful attempts zero-cost or run another report merely for meters. Known operations are one constant control, one syntax rejection and one successful data SELECT, plus metadata/log exports; those costs remain separate.

## Source activation and article disposition

The native Worker overview source-linked row shows the earlier hardening commit `693efd2e`, build `027f98c1-caa9-44a4-854c-0d51214bdc4f`, Worker prefix `889ef6a4`, Ready / 100%. This is fresh dashboard activation evidence for that source, separately from its earlier local acceptance. No full deployed source download or new controlled storage trial is performed. The narrower `.2` explanation repair in this continuation has its own subsequent source delivery; the earlier row is not proof it is deployed.

The active draft now opens with the 1,049/2,414 scoped observation, explains this own-data population and the partial-version repair, and retains the separate D1 counts. Fourteen complete shaping prompts are retained. It remains unpublished, with no assigned release date or new raw collection.

## Final checks and next action

All **443 analytics tests** and workspace typechecks pass. **41 supplied controls** agree exactly between Node and actual local workerd, with 41 fixture D1 readbacks and zero outbound requests. The actual retained partial-Mac input also passes the inspection CLI: version 10.15 remains reported, the complete-version caution is absent, and the raw header is not echoed. The full same-envelope before/after replay compares all 2,414 records: only two caution lists and the assessment profile differ. A first analysis harness build lacked the TypeScript loader, and an intermediate replay summary retained the old profile label; both are preserved and corrected before accepting the final receipt.

The isolated build renders 45 posts including the draft preview; 34 Markdown posts validate. Initial HTML, Markdown, citations, the five tables and all fourteen prompts agree with the checked source. The prior desktop/mobile presentation acceptance remains dated; this iteration checks generated representations. The administrative note is removed only in the isolated preview. Shared build output is untouched.

Private raw exports, rejected invocations, exact SQL/fixtures, analyzer sources, full comparison outputs and final source/render artifacts are in Git-ignored `packages/blog/worklog/user-agent-own-data-2026-11-10/`. The private SHA-256 manifest is verified with directory mode 0700 and file mode 0600; [receipt 140](140-own-data-user-agent-findings.json) records the commitment and counts. No raw captures or per-request identifiers enter Git.

This bounded own-data pass is complete. The most useful proposed library continuation is a source review of the observed Sofyabot/Twitterbot/feed-client declarations, followed by replay against this frozen population to measure any name-coverage gain separately from role/verification changes. No catalogue addition, independent operator trial or new live query is accepted by this record. If a future D1 question requires exact metering, first restore authorized CLI/API query access; the native Console result does not fill that gap. The article's next action remains owner editorial review and publication preparation.
