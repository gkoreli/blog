---
title: "Which AI Fetchers Send Which Headers, Measured on a Live Site"
seoTitle: "ChatGPT, Claude, Gemini and Grok Fetcher Headers, Measured"
alternativeHeadline: "The request headers, networks and identities of ChatGPT-User, Claude-User, Gemini, Grok, Claude Code and Codex, captured at a Cloudflare Worker"
date: "2026-09-03"
description: "What ChatGPT, Claude, Gemini, Grok, Claude Code and Codex actually send when they fetch a web page: User-Agent, Accept, Fetch Metadata, IP ranges, and who cannot be identified at all. Captured on a live Cloudflare Worker."
section: engineering
tags: [ai-agents, analytics, cloudflare-workers, http, observability, agentic-engineering]
series:
  id: "measurement-boundaries"
  title: "Measurement boundaries"
  order: 3
---

# Which AI Fetchers Send Which Headers, Measured on a Live Site

<p class="post-orient">A header-by-header record of what six AI fetchers sent to one Cloudflare Worker on September 3, 2026, checked against each vendor's own documentation and IP lists, with the raw captures published.</p>

When a person asks an AI assistant to read a web page, the assistant sends a request to that page's server. Whether the site owner can tell that request apart from a human visitor depends entirely on what the assistant chooses to put in it. I asked ChatGPT, Claude, Gemini, Grok, Claude Code and OpenAI's Codex to each open a unique URL on this site and recorded every header the server saw. Four of the six identify themselves in a way you can verify. One identifies itself with a single word that appears in no documentation. One does not identify itself at all: Grok fetched the page eight times in twelve seconds from eight networks on four continents, including a mobile carrier in Ireland and a home ISP in Brazil, wearing Safari and Chrome headers that pass every browser check my analytics have. If you count readers on your own server, those eight requests were eight people.

The findings, each explained below:

- **ChatGPT-User** is the best-behaved fetcher: documented User-Agent, published IP range that the request matched, browser-shaped `Accept` and `Accept-Language`, over HTTP/2 from Microsoft's network.
- **Claude-User** identifies itself and its IP matches Anthropic's published list, but the request carries almost nothing else: `Accept: */*`, no language, HTTP/1.1, from Google Cloud.
- **Gemini** sends `User-Agent: Google` and `Accept: */*` from a Google address that is in none of Google's five published crawler and fetcher IP lists, and "Google" matches none of the twelve user-triggered fetchers Google documents.
- **Grok** sends no token, no signature, and full browser headers from rotating proxy exits, several of them residential or mobile. There is no request fact that separates it from a person.
- **Claude Code's fetch tool** runs on the user's own machine, not on Anthropic's, and asks for Markdown before HTML.
- **Codex's web search** answered correctly about the page without ever requesting it. The origin saw nothing.

Two of these matter beyond this site. The Grok result means that server-side "human versus bot" counts on any site are inflated by an unknowable amount whenever people use Grok to read pages. The Gemini result means the largest search company in the world runs a consumer fetcher that its own crawler documentation does not describe.

## The captures

Each assistant was given a fresh chat and asked to open `https://gkoreli.com/does-llms-txt-work?probe=<name>` and quote the H1. The query string is unique per assistant, so a request carrying it can only have come from that assistant. The Worker in front of the site was tailed with `wrangler tail --format json`, which records every request header plus the network facts Cloudflare attaches: autonomous system, country, HTTP version, and TLS ClientHello fingerprints. The full captures are in the [research directory](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/ai-fetcher-headers); this section is the summary.

| Fetcher | User-Agent (as received) | `Accept` | `Accept-Language` | Fetch Metadata | Network | IP in vendor list | HTTP |
|---|---|---|---|---|---|---|---|
| ChatGPT | `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot` | browser-shaped, 8 types | `en-US,en;q=0.9` | none | AS8075 Microsoft | yes, `chatgpt-user.json` | HTTP/2 |
| Claude.ai | `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +claude-user@anthropic.com)` | `*/*` | absent | none | AS396982 Google Cloud | yes, `claude.com/crawling/bots.json` | HTTP/1.1 |
| Gemini | `Google` | `*/*` | absent | none | AS15169 Google | no (checked 5 lists) | HTTP/1.1 |
| Grok, 8 requests | Safari 26.2 on macOS (2), Chrome 143 on macOS (5), Chrome 142 (1) | browser-shaped | `en-US,en;q=0.9` | `navigate` / `document` / `none` | 8 ASNs: 3 hosting, 1 mobile carrier, 2 ISPs, 2 "Private Customer" | no | HTTP/2 |
| Claude Code | `Claude-User (claude-code/2.1.259; +https://support.anthropic.com/)` | `text/markdown, text/html, */*` | absent | none | my own ISP | not applicable | HTTP/1.1 |
| Codex CLI | no request reached the origin | | | | | | |
| Chrome, human baseline | `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36` | browser-shaped | `en-US,en;q=0.9,ka;q=0.8,ru;q=0.7` | `navigate` / `document` / `cross-site`, plus `Sec-CH-UA`, `Upgrade-Insecure-Requests` | my own ISP | | HTTP/3 |

"Fetch Metadata" means the `Sec-Fetch-Mode`, `Sec-Fetch-Dest` and `Sec-Fetch-Site` headers that every current browser engine sends on a navigation. None of the vendor fetchers send them. Grok's requests do.

Three assistants could not be tested. Perplexity, used without an account, reported three times that "the page could not be retrieved", and the origin never saw a request, so I cannot say what Perplexity-User sends. Microsoft Copilot showed a sign-in wall. Mistral's assistant and DuckDuckGo's duck.ai both gated the first message behind a terms-of-service click that I did not want an automated browser to accept. Those gaps are listed at the end with what would close them.

## ChatGPT-User: the reference behaviour

OpenAI's fetcher is what every other fetcher should be measured against. The User-Agent matches OpenAI's [published string](https://developers.openai.com/api/docs/bots) character for character. The source address, `9.129.45.186`, is inside the range OpenAI publishes at `openai.com/chatgpt-user.json`. The `Accept` header is the same list Chrome sends, `Accept-Language` is present, and the request came over HTTP/2 with an Envoy timeout header of 15 seconds, which tells you roughly how long OpenAI is willing to wait for your page.

Two things to know. First, OpenAI states plainly that "because these actions are initiated by a user, robots.txt rules may not apply" to ChatGPT-User. Second, after fetching the probe URL, ChatGPT also fetched the homepage three seconds later, unprompted. One question produced two page loads.

For a site owner, ChatGPT-User is fully nameable: token plus IP range is a fact, not a guess, and my analytics label it as such.

## Claude-User: named, verifiable, and nearly silent

Anthropic's fetcher from claude.ai also identifies itself and also came from an address in the vendor's published list. Everything else about the request is minimal: `Accept: */*`, no `Accept-Language`, HTTP/1.1, from a Google Cloud address. Anthropic's [documentation](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) names the `Claude-User` token and its purpose but does not print the full User-Agent string; I could not find the `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ...)` form above anywhere in Anthropic's documentation, so the table is the record.

One difference from OpenAI is worth noting. Anthropic says all its bots, Claude-User included, "respect 'do not crawl' signals by honoring industry standard directives in robots.txt". OpenAI, Perplexity and Google all say the opposite for their user-triggered fetchers: robots.txt "may not apply" or is "generally ignored" because a person asked. Anthropic is the only one of the four that documents robots.txt as binding on its on-demand fetcher.

Claude Code's fetch tool is a different animal that happens to share the token. Its request came from my own residential IP, because the tool runs inside the CLI on the user's machine. It sent `Accept: text/markdown, text/html, */*`. That is the first request I have seen in this site's logs that asks for Markdown before HTML. This site has content negotiation for Markdown merged but not yet deployed, so it got HTML. After the deploy it will get the post's Markdown source, and the observation row will say so.

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

Attribution rests on the probe string: nobody but Grok was ever given that URL, and the requests arrived within thirty seconds of the prompt. The pattern is not new. A [February 2026 experiment by Stackfox](https://stackfox.co/research/grok-user-agent) used the same method and saw Chrome and iPhone Safari User-Agents from rotating datacenter proxy providers. What this capture adds is that the exits now include a mobile carrier's subscriber pool and consumer ISPs on four continents, and that a single question produces eight fetches, not one. xAI publishes no fetcher documentation, no User-Agent token, and no IP list that I or the other researchers who have looked could find.

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

Three things fall out. The declared fetchers are named identically everywhere; on ChatGPT-User and Claude-User the open-source consensus and my Worker agree. The bare `Google` string is known to exactly one detector, and that detector files it under Googlebot as search crawling, so every Matomo installation counts a person reading through Gemini as Google indexing the page. And Grok passes every check, because there is nothing to match: ai.robots.txt, whose whole purpose is to let sites express AI-agent policy in robots.txt, has no xAI entry and cannot have one. GoatCounter's IP-range rules would catch one of the eight exits, the one at Servers.com. Isbot's own pattern for Claude Code, `^claude-code/`, does not match the real string either, which starts with `Claude-User`; the request is caught by a different pattern. Each of those is a pull request I will open with this capture as the evidence, and the results table lives in the research directory with the exact files checked.

## What this means if you run a site

This section is for anyone who counts visitors on their own server, whether with a Worker, a log parser, or a hosted product that runs at the edge.

**Three of the fetchers can be named as facts.** ChatGPT-User, Claude-User and (once its request is seen) Perplexity-User publish both a token and an IP list. Token plus IP match is a verifiable identity. Label it, count it, and do not block it: these requests are a person reading your page through a tool.

**One can be recorded but not named.** `User-Agent: Google` from a Google address is a fact. "Gemini" is an inference until Google documents it. Store the token as it arrived.

**One cannot be found.** Grok's requests will sit inside your browser count, and inside Cloudflare's, Plausible's, GoatCounter's and everyone else's, until xAI either adds a token or signs its requests. The one mechanism that would settle this is Web Bot Auth, the IETF draft in which an agent signs each request with a key published at a well-known URL. OpenAI's ChatGPT agent and Google's Google-Agent sign today. Anthropic, Perplexity and xAI do not. A verified signature is the only header fact that cannot be spoofed by a proxy pool; everything else in this article can be.

**Some reads leave no trace at all.** Search-index answers like Codex's never reach you. Your logs are a floor on AI readership, not a measurement of it.

**Do not trust your own labels until you have seen the raw requests.** The live version of my Worker at the time of the capture did not yet recognise the `Claude-User` token, so the Claude fetches were stored as browsers with `Accept: */*` and no language header. The fix was already merged and not deployed. Header-level captures like these are how you find out your classifier is wrong; aggregate dashboards never tell you.

## Method and limits

Captures were taken on 2026-09-03 between 03:55 and 04:05 UTC with `wrangler tail --format json` against the production Worker for gkoreli.com. Each assistant received the prompt "Please open this exact URL and tell me the exact text of its H1 heading and the first sentence after it: <URL>. Do not answer from memory; fetch the page." in a new chat. ChatGPT (Pro), Claude.ai (Max) and Gemini were used with logged-in accounts; Grok and Perplexity were used anonymously. Vendor documentation and IP lists were fetched the same day; the addresses were checked against them with a script that is in the research directory.

What this does not show:

- **One request each.** ChatGPT, Claude and Gemini were probed once. Headers can vary by region, plan, model, or the tool the assistant chooses. Grok's eight requests came from one prompt.
- **Perplexity is missing.** Three anonymous attempts produced no origin request. A logged-in attempt, or a different prompt shape, might. Perplexity documents `Perplexity-User` with an IP list, so it is nameable in principle.
- **Copilot, Mistral and DuckDuckGo are missing** because of sign-in and terms gates I chose not to click through with an automated browser.
- **Header order is lost.** The tail event delivers headers as a map. Order is a fingerprinting signal in its own right and is not analysed here.
- **Attribution for Grok is by timing and the unique URL**, not by any declaration from xAI. I consider eight requests for a URL that existed nowhere else, within thirty seconds of the prompt, conclusive; a reader who wants stronger evidence can repeat the probe with their own URL.

Evidence that would change the conclusions: a Google page documenting the `Google` User-Agent and its IP range; a Perplexity capture; any xAI documentation or a `Signature-Agent` header on a Grok request; a second round of probes showing different headers from the same vendors.

## What I am doing with this

The site's analytics will name what is declared and verified, record what is declared and unverified as the literal token, and stop pretending the remainder is anything more specific than "a browser-shaped request". The eight Grok fetches stay in the browser count with no asterisk, because there is no honest fact that would move them. That is uncomfortable for a site whose whole analytics project is about believable numbers, and the discomfort is the point: the number is a floor, and the article that reports it should say so.

The captures will be repeated monthly and this page updated in place with a dated changelog, so the table above stays a reference rather than a snapshot. If a vendor changes its headers, the change will show here first.

Previously in this series: [Does llms.txt Work?](/does-llms-txt-work) tested what agents are supposed to read, and [How I Built First-Party Analytics for a Personal Blog](/first-party-analytics-for-a-personal-blog) built the counter that this article is now checking.
