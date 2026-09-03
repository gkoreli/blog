---
title: "Which AI Fetchers Send Which Headers, Measured on a Live Site"
seoTitle: "ChatGPT, Claude, Gemini and Grok Fetcher Headers, Measured"
alternativeHeadline: "The request headers, networks, IP lists and signatures of ChatGPT-User, Claude-User, MistralAI-User, DuckAssistBot, Gemini, Grok, Perplexity, Copilot, Claude Code and Codex, captured at a Cloudflare Worker"
date: "2026-09-03"
description: "What ChatGPT, Claude, Gemini, Grok, Perplexity, Copilot, Mistral, DuckDuckGo, Claude Code and Codex actually send when they fetch a web page: User-Agent, Accept, Fetch Metadata, IP ranges, Web Bot Auth signatures, and who cannot be identified at all. Captured on a live Cloudflare Worker."
section: engineering
tags: [ai-agents, analytics, cloudflare-workers, http, observability, agentic-engineering]
series:
  id: "measurement-boundaries"
  title: "Measurement boundaries"
  order: 3
---

# Which AI Fetchers Send Which Headers, Measured on a Live Site

<p class="post-orient">A header-by-header record of what ten AI fetchers sent to one Cloudflare Worker on September 3, 2026, checked against each vendor's own documentation, IP lists and signing keys, with the raw captures published.</p>

When a person asks an AI assistant to read a web page, the assistant sends a request to that page's server. Whether the site owner can tell that request apart from a human visitor depends entirely on what the assistant chooses to put in it. I asked ChatGPT, Claude, Gemini, Grok, Perplexity, Copilot, Mistral, DuckDuckGo, Claude Code and OpenAI's Codex to each open a unique URL on this site and recorded every header the server saw. Five identify themselves in a way you can verify against a vendor list. One, DuckDuckGo's, goes further and signs every request with a published key, the only fetcher in the set that proves who it is. One identifies itself with a single word that appears in no documentation. Three reported a result about the page without ever requesting it. And one does not identify itself at all: Grok fetched the page eight times in twelve seconds from eight networks on four continents, including a mobile carrier in Ireland and a home ISP in Brazil, wearing Safari and Chrome headers that pass every browser check my analytics have. A second run an hour later produced eight more, from eight different networks. If you count readers on your own server, those sixteen requests were sixteen people.

The findings, each explained below:

- **ChatGPT-User** is the best-behaved classic fetcher: documented User-Agent, published IP range that the request matched, browser-shaped `Accept` and `Accept-Language`, over HTTP/2 from Microsoft's network.
- **Claude-User** identifies itself and its IP matches Anthropic's published list, but the request carries almost nothing else: `Accept: */*`, no language, HTTP/1.1, from Google Cloud.
- **MistralAI-User** matches its documentation and IP list and sends the most complete browser header set of any declared fetcher, Fetch Metadata included, from Azure.
- **DuckAssistBot** is the only fetcher that signed: a Web Bot Auth signature whose key id matches the Ed25519 key at its well-known directory. Its documentation does not mention this.
- **Gemini** sends `User-Agent: Google` and `Accept: */*` from a Google address that is in none of Google's five published crawler and fetcher IP lists, and "Google" matches none of the twelve user-triggered fetchers Google documents.
- **Grok** sends no token, no signature, and full browser headers from rotating proxy exits, several of them residential or mobile. There is no request fact that separates it from a person. The pattern reproduced exactly on a second run.
- **Perplexity** reported "HTTP 200 OK" and the correct heading for a real page without any request reaching the origin, and reported a fetch failure for an unknown path, also without a request. Logged in, it did the same, and instead dispatched its search crawler to `robots.txt`, `/about` and `/essays`.
- **Copilot**, logged in, reported twice that its fetch tool "returned an empty result". No request reached the origin, and Cloudflare's edge firewall log shows nothing was blocked.
- **Claude Code's fetch tool** runs on the user's own machine, not on Anthropic's, and asks for Markdown before HTML.
- **Codex's web search** answered correctly about the page without ever requesting it.

Three of these matter beyond this site. The Grok result means that server-side "human versus bot" counts on any site are inflated by an unknowable amount whenever people use Grok to read pages. The Gemini result means the largest search company in the world runs a consumer fetcher that its own crawler documentation does not describe. The DuckDuckGo result means the mechanism that would fix both already runs in production at a mainstream assistant, and the others have simply not adopted it.

## The captures

Each assistant was given a fresh chat and asked to open a URL unique to it, either `https://gkoreli.com/does-llms-txt-work?probe=<name>` or, in the second run, `https://gkoreli.com/probe/<name>`, and quote the heading. A request carrying that URL can only have come from that assistant. The second form returns a 404, which the Worker logs like any other request; it was used to test whether fetchers that failed on the query-string form would fetch a plain path. The Worker in front of the site was tailed with `wrangler tail --format json`, which records every request header plus the network facts Cloudflare attaches: autonomous system, country, HTTP version, and TLS ClientHello fingerprints. The full captures are in the [research directory](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/ai-fetcher-headers); this section is the summary.

| Fetcher | User-Agent (as received) | `Accept` | `Accept-Language` | Fetch Metadata | Network | IP in vendor list | HTTP |
|---|---|---|---|---|---|---|---|
| ChatGPT | `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot` | browser-shaped, 8 types | `en-US,en;q=0.9` | none | AS8075 Microsoft | yes, `chatgpt-user.json` | HTTP/2 |
| Claude.ai | `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +claude-user@anthropic.com)` | `*/*` | absent | none | AS396982 Google Cloud | yes, `claude.com/crawling/bots.json` | HTTP/1.1 |
| Mistral (Vibe), 2 requests | `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; MistralAI-User/1.0; +https://docs.mistral.ai/robots)` | browser-shaped, plus `application/json` | `en-US,en;q=0.9` (first request) | `navigate` / `document` / `none`, `Sec-Fetch-User: ?1`, `Sec-CH-UA`, `Cache-Control: no-cache` (first request); none (second) | AS8075 Microsoft | yes, `mistralai-user-ips.json` | HTTP/2 |
| DuckDuckGo duck.ai | `DuckAssistBot/1.2; (+http://duckduckgo.com/duckassistbot.html)` | `*/*` | absent | none, but `Signature`, `Signature-Input`, `Signature-Agent: "https://assistbot.duckduckgo.com"` | AS8075 Microsoft | yes, `duckassistbot.json`; signature key verified | HTTP/2 |
| Gemini | `Google` | `*/*` | absent | none | AS15169 Google | no (checked 5 lists) | HTTP/1.1 |
| Grok, run 1, 8 requests | Safari 26.2 on macOS (2), Chrome 143 on macOS (5), Chrome 142 (1) | browser-shaped | `en-US,en;q=0.9` | `navigate` / `document` / `none` | 8 ASNs: 3 hosting, 1 mobile carrier, 2 ISPs, 2 "Private Customer" | no | HTTP/2 |
| Grok, run 2, 8 requests | Safari 26.2 (4), Chrome 143 (2), Chrome 142 (2) | browser-shaped | `en-US,en;q=0.9` | `navigate` / `document` / `none` | 8 different ASNs: 4 hosting or transit, 3 ISPs (two Brazilian, one US), 1 personal ASN | no | HTTP/2 |
| Perplexity, 7 attempts | no request for any probe URL; PerplexityBot crawled 3 other paths | `PerplexityBot/1.0` with `From: crawler-support@perplexity.ai`, no `Accept` | absent | none | AS14618 Amazon | yes, `perplexitybot.json` | HTTP/1.1 |
| Copilot, 2 attempts | no request reached the origin | no request | no request | no request | no request | no request | no request |
| Claude Code | `Claude-User (claude-code/2.1.259; +https://support.anthropic.com/)` | `text/markdown, text/html, */*` | absent | none | my own ISP | not applicable, runs locally | HTTP/1.1 |
| Codex CLI web search | no request reached the origin | no request | no request | no request | no request | no request | no request |
| Chrome, human baseline | `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36` | browser-shaped | `en-US,en;q=0.9,ka;q=0.8,ru;q=0.7` | `navigate` / `document` / `cross-site`, plus `Sec-CH-UA`, `Upgrade-Insecure-Requests` | my own ISP | not applicable, a person | HTTP/3 |

"Fetch Metadata" means the `Sec-Fetch-Mode`, `Sec-Fetch-Dest` and `Sec-Fetch-Site` headers that every current browser engine sends on a navigation. Of the declared fetchers only Mistral's first request sends them, which suggests a real browser engine behind that fetch. Grok's requests all do.

Every assistant in the table was reached. Copilot demands a sign-in and was probed from my own account; ChatGPT, Claude and Gemini also used logged-in sessions; the rest were used anonymously. For every "no request" row I also pulled Cloudflare's firewall event log for the zone over the same hours to make sure the edge had not blocked the fetch before it reached the Worker. It had not: the only blocks in that window were exploit scans against the homepage.

## ChatGPT-User: the reference behaviour

OpenAI's fetcher is what every other fetcher should be measured against. The User-Agent matches OpenAI's [published string](https://developers.openai.com/api/docs/bots) character for character. The source address, `9.129.45.186`, is inside the range OpenAI publishes at `openai.com/chatgpt-user.json`. The `Accept` header is the same list Chrome sends, `Accept-Language` is present, and the request came over HTTP/2 with an Envoy timeout header of 15 seconds, which tells you roughly how long OpenAI is willing to wait for your page.

The ChatGPT mobile app uses the same fetcher: a probe sent from the iPhone app produced one request with an identical User-Agent and header set, again from an address in OpenAI's list.

Two things to know. First, OpenAI states plainly that "because these actions are initiated by a user, robots.txt rules may not apply" to ChatGPT-User. Second, after fetching the probe URL, ChatGPT also fetched the homepage three seconds later, unprompted. One question produced two page loads.

For a site owner, ChatGPT-User is fully nameable: token plus IP range is a fact, not a guess, and my analytics label it as such.

## Claude-User: named, verifiable, and nearly silent

Anthropic's fetcher from claude.ai also identifies itself and also came from an address in the vendor's published list. Everything else about the request is minimal: `Accept: */*`, no `Accept-Language`, HTTP/1.1, from a Google Cloud address. Anthropic's [documentation](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) names the `Claude-User` token and its purpose but does not print the full User-Agent string; I could not find the `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ...)` form above anywhere in Anthropic's documentation, so the table is the record.

One difference from OpenAI is worth noting. Anthropic says all its bots, Claude-User included, "respect 'do not crawl' signals by honoring industry standard directives in robots.txt". OpenAI, Perplexity and Google all say the opposite for their user-triggered fetchers: robots.txt "may not apply" or is "generally ignored" because a person asked. Anthropic is the only one of the four that documents robots.txt as binding on its on-demand fetcher.

Claude Code's fetch tool is a different animal that happens to share the token. Its request came from my own residential IP, because the tool runs inside the CLI on the user's machine. It sent `Accept: text/markdown, text/html, */*`. That is the first request I have seen in this site's logs that asks for Markdown before HTML. This site has content negotiation for Markdown merged but not yet deployed, so it got HTML. After the deploy it will get the post's Markdown source, and the observation row will say so.

## MistralAI-User: a browser behind the token

Mistral's assistant, now branded Vibe, produced two requests for its probe URL within the same second, both from Azure addresses inside Mistral's [published list](https://docs.mistral.ai/robots) and both carrying the documented `MistralAI-User/1.0` User-Agent. The first looks like a real browser engine: Chrome's `Accept` list with `application/json` added, `Accept-Language`, the full Fetch Metadata set including `Sec-Fetch-User: ?1`, `Sec-CH-UA` client hints, and `Cache-Control: no-cache`. The second is a bare HTTP client with an `Accept` list and, oddly, a `Content-Length` header on a GET. Two fetch paths, one token, one question.

Mistral's documentation says the fetcher "handles user actions in Vibe" and is "not used for crawling the web in any automatic fashion, nor to crawl content for generative AI training". It does not say whether robots.txt binds it. For a site owner it is fully nameable: token plus IP list.

## DuckAssistBot: the only fetcher that proves who it is

DuckDuckGo's duck.ai fetched its probe URL once, from an Azure address inside DuckDuckGo's [published list](https://duckduckgo.com/duckassistbot.html), with the documented `DuckAssistBot/1.2` User-Agent and `Accept: */*`. Then it did something no other fetcher in this study did. It signed the request:

```text
signature-agent: "https://assistbot.duckduckgo.com"
signature-input: sig1=("@authority" "signature-agent");created=1788411572;expires=1788412172;keyid="Ov3HDsa8JQ39dPEYFvFFN-cUpnz9yNI8LDvr-5LeiBM";alg="ed25519";tag="web-bot-auth"
signature: sig1=:NBrgbVdKFeZEFLnpQx0osM5xAZ5wfGP1TBvYC2NBrYycNLKuX7EU+lsLxylIYn8A0f3zshL8IZRdP+fj3VkzBA==:
```

This is [Web Bot Auth](https://datatracker.ietf.org/doc/draft-ietf-webbotauth-httpsig-protocol/), the IETF draft that applies RFC 9421 HTTP Message Signatures to automated traffic. The `Signature-Agent` header names a host; that host serves a key directory at `/.well-known/http-message-signatures-directory`; the `keyid` is the RFC 7638 thumbprint of the signing key. I fetched DuckDuckGo's directory. It holds one Ed25519 key, its thumbprint is `Ov3HDsa8JQ39dPEYFvFFN-cUpnz9yNI8LDvr-5LeiBM`, and that is the key id in the captured request. The directory response is itself signed. A Worker with `crypto.subtle` can verify the signature over `@authority` and `Signature-Agent` and know, not infer, that the request came from DuckDuckGo. Cloudflare's [bot directory](https://radar.cloudflare.com/bots/directory/duckassistbot) already lists DuckAssistBot as a verified bot.

DuckDuckGo's own documentation for the bot does not mention signing at all. The one vendor doing the right thing is not advertising it. Until this capture, the public record of who signs was OpenAI's ChatGPT agent and Google's Google-Agent; DuckAssistBot belongs on that list.

## Perplexity: answers without requests

Perplexity was given seven chances, five anonymous and two from a logged-in account. Anonymously: three times it was asked to open a query-string probe URL and reported that "the page could not be retrieved"; once it was asked to open a plain 404 path and reported "Failed to fetch content"; once it was asked to open a real, existing post with no query string, and it answered "The page returned successfully (HTTP 200 OK)" with the correct H1. The origin saw none of the five. The "200 OK" came from Perplexity's index, and the tool presented an index hit as a live fetch with a status code.

Logged in, the two probes went the same way: the unknown path "still cannot be retrieved" and the real post answered correctly, with neither URL requested. But this time something did arrive. Within the same second, three requests from Amazon addresses inside Perplexity's [published `PerplexityBot` range](https://docs.perplexity.ai/guides/bots) fetched `/robots.txt`, `/about` and `/essays`, each carrying the `PerplexityBot/1.0` User-Agent and a `From: crawler-support@perplexity.ai` header. Perplexity's reply said it had "searched for the exact path". So a logged-in user asking for one URL triggered the search crawler against three other pages of the site, robots.txt first, and never the page that was asked for. Attribution here is by timing: PerplexityBot also crawls this site on its own schedule, but a three-request burst starting with robots.txt in the second the prompt was sent is not its routine pattern.

`Perplexity-User`, the fetcher Perplexity documents for exactly this situation, did not appear in any of the seven attempts. It is nameable by token and IP list when it does appear; on this site, for these prompts, it did not.

## Copilot: an empty result, twice

Microsoft Copilot, signed in, was asked twice to open its probe URL. Both times it said its fetch tool "returned an empty result" with "no HTTP status code, no HTML, no text, no error message", and it offered the usual explanations: the server blocks automated requests, the page needs JavaScript, the response type could not be parsed. None of those happened. The origin received no request at all, and the zone's edge firewall log for that hour contains no block, challenge, or rate limit for any Copilot, Bing, or Microsoft address. Whatever Copilot's fetch tool does with a URL it has never indexed, it does not fetch it. Microsoft documents `bingbot` and `MicrosoftPreview` but, as far as I can find, no on-demand fetcher for Copilot chat, which is consistent with what the log shows.

## Gemini: one word, no documentation

The Gemini app fetched the page with `User-Agent: Google`. Not `Googlebot`, not `Google-Agent`, not `Google-GeminiNotebook`. Just the company name.

Google maintains a [page listing its user-triggered fetchers](https://developers.google.com/search/docs/crawling-indexing/google-user-triggered-fetchers): twelve of them, each with a full User-Agent string and an IP range file. `Google` on its own is not among them. The source address, in Google's own AS15169, is not in `googlebot.json`, `special-crawlers.json`, `user-triggered-fetchers.json`, `user-triggered-fetchers-google.json` or `user-triggered-agents.json`. I checked all five on the day of the capture.

So the fetcher behind the consumer Gemini app is undocumented on the page Google wrote for exactly this purpose. A site owner sees a request from a Google address with a one-word User-Agent and has no vendor statement to match it against. My analytics can record the literal token `Google` as a fact. They cannot call it Gemini, because Google has not said so.

## Grok: indistinguishable from people, by design

This is the finding that changes what server-side analytics can claim.

Grok, used anonymously in "Fast" mode, showed a tool step reading "Opened page gkoreli.com/does-llms-txt-work?probe=grok" and quoted the H1 correctly. The origin saw eight requests for that URL between 04:03:18 and 04:03:30 UTC:

| Time (UTC) | Network | Country | Claimed browser |
|---|---|---|---|
| 04:03:18 | AS9009 Aventice LLC (hosting) | US | Safari 26.2, macOS |
| 04:03:18 | AS3257 Web2Objects LLC (hosting) | US | Safari 26.2, macOS |
| 04:03:18 | AS132817 DZCRD Networks Ltd (ISP) | Netherlands | Chrome 143, macOS |
| 04:03:18 | AS13280 Three Ireland, Mobile Subscriber Pools | Ireland | Chrome 143, macOS |
| 04:03:18 | AS262988 Pombonet Telecomunicações (ISP) | Brazil | Chrome 143, macOS |
| 04:03:19 | AS212238 "Private Customer" | South Africa | Chrome 143, macOS |
| 04:03:22 | AS7979 Servers.com (hosting) | US | Chrome 142, macOS |
| 04:03:30 | AS398781 "Private Customer" | US | Chrome 143, macOS |

Every request carried a complete browser header set: a Safari or Chrome User-Agent, Chrome's exact `Accept` list, `Accept-Language: en-US,en;q=0.9`, `Sec-Fetch-Mode: navigate`, `Sec-Fetch-Dest: document`, `Sec-Fetch-Site: none`, `Priority: u=0, i`, and on the Chrome-claiming requests the `Sec-CH-UA` client hints with matching version numbers. The words "Grok" and "xAI" appear nowhere. There is no `Signature-Agent` header. The TLS fingerprints differ from request to request, so this is not one client behind eight addresses; it is several client stacks.

An hour later I asked Grok again, anonymously, for a different unique URL. Eight requests again, in six seconds, from eight networks none of which appeared in the first run: two hosting providers, a transit carrier, two Brazilian ISPs including Claro, a US fibre ISP, a small host, and an autonomous system registered to an individual's name. Same Safari and Chrome header sets, same absence of any token.

Attribution rests on the probe string: nobody but Grok was ever given either URL, and the requests arrived within thirty seconds of each prompt. The pattern is not new. A [February 2026 experiment by Stackfox](https://stackfox.co/research/grok-user-agent) used the same method and saw Chrome and iPhone Safari User-Agents from rotating datacenter proxy providers. What this capture adds is that the exits now include a mobile carrier's subscriber pool and consumer ISPs on four continents, and that a single question produces eight fetches, not one. xAI publishes no fetcher documentation, no User-Agent token, and no IP list that I or the other researchers who have looked could find.

For counting purposes: my Worker classified all eight as browsers, and it was right to. The rule it applies, described in [How I Built First-Party Analytics for a Personal Blog](/first-party-analytics-for-a-personal-blog) and refined since, is that a request with a browser User-Agent, navigation-shaped Fetch Metadata, and a network that is not a known hosting provider is recorded as a browser. Five of the eight requests came from networks that are not hosting providers by any list I would trust. The rule cannot separate them from readers, and neither can any other server-side rule I know of. Grok's traffic is a human-shaped hole in every server-side audience count on the web.

## Codex: the fetch that never happened

I ran OpenAI's Codex CLI with its web search tool enabled and asked it to open the probe URL. It printed a search step with the URL, then answered with the exact H1 and a link to the page. The origin never received a request with `probe=codex-search`. Neither the tail nor the database has one.

The page's content came from OpenAI's search index, which had the article from earlier crawls, and the tool presented that as having opened the URL. For the reader the answer was correct. For the site owner it is a read that no server log will ever show. Whatever share of AI reading happens this way is invisible to first-party analytics by construction, and no amount of header work recovers it.

## What the open-source detectors make of these requests

Most sites do not write their own classifier. They use a library. So I ran the six captured User-Agent strings through the detectors the open-source world actually ships: [isbot](https://github.com/omrilotan/isbot) 5.2.2 (the npm package), Matomo's [device-detector](https://github.com/matomo-org/device-detector) bot list, [crawler-user-agents](https://github.com/monperrus/crawler-user-agents), the [ai.robots.txt](https://github.com/ai-robots-txt/ai.robots.txt) registry, and GoatCounter's [isbot](https://github.com/arp242/isbot) rules, all at their current `main` on the day of the capture.

| Captured User-Agent | isbot | device-detector | crawler-user-agents | ai.robots.txt |
|---|---|---|---|---|
| ChatGPT-User | bot | `ChatGPT-User` | `ChatGPT-User` | listed, OpenAI |
| Claude-User | bot | `Claude-User` | `Claude-User` | listed, Anthropic |
| `Google` | bot, generic `google` pattern | `Googlebot`, "Search bot" | no match | no entry |
| Claude Code | bot | `Claude-User` | `Claude-User` | `Claude-Code`, operator "unclear" |
| Grok, Safari UA | not a bot | no match | no match | no entry |
| Grok, Chrome UA | not a bot | no match | no match | no entry |

Three things fall out. The declared fetchers are named identically everywhere; on ChatGPT-User and Claude-User the open-source consensus and my Worker agree. The bare `Google` string is known to exactly one detector, and that detector files it under Googlebot as search crawling, by a rule added in August 2023, months before the Gemini app existed. So every Matomo installation counts a person reading through Gemini as Google indexing the page. And Grok passes every check, because there is nothing to match: ai.robots.txt, whose whole purpose is to let sites express AI-agent policy in robots.txt, has no xAI entry and cannot have one. GoatCounter's IP-range rules would catch one of the eight exits, the one at Servers.com. Isbot's own pattern for Claude Code, `^claude-code/`, does not match the real string either, which starts with `Claude-User`; the request is caught by a different pattern. Each of those is a pull request I will open with this capture as the evidence, and the results table lives in the research directory with the exact files checked.

## What this means if you run a site

This section is for anyone who counts visitors on their own server, whether with a Worker, a log parser, or a hosted product that runs at the edge.

**Four of the fetchers can be named as facts.** ChatGPT-User, Claude-User, MistralAI-User and DuckAssistBot publish both a token and an IP list, and every captured request matched its list. Token plus IP match is a verifiable identity. Label it, count it, and do not block it: these requests are a person reading your page through a tool. Perplexity-User is nameable the same way when it appears.

**One can be proven.** DuckAssistBot's signature verifies against a published key. That is a stronger fact than any IP list, because it survives a change of hosting and cannot be produced by a proxy pool. If you run an edge function, verifying it costs one cached key fetch and one Ed25519 check.

**One can be recorded but not named.** `User-Agent: Google` from a Google address is a fact. "Gemini" is an inference until Google documents it. Store the token as it arrived.

**One cannot be found.** Grok's requests will sit inside your browser count, and inside Cloudflare's, Plausible's, GoatCounter's and everyone else's, until xAI either adds a token or signs its requests. Web Bot Auth is the mechanism that would settle this, and DuckDuckGo's capture shows it is not theoretical: OpenAI's ChatGPT agent, Google's Google-Agent and DuckAssistBot sign today. Anthropic, Perplexity, Mistral and xAI do not. A verified signature is the only header fact that cannot be spoofed by a proxy pool; everything else in this article can be.

**Some reads leave no trace at all.** Index answers like Codex's and Perplexity's never reach you, even when the assistant reports a status code, and Copilot's tool reported a result for a page it never asked for. Your logs are a floor on AI readership, not a measurement of it.

**Do not trust your own labels until you have seen the raw requests.** The live version of my Worker at the time of the capture did not yet recognise the `Claude-User` token, so the Claude fetches were stored as browsers with `Accept: */*` and no language header, and it filed DuckAssistBot under `DuckDuckBot`, the search crawler. Both fixes were already merged and not deployed. Header-level captures like these are how you find out your classifier is wrong; aggregate dashboards never tell you.

## Method and limits

Captures were taken on 2026-09-03 in four runs, 03:55 to 04:05, 04:55 to 05:05, 05:13 to 05:15 and 05:20 to 05:23 UTC, with `wrangler tail --format json` against the production Worker for gkoreli.com. Each assistant received a prompt of the form "Please open this exact URL and tell me the exact text of its main heading: <URL>. Do not answer from memory; fetch the page." in a new chat. ChatGPT (Pro, web and iPhone app), Claude.ai (Max), Gemini, Copilot and the second Perplexity pair were used with logged-in accounts; Grok, Perplexity, Mistral and duck.ai were used anonymously. For every row with no origin request, the zone's firewall events (Cloudflare GraphQL `firewallEventsAdaptive`) for the surrounding hours were checked for blocks or challenges; none matched. Vendor documentation and IP lists were fetched the same day; the addresses were checked against them, and the captured strings were run through the open-source detectors, with TypeScript scripts that are in the research directory. The DuckDuckGo key thumbprint was recomputed from the published JWK.

What this does not show:

- **One or two requests each.** Most fetchers were probed once. Headers can vary by region, plan, model, or the tool the assistant chooses. Grok's sixteen requests came from two prompts.
- **Perplexity-User is absent from the origin.** Seven attempts, anonymous and logged in, produced no request for the asked URL. A page not yet in Perplexity's index, or a different prompt shape, might.
- **Copilot was probed twice from one account.** A different Copilot surface (Edge sidebar, Windows, Microsoft 365) may use a different tool.
- **Header order is lost.** The tail event delivers headers as a map. Order is a fingerprinting signal in its own right and is not analysed here.
- **Attribution for Grok is by timing and the unique URL**, not by any declaration from xAI. I consider eight requests for a URL that existed nowhere else, within thirty seconds of the prompt, twice, conclusive; a reader who wants stronger evidence can repeat the probe with their own URL.
- **The DuckDuckGo signature was matched by key id, not re-verified byte for byte.** The Worker code to verify it is merged and not yet deployed; when it is, the observation row will carry the verified agent host.

Evidence that would change the conclusions: a Google page documenting the `Google` User-Agent and its IP range; a Perplexity capture; any xAI documentation or a `Signature-Agent` header on a Grok request; a second round of probes showing different headers from the same vendors.

## What I am doing with this

The site's analytics will name what is declared and verified, record what is declared and unverified as the literal token, and stop pretending the remainder is anything more specific than "a browser-shaped request". The eight Grok fetches stay in the browser count with no asterisk, because there is no honest fact that would move them. That is uncomfortable for a site whose whole analytics project is about believable numbers, and the discomfort is the point: the number is a floor, and the article that reports it should say so.

The captures will be repeated monthly and this page updated in place with a dated changelog, so the table above stays a reference rather than a snapshot. If a vendor changes its headers, the change will show here first.

Previously in this series: [Does llms.txt Work?](/does-llms-txt-work) tested what agents are supposed to read, and [How I Built First-Party Analytics for a Personal Blog](/first-party-analytics-for-a-personal-blog) built the counter that this article is now checking.
