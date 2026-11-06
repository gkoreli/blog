---
title: "My Bot Detector Mistook a Phone Brand for a Bot"
seoTitle: "CUBOT Exposed a Bug in My Bot Detector"
alternativeHeadline: "A copied phone header exposed a word-matching bug. I fixed it while keeping names, request clues and verified signatures separate."
date: "2026-11-05"
description: "A copied CUBOT header triggered a broad bot match. The live fix stops that mistake without pretending it found a human."
section: engineering
tags: [analytics, bots, cloudflare-workers, testing, ai-agents]
---

# My Bot Detector Mistook a Phone Brand for a Bot

My bot detector called a copied **CUBOT phone header** a bot because the brand ends in “bot.” A controlled live request now avoids that mistake. It still does not establish that a person sent the request.

That distinction matters on my blog. In a seven-day report, **2,810 of 3,960 recorded page requests had no crawler, tool or service name recognized by my catalogue**. Their browser family could still be recognizable. I asked agents to investigate those gaps, read competing detectors’ source code and improve our library. The first useful result was a mistake in a rule I already had.

The changes address three problems:

- **Match software names in the right place.** A phone model, wallet app or URL containing bot-related text should not become a bot declaration.
- **Keep names, reported jobs and proof separate.** A request can lack a recognized name while carrying useful provider-category or signing evidence.
- **Preserve what the database can explain later.** New names need source records, versioned storage and tests that actually write and read the evidence.

Local regressions were followed by six controlled requests through the deployed collector and database. Those live checks establish the tested behavior, not how often the old phone-brand bug occurred.

The production figures cover included stored page events from **October 31 through a partial November 6, 2026 UTC**; the report was calculated at 05:42 UTC on November 6. The copied-header tests are separate controls. They are not added to those traffic counts. [The dated baseline preserves the collector’s scope and exclusions](https://github.com/gkoreli/blog/blob/da3cf39eb578a34d9d523e6460fe6b6b5bb58003/packages/blog/drafts/research/analytics-retrospective/127-current-unidentified-and-unsigned-traffic.md).

The [earlier bot-detection study](/how-i-separate-readers-from-bots-without-javascript) explains the network and navigation rules. This investigation tests the names feeding those rules.

## Three letters were enough

The old generic matcher included this expression:

```js
/bot\b/i.test("CUBOT MAX") // true
```

It checks for a word boundary after `bot`, but none before it. In a copied Android User-Agent from [isbot’s browser fixtures](https://github.com/omrilotan/isbot/blob/3f9c982acd95b1be033fa3c14b2a7ece565ba10a/fixtures/browsers.yml#L149-L153), the phone model supplied the matching text:

```text
Mozilla/5.0 (Linux; Android 6.0; CUBOT MAX)
AppleWebKit/537.36 (KHTML, like Gecko)
Chrome/72.0.3626.121 Mobile Safari/537.36
```

The line breaks above are for reading; the test uses one header value. My classifier called it Other bot even though the match was a phone-model token. A broad `phantom` match made a similar mistake with Phantom’s mobile-app header instead of the automation tool PhantomJS. A URL ending in `/robot` could also trigger the generic bot rule. [The source audit and controls record those failures](https://github.com/gkoreli/blog/blob/4aad5cd9a1cab8e3986af1a7ed8bf716fa73925f/packages/blog/drafts/research/analytics-retrospective/130-detection-domain-audit.md).

The repair separates the names and versions sent in the header, called product tokens, before applying the matching rules. Named-client matching and the check for expected browser-navigation headers now share those parsed tokens. The generic rule keeps reviewed tool names and bot-name conventions, with narrow treatment of the phone and wallet cases.

The first repair had another hole: a contact URL containing `;GPTBot/1.0` could still supply a GPTBot name. The released parser excludes recognized contact-link spans before matching names. A separately appended `GPTBot/1.0` outside the link still matches.

The optional diagnostics had a related problem. They could read Chrome 150 from a contact URL, yet miss lowercase `chrome/150.0` that the main parser recognized. They now use the same token boundaries. The fuller diagnostic can still distinguish Edge or Opera; it no longer gets a browser name from the checked URL forms. [The preserved failures and six exact local replay controls](https://github.com/gkoreli/blog/blob/4aad5cd9a1cab8e3986af1a7ed8bf716fa73925f/packages/blog/drafts/research/analytics-retrospective/131-detection-article-editorial-work.md#local-editorial-regression-replay) show the scope of that change. It handles the documented scheme-prefixed link forms, not every possible header or link syntax.

The useful regression tests check more than the clean example:

| Input under the recorded missing-context conditions | Earlier result | Local candidate |
|---|---|---|
| Copied CUBOT Android header | Other bot | Unresolved |
| Browser header plus a `/robot` reference URL | Other bot | Unresolved |
| CUBOT header plus `UnknownBot` | Other bot | Other bot |
| CUBOT header plus `GPTBot/1.0` | AI crawler | AI crawler |

A whole-header exception for CUBOT would be an easy way to break the last two cases. The exception must remove the weak phone-model signal without hiding a separate bot claim. Conversely, removing the bad match cannot turn missing evidence into a human visit. With the navigation headers absent, Unresolved is the appropriate result.

## The first fix lost too many bot matches

Requiring `bot` to be a whole word would also lose unknown names such as `CustomBot`. A stricter first attempt instead required an unknown bot name to include a slash version, such as `CustomBot/1.0`. It repaired the phone cases, but discarded useful bare names such as `UnknownBot`. We rejected that rule.

We compared the earlier and candidate implementations on the same supplied strings. The table records the first token-based comparison, before the later contact-link and diagnostic repairs. It explains the rejected policy, not the final release’s detection rate:

| Upstream examples | Examples inspected | Earlier non-browser matches | Version-only candidate, rejected | First token-based candidate |
|---|---:|---:|---:|---:|
| isbot crawler YAML subset | 614 | 194 | 141 | 168 |
| crawler-user-agents instances | 2,124 | 1,207 | 770 | 1,060 |

That first token-based candidate removed matches based only on contact URLs, embedded substrings and malformed product text. Those losses remain visible rather than being called successful detections. In its separate 551-entry browser-fixture subset, six changed results were the four CUBOT and two Phantom cases. Two other entries remained non-browser: Yahoo Slurp and the explicitly named Amzn-User fetcher. An upstream file called “browsers” is useful test material, not ground truth for my site’s client-role rules.

These upstream sets overlap, so I do not combine their denominators. They contain declared examples, not authenticated operators or a representative sample of my traffic. The [comparison conditions and remaining losses](https://github.com/gkoreli/blog/blob/4aad5cd9a1cab8e3986af1a7ed8bf716fa73925f/packages/blog/drafts/research/analytics-retrospective/130-detection-domain-audit.md#local-lexical-candidate-and-rejected-recall-tradeoff) are part of accepting the narrower rule.

## Other detectors helped by exposing different mistakes

The useful lesson from reading competing implementations was more specific than “install a bigger bot list.”

[GoatCounter’s Go isbot dependency already has a CUBOT exception](https://github.com/arp242/isbot/blob/305a021896f64c75ccbd18f5ba89183e8bdcdb07/user_agent.go#L76-L80). Its bot check and typed reasons are useful comparisons. My report also needs the declared crawler or agent role, alongside independent verification facts; a single bot/not-bot result would not supply that explanation.

[Matomo’s bot parser](https://github.com/matomo-org/device-detector/blob/0ca48a37aa7a4388e9ec5897f033aaef9155ed90/Parser/Bot.php#L68-L95) combines a broad precheck with detailed named records. Its data helped identify missing names and roles worth reviewing. I kept our all-match behavior instead of adopting a first-match choice: when two names appear, their order should not choose an identity.

The JavaScript isbot project supplied the browser counterexamples. Its [preparation code imports examples from Matomo and crawler-user-agents](https://github.com/omrilotan/isbot/blob/3f9c982acd95b1be033fa3c14b2a7ece565ba10a/scripts/prepare/externals/index.js#L7-L29). Agreement among those projects is partly shared source material, so it cannot serve as independent confirmation of accuracy.

I used those sources to find test cases and review candidates. No new detection dependency was added. The [pinned-source review](https://github.com/gkoreli/blog/blob/4aad5cd9a1cab8e3986af1a7ed8bf716fa73925f/packages/blog/drafts/research/analytics-retrospective/129-oss-detection-source-review.md) separates inspected code, executed comparisons, first-party documentation and untested parsers.

## A name, a job and a signature answer different questions

A bot’s name is text supplied with a request. A provider category such as AI Crawler describes a reported role. A verified signature authenticates its covered components against a key. Combining those facts is useful; replacing one with another would make the report harder to trust.

The production baseline made that distinction concrete. In the frozen 3,960-event scope, a joined query found exactly **eight generic-bot events with no recognized name, no signature headers and Cloudflare’s AI Crawler category**, plus two with AI Search. Another two Other-bot events marked AI Crawler did have a recognized GoogleOther name. [The joined evidence resolves the earlier aggregate lower bound](https://github.com/gkoreli/blog/blob/4aad5cd9a1cab8e3986af1a7ed8bf716fa73925f/packages/blog/drafts/research/analytics-retrospective/132-joined-client-evidence-and-retained-headers.md).

There is already a useful job label on those eight requests. That still does not name a particular crawler or service, and the query cannot tell me that most other unnamed traffic is AI. The same report contains 164 named AI-crawler events, all unsigned. Lack of a signature does not make a declared name disappear.

The new report view shows selected-name state, provider category and signature result together. Its totals must reconcile with the existing tables. It distinguishes one selected catalogue name from no single selection, because the latter can also mean multiple recognized claims. A header containing `ChatGPT-User/1.0 ExaUser/1.0` has two recognized names; selecting neither is different from finding none.

The deployed view passed a separate live check: its totals reconciled, and a cache hit returned the same report body and update time as the initial miss. That mixed-version report is not a before-and-after accuracy test. [The served-report checks and their limits are recorded with production acceptance](https://github.com/gkoreli/blog/blob/4aad5cd9a1cab8e3986af1a7ed8bf716fa73925f/packages/blog/drafts/research/analytics-retrospective/134-detection-production-acceptance.md).

The frozen production scope happens to contain 2,810 records with no recognized name and 1,150 with one. It contains no multiple-name record. That measured equality does not justify coding “no selected name means no recognized names” as a permanent rule.

The query also exposed a cost: **85,639 rows read**, above the planned 50,000-read review threshold, with zero writes and one attempt. The data result was complete; the cost check failed. I kept both facts and did not rerun the query to obtain a cleaner receipt.

## Keeping the code’s responsibilities separate

The refactor has a practical boundary: parsing a name must not grant trust to it.

The new catalogue contains **63 crawler, tool and service names and 74 exact product aliases**, their declared roles and source records. Browser families are a separate measurement. Reviewed additions include SEO crawlers and HTTP libraries such as `python-httpx`, `axios` and `node-fetch`. A library name can explain how a request was made without identifying its operator or making it an AI request.

The parser extracts request claims. Classification interprets those claims and request context. Separate signature and published-network checks retain their own results. Observations retain their collection version, and reports describe the stored evidence. Keeping those responsibilities apart lets me add a name without accidentally adding a verification method or rewriting old traffic.

It also caught a persistence problem. Repeating the expanded name and alias lists could produce **2,378 bytes of classification JSON**, exceeding the existing **2,048-byte limit**. Dropping aliases would have made the record fit while losing the explanation for its result.

The repair stores matched aliases by their positions in a frozen, versioned list. Candidate names remain explicit. A worst-case control containing all 63 names and 74 aliases now occupies **1,355 bytes**. An actual local D1 insert and read-back preserves that complete record; the helper also verifies byte-for-byte preservation of a legacy control. Unknown future profiles remain unassessed rather than being decoded under today’s list. [The catalogue and storage acceptance are recorded with the source review](https://github.com/gkoreli/blog/blob/4aad5cd9a1cab8e3986af1a7ed8bf716fa73925f/packages/blog/drafts/research/analytics-retrospective/129-oss-detection-source-review.md#scope-and-continuity).

## Six live requests tested the whole path

After deployment, I sent six controlled `curl` requests through the live collector. Each had an exact chain from execution and Worker acknowledgement to its stored row and current collection receipt. This checked what the database retained, not just what a helper returned.

| Supplied control | Stored result | What it checks |
|---|---|---|
| Copied CUBOT phone header | Browser signals; no catalogue name | The phone brand no longer triggers the generic bot rule |
| Bot text inside a contact URL | Browser signals; no catalogue name | The checked URL does not leak a crawler name |
| Separate `GPTBot/1.0` claim | AI crawler; GPTBot | A separate product claim still matches |
| `SemrushBot` claim | SEO crawler; SemrushBot | A reviewed crawler keeps its role |
| `node-fetch` claim | HTTP client; node-fetch | A library name does not become an AI crawler |
| All 74 aliases for 63 names | Unresolved; multiple claims | Every name survives storage without choosing one |

The first two deliberately included browser-navigation headers and came from a network that matched neither our hosting list nor our archiver list. That is why they received Browser signals here, while the earlier missing-context local controls remained Unresolved. I know these were `curl` requests because I sent them. **None received a human label.** A GPTBot name supplied by this test is not genuine OpenAI traffic or a verified operator.

The all-alias control retained all 63 names and 74 matched aliases in **1,341 bytes** of production classification evidence. That is a separate live record from the 1,355-byte local control above. All six requests were permanently excluded as owner controls; no optional diagnostic captures were collected. The direct read-back used one SELECT, 54 rows read and zero writes in one attempt. That is the cost of that query, not the whole experiment.

The temporary test pages were closed before their authorization expired and returned 404. These checks establish six supplied cases through the live request-and-storage path. They do not measure accuracy across ordinary traffic or identify the operators behind it. [The production acceptance record preserves the chains, conditions and cleanup](https://github.com/gkoreli/blog/blob/4aad5cd9a1cab8e3986af1a7ed8bf716fa73925f/packages/blog/drafts/research/analytics-retrospective/134-detection-production-acceptance.md).

## What the fix establishes

The phone-brand case gives me a concrete improvement, checked locally and through the live collector: a copied CUBOT header no longer becomes a bot because of three letters, while separately appended bot names still count. The expanded catalogue recognizes additional reviewed names. The new joint report can explain combinations that separate tables left ambiguous.

I have not measured how often the old mistake occurred in production or how many of the 2,810 unnamed requests the new catalogue would recognize. The local and controlled live results identify specific mistakes and supported additions; they do not turn the remaining requests into people or identified services.

For another analytics implementation, the useful tests are small: put a phone model, an app name and a contact URL through the detector; append a known bot name to each; then check the stored explanation as well as the label. A reduction in Unknown is useful only when the evidence has become more informative.

---

## Glossary

| Term | Meaning here | Source |
|---|---|---|
| User-Agent | Request text containing client product claims; it can be imitated | [HTTP semantics, section 10.1.5](https://www.rfc-editor.org/rfc/rfc9110.html#section-10.1.5), June 2022; checked November 6, 2026 |
| Product token | A parsed software-name claim, distinct from a name hidden inside a URL or another word | [Local lexical implementation](https://github.com/gkoreli/blog/blob/64a95314967f9b79a81c4f711dc27cae95fbb9c6/packages/analytics/src/user-agent-products.ts), deployed source, checked November 6, 2026 |
| Signature coverage | The request components authenticated by a signature; uncovered names and paths need separate evidence | [HTTP Message Signatures, section 7.2.1](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.1), February 2024; checked November 6, 2026 |
