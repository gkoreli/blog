# @gkoreli/analytics

Edge-observed, cookieless page analytics for gkoreli.com, running in a Cloudflare Worker with D1. This README is the reference version of the classification rules. The article [How I Separate Readers from Bots on a Static Blog Without JavaScript](https://gkoreli.com/how-i-separate-readers-from-bots-without-javascript) explains them for a general reader, and the decision records are ADR-0016 through ADR-0016.4 in `docs/adr/`.

Zero runtime dependencies. MIT.

## What a row is

One row per successful, non-prefetch `GET` that served a page as HTML or as the page's negotiated Markdown twin (`eligibility.ts`). Assets, API routes, feeds, redirects, errors, and direct requests to `/<slug>.md` do not count. Each row stores the evidence the request carried, never only a verdict:

| Column | Evidence |
|---|---|
| `asn`, `as_org` | Autonomous system of the client IP, from Cloudflare's request metadata |
| `sec_fetch_mode`, `sec_fetch_dest`, `sec_fetch_site`, `sec_fetch_user` | Fetch Metadata request headers, NULL when absent |
| `accepts_html`, `has_accept_language` | Whether `Accept` admits HTML; whether `Accept-Language` is present |
| `agent_name`, `traffic_class` | Named User-Agent rule match (`classify.ts`) and its class |
| `signature_agent`, `signature_status` | Web Bot Auth: the verified signer origin, or `unverified` with the failure reason in `reader_reason` |
| `representation` | `html` or `markdown`, the representation served |
| `reader_kind`, `reader_reason` | One kind from the closed set below and one reason, assigned at ingestion (`readerkind.ts`) |
| `asn_source` | `request`, or `zone-sample` for rows whose network was reconstructed from zone analytics (migration 0007) |
| `daily_client_id` | HMAC over site, UTC date, IP, and User-Agent; IPs are never stored |

## The reader kinds

Twelve kinds, one per row, each a fact about the request (`contracts.ts`, `READER_KINDS`). The public stats page groups them into four disjoint filters that add up to All (`READER_GROUPS`).

| Group | Kind | Condition | Reason recorded |
|---|---|---|---|
| AI agents | `signed-agent` | Web Bot Auth signature verified against the signer's `/.well-known/http-message-signatures-directory` | the signer origin |
| AI agents | `ai-assistant` | named on-demand fetcher: ChatGPT-User, Claude-User, Perplexity-User, Meta-ExternalFetcher, MistralAI-User, DuckAssistBot, Amzn-User, Google-Agent, Google-GeminiNotebook | the agent name |
| Crawlers | `ai-search` | OAI-SearchBot, Claude-SearchBot, PerplexityBot, MistralAI-Index, Amzn-SearchBot, Meta-WebIndexer, Applebot | the agent name |
| Crawlers | `ai-crawler` | GPTBot, ClaudeBot, MistralAI-Training, Meta-ExternalAgent, Amazonbot, CCBot, Google-CloudVertexBot, Bytespider, PetalBot, Cohere-AI | the agent name |
| Crawlers | `search-crawler` | Googlebot, Bingbot, DuckDuckBot, YandexBot, Baiduspider | the agent name |
| Crawlers | `preview-or-feed` | FacebookBot, LinkedInBot, Slackbot; or an unnamed request from an archiver network | the agent name or `archiver-asn:<asn>` |
| Automation | `headless-browser` | `HeadlessChrome/`, `Cypress/`, `Lightpanda/` in the User-Agent | the token |
| Automation | `other-bot` | any other bot-class match, including generic tokens | rule name or `generic-bot` |
| Automation | `cloud-browser` | browser User-Agent from a network in `networks.ts`, checked before request shape | `hosting-asn:<asn>` |
| Automation | `http-client` | browser User-Agent whose request is not navigation-shaped, or a modern engine claim with no `Sec-Fetch-Mode` | `not-navigation-shaped` or `no-fetch-metadata` |
| Automation | `legacy-browser` | no `Sec-Fetch-Mode` and a User-Agent that predates Fetch Metadata or cannot be versioned | `pre-fetch-metadata-ua` |
| Browsers | `browser` | navigation-shaped request from outside hosting networks; or a beacon-era row; or a pre-evidence edge row | `navigation-shaped`, `beacon-script-ran`, `user-agent-only` |

Order of evaluation: verified signature, named agent rules, headless tokens, archiver network for unnamed requests, bot class, beacon and pre-evidence cases, hosting network, then request shape. The hosting network runs before shape because, in a three-day sample of the site's raw logs, the largest single cluster (374 of 844 page loads) was navigation-shaped traffic from Google Cloud that passed every header check.

"Navigation-shaped" means `Sec-Fetch-Mode: navigate`, `Sec-Fetch-Dest: document`, an `Accept` that admits HTML, and an `Accept-Language`. `Sec-Fetch-User` is never required: Safari has never sent it.

## The two rules that matter most

**Hosting network is a verdict on its own.** `networks.ts` lists 28 hosting providers, each verified against Team Cymru whois on the date recorded. It deliberately excludes AS15169 Google, AS13335 Cloudflare, AS36183 and AS20940 Akamai, and AS54113 Fastly, which carry iCloud Private Relay, Cloudflare WARP, and consumer services; and it excludes networks that sell consumer VPN exits (AS9009 M247, AS60068 and AS212238 Datacamp, AS210558 1337 Services), because the network alone would convict a person on a VPN. ADR-0016.4 also refuses AS6939 Hurricane Electric because people use its free IPv6 tunnel broker, handles AS7941 Internet Archive through the archiver rule, and leaves AS46997 Black Mesa unclassified because one request did not establish what the network carries. Public "datacenter" lists were checked and rejected for containing those networks (research artifact 04). The analytics tests assert that migrations 0006 and 0008 together inline exactly the current list.

**Fetch Metadata absence is a verdict only against a version that sends it.** `claimsFetchMetadataBrowser()` in `readerkind.ts` reads the engine version from the User-Agent: Chromium 76 and later (2019, including Android WebView), Firefox 90 and later (2021), WebKit 16.4 and later (2023, including WKWebView). Sources: caniuse (95.72% global support), Chromium's intent to ship, Privacy Browser issue 495 confirming WebView, and mdn/browser-compat-data issue 27928, a 2025 production measurement finding `Sec-Fetch-Mode` from iOS WebView in the millions. Older or unreadable claims become `legacy-browser`, neither readers nor automation. Research artifact 09 holds the reasoning.

## History keeps its provenance

Method changes are dated boundaries, never deletions.

- Rows before 2026-08-26 came from a browser JavaScript beacon (`observation_source = 'beacon'`); they are `browser` / `beacon-script-ran`, because the site's script ran in a page.
- Rows from 2026-08-26 to 2026-09-03 01:35 UTC predate the evidence columns; they are `browser` / `user-agent-only`. Migration 0007 reconstructed the network for 1,429 of those 1,962 rows from Cloudflare zone analytics (eight-day retention; client IP served on the Free zone, resolved to ASN through Team Cymru DNS, assigned only when every sampled request in the row's hour/path/country/device group came from one network) and marks them `asn_source = 'zone-sample'`. Rows on hosting networks became `cloud-browser`.
- Rows since then carry request evidence and `asn_source = 'request'`.

## Web Bot Auth

`webbotauth.ts` verifies `Signature`, `Signature-Input`, and `Signature-Agent` per RFC 9421 and draft-ietf-webbotauth-httpsig-protocol-00 with Ed25519 through `crypto.subtle`: tag `web-bot-auth`, `created`/`expires` with 60 seconds of skew, required covered components, key lookup keyed on the (directory URL, key id) pair, one-hour cache, HTTPS-only signer origins. It never throws; failures are stored as `unverified` with a reason. Verification runs in `waitUntil` after the response.

## Public API

`GET /api/stats?range=7d|30d|90d|all&traffic=browser|agents|crawlers|automation|all&path=/slug&agent=<rule name>&kind=<reader kind>`. `path`, `agent`, and `kind` scope every panel; combinations whose kind lies outside the chosen group return 400. The response carries totals, per-path, per-country, per-referrer, per-device, per-agent, and per-kind-and-reason aggregates over exact UTC windows. Every query excludes rows marked by `is_owner` at ingestion and daily client IDs recorded in `owner_clients`.

`POST /api/owner` records the authenticated caller's daily client ID in `owner_clients`. It uses `Authorization: Bearer <ADMIN_SECRET>` and the same site, UTC date, IP, User-Agent, and HMAC secret as ingestion. A mark covers one browser, address, and UTC day; a changed address needs another call.

## Development

```
pnpm -C packages/analytics test      # node:sqlite harness, migrations and classifier contracts
pnpm typecheck
npx wrangler d1 migrations apply blog-analytics --remote   # migrations live in ./migrations
```

## Sources

- Media Rating Council, Invalid Traffic Detection and Filtration Standards Addendum (2020 update): data-center traffic and non-browser User-Agent headers as General Invalid Traffic; AWS, Google, Microsoft as the floor.
- Cloudflare bot vocabulary (bot score bands, Verified Bots, Signed Agents) and the Web Bot Auth working group.
- Vendor crawler documentation for each named rule (links in the header comment of `classify.ts`).
- Open-source classifier reading with line references, hosting-list survey, Fetch Metadata prior art, and the log measurements: `packages/blog/drafts/research/readers-vs-bots/`, artifacts 03, 04, and 09.
