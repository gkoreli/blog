---
title: "How I Classify Browser and Bot Requests Without JavaScript"
seoTitle: "Browser and Bot Classification Without JavaScript"
alternativeHeadline: "Network and request-header rules reclassified 74.5% of browser-UA traffic on my blog. The remaining count still differs from Cloudflare Web Analytics."
date: "2026-09-03"
lastModified: "2026-09-06"
description: "Cloudflare Workers request rules reclassified 74.5% of browser-UA traffic on my blog. Measured results, defects, and an unresolved reader count."
section: engineering
tags: [analytics, cloudflare-workers, http, bots, ai-agents, observability]
series:
  id: "measurement-boundaries"
  title: "Measurement boundaries"
  order: 4
---

# How I Classify Browser and Bot Requests Without JavaScript

On my blog, network and request-header rules moved **277 of 372 browser-User-Agent requests out of the Browsers category: 74.5%**. That gives me a much more useful account of the traffic arriving at my Cloudflare Worker. It has not established how many people read the site. Over the same two complete UTC days, the remaining **95 Browser HTML observations** still differ from **14 Cloudflare Web Analytics page loads**. The useful result is knowing which requests the rules separate, why they separate them, and where the evidence stops.

- **Network evidence catches requests that pass the header checks.** In that window, 60 cloud-classified requests carried the navigation headers the browser rule requires.
- **A reason for each classification makes the counter explainable.** It also exposes mistakes: our HTML-acceptance check mishandles valid headers, and new rows were missing their network-provenance marker.
- **Client identity and readership need different evidence.** Nine stored signature verifications identify signers, including crawlers and deliberate tests. They do not count people asking an assistant to read.
- **The remaining disagreement is a measured problem.** Neither a smaller Browser count nor agreement with a script counter establishes audience accuracy.

## Comparing edge page views with a script counter

Comparing two counters exposed the problem with [my first-party analytics](/first-party-analytics-for-a-personal-blog): I had treated browser User-Agents as evidence of readers. The counters measure different events, so their disagreement is a starting point for investigation. It cannot, by itself, tell me which requests were automation.

The initial alarm came from this comparison, saved on September 3:

| Source | Page events / loads | Client or visit metric |
|---|---:|---:|
| D1 browser-UA class, seven UTC days ending September 2 | 1,209 | 578 daily client identifiers |
| Cloudflare Web Analytics, its rolling seven-day dashboard window | 113 | 52 visits |

The 578-versus-52 difference looked like eleven times as many readers. But a daily client identifier is not a visit, the time windows were not identical, and the script dashboard included `/stats`. Even the more comparable 1,209-versus-113 page totals needed those qualifications. The [original query record](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/readers-vs-bots/02-evidence-ledger.md) preserves the comparison as it was made.

There was stronger evidence inside the requests. On September 2, 100 of 113 daily clients loaded one page; 156 of 164 browser-UA page observations carried no referrer. Those facts alone would not establish automation. One client classified as mobile, however, fetched 31 distinct pages in the same timestamp second. My note that night was:

> i am seeing daily clients as 113 for today, and it seems unbelievable to me, like which articles are they reading, where are they coming from and so on... i just published a new article and its not even coming up in the Top pages by views section... like whats going on... Like sometimes when i publish the post i wanna see for this particular post how many readers have arrived and through which sources, its impossible to figure out. But still the most bizarre is the numbers, who is all reading these articles, it seems insane, which i appreciate but I don't want to gaslight ourselves, like something is not adding up

A useful comparison needs four decisions made before calculating the ratio:

1. Choose the same host and explicit start-inclusive, end-exclusive UTC window.
2. Compare page events with page loads. Report daily identifiers and visits separately.
3. Record which routes, response types, bots, owners, and test requests each system excludes. Keep sampling information with the result.
4. Inspect the discrepant requests and test the possible collection differences.

Cloudflare documents script blockers and browser or network loss as reasons its beacon can miss page loads. Browser caching and differing eligibility also need checking against the edge counter. A script can run in an automated browser. There is no universal ratio that separates these causes. [Cloudflare Web Analytics FAQ](https://developers.cloudflare.com/web-analytics/faq/), checked September 6, 2026.

The comparison reveals questions we can investigate. The earlier version of this article's under-two validation threshold was unsupported, and I have removed it.

## The request rules in the Cloudflare Worker

The Worker classifies recorded request characteristics. It can apply those rules deterministically without establishing who controlled the client. This section is for someone implementing the classifier; the measured results below can be read without the implementation detail.

The edge counter schedules a D1 observation after an eligible successful page `GET`. It excludes prefetches, `/stats`, API routes, and non-page responses. It includes HTML and negotiated Markdown page responses; direct `.md` requests are outside this counter. That collection boundary comes from [the eligibility code](https://github.com/gkoreli/blog/blob/1737fa9a8056d6390465ccfc6951ca8c3e3007c4/packages/analytics/src/eligibility.ts).

Four sources of evidence feed the classification:

1. **Network metadata.** Cloudflare supplies the client's autonomous system number (ASN). This describes the network reaching the edge. A client cannot change it by editing an HTTP header, but can reach the site through another network or proxy. It does not establish the operator's purpose.
2. **Fetch Metadata.** `Sec-Fetch-Mode: navigate` and `Sec-Fetch-Dest: document` describe a page navigation. `Sec-Fetch-Site` can be `none`, `same-origin`, `same-site`, or `cross-site`; the classifier records it but does not require one value. [Header definitions](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Site).
3. **Accept and Accept-Language.** The rule checks whether HTML is acceptable and whether a language header is present. These are request characteristics, not evidence of attention.
4. **User-Agent.** Named crawler and assistant rules match the client's declaration. The same string also supplies the browser-version claim used below. A client can imitate it.

D1 stores selected headers, derived flags, names, and classification reasons. It does not retain the full User-Agent. Existing Cloudflare operational logs contain additional request detail. Storing a derived flag is useful, but does not preserve enough information to replay every future parser change.

**Rule one: classify known hosting networks before browser shape.** After signature and named-client rules, a browser-UA request on the curated hosting list becomes `cloud-browser`, even if it passes the navigation-header check. In the original 72-hour log sample ending September 3, 430 of 844 successful page GETs were navigation-shaped traffic on hosting networks. The largest cluster was 374 requests attributed to one Google Cloud client claiming Chrome Mobile 114. Header presence could not separate that cluster. [Original measurement and coverage](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/readers-vs-bots/09-fetch-metadata-prior-art.md).

A cloud browser may be carrying out useful work for a person. I want that access recorded and visible. The network label describes how it reached the site, and moving it out of Browsers does not remove its observation.

The [curated network list](https://github.com/gkoreli/blog/blob/1737fa9a8056d6390465ccfc6951ca8c3e3007c4/packages/analytics/src/networks.ts) excludes several shared service and consumer-VPN networks. Broad hosting lists can include networks that carry legitimate browsing. Curating the list accepts the opposite cost: some automation will arrive through networks outside it.

**Rule two: check missing Fetch Metadata against the claimed browser version.** The implementation checks Chromium 76+, Firefox 90+, and Safari/iOS 16.4+. If a request claims one of those engines but lacks `Sec-Fetch-Mode`, it becomes `http-client` with reason `no-fetch-metadata`. Older or unreadable claims receive `legacy-browser`. A request with Fetch Metadata that fails the navigation combination receives `not-navigation-shaped`. [Classifier code](https://github.com/gkoreli/blog/blob/1737fa9a8056d6390465ccfc6951ca8c3e3007c4/packages/analytics/src/readerkind.ts).

Those version thresholds follow [browser support data](https://caniuse.com/mdn-http_headers_sec-fetch-mode), checked September 6. They establish an expected browser capability; they do not authenticate each request or establish a zero false-positive rate for every embedded client. We do not require `Sec-Fetch-User`: the [Safari compatibility investigation](https://github.com/mdn/browser-compat-data/issues/27928) found support for other Fetch Metadata headers without it.

The follow-up audit also found a defect in our own `Accept` check. Running `extractRequestMetadata()` on `Accept: text/html;q=0` returns `acceptsHtml: 1`; running it on `Accept: text/*` returns `0`. The first explicitly excludes HTML, while the second admits it. The substring check ignores HTTP quality and media-range rules. [RFC 9110, Accept semantics](https://www.rfc-editor.org/rfc/rfc9110.html#section-12.5.1); [recorded reproduction](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/readers-vs-bots/14-evidence-backed-implementation-plan.md).

That parser repair is pending in this revision. Stored booleans cannot tell us how many historical requests it affected. The request rules are inspectable and useful, but their implementation and error rate need separate checks.

## What open-source classifiers contributed

The useful prior art supplied specific pieces of this design: declared-bot detection, network classification, and retained reasons. Our reading did not establish that the combination is novel, or that every other counter misses the same traffic.

| Project | What the inspected source contributes | Boundary |
|---|---|---|
| [`isbot`](https://github.com/omrilotan/isbot#clarifications) | User-Agent matching for clients that identify themselves | Its stated scope excludes programs disguising themselves as users |
| [Plausible](https://github.com/plausible/analytics/blob/543b30185c104ce17900d03c95d95429180acc0b/lib/plausible/ingestion/event.ex) | UA checks, explicit ingestion outcomes, and consumption of an upstream IP classification | Reading that code does not reveal or reproduce the upstream classifier |
| [GoatCounter](https://github.com/arp242/goatcounter/blob/c957f51c43eb56dcc462b7e9d7a4550955b71846/handlers/count.go) | Server-side bot classification and retention of bot reasons | Its categories and collection rules differ from ours |
| [Anubis](https://github.com/TecharoHQ/anubis/blob/4578023de7b631537e3a43d89b1998e802beb7e0/data/common/acts-like-browser.yaml) | A combination of browser headers that adjusts a classification weight | The rule file warns that automated scrapers can bypass it |

These sources were checked on September 6; revisions and source boundaries are in the [pinned review](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/readers-vs-bots/14-evidence-backed-implementation-plan.md). `isbot` remains useful for the declared clients it aims to recognize. Anubis makes access-control decisions, whereas this counter aims to retain and explain access.

The part I adopted from GoatCounter was a reason attached to each classification. A lower total tells me little; a table of requests and the rules that classified them tells me what changed.

## Agent names, signatures, and request purpose

The site already records named User-Agent matches and verifies supported Web Bot Auth signatures. The mistake was treating those identity signals as proof that a person asked an assistant to read. The signature machinery is useful; the grouping and wording need correction.

In the saved cohort since the verifier launched, through September 5 UTC, D1 contains nine requests with a stored `verified` result:

| Signer | Requests | What this record establishes |
|---|---:|---|
| `ahrefs.com` | 5 | The Worker recorded successful signature verification |
| `crawler.exa.ai` | 2 | The Worker recorded successful signature verification |
| `assistbot.duckduckgo.com` | 2 | Successful verifications from our deliberate DuckAssist tests |

These are stored verifier outcomes, not a fresh independent verification of every original signed message. [The cohort and queries](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/readers-vs-bots/12-production-followup-2026-09-05.md) separate the deliberate tests. The previous claim that no signed request had arrived was wrong.

A signed client can be a crawler: [Exa documents ExaSearchBot](https://crawler.exa.ai/) as fetching and indexing pages. A signature associates a request with a signing identity under the verifier's checks. It does not establish the initiating person's identity, delegation, or purpose. The [versioned Web Bot Auth draft](https://datatracker.ietf.org/doc/html/draft-meunier-webbotauth-httpsig-protocol-01#section-4.6) makes those boundaries explicit; citing it is not a claim that our implementation conforms to every provision of that draft.

The current stats grouping puts `signed-agent` and `ai-assistant` together under AI agents. That grouping conflates authentication with client role and is pending repair. Routine ingestion matches User-Agent rules and verifies signatures; it does **not** perform the vendor-IP validation we did manually in [the fetcher-header probe study](/which-ai-fetchers-send-which-headers).

The older thirty-day snapshot recorded 33 `ChatGPT-User`-matched observations across eight paths, alongside 51 `PerplexityBot` observations across 31 paths, 37 `Amazonbot` observations across 36, and 21 `GPTBot` observations across 21. Those are recorded access patterns. They do not establish 33 human reading actions, and similar request/path totals do not independently prove why a crawl happened.

The reason to keep all this traffic is the publishing question behind it:

> i even want to know the headless browsers on home connections, like Meshclaws or Hermess cloud agents using playwright or cypress or any type of automation, we don't want to miscount or block them, on the contrary, I want to embrace them, anyone can read my articles... I just want full visibility and transparency and categorization, like we need to explicitly know who is who (of course with respecting PII), but lots of people might stop reading articles directly and might use their AI agents like Meshclaws and Hermes agents running on the cloud to read my articles and so on, and I want to know who is reading what, like I am trying to understand how people are using my articles... Ideally I would love to have some kind of official citation for my articles as well, like you know how Arxiv or research papers have citations? I want to embrace that as well, like people reading and finding my content valuable and recommending them to cite them as needed, and have some kind of visibility into those citations. Like another example is  how scholar.google.com shows Total citations Cited by 51, something like that would love to.

For that question, a useful table distinguishes the claimed client, verified signer, documented role, and any directly known trigger. Ordinary production requests usually leave the trigger unknown. The identity study can investigate that separately without turning this counter into a count of unobserved reading actions.

## What the Browsers category cannot establish

Browsers contains requests that pass our rule, including some automation. It can also exclude legitimate access through cloud browsers or unusual clients. Its error can run in both directions, so it is not an established lower or upper bound on people.

Our fetcher-header study captured Grok fetching through clients with browser User-Agents and navigation headers, including requests that passed the browser rules. An agent driving an ordinary browser can produce the same characteristics the counter uses for human browsing. The access is valuable, but headers alone need not reveal whether it followed a conversation, a scheduled job, or another process.

The new production window adds a concrete case to investigate: 22 of the 95 Browser observations share the `uniuit.com` referrer and a repeated homepage/article pattern. An inspected Worker log declares a Redroid Android WebView; the later zone-data correlation finds that declaration among candidates for 19 of the 22 rows. [Diagnostic evidence and matching limits](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/readers-vs-bots/15-existing-cloudflare-evidence-2026-09-06.md).

That supports investigating automation, not naming an authenticated operator. A User-Agent is a declaration, and the zone matches lack a shared request identifier. Setting all 22 observations aside as a sensitivity calculation still leaves 73 versus 14, or 5.21×. Explaining this cluster would not explain the whole discrepancy.

The useful claim is narrower than a reader count: these requests met a documented rule. Determining how much of that category represents people consuming the article requires evidence the rule does not collect.

## How classification changes affected history

Changing a classification must preserve what was observed before the change. Our first repair briefly made the old audience disappear from the default view, and restoring that history mattered as much as improving the rule.

The evidence columns did not exist on old rows. When the first header and network checks shipped together, the default stats view showed three page views for the week.

> why did we lose all the views lmao... you need to migrate properly and maintain the historical views, even if it was miscalculated doesn't matter, its okay, we can trace the commit history and know with full honesty what happened and why

The week came back, marked with the evidence available when it was recorded. The first unsuccessful name for requests that failed the new checks was Browser-like:

> this is kinda confusing, and saying browser-like is a little misleading and screams low confidence, like what is the browser like, do we know deterministically or what? Browsers
> Browser-like
> Bots
> AI UAs
> All
>
> You need to ground yourself better

Replacing that confidence label with named rules made the system easier to inspect. It did not make every classification an authenticated fact about the client.

The next mistake was accepting a broad claim that WebViews omit Fetch Metadata. We had read several defensive projects and planned to wait for our own referred traffic before deciding.

> can't we learn from other people and prior art? this is 2026 september

The support history was already available. [A 2019 Android WebView issue](https://redmine.stoutner.com/issues/495) recorded the headers after Chromium 76. The [September 2025 Safari compatibility report](https://github.com/mdn/browser-compat-data/issues/27928) described production observations and a BrowserStack reproduction: Safari and its WebViews sent `Sec-Fetch-Mode` while lacking `Sec-Fetch-User`. That was enough to reject the blanket WebView claim. It did not remove the need to investigate unusual requests on our own site.

Then there were the logs we already had:

> dont we already have some raw logs in cloudflare?

The original 72-hour sample contained 112 navigation-shaped requests outside the hosting list out of 844 successful page GETs. That is about 13% satisfying the sample's rule, not 13% proven human readership. All twelve externally referred requests in that sample carried Fetch Metadata; twelve is useful corroboration, not a false-positive-rate measurement.

For older rows, the retained zone data allowed a partial reconstruction. Of 1,962 pre-evidence observations, 1,429 received an ASN only when all sampled requests in the matching hour/path/country/device group agreed on the network. There were 191 ambiguous rows and 342 unmatched rows. The migration records reconstructed networks as `asn_source = 'zone-sample'`. This is a sampled attribution method, not an exact request join. [Reconstruction method](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/readers-vs-bots/09-fetch-metadata-prior-art.md).

The follow-up found another defect: all 1,797 inspected observations from September 3 05:05:22 through September 6 01:29:53 UTC had null `asn_source`. The INSERT omits that field. My previous statement that every row records its network provenance was therefore wrong. The migration marked rows that existed when it ran; that did not fix future ingestion. [Provenance audit](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/readers-vs-bots/14-evidence-backed-implementation-plan.md).

Preserving history requires checking both the migration and subsequent writes. A classification revision, a database migration, and a Worker deployment are separate events; recording one does not establish the others.

## What the September 4–5 measurements show

The new rules have a large measured effect, and the remaining count is still uncalibrated. This comparison uses September 4 00:00 through September 6 00:00 UTC, with the end excluded, for both sources.

| UTC day | Browser-UA observations | Browsers HTML observations | Non-bot RUM page loads |
|---|---:|---:|---:|
| September 4 | 224 | 49 | 7 |
| September 5 | 148 | 46 | 7 |
| Total | 372 | 95 | 14 |

The rules reclassified 277 of 372 browser-UA observations, or 74.5%. Of the cloud-classified requests in that original browser-UA population, 60 passed the navigation-header combination. Network evidence therefore separates requests the header combination alone would admit. This measures rule effects; we did not label all 277 requests independently and measure classifier accuracy.

RUM excludes bots and the two `/stats` loads in this window; all returned RUM groups had sample interval 1. Including its bot-tagged loads raises the comparable RUM total to 16, leaving 95/16 = 5.94×. Bot filtering alone does not account for the discrepancy. D1 applies owner exclusions, but incomplete owner marking remains a comparison limit. [SQL and saved results](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/readers-vs-bots/12-production-followup-2026-09-05.md).

A read-only extractor reproduced the 95/14 = 6.79× result in a separate capture and saves queries, sampling, and deployment metadata. The [extraction command](https://github.com/gkoreli/blog/blob/main/packages/blog/scripts/analytics-evidence.md) makes the comparison repeatable. It does not turn the two sources into identical populations or authenticate their results independently of Cloudflare.

The next investigation uses existing invocation logs and traces, then controlled clients to test classification, script execution, and beacon delivery separately. Individual trace-span inspection and those controlled-client trials remain open. The longer calibration is planned around September 17. This article does not need their outcome to report the rule effects already measured, but it cannot claim the reader-count problem is solved.

## Applying this to another site's analytics

The transferable method is to retain useful request evidence, make classification reasons visible, and compare collection stages before interpreting the total as readership.

1. **Define the event.** State which methods, routes, responses, representations, and prefetches enter the counter.
2. **Compare explicit windows and units.** Page observations, script page loads, visits, and daily identifiers answer different questions. Record filters and sampling.
3. **Keep evidence beside the classification.** Preserve the fields needed to inspect a rule and disclose where only derived values survive. Check that new writes populate provenance.
4. **Evaluate network and browser shape separately.** A hosting list and a navigation-header check catch different traffic. Document shared-network exclusions and version handling.
5. **Separate declared identity, verification, and purpose.** Preserve signed crawler access as well as assistant access. Do not manufacture a human trigger from either.
6. **Keep history explainable.** Record rule changes and reconstruction methods. Preserve ambiguous and unmatched observations.
7. **Test the unresolved mechanisms.** A smaller Browser total or a favorable ratio is not a completion criterion.

This leaves a more useful counter: I can inspect why requests were classified and choose the next experiment from the evidence. It leaves readership as a question to measure.

## Method, limits, and revision history

The [research directory](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/readers-vs-bots) preserves the original measurements, subsequent corrections, primary-source notes, and aggregate exports. The [claims ledger](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/readers-vs-bots/16-claims-and-work-status-2026-09-06.md) distinguishes completed research from pending implementation. Its correction notes supersede overclaims in the dated early artifacts; those artifacts retain their historical wording.

D1 observations, private Worker logs/traces, and Cloudflare RUM are separate collections. A field absent from D1 may exist in operational diagnostics. The published evidence contains selected observations and reviewed aggregates, not access to the private Cloudflare account. Stored signature results are not independent re-verification, and inferred zone matches are not shared-ID joins. No verified count of distinct people, reading actions, or citations follows from these counters.

**September 6 correction:** added the September 4–5 measurements; removed the universal accuracy thresholds and lower-bound claim; corrected signature arrivals, vendor-IP validation, and network provenance; disclosed the `Accept` defect. The original publication date and URL remain. Runtime fixes and the full controlled-client study are separate work.

I wanted this page to exist on the night I could not find it. If you have a captured browser request that contradicts one of these rules, or a measured explanation for a similar counter gap, tell me where this is wrong.
