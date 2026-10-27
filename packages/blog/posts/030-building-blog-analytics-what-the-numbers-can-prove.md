---
title: "Building Blog Analytics: What the Numbers Can Prove"
seoTitle: "Building Blog Analytics with Cloudflare Workers and D1"
alternativeHeadline: "What a misleading traffic spike taught me about page counts, bot identity, and the cost of trustworthy analytics"
date: "2026-10-25"
lastModified: "2026-10-27"
description: "Cloudflare Workers and D1 analytics lessons: investigate misleading traffic growth, separate signed crawlers from assistants, and preserve evidence behind the counts."
section: engineering
tags: [analytics, cloudflare-workers, d1, bots, observability]
series:
  id: "measurement-boundaries"
  title: "Measurement boundaries"
  order: 6
---

# Building Blog Analytics: What the Numbers Can Prove

My blog’s Browser traffic more than doubled between two complete weeks. Yet one unexplained referrer supplied more than half the later week’s events. The totals added up; the audience-growth story did not follow.

Understanding which articles help starts with three decisions:

- What event deserves to be counted?
- What does a bot’s identity actually establish?
- What evidence must survive when the interpretation changes?

## Count the event you can observe

The original dashboard displayed **97 AI Reads**. A browser script supplied its data. Crawlers skipping that script never entered the table. The label overstated its coverage.

I [moved collection to the HTTP response boundary](/first-party-analytics-for-a-personal-blog). The Worker serves the page, checks the response, and records an eligible delivery in D1. [Worker-first routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/) puts the collector in that path, including for clients that never run JavaScript.

The counter accepts successful, non-prefetch page GETs serving HTML or negotiated Markdown. APIs, feeds, redirects, errors and direct `.md` assets stay outside it. Persistence is best effort. Browser means the request matched our header and network rules. **An edge event records an eligible response; it cannot establish attention or understanding.**

A keyed hash groups requests by site, UTC date, IP and User-Agent. The table retains neither raw IPs nor User-Agent strings. Changed inputs can split one person’s activity; shared inputs can combine people. Daily client IDs are not unique readers.

## One referrer changed the growth story

The October 26 audit counted **[14,835 included events](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/10-full-interval-and-field-hardening.md)** from partial September 9 through partial October 26 UTC. A [whole-table census](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/31-retained-history-completeness-and-delta.md) found **32,272 stored observations**: 16,693 predate that window, including 2,564 legacy beacons.

Browser events rose from **306** in the complete UTC week beginning September 14 to **711** in the week beginning October 19. One unexplained referrer, R1, supplied **388** of the later week’s events. Setting that cohort aside gives **323 versus 306**, a 5.6% increase instead of a 2.32-fold count.

That is a sensitivity check. R1 remains included, and the subtraction does not produce a corrected human count. Its operator and authenticity are unresolved.

[Recent Cloudflare logs](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/15-native-input-recovery.md) recovered 381 R1 requests over October 24–25, with 29 User-Agent strings. Earlier rules called all Browser. [New-rule replay](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/19-explicit-classification-uncertainty.md) leaves 118 unresolved: their headers claim same-origin context while supplying an external referrer. This includes redirects and changes no stored history. Operator and population differences from D1 remain unknown. **More evidence can test a rule without authenticating its subject.**

## A signed crawler was being counted as an assistant

A verified signature replaced the client’s declared role with `signed-agent`, letting a signed SEO crawler enter the AI agents group.

Our catalogue also missed four documented names. [ExaSearchBot](https://crawler.exa.ai/) crawls for search; [ExaUser](https://crawler.exa.ai/exauser) retrieves pages requested by users or applications. [AhrefsBot and AhrefsSiteAudit](https://ahrefs.com/robot) declare crawling and auditing roles. Their signing evidence cannot substitute for those distinctions.

The repair recognizes all four names, preserves declared roles across verified signatures, and reports signing evidence separately. [A four-second production cohort](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/26-organic-exa-and-join-boundaries.md) contains two AI-search observations with verified Exa-origin evidence. Exact request joins and native-verifier agreement remain open.

**Identity, role and trigger answer different questions.** [HTTP Message Signatures](https://www.rfc-editor.org/rfc/rfc9421.html) verify selected components against a key. I [reverified 19 retained Exa records](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/18-webbotauth-verification.md) at recorded times using later-captured keys: every signature protected the host, none the User-Agent or article path. A mutation test confirmed those unsigned fields could change without invalidating the signature. Two records shared a provider ID; the sample does not establish 19 unique events. [Cloudflare labelled them search crawlers](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/25-native-category-and-entitlement.md); verification booleans were unavailable. [Receipts](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/28-receipt-export-fidelity.md) preserve unknowns explicitly after a retained export omitted nulls. The verifier rejects reviewed public demonstration keys; unsigned roles and human triggers remain unauthenticated. The census leaves **1,025 included records labelled Exa with unknown roles**.

## Preserve uncertainty in the data

Requests retain declarations and missing-network states; conflicts enter Unresolved. [R1 replay](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/22-client-form-and-calibration.md) yields **355 desktop defaults**: 181 non-mobile preferences and 174 requests without form markers. Neither authenticates desktop hardware. A hosting-list nonmatch likewise establishes no residential source.

D1 discarded User-Agent after classification, so that table alone cannot replay the Exa/Ahrefs gap. Provider logs retained some inputs; complete historical recovery remains unproven. [Plausible](https://plausible.io/data-policy) keeps parsed software facts; [the IETF](https://www.ietf.org/policies/web-analytics/) keeps raw visitor data for five days and aggregates for twelve months. I’ve prepared an expiring diagnostic store with bounded, filtered UA evidence; collection remains off while its privacy boundary is settled. Filtering cannot prove arbitrary text is free of personal information. Debugging evidence and long-term reports deserve different lifecycles.

Referrers needed the same discipline. Among 2,365 included internal-referrer events, **1,540 recorded `/` as their source**. That can mean the homepage, but it can also mean an origin-only URL whose path was omitted. [Referrer Policy](https://www.w3.org/TR/referrer-policy/) allows detail to be withheld. We had stored more certainty than the input supported.

New observations omit that ambiguous source path; history gets an explicit label. Genuine transitions are lost.

The [referrer-abuse policy](/filter-referrer-spam-without-deleting-analytics-history) versions public exclusions. Unapproved referrers and signing origins appear as Other; original evidence stays private.

A [native D1 fixture](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/29-unreported-classifications-and-denominators.md) exposed a gap: ten headline events but only five in the classification breakdown. Reports preserve unknowns and reject incomplete composition. The census found no missing kinds or reasons; **1,181 stored verification outcomes lacked proof detail**.

## Correct totals can still break production

One report repeated referral assessment across nine queries, consuming **182,388 D1 row reads**. The account later exhausted its allowance.

Sharing the selected population and assessment reduced the same report to **33,259 reads**, an **81.8% reduction**, with identical output. The [recovery measurements](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/d1-read-budget/02-recovery.md) preserve the comparison.

[D1 row reads](https://developers.cloudflare.com/d1/platform/pricing/#definitions) measure query work. A fast response and a correct total don’t tell you what serving that report costs. Acceptance includes local D1 and production-metered reads. Versioned reports are cached for at most an hour, with their original calculation time preserved.

## Test the stages, not counter agreement

For October 20–25 UTC, D1 recorded **694 Browser HTML events** versus Cloudflare’s **117 non-bot beacon loads** after stats/API exclusions. Sampling and path reconciliation remain incomplete. Neither is human ground truth. Agreement is not the goal; explaining what each instrument observes is.

I [reconciled 12 production controls](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/edge-vs-rum/09-trial-ledger-and-selective-evaluation.md): nine agent-operated browser visits and three curl requests, excluded from public totals. Each trial had one stored observation and separate stage counts:

- Three normal visits stored observations and delivered three beacons.
- Blocking the beacon preserved three observations. `sendBeacon()` returned true three times; the server received none. True means [queued](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon#return_value), not received.
- Blocking scripts still stored three observations. The curl controls stored as Other bot without executing JavaScript.

Nine automated visits matched Browser. **Browser shape and JavaScript do not authenticate humans.** [Agent-driven input](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/30-filter-pointer-targets-and-browser-trust.md) produced `isTrusted=true` events locally. Our first-party receiver proves arrival; Cloudflare’s receipt remains separate. Human false-positive rates remain unmeasured.

A separate [local failure experiment](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/edge-vs-rum/07-matched-classifier-calibration.md) lost three observations while pages and beacons succeeded. No database failure was injected into production.

These mechanisms do not explain the historical gap’s proportions. Real phones, human-operated browsers, actual JavaScript-off and Cloudflare beacon receipt remain to test. Count missing measurements, abstentions and wrong decisions separately.

---

## Glossary

| Term | Meaning and source |
|---|---|
| Page event | Edge response or legacy beacon; [method boundary](/first-party-analytics-for-a-personal-blog). |
| Declared role | A client’s stated function; [Exa’s two clients](https://crawler.exa.ai/) show why one service can have several. |
| Message signature | Verification of covered components against a key; [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html), February 2024. |
| D1 row reads | Database work, separate from audience size; [metering definitions](https://developers.cloudflare.com/d1/platform/pricing/#definitions). |

Sources checked October 25–27, 2026. The [research index](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/analytics-retrospective) retains methods, receipts, corrections and remaining work.
