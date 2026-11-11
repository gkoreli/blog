# Browser report recovery and date-matched Google referrals

November 11, 2026, Pacific time. This continues the [public-stats availability investigation](05-public-stats-503-2026-11-10.md). It does not reopen the completed September read-budget task. [Aggregate receipt](2026-11-11-google-comparison.json).

**Later row-level investigation:** [the 79 zero-click-date observations](07-zero-click-google-referrer-investigation-2026-11-11.md) have no retained diagnostic headers or exact match to an inspected saved test receipt. Current rules agree on all 33 records with retained declaration evidence. A local browser click/reload preserves the same external referrer across two requests; zero-click dates alone do not demonstrate a defect. Counts below remain unchanged.

## Availability observed

An earlier unmarked request to `/api/stats?range=90d&traffic=browser` returned HTTP 503. Its response headers and Worker event were not retained, so its failure layer and cause remain unknown. No persistent selector failure is reproduced in this continuation, and no runtime change is made or credited with recovery.

Two marked cold requests return **200 / MISS**, each with six successful statement results and **972,693 reads / zero writes**. Their logged Worker is `ddae0c8d-551f-4e02-8d22-1632a2839500`; the report contract remains `2026-11-10.1`. Later, two requests over one connection reach SEA and return **200 / HIT** with identical 37,639-byte bodies, SHA-256 `83fcb041c1adbd0e4f774689dc734b1581f0f7bade1ed52c4e1fb9549c7039f2`, and the same calculation timestamp, `2026-11-11T15:40:13.015Z`. Their Worker events contain cache hits without another calculation. An unrelated concurrent release changes the executing Worker to `134dfb75-e01e-42b0-85b1-1dd07c76408b`; this investigation does not deploy a repair.

The browser UI also renders the selected report: **6,778 views**, including **92 Google-referrer observations**, for August 14–November 11 UTC. Its request is separate from the marked API controls, and its calculation cost is unavailable. These checks establish current recovery and cache reuse, not the cause of the earlier 503 or permanent availability. No speculative retry or query rewrite is introduced.

## Exact date comparison

The signed-in Search Console domain property is `sc-domain:gkoreli.com`, with **Web (text)** and **August 10–November 9, 2026**, inclusive. Its CSV chart contains 92 days, **11 clicks** and **1,585 impressions**. Page rows also sum to 11 clicks. Visible query rows sum to one click; omitted query details do not turn the chart's total into one click. Google's [discrepancy guide](https://support.google.com/webmasters/answer/17010575?hl=en) explains the distinction between anonymized query rows and chart totals.

The matching database interval is **`2026-08-10 07:00:00` inclusive through `2026-11-10 08:00:00` exclusive, UTC**, using `America/Los_Angeles` and its November daylight-saving transition. The rolling 90-day UI interval is different and is not substituted for these dates.

The read-only query selects normalized `google.com` and `www.google.com`, applies both public owner exclusions, and checks that both hostnames are included by the inspected referral policy. A native D1 fixture passes eleven boundary, daylight-saving, hostname and owner-exclusion cases before production execution. Metadata access and a zero-read `SELECT 1` control succeed first. The aggregate costs **46,851 reads / zero writes**, below its 200,000-read post-execution review threshold. No event identifiers or client pseudonyms are exported.

| Same August 10–November 9 Pacific interval | Count |
|---|---:|
| Search Console Web (text) clicks | 11 |
| Google-referrer observations, all categories | 682 |
| Browser signals | 91 |
| Hosting-network browser grouping | 504 |
| HTTP clients | 57 |
| Search-crawler declarations | 13 |
| Unresolved | 9 |
| Preview/service declarations | 5 |
| Earlier browser claims | 3 |

The categories sum to 682. **591 observations fall outside Browser signals**; hosting-list membership alone does not prove automation. Of the 91 Browser observations, 47 use the earlier navigation rule, 35 the later network-unlisted navigation rule, six the historical beacon rule, and three the earlier User-Agent-only rule. These are stored classifications rather than authenticated people or search arrivals.

The all-time 759 reconciles as **682 in the matching interval, 76 earlier observations and one later observation**. The all-time Browser total of 168 similarly reconciles as 91 + 76 + 1. Thus a different date range accounts for only 77 of the original all-category observations.

The remaining Browser comparison is **91 request observations versus 11 Google-recorded clicks**, a difference of 80 between different units. Seventy-nine Browser observations occur on 32 Pacific dates for which the Web (text) chart reports zero clicks. This is an aggregate date comparison, not a join of individual clicks to requests and not proof that those observations are fabricated. Page examples also diverge: the homepage has 34 Browser observations versus six clicks; the bot-detection article has 25 versus one. The separate generative-AI report shows nine impressions for the same dates and offers no click metric in the observed view; those impressions cannot be used as additional clicks.

## Interpretation and remaining limits

Our collector records a request's reported referrer hostname, and the report counts observations. It does not verify a Google Search click or retain the referring Google page. Repeated requests, non-Web Google navigation, supplied headers and collection differences remain possible contributors; their individual shares are not measured here. Browser signals remain useful context but cannot be substituted for Search Console clicks. Agent access remains supported reach within its evidence boundary.

Use **11** for Google's recorded Web (text) clicks in this interval, **682** for all included observations reporting a Google hostname, and **91** for the Browser subset of those observations. Do not describe 682 or 91 as verified organic-search acquisitions, and do not describe 591 as proven bots. No historical observation or public classification is changed.

Raw API responses, the Search Console export, SQL, native fixture and marked request logs are preserved privately at `/Users/goga/.local/share/gkoreli/analytics-evidence/2026-11-11-google-referral-reconciliation`: **40 files / 472,759 bytes**, manifest SHA-256 `cba61a5187d7bc49631da931a3a7087efb8825b74b0218a0e4a452049c6605cc`. Raw queries, request metadata and source conversation are not committed. The diagnostic tail and local fixture server are stopped; the verified Browser and Search Console tabs remain available.

**Complete:** current Browser report recovery, cache reuse and the same-date aggregate comparison. **Unresolved:** the original isolated 503's cause and an individual-click explanation of the remaining Browser difference. The next bounded availability action is to retain a marked failing response and its Worker event if the failure recurs, before changing query or retry behavior. Further report fills or broad traffic scans are not needed for this comparison.
