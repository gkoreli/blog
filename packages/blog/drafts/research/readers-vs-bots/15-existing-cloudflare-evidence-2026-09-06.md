# Existing Cloudflare evidence for the edge-versus-RUM investigation

Checked September 6, 2026 UTC (September 5 PDT). Investigation in progress under TASK-0120. The fixed historical window remains September 4 00:00 inclusive to September 6 00:00 exclusive UTC. The full study belongs to FLDR-0008 row 10; article 024 needs the compact result and corrected claims.

## What existing data adds

Cloudflare's existing data provides useful request detail. It does not yet provide an exact reconciliation of the 95 D1 Browsers observations with the 14 comparable RUM page loads.

| Check | Observed result | Boundary |
|---|---|---|
| D1 export | 95 Browsers observations; 467 observations across all kinds, excluding owners, in the fixed window | All requests already recorded; no production writes performed by this investigation |
| Daily zone GraphQL queries | 990 returned groups on September 4; 649 on September 5 | Adaptive sampling is present. Estimated group counts are not individual request records |
| Preliminary correlation by exact timestamp second, path, and GET | 76 D1 rows have one candidate, one has two, 18 have none | Not a common request identifier |
| Refined correlation also requiring status 200, HTML, and matching country | 77 rows have one candidate; 18 have none. Of the 77 candidate groups, 76 report sample interval 1 and one reports 2 | Additional predicates resolve one ambiguity in the returned data, not the underlying lack of a shared ID. An unsampled candidate group does not make an incomplete export exhaustive |
| Redroid UA among refined candidates | 19 of the 22 `uniuit.com` D1 rows have a matching candidate declaring Redroid Android WebView, Chrome 122, and `uni-app` | UA declaration and correlation, not authenticated operator identity. The other three lack candidates in this export |
| Worker dashboard search | The full-window `uniuit.com` search reports 22 successes and 0 errors. Narrowing to September 5 16:15–16:16 UTC returns the known post-023 event at 16:15:10.998 UTC | Broad event list warned that results could be incomplete. Individual trace spans have not yet been inspected successfully |
| RUM finer dimensions | 18 returned groups, each count 1 and sample interval 1; 2 are bot-tagged HeadlessChrome, 2 are `/stats`, leaving 14 | A script receipt is evidence of browser execution/collection, not human intent |
| Live HTML response check | Post 024 returns status 200 with an injected Cloudflare beacon module. CSP permits its script host and same-origin connections; cache-control lacks `no-transform` | One current response, after the historical window. Does not establish historical injection coverage or successful browser execution |

The narrower RUM query also shows why subtracting 14 from 95 cannot identify 81 specific missing beacons. Matching by minute, path, and country yields eight RUM groups with one Browsers candidate; one with a Browsers and an HTTP-client candidate; one with two HTTP-client candidates; and four without any candidate in that minute. RUM's timestamp and D1's timestamp observe different stages, and these are incomplete matching keys. These results are a diagnostic, not a determination of set membership or classifier error.

## What traces can establish and what still needs checking

Cloudflare documents automatic Worker tracing of platform operations, including fetches and D1 queries. The repository enables logs and traces with head sampling rate 1. The signed-in dashboard confirms existing request events. That is sufficient reason to inspect retained traces before building additional instrumentation. Worker operations do not by themselves observe whether a remote browser executed a script or why someone invoked an agent. [Workers tracing documentation](https://developers.cloudflare.com/workers/observability/traces/), [custom spans and automatic operations](https://developers.cloudflare.com/workers/observability/traces/custom-spans/), checked September 6.

The existing Wrangler credential returns HTTP 403 on the Workers Observability telemetry API; D1 and zone/RUM GraphQL reads work. The signed-in native dashboard can read the historical event table, but attempts to expand the event did not open trace details. Its screenshots showed a blank page while accessibility exposed the event table; reloading and narrowing the query recovered table results without resolving detail interaction. Do not describe a trace link or configured tracing as an inspected trace. No browser credentials were extracted or permissions expanded.

The next useful trace read is the retained post-023 invocation at September 5 16:15:10.998 UTC, followed by an ordinary-browser comparison. Record the invocation/trace identifiers privately, the D1 and response outcomes, and any available shared observation key. Then establish how beacon receipts can actually be joined, rather than assuming that one trace spans the browser's later requests.

Cloudflare documents blockers, browser/network loss, and beacon-injection conditions as possible collection differences. Those are hypotheses for this cohort until observed or reproduced. [Web Analytics FAQ](https://developers.cloudflare.com/web-analytics/faq/), [data origin and collection](https://developers.cloudflare.com/web-analytics/data-metrics/data-origin-and-collection/), checked September 6.

## Reproduction and privacy boundary

The private scratch directory is `/tmp/readers-bots-gap/`: `d1-95.json`, `d1-all.json`, `zone-4.json`, `zone-5.json`, `matches.json`, `matches-refined.json`, `rum-detail.json`, and `live-html-check.json`. It contains request diagnostics and raw zone IPs used for this investigation; it is not part of the public research directory. The existing public baseline and its queries remain [artifact 12](12-production-followup-2026-09-05.md). The sanitized machine-readable progress summary is [artifact 15 results](15-existing-cloudflare-evidence-results.json).

Zone query shape: `httpRequestsAdaptiveGroups`, `requestSource: eyeball`, separate one-day half-open UTC intervals (the free query rejected two days), limit 10000, count and average sample interval, with dimensions `datetime`, `clientIP`, `clientRequestPath`, `clientRequestHTTPMethodName`, `edgeResponseStatus`, `edgeResponseContentTypeName`, `userAgent`, `clientCountryName`, and `clientDeviceType`. Correlation uses the predicates stated above, not IP identity.

RUM query shape: `rumPageloadEventsAdaptiveGroups`, the fixed two-day window and `requestHost: gkoreli.com`, limit 10000, count and average sample interval, with dimensions `datetimeMinute`, `requestPath`, `bot`, `countryName`, `deviceType`, `userAgentBrowser`, `userAgentOS`, `navigationType`, and `deliveryType`. Exclude bot-tagged and `/stats` groups only after preserving their counts. No user identifiers, IPs, exact visitor timestamps, or full browsing sequences are in the public JSON summary.

The controlled browser/HTTP-client trials remain unexecuted. The 95-versus-14 discrepancy remains unresolved. Existing data has improved diagnostic coverage; it has not established a bot fraction, human count, or per-cause decomposition.
