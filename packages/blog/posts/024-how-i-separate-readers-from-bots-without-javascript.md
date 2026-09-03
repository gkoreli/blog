---
title: "How I Separate Readers from Bots on a Static Blog Without JavaScript"
seoTitle: "Readers vs Bots on a Static Blog: Edge Analytics Without JavaScript"
alternativeHeadline: "A counter with no script reported 113 readers in a day. Eleven to one against an independent count. What a request can prove, what it cannot, and what the number means now."
date: "2026-09-03"
description: "My edge-side analytics counted 113 daily readers and I did not believe it. This is the evidence trail: what an HTTP request can prove without a script, which rules the standards and open-source tools actually use, the claim I got wrong, the raw logs that fixed it, and the number I trust now."
section: engineering
tags: [analytics, cloudflare-workers, http, bots, ai-agents, observability]
series:
  id: "measurement-boundaries"
  title: "Measurement boundaries"
  order: 4
---

# How I Separate Readers from Bots on a Static Blog Without JavaScript

<p class="post-orient">The evidence trail behind one number: 113 daily readers reported by a counter with no JavaScript, eleven times what an independent script-based counter saw. What a bare HTTP request can prove, which rules the standards and the open-source tools actually apply, the claim I got wrong, and the number I trust now.</p>

On the night of September 2 my own analytics told me 113 people had read this site that day. I had just published a post, it was not in the top pages, the referrer list was almost empty, and the number kept climbing. Cloudflare's script-based counter for the same seven days said 52 visits. Mine said 578. That gap is the subject of this article, and the reason it matters beyond one blog is that the gap is not a bug in my code. It is what every server-side counter reports when it counts browser-shaped requests, and most of them never find out.

What follows is the trail, in the order the evidence arrived, with the wrong turns kept in. By the end you will know:

- **What a request can prove without a script.** Four facts the server sees on every page load, which of them a scraper can fake, and which it cannot.
- **What the standards and the tools actually do.** The advertising industry's invalid-traffic standard names data-center traffic as routine filtration; none of the five open-source analytics tools I read use network evidence, and none use the browser's Fetch Metadata headers. The rule in this article has no open-source precedent, which is why I wrote it down.
- **Which rule is a verdict and which is only a weight.** A hosting network convicts on its own. A missing header convicts only when the browser version says the header should be there. I had that second one wrong for a day, on the strength of a caveat nobody had measured.
- **What the raw logs showed.** Three days of Cloudflare Workers Logs: 844 page loads, 112 of them shaped like a person's browser on a normal network, 374 from one Google Cloud client calling itself Chrome Mobile 114 and passing every header check.
- **How history kept its provenance.** Eight days of zone analytics, 784 IP addresses resolved to networks, 1,429 of 1,962 old rows re-labelled with a stated source instead of a shrug.
- **The number now,** why it is a floor and not a count, and the rule set you can apply tomorrow if you count visitors on your own server.

## The number I did not believe

The counter is the one I described in [How I Built First-Party Analytics for a Personal Blog](/first-party-analytics-for-a-personal-blog): a Cloudflare Worker in front of the site records every successful HTML response into a D1 table, with the path, referrer host, country, a per-day hashed client id, and a traffic class derived from the User-Agent. No script, no cookie, nothing for a reader to block. On August 26 that Worker replaced a JavaScript beacon, and from that day the daily browser count roughly tripled.

I noticed on September 2. My words to the agent, verbatim:

> i am seeing daily clients as 113 for today, and it seems unbelievable to me, like which articles are they reading, where are they coming from and so on... i just published a new article and its not even coming up in the Top pages by views section... like whats going on... But still the most bizarre is the numbers, who is all reading these articles, it seems insane, which i appreciate but I don't want to gaslight ourselves, like something is not adding up

The shape of the 113 clients, from the database that night:

| Views per client | Clients |
|---:|---:|
| 1 | 100 |
| 2 | 9 |
| 3 | 2 |
| 9 | 1 |
| 31 | 1 |

One hundred of the 113 loaded exactly one page. 156 of the day's 164 browser-class views carried no referrer. One "mobile" client from the United States fetched 31 different pages in one second at 05:03:50 UTC. Readers do not do that. Crawlers wearing a browser User-Agent do.

The independent check was already running. Cloudflare Web Analytics is a script-based counter on the same pages, with "exclude bots" on. For the seven days ending September 2 it saw 113 page views and 52 visits. My table held 1,209 browser-class views and 578 daily clients over the same days. Eleven to one. The windows are not perfectly aligned and the script misses readers who block scripts, but no honest reading of those two numbers makes them the same population.

So the counter was right about what it measured and wrong about what it called it. It measured requests whose User-Agent said "browser". It called them readers. The rest of this article is about closing that gap without adding a script, because the whole point of the counter was that it did not need one.

## What a request can prove without a script

A page load arrives with headers. Most are noise. Four are evidence, and I now store all four on every row.

**The network.** Cloudflare attaches the autonomous system number of the client's IP to every request. A reader sits on an ISP or a mobile carrier. A scraper sits on Amazon, Google Cloud, OVH, Hetzner, DigitalOcean, Tencent. This is the one fact a client cannot change by editing headers, because it is not a header.

**Fetch Metadata.** Every current browser engine sends `Sec-Fetch-Mode`, `Sec-Fetch-Dest`, and `Sec-Fetch-Site` on every request, and on a page navigation the values are `navigate`, `document`, and `none` or `same-site`. The `Sec-` prefix means page scripts cannot set them, but a non-browser client can send anything it likes, so their presence proves nothing and their absence proves something only under conditions I get to in a moment.

**Accept and Accept-Language.** A browser asking for a page says it accepts HTML and says what languages its user reads. `curl` says `*/*` and nothing about language. So does a lot of automation.

**The User-Agent.** The weakest evidence in the set, because it is a free-text field the client fills in, and the strongest, because declared bots declare themselves in it. Every named crawler and AI fetcher in my tables is named by this header and, for the ones that publish IP lists, confirmed by the network.

Two facts a request does not carry: whether a person is looking at the screen, and, for the on-device agents, whether the request came from a browser or from an assistant driving that browser. No server-side rule recovers either. The counter has a floor and a ceiling, and this article is about moving the floor up to where the evidence supports it.

## What the standards and the open-source tools actually do

Before writing a rule I wanted to know what everyone else's rule was. The agent's first attempt was to rename things, and I said so:

> no, why are you thrashing? you need to explore cross references and authoritative sources, and read open source more, this is still subpar

So we read them. The Media Rating Council's invalid-traffic standard, the one advertising measurement is audited against, defines "General Invalid Traffic" as traffic caught by "routine means of filtration executed through application of lists or with other standardized parameter checks", and its examples include "known invalid data-center traffic" and "non-browser user-agent headers or other forms of unknown browsers". Where no industry list is used, the standard requires filtering traffic from the three largest hosting entities: Amazon, Google, and Microsoft. That is the floor of the whole ad-measurement industry: data-center network is a verdict, and the 2015 edition of the same guidelines already listed it.

Nobody in that world uses the word "human" for the remainder. Cloudflare's bot score has "likely human" and "likely automated". Plausible says "unique visitors". GoatCounter says "visits". The standard itself says "valid traffic" once, in passing. So the counting noun on my stats page is "Browsers", and it will stay a counting noun.

Then the tools. I read the classifier code of Matomo, Plausible Community Edition, GoatCounter, Umami, and the npm `isbot` package that Umami and thousands of other sites depend on. The findings, with line references in the [research directory](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/readers-vs-bots):

- Four of the five are User-Agent matching and nothing else. Matomo adds a hardcoded list of Googlebot and Bing IP ranges from years ago. Umami is one line: if `isbot` matches the User-Agent, drop the hit.
- Plausible's cloud service drops data-center IPs, but the classifier is not in the open-source repository; the self-hosted edition never sees it.
- GoatCounter is the only one that ships network evidence in the open: IP ranges for nine cloud providers, and a reason code stored with every hit that says which rule fired. That reason-code design is the one thing I copied.
- None of the five reads Fetch Metadata, Accept, or Accept-Language.
- `isbot`'s own README says it identifies "good bots", "those who voluntarily identify themselves", and that "it does not try to recognise malicious bots or programs disguising themselves as real users". That is not a criticism of `isbot`. It is a statement of scope that the sites depending on it mostly have not read.

Four defensive projects do read Fetch Metadata, and all four treat its absence as a weight rather than a verdict: Anubis gives its presence a bonus that exempts a request from the proof-of-work challenge, caddy-waf scores a missing `Sec-Fetch-Dest` as critical but only logs it, BunkerWeb falls back to `Accept` when the headers are missing, and bot-signal weights it at 0.35 with the option to require it turned off by default. Their comments give the same reason: embedded WebViews might not send it. I took that consensus at face value. That was the mistake, and it comes next.

The upshot of the reading: a rule that combines network evidence with Fetch Metadata and stores one reason per hit has no precedent in the open-source analytics tools. That is not a boast. It is why the rule needed writing down with its sources, and why this article exists.

## The first rule, and losing the views

The first version shipped on September 3 at 01:35 UTC. Browsers meant: a browser User-Agent, `Sec-Fetch-Mode: navigate`, `Sec-Fetch-Dest: document`, an `Accept` admitting HTML, an `Accept-Language`, from a network not on a hand-verified list of twenty hosting providers. Everything with a browser User-Agent that failed a check went into a bucket labelled "Browser-like".

It did two things wrong at once. The evidence columns did not exist for any row written before that minute, so every row from August 26 onward failed the checks by default, and the default view of the stats page showed three page views for the week.

> why did we lose all the views lmao... you need to migrate properly and maintain the historical views, even if it was miscalculated doesn't matter, its okay, we can trace the commit history and know with full honesty what happened and why

That is the rule I now hold above the classifier: a method change is a dated boundary in the public series, never a deletion. The week came back within the hour, marked as rows recorded before evidence existed.

The label went next.

> this is kinda confusing, and saying browser-like is a little misleading and screams low confidence, like what is the browser like, do we know deterministically or what?

He was right. "Browser-like" described my confidence, not the request. A label on a public stats page has to state a fact the request carried, or it is a mood. That single objection is where the taxonomy at the end of this article comes from, and it took three more corrections to get there.

## The claim I got wrong

I had written, in the decision record and in the stats page methodology, that a missing Fetch Metadata header could never be a verdict on its own, because Android WebView and iOS WKWebView omit it. Every one of the four defensive projects had said the same. I planned a measurement on this site's own referred traffic before deciding.

> can't we learn from other people and prior art? this is 2026 september

We could, and the prior art was not what I had repeated:

- Fetch Metadata shipped in Chrome 76 in July 2019, Firefox 90 in July 2021, and Safari 16.4 in March 2023. caniuse puts support at 95.72% of global browser usage.
- Android WebView has sent the headers since Chromium 76. A 2019 issue on a privacy browser records a user confirming it on their devices and the maintainer confirming Google had added the headers to WebView's standard set.
- iOS WebView sends them too, and someone measured it. A September 2025 issue on the MDN browser-compatibility project analysed a day of logs across several large sites and found `Sec-Fetch-Mode` from Safari desktop, iOS, and iOS WebView in the millions. The same analysis found that Safari has never sent `Sec-Fetch-User`, which my rule never required.
- The "WebViews omit it" caveat traces to one vendor blog post from December 2025 with no data, and to the defensive projects, whose own comments say they hedged for lack of data.

So the consensus I had deferred to was caution, not a finding. The rule became: a User-Agent that claims Chromium 76 or later, Firefox 90 or later, or WebKit 16.4 or later, and sends no `Sec-Fetch-Mode` on a page load, is not the browser it names. A User-Agent claiming something older, or one whose engine version cannot be read, proves nothing either way and gets its own label, "Old browsers", neither readers nor automation. No site-specific measurement was needed. The 27 evidence-era rows I had at the time contained no referred traffic anyway.

I am keeping this section because the error is the useful part. I read four codebases that agreed with each other and did not ask whether any of them had checked.

## What the raw logs showed

> dont we already have some raw logs in cloudflare?

We did. Workers Logs keep three days of every invocation with the full request headers, User-Agent, and network, and I had not looked. The wrangler token cannot query them, so the queries ran from the dashboard's own session, in three-hour windows, and only counts left the page.

Three days to September 3, 03:55 UTC, 844 successful page loads:

| What arrived | Page loads |
|---|---:|
| Navigation-shaped, browser User-Agent, outside hosting networks | 112 |
| Navigation-shaped, from hosting networks | 430 |
| Declared bots | 126 |
| No Fetch Metadata, hosting network, browser User-Agent | 64 |
| No Fetch Metadata, outside hosting networks, browser User-Agent | 49 |
| Client libraries: curl, python, Go, node, HeadlessChrome | 26 |
| External referrals: google.com 8, t.co 3, chatgpt.com 1 | 12 |

Three findings changed the rule's order.

First, the largest single cluster was 374 page loads from one client on Google Cloud calling itself Chrome Mobile 114, a browser version from 2023, sending `navigate`, `document`, an HTML `Accept`, and an `Accept-Language`. It passes every header check I have. Only the network convicts it. So the network check now runs before the header checks, not after, and the classifier comment says why.

Second, header absence outside hosting networks was 49 loads, under six percent, and 14 of those were a "Chrome 78" claim from four networks that sell consumer VPN exits. Chrome 78 sent Fetch Metadata, so the version-gated verdict is correct for them. Three loads claimed iOS 17 or 26 without the headers from residential-looking networks. Prior art says those versions send it, so they are probably spoofed. I cannot prove it from three rows and the article does not pretend to.

Third, all twelve referred visits carried Fetch Metadata. Twelve is not a study. It is consistent with the study.

Readers, by the rule, were 112 of 844 page loads over three days. Thirteen percent.

## History has provenance

The rows from August 26 to September 3 had a User-Agent verdict and nothing else. I had labelled them "unchecked".

> i believe we have correct provenance even for historical data

Two things were wrong with "unchecked". The rows were not unknown; they carried exactly the evidence the pipeline recorded at the time, and the beacon rows from before August 26 carried more, since the site's script had run inside a page, which is stronger browser evidence than any header. And a second raw source existed for the recent week. Cloudflare's zone analytics keep eight days. On a free zone the API refuses the ASN and referrer fields, but it serves the client IP, path, User-Agent, country, hour, and device type.

So: pull every successful HTML load from August 27 to September 3 grouped by those fields, 1,395 groups, 1,884 requests, 784 distinct IPs. Resolve each IP to its network through Team Cymru's DNS interface, all 784 resolved, IPs used transiently and never stored. Match each stored row to the zone group with the same UTC hour, path, country, and device, and assign a network only when every sampled request in that group came from one network.

| Outcome | Rows |
|---|---:|
| Network assigned unambiguously | 1,429 |
| Ambiguous group, several networks | 191 |
| No sampled group, 169 of them August 26 and already past retention | 342 |

Of the 1,039 browser-class rows that received a network, 714 sat on hosting providers: Google Cloud 377, OVH 126, Tencent 133, and a tail. On August 31 alone, the day the chart spiked to 402 views, 346 browser-class rows were on hosting networks and 36 were not.

The migration that applied this adds a column saying where each row's network came from: the request, or the zone sample. Every row now states the evidence it actually has. Beacon rows say the script ran. Pre-evidence rows say User-Agent only, or hosting network by reconstruction. Nothing says "unchecked", because nothing is.

## From exclusion to composition

The frame I started with was the ad industry's: valid traffic, invalid traffic, filter the second. Halfway through, the owner of the site changed the question.

> I wanna see the breakdown of articles based on the AI bots for example, what are they reading? What if eventually I pivot my blog post to embrace the AI readership and understand what they are reading and provide valuable content for AI or Bot readership?

> i even want to know the headless browsers on home connections, like Meshclaws or Hermess cloud agents using playwright or cypress or any type of automation, we don't want to miscount or block them, on the contrary, I want to embrace them, anyone can read my articles... I just want full visibility and transparency and categorization

That is a different problem from filtering. It is a census. Every row gets one kind and one reason, both facts about the request, from a closed set of twelve:

| Kind | The fact it states |
|---|---|
| Browsers | Navigation-shaped request from outside hosting networks; or, for history, the script ran, or the User-Agent alone |
| Signed agents | A Web Bot Auth signature that verified against the signer's published key |
| AI assistants | A named on-demand fetcher, ChatGPT-User, Claude-User, and peers, fetching because a person asked |
| AI search | A named AI search indexer, OAI-SearchBot, PerplexityBot |
| AI crawlers | A named training or general crawler, GPTBot, ClaudeBot |
| Search engines | Googlebot, Bingbot, and peers |
| Link previews | Slack, LinkedIn, Facebook unfurlers |
| Cloud browsers | A browser User-Agent on a hosting network, whatever the headers say |
| Headless browsers | Self-declared automation: HeadlessChrome, Cypress, Lightpanda |
| HTTP clients | curl, python, and any request not shaped like a page load, including modern browser claims without Fetch Metadata |
| Other bots | A generic bot token with no named rule |
| Old browsers | A browser version that predates Fetch Metadata, so its absence proves nothing |

The public stats page groups them by what the client was doing: Browsers, AI agents, Crawlers, Automation, All. The four groups are disjoint and add up to All, and a composition table under the chart lists every kind with its reasons, so a reader of the page can see why a hit landed where it did. Hosting rows name the provider. Named agents link to their own view, which is how "what are the AI bots reading" gets answered per article.

Two things about the census are still incomplete, and they are the ones I cannot fix from the server.

The first is signing. The only way for an agent to be named as a fact rather than matched by a string is Web Bot Auth, the IETF draft that puts an RFC 9421 signature on the request and a key at a well-known URL. My Worker verifies it now, with no dependencies, and stores the signer's origin. In [the fetcher headers study](/which-ai-fetchers-send-which-headers) DuckDuckGo's assistant was the only one of ten that signed. Since the verifier went live, no signed request has arrived. The row exists, waiting.

The second is the hole. The same study found that Grok, used anonymously, fetches a page eight times from eight networks on four continents, several of them residential, wearing complete Chrome and Safari header sets. Five of those eight pass every rule in this article. They are in my Browsers count and they will stay there, because there is no honest fact that would move them. Browsers is a floor with a known leak, and the size of the leak is whatever share of readers use Grok.

## The number now

Since the evidence columns went live the reader-shaped rows are a few hours old, so I will not put a seven-day number here that I would have to correct next week. What I can say from the three-day log sample is that reader-shaped page loads were 13% of successful page loads, and that the August 31 spike, the one that made the chart look like the site had been discovered, was 346 hosting-network hits against 36 others.

The one AI-readership signal that survived all of this is small and real. Over thirty days ChatGPT-User, the fetcher that runs when a person asks ChatGPT to read a page, made 33 requests to 8 different pages: the llms.txt post, the first-party analytics post, two OSS Radar issues, the bring-your-own-agent post, Topologies of Thoughts, the homepage. Every other AI agent in the table touched each page once or twice, which is a crawl, not a read. Thirty-three reads through an assistant, in a month, on a small site, is the honest size of "AI readership" here. It is not nothing. It is also not the 51 views the dashboard once attributed to PerplexityBot, which was indexing.

The external check comes on September 17, when two full weeks of evidence-era rows exist and can be set against Cloudflare's script count over the same days. If Browsers sits within about two times the script count, the rule holds and the methodology says so. If it is still three times higher, something the evidence cannot see is still counted, and the next post in this series reports that instead. I do not know which it will be.

## If you count visitors on your own server

This is the part for anyone running a counter at the edge, in a log parser, or in a hosted product that runs before JavaScript.

1. **Store the evidence, not the verdict.** Network, `Sec-Fetch-Mode`, `Sec-Fetch-Dest`, whether `Accept` admits HTML, whether `Accept-Language` is present, the served representation. Verdicts change; evidence lets you re-run them over history, with a reason code per row so you can see what fired.
2. **Hosting network is a verdict on its own.** Check it first. A cloud-hosted browser that sends every header a person's browser sends is still automation, and in my sample it was most of the inflation. Keep the list short and hand-verified, and do not import public "datacenter" lists wholesale; the ones I checked contain Google, Akamai, and Cloudflare, which would convict iCloud Private Relay and WARP users.
3. **Do not add VPN networks to that list.** M247, Datacamp, and their peers carry scrapers and people. The MRC standard excludes "routing artifacts of legitimate users" from data-center filtration for exactly this reason. Let the header rules catch the scrapers there.
4. **A missing `Sec-Fetch-Mode` is a verdict only against a version that sends it.** Chromium 76, Firefox 90, WebKit 16.4 and later, WebViews included. Never require `Sec-Fetch-User`; Safari has never sent it.
5. **Name what declares itself, verify what signs, and record the rest as the literal token.** `User-Agent: Google` from a Google address is a fact. "Gemini" is an inference until Google documents it.
6. **Never delete a method change.** Date it, disclose it, and keep the old rows with their old evidence level stated. If a raw source exists that can improve history, use it once and mark the rows it touched.
7. **Say "browsers", not "humans", and publish the leak.** Your count is a floor. Find the independent counter, run the comparison, and put the ratio on the page.

## Method and limits

Every number in this article comes from the production database, the Cloudflare dashboards, or the raw logs, and the queries are recorded in the [evidence ledger](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/readers-vs-bots/02-evidence-ledger.md). The standards reading, the open-source code reading with line references, the hosting-network verification, and the Fetch Metadata prior art are artifacts 03, 04, and 09 in the same directory. The classifier, the migrations, and the tests are in the [repository](https://github.com/gkoreli/blog/tree/main/packages/analytics).

What this does not show:

- **The reader count is a few hours old.** The evidence columns went live on September 3. The three-day log sample and the reconstructed week are the basis for the ratios here; the two-week calibration is the next post.
- **The reconstruction is a sample, matched by group.** Zone analytics is adaptively sampled and the free plan withholds the network field, so 191 rows were ambiguous and 342 could not be matched, including all of August 26.
- **Three header-less iOS claims are unexplained.** Prior art says those versions send Fetch Metadata. Three rows cannot settle whether they were spoofed or a rare embedded client.
- **On-device agents are invisible by design.** A person reading through an assistant that drives their own browser sends a person's request. Nothing here separates them, and nothing should.
- **The agent wrote much of this alongside me.** The decisions, the reversals, and the quoted lines are mine; the reading, the queries, and the migrations were done with an AI agent, and the wrong claim in the middle was the agent's before it was mine. The prompts that shaped the piece are on the prompts page.

Evidence that would change the conclusions: a calibration ratio above three; a measured rate of modern browsers omitting Fetch Metadata on a real site; a vendor statement that Grok signs or names its fetcher; a second week in which the reader-shaped share moves far from 13%.

I want this page to be the reference I could not find on the night of September 2. If you count visitors on your own server and your number looks too good, it probably is, and now you know the four headers to go and look at. Tell me where this is wrong.
