# Show the source behind each article's count

October 30, 2026 UTC. [Research 100](100-readership-delta-and-source-concentration.md) found nine new Topologies events reporting R2 while R1 remained the largest site-wide source. A fixed global sensitivity column could not expose that article's dependence on a different hostname. This iteration implements that missing report capability. The implementation/local checks and subsequent hosted acceptance are recorded separately below.

## One selection per article, with an explicit denominator

The report preserves the existing site-wide source, weekly totals, exclusions and source partitions. Each article now separately selects its largest normalized external hostname across the full 28-day window, breaking ties by hostname. That source stays fixed across the article's four weeks. Public display approval changes naming alone; unapproved names remain withheld. No collection, classifier, signature verification, schema or referral-policy change follows.

An article's new object contains selection scope, optional public name, count, four weekly counts and a separate count for unrecognized timestamps. It is outside the additive site metrics: article-specific sources can differ, so their counts cannot represent one shared site-wide audience. Zero external events produce an explicit zero object. A missing object is an error, not zero traffic.

The table places concentration under the article title: count and percentage of its external events, public name when approved, and total events outside that source. The two denominators are stated beside the table. A new client-only sort ranks events outside each article's source; the existing site-wide sort stays available. Neither remainder is a human count or an exclusion decision.

For the frozen Topologies cohort, total events remain 32 and the global-source contribution remains four. Its own leading source contributes nine of 13 external events (69.2%), all in the fourth week; 23 total events remain outside it. The old global sensitivity shows 28. Those numbers answer different questions.

## Reconcile totals instead of trusting plausible partial rows

The single SQL statement reuses the date-bounded relation, then groups external counts by article/hostname and selects one winner with `row_number`. It returns a separate winner total plus weekly rows. The parser rejects unknown article paths, duplicate rows, inconsistent names, unapproved native names, contradictory partitions and incomplete contributions. The shared client/server contract checks source counts against external events, global-source contribution, week bounds and unrecognized-time coverage.

An initial negative test exposed a flaw: deriving the total only from returned weekly rows allowed a missing week to become a smaller plausible result. The separate total closes that gap; the original failed test log is retained. This is structural consistency checking, not authentication of underlying requests or proof that arbitrary forged data is true.

Report version **2026-10-30.1** changes both contract acceptance and the existing cache namespace. It adds no caller-selected path/source/date state, extra per-article request, new dependency or background refresh. Old-schema responses fail visibly instead of being interpreted as complete.

[SQLite's window-function documentation](https://www.sqlite.org/windowfunctions.html) distinguishes partition ordering from final result ordering. Explicit count/hostname tie-breaking selects the winner without relying on result-row order. The [CTE documentation](https://www.sqlite.org/lang_with.html) explains statement factoring/materialization; actual native plans and meters, rather than the presence of a hint, establish the measured work. [Source cross-references](article-source-concentration-sources.json) link these contracts to the implementation.

## Accepted local evidence and its cost

[Native checks](article-source-concentration-native.json) retain the 24-condition report fixture and add 15 independent concentration conditions: different global/article winners, hostname normalization, ties, malformed-time coverage, owner/client/referral exclusions and zero-external articles. Thirty-five shared contract negatives reject incomplete or contradictory outputs. The query still uses one statement and six bindings, with the observed-time range index visible in the native plan.

On the same 32,768-row / 256-article native relation, the previous focused query costs 441,772 reads and the new query 540,506, an increase of 98,734 (22.3%). Both write zero; all prior report metrics match exactly. The existing full stats query costs 1,547,477 on that relation. The local review ceiling was deliberately expanded from 500,000 to 1,000,000 before execution for the additional scope; it is neither a production allowance nor a database-enforced cap.

[The frozen comparison](article-source-concentration-frozen.json) independently matches all 33 article winners/counts against private hostname aggregates and retains every prior metric. Its exact same-input native reads rise from 27,199 to 32,298, zero writes. These synthetic/reconstructed costs do not establish production savings, human labels or source authenticity.

[Checks](article-source-concentration-checks.json): 308 analytics tests, 166 site tests, workspace/final UI types, 22 Markdown validations and an isolated 33-post build pass. The first browser layout's additional column pushed source counts out of the desktop content width; moving concentration into the article cell fixes it. Final 1280px geometry is 728px client/scroll table width. At 390px, document width stays 390px and the focusable table scrolls by keyboard. Actual compiled assets display the native frozen result; sorting makes no new API call. Missing objects, contradictory counts and HTTP failure hide the report, and retry recovers. One exact-label locator mismatch is resolved against the observed select ID; it is not a failed user action. Local previews restrict third-party scripts/connections/frames, both owned endpoints are unreachable after shutdown, the viewport is reset and the tab is closed.

No production request, new population export or direct production SQL runs in this iteration. Article prose and shaping prompts remain unchanged. The private 121-file archive preserves source snapshots, baseline, initial failures, checked builds and browser captures under manifest SHA-256 `414788a0d3f69855fa803c137bafacfd4784eb7fdcddd1195442e73add1109c9`. October 31 is review, not automatic deletion.

At the local checkpoint, source delivery, hosted activation and bounded live report/asset acceptance remained pending; their separate acceptance follows. Human trials remain deferred, search access remains separately pending and the full analytics goal stays active.

## Hosted report and asset acceptance

[The release receipt](article-source-concentration-release.json) joins source `3b28416347ac1da93b8fb4dcc9d642b51d220adb`, native build `cfbc6510-addf-4de7-a8ec-b8b94806ec44` and full Worker `6afde47c-70e9-4e68-84da-ecc86fd9fdc3` at fresh Wrangler 100% allocation. The native source link, deploy completion and build-success log are inspected. Native Node is 24.22.1 versus the pinned local 24.14.1; the pin is unchanged. GitHub check `123992894434` still reports in_progress on the final read despite native success. That disagreement is preserved without inventing its cause or a green conclusion.

A frozen five-GET plan first uses an excluded owner-page response to establish exact header/version-filtered tail readiness. One normal-cache report GET then returns the new version and all 33 expected article/source cohorts: 1,477 site events and 971 article events, with every frozen metric equal apart from calculation time. The report is a MISS; its uniquely joined calculation receipt records **40,011 reads, zero writes, one submitted/returned statement and one total attempt**, with complete last-attempt metadata. The cost-receipt profile is separately `2026-10-28.1`; it is not the report schema version. This does not establish account-wide cost or a production before/after saving, and no warm-cache pair is measured.

The report's served article fragment matches the final isolated build; the complete JavaScript (10,234 bytes) and CSS (8,764 bytes) match exactly. Full HTML identity is not claimed because the local build uses synthetic public widget configuration. Each of the five owned responses has exactly one matching event, response Ray and full Worker version. No request is repeated, no direct production SELECT runs and all paths remain outside collection eligibility. These controls add no readers or bot-calibration labels.

The owned tail controller awaits shutdown and the recorded local process group has no remaining members; provider-side subscription deletion is not independently confirmed. The private 47-file release archive has manifest SHA-256 `5c634651dfe527ae2550963dc9f465360f04c0f3c6d11c7b922f9e7ec9a62e73`, with October 31 review and no automatic deletion. The earlier implementation archive and failed controls remain unchanged.

This closes this report extension's bounded acceptance. Next, use Research 93's exact-ID cutoff to preflight the unassessed new-ID request interval across all stored kinds, using the existing row/byte/read gates before offline shared assessment. The Browser-only refresh in Research 100 is not an all-kind census. Human trials, authenticated search data, native managed-verifier agreement and the full analytics goal remain open. A later evidence-only commit has its own build identity; it does not extend the point-in-time activation claim above.

[Research 102](102-all-kind-delta-and-verification-unknowns.md) completes the proposed bounded all-kind delta and distinguishes its partial-day scope from this completed-day report. No report calculation, UI change or new readership claim follows from that audit.
