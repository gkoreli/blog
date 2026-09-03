# Fetch Metadata absence: what prior art already settles

Fable, 2026-09-03 04:40 UTC, primary sources checked directly. Written after Goga asked why the header-absence rule needed our own measurement when other people must have faced this.

## The question

Can "browser User-Agent, no `Sec-Fetch-Mode`" be a verdict (this is not the browser it claims to be), or only a weight?

## What is already known

1. Support is near-universal and dated. caniuse `mdn-http_headers_sec-fetch-mode`: 95.72% of global usage supports it. First versions: Chrome 76 (2019-07), Firefox 90 (2021-07), Safari and iOS Safari 16.4 (2023-03), Samsung Internet 12.0, Opera 63. Missing: Internet Explorer, browsers older than those versions, Opera Mini unknown. https://caniuse.com/mdn-http_headers_sec-fetch-mode
2. Android WebView sends it, since 2019. Privacy Browser issue #495 (2019-09-09/10): "Sec-Fetch headers are sent on all requests as of Chromium 76, and this is also the case for the webview"; maintainer: "Google has recently added Sec-Fetch-Mode, Sec-Fetch-User, and Sec-Fetch-Site to their list of standard headers in WebView." The Chromium intent-to-ship lists all six Blink platforms including Android WebView. https://redmine.stoutner.com/issues/495 https://groups.google.com/a/chromium.org/g/blink-dev/c/yQgJlq5PEOQ/m/erexYRWHBgAJ
3. iOS WebView sends `Sec-Fetch-Mode`, measured in production. mdn/browser-compat-data issue #27928 (2025-09-18, closed by PR #28025): a 24-hour log analysis across multiple large sites, verified on BrowserStack, found `Sec-Fetch-Mode` from Safari desktop, iOS, and iOS WebView in counts that "scale in the millions", while `Sec-Fetch-User` was "in the hundreds" and attributed to faked User-Agents. Conclusion: Safari never sent `Sec-Fetch-User`; the other Fetch Metadata headers are present on all three Safari platforms. https://github.com/mdn/browser-compat-data/issues/27928
4. The "WebViews omit it" caveat traces to one 2025 vendor blog post (Menin, sicuranext) with no data, and to defensive projects (Anubis, caddy-waf, BunkerWeb, bot-signal) whose comments say they hedge because they lack data, not because they measured false positives (artifact 04 part C).
5. Practitioner observation matches: WebmasterWorld threads on `Sec-Fetch-*` report that a User-Agent claiming a recent Chrome without `Sec-Fetch-Mode` is a fake, since real "Chrome/8x passes Sec-Fetch-Mode". https://www.webmasterworld.com/search_engine_spiders/5026762.htm

## What this settles

- For a User-Agent that claims Chrome or any Chromium browser >= 76, Firefox >= 90, or Safari/iOS >= 16.4, the absence of `Sec-Fetch-Mode` on a document request is a verdict: the client is not the browser it names. The WebView exception does not exist for those versions on either platform.
- For a User-Agent that claims an older engine, or one whose engine version cannot be read, absence is expected and proves nothing. Those rows are a separate kind (`legacy-browser`), not automation and not confirmed readers. Their share is bounded by the 4.28% of global usage that caniuse reports as unsupported, and on this site it will be smaller because the audience skews to current browsers.
- `Sec-Fetch-User` must never be required (Safari), which the partition already respects.
- No further site-specific measurement is needed before the rule ships. TASK-0104's calibration against Cloudflare Web Analytics remains the check that the whole partition is honest.

## What remains site-specific

Only the calibration: whether the count of navigation-shaped rows outside hosting networks tracks Cloudflare Web Analytics visits. That is TASK-0104, not a precondition for the rule.

## Site measurement from Workers Logs, 72 hours to 2026-09-03 03:55 UTC

Goga asked whether raw logs already existed. They do: Workers Logs (`observability.logs.invocation_logs` in `wrangler.jsonc`) keep every invocation with full request headers, User-Agent, ASN, and client IP for three days on the Free plan. The wrangler OAuth token cannot query them (`Authentication error [code: 10000]` on the telemetry endpoint), but the dashboard's own session can, so the query below ran from the dashboard page (`/api/v4/accounts/<id>/workers/observability/telemetry/query`, `view: "events"`, 3-hour windows, 1,000-event limit each; 3,372 of 3,399 invocations captured). Field keys are `$workers.event.request.headers.*` and `$workers.event.request.cf.asn`. Group-by queries return only the top 10 groups, so aggregation was done on the raw events. Only aggregates left the page; no IP or full User-Agent was recorded here.

Population: 844 successful GETs of page paths (no file extension, not `/api/`).

| Bucket | Rows | What it is |
|---|---:|---|
| Navigation-shaped, browser UA, outside hosting networks | 112 | The reader estimate: Chrome 152 (43), 142 (21), 144 (12), 145 (8), 147 (7), Safari 26.2 (4), others |
| Navigation-shaped on hosting networks | 430 | 374 are one "Chrome Mobile 114" client on AS396982 Google Cloud; 23 are Chrome 145/146 on AS14618 AWS; the rest AWS, OVH, DigitalOcean |
| Declared bots (UA says so) | 126 | 88 on hosting networks |
| Client libraries (curl, python, Go, node, HeadlessChrome) | 26 | |
| No Fetch Metadata, hosting network, browser UA | 64 | "iOS 13.2 Safari" on AS132203 and AS45090 Tencent Cloud, Accept-Language present |
| No Fetch Metadata, outside hosting networks, browser UA | 49 | 14 "Chrome 78" across AS212238, AS60068 (Datacamp), AS210558, AS9009 (M247), all with Accept-Language; the rest single hits of Chrome 100–152; 3 "iOS 17.3 / 17.5 / 26.6" hits |
| External referrals (t.co 3, google.com 8, chatgpt.com 1) | 12 | Every one carried Fetch Metadata |

What this adds to the prior art:

1. Hosting ASN, not header absence, is the rule that catches the bulk inflation. The single largest cluster (374 of 844) is navigation-shaped with Accept-Language and would pass every header check; only the network convicts it. The classifier now checks the hosting network before request shape (`readerkind.ts`, backfill 0006).
2. Header absence outside hosting networks is small (49 rows, under 6%) and is dominated by a "Chrome 78" claim from four VPN and hosting ASNs that are not on the list. Chrome 78 shipped Fetch Metadata, so the version-gated verdict is correct for it.
3. All 12 referred visits carried Fetch Metadata. Consistent with the prior art; too few to prove anything alone.
4. Three hits claim iOS 17.3, 17.5, and 26.6 without Fetch Metadata from residential-looking ASNs. Prior art says those versions send it, so these are either spoofed or a rare embedded client. They are three rows; the rule labels them `http-client`, and they are the case to watch in the calibration.
5. Reader estimate for the window: about 112 page views over 72 hours, roughly 13% of successful page GETs. The stats page will say this once the labels ship.

ASNs seen carrying automation that were absent from `networks.ts`, verified with Team Cymru whois on 2026-09-03: 9009 M247 Europe, 60068 Datacamp (CDN77), 212238 Datacamp (CDNEXT), 210558 1337 Services GmbH, 30058 FDCservers.net. Decision: add only 30058, a dedicated-server host. The other four sell consumer VPN exits, so the network alone would convict a person on a VPN; the MRC standard excludes "routing artifacts of legitimate users" from data-center filtration for exactly this case, and the automation seen from them (the "Chrome 78" claims) is already convicted by the Fetch Metadata rule. The reasoning is in the `networks.ts` header comment. The analytics tests now assert that migration 0006 inlines the same list as `networks.ts`.

## History reconstruction: network evidence for 2026-08-27 to 2026-09-03 (2026-09-03 05:30 UTC)

Goga, verbatim: "│ Unchecked              │ unchecked (rows before 2026-09-03 with no evidence)  why dont we have data for this, i believe we have correct provenance even for historical data" The pre-evidence edge rows (2026-08-26 15:26 to 2026-09-03 01:35 UTC, 1,962 rows) had the User-Agent verdict, path, referrer, country, and device, but no network or header evidence. Two raw sources exist at Cloudflare:

- Workers Logs: three days, full headers. Already gone for most of the window.
- Zone analytics `httpRequestsAdaptiveGroups` via GraphQL: eight days ("cannot request data older than 1w1d"). On the Free zone the fields `clientAsn`, `clientRefererHost`, `botScore`, and `ja4` are refused, but `clientIP`, `clientRequestPath`, `userAgent`, `clientCountryName`, `datetimeHour`, and `clientDeviceType` are served. The wrangler OAuth token (`zone:read`) is accepted by GraphQL; only the Workers observability endpoint refuses it.

Method (`tools/pull_zone_html_groups.py` in this folder, then Team Cymru DNS for IP to ASN):

1. Pull HTML, status 200, GET, eyeball requests per day grouped by hour, path, country, device, IP, User-Agent. 2026-08-27 to 2026-09-03: 1,395 groups, 1,884 requests, 784 distinct IPs, sample interval mostly 1 (max 23). 2026-08-26 was already past retention.
2. Resolve every IP to an ASN through `origin.asn.cymru.com` / `origin6.asn.cymru.com` TXT records (784 of 784 resolved). IPs were used transiently and not stored; the migration carries only ASN and AS name.
3. Match each D1 row to the zone group with the same UTC hour, path, country, and device. A row receives an ASN only when every sampled request in that group came from one ASN.

| Outcome | Rows |
|---|---:|
| Unambiguous ASN assigned | 1,429 |
| Ambiguous group (several ASNs) | 191 |
| No sampled group (169 of them are 2026-08-26) | 342 |

Of the 1,039 browser-class rows that received an ASN, 714 sit on hosting networks: Google Cloud 377, OVH 126, Tencent 133, DigitalOcean 21, AWS 15, Alibaba 13, Oracle 5, and others. By day, browser-class rows on hosting networks versus elsewhere: 08-27 28/54, 08-28 33/30, 08-29 18/36, 08-30 148/99, 08-31 346/36, 09-01 46/30, 09-02 93/37. The 2026-08-31 spike Goga did not believe was 346 hosting-network hits against 36 others.

Shipped as migration 0007: a nullable `asn_source` column (`request` for rows whose network came from the request, `zone-sample` for reconstructed rows), 197 grouped UPDATE statements for the 1,429 rows, and a reader-kind rewrite to `cloud-browser` for reconstructed rows on hosting networks. The Browsers partition now excludes pre-evidence rows whose reconstructed network is a hosting provider. Header evidence for this window cannot be reconstructed and stays NULL.

Two more hosters verified with Team Cymru and added to `networks.ts` from this sample: AS211590 Bucklog SARL (187 requests in the window) and AS18779 EGIHosting.

Naming consequence: the `unchecked` reader kind is gone. Beacon rows are `browser` with reason `beacon-script-ran` (the site's script executed in a page, stronger evidence than any header). Pre-evidence edge rows are `browser` with reason `user-agent-only`, or `cloud-browser` when the reconstructed network is a hosting provider. Every row now states the evidence it actually has.
