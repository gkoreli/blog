# @gkoreli/analytics

Edge-observed, cookieless page analytics for gkoreli.com, running in a Cloudflare Worker with D1. This README describes the repository implementation and its known limitations. The article [How I Classify Browser and Bot Requests Without JavaScript](https://gkoreli.com/how-i-separate-readers-from-bots-without-javascript) explains the measured results, and the decision records are ADR-0016 through ADR-0016.4 in `docs/adr/`. Deployment and migration activation must be checked separately from repository code.

Zero runtime dependencies. MIT.

## What a row is

One observation is scheduled per eligible successful, non-prefetch `GET` that served a page as HTML or as the page's negotiated Markdown twin (`eligibility.ts`). The dashboard, assets, API routes, feeds, redirects, errors, and direct requests to `/<slug>.md` do not count. Scheduling with `waitUntil` is not a guarantee that a database write succeeds. Rows retain selected evidence and derived values alongside a classification:

| Column | Evidence |
|---|---|
| `asn`, `as_org` | Autonomous system of the client IP, from Cloudflare's request metadata |
| `sec_fetch_mode`, `sec_fetch_dest`, `sec_fetch_site`, `sec_fetch_user` | Fetch Metadata request headers, NULL when absent |
| `accepts_html`, `has_accept_language` | HTML acceptance for UTF-8 HTML using media-range quality and specificity; whether a nonempty `Accept-Language` is present |
| `agent_name`, `traffic_class` | Named User-Agent rule match (`classify.ts`) and its class |
| `signature_agent`, `signature_status` | Web Bot Auth: the verified signer origin, or `unverified` with the failure reason in `reader_reason` |
| `representation` | `html` or `markdown`, the representation served |
| `reader_kind`, `reader_reason` | One kind from the closed set below and one reason, assigned at ingestion (`readerkind.ts`) |
| `asn_source` | Migration 0007 assigned `request` or `zone-sample` to applicable existing rows. New writes record `request` when an ASN is supplied, otherwise NULL |
| `daily_client_id` | HMAC over site, UTC date, IP, and User-Agent; raw IPs and full UAs are not stored in D1 page observations |

Cloudflare Worker logs/traces, client-error collection, and RUM are separate operational collections. The D1 field list is not a description of all telemetry retained by the site or Cloudflare. A daily identifier is not a person, visit, or cross-day identity.

## The reader kinds

Twelve kinds, one per row, derived from the available request evidence (`contracts.ts`, `READER_KINDS`). The public stats page groups them into four disjoint filters that add up to All (`READER_GROUPS`). These are deterministic rule outcomes, not authenticated statements of human activity. The current AI agents group conflates verified signatures with assistant roles; grouping/wording repair is pending in TASK-0119. A signed crawler remains a crawler by documented role even when the current group puts it under AI agents.

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

The implemented navigation predicate requires `Sec-Fetch-Mode: navigate`, `Sec-Fetch-Dest: document`, `accepts_html = 1`, and `has_accept_language = 1`. `Sec-Fetch-Site` is recorded but not restricted; `Sec-Fetch-User` is not required. Safari's compatibility evidence is discussed in research artifact 09.

**Accept repair, deployed September 6:** `accept.ts` replaces substring matching with media-range quality and specificity for `text/html; charset=utf-8`, following [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#section-12.5.1). Explicit zero-quality HTML overrides a wider positive wildcard; `text/*` accepts HTML. Missing Accept stays null evidence. Invalid weights provide no positive acceptance evidence, and parameters must match the representation. The repair was merged and deployed on September 6; see the release verification linked below. A twelve-case local ingestion experiment changed seven incorrect results to their expected values; historical effect cannot be calculated from stored booleans alone.

## The two rules that matter most

**Hosting network determines a separate classification.** `networks.ts` contains the reviewed hosting-ASN list and verification dates. It deliberately excludes AS15169 Google, AS13335 Cloudflare, AS36183 and AS20940 Akamai, AS54113 Fastly, and several consumer-VPN networks. Those networks can carry legitimate browsing as well as automation. ADR-0016.4 also excludes AS6939 Hurricane Electric, handles AS7941 Internet Archive through the archiver rule, and leaves AS46997 Black Mesa unclassified pending evidence. Research artifact 04 records the public-list review. The analytics tests check that migrations 0006 and 0008 together match the current hosting list. Network membership does not establish whether a person directed a cloud browser.

**Fetch Metadata absence is checked against a claimed version.** `claimsFetchMetadataBrowser()` reads Chromium 76+, Firefox 90+, and Safari/iOS 16.4+ from the UA. Missing `Sec-Fetch-Mode` under those claims produces `http-client`; older or unreadable claims produce `legacy-browser`. Research artifact 09 records the browser support sources, including Android WebView and Safari observations. Support establishes an expected capability, not a measured zero false-positive rate for every request. Although the current public group puts `legacy-browser` under Automation, the rule itself does not prove automation.

Browsers can include automation and exclude legitimate access. It is not an established lower or upper bound on readership. September 4–5's 372 browser-UA observations becoming 95 Browsers HTML observations measures classification effect; comparison with 14 non-bot RUM loads remains unresolved. No universal ratio threshold validates accuracy.

## History keeps its provenance

Method changes are dated boundaries, never deletions.

- Rows before 2026-08-26 came from a browser JavaScript beacon (`observation_source = 'beacon'`); they are `browser` / `beacon-script-ran`, because the site's script ran in a page.
- Pre-evidence edge browser-UA rows retain `user-agent-only` provenance unless reconstructed network evidence changes their kind. Migration 0007 reconstructed an ASN for 1,429 of 1,962 pre-evidence observations using the retained zone sample, matched by UTC hour/path/country/device, with assignment only when sampled candidates agreed. It marks them `asn_source = 'zone-sample'`; applicable browser-UA rows on hosting networks became `cloud-browser`. The method is correlation, not a shared-ID request join.
- Migration 0007 marked applicable existing request-derived ASNs as `request`, but the original subsequent ingestion omitted `asn_source`. All 1,797 observations in the inspected September 3 05:05:22–September 6 01:29:53 UTC cohort had NULL. The local future-write repair now records a request source when an ASN is present. Subsequent production writes have been checked; historical reconstruction remains open; do not silently infer a provenance marker for every missing row.

## Web Bot Auth

`webbotauth.ts` implements an Ed25519 HTTP-message-signature verifier using `crypto.subtle`, with supported `Signature-Agent` forms, covered-component checks, creation/expiry checks, and directory/key caching. The source and fixtures define the supported profile; this README does not claim complete conformance to every provision of a particular evolving Web Bot Auth draft. Verification runs in `waitUntil` after the response, and handled verification failures are recorded as `unverified` with a reason.

Signature verification supports the signer association under those checks. It does not establish a human trigger, benign purpose, reading, or citation. Routine ingestion applies named-UA rules and signatures; vendor-IP checks performed in the separate probe study are not implemented in routine classification. The saved cohort contains nine stored verified outcomes (five Ahrefs, two Exa, two deliberate DuckAssist tests), not nine independently re-verified historical messages.

## Public API

### Referral-abuse defense

[ADR-0016.5](../../docs/adr/0016.5-referral-abuse-defense.md) defines a separate, reversible reporting policy in `src/referrals.ts`. Only exact reviewed hostnames appear in `byReferrer`; other supplied names are counted in `otherReferrerViews`. A display approval does not authenticate a referral. New unreviewed domains cannot advertise through public JSON or the dashboard.

Reviewed abuse rules exclude matching observations from every public metric and traffic group, including All. `referralPolicy` reports the active version and `excludedViews` for the same selection, after owner exclusion. The original hostname, kind, reason, and signature remain in D1. Rules apply to historical and new rows at read time, with no migration or deletion. Bump the policy version and record evidence whenever either catalogue changes. The current rule covers one investigated domain and its subdomains; it does not claim to detect all automated traffic.

Private review, from the repository root (the output contains unreviewed names and must not be published automatically):

```bash
umask 077
referral_review_dir=$(mktemp -d /tmp/blog-referral-review.XXXXXX)
pnpm exec wrangler d1 execute blog-analytics --remote \
  --command "$(cat packages/analytics/scripts/referral-review.sql)" --json \
  > "$referral_review_dir/results.json"
```

The two SELECTs retain the current UTC day and preceding 29 days, owner exclusions, daily host/kind counts, and host/path distributions. Inspect command success and D1 write counts before interpreting output. Save the capture time and policy version with any reviewed evidence. A new case ends in a display approval, an evidence-backed exclusion, or no change. Neither a strange name nor the content of its website proves automation. See [FLDR-0009](../../docs/folders/FLDR-0009.md).

### Queries

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

The [controlled local experiment](../blog/drafts/research/edge-vs-rum/03-local-experiment.md) records both runs and compiled-source hashes. These parser/provenance changes were merged to `main` in PR #15; they add no visitor fields and do not change signer verification, client-role grouping, content negotiation, or historical rows. Browser/beacon trials and the TASK-0119 grouping repair remain open.

[Release verification](../blog/drafts/research/edge-vs-rum/04-release-verification.md) records the activated Worker version and a read-only check of subsequent production provenance.
