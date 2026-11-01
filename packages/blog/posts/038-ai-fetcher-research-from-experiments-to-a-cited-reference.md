---
title: "My AI Agent Read My Blog. My Analytics Called It a Browser."
seoTitle: "AI Traffic in Browser Analytics: A Live Cloudflare Recheck"
date: "2026-10-31"
lastModified: "2026-11-01"
description: "Two real agent-driven browser requests reached my Worker and were stored as Browser. A fresh day of 628 events shows what signatures, page counts and an earned technical citation actually tell me."
section: engineering
tags: [ai-agents, analytics, http, observability, agentic-engineering]
series:
  id: "measurement-boundaries"
  title: "Measurement boundaries"
  order: 7
---

# My AI Agent Read My Blog. My Analytics Called It a Browser.

Stop counting browsers as people.

I used Codex's browser to open two articles on this site. Both returned HTTP 200. My Cloudflare Worker stored both requests as **Browser**. They carried Chrome headers, normal navigation metadata and even `Sec-Fetch-User: ?1`. An AI agent was driving.

Browser describes how those requests arrived. Calling them two human readers would add something the server never established.

I also pulled a fresh day of production data: **628 stored events, including 72 recorded successful signature verifications. All 72 recorded the requested path as unsigned.** There were 51 requests for the public prompts behind articles, which disappear if I measure only article pages.

These are three different questions:

- What reached the site?
- What does the request prove about its sender?
- Did anyone use the work?

The last one now has a particularly good answer: Arcjet uses my original fetcher experiment as technical evidence in its Web Bot Auth guide. That is why I want to get the first two right.

## A real browser is an AI client too

The browser trial ran on November 1 UTC, still October 31 where I live. Codex opened the original fetcher study and this follow-up through its in-app browser. I watched the production logs with Wrangler, followed each request through its acknowledged database insert, then read back the exact two saved rows. Both classifications matched the logs.

The received headers included:

```text
User-Agent: … Chrome/156.0.0.0 …
Sec-Fetch-Mode: navigate
Sec-Fetch-Dest: document
Sec-Fetch-Site: none
Sec-Fetch-User: ?1
```

Neither request carried a bot declaration or a signature. I supplied no replacement headers. This was the browser's actual request, recorded by the production Worker.

The [Fetch Metadata draft](https://www.w3.org/TR/2026/WD-fetch-metadata-20260921/#sec-fetch-user-header) defines `Sec-Fetch-User` in terms of browser user activation. In this trial, its presence did not establish that a person operated the navigation. The agent produced the request while doing useful browser work.

That does not make browser signals useless. They tell me how a request arrived. They cannot settle who was operating the browser. This is also why I keep the category named Browser rather than presenting it as a verified human count.

These two test visits stay separate from the audience analysis below. [Live trial method and evidence](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/fetcher-study-v2/13-live-browser-findings.md).

## Ask the assistant. Check the server.

For the assistant trials, I gave each product a different URL and asked for the article's H1 and one sentence from its “Maintaining this reference” section. I did not supply the answer or open those assigned URLs myself.

| Live interface | What it returned | What I could match at the Worker |
| --- | --- | --- |
| Gemini, signed out, Flash-Lite | “I cannot access the page directly.” | No assigned-URL match in the captured stream |
| Perplexity, signed out, Search enabled | Said it could not access the page or provide the requested text | No assigned-URL match in the captured stream |
| Codex driving its browser | Rendered the two article pages | Two HTTP 200 requests, two stored receipts and two exact database readbacks |

The first two rows establish failed tasks on those interfaces. A missing log match does not reveal their internal retrieval path or prove they never made a request anywhere. The research record keeps the observation window and access failures explicit. This is a small contemporary recheck, alongside the [September ten-assistant study](/which-ai-fetchers-send-which-headers).

Other interfaces were unavailable behind sign-in, challenge or agreement screens. Claude Code's installed fetch tool stopped on an expired login; Codex's web-open tool reported the URL inaccessible. Those are access limits, not additional successful vendor tests. A third browser page rendered, but I did not obtain the same complete request-to-row chain for it, so it is outside the two accepted controls.

This is the useful habit: compare the answer with what your server actually recorded. A confident answer, a failed tool and a delivered page are different events. Keep all three.

## A signed request can leave the page unsigned

The complete UTC day before these trials contained 72 recorded successful verifications: **63 Exa-origin results carrying an ExaSearchBot declaration and nine Ahrefs-origin results carrying AhrefsBot**.

Every one recorded the destination host as covered. None recorded coverage of the method, path, query, User-Agent, full target URL or body digest. Those are actual stored production outcomes under their recorded verifier versions, freshly retrieved through Wrangler. I did not replay all 72 original requests.

One of them requested the original fetcher article at **23:44:24 UTC on October 31**. I used its exact stored reference to recover the Cloudflare invocation, including the incoming request, verification attempt and acknowledged insert. Its signature's component list was:

```text
("@authority" "signature-agent")
```

That is the host and the signing-origin header. `/which-ai-fetchers-send-which-headers` was present in the received request, but absent from that signed list. The proof had a five-minute validity window.

I replayed that unchanged retained request using the time recorded in the Worker's attempt log. The current verifier in Node and local workerd, plus a pinned independent Python RFC implementation, all verified it. The logged receipt also matched the exact saved row. The key came from Exa's public directory captured later, at 00:37 UTC; this does not reconstruct the directory response used by the original Worker. [Real request, three verifiers and exact joins](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/fetcher-study-v2/12-real-proof-replay.md).

A signature checks the bytes it covers. It cannot authenticate the missing path just because the server received a path alongside it. [RFC 9421's insufficient-coverage section](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.1) describes this explicitly.

For the analytics, I can record the delivered resource and the verified proof together while keeping their relationship clear. The signature supports the covered fields under the selected key and verification rules. It does not independently prove that the signer chose that article, that the unsigned User-Agent is authentic, or that someone asked an assistant a question.

The roles matter too. Exa search access and an Ahrefs SEO crawl are both useful observations. A successful signature does not turn the crawler into an assistant conversation.

Cloudflare's own verified-bot and signed-agent booleans were unavailable in all 628 saved events. My local verifier's result remains a separate result. [Complete-day selection, counts and limits](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/fetcher-study-v2/11-live-day-findings.md).

## Arcjet used the experiment to teach exactly this

Arcjet's [Web Bot Auth guide](https://arcjet.com/learn/web-bot-auth#signature-base) links directly to my original article. Its signature comparison puts my DuckAssistBot capture beside SeatGeek's published ChatGPT example.

The difference is practical. My captured DuckAssistBot proof covers the host and signing-origin header. SeatGeek's example additionally covers the method and path. Arcjet explains why the first can remain valid across paths on the same host during its validity window.

That is an earned backlink **and someone using my hands-on research to explain a technical fact**. The inspectable request made the article useful as a source. I want more of that: work another engineer can check and use, with AI agents making the investigation possible at a scale I could not manage alone.

It also gives me a reason to maintain the original URL. I have corrected broad identity claims, dated the key-directory observations, preserved the September captures and linked later findings. Someone arriving through Arcjet should find the original evidence and the corrections together.

The fresh October 31 records show why that distinction still matters on this site. The original DuckAssistBot example was one observed signing choice. It was never a promise about every bot or every later version of the protocol.

## The research gets traffic too

For the traffic analysis, I selected **October 31, 00:00:00 through November 1, 00:00:00 UTC**, ending before the new browser controls. The preflight counted 628 observations; the export returned 628 rows. Current owner and referrer rules excluded none. That does not establish that every row was organic or that no other unmarked experiment occurred.

| Requested resource | Stored events |
| --- | ---: |
| Canonical articles | 447 |
| Public prompt pages | 51 |
| Hubs and other site pages | 130 |
| **Total** | **628** |

The requests covered 39 articles and the public prompt pages for 20 articles. Counting them separately makes the research process visible without adding prompt views to article views.

The original fetcher study received **18 article requests and one prompt-page request** that day. The first version of this follow-up received **eight article requests and three prompt-page requests** after being published partway through the day. The original's named declarations included ExaSearchBot, Meta-WebIndexer, OAI-SearchBot and AhrefsBot. The follow-up had a ClaudeBot declaration and seven unnamed requests classified as Cloud browser.

That is observed access to the work and its supporting material. Arcjet's citation establishes something further: actual use of a published observation in another technical explanation. Both matter to a publication whose audience includes agents as well as people.

I am not turning this into a percentage growth claim. Classification changed within the day, the articles had different publication exposure, and the earlier 397-event capture covered a different partial-day window. Comparing those totals would produce a bigger number with a weaker meaning. The complete [resource and method breakdown](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/fetcher-study-v2/live-day-findings.json) keeps those conditions visible.

## What I changed in the analytics

The September study exposed cases where my labels hid useful distinctions. A signed request could be grouped as an assistant even when its declared role was crawling. A successful verification flag could conceal which fields were protected. A report could make unavailable data look like a plausible zero.

The implementation now keeps the declaration, network check, signature result, signed fields and documented role separately. The fresh Exa record saves which signature was checked, which rules applied and which fields it covered alongside the requested page. Ahrefs retains its crawler role. A missing Cloudflare result stays unavailable.

The reports also [reject missing counters and inconsistent totals](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/discovery-experiment-02/06-public-report-integrity.md). A failed report stays a failure. That matters more than a chart that always looks complete.

I hardened how the verifier reports a newer key-discovery format too. An unsupported location now stays unsupported rather than being called bad cryptography. The generated inputs used for that change are [regression tests](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/fetcher-study-v2/06-discovery-profile-results.md); they are separate from the real requests and traffic findings in this article.

There is a [minimal Worker example](https://github.com/gkoreli/blog/tree/main/packages/analytics/examples/minimal-worker) for trying the collector outside this blog. It has its own empty-install schema instead of depending on this site's history, and uses the real collector, owner endpoint and report. It is ready for another operator to try. I have not yet established independent adoption.

## Run the check on your own site

Start with a question you can answer from both ends: ask an assistant to open a page, then inspect what reached the server.

Give it a unique URL, save the exact prompt and time, and start the log stream before submitting. This site's command is:

```sh
pnpm exec wrangler tail gkoreli-com --format json --method GET
```

Wrangler's `--search` filters console messages. It does not search request URLs, so putting the probe label there would miss these invocations. Keep the raw stream private, select the assigned URLs afterward and publish only what the finding needs.

Follow each request into storage. My Worker logs an operation ID before processing and a database-row ID after the insert is acknowledged. Those IDs let me check the exact two rows instead of guessing from nearby traffic. The [extractor and method](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/fetcher-study-v2/08-live-trace-method.md) preserve that join.

Finally, read the signed-component list before interpreting a verified flag. Keep an assistant's answer, a delivered resource, a signing result and an external citation as their own observations.

I want this blog to become a source people and agents can use. Arcjet already using the experiment is a concrete step toward that. The next step is making the evidence behind it easier to inspect every time the system changes.

---

## Glossary

| Term | Meaning and primary basis | Date |
| --- | --- | --- |
| Browser signals | Request and navigation characteristics; they do not identify the operator. [Fetch Metadata working draft](https://www.w3.org/TR/2026/WD-fetch-metadata-20260921/). | September 21, 2026 |
| Signature coverage | The message components protected by the proof. [RFC 9421 §7.2](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2). | February 2024 |
| Technical reuse | Arcjet uses the published DuckAssistBot capture to teach a signature distinction. [Direct passage](https://arcjet.com/learn/web-bot-auth#signature-base). | Rechecked November 1, 2026 UTC |
| Live recheck | Actual browser actions, a production log stream, exact database readbacks and a separately selected complete day. [Research record](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/fetcher-study-v2). | November 1, 2026 UTC |

The September vendor captures retain their original dates. This revision replaces the earlier follow-up's emphasis on generated cases with the live observations and real production selection above.
