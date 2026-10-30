# A new day, another concentrated source

October 30, 2026 UTC. Continues [Research 94](94-reader-growth-and-editorial-decisions.md) and [the article-reach report](95-article-reach-report.md). The previous turn accepted diagnostic URL processing, not new readership evidence. This audit adds **October 29 UTC only** to the hash-verified older Browser capture. It selects no other stored kinds, raw User-Agent, IP or request headers, and creates no site visits or human labels.

## The spike still depends on R1

[The closed result](readership-delta-production.json) contains 86 newly selected stored-Browser HTML rows: 84 included, two excluded by the existing referral policy and none owner-excluded. Included events partition into 40 with no referrer, 13 internal and 31 external. None reports R1. Familiar reported hosts account for 12: Google 4, Reddit 4, GitHub 2, Kagi 1 and X 1. These are reported-source events, not authenticated acquisition or people. Six repeated same-day client/page requests remain within the 84; daily pseudonyms do not establish cross-day retention or unique humans.

Removing October 1’s 36 included events and adding October 29’s 84 changes the rolling total from 1,429 to 1,477. The two 28-day windows overlap for 27 days: **this is not a month-on-month growth rate**. The reconstructed October 2–29 window has 1,513 raw rows, 34 owner exclusions and two referral exclusions. Its completed seven-day intervals are:

| UTC interval [start, end) | Included Browser signals | Reporting R1 | Outside R1 |
|---|---:|---:|---:|
| October 2–9 |217|0|217|
| October 9–16 |257|5|252|
| October 16–23 |312|4|308|
| October 23–30 |691|388|303|

The latest apparent jump is 312→691; outside R1 it is 308→303. Collection/classification profiles change within the window, and Browser rules admit unattended clients. This does not prove human growth, decline or flatness. R1 is the same explicitly selected historical hostname, still the largest source in the combined window. It is not excluded by this sensitivity calculation.

## A global largest-source check can miss an article spike

A different source, **R2**, contributes 17 of the new day’s 84 included events and 22 across the rolling window. Five were already present in the older capture. All nine new Topologies of Thoughts events report R2; three of the four new Codemap events do too. R2 is the largest new-day external hostname without public display approval, distinct from R1. Neither display status nor concentration establishes spam, source authenticity or operator identity. The underlying hostname stays private.

The existing report fixes the largest source across the whole window. That preserves comparable sensitivity columns, but R1 can overshadow a different source's effect on an individual article. This is a concrete visibility gap. **Next report iteration: add article-level source concentration alongside the fixed whole-window comparison**, with explicit denominator, private naming and native metering checks. Do not silently change exclusion policy or label the remainder human.

The AI-fetcher reference remains first outside R1 at 63 events; plugin apps has 43 and bot detection 36. Setting both R1 and R2 aside preserves these leading counts/order. Yet the fetcher reference’s 63 comprise 50 absent-referrer, 12 internal and only one remaining external event: a stable request ranking still cannot establish search demand or useful reading.

Bun AOT leads the new day with 16 events, including four Reddit-reported events, one each reporting GitHub/Kagi/X, two other external, one internal and six absent-referrer. This supplies a bounded editorial follow-up lead. It does not establish those referrers as genuine visitors or justify a sequel by itself. The macOS installation article has six events, five unattributed and one internal, with two repeated same-day client/page requests. It is too early and too weakly attributed to call either a growth winner. Continue the practical agent-fetching reference; investigate Bun's actual query/use evidence before expanding that topic. These are editorial hypotheses.

## Search evidence needs its own denominator

The [fresh source review](readership-delta-sources.json) sharpens the planned Search Console comparison. Google's [query API contract](https://developers.google.com/webmaster-tools/v1/searchanalytics/query) uses **Pacific Time with both endpoint dates inclusive**; our library uses UTC with an exclusive end. Record each source's exact boundaries and daylight-saving offset before comparing periods. Finalized versus preliminary data and response aggregation must also stay explicit.

Google's [data retrieval guide](https://developers.google.com/webmaster-tools/v1/how-tos/all-your-data) warns that page/query detail can drop data. Pagination alone cannot prove completeness. Its [discrepancy guide](https://support.google.com/webmasters/answer/17010575?hl=en&ref_topic=17010766) explains omitted anonymized queries and why filtered totals may fail to reconcile. The [report overview](https://support.google.com/webmasters/answer/7576553) also warns that unavailable displayed values can become zero in exports. Preserve display/availability evidence alongside CSV; missing demand is not measured zero demand. No authenticated query report is read here.

The tab inventory shows the earlier Google session as expired. Automatic approval review rejects binding that origin because account/session access lacks current authorization. The agent requests specific permission for the existing sign-in flow; it neither observes the page nor uses another route. Human-operated trials remain deferred. These dependencies gate particular measurements, not the independent work above.

## Checks, cost and limits

The [audit helper](../../../scripts/audience-audit.mjs) now accepts validated bounded midnight-UTC windows while preserving its historical default. [Native checks](readership-delta-native.json) retain 13 original cases / 12 transport negatives and the 32,768-row scale control, adding exact one-day boundaries, shifted-week reconciliation, eight invalid-window cases, leap-day validation and rejection of out-of-window analysis. A real local D1 execution of the concrete SQL confirms the one-day path. The scale pair reports 8,192 local reads/zero writes; these are fixture costs.

Two frozen single-attempt Wrangler `--command` SELECTs report **1,344 production reads/zero writes**, 672 each. Preflight/export count, exact upper ID, text-byte total and maximum row bytes agree. The read threshold is a post-execution stop, not a server-enforced cap. Capture is not transactional across statements.

[Independent native reconstruction](readership-delta-frozen.json) loads the 1,513 selected rows and reproduces all 33 article cohorts, every weekly total and source partition through the actual article-reach library; one local assessment reports 27,199 reads/zero writes. It preserves selected scalars and supplies synthetic defaults for unselected required fields; it is not a complete production snapshot. Older owner links/rows stay frozen at their prior capture; this is additive historical analysis, not current whole-window owner re-evaluation. The validated current isolated-build catalogue corrects the already documented macOS date to October 28. The original catalogue/results stay unchanged.

An initial local run stops on sandbox loopback permission; the permitted run passes. An initial preparer expects a flat manifest instead of its files array and stops before SQL; the corrected preparer verifies all reused hashes. Both failures remain private. No production request is repeated. Runtime/library/UI, article prose and shaping prompts stay unchanged. The private 50-file archive has manifest SHA-256 `41e5e45a2310080fdaa68f8f51adcb5a5423b85e8a63d34af369006b9bf82257`; October 31 is review, not automatic deletion. The analytics goal remains active.

[Research 101](101-article-specific-source-concentration.md) implements the proposed article-level concentration with distinct denominators and separately accepted local evidence. This does not change the historical findings or exclusion policy above.
