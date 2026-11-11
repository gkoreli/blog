---
title: "Please Stop Misreading User-Agent. It’s Messing Up Your Analytics."
seoTitle: "User-Agent Parsing Mistakes That Distort Your Analytics"
alternativeHeadline: "A browser header is a claim, not a verified device or identity. Here is how to keep that distinction in your analytics."
date: "2026-11-11"
description: "Windows 11 can look like Windows 10. An iPad can look like a Mac. See how widely sites read User-Agent, how crawler counts go wrong, and how to audit your own analytics."
section: engineering
tags: [analytics, bots, cloudflare-workers, testing, ai-agents]
---

# Please Stop Misreading `User-Agent`. It’s Messing Up Your Analytics.

**Out of every 100 requests calling themselves Googlebot, about 36 passed checks confirming they came from Google.** That was the result of one operator’s 14-day audit across nine websites, covering an estimated 35,355 requests using the name.

Googlebot is Google’s crawler: software that fetches pages for its search index. Any program can copy its name into `User-Agent`, the text software sends to describe itself. The audit checked the sender using Cloudflare’s verified-bot labels or the operators’ published IP address lists. The remaining requests were unverified; outdated address lists can leave genuine crawlers unverified too.

Those checks can run as requests arrive. If your report counts the name without checking the sender, it can give you a badly inflated picture of Google’s visits. Store the claimed name and the check result separately, then make clear which one your count represents.

The problem extends beyond copied bot names. A Windows 11 computer can report `Windows NT 10.0`. An iPad can send the same header as a Mac. An Android tablet requesting the desktop site can look like Linux and get offered a Linux installer. These values can mislead the teams deciding which devices to test, which downloads to offer and which crawlers reach their work.

This is a widely used input. In a June 2023 study, scripts read the browser’s `navigator.userAgent` property on **88.3% of the 89,763 homepages** researchers successfully visited from Chrome’s list of popular sites. That measures how widely the text was read. How many sites turned it into incorrect analytics remains an open question.

My own detector had a simpler mistake: it called a copied CUBOT phone header a bot because the brand ends in “bot.” Fixing that led to a wider audit. I found twelve overlapping types of failure, corrected more of our browser and OS reporting, and built a reusable way to inspect what the header actually supports.

## Check where “Googlebot” came from

The name and the sender’s network address are separate pieces of evidence. Google publishes address ranges for its crawlers, so you can check a request claiming to be Googlebot against those ranges:

1. Read the request’s source IP address from your server’s connection or your trusted CDN. Use the original sender’s address supplied by that CDN when a proxy sits in front of the server.
2. Compare it with Google’s published **common-crawler address ranges**. An address belonging to Google Cloud generally is not enough; another customer can run software there.
3. Record whether it matched, did not match, or could not be checked. Keep the address-list version and check time so you can explain the result later.

Google also documents a DNS method: look up the address’s hostname, check that it belongs to the appropriate Google crawler domain, then look up that hostname and confirm it returns the original address. The second lookup matters; accepting a Google-looking name alone would repeat the original mistake. The exact domains and lists are in Google’s verification guidance in the sources below.

These methods are available before you make a traffic report. In the nine-site audit, the operator revisited three earlier analyses that had relied on server logs alone. Bringing in Cloudflare’s records supplied the missing verification and exposed requests served from cache that never reached the server. Those are two separate ways a crawler report can go wrong.

Our collector already checks published crawler addresses during collection. When a supported name such as Googlebot appears, it takes the source address from the Cloudflare request context and compares it with the appropriate published list. It caches the list and stores the outcome with the check time and list snapshot. A failed lookup remains unavailable; it does not silently become “fake bot.” The [collection code](https://github.com/gkoreli/blog/blob/6ec953301cc146f9a84f23deabf7972e767f96f0/packages/analytics/src/index.ts#L74-L84) and [address checker](https://github.com/gkoreli/blog/blob/6ec953301cc146f9a84f23deabf7972e767f96f0/packages/analytics/src/vendor-ip.ts#L209-L222) show where this happens.

That check supports a claim about the sending network. It does not establish that a person read the page, or authenticate every word in the header. The CUBOT mistake happened earlier: we extracted a bot name from a phone brand. Our library needs to answer both questions correctly: **what name was supplied, and what independent evidence supports the sender?**

## The problem is larger than one phone brand

The twelve families are a working map of this investigation, not a count of every possible User-Agent bug. Several can affect one request at the same time.

| Failure | What can go wrong |
| --- | --- |
| Names taken from the wrong text | A phone model or contact URL becomes a bot name. |
| Compatibility products | Chrome’s Safari token is treated as an installed Safari browser. |
| Frozen versions | A reported Android or iOS version is presented as the device’s actual OS. |
| Desktop presentation | An iPad or Android tablet is counted as desktop hardware. |
| Contradictory claims | The first regex chooses an OS or browser from incompatible values. |
| Unverified names | A Googlebot or GPTBot string becomes an authenticated vendor. |
| Browser automation | Browser-shaped traffic becomes a count of people. |
| Missing signals and WebViews | An absent property or header becomes proof of a bot. |
| Client Hints | Extra client-supplied fields are treated as complete or authenticated. |
| Policy and purpose | A robots token or crawler name becomes evidence of training, reading or a human task. |
| Parser cost and raw data | Attacker-controlled strings consume excessive work or retain private text. |
| Changing rules and consumers | A parser update or dropped explanation looks like audience growth or decline. |

There is no defensible total of affected people behind this table. Some cases concern whole browser/version/mode populations by design. Others are confirmed historical library bugs, operator reports or my own constructed controls. The [full evidence map](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/137-user-agent-pain-point-map.md) records incidents, scope and disposition for each family.

### A modern OS can report an old version

Chrome deliberately reduces information in its header. On May 11, 2023, its [rollout record](https://www.chromium.org/updates/ua-reduction/) reported enabling the reduced string for **100% of Android clients on Chrome 110 and above** through its rollout system. Different phones and Android releases can consequently report the same `Android 10; K`. Those fields no longer distinguish their actual OS version or model.

Other documented compatibility values include `Mac OS X 10_15_7` and `Windows NT 10.0`. Microsoft explicitly documents that [Windows 10 and Windows 11 cannot be distinguished by that User-Agent value](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/how-to-detect-win11). A report can preserve what was sent while leaving the actual OS version unresolved.

[Safari 26 makes the distinction particularly visible](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/): its iOS header still says `CPU iPhone OS 18_6`, while the browser product says `Version/26.0`. Apple describes this as freezing the OS part for compatibility. A more complete regular expression cannot recover information the browser deliberately stopped sending.

### A tablet can ask to look like a desktop

WebKit documented [Mac-identical headers on iPad in its Safari 13 release](https://webkit.org/blog/9674/new-webkit-features-in-safari-13/). In [WebKit bug 212937](https://bugs.webkit.org/show_bug.cgi?id=212937), a developer asked how to distinguish iPadOS from macOS for logs and metrics. Maintainers explained that sharing the header was intentional. A later [Sentry issue](https://github.com/getsentry/sentry-javascript/issues/12127) reports the same analytics pain.

Chrome documents another example: [desktop mode on supported premium Android tablets](https://developer.chrome.com/blog/desktop-mode) can send a Linux-shaped desktop header. The model and platform Client Hints can change too. Chrome specifically warns that a site relying on these values might offer the user a Linux download.

That is why our form report describes **markers and preferences**. No mobile marker does not establish desktop hardware. A `?0` mobile hint does not authenticate a laptop. I have not added touch-point probes or reconstructed hidden device identities to fill that gap.

## What one day of our own logs contained

I checked **2,414 HTTP request records** retained in the blog Worker’s Cloudflare logs for November 9, 2026. They include pages, assets, APIs, feeds and failed probes. I assessed the supplied headers locally; I have not established that the logs contain every request that day.

Building that sample required two exports because the first reached its 2,000-record cap. A second returned 535 records; the 120 overlapping records matched exactly. Removing those duplicates left the 2,414 HTTP records and one separate scheduled invocation.

| Supplied evidence in the 2,414 HTTP records | Records | What it supports |
| --- | ---: | --- |
| Chromium selection with a Safari product token | 1,158 | A Safari word is not a count of Safari browsers. |
| `Windows NT 10.0` or `Mac OS X 10_15_7` | 1,049 | The reported version also matches a documented compatibility value. |
| No User-Agent header | 29 | The header is missing; the operator remains unidentified. |
| WebView marker | 25 | An embedded-browser declaration, without a genuine-device label. |
| No catalogue-name candidate | 1,743 | Our named-client catalogue did not resolve a name. |
| Provider category present, with no catalogue name | 89 | Provider category and software-name extraction answer different questions. |

The 1,049 version-pattern records split into 694 Windows and 355 macOS claims. They are not 1,049 demonstrated mistakes: a requester could really run the reported OS, copy a browser string or use a reduced one. The data establishes the ambiguity our report must preserve.

The audit also corrected our own new warning. Two Firefox-shaped headers reported only `Mac OS X 10.15`. My first caution treated that partial value as matching the full frozen `10_15_7` pattern. It now requires the complete documented version; the reported partial version stays intact. That reduces the caution count from 1,051 to 1,049, without changing browser/OS selection or traffic categories. None of this day's records reproduces the contradictory browser/OS or malformed mobile-hint cases below. Their repairs remain supported by controlled counterexamples.

The analytics database separately retained **595 page observations** for that day: 388 without a recognized crawler, tool or service name and 207 with one. These are a different population from the log export. Current referral exclusions have not been applied, so 595 is not the public dashboard’s included-view total.

Of those page records, 101 stored a successful signature-verification result. None recorded that the signature covered `User-Agent`, so I cannot use those signatures to confirm the software names in that header. This inspects previously stored results; it does not verify the signatures again. All 595 records have classification and signature details, but none has the optional browser/OS diagnostics needed to examine those claims from the database alone.

The raw headers stay private. The [dated method and aggregate findings](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/139-own-data-user-agent-audit.md) preserve selectors, export limits, failed assumptions and the separate populations. They also retain catalogue-review leads, including Sofyabot, Twitterbot and FreshRSS declarations; seeing a product does not authenticate its operator.

## First, parse the right part of the header

The **`User-Agent` HTTP header** often mixes software products, compatibility names, comments, device descriptions and reference URLs. [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#section-10.1.5) defines products/comments and warns about compatibility masquerading. The meaning of a matched word depends on where it occurs and what claim it supports.

My old generic rule included:

```js
/bot\b/i.test("CUBOT MAX") // true
```

It required a boundary after `bot`, but none before it. A copied Android header’s phone-model text supplied the match. A reference URL ending in `/robot` could also change the category to Other bot. A broad `phantom` match confused Phantom’s mobile app with PhantomJS.

These mistakes have independent precedents. In 2016, a Matomo user supplied a header containing the Android phone model `FEVER`; its detector selected the Fever feed reader. A maintainer [fixed the rule by changing `Fever` to `Fever/[0-9]`](https://github.com/matomo-org/device-detector/commit/d5514b275b9f6b0b6f65c8aa9f4ae72b1b32dba8). In 2018, an isbot user [reported four CUBOT headers](https://github.com/omrilotan/isbot/issues/29), and a second reporter added another. The project [addressed the case in 2019](https://github.com/omrilotan/isbot/pull/35). These are historical bugs and remedies, not accusations that the current libraries still make those mistakes.

Our repair uses shared product boundaries and excludes recognized absolute-URI spans before extracting names. The first candidate still let `;GPTBot/1.0` leak out of a contact URL; a further review caught and repaired it. A separately appended GPTBot product survives. The lexer supports a reviewed dialect of real headers; it is not a complete validator for every HTTP comment or malformed input.

### Repair the mistake without suppressing useful evidence

A whole-header CUBOT exception would hide a separately appended bot. Requiring every unknown bot name to have a slash version would lose useful bare declarations such as `UnknownBot`. We rejected that version-only candidate.

| Same supplied examples | Examples | Earlier non-browser matches | Rejected version-only rule | First retained token rule |
| --- | ---: | ---: | ---: | ---: |
| isbot crawler YAML subset | 614 | 194 | 141 | 168 |
| crawler-user-agents instances | 2,124 | 1,207 | 770 | 1,060 |

These are historical intermediate comparisons before subsequent URI repairs. They show a tradeoff, not the final release’s detection rate. The sets overlap, and their labels are not authenticated operators or a representative traffic sample. isbot also imports upstream examples from Matomo and crawler-user-agents, so their agreement is not independent confirmation.

This is a maintenance problem too. Mozilla’s [version-100 investigation](https://hacks.mozilla.org/2022/02/version-100-in-chrome-and-firefox/) describes real site breakages from version assumptions, while noting that a survey of common parsing libraries found no problems. An incident in a site-specific rule is not evidence that all libraries fail.

## Stop choosing the most convenient explanation

The broader audit found a different error in our optional request diagnostics: priority-based selection.

| Constructed input | Earlier diagnostic | New diagnostic |
| --- | --- | --- |
| Chrome, Edge and Opera product claims | Edge selected by priority | Single browser unresolved |
| Android 14 and Windows NT 10.0 | Android selected | OS unresolved |
| Windows NT 10.0 and 11.0 | First version selected | OS/version unresolved |
| iOS 16_3 and 17_0, then reordered | Reported OS version changed | Conflict retained in either order |

These are local counterexamples, not observed devices or production error rates. The iOS case was especially useful: our capability check already abstained on contradictory versions, but our OS display still selected one. Two consumers gave different impressions of the same evidence.

I separated browser and platform claims into reusable domain values. The browser rule keeps ordinary Chrome+Safari and Chrome+Edge/Opera compatibility combinations. It abstains when two incompatible vendor claims would otherwise be resolved by priority. The existing coarse Chromium compatibility-family clue can remain useful even when no single browser vendor can be selected.

The platform value considers all supported OS/version claims. Android with a Linux marker, or ChromeOS with a Linux marker, is not automatically a conflict. Different supported OS families or incompatible versions are. Missing minor versions remain absent; invalid version text does not become zero or disappear beside a valid claim.

The same values now supply optional diagnostics under a new prospective profile, **`2026-11-10.1`**. I have not reclassified old rows. These particular OS values are optional diagnostics; repairing them does not establish a change to the blog’s total traffic or ordinary traffic categories.

## A name is still not identity, purpose or a person

A script can send a genuine-looking browser header too. [Chromium’s own emulation API](https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setUserAgentOverride) can override the string and Client Hint metadata. The same distinction between a supplied name and independent evidence applies beyond Googlebot.

Our analytics therefore keeps declared names, roles, provider/network evidence and signatures separate. A signature authenticates only its covered components. A valid proof that omits `User-Agent` cannot authenticate its unsigned software name. My [earlier live agent investigation](/ai-fetcher-research-from-experiments-to-a-cited-reference) demonstrates this boundary and traces agent-operated browsers that the analytics classified as Browser signals.

The source of truth depends on the question. Test a feature in the browser when you need to know whether that browser supports it. Inspect a published network range or a covered signature when you need origin evidence. Cloudflare’s [actual incoming `request.cf` metadata](https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties) is distinct from a caller sending a similarly named HTTP header; its Bot Management fields are only set under the documented capability. Unavailable is not false. None of these methods, by itself, establishes that a person read an article.

That agent access matters. Browser automation can retrieve and use our work. Neither “human” nor “worthless bot” is a justified replacement for the evidence we actually have.

Purpose has another trap: [Google-Extended has no separate HTTP request User-Agent](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers). It is a robots policy token. Finding that text does not establish an authenticated crawler or prove that a particular request trains a model. Our supplied-input assessment flags this distinction.

Missing data has similar limits. A [Rybbit operator reported](https://github.com/rybbit-io/rybbit/issues/971) Android WebView visits disappearing after a bot-filtering upgrade and returning after a downgrade. Their follow-up identified three client heuristics, including a missing Chrome-specific browser property despite a Chrome-looking header. This is a reported adjacent mechanism, not a reproduction of our substring bug or a population estimate.

## Client Hints add information, with conditions

The [UA Client Hints specification](https://wicg.github.io/ua-client-hints/) gives `Sec-CH-UA-Mobile` a precise meaning: preference for a mobile experience. Brand lists can contain deliberately arbitrary entries and vary in order. Other values depend on platform support and policy; some require explicit requests. They are not certificates of identity or a complete hardware inventory.

The [specification’s analytics discussion](https://github.com/WICG/ua-client-hints/issues/115) also raises the difficulty of distinguishing a minority Chromium browser from compatibility brands and GREASE. That is a documented design concern, not a measured amount of inflated Chrome traffic.

I retained our existing consumption of an already-supplied mobile preference. I have not added high-entropy requests, an `Accept-CH` negotiation or a new brand collector. Android’s [WebView guidance](https://android-developers.googleblog.com/2024/12/user-agent-reduction-on-android-webview.html) further explains that custom User-Agent strings can change which hints are available. A missing hint needs an unknown state, not a fabricated bot verdict.

That review found another concrete bug in our code: JavaScript’s `trim()` accepted non-breaking spaces around `?1` as if they were HTTP whitespace. Native `Headers` preserves those bytes; the value is not the documented boolean. The form parser now accepts only HTTP space/tab padding and leaves that malformed hint unsupported. Collection, form and incoming-request API profiles advance prospectively; previous profiles remain readable. Final-classification, catalogue and signature profiles are unchanged.

## Make the boundary usable in the library

The new pure export is **`assessUserAgent` from `@gkoreli/analytics/user-agent`**. It accepts a supplied string or null and an optional already-received mobile preference. It performs no network request, writes nothing and returns no raw header or arbitrary URL/contact text.

Its result distinguishes missing, empty and present input; all recognized client candidates; generic automation declarations; browser and OS conflicts; reported versions; form preferences; and cautions for known frozen-version patterns. **`authentication` is always `not-performed`.** A recognized pattern does not prove a genuine browser, and a frozen-pattern match does not reveal the hidden OS.

The responsibility boundaries are deliberate. Lexing finds supported products and URI boundaries. Browser/platform policies interpret compatibility and conflicts. Client-name/role policy remains separate. Native request extraction, independent verification, storage and reporting are adapters and consumers of those facts. Adding an OS rule must not silently grant a bot name more authority.

The [local inspection command and extraction pack](https://github.com/gkoreli/blog/tree/main/packages/blog/tools/user-agent-check) let another developer use these distinctions without deploying our collector. Supply a UTF-8 JSON file containing `userAgent` and optional `mobileHint`, then run:

```sh
pnpm -C packages/blog exec node --import tsx tools/user-agent-check/inspect.mjs /absolute/path/to/input.json
```

The file reader has an explicit 262,144-byte limit and rejects unsupported fields, malformed encoding and non-regular files. It does not silently truncate a header, accept pasted native-bot flags as trusted evidence or echo a private parser exception. The package remains private TypeScript workspace source, not a published npm installation. Another operator’s adoption is still something to demonstrate.

## Check execution and storage, not only a cleaner label

The original repair had six controlled curl requests traced through the deployed collector and exact stored rows on November 6. They checked CUBOT, a contact URL, separate GPTBot/SemrushBot/node-fetch declarations and the full alias set. They were permanently owner-excluded. Browser-shaped curl inputs remained Browser signals, never human labels. [The dated acceptance](https://github.com/gkoreli/blog/blob/4aad5cd9a1cab8e3986af1a7ed8bf716fa73925f/packages/blog/drafts/research/analytics-retrospective/134-detection-production-acceptance.md) preserves those conditions.

For the current work, I compared **41 supplied cases** between Node and actual local workerd and stored/read each closed result through a fixture D1 table. Those comparisons include the complete-version controls added after inspecting our logs and the native header behavior behind the whitespace mistake. They test runtime and serialization agreement, without labelling real devices or exercising an independent vendor verifier.

Parser work itself also needs scrutiny. UAParser’s [historical ReDoS fix](https://github.com/faisalman/ua-parser-js/commit/a6140a17dd0300a35cfc9cff999545f267889411) removed an unsafe regex from a trimming function. A length limit did not help when expensive work occurred before that limit. I have not installed a vulnerable parser or claimed our implementation is vulnerable; the incident is a reason to inspect actual code paths and costs rather than trust a reassuring API name.

The check pack tests our explicit extraction contract. A broader boolean detector or first-match parser can intentionally have another policy. A disagreement is an investigation lead, not automatic proof that its maintainers are wrong.

## What the dashboard still cannot tell me

The blog’s original baseline had **2,810 of 3,960 included page requests without a recognized crawler, tool or service name**, across October 31 through a partial November 6 UTC. That roughly 71% was a name-catalogue gap, not an error rate or a count of people. Browser families and other evidence could still be recognizable. [The original scope is preserved](https://github.com/gkoreli/blog/blob/da3cf39eb578a34d9d523e6460fe6b6b5bb58003/packages/blog/drafts/research/analytics-retrospective/127-current-unidentified-and-unsigned-traffic.md).

I still have not measured how often the old phone-brand mistake occurred, how many other sites mislabel their traffic, or how much audience growth a parser change creates. Browser-wide defaults establish a large relevant population, not a broken-site percentage.

The improvement is that the library can now explain more of what it knows and where selection fails. Use the header as evidence for a specific claim, keep its source and interpretation version, and test what reaches storage and reports. When the evidence does not identify a browser, device, operator or purpose, let the answer remain unresolved.

---

## Sources and terms

The opening draws on two studies with different populations:

| Evidence | What it establishes | Source |
| --- | --- | --- |
| Nine-site crawler audit, September 22–October 5, 2026 | The reported 36 in 100 is a rounded, source-attributed result. Cloudflare analytics can be sampled. I have not independently reproduced the operator’s traffic measurements. | [Jordan Ellis’s audit and methods](https://brandmentions.link/server-log-vs-cloudflare/#what-we-measured) |
| User-Agent access study, June 2023 | Scripts accessed the property on 88.3% of 89,763 successfully visited homepages selected from Chrome’s popular-site data. It measures access to the string, not analytics errors. | [Senol and Acar, WPES 2023, §§3.6 and 5.1](https://www.esat.kuleuven.be/cosic/publications/article-3692.pdf) |

| Term | Meaning in this article | Source |
| --- | --- | --- |
| User-Agent | Client-supplied products/comments, including compatibility text | [RFC 9110 §10.1.5](https://www.rfc-editor.org/rfc/rfc9110.html#section-10.1.5), June 2022 |
| Reduced/frozen platform value | A compatibility value that need not identify the actual OS | [Chrome guidance](https://developer.chrome.com/docs/privacy-security/user-agent-client-hints), [Safari 26](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/) |
| Mobile hint | Reported preference, not physical-device authentication | [UA-CH §3.7](https://wicg.github.io/ua-client-hints/#sec-ch-ua-mobile) |
| Verified origin | Evidence obtained through a specific independent method and scope | [Google verification](https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests); our existing signature/network contracts |
| Assessment profile | The interpretation policy used for this supplied input | [Domain decision and source](https://github.com/gkoreli/blog/blob/main/docs/adr/0016.22-user-agent-claims-and-platform-ambiguity.md) |

The opening’s device and download examples are documented by [Microsoft](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/how-to-detect-win11), [WebKit](https://webkit.org/blog/9674/new-webkit-features-in-safari-13/) and [Chrome](https://developer.chrome.com/blog/desktop-mode). The sections above explain the browser versions and modes involved.

External documents and incidents were checked November 10, 2026. Historical reports retain their dates and remedies; browser defaults retain their version/mode scope. The twelve-family evidence map links the fuller research and acceptance records.
