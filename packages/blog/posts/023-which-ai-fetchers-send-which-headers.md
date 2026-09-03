---
title: "Which AI Fetchers Send Which Headers, Measured on a Live Site"
seoTitle: "ChatGPT, Claude, Gemini and Grok Fetcher Headers, Measured"
alternativeHeadline: "What happened at a Cloudflare Worker when ChatGPT, Claude, Gemini, Grok, Perplexity, Copilot, Mistral, DuckDuckGo, Claude Code and Codex were asked to fetch a page: headers, networks, IP lists and signatures"
date: "2026-09-03"
lastModified: "2026-09-03"
description: "What happened when ChatGPT, Claude, Gemini, Grok, Perplexity, Copilot, Mistral, DuckDuckGo, Claude Code and Codex were asked to fetch a page on a live Cloudflare Worker: the User-Agent, Accept and Fetch Metadata headers received, vendor IP-list matches, one verified Web Bot Auth signature, and which assistants sent no request at all."
section: engineering
tags: [ai-agents, analytics, cloudflare-workers, http, observability, agentic-engineering]
series:
  id: "measurement-boundaries"
  title: "Measurement boundaries"
  order: 3
researchFootprint:
  sessions: 4
  artifacts: 9
  totalTokens: 96338161
  inputTokens: 95960671
  cachedInputTokens: 94544659
  outputTokens: 377490
  reasoningOutputTokens: 88584
  wallClockMinutes: 790
  startedAt: "2026-09-03T03:44:10.071Z"
  measuredAt: "2026-09-03T16:54:06.410Z"
  provenanceUrl: "https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/ai-fetcher-headers"
---

# Which AI Fetchers Send Which Headers, Measured on a Live Site

<p class="post-orient">What ten AI assistants did when asked to fetch a page on this site on September 3, 2026, recorded at the Cloudflare Worker: the headers each fetcher sent, the networks it came from, whether its address matched the vendor's published list, whether it signed the request, and which assistants answered without requesting the page at all. Raw captures and data files published.</p>

If you count visitors on your own server, some of them are AI assistants fetching a page for a person, and whether you can tell depends on what the assistant chose to send. On this site, Grok used anonymously arrived as eight separate browser-shaped requests from eight networks on four continents, including an Irish mobile carrier and Brazilian ISPs, with no token and no signature; my analytics counted eight people, and no server-side rule I know of could have done otherwise. DuckDuckGo's assistant arrived once, named itself, and signed the request with a key it publishes; the Worker verified the signature. Between those two ends sit ChatGPT, Claude and Mistral, which name themselves in a checkable way, Gemini, which sends one word Google has not documented, and three assistants that reported a result without the page ever being requested. This article records exactly what each one sent, checked against vendor documentation, published IP lists, signing-key directories, registries and the open-source bot detectors most sites rely on.

The findings, each explained below:

- **ChatGPT-User** sends its documented User-Agent from an address in OpenAI's published range, with browser-shaped `Accept` and `Accept-Language`, over HTTP/2. After the requested page it also fetched the homepage, and from the phone app four more posts.
- **Claude-User** names itself and its address is in Anthropic's list, but the request carries only `Accept: */*` beyond that, over HTTP/1.1.
- **MistralAI-User** matches its documentation and IP list; its first request carries the full browser header set including Fetch Metadata, its second is a bare client.
- **DuckAssistBot** signed both requests it made here with a Web Bot Auth signature. The key id equals the key published at its well-known directory, and the Worker verified the second signature in full. It was the only assistant fetcher in this study that signed.
- **Gemini** sends `User-Agent: Google` and `Accept: */*` from a Google address that is in none of Google's five published crawler and fetcher IP files, and the string is absent from Google's two crawler documentation pages.
- **Grok, used anonymously**, sends no token or signature and full Safari or Chrome header sets from rotating exits, several on consumer networks. **Grok, signed in**, sends a self-declared `HeadlessChrome` from Google Cloud instead.
- **Perplexity** reported a fetch failure for unknown paths and a correct "HTTP 200 OK" answer for a real page while the origin received no request for either. Signed in, it dispatched its search crawler to three other pages instead.
- **Copilot**, signed in, reported an empty result twice; no request arrived.
- **Claude Code's fetch tool** runs on the user's own machine and asks for Markdown before HTML.
- **Codex's web search** answered correctly about the page with no request at answer time; 76 minutes later an unnamed client on Amazon fetched that exact URL.

Three of these reach beyond this site. The anonymous Grok path means server-side visitor counts include an unknown number of Grok fetches that no request fact distinguishes from people. The Gemini path means Google runs a consumer fetcher that the documentation page written for this purpose does not list. The DuckDuckGo path means the mechanism that would settle both questions runs in production at one mainstream assistant today.

## The capture table: what each fetcher sent

This section and the next nine are for the person who will read their own logs; the section on classifying fetches returns to what it means for any site owner.

Each assistant was asked, in a fresh chat, to open a URL assigned to it and quote the page's heading. Two prompt shapes were used, both printed in the method section. The URLs were `https://gkoreli.com/does-llms-txt-work?probe=<name>` in the first run and `https://gkoreli.com/probe/<name>` in later runs; the second form returns a 404 page, which the Worker logs like any other request. One URL, `/probe/grok-mobile`, was deliberately reused across the signed-in Grok runs. Attribution rests on the URL and arrival time: an assigned URL existed nowhere else when it was given to its assistant. The Worker was tailed with `wrangler tail --format json`, which records every request header plus the facts Cloudflare attaches: autonomous system, country, HTTP version and TLS ClientHello digests. The probe page in the first run was [the llms.txt article](/does-llms-txt-work).

The requests are published as data in the [research directory](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/ai-fetcher-headers): [`captures.jsonl`](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/ai-fetcher-headers/data/captures.jsonl) and a CSV with the 37 requests for assigned probe URLs, `side-requests.jsonl` with 65 attributed follow-up requests (homepage and post fetches by ChatGPT-User, the PerplexityBot burst, the stylesheet and logo fetched by Grok's headless browser), and `stray-probe-requests.jsonl` with 13 probe-shaped URLs nobody assigned. Client addresses appear only where they fall inside a vendor's published list; Cloudflare-added headers and TLS randoms are removed; header order is not preserved. The files are the requests the article relies on, not a complete traffic log.

| Fetcher | User-Agent as received | `Accept` | `Accept-Language` | Fetch Metadata | Network (registry holder) | IP in vendor list | HTTP |
|---|---|---|---|---|---|---|---|
| ChatGPT, web and iPhone app | `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot` | browser-shaped, 8 media ranges | `en-US,en;q=0.9` | none | AS8075 Microsoft | yes, `chatgpt-user.json` | HTTP/2 |
| Claude.ai | `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +claude-user@anthropic.com)` | `*/*` | absent | none | AS396982 Google Cloud | yes, `claude.com/crawling/bots.json` | HTTP/1.1 |
| Mistral (Vibe), 2 requests | `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; MistralAI-User/1.0; +https://docs.mistral.ai/robots)` | browser-shaped plus `application/json` (first); browser-shaped (second) | `en-US,en;q=0.9` (first); absent (second) | `navigate` / `document` / `none`, `Sec-Fetch-User: ?1`, `Sec-CH-UA`, `Cache-Control: no-cache` (first); none (second) | AS8075 Microsoft | yes, `mistralai-user-ips.json` | HTTP/2 |
| DuckDuckGo duck.ai, 2 requests | `DuckAssistBot/1.2; (+http://duckduckgo.com/duckassistbot.html)` | `*/*` | absent | none; `Signature`, `Signature-Input`, `Signature-Agent: "https://assistbot.duckduckgo.com"` | AS8075 Microsoft | yes, `duckassistbot.json`; signature verified | HTTP/2 |
| Gemini app | `Google` | `*/*` | absent | none | AS15169 Google | no, checked 5 Google files | HTTP/1.1 |
| Grok anonymous, run 1, 8 requests | Safari 26.2 on macOS (2), Chrome 143 on macOS (4), Chrome 142 on macOS (2) | browser-shaped (Safari and Chrome values) | `en-US,en;q=0.9` | `navigate` / `document` / `none` | 8 ASNs: M247, GTT, Datacamp, Servers.com, Oculus Networks; Three Ireland mobile, DZCRD, Pombonet | no | HTTP/2 |
| Grok anonymous, run 2, 8 requests | Safari 26.2 (4), Chrome 143 (2), Chrome 142 (2) | browser-shaped | `en-US,en;q=0.9` | `navigate` / `document` / `none` | 8 ASNs: GTT, Datacamp, B2 Net, Ace Data Centers, code200; DESTAK, Claro, ARSAT | no | HTTP/2 |
| Grok signed in, 3 prompts, 6 requests | `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.0.0 Safari/537.36` (4); `Mozilla/5.0` (2) | browser-shaped (headless); `*/*` (bare) | `en-US,en;q=0.9` (headless); absent (bare) | `navigate` / `document` / `none`, `Sec-Fetch-User: ?1`, `Sec-CH-UA` (headless); none (bare) | AS396982 Google Cloud | no list exists for Grok | HTTP/2 and HTTP/3 |
| Perplexity, 7 attempts | no request for any asked URL; on the signed-in attempt `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)` fetched 3 other paths | absent | absent | none; `From: crawler-support@perplexity.ai` | AS14618 Amazon | yes, `perplexitybot.json` | HTTP/1.1 |
| Copilot, 2 attempts | no request | no request | no request | no request | no request | no request | no request |
| Claude Code | `Claude-User (claude-code/2.1.259; +https://support.anthropic.com/)` | `text/markdown, text/html, */*` | absent | none | my own ISP | not applicable, runs locally | HTTP/1.1 |
| Codex CLI web search | none at answer time; 76 min later `Mozilla/5.0 (compatible)` fetched the exact URL | `*/*` | absent | none | AS14618 Amazon | no | HTTP/1.1 |
| Chrome 152, human baseline | `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36` | browser-shaped | `en-US,en;q=0.9,ka;q=0.8,ru;q=0.7` | `navigate` / `document` / `cross-site`, `Sec-CH-UA`, `Upgrade-Insecure-Requests` | my own ISP | not applicable, a person | HTTP/3 |

"Fetch Metadata" means the `Sec-Fetch-Mode`, `Sec-Fetch-Dest` and `Sec-Fetch-Site` headers that mainstream browser engines have sent on navigations since Chromium 76, Firefox 90 and Safari 16.4. Of the declared fetchers only Mistral's first request sends them. All sixteen anonymous Grok requests and all four signed-in headless renders send them; the two bare Grok clients do not.

Every assistant in the table was reached. Copilot requires a sign-in and was probed from my account; ChatGPT, Claude, Gemini and the second Perplexity pair also used signed-in sessions; Grok was probed both anonymously and signed in; Mistral, duck.ai and the first Perplexity attempts were anonymous. For every row with no origin request I pulled the zone's Cloudflare firewall event log for the surrounding hours, to check that the edge had not blocked the fetch before it reached the Worker. It had not: the eleven events in the window were managed-WAF blocks of exploit scans against `/` and `/wp-config.php`, none for a probe path or a vendor network.

The table is the whole finding in one place: four fetchers can be named by token plus IP list, one can be proven by signature, one sends an undocumented word, one sends nothing identifying, and three sent nothing at all when asked.

## ChatGPT-User: documented, list-verified, and fetches more than asked

OpenAI's fetcher matched its documentation on every point checked. The User-Agent equals the string on OpenAI's [bots page](https://developers.openai.com/api/docs/bots) byte for byte. The source address, `9.129.45.186`, is inside the range OpenAI publishes at `openai.com/chatgpt-user.json`. The `Accept` header carries the same eight media ranges Chrome sends (with `q=0.9` on `signed-exchange` where the human Chrome baseline sent `q=0.7`), `Accept-Language` is present, and the request came over HTTP/2 with `x-envoy-expected-rq-timeout-ms: 15000`, the request deadline advertised on this hop.

The ChatGPT iPhone app uses the same fetcher: a probe sent from the app produced one request with an identical User-Agent and header set, again from an address in OpenAI's list. That probe pointed at a 404 page, and ChatGPT reported the status correctly but said no body or heading was returned. The server sent a full 404 page with a heading; the tool did not show it to the model. DuckDuckGo's tool behaved the same way, while Grok and Mistral read the 404 page's heading. After the 404 the app also tried `requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})` in its Python sandbox; that request did not reach this origin. Two minutes later ChatGPT-User fetched four more posts on the site. One question from the phone produced six page loads. Asking the same question again a few minutes later produced the same 404 answer and no new request.

OpenAI states: "Because these actions are initiated by a user, robots.txt rules may not apply." After fetching the first probe URL from the web, ChatGPT fetched the homepage three seconds later, unprompted, and did so again after the phone probe. For a site owner, ChatGPT-User is nameable as a fact: token plus IP-range match, and the analytics label it that way.

## Claude-User: named, list-verified, minimal headers

Anthropic's fetcher from claude.ai identifies itself and came from an address in the vendor's published list. Everything else about the request is minimal: `Accept: */*`, no `Accept-Language`, HTTP/1.1, from a Google Cloud address. Anthropic's [crawler article](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) names the `Claude-User` token and its purpose but does not print the full User-Agent string. The community list crawler-user-agents records the string with the contact token capitalised as `+Claude-User@anthropic.com`; the request here carried `+claude-user@anthropic.com`.

On robots.txt the vendors differ. Anthropic says its bots "respect 'do not crawl' signals by honoring industry standard directives in robots.txt." OpenAI says robots.txt "may not apply" to ChatGPT-User; Perplexity says "this fetcher generally ignores robots.txt rules"; Google says its user-triggered fetchers "generally ignore robots.txt rules". Anthropic is the only one of the four whose documentation describes robots.txt as binding on its on-demand fetcher.

Claude Code's fetch tool shares the token but not the path. Its request came from my own residential address, because the tool runs inside the CLI on the user's machine, and it sent `Accept: text/markdown, text/html, */*`. In this capture it was the only request that asked for Markdown before HTML. At capture time the site's Markdown content negotiation was merged but not deployed, so it received HTML; the negotiation went live later the same day.

## MistralAI-User: a browser engine behind the token

Mistral's assistant, now branded Vibe, produced two requests for its probe URL within the same second, both from Azure addresses inside Mistral's [published list](https://docs.mistral.ai/robots) and both carrying the documented `MistralAI-User/1.0` User-Agent. The first has the header set of a browser engine: Chrome's `Accept` list with `application/json` added, `Accept-Language`, the full Fetch Metadata set including `Sec-Fetch-User: ?1`, `Sec-CH-UA` client hints and `Cache-Control: no-cache`. The second is a plain HTTP client with an `Accept` list and a `Content-Length` header on a GET. Two fetch paths, one token, one question.

Mistral's documentation says the fetcher acts "when users ask Vibe a question" and is "not used for crawling the web in any automatic fashion, nor to crawl content for generative AI training". It does not say whether robots.txt binds it. For a site owner it is nameable: token plus IP list.

## DuckAssistBot: the one fetcher whose identity was proven

DuckDuckGo's duck.ai fetched its probe URL from an Azure address inside DuckDuckGo's [published list](https://duckduckgo.com/duckassistbot.html), with the documented `DuckAssistBot/1.2` User-Agent and `Accept: */*`, and it signed the request:

```text
signature-agent: "https://assistbot.duckduckgo.com"
signature-input: sig1=("@authority" "signature-agent");created=1788411572;expires=1788412172;keyid="Ov3HDsa8JQ39dPEYFvFFN-cUpnz9yNI8LDvr-5LeiBM";alg="ed25519";tag="web-bot-auth"
signature: sig1=:NBrgbVdKFeZEFLnpQx0osM5xAZ5wfGP1TBvYC2NBrYycNLKuX7EU+lsLxylIYn8A0f3zshL8IZRdP+fj3VkzBA==:
```

This is [Web Bot Auth](https://datatracker.ietf.org/doc/draft-ietf-webbotauth-httpsig-protocol/), the IETF draft that applies RFC 9421 HTTP Message Signatures to automated traffic. The `Signature-Agent` header names a host; that host serves a key directory at `/.well-known/http-message-signatures-directory`; the `keyid` is the RFC 7638 thumbprint of the signing key. DuckDuckGo's directory holds one Ed25519 key whose thumbprint is `Ov3HDsa8JQ39dPEYFvFFN-cUpnz9yNI8LDvr-5LeiBM`, the key id in the request, and the directory response is itself signed. A second DuckAssistBot fetch of this article, made after the site's verifier was deployed, was verified in full by the Worker (Ed25519 over `@authority` and `Signature-Agent`, key fetched from the directory, validity window checked) and stored as a signed agent. It is the first verified row since the verifier went live. Cloudflare Radar lists DuckAssistBot in its [bot directory](https://radar.cloudflare.com/bots/directory/duckassistbot).

The DuckAssistBot page fetched for this study does not mention signing. DuckDuckGo's search crawler, DuckDuckBot, signs as well, writing the `Signature-Agent` value as a bare unquoted URI, a form the current draft has deprecated; the Worker's parser rejected it on three visits, and a fix has been written. Among AI assistants, the public record of who signs named OpenAI's ChatGPT agent, whose key directory `chatgpt.com` serves, and Google's Google-Agent, which Cloudflare's signed-agents list reports; DuckAssistBot belongs on that list, and here it was the only assistant fetcher observed signing.

## Perplexity: answers without requests, and a crawler sent elsewhere

Perplexity was given seven chances, five anonymous and two from a signed-in account, and the origin received no request for any of the seven asked URLs. Anonymously: three times it was asked to open a query-string probe URL and reported "the page could not be retrieved"; once it was asked to open a plain 404 path and reported "Failed to fetch content"; once it was asked to open a real, existing post with no query string, and it answered "The page returned successfully (HTTP 200 OK)" with the correct H1. A correct answer with no request is consistent with cached or indexed content; how Perplexity produced the status code is not visible from outside.

Signed in, the two probes went the same way: "The page-fetching service still cannot retrieve" the unknown path, and the real post answered correctly, neither URL requested. This time something did arrive. Within the same second, three requests from Amazon addresses inside Perplexity's [published `PerplexityBot` range](https://docs.perplexity.ai/guides/bots) fetched `/robots.txt`, `/about` and `/essays`, each with the `PerplexityBot/1.0` User-Agent and a `From: crawler-support@perplexity.ai` header. Perplexity's reply said it had "searched for the exact path". Attribution here is by timing: PerplexityBot also crawls this site on its own schedule, but a three-request burst starting with robots.txt in the second the prompt was sent does not match its routine pattern in the site's logs.

`Perplexity-User`, the fetcher Perplexity documents for exactly this situation, did not appear in any of the seven attempts. It is nameable by token and IP list when it does appear; on this site, for these prompts, it did not.

## Copilot: an empty result, no request

Microsoft Copilot, signed in, was asked twice to open its probe URL. Both times it said its fetch tool "returned an empty result" with "no HTTP status code, no HTML, no text, no error message", and offered the usual explanations: the server blocks automated requests, the page needs JavaScript, the response type could not be parsed. None of those happened here. The origin received no request, and the zone's edge firewall log for that hour contains no block, challenge or rate limit for any Microsoft address. In two attempts from one account on the web surface, Copilot did not fetch an unindexed URL. Microsoft documents `bingbot`; I found no Microsoft page documenting a separate Copilot chat fetcher, and the `MicrosoftPreview` string is reported by third parties only.

## Gemini: one word, absent from Google's fetcher documentation

The Gemini app fetched the page with `User-Agent: Google`. Not `Googlebot`, not `Google-Agent`, not `Google-GeminiNotebook`. Just the company name.

Google maintains a [page listing its user-triggered fetchers](https://developers.google.com/search/docs/crawling-indexing/google-user-triggered-fetchers): twelve of them, each with a full User-Agent string and an IP range file. `Google` on its own is not among them, nor on the [common crawlers page](https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers). The source address, in Google's own AS15169, is not in `googlebot.json`, `special-crawlers.json`, `user-triggered-fetchers.json`, `user-triggered-fetchers-google.json` or `user-triggered-agents.json`, all checked on the day of the capture. Google has other product pages I did not check; a documented home for this string may exist elsewhere, and I have asked.

An undocumented Gemini User-Agent has been found before: in October 2025 a practitioner reported `GeminiiOS 1.2025.417 (WKWebView)` in access logs, and no documentation followed. A site owner seeing `Google` from a Google address has no vendor statement to match it against. The analytics here record the literal token as a fact; they do not call it Gemini, because Google has not.

## Grok: undetectable when anonymous, declared when signed in

Grok, used anonymously in "Fast" mode on grok.com, showed a tool step reading "Opened page gkoreli.com/does-llms-txt-work?probe=grok" and quoted the H1 correctly. The origin saw eight requests for that URL between 04:03:18 and 04:03:30 UTC, the prompt having been sent at 04:02:53:

| Time (UTC) | ASN and registry holder | Cloudflare's organisation string | Country (Cloudflare) | Claimed browser |
|---|---|---|---|---|
| 04:03:18 | AS9009 M247 Europe SRL (hosting, Romania) | Aventice LLC | US | Safari 26.2, macOS |
| 04:03:18 | AS3257 GTT Communications (transit) | Web2Objects LLC | US | Safari 26.2, macOS |
| 04:03:18 | AS132817 DZCRD Networks Ltd (ISP, Bangladesh) | DZCRD Networks Ltd | Netherlands | Chrome 143, macOS |
| 04:03:18 | AS13280 Three Ireland (Hutchison), mobile subscriber pool | Three Ireland (Hutchison) - Mobile Subscriber Pools | Ireland | Chrome 143, macOS |
| 04:03:18 | AS262988 Pombonet Telecomunicações (ISP, Brazil) | Pombonet Telecomunicações e Informática | Brazil | Chrome 143, macOS |
| 04:03:19 | AS212238 Datacamp Limited (hosting and CDN, UK) | Private Customer | South Africa | Chrome 143, macOS |
| 04:03:22 | AS7979 Servers.com (hosting) | Servers.com, Inc. | US | Chrome 142, macOS |
| 04:03:30 | AS398781 Oculus Networks Inc (hosting) | Private Customer | US | Chrome 142, macOS |

Registry holders are from RIPEstat for every ASN, with four cross-checked in Team Cymru, on the day of the capture. Cloudflare attaches its own organisation string to each request; for the resold address blocks it names the organisation registered for the IP block rather than the network that announces it, so the two columns disagree for nine of the sixteen anonymous requests. Both are in the data files.

Every one of the eight requests carried a browser header set: a Safari or Chrome User-Agent, the matching Safari or Chrome `Accept` value, `Accept-Language: en-US,en;q=0.9`, `Sec-Fetch-Mode: navigate`, `Sec-Fetch-Dest: document`, `Sec-Fetch-Site: none`, `Priority: u=0, i`, and on the Chrome-claiming requests `Sec-CH-UA` client hints with matching versions. The words "Grok" and "xAI" appear nowhere. There is no `Signature-Agent` header. The TLS cipher and extension digests differ across the requests, which is consistent with several client stacks rather than one.

An hour later I asked Grok again, anonymously, for a different URL. Eight requests again, in six seconds, starting three seconds after the prompt, from eight networks: GTT and Datacamp appeared in both runs, and the other six were new: Claro and DESTAK NET in Brazil, ARSAT, the Argentine state telecom, and three hosting providers, B2 Net Solutions, Ace Data Centers and code200 in Lithuania. The header sets were the same kinds, in a different mix (four Safari, four Chrome). What reproduced was the shape: eight browser-shaped requests, eight networks, no identifying token.

Signed in, Grok behaved differently. A probe from the Grok iPhone app produced one request from a Google Cloud address with the User-Agent `HeadlessChrome/148.0.0.0` on Linux, `Sec-Fetch-User: ?1` and Chrome 148 client hints, followed a second later by same-origin requests for `/main.css` and the site logo with the probe page as referer: a Chromium rendering the page, and saying so in its User-Agent, since Chromium inserts the `Headless` prefix when it runs without a display. Two more signed-in prompts from grok.com on the desktop did the same: three further headless renders, each pulling the stylesheet and logo, and two bare requests with the User-Agent `Mozilla/5.0`, `Accept: */*` and `Accept-Encoding` and no other headers, also from Google Cloud. In these five prompts the anonymous sessions produced the proxy pattern and the signed-in sessions produced the headless browser; I have not tested enough accounts or devices to say the account is the cause.

Attribution rests on the assigned URLs: nobody but Grok was given them, and each burst began within thirty seconds of its prompt and finished within forty. The anonymous pattern is not new. A [February 2026 experiment by Stackfox](https://stackfox.co/research/grok-user-agent) used the same method and saw Chrome and iPhone Safari User-Agents from two rotating proxy providers, M247 Europe and Datacamp. Both appear in the captures here. What this capture adds is that the exits also include a mobile carrier's subscriber pool and consumer ISPs on four continents, that one question produces eight fetches, and that signed-in sessions take a declared path. I found no xAI documentation of a fetcher User-Agent or IP list, and neither did the third-party directories checked.

For counting purposes: the Worker classified all sixteen anonymous requests as browsers, and by its rule that was correct. The rule, described in [How I Built First-Party Analytics for a Personal Blog](/first-party-analytics-for-a-personal-blog) and refined since, records a request with a browser User-Agent, navigation-shaped Fetch Metadata and a network outside a hosting list as a browser. Three of the eight requests in each run came from consumer networks that were absent from the datacenter list I checked: a mobile carrier, three Brazilian ISPs, a Bangladeshi ISP, an Argentine telecom. No server-side rule I know of separates those requests from readers. The anonymous Grok path is a set of human-shaped requests inside every server-side audience count it touches.

## Codex: a correct answer, then a late unnamed fetch

I ran OpenAI's Codex CLI with its web search tool enabled and asked it to open the probe URL. It printed a search step with the URL, encoded as `probe=codex%2Dsearch`, then answered with the exact H1 and a link to the page. At answer time the origin had received no request for that URL.

The correct answer without a request is consistent with OpenAI's search index having the page from earlier crawls. Then, 76 minutes later, one request for exactly that URL arrived, with the hyphen still percent-encoded the way Codex had printed it, from an Amazon address, with the User-Agent `Mozilla/5.0 (compatible)`, `Accept: */*`, and no token, contact or signature. That encoded URL existed nowhere but Codex's search step, which links the late request to whatever consumed that step's output; the client did not identify itself, so which system fetched it is a hypothesis, not a fact in the log. Within an hour of this article's publication the same User-Agent, from the same network, also fetched eight URLs assembled from columns of the published CSV, joined by commas. Whatever it is, it reads data files and follows what it finds.

## What the open-source bot detectors make of these requests

Most sites do not write their own classifier. They use a library. So I ran the captured User-Agent strings through the detectors the open-source world ships: [isbot](https://github.com/omrilotan/isbot) 5.2.2 (the npm package), Matomo's [device-detector](https://github.com/matomo-org/device-detector) bot list (the Node port and the upstream YAML), [crawler-user-agents](https://github.com/monperrus/crawler-user-agents), the [ai.robots.txt](https://github.com/ai-robots-txt/ai.robots.txt) registry and GoatCounter's [isbot](https://github.com/arp242/isbot) rules, all at their current `main` on the day of the capture, with a TypeScript script that is in the research directory.

| Captured User-Agent | isbot | device-detector | crawler-user-agents | ai.robots.txt |
|---|---|---|---|---|
| ChatGPT-User | bot | `ChatGPT-User`, AI Assistant | `ChatGPT-User` | listed, OpenAI |
| Claude-User | bot | `Claude-User`, AI Assistant | `Claude-User` | listed, Anthropic |
| `Google` | bot, generic `google` pattern | `Googlebot`, Search bot | no match | no entry |
| Claude Code | bot | `Claude-User` | `Claude-User` | `Claude-Code`, operator "Unclear at this time" |
| Grok anonymous, Safari UA | not a bot | no match | no match | no entry |
| Grok anonymous, Chrome UA | not a bot | no match | no match | no entry |

Three results follow. ChatGPT-User and Claude-User are named identically by all four lists, which is where the open-source consensus and this site's Worker agree. The bare `Google` string is matched by isbot only through its generic `google` pattern and by device-detector through an explicit `^Google$` rule added in August 2023 that files it as Googlebot, "Search bot", so installations using that rule classify a Gemini fetch as Google search crawling; crawler-user-agents and ai.robots.txt have no entry. The anonymous Grok User-Agents match nothing, because there is nothing to match; ai.robots.txt, whose purpose is to let sites express AI-agent policy in robots.txt, has no xAI entry and cannot have one without a token. GoatCounter's IP-range rules would have caught the Servers.com exit and, through Google Cloud, the signed-in renders, and none of the consumer exits. isbot's own pattern for Claude Code, `^claude-code/`, does not match the real string, which starts with `Claude-User`; the request is caught by another pattern. Each of these is an upstream contribution, a pull request, issue or discussion as each project prefers, that I will open with this capture as the evidence.

The captured strings were also compared with the community's records. crawler-user-agents stores the exact User-Agents its contributors have seen: ChatGPT-User, MistralAI-User, DuckAssistBot and PerplexityBot match those records byte for byte. The recorded Claude-User instance differs from mine only in the case of the contact token. `Google` has no record there. The Grok exits were checked against X4BNet's open datacenter list of 42,797 ranges: it flags three of the eight first-run exits and two of the eight second-run exits, none of them the consumer networks. And the well-known signing-key directory was requested on seventeen vendor hosts; only `chatgpt.com` and `assistbot.duckduckgo.com` serve one.

## How a site owner can classify AI fetches

This section is for anyone who counts visitors on their own server, whether with a Worker, a log parser or a hosted product that runs at the edge. The short version: name what is declared and list-verified, prove what is signed, record undocumented tokens as literal strings, and accept that the rest is a lower bound.

**Four fetchers can be named as facts.** ChatGPT-User, Claude-User, MistralAI-User and DuckAssistBot publish both a token and an IP list, and every captured request matched its list. Token plus IP match is a verifiable identity. Label it, count it, and do not block it: these requests are a person reading your page through a tool. PerplexityBot matched its list too, on paths nobody asked for; Perplexity-User is nameable the same way when it appears.

**One can be proven.** DuckAssistBot's signature verifies against a published key. That is a stronger fact than any IP list, because it survives a change of hosting and cannot be produced by a proxy pool. If you run an edge function, verifying it costs one cached key fetch and one Ed25519 check.

**One can be recorded but not named.** `User-Agent: Google` from a Google address is a fact. "Gemini" is an inference until Google documents it. Store the token as it arrived.

**One path cannot be found.** Anonymous Grok's requests sit inside the browser count of any server-side counter that relies on User-Agent strings and hosting-ASN lists, which is every one I tested here. Web Bot Auth is the mechanism that would settle this, and DuckAssistBot's capture shows it is in production: a verified signature is the only header fact a proxy pool cannot produce. No request from Anthropic, Perplexity, Mistral or xAI carried one here, and none of their hosts served a key directory when checked.

**Some reads leave no trace at the time.** Codex's and Perplexity's correct answers arrived with no request, Copilot's tool reported a result for a page it never asked for, and the one fetch that did come later was unattributable. Your logs are a lower bound on AI reading, not a measurement of it.

**Do not trust your own labels until you have seen the raw requests.** The live version of this Worker at the time of the capture did not yet recognise the `Claude-User` token, so the Claude fetches were stored as browsers with `Accept: */*` and no language header, and it filed DuckAssistBot under `DuckDuckBot`, the search crawler. Both fixes were merged and deployed later the same day.

Ten hours after this article was published I read the 42 requests its own stats page had counted as browsers. Seven were me, because owner exclusion matched an address that had since changed. Fourteen were infrastructure: the Wayback Machine archiving the page four seconds after a link was posted, a bare-metal host fetching the same URL twice at identical timestamps, a data-centre proxy network sending a referrer that no browser sends. About twenty-one were plausible readers. The classifier was missing five hosting networks and had no rule for archivers at all. Header-level captures like these are how a classifier's errors get found, and reading your own rows one by one is how you find the rest; aggregate dashboards show neither.

## AI fetcher probe method and limits

Captures were taken on 2026-09-03 in five runs, 03:55 to 04:05, 04:55 to 05:05, 05:13 to 05:15, 05:20 to 05:32 and 06:29 to 06:32 UTC, with `wrangler tail --format json` against the production Worker for gkoreli.com. Two prompt shapes were used, each in a new chat. First run:

```text
Please open this exact URL and tell me the exact text of its H1 heading and the first sentence after it: <URL>. Do not answer from memory; fetch the page.
```

Later runs:

```text
Please open this exact URL and tell me the HTTP status and the exact text of the page's main heading: <URL>. Do not answer from memory; fetch the page now.
```

The prompts, send times, assistant replies and origin matches for every attempt are in the probe log in the research directory. Vendor documentation and IP lists were fetched the same day; addresses were checked against the lists, User-Agents against the detectors, and ASNs against RIPEstat, with TypeScript scripts in the research directory. The DuckDuckGo key thumbprint was recomputed from the published JWK.

What this does not show:

- **Small, uneven samples.** ChatGPT produced six page loads from two prompts; Perplexity had seven attempts; Copilot two; Mistral one prompt and two requests; Grok five prompts and twenty-two page requests; DuckDuckGo two observations; Claude, Gemini, Claude Code and Codex one each. Headers can vary by region, plan, model and the tool the assistant chooses.
- **Perplexity-User is absent from the origin.** Seven attempts, anonymous and signed in, produced no request for the asked URL. A page not yet in Perplexity's index, or a different prompt shape, might.
- **Copilot was probed twice from one account on the web surface.** Other Copilot surfaces may use a different tool.
- **Grok's two paths are correlated with account state in five prompts.** That is not a demonstration of cause or of xAI's intent.
- **Header order is lost.** The tail event delivers headers as a map. Order is a fingerprinting signal in its own right and is not analysed here.
- **Attribution for Grok is by the assigned URL and timing**, not by any declaration from xAI. Eight requests for a URL that existed nowhere else, twice, beginning within thirty seconds of the prompt, is the evidence; a reader can repeat the probe with their own URL.
- **The first DuckDuckGo signature was matched by key id only.** The second was verified in full by the Worker.
- **Absence claims are bounded to what was checked.** "Undocumented" means absent from the named pages and files on the day; "no entry" means absent from the named lists; "no directory" means a 404 on the named hosts.

Evidence that would change the conclusions: a Google page documenting the `Google` User-Agent and its IP range; a Perplexity-User capture; any xAI documentation or a `Signature-Agent` header on an anonymous Grok request; a repeat of any run, on the same surface and account state, whose headers differ from those recorded here.

## Maintaining this reference

The site's analytics name what is declared and verified, record declared but unverified tokens as the literal string, and store the remainder as browser-shaped requests with the request facts and nothing more specific. The sixteen anonymous Grok fetches stay in the browser count with no asterisk, because no honest fact would move them. For a site whose analytics project is about believable numbers that is an uncomfortable result to publish, and publishing it is the point: the number is a lower bound, and the page that reports it says so.

The probes will be repeated monthly and this page updated in place, with differences recorded below and `lastModified` bumped when the served content changes. The next article in this series, [How I Separate Readers from Bots on a Static Blog Without JavaScript](/how-i-separate-readers-from-bots-without-javascript), describes the classifier these captures were checked against.

### Changelog

- **2026-09-03, revision 3.** Added what reading this page's own first-day requests found: of the 42 counted as browsers, seven were the author, fourteen were infrastructure and about twenty-one were plausible readers. The three classifier defects behind that are recorded in ADR-0016.4 and fixed.
- **2026-09-03, revision 2.** Corrections after an audit of the article against its artifacts: exact prompts printed; run counts, request counts and network mixes recomputed from the data files; absence claims scoped to the pages, files and lists checked; the late Codex fetch and Perplexity's answer described as hypotheses where the mechanism is inferred; Grok's undetectability scoped to the anonymous path; signing claims scoped to observed requests and served directories; the data files split into assigned probes, attributed side requests and stray requests; `lastModified` added.
- **2026-09-03, revision 1.** Published with ten assistants, the open-source detector comparison, the DuckAssistBot signature verified by key id and then in full by the Worker, and the correction of network names from Cloudflare's organisation strings to registry holders.

## Evidence ledger

**Captures, vendor documentation, IP lists, registries, signing directories and open-source detectors checked:** September 3, 2026. Fetcher behaviour is volatile; the method, the raw captures and the data files are the durable layer.

| Claim | Source | Evidence date |
|---|---|---|
| ChatGPT-User User-Agent, IP list, "robots.txt rules may not apply" | [OpenAI bots documentation](https://developers.openai.com/api/docs/bots); `openai.com/chatgpt-user.json` | 2026-09-03 |
| Claude-User purpose, robots.txt honoured, IP list | [Anthropic crawler article](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler); `claude.com/crawling/bots.json` | 2026-09-03 |
| Perplexity-User and PerplexityBot strings, "generally ignores robots.txt rules", IP lists | [Perplexity bots guide](https://docs.perplexity.ai/guides/bots); `perplexity.com/perplexity-user.json`, `perplexitybot.json` | 2026-09-03 |
| MistralAI-User string, purpose, IP list | [Mistral robots page](https://docs.mistral.ai/robots); `mistral.ai/mistralai-user-ips.json` | 2026-09-03 |
| DuckAssistBot string, purpose, IP list; that page does not mention signing | [DuckAssistBot page](https://duckduckgo.com/duckassistbot.html); `duckduckgo.com/duckassistbot.json` | 2026-09-03 |
| DuckAssistBot signing key and full verification | `https://assistbot.duckduckgo.com/.well-known/http-message-signatures-directory`, one Ed25519 key; RFC 7638 thumbprint recomputed; Worker verification row 06:29:44 UTC | 2026-09-03 |
| Who serves a signing-key directory | Seventeen vendor hosts requested; `chatgpt.com` and `assistbot.duckduckgo.com` return keys; the rest 404 or redirect. Google-Agent signing is reported by Cloudflare's signed-agents list, not observed here | 2026-09-03 |
| Web Bot Auth wire format and directory lookup | [draft-ietf-webbotauth-httpsig-protocol](https://datatracker.ietf.org/doc/draft-ietf-webbotauth-httpsig-protocol/); [cloudflare/web-bot-auth](https://github.com/cloudflare/web-bot-auth) | 2026-09-03 |
| Google's twelve user-triggered fetchers, "generally ignore robots.txt rules", no bare `Google` UA on either crawler page | [Google user-triggered fetchers](https://developers.google.com/search/docs/crawling-indexing/google-user-triggered-fetchers); [Google common crawlers](https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers); five Google IP range files | 2026-09-03 |
| Earlier undocumented Gemini UA (`GeminiiOS`) | [ppc.land report](https://ppc.land/gemini-ios-app-traffic-revealed-through-undocumented-user-agent/), [Search Engine Roundtable](https://www.seroundtable.com/geminiios-google-user-agent-40333.html) | 2025-10-27, checked 2026-09-03 |
| Grok proxy behaviour, prior observation of M247 and Datacamp | [Stackfox, Grok user agent research](https://stackfox.co/research/grok-user-agent) | February 2026, checked 2026-09-03 |
| No xAI fetcher documentation found | Searched x.ai, grok.com, xAI docs and third-party directories | 2026-09-03 |
| Chromium adds the `Headless` prefix without a display | Chromium source, `components/embedder_support/user_agent_utils.cc` | checked 2026-09-02 |
| Fetch Metadata sent by mainstream engines since Chromium 76, Firefox 90, Safari 16.4 | caniuse and mdn/browser-compat-data #27928, as recorded in the readers-vs-bots research | 2026-09-03 |
| ASN registry holders | [RIPEstat as-overview](https://stat.ripe.net/docs/02.data-api/as-overview.html) for all; [Team Cymru](https://www.team-cymru.com/ip-asn-mapping) for four; ARIN WHOIS for block organisations | 2026-09-03 |
| Cloudflare `request.cf` fields (`asn`, `asOrganization`, TLS digests) | [Cloudflare Workers request properties](https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties) | 2026-09-03 |
| No edge block of any probe | Cloudflare GraphQL `firewallEventsAdaptive`, zone gkoreli.com, 03:30 to 05:45 UTC; file `data/firewall-events-2026-09-03.json` | 2026-09-03 |
| Open-source detector verdicts | [isbot](https://github.com/omrilotan/isbot) 5.2.2, [device-detector](https://github.com/matomo-org/device-detector) `regexes/bots.yml` and node-device-detector 2.2.7, [crawler-user-agents](https://github.com/monperrus/crawler-user-agents), [ai.robots.txt](https://github.com/ai-robots-txt/ai.robots.txt), [GoatCounter isbot](https://github.com/arp242/isbot) | 2026-09-03 |
| device-detector's `^Google$` rule dates from 2023-08-07 | GitHub blame, commit a9f29e5 | 2026-09-03 |
| Datacenter IP list used for the Grok exits | [X4BNet lists_vpn, datacenter ipv4](https://github.com/X4BNet/lists_vpn), 42,797 ranges | 2026-09-03 |
| Raw captures, probe log, data files, scripts, audit | [research directory](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/ai-fetcher-headers) | 2026-09-03 |
