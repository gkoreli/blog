---
title: "Please Stop Misreading User-Agent. It’s Messing Up Your Analytics."
seoTitle: "User-Agent Parsing Mistakes That Distort Your Analytics"
alternativeHeadline: "Phone names became bots. URLs became software names. Here is how to test what your analytics claims."
date: "2026-11-05"
description: "Phone names and contact URLs can become false bot labels. Historical reports, live fixes and a reusable test pack show how to check your analytics."
section: engineering
tags: [analytics, bots, cloudflare-workers, testing, ai-agents]
---

# Please Stop Misreading `User-Agent`. It’s Messing Up Your Analytics.

> **Active article — November 10, 2026:** Goga intends to substantially rewrite
> this baseline and publish it. No publication date is assigned. See the
> [article disposition register](README.md); the other audited candidates are closed.

**Two phone names became bot evidence:** `FEVER` in Matomo’s detector and `CUBOT` in isbot reports. Neither was a bot declaration. I later reproduced a CUBOT false match in my own analytics. A phone brand had become a reason to call a request a bot.

The input was the **`User-Agent` HTTP header**: text a requester sends about its software, often with an operating system, device model or reference URL. My code searched that text and gave the request a category. Searching the wrong part produced the wrong explanation.

That affects the question a publisher actually cares about: what is reaching the work? Mislabel a visit and the browser/bot breakdown changes. Discard it as a bot and the visit can disappear from the report. My collector retained the observations; the demonstrated error was their classification, not an invented page request. Agents and crawlers are worth measuring too. They need labels supported by the evidence.

## Other projects have encountered the same kind of mistake

In **2016**, a Matomo user reported an Android header containing the phone-model text `FEVER`. The detector treated it as the **Fever feed reader**. A maintainer confirmed the false positive and [changed the matching expression from `Fever` to `Fever/[0-9]`](https://github.com/matomo-org/device-detector/commit/d5514b275b9f6b0b6f65c8aa9f4ae72b1b32dba8). The software name now needed its version form; a phone model alone was insufficient.

In **2018**, an isbot user [reported four CUBOT Android headers being flagged as bots](https://github.com/omrilotan/isbot/issues/29). A second user reported the same problem in that thread. The maintainer [addressed it through an exclusion/customization change in 2019](https://github.com/omrilotan/isbot/pull/35). The [current inspected pattern list includes a CUBOT-specific exclusion](https://github.com/omrilotan/isbot/blob/fb724fa942d1f2229e0df43fbf45318f2bf56f6f/src/patterns.json). These are historical failures and repairs, not evidence that current isbot or Matomo still makes those mistakes.

A **2026 Rybbit report** shows the wider consequence: an operator said Android WebView sessions stopped appearing after a bot-filtering upgrade and returned after a downgrade. Their [follow-up identifies three client-side signals](https://github.com/rybbit-io/rybbit/issues/971#issuecomment-4321563785), including a missing Chrome-specific browser property despite a Chrome-looking header. That is an adjacent browser-heuristic problem, not a reproduction of our substring bug. I have not independently run that deployment.

These reports establish recurrence across projects and years. They do **not** establish how many sites or visits are affected. Package downloads would not supply that number either. The useful question is whether a specific rule misinterprets specific inputs in the system you run.

For my blog, the starting point was **2,810 of 3,960 recorded page requests with no recognized crawler, tool or service name**. That was about 71%, not a 71% error rate: browser families could still be recognizable, and an absent catalogue name is not a wrong label. The [frozen report](https://github.com/gkoreli/blog/blob/da3cf39eb578a34d9d523e6460fe6b6b5bb58003/packages/blog/drafts/research/analytics-retrospective/127-current-unidentified-and-unsigned-traffic.md) covers October 31 through a partial November 6, 2026 UTC, calculated at 05:42 UTC on November 6. It motivated the investigation; it cannot measure the incidence of the mistakes below.

I reviewed competing implementations, tested counterexamples, rejected a repair that lost useful matches, then followed the accepted changes through the live collector and database. The [earlier bot-detection study](/how-i-separate-readers-from-bots-without-javascript) covers network and navigation evidence. This article examines what the header itself can legitimately contribute.

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

That distinction must survive storage. The expanded catalogue contains **63 names and 74 exact product aliases**. Repeating all the aliases in each record could exceed the database’s 2,048-byte evidence limit. A frozen, versioned encoding now retains them without truncating candidates; old records remain readable under their own formats. [The storage checks](https://github.com/gkoreli/blog/blob/4aad5cd9a1cab8e3986af1a7ed8bf716fa73925f/packages/blog/drafts/research/analytics-retrospective/129-oss-detection-source-review.md#scope-and-continuity) include actual insertion and read-back. A parser fix is incomplete if the database drops the explanation for it.

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

The all-alias control retained every name and matched alias in production storage. All six requests were permanently excluded as owner controls; no optional diagnostic captures were collected. These checks establish six supplied cases through the live request-and-storage path, not accuracy across ordinary traffic. [The production acceptance record preserves the exact chains, costs and cleanup](https://github.com/gkoreli/blog/blob/4aad5cd9a1cab8e3986af1a7ed8bf716fa73925f/packages/blog/drafts/research/analytics-retrospective/134-detection-production-acceptance.md).

## Run the same checks against your own parser

The [User-Agent check pack](https://github.com/gkoreli/blog/tree/main/packages/blog/tools/user-agent-check) contains **16 selected examples**, a standalone runner and an adapter for this blog’s actual parser. It tests whether names come from the right part of the header, whether phone/app exceptions hide separately appended bots, and whether reversing two declarations changes which names survive.

The current blog parser passes all 16 local controls. A deliberately weak whole-header matcher is included to demonstrate failing cases. Neither result estimates accuracy on ordinary traffic, and the demonstration is not another library’s implementation.

To check your own parser, write a small adapter returning every recognized client name and whether the text supplies an automation declaration. The runner needs no network service or private traffic export:

```sh
node check.mjs --adapter /absolute/path/to/your-adapter.mjs
```

Its extraction policy is explicit. A boolean bot library may intentionally use broader signals or choose only a first match; failure to satisfy this pack does not establish a defect under that library’s own contract. Inspect whether its output supports the stronger names and categories your report puts on it. In particular, **no bot declaration found does not mean a person was found**.

## What the fix establishes

The phone-brand case gives me a concrete improvement, checked locally and through the live collector: a copied CUBOT header no longer becomes a bot because of three letters, while separately appended bot names still count. The expanded catalogue recognizes additional reviewed names. The new joint report can explain combinations that separate tables left ambiguous.

I have not measured how often the old mistake occurred in production or how many of the 2,810 unnamed requests the new catalogue would recognize. The local and controlled live results identify specific mistakes and supported additions; they do not turn the remaining requests into people or identified services.

For another analytics implementation, start with those small cases, then check the stored explanation as well as the parser’s return value. Record the rule/version that supplied each label. A change in category counts after an upgrade may reflect a different interpretation of the same traffic, so preserve that boundary before calling it audience growth or decline. A reduction in Unknown is useful only when the evidence has become more informative.

---

## Glossary

| Term | Meaning here | Source |
|---|---|---|
| User-Agent | Request text containing client product claims; it can be imitated | [HTTP semantics, section 10.1.5](https://www.rfc-editor.org/rfc/rfc9110.html#section-10.1.5), June 2022; checked November 6, 2026 |
| Historical misclassification | FEVER phone-model text selected a feed-reader rule; CUBOT reports led to a matcher-customization remedy | [Matomo’s April 2016 fix](https://github.com/matomo-org/device-detector/commit/d5514b275b9f6b0b6f65c8aa9f4ae72b1b32dba8), [isbot’s May 2019 change](https://github.com/omrilotan/isbot/pull/35); checked November 10, 2026 |
| Product token | A parsed software-name claim, distinct from a name hidden inside a URL or another word | [Local lexical implementation](https://github.com/gkoreli/blog/blob/64a95314967f9b79a81c4f711dc27cae95fbb9c6/packages/analytics/src/user-agent-products.ts), deployed source, checked November 6, 2026 |
| Signature coverage | The request components authenticated by a signature; uncovered names and paths need separate evidence | [HTTP Message Signatures, section 7.2.1](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.1), February 2024; checked November 6, 2026 |
