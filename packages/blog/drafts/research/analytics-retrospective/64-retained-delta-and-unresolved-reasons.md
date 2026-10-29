# 712 newer retained records: what their evidence establishes

October 29, 2026 UTC. Continues [the isolated header experiment](63-disabled-before-expiry.md) and recovers the frozen boundary from [research 54](54-retained-signature-applicability.md). The previous goal turn made progress through a live experiment and accepted publication. This turn reconciles the new retained population and investigates its unresolved cases without changing their classifications.

## What the delta covers

The original private preflight's bytes match its archived manifest. Its exact text maximum ID bounds 32,363 retained rows. We select IDs strictly above that boundary and at or below a fresh preflight maximum. All **712** selected records contain detailed verification records. The main census inventories every selected record: **711 included, one referral-excluded and zero owner-excluded**, using current owner precedence and the archived referral policy. Exclusion does not delete the retained event.

Their recognized event timestamps range from **October 28 05:41:35** through **October 29 01:30:46 UTC**. All are at or after the earlier 05:22 event-time cutoff. This is an ID-bounded selection, not a replacement of the ID boundary with that time cutoff. The original census already included one record after its event-time cutoff; these selections do not overlap by ID.

[SQLite's AUTOINCREMENT documentation](https://www.sqlite.org/autoinc.html) distinguishes increasing automatically assigned IDs from gapless IDs and explicit ID assignment. We count rows instead of subtracting IDs, preserve bounds as text, and test adjacent values above JavaScript's safe integer range. A maximum ID excludes later inserts; it does not freeze old rows against edits/deletions or recover failed writes. Adding 712 to a historical table count would not establish today's entire database count. No held transaction spans preflight, census and follow-up.

[Cloudflare's read-replication documentation](https://developers.cloudflare.com/d1/best-practices/read-replication/) distinguishes primary reads from session consistency; it does not make these separate CLI requests a historical snapshot. Fresh metadata reports replication disabled. Its 1,885,210 rows-read metric is rolling 24-hour/database scope, not UTC-day account headroom or attribution to this investigation.

## Included stored classifications

| Stored kind | Included events |
|---|---:|
| Cloud browser | 310 |
| Other bot | 89 |
| Unresolved | 83 |
| AI search | 82 |
| HTTP client | 61 |
| Browser | 42 |
| AI crawler | 36 |
| Search crawler | 6 |
| SEO crawler | 1 |
| AI assistant | 1 |
| **Total** | **711** |

These are retained labels. Cloud browser is the hosting-network heuristic in [the classifier](../../../../analytics/src/readerkind.ts), not an operator identity. Browser-shaped requests do not authenticate people. Every included row has the current classifier stamp; 705 have the current collection stamp `.28.10` and six have another recorded stamp. “Other recorded” does not validate arbitrary version strings as reviewed historical profiles. Current stamps do not replay original inputs.

The [closed census](retained-delta-production.json) keeps that population separate from signature outcomes:

- 656 record no signature headers; three have unverified local outcomes; 52 have stored verified outcomes.
- All 52 verified outcomes use verifier `.28.7` and collection `.28.10`. Their stored kinds are 51 AI search and one SEO crawler. All record host-only request-target binding; none records User-Agent, method or resource coverage. Here “host-only” describes the assessed request-target fields. The query does not inventory other covered headers or content digests.
- All 712 raw records, including the excluded record, have unavailable native bot booleans. Zero observed positive flags with zero available native assessments cannot become a negative verdict or an accuracy rate.
- All 711 included published-IP records pass the current consistency projector. Eighteen have at least one listed outcome and two have a not-assessed outcome. Outcome families can overlap. A coherent record is not a fresh feed comparison, authenticated declaration or current address attribution.
- Signing-origin comparisons record 51 matches, 585 no-declaration outcomes and 75 not-configured outcomes. These method facts do not authenticate the unsigned role or reveal a human trigger.

The 52 current-profile outcomes establish stored persistence, **not newly recovered complete signed chains or fresh cryptographic replays**. The narrower [three-chain evidence](49-current-verifier-vendor-evidence.md) remains separate. We have not closed the genuine latest-collector proof/receipt/input gate from aggregate counts.

## Why records remain unresolved

A separately planned [reason follow-up](retained-delta-reasons.json) selects the union of Unresolved and unverified records in the same frozen ID range. It contains **84 distinct records**, because two of the three unverified outcomes also belong to Unresolved.

| Stored Unresolved reason | Included records |
|---|---:|
| Expected fetch metadata absent | 50 |
| Browser claim unrecognized | 32 |
| Fetch-metadata support unknown | 1 |
| **Total** | **83** |

Two records in the unrecognized-browser group have stored invalid-signature outcomes. A separate AI-search record has an **unavailable** verification outcome. Unavailability cannot be recast as cryptographic rejection. No independent ground-truth labels make any of these three a measured detector error.

None of the selected stored reasons is `request-context-conflict`. This does not establish that no such input conflict exists elsewhere: classification order can choose another kind first, and the follow-up does not replay raw requests. Its context-support field is inputs-not-assessed for all 84 selected records. The helper nevertheless tests matching, contradictory and unavailable retained context separately; missing fields are not counted as contradictions.

## Methods, cost and limits

[The census helper](../../../scripts/check-retained-delta.mjs) reuses production local-result, coverage, verifier-profile, native-boolean, documented-origin, published-IP and referral-policy projectors. It closes raw names and arbitrary version/reason strings before output. Twenty-three grouped states reconcile exactly with the 712-row total and the independent detailed-record count. The single census statement shares one materialized ID selection across its totals and groups.

[Native acceptance](retained-delta-native.json) compares 28 signature and 33 network fixtures against the full current report. It exercises inclusion precedence, current versus other stamps, impossible dates, malformed/duplicate aggregates, exact integer bounds and concrete/parameterized SQL equality. Its 8,192-row fixture has 4,096 signature/network records and 32,256 referrer-label steps; preflight plus census use **264,076 local reads / zero query writes**. Fixture setup writes remain local.

The reference report shares these projectors; agreement checks consistency rather than independently validating detection. The runtime is local workerd/D1 with explicit `cf: {}`. Supplied metadata fixtures are not Cloudflare service verdicts. From the repository root, compile analytics fixtures before running either helper:

```sh
mise exec -- pnpm -C packages/analytics exec tsc -p tsconfig.test.json
mise exec -- node packages/blog/scripts/check-retained-delta.mjs /tmp/new-delta-native.json
mise exec -- node packages/blog/scripts/check-retained-delta-reasons.mjs /tmp/new-delta-reasons-native.json
```

Preflight selects at most 8,193 rows through the native-tested primary-key range plan. The sentinel rejects the census if the reviewed 8,192-row, 4,096-detail or 32,768-label limits are exceeded. The actual preflight has 712 rows, 712 details and 31 label steps. The census also rejects truncated/duplicate/inconsistent groups. Its concrete SQL is 90,475 bytes. The 300,000-read review threshold applies after execution; it is not a database-enforced cap or a universal cost guarantee.

[The reason helper](../../../scripts/check-retained-delta-reasons.mjs) has its own nine-input native acceptance and budget. Its 8,192-row fixture exceeds the proposed 20,000-read budget; the accepted full-cohort-size fixture uses **11,830 reads for 712 selected rows**. The first failed scale assertion and later measurements remain preserved. No actual cohort records are dropped to obtain that result. The fixed private ID span permits at most 712 rows; the production reason query selects 84. Its separate budget is recorded before execution, preserving the original two-statement plan.

Post-execution review also reproduces a low-level parser weakness: reordered JSON object keys could evade duplicate detection. The checked helper uses canonical field order and rejects that fixture. [Offline replay](retained-delta-parser-replay.json) preserves the executed source hash, proves the SQL unchanged and accepts the captured output unchanged. No such duplicate occurs in this result; independent overall-count gates were also present. This is a parser repair, not evidence of production overcount, and it triggers no repeat production query.

| Production statement | Reported reads | Writes | Reported attempts |
|---|---:|---:|---:|
| New-ID preflight | 712 | 0 | 1 |
| Main census | 26,447 | 0 | 1 |
| Separately planned reason follow-up | 10,346 | 0 | 1 |
| **Total** | **37,505** | **0** | **3** |

Every statement uses Wrangler `--command`, with private SQL passed as one subprocess argument. No remote file import, stats fill, own-site request, new human label or expanded raw-reader capture occurs in the data investigation. Meters describe the provider-reported work for these statements, not unique readers or account-wide cost. Matching counts across statements are consistency evidence, not proof that no concurrent row changes occurred.

This diagnostic selection does not establish that a current stats API response or cached dashboard panel uses the same scope or calculation time. No fresh public-report acceptance is claimed.

[Checks and publication](retained-delta-release.json) separate data acceptance from Git delivery and the served article. Raw provider responses, exact ID bounds, SQL, failed native attempts and operational metadata stay outside Git with restricted modes and an October 31 review date, not automatic erasure. Runtime, schema, history and collection settings are unchanged by this investigation.

The article adds the new unsigned-User-Agent/resource result within its concise format and corrects the 1,025-record citation to [research 31](31-retained-history-completeness-and-delta.md), which actually measured that historical subset. The numeric claim is unchanged. New detector accuracy, device/human truth, request-level managed-verifier comparison, R1 attribution, complete historical proof recovery and privacy/retention decisions remain open. Human-operated trials remain deferred.

Next: use this frozen cohort to assess reviewed client labels against signature and method availability, and investigate the unavailable verification outcome through retained closed reason facts. Do not assume every AI-search label is Exa or start a new population scan to answer a question about this one.

## Publication acceptance

Source `5614a96de1ac4a223e73cfc65bcdded4bfa1881d` builds 32 posts in build `ba68ea81-028e-4155-9295-f820fd377077`. Its full build page identifies that commit; the downloaded successful log identifies Worker `0018e39f-3752-4fa0-b959-0c07d720db88`. Saved Wrangler deployment metadata assigns that version 100%. The dashboard exposes the same active version but leaves the Ready build row unlinked, labels the version “Manually deployed,” and renders 0% beside its 100% marker in the active summary. These UI inconsistencies are preserved; no cause or manual operator action is inferred. There is no agent retry or manual redeployment.

The direct Markdown response is HTTP 200 and byte-identical to the checked isolated build: SHA-256 `4d144ad80fcd1d1efaee750cf8f520d4cb305d1e274379f10d241112bfae47cc`. The article has 1,291 body words and 31 preserved shaping prompts. This adds one collection-ineligible publication GET, zero diagnostic SELECTs, zero public-report fills and zero human labels. The three data statements remain 37,505 reported reads / zero writes. This is publication acceptance, not new collector, native-detection or dashboard-scope acceptance.

The frozen data archive contains 42 files; its manifest SHA-256 is `bfba684ac250c558fe433ffb0fcd60c37674002934b9601842877168084c46fc`. A separate 11-file publication archive preserves the full source page, downloaded log, allocation metadata, screenshot and served response; its manifest SHA-256 is `4468a8a8970072726243f50146fb0f3852d79f4ef16cf164cef0a52e95d7661e`. Both remain private with 0700/0600 modes and an October 31 review date, not automatic deletion. The first source-page export contained only a browser-state diff; the separate full export supplies the inspectable commit attribution.

Next: review client/method and unavailable-verification facts within the same frozen cohort. Human trials remain deferred; the wider goal remains open.
