---
title: "Building Blog Analytics: What the Numbers Can Prove"
seoTitle: "Building Blog Analytics with Cloudflare Workers and D1"
alternativeHeadline: "What a misleading traffic spike taught me about page counts, bot identity, and the cost of trustworthy analytics"
date: "2026-10-25"
lastModified: "2026-10-29"
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

Readership analytics starts with three decisions:

- What event deserves to be counted?
- What does a bot’s identity actually establish?
- What evidence must survive when the interpretation changes?

## Count the event you can observe

The dashboard displayed **97 AI Reads**, supplied by a browser script. Crawlers skipping that script never entered the table. The label overstated its coverage.

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

The repair separates declared roles from [signing evidence](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/33-reviewed-directory-publishers.md). I [traced three requests](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/49-current-verifier-vendor-evidence.md), two ExaSearchBot and one AhrefsBot, from retained headers through receipts to exact D1 rows. All replayed under their recorded verifier using later-captured publisher keys; an independent RFC 9421 implementation agrees. Native-verifier agreement remains unmeasured.

**Identity, role and trigger answer different questions.** All three signatures protected the host. User-Agent and article path were unsigned. Changing those unsigned fields left each signature valid. [HTTP Message Signatures](https://www.rfc-editor.org/rfc/rfc9421.html) authenticate covered components against a key; an unsigned role or human trigger needs separate evidence. Unique actions remain unproven.

[The historical census](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/31-retained-history-completeness-and-delta.md) leaves **1,025 included records labelled Exa with unknown roles**. In the [712-record delta](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/65-client-methods-and-directory-failures.md), 51 included requests declare ExaSearchBot; none declares ExaUser. All **52 stored verified outcomes leave User-Agent and resource unsigned**, without fresh cryptographic replay.

One Meta-WebIndexer claim failed during key discovery. [Local controls](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/65-client-methods-and-directory-failures.md#directory-failures-were-collapsed) showed that several directory failures shared one reason; a synchronous fetch error could also leave a failed lookup cached. We now preserve distinct causes and clear completed lookups. The historical cause remains unknown.

Documented lists now cover Applebot, Bingbot and three Amazon clients. [Source-specific parsing](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/66-documented-feed-adapters-and-meta-ads.md) rejects ambiguous markup. [Versioned receipts](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/67-published-address-receipts.md) preserve each address assessment, failure reason and feed snapshot after an acknowledged write. Membership cannot establish a human trigger.

## Preserve uncertainty in the data

Conflicts enter Unresolved. [R1 replay](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/22-client-form-and-calibration.md) yields **355 desktop defaults**: 181 non-mobile preferences and 174 requests without form markers. Neither authenticates desktop hardware. A hosting-list nonmatch likewise establishes no residential source.

D1 discarded User-Agent after classification, so that table alone cannot replay the Exa/Ahrefs gap. Provider logs retained some inputs; complete historical recovery remains unproven. [Plausible](https://plausible.io/data-policy) keeps parsed software facts; [the IETF](https://www.ietf.org/policies/web-analytics/) keeps raw visitor data for five days and aggregates for twelve months. I’ve prepared an expiring diagnostic store; collection remains off pending privacy decisions. Filtering arbitrary text cannot guarantee the absence of personal information.

Among 2,365 included internal-referrer events, **1,540 recorded `/` as their source**. That can mean the homepage, but it can also mean an origin-only URL whose path was omitted. [Referrer Policy](https://www.w3.org/TR/referrer-policy/) allows detail to be withheld. We had stored more certainty than the input supported.

New observations omit that ambiguous source path; history gets an explicit label. Genuine transitions are lost.

The [referrer-abuse policy](/filter-referrer-spam-without-deleting-analytics-history) versions public exclusions. Unapproved referrers and signing origins appear as Other; evidence stays private.

A [native D1 fixture](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/29-unreported-classifications-and-denominators.md) reported ten events but classified five. [Network summaries](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/56-vendor-network-summary-consistency.md) now separate unsupported “listed” flags; [feed revalidation](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/57-vendor-ip-revalidation.md) rejects mismatched validators. These fixtures establish no production inflation. **[1,181 historical verification outcomes lack proof detail](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/31-retained-history-completeness-and-delta.md)**.

## Correct totals can still break production

One report repeated referral assessment across nine queries, consuming **182,388 D1 row reads**. The account later exhausted its allowance.

Sharing the selected population and assessment reduced the same report to **33,259 reads**, an **81.8% reduction**, with identical output. The [recovery measurements](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/d1-read-budget/02-recovery.md) preserve the comparison.

[D1 row reads](https://developers.cloudflare.com/d1/platform/pricing/#definitions) measure query work. [Report telemetry](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/55-report-calculation-cost.md) separates counters from cache reuse. Last-attempt counters leave earlier retries unmeasured. Missing metadata stays unknown. Caching preserves calculation time for up to an hour. Hits avoid calculation; other database work remains additional.

## Test the stages, not counter agreement

For October 20–25 UTC, D1 recorded **694 Browser HTML events** versus Cloudflare’s **117 non-bot beacon loads** after stats/API exclusions. Sampling and path reconciliation remain incomplete. Neither is human ground truth. Agreement is not the goal; explaining what each instrument observes is.

I [reconciled 12 production controls](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/edge-vs-rum/09-trial-ledger-and-selective-evaluation.md): nine agent-operated browser visits and three curl requests, excluded from public totals. Each trial had one stored observation and separate stage counts:

- Three normal visits stored observations and delivered three beacons.
- Blocking the beacon preserved three observations. `sendBeacon()` returned true three times; the server received none. True means [queued](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon#return_value), not received.
- Blocking scripts still stored three observations. The curl controls stored as Other bot without executing JavaScript.

Nine automated visits matched Browser. **Browser shape and JavaScript do not authenticate humans.** [Agent-driven input](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/30-filter-pointer-targets-and-browser-trust.md) produced `isTrusted=true` events locally. Our receiver proves arrival; Cloudflare’s receipt remains separate. Human false-positive rates remain unmeasured.

A [local failure experiment](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/edge-vs-rum/07-matched-classifier-calibration.md) lost three observations while pages and beacons succeeded. No database failure was injected into production.

Local provider metadata needs scrutiny too. [Miniflare's fallback](https://github.com/cloudflare/workers-sdk/blob/ea57dfd56f2e82079927ce0b6fe690713e794a78/packages/miniflare/src/cf.ts) includes `verifiedBot: false`; `cf: false` selects it. Our [capture harness](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/60-guarded-native-capture-and-fixture-provenance.md) supplies `cf: {}` explicitly. **Executing our code in the native runtime does not reproduce the provider's detection service.**

In [seven live controls](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/61-live-native-header-boundaries.md), a transform delivered Cloudflare's known-bot result as `false` while Worker-native bot booleans stayed unavailable. It replaced single and duplicate caller headers. [Disabling the rule before expiry](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/63-disabled-before-expiry.md) let a caller's `true` survive. **A forwarded flag needs trusted provenance before it can support a verified-bot count.**

These mechanisms do not explain the historical gap’s proportions. Real phones, human-operated browsers, actual JavaScript-off and Cloudflare beacon receipt remain to test. Count missing measurements, abstentions and wrong decisions separately.

---

## Glossary

| Term | Meaning and source |
|---|---|
| Page event | Edge response or legacy beacon; [method boundary](/first-party-analytics-for-a-personal-blog). |
| Declared role | A client’s stated function; [Exa’s two clients](https://crawler.exa.ai/) show why one service can have several. |
| Message signature | Verification of covered components against a key; [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html), February 2024. |
| D1 row reads | Database work, separate from audience size; [metering definitions](https://developers.cloudflare.com/d1/platform/pricing/#definitions). |

Sources checked October 25–29, 2026 UTC. The [research index](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/analytics-retrospective) retains methods, receipts, corrections and remaining work.
