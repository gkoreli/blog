---
title: "How I Separate Readers from Bots on a Static Blog Without JavaScript"
seoTitle: "Readers vs Bots on a Static Blog: Edge Analytics Without JavaScript"
alternativeHeadline: "A server-side counter reported eleven times more readers than a script-based one. Two request facts fix most of the gap. The rest is traffic no rule can separate from readers, and you should know its size."
date: "2026-09-03"
description: "Server-side visitor counts are inflated by browser-shaped automation, and the popular open-source tools do not catch it. Here is the ten-minute test that shows your gap, the two rules that close most of it without a script, what AI readership really looks like on a small site, and the traffic no rule can separate from readers."
section: engineering
tags: [analytics, cloudflare-workers, http, bots, ai-agents, observability]
series:
  id: "measurement-boundaries"
  title: "Measurement boundaries"
  order: 4
---

# How I Separate Readers from Bots on a Static Blog Without JavaScript

<p class="post-orient">If you count visitors on your own server, your number is probably several times too high, and the tools you trust are not catching it. This is the ten-minute test that shows the gap, the two request facts that close most of it without a script, what AI readership looks like once the count is honest, and the traffic no rule can separate from readers.</p>

My site counts every page load at the edge, in a Cloudflare Worker, with no JavaScript and nothing for a reader to block. For a week it reported 578 daily readers. A script-based counter on the same pages, over the same days, reported 52 visits. Eleven to one. The gap was not a bug. It was browser-shaped automation, counted as people, by a rule that every server-side counter I have read applies: if the User-Agent says browser, it is a browser. The fix is two facts the request already carries, and it works on any edge or log-based counter. What the rules cannot separate is a known share of traffic, and its size should be published rather than hidden.

What you will take from this:

- **A ten-minute test.** Put any script-based counter beside your server count for a week. If the ratio is more than about two, you have the problem this article is about.
- **Two rules that close most of the gap.** A hosting network is a verdict on its own. A missing Fetch Metadata header is a verdict only when the browser version says it should be there. On my site the first rule alone removed the largest cluster: 374 page loads from one Google Cloud client calling itself Chrome Mobile 114, which passed every header check.
- **What the tools you trust actually check.** I read the classifier code of Matomo, Plausible, GoatCounter, Umami, and `isbot`. Four of five are User-Agent matching and nothing else. None reads Fetch Metadata. `isbot`'s README says it does not try to catch clients disguised as browsers.
- **What AI readership looks like on a small site.** Once the count is honest: 33 reads through ChatGPT in a month, on eight pages, against crawlers that touch every page once. The composition table on my stats page now answers "which AI is reading what" per article.
- **What no rule can separate.** Grok, and any assistant driving a browser on a person's device, sends a person's request. My count is a lower bound, and the page says so.

## The ten-minute test

Server-side counters and script-based counters measure different populations, and the difference is the automation. A script runs only in a browser that executes JavaScript. A server-side counter sees every request that claims to be a browser. If you run one, borrow the other for a week: Cloudflare Web Analytics, Plausible's script, GoatCounter's script, anything that needs the page to render. Compare page views to page views and visitors to visits, and expect the units to differ a little.

Mine, for the seven days ending September 2, with the script counter set to exclude bots:

| Source | Page views | Readers |
|---|---:|---:|
| Edge counter, browser User-Agents | 1,209 | 578 daily clients |
| Script counter, same pages, same days | 113 | 52 visits |

The script misses readers who block scripts, and the windows do not align to the hour, so the honest expectation is a ratio under two. Eleven is a different population.

The day I noticed, the edge count said 113 daily readers. One hundred of the 113 loaded exactly one page. 156 of the day's 164 page loads carried no referrer. One "mobile" client fetched 31 different pages in one second. That is what a fake day looks like from inside, and it looks like a good day from the dashboard. My note to the agent that night, verbatim:

> i am seeing daily clients as 113 for today, and it seems unbelievable to me, like which articles are they reading, where are they coming from and so on... i just published a new article and its not even coming up in the Top pages by views section... like whats going on... Like sometimes when i publish the post i wanna see for this particular post how many readers have arrived and through which sources, its impossible to figure out. But still the most bizarre is the numbers, who is all reading these articles, it seems insane, which i appreciate but I don't want to gaslight ourselves, like something is not adding up

If your ratio is under two, stop reading and go write. If it is not, the next section is the fix.

## Four facts and two rules

A page load arrives with headers. Four of them are evidence. I now store all four on every row, because verdicts change and evidence lets you re-run them over history.

1. **The network.** The autonomous system of the client's IP, which Cloudflare attaches to every request and any log parser can add. A reader sits on an ISP or a mobile carrier. A scraper sits on Amazon, Google Cloud, OVH, Hetzner, DigitalOcean, Tencent. This is the one fact a client cannot change by editing headers.
2. **Fetch Metadata.** Every current browser engine sends `Sec-Fetch-Mode`, `Sec-Fetch-Dest`, and `Sec-Fetch-Site`, and on a page navigation the values are `navigate`, `document`, and `none` or `same-site`. A non-browser client can send anything, so presence proves little. Absence proves something under one condition.
3. **Accept and Accept-Language.** A browser asking for a page admits HTML and names its user's languages. `curl` says `*/*` and nothing about language. So does most automation.
4. **The User-Agent.** The weakest fact, because the client writes it, and the strongest, because declared crawlers and AI fetchers declare themselves in it, and the good ones publish an IP list to confirm it against.

From those, two rules do most of the work.

**Rule one: a hosting network is a verdict on its own.** Check it first, before any header. A browser running on a cloud host that sends every header a person's browser sends is still automation. In three days of raw logs on my site, 430 of 844 successful page loads were navigation-shaped requests from hosting networks, and 374 of them were one client on Google Cloud claiming Chrome Mobile 114, a 2023 browser, with a correct `Accept`, an `Accept-Language`, and perfect Fetch Metadata. Only the network convicts it. The advertising industry's invalid-traffic standard has said the same since its 2015 edition: data-center traffic is routine filtration, and where no list is used, Amazon, Google, and Microsoft are the floor.

Keep the list short and verify each entry yourself against a registry. Do not import a public "datacenter" list. The ones I checked contain Google, Akamai, and Cloudflare, which would convict every reader on iCloud Private Relay or Cloudflare WARP. And do not add networks that sell consumer VPN exits, M247 and Datacamp among them: they carry scrapers and people, and the standard excludes "routing artifacts of legitimate users" for exactly this reason. Let the header rules catch the scrapers there. My list is 23 networks, each with the date it was checked, and it is [public](https://github.com/gkoreli/blog/blob/main/packages/analytics/src/networks.ts).

**Rule two: a missing Fetch Metadata header is a verdict only against a browser version that sends it.** Chromium 76 and later, Firefox 90 and later, Safari and WebKit 16.4 and later, including their WebViews. A User-Agent that claims one of those and sends no `Sec-Fetch-Mode` on a page load is not the browser it names. A User-Agent that claims something older, or whose engine cannot be read, proves nothing either way, and gets its own label rather than a guess. Never require `Sec-Fetch-User`; Safari has never sent it.

That second rule is the one I had wrong for a day, and the story of why is in the middle of this article, because the wrong version is the one most people will find if they search.

## What the tools you trust actually check

Most sites do not write a classifier. They use one, and assume it handles this. I read the code. Line references are in the [research directory](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/readers-vs-bots).

| Tool | Network evidence | Fetch Metadata | What it actually does |
|---|---|---|---|
| Matomo | a hardcoded list of Googlebot and Bing ranges, years old | no | User-Agent regexes from device-detector, plus two prefetch headers |
| Plausible Community Edition | no | no | User-Agent library; the cloud service drops data-center IPs with a classifier that is not in the repository |
| GoatCounter | yes: IP ranges for nine cloud providers | no | User-Agent heuristics plus network ranges, and a reason code stored with every hit |
| Umami | no | no | one line: if `isbot` matches the User-Agent, drop the hit |
| `isbot` (npm) | no | no | 207 patterns; the README says it identifies "good bots" that "voluntarily identify themselves" and "does not try to recognise malicious bots or programs disguising themselves as real users" |

That last line is not a criticism of `isbot`. It is a statement of scope that the sites depending on it mostly have not read. Four defensive projects do read Fetch Metadata, Anubis, caddy-waf, BunkerWeb, and bot-signal, and all four treat its absence as a weight rather than a verdict, with the same comment: WebViews might not send it. I took that consensus at face value and it was wrong, which is the next section's subject.

GoatCounter's reason code is the one design I copied. Every row in my table carries one kind and one reason, so anyone reading the stats page can see why a hit landed where it did, and so a rule change can be replayed over history.

## What AI readership looks like on a small site

This is the question most people arrive with in 2026, and the honest answer needs the rules above first, because a dashboard that counts scrapers as readers also counts crawlers as readers.

Once the count is honest, every row on my site carries one of twelve kinds, and the public stats page groups them by what the client was doing:

| Group | Kinds | The fact behind the label |
|---|---|---|
| Browsers | browser | a navigation-shaped request from outside hosting networks |
| AI agents | signed agent, AI assistant | software fetching a page right now because a person asked: a verified Web Bot Auth signature, or a named on-demand fetcher such as ChatGPT-User or Claude-User confirmed against the vendor's IP list |
| Crawlers | search engine, AI search, AI crawler, link preview | fetching to index, train, or preview for later |
| Automation | cloud browser, headless browser, HTTP client, other bot, old browser | browser User-Agents on hosting networks, self-declared HeadlessChrome and Cypress, curl and python, generic bot tokens, and browsers too old to send the headers I check |

The four groups are disjoint and add up to All. Under the chart, a composition table lists each kind with its reasons, hosting providers by name, and named agents as links to their own view, so "what is ChatGPT reading" is one click per article.

What that view shows, for the thirty days to September 2, is small and real. ChatGPT-User, the fetcher that runs when a person asks ChatGPT to read a page, made 33 requests to eight different pages: the llms.txt post, the first-party analytics post, two OSS Radar issues, the bring-your-own-agent post, Topologies of Thoughts, and the homepage. Every other AI agent touched each page once or twice: PerplexityBot 51 views on 31 pages, Amazonbot 37 on 36, GPTBot 21 on 21. Views equal to pages is a crawl. Thirty-three reads through an assistant, in a month, on a site this size, is the honest number for "AI readership" here. The 51 the old dashboard attributed to Perplexity was indexing.

The frame matters as much as the rules. I started with the advertiser's question, valid traffic versus invalid, and the owner of the site changed it halfway:

> i even want to know the headless browsers on home connections, like Meshclaws or Hermess cloud agents using playwright or cypress or any type of automation, we don't want to miscount or block them, on the contrary, I want to embrace them, anyone can read my articles... I just want full visibility and transparency and categorization, like we need to explicitly know who is who (of course with respecting PII), but lots of people might stop reading articles directly and might use their AI agents like Meshclaws and Hermes agents running on the cloud to read my articles and so on, and I want to know who is reading what, like I am trying to understand how people are using my articles... Ideally I would love to have some kind of official citation for my articles as well, like you know how Arxiv or research papers have citations? I want to embrace that as well, like people reading and finding my content valuable and recommending them to cite them as needed, and have some kind of visibility into those citations. Like another example is  how scholar.google.com shows Total citations Cited by 51, something like that would love to.

A census, not a filter. Every kind is a fact about the request, none is a confidence word, and none of them is "human". The only way for an agent to be named as a fact rather than matched by a string is Web Bot Auth, the IETF draft that puts an RFC 9421 signature on the request and a key at a well-known URL. My Worker verifies it with no dependencies and stores the signer's origin. In [the fetcher headers study](/which-ai-fetchers-send-which-headers), DuckDuckGo's assistant was the only one of ten that signed. Since the verifier went live, no signed request has arrived.

## What no rule can separate

Two kinds of traffic no server-side rule recovers, and the article is dishonest without them.

The same study found that Grok, used anonymously, fetches a page eight times from eight networks on four continents, several of them residential and one a mobile carrier, wearing complete Chrome and Safari header sets. Five of those eight pass every rule above. They are in my Browsers count, they will stay there, and there is no fact in the request that would move them. Any assistant that drives a browser on the reader's own device, Comet, Claude for Chrome, Edge's Copilot mode, sends a person's request from a person's network, and it should be counted as one, because a person asked.

So Browsers is a lower bound, and the undercount is whatever share of readers use those tools. The right response is not another rule. It is to say "browsers", never "humans", to publish the comparison against a script counter, and to state the ratio on the page.

## How the number got here

The rules above took a night and a day, and the mistakes are the useful part. Shortened.

The first version shipped with the header checks and the network check together, and with a bucket labelled "Browser-like" for anything that failed. Two things went wrong at once. The evidence columns did not exist for any row written before that minute, so the default view of the stats page showed three page views for the week.

> why did we lose all the views lmao... you need to migrate properly and maintain the historical views, even if it was miscalculated doesn't matter, its okay, we can trace the commit history and know with full honesty what happened and why

The week came back within the hour, marked as recorded before evidence existed. That is now the rule I hold above the classifier: a method change is a dated boundary in the series, never a deletion. Then the label went:

> this is kinda confusing, and saying browser-like is a little misleading and screams low confidence, like what is the browser like, do we know deterministically or what? Browsers
> Browser-like
> Bots
> AI UAs
> All
>
> You need to ground yourself better

"Browser-like" described my confidence, not the request. Every label since is a fact the request carried.

Then the wrong premise. I had written, in the decision record and on the stats page, that a missing Fetch Metadata header could never be a verdict, because WebViews omit it. Four defensive projects said the same. I planned a measurement on my own referred traffic before deciding.

> can't we learn from other people and prior art? this is 2026 september

We could. Fetch Metadata shipped in Chrome 76 in 2019, Firefox 90 in 2021, Safari 16.4 in March 2023; caniuse puts support at 95.72% of global usage. Android WebView has sent it since Chromium 76, recorded in a 2019 issue on a privacy browser. And someone had measured iOS: a September 2025 issue on the MDN browser-compatibility project analysed a day of logs across several large sites and found `Sec-Fetch-Mode` from Safari desktop, iOS, and iOS WebView in the millions. The caveat I had repeated traces to one vendor post with no data and to projects that hedged for lack of it. I read four codebases that agreed with each other and did not ask whether any of them had checked.

Then the raw logs, which had existed all along.

> dont we already have some raw logs in cloudflare?

Three days of Worker logs with full headers, 844 successful page loads: 112 navigation-shaped from normal networks, 430 navigation-shaped from hosting networks, 126 declared bots, 49 header-less browser claims outside hosting networks, and all twelve externally referred visits carrying Fetch Metadata. That is where the network check moved ahead of the header checks.

Then history. The rows from the week before the evidence columns had a User-Agent verdict and nothing else, and I had labelled them "unchecked". I did not accept that: the rows had exactly the evidence recorded at the time, which is provenance, and the raw sources for that week had not been checked.

Cloudflare's zone analytics keep eight days and, on a free zone, serve the client IP but not the network. So: 1,884 page loads pulled by hour, path, country, device, and IP; 784 addresses resolved to networks through a registry lookup and never stored; each old row matched to its group and given a network only when the whole group agreed. 1,429 of 1,962 rows qualified, and 714 of the browser-class ones sat on hosting providers. On August 31, the day the chart spiked to 402 views, 346 were on hosting networks and 36 were not. Every row now states where its network came from, the request or the reconstruction, and nothing says "unchecked", because nothing is.

## The number now, and what I do not know

Reader-shaped page loads were 13 percent of successful page loads over the three-day sample. The evidence-era rows are hours old, so I will not print a weekly reader count I would have to correct next week. On September 17, two full weeks of them exist, and I will set them against the script counter over the same days. If Browsers sits within about twice the script count, the rules hold and the stats page says so. If it is still three times higher, something the evidence cannot see is still counted, and the next post in this series reports that instead. I do not know which it will be.

## If you count visitors on your own server

1. **Run the test.** One week, a script counter beside your server count. Ratio over two means you have this problem.
2. **Store the evidence, not the verdict.** Network, `Sec-Fetch-Mode`, `Sec-Fetch-Dest`, whether `Accept` admits HTML, whether `Accept-Language` is present. One reason code per row.
3. **Hosting network first, as a verdict.** Short list, hand-verified, no VPN networks, no public list imported wholesale.
4. **Header absence is a verdict only against a version that sends the header.** Chromium 76, Firefox 90, WebKit 16.4 and later. Never require `Sec-Fetch-User`.
5. **Name what declares itself, verify what signs, record the rest as the literal token.** `User-Agent: Google` from a Google address is a fact; "Gemini" is an inference until Google documents it.
6. **Never delete a method change.** Date it, disclose it, keep the old rows with their evidence level stated. If a raw source can improve history, use it once and mark the rows it touched.
7. **Say "browsers", not "humans", and publish the gap.** Your count is a lower bound. Put the ratio against a script counter on the page.

## Method and limits

Every number comes from the production database, the Cloudflare dashboards, or the raw logs; the queries are in the [evidence ledger](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/readers-vs-bots/02-evidence-ledger.md), the standards and code reading in artifacts 03 and 04, and the Fetch Metadata prior art with the log measurements in artifact 09 of the same directory. The classifier, the network list, the migrations, and the tests are in the [analytics package](https://github.com/gkoreli/blog/tree/main/packages/analytics), whose README is the reference version of the rules above.

What this does not show: the reader count is hours old and the calibration is two weeks out; the history reconstruction is a matched sample, with 191 ambiguous rows and 342 unmatched, all of August 26 among them; three header-less iOS claims from residential networks are unexplained, probably spoofed, unprovable from three rows; and on-device agents are invisible by design. Much of the reading and all of the queries were done with an AI agent, and the wrong premise in the middle was the agent's before it was mine. The prompts that shaped the piece are on the prompts page.

Evidence that would change the conclusions: a calibration ratio above three; a measured rate of modern browsers omitting Fetch Metadata on a real site; a vendor statement that Grok names or signs its fetcher.

I wanted this page to exist on the night I could not find it. If your number looks too good, it probably is, and now you know the four headers to look at. Tell me where this is wrong.
