# References with rationale and verification status

Every external source the article relies on, what it supports, how it was verified, and how much weight it can bear. Checked 2026-09-03 unless stated. "Primary" means the party responsible for the fact published it.

| # | Source | Supports | Verification | Weight / caveat |
|---|---|---|---|---|
| 1 | OpenAI, [bots documentation](https://developers.openai.com/api/docs/bots) | ChatGPT-User UA string; "robots.txt rules may not apply"; IP list URL | WebFetch 2026-09-03; UA matched capture byte for byte; captured IP inside `chatgpt-user.json` | Primary. Strong. |
| 2 | Anthropic, [crawler article 8896518](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) | Claude-User purpose; robots.txt honoured by all Anthropic bots; `claude.com/crawling/bots.json` | WebFetch 2026-09-03; captured IP inside list | Primary. Page names the token but prints no full UA; the full string is documented only by capture and by crawler-user-agents (case differs). |
| 3 | Perplexity, [bots guide](https://docs.perplexity.ai/guides/bots) | Perplexity-User and PerplexityBot strings; "generally ignores robots.txt"; IP lists | WebFetch 2026-09-03; PerplexityBot capture matched string and `perplexitybot.json`; Perplexity-User never observed | Primary for the strings; the article's Perplexity finding (no origin request) is our observation, n=7. |
| 4 | Mistral, [robots page](https://docs.mistral.ai/robots) | MistralAI-User string; purpose ("user actions in Vibe"); IP list | WebFetch 2026-09-03; both captured IPs inside `mistralai-user-ips.json`; string matched | Primary. Strong. |
| 5 | DuckDuckGo, [duckassistbot.html](https://duckduckgo.com/duckassistbot.html) | DuckAssistBot string; purpose; IP list; absence of any signing statement | WebFetch 2026-09-03; captured IP inside `duckassistbot.json` | Primary. The "does not mention signing" claim is an absence on the page as fetched; a help-centre page may say otherwise. |
| 6 | DuckDuckGo signing directory, `assistbot.duckduckgo.com/.well-known/http-message-signatures-directory` | Key id in the captured signature equals the published key's RFC 7638 thumbprint | curl 2026-09-03 05:05 UTC; thumbprint recomputed with SHA-256 over the canonical JWK; equality confirmed | Primary and cryptographic. The signature bytes were not re-verified; only the key binding. Stated in the article. |
| 7 | IETF, [draft-ietf-webbotauth-httpsig-protocol](https://datatracker.ietf.org/doc/draft-ietf-webbotauth-httpsig-protocol/); Cloudflare, [web-bot-auth](https://github.com/cloudflare/web-bot-auth) | Header names, `tag="web-bot-auth"`, directory path | Read 2026-09-02 (readers-vs-bots artifacts 06, 08) | Standards draft and reference implementation. Strong for wire format; the set of signing vendors changes monthly. |
| 8 | Google, [user-triggered fetchers](https://developers.google.com/search/docs/crawling-indexing/google-user-triggered-fetchers) and [common crawlers](https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers) | Twelve documented fetchers, none with bare `Google`; "generally ignore robots.txt" | WebFetch 2026-09-03; both pages | Primary. The claim "undocumented" is an absence across these two pages plus five IP files; Google has other product pages. Vendor ask pending (TASK-0111). |
| 9 | Google IP range files (`googlebot.json`, `special-crawlers.json`, `user-triggered-fetchers.json`, `user-triggered-fetchers-google.json`, `user-triggered-agents.json`) | Gemini's address in none of them | Fetched 2026-09-03; snapshots committed under `data/vendor-ip-lists/` | Primary. Strong at capture date. |
| 10 | ppc.land, [Gemini iOS undocumented UA](https://ppc.land/gemini-ios-app-traffic-revealed-through-undocumented-user-agent/); Search Engine Roundtable | Prior instance of an undocumented Gemini UA (`GeminiiOS`), 2025-10-27 | WebFetch 2026-09-03 | Secondary trade press reporting a practitioner's find. Used only as precedent. |
| 11 | Stackfox, [Grok user agent research](https://stackfox.co/research/grok-user-agent) | Prior probe of Grok: spoofed Chrome/iPhone UAs, M247 and Datacamp proxies, documented tokens never observed | WebFetch 2026-09-03 | Independent practitioner replication with the same method. Their two providers reappear in our captures (AS9009, AS212238). |
| 12 | xAI documentation search | No fetcher documentation exists | WebSearch 2026-09-03 plus the vendor-docs worker's search of x.ai, grok.com, xAI docs | Absence claim. Medium: someone may find a page we did not. |
| 13 | Chromium source, `components/embedder_support/user_agent_utils.cc` | `HeadlessChrome` prefix is inserted when running headless | Read 2026-09-02 (readers-vs-bots artifact 06) | Primary source code. Strong. |
| 14 | RIPEstat [as-overview](https://stat.ripe.net/docs/02.data-api/as-overview.html); Team Cymru whois | Registry holder of every ASN | API and whois 2026-09-03; both agreed on the four ASNs checked with both; `data/asn-holders.json` | Primary registries. Strong. Replaced Cloudflare's `asOrganization`, which names the IP block's organisation (ARIN WHOIS confirmed for 104.232.219.72). |
| 15 | Cloudflare, [Workers `request.cf` properties](https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties) | Meaning of `asn`, `asOrganization`, `tlsClientCiphersSha1`, `tlsClientExtensionsSha1`, `country`, `colo` | Field names observed in the tail; docs page cited | Primary. Cloudflare's docs describe `asOrganization` loosely; the block-organisation behaviour is our observation. |
| 16 | Cloudflare GraphQL `firewallEventsAdaptive` | No probe was blocked or challenged at the edge | Queried 2026-09-03 with the zone-scoped token; `data/firewall-events-2026-09-03.json` | Primary log. Strong for the window queried. |
| 17 | [omrilotan/isbot](https://github.com/omrilotan/isbot) 5.2.2 | Verdicts; `^claude-code/` pattern | Real npm package run via `scripts/detectors.ts` | Primary. Strong. |
| 18 | [matomo-org/device-detector](https://github.com/matomo-org/device-detector) `regexes/bots.yml`; node-device-detector 2.2.7 | `^Google$` → Googlebot; AI Assistant categories | Upstream YAML parsed with js-yaml and evaluated with the PHP anchoring; Node port run | Primary. A PHP run remains the last confirmation before an upstream PR. |
| 19 | GitHub blame on device-detector | `^Google$` rule added 2023-08-07 (a9f29e5) | GraphQL blame 2026-09-03 | Primary. Strong. |
| 20 | [monperrus/crawler-user-agents](https://github.com/monperrus/crawler-user-agents) | Recorded instances and addition dates; exact matches for four fetchers | JSON fetched 2026-09-03 and compared | Community record. Strong as corroboration; not a vendor statement. |
| 21 | [ai-robots-txt/ai.robots.txt](https://github.com/ai-robots-txt/ai.robots.txt) | Registry of 166 agents; no xAI entry; Claude-Code operator "unclear" | JSON fetched 2026-09-03 | Community registry. Strong for what it lists; absence of xAI reflects the absence of a token. |
| 22 | [arp242/isbot](https://github.com/arp242/isbot) (GoatCounter) | Hosting-range reason codes; Servers.com and Google Cloud listed | Source read 2026-09-03 | Primary. Strong. |
| 23 | [X4BNet/lists_vpn](https://github.com/X4BNet/lists_vpn) datacenter IPv4 | 3 of 8 and 2 of 8 Grok exits flagged | 42,797 ranges fetched 2026-09-03; checked privately; booleans published | Community list; coverage varies. Used as a lower bound, not a verdict. |
| 24 | Cloudflare Radar [bot directory, DuckAssistBot](https://radar.cloudflare.com/bots/directory/duckassistbot) | DuckAssistBot listed | Search result 2026-09-03; direct fetch returns 403 to non-browser clients | Secondary until opened in a browser. Article says "lists", not "verified". |
| 25a | Fetch Metadata support in current engines | Chromium 76+, Firefox 90+, Safari and iOS WebKit 16.4+ send `Sec-Fetch-*` on navigations | caniuse and mdn/browser-compat-data #27928 as recorded in readers-vs-bots artifact 09 (2026-09-03) | Primary compatibility data; "every mainstream engine" is bounded to those versions. |
| 25 | Cloudflare AI Crawl Control state (readers-vs-bots artifact 07) | Every crawler allowed, no block toggles | Dashboard read 2026-09-03 early | Primary, dashboard. Supports the firewall check. |

## Internal evidence

| Artifact | Contents |
|---|---|
| `02-probe-captures.md`, `data/captures.jsonl`, `data/captures.csv` | Every probe request with headers, network facts, vendor-list match |
| `03-probe-log.md` | Prompts, send times, assistant replies, origin matches, corrections |
| `04-open-source-validation.md`, `scripts/detectors.ts` | Detector verdicts, reproducible |
| `05-cross-validation.md` | crawler-user-agents instances, X4BNet, signing directories |
| `research-footprint.json` | Token accounting for the writing session tree |

## Link check

All external links in the article resolved with HTTP 200 on 2026-09-03 after the push, except the Cloudflare Radar page, which returns 403 to non-browser clients. Research and data links point at `main`; pin them to a commit if the directory is ever restructured.
