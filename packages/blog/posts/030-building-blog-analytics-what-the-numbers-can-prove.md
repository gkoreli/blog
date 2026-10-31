---
title: "Building Blog Analytics: What the Numbers Can Prove"
seoTitle: "Building Blog Analytics with Cloudflare Workers and D1"
alternativeHeadline: "What a misleading traffic spike taught me about readership, signed crawlers, and measurement failures"
date: "2026-10-25"
lastModified: "2026-10-31"
description: "Cloudflare Workers and D1 analytics lessons: investigate misleading growth, inspect signed crawlers, and choose article experiments without mistaking requests for readers."
section: engineering
tags: [analytics, cloudflare-workers, d1, bots, observability]
series:
  id: "measurement-boundaries"
  title: "Measurement boundaries"
  order: 6
---

# Building Blog Analytics: What the Numbers Can Prove

My blog’s Browser count more than doubled in a week, but I still couldn’t answer useful questions: who reads these articles, are they finding them useful, and what should I write next? One unexplained referrer supplied most of the increase. The counter worked; the growth story needed scrutiny.

Building the analytics on Cloudflare Workers and D1 taught me three distinctions:

- A delivered page is evidence of a request, with readership still to establish.
- A crawler’s signature authenticates only the components it covers.
- Editorial decisions need source quality and evidence of usefulness alongside totals.

## Count the event you can observe

The dashboard displayed **97 AI Reads**, supplied by a browser script. Crawlers skipping that script never entered the table. The label overstated its coverage.

I [moved collection to the HTTP response boundary](/first-party-analytics-for-a-personal-blog). The Worker serves the page, checks the response, and records an eligible delivery in D1. [Worker-first routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/) puts the collector in that path, including for clients that never run JavaScript.

The counter accepts successful, non-prefetch page GETs serving HTML or negotiated Markdown. APIs, feeds, redirects, errors and direct `.md` assets stay outside it. Persistence is best effort. Browser means the request matched our header and network rules. **An edge event records an eligible response; it cannot establish attention or understanding.**

A keyed hash groups requests by site, UTC date, IP and User-Agent. The table retains neither raw IPs nor User-Agent strings. Changed inputs can split one person’s activity; shared inputs can combine people. Daily client IDs are not unique readers.

## Ask whether growth survives its largest source

The [October 30 report](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/110-weekly-history-production-acceptance.md) covers 1,477 included Browser signals across four complete UTC weeks, October 2–29:

| UTC dates | Browser signals | Outside unexplained source R1 | Missing method stamps |
|---|---:|---:|---:|
| October 2–8 | 217 | 217 | 217 |
| October 9–15 | 257 | 252 | 257 |
| October 16–22 | 312 | 308 | 312 |
| October 23–29 | 691 | 303 | 459 |

Setting R1 aside changes the last comparison from **312→691 to 308→303**. R1 remains included. This exposes source concentration; it supplies no corrected human count.

**Compare the measurement rules too.** Collection and classifier stamp columns were null for 1,245 events; all stamped events fell in the last week. I added [weekly measurement history](/stats/readership) to expose that gap. It cannot show requests older rules excluded or establish human growth.

Of those 1,477 events, 642 had no recorded referrer, 337 reported internal navigation and 498 reported external hosts. R1 supplied 397 external events. Missing referrers leave acquisition unknown: bookmarks, private sharing, stripped referrals and automation remain possible. [HTTP permits omission](https://www.rfc-editor.org/rfc/rfc9110.html#section-10.1.3). Internal navigation can generate more events after arrival.

The Other bucket groups hosts under our display policy. It is not an authenticity verdict. **We still don’t know R1’s operator or trigger.**

## A signed crawler was being counted as an assistant

A verified signature replaced the client’s declared role with `signed-agent`, letting a signed SEO crawler enter the AI agents group.

Our catalogue missed four documented names. [Exa documents two roles](https://crawler.exa.ai/): ExaSearchBot crawls for search; ExaUser fetches on request. [AhrefsBot and AhrefsSiteAudit](https://ahrefs.com/robot) declare crawling and auditing roles. Their signing evidence cannot substitute for those distinctions.

The repair separates declared roles from [signing evidence](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/33-reviewed-directory-publishers.md). I [traced three requests](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/49-current-verifier-vendor-evidence.md), two ExaSearchBot and one AhrefsBot, from retained headers through receipts to exact D1 rows. All replayed under their recorded verifier using later-captured publisher keys; an independent RFC 9421 implementation agrees. Native-verifier agreement remains unmeasured.

**Identity, role and trigger answer different questions.** All three signatures protected the host. User-Agent and article path were unsigned. Changing those unsigned fields left each signature valid. [HTTP Message Signatures](https://www.rfc-editor.org/rfc/rfc9421.html) authenticate covered components against a key; an unsigned role or human trigger needs separate evidence. Unique actions remain unproven.

The later [52-proof cohort](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/75-frozen-signed-cohort-and-export-boundaries.md) also left User-Agent and resource unsigned. Inspect each proof’s covered fields before deciding what it authenticates.

In [13 synthetic producer/Tail Worker controls](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/74-native-trace-redaction-and-covered-urls.md), 12 requests verified before tracing; seven verified from default redacted traces. Redaction explained five lost replays. **A failed log replay alone does not prove the original signature was invalid.**

## Preserve uncertainty in the data

Conflicting inputs enter Unresolved. Our [parser audit](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/90-fetch-metadata-parsing-and-evidence.md) caught a false Browser match: lowercasing NAVIGATE made an invalid value look valid. Four [excluded production controls](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/91-live-metadata-controls-and-redacted-correlation.md) also showed two curl requests with supplied browser headers matching Browser. The dashboard now says **Browser signals** and [distinguishes absent headers from unassessed history](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/92-public-parsing-states-and-browser-signals.md).

**Missing is not zero.** [Local tests](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/discovery-experiment-02/06-public-report-integrity.md) showed missing counts becoming zero and chart rows disappearing beside a nonzero headline. Reports now validate fields and reconcile totals; valid empty selections remain zero. A [synthetic record](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/discovery-experiment-02/10-retained-network-assignment-consistency.md) also paired a GPTBot declaration with a `google-common` check. The offline analyzer flags that contradiction using historical profiles. Neither test established corrupted production data.

D1 discarded User-Agent after classification; provider logs recovered some inputs, with complete historical recovery unproven. Expiring diagnostic collection remains off pending privacy decisions. Filtering arbitrary text cannot guarantee the absence of personal information.

## Correct totals can still break production

One report repeated referral assessment across nine queries, consuming **182,388 D1 row reads**. The account later exhausted its allowance. Sharing assessment reduced the same report to **33,259 reads**, with identical output in the [measured comparison](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/d1-read-budget/02-recovery.md).

[D1 row reads](https://developers.cloudflare.com/d1/platform/pricing/#definitions) measure query work, not audience size. Caching avoids recalculation on hits. Other database work and unmetered retries remain additional; missing cost metadata stays unknown.

## Test the stages, not counter agreement

For October 20–25 UTC, D1 recorded **694 Browser HTML events** versus Cloudflare’s **117 non-bot beacon loads** after stats/API exclusions. Sampling and path reconciliation remain incomplete. Neither is human ground truth. Agreement is not the goal; explaining what each instrument observes is.

I [reconciled 12 production controls](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/edge-vs-rum/09-trial-ledger-and-selective-evaluation.md), excluded from public totals. Three normal automated-browser visits stored observations and delivered beacons. Blocking beacons preserved three observations: sendBeacon returned true, but the receiver got none. True means [queued](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon#return_value). Blocking scripts still stored three observations. Three curl controls stored as Other bot.

All nine automated-browser visits matched Browser. JavaScript execution and browser headers do not authenticate humans. A [local failure experiment](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/edge-vs-rum/07-matched-classifier-calibration.md) lost three observations while pages and beacons succeeded; no database failure was injected into production.

These mechanisms do not explain the historical gap’s proportions. Human/device error rates and Cloudflare beacon receipt remain unmeasured.

## Check the funnel before judging interest

The subscriber aggregate showed one active subscription and zero active records created or last confirmed in October 1–28. Then we [found the rendered signup form missing its required public Turnstile key](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/98-subscription-funnel-and-reader-signals.md). Correct state counts could not establish a working conversion path or weak reader interest. Key delivery and handler initialization are repaired; complete challenge, email and activation acceptance remain separate.

Even error reporting overstated success. Our endpoint returned 204 before confirming storage. A [paired native experiment](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/newsletter-reliability/21-truthful-error-report-acknowledgments.md) had four old failure cases returning 204 without an inserted row; the repair had zero. These are fixture cases, not historical loss estimates. A write can also commit before its acknowledgment fails, so automatic retries could duplicate reports.

## Turn the evidence into an editorial bet

The article rankings change when inspected outside R1:

| Article | All events | Outside R1 |
|---|---:|---:|
| ChatGPT plugin apps | 134 | 43 |
| OSS Radar: toolchain | 116 | 13 |
| AI-fetcher headers | 67 | 63 |
| Bot detection without JavaScript | 52 | 36 |

Publication ages differ, and these remain deliveries. Still, the fetcher reference gives me a provisional topic worth developing without depending on the spike. I’ve [corrected its signature-coverage claims](/which-ai-fetchers-send-which-headers). A next experiment is one concrete native-app workflow article, showing operation, conflict, undo and saving.

Actual search questions remain unavailable until an authenticated [Search Console comparison](https://support.google.com/webmasters/answer/7576553) supplies query/page evidence. I won’t invent them from article titles.

For each editorial experiment, compare seven and 28 complete days, inspect source concentration and search discovery, and look for corrections or reports of use. Better bot detection helps interpret delivery. Understanding what readers need requires evidence beyond the request.

---

## Glossary

| Term | Meaning and source |
|---|---|
| Page event | Edge response or legacy beacon; [method boundary](/first-party-analytics-for-a-personal-blog). |
| Declared role | A client’s stated function; [Exa’s two clients](https://crawler.exa.ai/) show why one service can have several. |
| Message signature | Verification of covered components against a key; [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html), February 2024. |
| D1 row reads | Database work, separate from audience size; [metering definitions](https://developers.cloudflare.com/d1/platform/pricing/#definitions). |

Measurements retain their dated windows. Sources checked October 25–31, 2026 UTC. The [research index](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/analytics-retrospective) retains methods, receipts, corrections and remaining work.
