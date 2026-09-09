# What the requests without a referrer actually tell us

September 9 UTC / September 8 PDT, 2026. The article's saved report reconciles with production request aggregates: **1,616 Browser observations, including 753 reported HN referrals and 652 with no stored referrer**. The analytics captured a substantial response and separated different request kinds. It has not established an accurate count of people. The referral investigation also found an avoidable loss of information: internal referrals and absent or unusable headers are stored identically.

## The measured breakdown

The [fixed query](referrer-analysis.sql) selects the article from September 3 at 00:00:00 through September 9 at 00:33:35 UTC, excluding the endpoint. This reproduces the earlier report's partial-day cutoff to the timestamp precision stored in D1. It excludes owner flags and marked daily clients. The captured database state was read at **01:16:37 UTC**; later ingestion and historical reclassification remain possible. Applying archived referral policy `2026-09-06.2` locally reproduces every saved referral category and daily Browser total.

| Report category | Browser observations |
|---|---:|
| Reported Hacker News referrer | 753 |
| Other named referrers | 29 |
| Other reported referrers, names withheld by the display policy | 182 |
| No stored referring hostname | 652 |
| Total | 1,616 |

The 182 have stored hostnames. They are not missing referrals and are not excluded merely for being unfamiliar. The single excluded observation is separate. Among all request kinds, this selection contains 8,590 observations before referral exclusions and 8,589 after them. Those include 1,406 cloud-browser, 1,001 HTTP-client, and 2,292 legacy-browser observations. These are rule outcomes, not newly established bot or human labels.

Of the 652 without a stored hostname, the existing Fetch Metadata header gives us this further breakdown:

| Recorded `Sec-Fetch-Site` | Observations | Interpretation |
|---|---:|---|
| `none` | 444 | The client reports navigation without a responsible website, such as address-bar or bookmark use. App handoffs can also produce this kind of request. It does not prove someone typed the URL. |
| `cross-site` | 170 | The client reports a different-site context, but we retained no usable referring hostname. Header suppression, unusable values, and fabricated requests remain distinguishable causes we cannot allocate historically. |
| `same-origin` | 38 | The client reports navigation within this origin. Our parser deliberately removes internal referring hostnames. The original referring paths cannot be recovered from these D1 rows. |

The categories add to 652. Fetch Metadata is separate request evidence, not an authenticated browser or person. [W3C's Fetch Metadata definition](https://www.w3.org/TR/fetch-metadata/#directly-user-initiated-requests) describes `none`, including bookmarks and address-bar input. [RFC 9110 §10.1.3](https://www.rfc-editor.org/rfc/rfc9110.html#section-10.1.3) permits an absent referrer for such sources. Checked September 9 UTC.

This group is not dominated by one repeating daily identifier: 535 of its 576 daily identifiers appear once, and the largest has 13 observations. Requests span 308 recorded ASNs and 66 countries, with 402 desktop, 247 mobile, and 3 tablet classifications. That rules out one unchanged daily identifier explaining most of this count; it does not rule out distributed automation or establish distinct people. The [machine-readable results](referrer-measurements.json) preserve the histogram and aggregates.

## What worked and what needs changing

The server report reconciles. Its Browser population contains only HTML observations in this selection, and 1,613 of 1,616 carry request-sourced ASN provenance; the three older rows without it remain visible. The separate browser-script capture recorded 553 page loads on September 7–8, while this server source records 1,610 Browser observations on those dates. Both show launch activity. Their collection rules and sampling differ, so this is not a matched-event accuracy test.

The [current parser](../../../../analytics/src/referrals.ts) returns null for an absent header, a rejected URL or scheme, and the site's own hostname. The report then labels every null value No referrer. This is an implementation and naming decision, not a requirement imposed by privacy or HTTP.

The [current Referrer Policy specification](https://w3c.github.io/webappsec-referrer-policy/) allows a source page or link to omit the header entirely. Its default normally retains the source origin between HTTPS sites, so ordinary path trimming alone does not explain a missing hostname. We cannot recover an external source the client did not transmit by collecting more TLS or location detail. Checked September 9 UTC.

## The private folder and committed method

The original D1 response is in the author's private `analytics-evidence/2026-09-09-article-024-hn/referrer-analysis-20260909T011531Z/` archive. It contains finer combinations of request evidence and unreviewed referring/signer names. No raw IPs, raw User-Agents, addresses, or daily client identifiers were exported. The query aggregates identifiers inside D1.

The initial `analyze.ts` was a private scratch utility. Goga challenged keeping the method outside the repository. The maintained method is now [analyze-referrer-evidence.ts](../../../scripts/analyze-referrer-evidence.ts), its [tests](../../../test/analyze-referrer-evidence.test.ts), and the fixed SQL above. It validates the capture, loads the archived policy with its commitment, reconciles counts, and publishes only selected aggregates. Private originals remain outside Git; capture and query hashes are in the public JSON. Neither those hashes nor the code make a private capture independently source-authenticated.

Reproduce offline from the repository root, substituting the private capture path and a new output path:

```bash
pnpm -C packages/blog exec tsx scripts/analyze-referrer-evidence.ts \
  --input /absolute/path/to/d1-referrer-groups.json \
  --query drafts/research/article-024-hacker-news/referrer-analysis.sql \
  --policy 2026-09-06.2 \
  --output /absolute/path/to/new-referrer-report.json
```

The production investigation used **one SELECT, 44,831 metered reads, zero writes**. Local D1 fixtures verified owner/time exclusions and repeat-count reconciliation before that query. The offline analyzer's tests and strict typecheck pass. No repeated production report or broad database export was needed.

Goga approved preserving referral categories and recognized public internal paths, then asked for authoritative funnel prior art. That next implementation is tracked in [the transitions and funnel design](06-transitions-and-funnels.md); this capture remains the before-change evidence.
