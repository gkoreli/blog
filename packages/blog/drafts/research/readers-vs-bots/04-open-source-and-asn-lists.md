# What the open-source tools actually check, and the hosting-ASN lists

Research worker: Claude opus, cloned repos and read code. Received 2026-09-03 02:05 UTC. Line numbers are from the default branches on that date and will drift.

## Headline

None of the five open-source analytics tools uses ASN, and none uses Fetch Metadata. Four of five are pure User-Agent matching. Only GoatCounter (via `arp242/isbot`) and Plausible's cloud edge use network-level signals at all. No analytics tool combines Fetch Metadata with ASN; the closest prior art is GoatCounter's per-hit reason code.

## Part A: the decision code

### Matomo
- `core/Tracker/VisitExcluded.php`, `isExcluded()` L66, ordered `if (!$excluded)` chain. https://github.com/matomo-org/matomo/blob/5.x-dev/core/Tracker/VisitExcluded.php#L66
- Signals: `isNonHumanBot()` (DeviceDetector on UA + client hints, or `isIpInRange()` which is a hardcoded, stale Googlebot/Bing/Yahoo range list, not a hosting list); site-configured excluded IPs, UAs, URLs; referrer spam (gated); `isPrefetchDetected()` checks only `X-Purpose: preview|instant` and `X-Moz: prefetch`. No `Sec-Purpose`, no `Sec-Fetch-*`, no Accept/Accept-Language, no ASN.
- Bot list: `matomo-org/device-detector` `regexes/bots.yml`, 842 entries, LGPL v3, each with `regex/name/category/url`. Categories include AI Data Scraper 37, AI Assistant 22, AI Search Crawler 19, AI Agent 3. This is a maintained, citable taxonomy for our AI UAs bucket.
- Naming: code `$excluded`, `isNonHumanBot`; UI "Visits", "Unique visitors". Excluded hits are dropped, not bucketed.

### Plausible Community Edition
- `lib/plausible/ingestion/event.ex`, pipeline at L137. https://github.com/plausible/analytics/blob/master/lib/plausible/ingestion/event.ex#L137
- `drop_reason()` type L24–41: `:bot | :spam_referrer | :invalid | :dc_ip | :threat_ip | :site_ip_blocklist | :site_country_blocklist | :site_page_blocklist | :site_hostname_allowlist | :verification_agent | ...`. The cleanest bucket vocabulary of any tool.
- `put_user_agent/2` L262–288: `UAInspector` bot match, plus a special drop when the client name is `"Headless Chrome"`.
- `drop_datacenter_ip/2` L219–227 reads `event.request.ip_classification`, which `lib/plausible/ingestion/request.ex` L389–396 takes from the inbound header `x-plausible-ip-type`. The datacenter classifier is not in the open-source repo; Plausible's own edge injects it. Self-hosters never drop `:dc_ip`.
- No Fetch Metadata, no Accept-Language, no ASN in the repo. UI: "Unique visitors", "Total visits", "Total pageviews".

### GoatCounter and isbot (closest prior art)
- `handlers/count.go` L37 `bot := isbot.Bot(r)`; prefetch never recorded (L39–41); server verdict overrides client-reported `b=` (L94–96). https://github.com/arp242/goatcounter/blob/master/handlers/count.go#L37
- `isbot.Result` values (https://github.com/arp242/isbot `isbot.go` L14–92): `NoBotKnown=0`, `NoBotNoMatch=1`; UA-derived `BotPrefetch=2`, `BotLink=3`, `BotClientLibrary=4`, `BotKnownBot=5`, `BotBoty=6`, `BotShort=7`; IP-range-derived `BotRangeAWS=8`, `BotRangeDigitalOcean=9`, `BotRangeServersCom=10`, `BotRangeGoogleCloud=11`, `BotRangeHetzner=12`, `BotRangeAzure=13`, `BotRangeAlibaba=14`, `BotRangeLinode=15`, `BotRangeOracle=16`, `BotRangeOVH=17`; JS-reported `BotJSPhanton=150`, `BotJSNightmare=151`, `BotJSSelenium=152`, `BotJSWebDriver=153`.
- UA heuristics are crude: short UA, no space or slash, a URL in the UA, 14 client libraries (`curl/`, `python-requests/`, `Go-http-client/`, `okhttp/`, `Java/`, `Wget/`, ...), ~45 known bots, substring `bot|crawler|spider`.
- IP ranges generated from `rezmoss/cloud-provider-ip-addresses` (aws, azure, digitalocean, googlecloud, hetzner, linode, alibaba, oracle, ovhcloud). Prefetch check: `X-Moz`, `X-Purpose`, `Purpose` only.
- Schema: separate `bots` table (`site_id, path, bot integer, user_agent, created_at`); bot hits retained with reason. UI: "Visits", "Pageviews".

### Umami
- One line in `src/app/api/send/route.ts` L142: `if (!process.env.DISABLE_BOT_CHECK && isbot(userAgent)) return json({ beep: 'boop' })`. npm `isbot` on the UA, plus a user IP blocklist. UI: "Views", "Visitors", "Visits".

### isbot (npm)
- 207 regex fragments in `src/patterns.json`. README L119–125, verbatim: "This package aims to identify 'Good bots'. Those who voluntarily identify themselves"; "It does not try to recognise malicious bots or programs disguising themselves as real users." L135: "It is not recommended to whitelist requests for any reason based on user agent header only." This is exactly the gap our evidence fills.

### Fathom
Closed source; nothing verifiable beyond the docs quoted in `03-standards-and-vocabulary.md`.

## Part B: hosting and datacenter lists

| List | Basis | Cadence | License | Size |
|---|---|---|---|---|
| brianhama/bad-asn-list | ASN | sporadic, last 2026-04-12 | MIT | 742 ASNs |
| client9/ipcat | IP ranges | archived, dead since 2023 | MIT | 3,428 ranges |
| growlfm/ipcat | IP ranges | daily | MIT | live successor |
| X4BNet/lists_vpn (datacenter) | ASN → IP | several times daily | MIT in README, no LICENSE file | 907 ASNs |
| jhassine/server-ip-addresses | IP ranges | daily | none | 52,860 CIDRs |
| ipinfo ASN type `hosting` | ASN with type | daily | free tier with attribution | https://ipinfo.io/developers/ipinfo-lite-database |

Others: IP2Location usage type `DCH` (lumps transit in), udger datacenter list (commercial), FireHOL `datacenters` ipset, rezmoss/cloud-provider-ip-addresses (what GoatCounter consumes).

### Our 20 ASNs against the lists
- bad-asn-list: 13 of 20 present. Absent: 396982 Google Cloud, 31898 Oracle, 45090 and 132203 Tencent, 40021 and 141995 Contabo, 16265 Leaseweb Network.
- lists_vpn: 18 of 20 present; missing only 40021 and 16265.
- All 20 holder names verified via RIPEstat as genuine hosters. AS20473 is now "AS-VULTR, The Constant Company"; AS63949 is now "AKAMAI-LINODE-AP, Akamai Connected Cloud" (bought by Akamai; still hosting, but the holder name reads as a CDN).

### Contamination that forbids bulk import
- bad-asn-list contains 15169 (Google). Clean of 13335, 36183, 20940, 54113.
- lists_vpn contains 36183 and 20940 (Akamai) and 15169. Importing it would misclassify iCloud Private Relay readers.
- jhassine explicitly includes Cloudflare.
- bad-asn-list has drifted to include eyeball ISPs (36290 Cable of St. Kitts, 394330 LTD Broadband, 7850 CityLinkFiber), transit (6939 Hurricane Electric, 3561, 33891, 29550), IXPs (19318, 16397), a CDN (212238 Datacamp/CDN77), and a bank and a university. Entity strings are inconsistent; do not join on name.

### Highest-value additions to our list (bad-asn-list entries, verified hosters)
62567 DigitalOcean NY2; the Leaseweb family 30633, 7203, 394380, 28753, 59253, 133752; 9009 M247; 47583 Hostinger; 54825 Packet/Equinix Metal; 36351 SoftLayer/IBM Cloud; then 21859 Zenlayer, 202053 UpCloud, 49505 Selectel, 50673 Serverius, 49981 WorldStream, 57043 HOSTKEY, 53667 FranTech, 54290 Hostwinds, 63473 HostHatch, 55293 A2, 22611/54641 InMotion, 32244 Liquid Web, 36352 ColoCrossing, 40676 Psychz, 29802 Hivelocity, 8972/61157 PlusServer, 20773 Host Europe, 24961 myLoc, Rackspace 10532/15395/22720/27357/33070/45187.

## Part C: Fetch Metadata as a bot signal in open source

- Anubis (TecharoHQ), `data/common/acts-like-browser.yaml` L7–19: presence of Sec-Fetch-Dest/Mode/Site plus UA, Accept-Encoding, Accept-Language gives `WEIGH, adjust: -10`, a bonus that exempts from the proof-of-work challenge. Absence only forfeits the bonus. File comment: "These rules have been known to be bypassed by some of the worst automated scrapers." https://github.com/TecharoHQ/anubis/blob/4578023de7b631537e3a43d89b1998e802beb7e0/data/common/acts-like-browser.yaml#L7-L19
- caddy-waf, `rules-browser-friendly.json` L335–417: seven graded rules; missing Sec-Fetch-Dest scores 5, severity CRITICAL, action `log` not `block`, description "Very strong indicator of non-browser traffic but can cause issues with normal browsers". https://github.com/fabriziosalmi/caddy-waf/blob/6f53733dc6cd1bbdb6c1ae4348c860bd22c9b57e/rules-browser-friendly.json#L335-L417
- BunkerWeb, `src/common/core/antibot/antibot.lua` L982–994 `is_navigation_request`: Sec-Fetch-Mode navigate or Sec-Fetch-Dest document, with the comment "No Sec-Fetch metadata: fall back to the Accept header". Designs around absence. https://github.com/bunkerity/bunkerweb/blob/6a9067453a0aa8feacf4e95a60f8572233198865/src/common/core/antibot/antibot.lua#L982-L994
- bot-signal (okasi), `src/server/analysis.ts` L226–234 and L324–330: `missing-browser-headers` weight 0.35, confidence "medium", and the option `requireBrowserHeaders` defaults to false. https://github.com/okasi/bot-signal/blob/7905b48357a34b19350b7c86797a558a5dc65c9b/src/server/analysis.ts#L226-L234
- Offensive-side statement of the failure mode, Averyy/wafer `docs/ref-sec-fetch.md` L70–76: "WAFs can't flag 'missing Sec-Fetch = bot' because legitimate WebView traffic looks identical." https://github.com/Averyy/wafer/blob/3f99a6c60c3d1755649ad1839c2f87433633a68e/docs/ref-sec-fetch.md

Consensus across all four defensive projects: absence of Fetch Metadata is a weight, never a verdict on its own.

## Implications for our classifier

1. No open-source precedent combines Fetch Metadata and ASN; that is the article.
2. Model the audit trail on GoatCounter's `Result` enum: one reason code per hit, with "affirmatively a browser" distinct from "nothing matched". Plausible's `drop_reason` list is the second-best vocabulary.
3. Keep the ASN list hand-curated. Every public list is contaminated for this purpose; our 20 verified entries are a better list than any of them. Add the Leaseweb family, 62567, 9009, 47583, 54825, 36351 after whois verification.
4. Data-center ASN is treated as a verdict by GoatCounter, Plausible cloud, Fathom, and the MRC standard (with AWS, Google, Microsoft as the floor). Missing Fetch Metadata is treated as a weight by everyone. Our rule must follow that asymmetry unless our own referred-traffic measurement (TASK-0101) shows otherwise.
5. Our eligibility check already reads `Sec-Purpose`, which none of the five tools do. Our generic bot regex already matches `headless`, which covers Plausible's "Headless Chrome" rule.
6. device-detector's `bots.yml` AI categories are a citable maintained source for the AI UAs rules.

## Uncertain
- Matomo lines are from `5.x-dev`. X4BNet license is README-only; jhassine has none. Plausible's edge classifier source (ASN vs ranges) is not public. The "highest-value additions" ordering is judgment, not traffic-weighted. Whether AS63949 still carries only Linode customer traffic after the Akamai merger. Whether ipinfo Lite includes the `type` field.
