# Evidence ledger — night of 2026-09-02

All queries ran against production D1 `blog-analytics` with `wrangler d1 execute --remote`. Times are UTC. "Browser class" means `traffic_class = 'browser' AND is_owner = 0` as stored, before any evidence rule. Legacy beacon rows are included wherever the window reaches them.

## 1. The number that was not believed (read 2026-09-02 ~23:50 UTC)

Query: `SELECT traffic_class, is_owner, COUNT(*) views, COUNT(DISTINCT daily_client_id) clients FROM page_observations WHERE observed_at >= date('now') GROUP BY 1,2`

| Class (today, UTC) | Views | Daily clients |
|---|---:|---:|
| browser | 164 | 113 |
| bot | 41 | 26 |
| ai | 28 | 15 |

## 2. Shape of the 113 clients

Views per client: `SELECT views_per_client, COUNT(*) clients FROM (SELECT daily_client_id, COUNT(*) views_per_client FROM page_observations WHERE observed_at >= date('now') AND traffic_class='browser' AND is_owner=0 GROUP BY 1) GROUP BY 1`

| Views per client | Clients |
|---:|---:|
| 1 | 100 |
| 2 | 9 |
| 3 | 2 |
| 9 | 1 |
| 31 | 1 |

Referrers: `SELECT COALESCE(referrer_host,'(none)'), COUNT(*), COUNT(DISTINCT daily_client_id) ... GROUP BY 1`

| Referrer | Views | Clients |
|---|---:|---:|
| (none) | 156 | 107 |
| google.com | 4 | 4 |
| t.co | 3 | 2 |
| chatgpt.com | 1 | 1 |

Countries: US 104 views / 60 clients; next largest FR, DE, BR at 5 clients each. Devices: desktop 99 views / 80 clients, mobile 65 / 33.

The 31-view client: one `mobile` device-class client from the US fetched 31 distinct pages at `2026-09-02 05:03:50`, all with no referrer. Query: `SELECT path, referrer_host, country, device_type, observed_at FROM page_observations WHERE observed_at >= date('now') AND daily_client_id IN (SELECT daily_client_id ... HAVING COUNT(*) >= 9) ORDER BY observed_at`.

## 3. The step change is the collection-method change

Query: `SELECT date(observed_at) d, COUNT(*) views, COUNT(DISTINCT daily_client_id) clients FROM page_observations WHERE observed_at >= date('now','-14 days') AND traffic_class='browser' AND is_owner=0 GROUP BY 1`

| Date | Views | Clients |
|---|---:|---:|
| 2026-08-19 | 5 | 4 |
| 2026-08-20 | 2 | 2 |
| 2026-08-21 | 39 | 7 |
| 2026-08-22 | 15 | 10 |
| 2026-08-23 | 32 | 12 |
| 2026-08-24 | 4 | 3 |
| 2026-08-25 | 5 | 5 |
| 2026-08-26 (edge cutover) | 116 | 54 |
| 2026-08-27 | 100 | 75 |
| 2026-08-28 | 67 | 66 |
| 2026-08-29 | 73 | 59 |
| 2026-08-30 | 317 | 124 |
| 2026-08-31 | 402 | 88 |
| 2026-09-01 | 85 | 52 |
| 2026-09-02 | 164 | 113 |

Referrer presence by era (browser class, non-owner, from 2026-08-01): beacon-era rows 82% without referrer; edge-era rows 97% without referrer. Clients with any referrer per day, Aug 26 to Sep 2: 6, 6, 2, 1, 4, 2, 1, 7.

## 4. Independent check: Cloudflare Web Analytics (read from the dashboard 2026-09-03 ~00:10 UTC)

Script-based counter, same site, "Exclude bots = Yes", last 7 days as the dashboard defines them (PDT-anchored).

| Source | Page views | Clients or visits |
|---|---:|---:|
| First-party D1, browser class, 7 UTC days ending 2026-09-02 | 1,209 | 578 daily clients |
| Cloudflare Web Analytics, last 7 days | 113 | 52 visits |

Last 24 hours on the same dashboard: 33 page views, 10 visits. Note the windows are not perfectly aligned (UTC days vs a rolling PDT window) and Cloudflare's own `/stats` visits by the author are included in its count.

## 5. AI agents, 30 days to 2026-09-02

By agent: `SELECT agent_name, COUNT(*), COUNT(DISTINCT path), COUNT(DISTINCT date(observed_at)) ... WHERE traffic_class='ai'`

| Agent | Views | Distinct paths | Active days |
|---|---:|---:|---:|
| PerplexityBot | 51 | 31 | 5 |
| Amazonbot | 37 | 36 | 8 |
| ChatGPT-User | 33 | 8 | 8 |
| GPTBot | 21 | 21 | 1 |
| Bytespider | 15 | 8 | 5 |
| Meta-ExternalAgent | 11 | 9 | 5 |
| ClaudeBot | 10 | 10 | 1 |

Reading: views roughly equal to distinct paths is a crawl. ChatGPT-User is the exception: 33 views on 8 paths (llms.txt post, first-party analytics post, OSS Radar 04 and 05, bring-your-own-AI-agent, topologies of thoughts, the homepage). chatgpt.com as a browser referrer in the same 30 days: 4 views, 3 of them to Topologies of Thoughts.

## 6. First production rows with evidence (deploy 2026-09-03 01:35 UTC)

Author's own requests from AS62887 (WhiteSky Communications), owner marking did not match:

| Path | Fetch mode / dest | Sec-Fetch-User | Accept has HTML | Accept-Language present | Landed in |
|---|---|---|---|---|---|
| `/` (Chrome) | navigate / document | 1 | 1 | 1 | Browsers |
| `/design-language` (Chrome) | navigate / document | null | 1 | 1 | Browsers |
| `/about` (curl, Chrome UA) | null / null | null | 1 | 0 | fails the check |

Live 7-day partition at deploy time (first predicate, later amended): Browsers 3, Browser-like 1,116, Bots 350, AI UAs 134, All 1,603. Sum holds.

By 01:47 UTC no non-author rows had arrived in the evidence era; the site had been seeing one hit per 10–20 minutes for the previous three hours. TASK-0101 waits for daytime traffic.

## 7. Migration mechanics (for the article's honesty section)

`wrangler d1 execute --remote --file` failed with `Authentication error [code: 10000]` on the D1 import endpoint despite a `d1 (write)` OAuth scope; the same eight `ALTER TABLE` statements applied through `--command`. Afterwards `migrations_dir` was added to `wrangler.jsonc` and the `d1_migrations` table bootstrapped so that `wrangler d1 migrations list --remote` reports no pending migrations.


## 7. Header absence: settled by prior art, not by this ledger (2026-09-03 04:45 UTC)

Goga asked why the absence rule needed a site measurement when others must have faced it. They had; I had not read them. Artifact 09 records the sources. Summary:

- Fetch Metadata support is 95.72% of global usage (caniuse); Android WebView has sent it since Chromium 76 (2019); a 2025 production log analysis (mdn/browser-compat-data #27928) shows `Sec-Fetch-Mode` from iOS WebView in the millions.
- The "WebViews omit it" premise in section 6 and in TASK-0101 was wrong for current versions. It came from one vendor blog post and from defensive projects that hedged for lack of data.
- Rule shipped in `readerkind.ts`: no `Sec-Fetch-Mode` plus a User-Agent claiming Chromium >= 76, Firefox >= 90, or WebKit >= 16.4 is `http-client` (reason `no-fetch-metadata`); an older or unreadable engine claim is `legacy-browser` (reason `pre-fetch-metadata-ua`). Non-navigation shapes with headers present stay `http-client` (`not-navigation-shaped`).
- The evidence era had 27 non-owner browser-class rows at the time, none referred (11 without Sec-Fetch, 16 with). Too small to use, and no longer needed for the rule. The calibration in TASK-0104 remains the honesty check on the whole partition.

## 8. Raw Workers Logs, 72 hours (2026-09-03 04:00 UTC)

Goga: "dont we already have some raw logs in cloudflare?" We do; Workers Logs keep three days of full request headers. Measured 844 successful page GETs: 112 navigation-shaped reader hits outside hosting networks; 430 navigation-shaped hits on hosting networks (374 from one Google Cloud client claiming Chrome Mobile 114); 64 header-less "iOS 13.2" hits from Tencent Cloud; 49 header-less browser claims outside hosting networks; 12 external referrals, all with Fetch Metadata. Consequence: hosting ASN moves ahead of request shape in the classifier. Full table and method in artifact 09.
