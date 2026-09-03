# Probe log: which assistant was asked, when, and what it answered

Operator: a Claude Code browser worker driving the owner's Chrome, 2026-09-03. Prompt sent to each assistant in a fresh chat:

> Please open this exact URL and tell me the exact text of its H1 heading and the first sentence after it: <URL>. Do not answer from memory; fetch the page.

Real H1: "Does llms.txt Work? What a Live Implementation Revealed".

| # | Service | Account | UTC sent | Answered with real H1 | Origin request seen | Notes |
|---|---|---|---|---|---|---|
| 1 | ChatGPT (chatgpt.com) | logged in, Pro | 03:57:00 | yes | yes, 03:57:28 (+ homepage 03:57:31) | "Worked for 43s… I fetched the exact URL." |
| 2 | Claude (claude.ai) | logged in, Max | 03:57:44 | yes | yes, 03:58:09 | Noted the ?probe=claude URL resolved directly, no redirect. |
| 3 | Perplexity | anonymous | 03:58:31, 03:59:19, 04:01:51 | no, 3/3 | none | "the page could not be retrieved by the web tool… I won't guess or answer from memory." |
| 4 | Gemini (gemini.google.com) | logged in, Flash | 04:01:13 | yes, verbatim standfirst | yes, 04:01:10 (send-button click time recorded a few seconds late) | |
| 5 | Microsoft Copilot | not logged in | skipped | | | Sign-in wall. |
| 6 | Grok (grok.com) | anonymous, Fast | 04:02:53 | yes | yes, 8 requests 04:03:18–04:03:30 | Tool step: "Opened page gkoreli.com/does-llms-txt-work?probe=grok". |
| 7 | Mistral (chat.mistral.ai → Vibe) | not logged in | skipped | | | Terms-of-service modal; not accepted by automation. |
| 8 | DuckDuckGo duck.ai | no login needed | skipped | | | "Continue" terms gate before first send; not clicked. Message never sent. |
| 9 | Chrome direct navigation (baseline) | owner's browser | 04:04:00 | | yes, 04:04:03 | Human baseline. |
| 10 | ChatGPT agent mode | logged in | 04:05:44 | did not run | none | No "Agent mode" in the composer menu; ChatGPT: "Agent mode / Cloud Browser is not available to me in this chat". |

Owner-run probes from the terminal (same machine, AS62887):

| Tool | UTC | Origin request seen | Notes |
|---|---|---|---|
| Claude Code WebFetch | 03:55–03:57 | yes, `probe=claudecode-webfetch` | UA `Claude-User (claude-code/2.1.259; +https://support.anthropic.com/)`, `Accept: text/markdown, text/html, */*`, from the owner's own IP. |
| Codex CLI `codex exec -c tools.web_search=true` | 03:59:13 | none | Printed `web search: https://gkoreli.com/does-llms-txt-work?probe=codex%2Dsearch` and answered with the exact H1. D1 and tail both show no request. |
| curl baseline | 03:55 | yes, `probe=hdr1` | Confirms tail records full headers. |

D1 cross-check (`page_observations`, 2026-09-03 03:50–04:05): ChatGPT-User rows stored as `ai`; Claude-User rows (claude.ai and Claude Code) stored as `browser` because the deployed Worker predates commit 5d99371, which added the token; Gemini stored as `browser` (UA `Google`, `accepts_html=1`); all eight Grok rows stored as `browser` with `sec_fetch_mode=navigate`.

IP verification: `02-probe-captures.md` marks which client addresses fall inside a vendor-published list. Lists fetched 2026-09-03: openai.com/chatgpt-user.json, claude.com/crawling/bots.json, perplexity.com/perplexity-user.json, mistral.ai/mistralai-user-ips.json, duckduckgo.com/duckassistbot.json, and Google's googlebot.json, special-crawlers.json, user-triggered-fetchers.json, user-triggered-fetchers-google.json, user-triggered-agents.json. The Gemini address 108.177.67.40 is in none of the five Google lists.

Prior art: Stackfox, "Grok user agent" research, February 2026 (https://stackfox.co/research/grok-user-agent): same probe method, observed Chrome 139 and iPhone Safari UAs from M247 and Datacamp proxy ranges; documented tokens GrokBot/1.0, xAI-Grok/1.0, Grok-DeepSearch/1.0 never observed.

## Second run, 2026-09-03 04:55–05:05 UTC (anonymous, path-based probe URLs returning 404)

Prompt: "Please open this exact URL and tell me the HTTP status and the exact text of the page's main heading: <URL>. Do not answer from memory; fetch the page now." Terms-of-service gates were accepted (Goga asked for the run without accounts); no logins.

| Service | UTC sent | Assistant said | Origin requests seen | Notes |
|---|---|---|---|---|
| Perplexity, `/probe/perplexity-path` | 04:55:38 | "the retrieval failed … 'Failed to fetch content for …'" | none | anonymous |
| Perplexity, real page `/bring-your-own-ai-agent` | 04:57:56 | "The page returned successfully (HTTP 200 OK). Its exact H1 heading is: Bring Your Own AI Agent Everywhere" | **none** in tail or D1 | index answer presented as a fetch with a status code |
| duck.ai, `/probe/duckai-path` | queued 04:58:56, ran 04:59:31 after "Continue" | "HTTP status: 404 Not Found. The page returned no HTML…" | 1 at 04:59:33: `DuckAssistBot/1.2`, AS8075, IP 20.3.1.178 in duckassistbot.json, **Web Bot Auth signature** `Signature-Agent: "https://assistbot.duckduckgo.com"`, keyid `Ov3HDsa8JQ39dPEYFvFFN-cUpnz9yNI8LDvr-5LeiBM` = RFC 7638 thumbprint of the single Ed25519 key served at `https://assistbot.duckduckgo.com/.well-known/http-message-signatures-directory` (fetched 05:05:50 UTC, directory response itself signed, `tag="http-message-signatures-directory"`) | model shown "5.6 Luna"; live Worker stored the row as `DuckDuckBot` (fixed in undeployed 5d99371) |
| Copilot (bing.com/chat → copilot.microsoft.com) | ~05:00 | sign-in wall | none | skipped |
| Mistral Vibe, `/probe/mistral-path` | 05:00:56 (and resend 05:02:51) | "The HTTP status is 404 / NOT FOUND. … This page does not exist." | 2 at 05:00:58: both `MistralAI-User/1.0`, AS8075, IPs 20.240.194.83 and 51.12.243.114 in mistralai-user-ips.json; first request browser-shaped (Sec-Fetch-* incl. `Sec-Fetch-User: ?1`, Sec-CH-UA, `Cache-Control: no-cache`, `Accept` with `application/json`), second minimal with `Content-Length` on a GET | the resend at 05:02:51 produced no further origin request (answer cached) |
| Grok, `/probe/grok-second-run` | 05:03:54 | "HTTP status: 404 (Not Found). … This page does not exist." | 8 between 05:03:57 and 05:04:03: AS3257 Web2Objects (US), AS212238 GTT EMEA (ZA), AS268249 DESTAK NET (BR), AS52361 "ORTIZ MARIA MARGARITA" (personal ASN), AS55286 B2 Net Solutions (US), AS28573 Claro NXT (BR), AS11798 Metronet (US), AS209709 Zappie Host; Safari 26.2 ×4, Chrome 143 ×2, Chrome 142 ×2; all with Fetch Metadata navigate/document/none; no token | none of the eight ASNs overlap with run 1. A ninth request at 05:04:19 from AS62887 Chrome 152 HTTP/3 is the operator's own browser and is excluded |
| Gemini CLI 0.37.1, `/probe/gemini-cli` (terminal) | 04:56:16 | `IneligibleTierError: This client is no longer supported for Gemini Code Assist for individuals` | none | CLI trigger unavailable on this account tier |

Cross-checks: D1 recorded only the DuckAssistBot row (as `DuckDuckBot`, path `/`) and the operator's own browser in this window; the Worker does not store 404 paths as page observations, so the tail is the record for the path-based probes.

## Third run, 2026-09-03 05:13–05:15 UTC (Goga, logged in to copilot.microsoft.com)

| Service | UTC | Assistant said | Origin requests seen | Notes |
|---|---|---|---|---|
| Microsoft Copilot, `/probe/copilot-goga`, two attempts | ~05:14 | "the result was still empty — no HTTP status code, no HTML, no text, no error message … The fetch tool returned an empty result again, which must be treated as final." Offered generic causes (server blocks bots, JS required, unparseable response). | none (tail alive: 93 → 124 events in the window) | logged-in account |

Edge confound check: Cloudflare GraphQL `firewallEventsAdaptive` for the zone, 02:15–05:15 UTC, returned 17 events, all `block` by managed WAF rules (16 × "React - RCE - CVE-2025-55182" on `/` from Amazon addresses, 1 × WordPress file-access rule on `/wp-config.php`). No event for any `/probe/*` path, `/bring-your-own-ai-agent`, or any Microsoft, Perplexity, OpenAI, Anthropic, Google, Mistral or DuckDuckGo network. Therefore the Perplexity, Copilot and Codex "no request" results are not edge blocks. AI Crawl Control state (artifact 07 in readers-vs-bots, same day): every crawler allowed, no block toggles.

Query used (zone:read scope of the wrangler OAuth token suffices):

```graphql
query($z:String,$s:Time,$u:Time){viewer{zones(filter:{zoneTag:$z}){firewallEventsAdaptive(filter:{datetime_geq:$s,datetime_leq:$u},limit:1000,orderBy:[datetime_DESC]){datetime action clientRequestPath clientRequestQuery userAgent clientASNDescription clientCountryName source ruleId description}}}}
```

## Fourth run, 2026-09-03 05:20–05:23 UTC (Goga: Perplexity logged in on desktop, ChatGPT iPhone app)

| Service | UTC | Assistant said | Origin requests seen | Notes |
|---|---|---|---|---|
| Perplexity logged in, `/probe/perplexity-goga` | ~05:21 | "I made a second retrieval attempt and also searched for the exact path. The page-fetching service still cannot retrieve … I won't invent either value." | none for the URL. At 05:21:17 three requests: `/robots.txt`, `/about`, `/essays`, UA `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)`, `From: crawler-support@perplexity.ai`, no Accept, HTTP/1.1, AS14618 Amazon, IPs 18.97.9.101/102 in perplexitybot.json, not in perplexity-user.json | attribution by timing; PerplexityBot has 51 routine hits in the prior 30 days but not in bursts starting with robots.txt |
| Perplexity logged in, real page `/first-party-analytics-for-a-personal-blog` | ~05:21 | exact H1 and standfirst quoted | none | index answer |
| ChatGPT iPhone app on Wi-Fi, `/probe/chatgpt-mobile` | 05:22:17 | "HTTP status: 404 Not Found. Main heading: No heading was returned. The fetch failed at the HTTP layer and exposed no page body or <h1> text, so I won't invent one." | 1: `ChatGPT-User/1.0`, same header set as the web run, AS8075, IP in chatgpt-user.json | mobile app uses the same fetcher. ChatGPT then ran `requests.get(url, headers={'User-Agent':'Mozilla/5.0'})` in its Python sandbox; no such request reached the origin (sandbox has no egress). Homepage follow-up at 05:22:51; at 05:24:35 ChatGPT-User fetched `/openwiki-validates-my-bet`, `/does-llms-txt-work`, `/bring-your-own-ai-agent`, `/oss-radar-01-vercel-winter-2026-cohort` |
| Grok mobile, `/probe/grok-mobile` | not run yet | | | |
| Grok iPhone app on home Wi-Fi, `/probe/grok-mobile` | ~05:22:50 | "http status 404, main heading this page doesn't exist" (Goga's summary) | 05:22:58 one navigation: UA `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.0.0 Safari/537.36`, `Sec-Fetch-User: ?1`, `Sec-CH-UA` Chromium 148 / platform Linux, AS396982 Google Cloud (IAD), HTTP/2; then 05:22:59 `/main.css` (`Sec-Fetch-Dest: style`, referer = probe page) and `/icons/logo.svg` ×2 (one over HTTP/3) | no proxy-pool burst; a declared headless Chromium on a cloud host. ChatGPT's homepage follow-up fetch also recurred at 05:22:51, 34 s after the iPhone probe |
| ChatGPT iPhone app, same URL repeated | ~05:27 | "HTTP status: 404 Not Found. Because the fetch returned a 404 with no page content, there is no main heading (H1) available to report from the fetched response." | none (tail alive) | repeat of a URL already fetched in the conversation is answered from the earlier result, no refetch |
| Grok website grok.com, signed in, desktop, reused `/probe/grok-mobile` URL | ~05:28:50 | "HTTP status: 404. Main heading (<h1>): This page does not exist. The response is an HTML 404 page (Page not found — Goga Koreli) with the eyebrow text 404 / NOT FOUND" | 05:28:55 and 05:29:01: two `HeadlessChrome/148.0.0.0` navigations from AS396982 Google Cloud over HTTP/3, each followed by `/main.css` and `/icons/logo.svg`; 05:29:20: one request with User-Agent exactly `Mozilla/5.0`, HTTP/2, AS396982 | no proxy-pool burst. Split confirmed: anonymous = proxy pool, signed in = headless Chromium on Google Cloud. phone app run presumed signed in (Goga to confirm) |

## Footprint disclosures

The research footprint (`research-footprint.json`, format `claude-code-per-message-v1`) covers the Claude Code root session `c4b4024b-bce0-4186-9977-c402bd7308c1` and its three subagent logs (vendor-docs research, two browser-probe workers). Excluded because they ran outside that log tree: one `codex exec` web-search probe (Codex reported 35,786 tokens), one failed `gemini` CLI invocation, and the WebFetch/WebSearch server-side tool calls whose token cost is not itemised in the session log. The session was still open when the footprint was frozen; a re-freeze happens before the release commit.
