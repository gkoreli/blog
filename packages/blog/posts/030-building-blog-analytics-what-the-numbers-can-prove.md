---
title: "Building Blog Analytics: What the Numbers Can Prove"
seoTitle: "Building Blog Analytics with Cloudflare Workers and D1"
alternativeHeadline: "What a misleading traffic spike taught me about page counts, bot identity, and the cost of trustworthy analytics"
date: "2026-10-25"
lastModified: "2026-10-25"
description: "Cloudflare Workers and D1 analytics lessons: investigate misleading traffic growth, separate signed crawlers from assistants, and preserve evidence behind the counts."
section: engineering
tags: [analytics, cloudflare-workers, d1, bots, observability]
series:
  id: "measurement-boundaries"
  title: "Measurement boundaries"
  order: 6
---

# Building Blog Analytics: What the Numbers Can Prove

My blog’s Browser traffic more than doubled between two complete weeks. The totals added up. Yet one unexplained referrer supplied more than half the later week’s events. A dashboard could turn that into a story about audience growth without establishing that more people were reading.

That matters when I’m trying to understand which articles are useful and where to spend my writing time. Building analytics with Cloudflare Workers and D1 has meant revisiting three decisions:

- What event deserves to be counted?
- What does a bot’s identity actually establish?
- What evidence must survive when the interpretation changes?

## Count the event you can observe

The original dashboard displayed **97 AI Reads**. Its data came from a browser script. A crawler could fetch an article without executing that script and never enter the table. The label promised visibility the collector didn’t have.

I [moved collection to the HTTP response boundary](/first-party-analytics-for-a-personal-blog). The Worker serves the page, checks the response, and records an eligible delivery in D1. [Worker-first routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/) puts the collector in that path, including for clients that never run JavaScript.

The counter now accepts successful, non-prefetch page GETs serving HTML or negotiated Markdown. APIs, feeds, redirects, errors and direct `.md` assets stay outside it. Persistence is best effort. Browser means the request matched our header and network rules. **A stored event establishes a recorded delivery; it cannot establish attention or understanding.**

Daily client IDs have a similar boundary. A keyed hash groups requests by site, UTC date, IP address and User-Agent. The main observation table retains neither raw IPs nor raw User-Agent strings. Changed inputs can split one person’s activity; shared inputs can combine people. Calling those IDs unique readers would introduce another unsupported claim.

## One referrer changed the growth story

The October audit now covers the retained data from September 9 through partial October 26, 2026 UTC: **14,835 included events** after owner and referral-policy exclusions. The [complete-period evidence](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/10-full-interval-and-field-hardening.md) preserves the queries, boundaries and partial-day limits.

Browser events rose from **306** in the complete UTC week beginning September 14 to **711** in the week beginning October 19. One unexplained referrer, R1, supplied **388** of the later week’s events. Setting that cohort aside gives **323 versus 306**, a 5.6% increase instead of a 2.32-fold count.

That is a sensitivity check. R1 remains included, and the subtraction does not produce a corrected human count. Its operator and authenticity are unresolved.

The request evidence complicates attribution: 124 of R1’s events declared `same-origin` (from this site) while supplying an external referrer. I can count that combination exactly. I cannot identify its operator from it. **Investigating what dominates a metric comes before explaining what the metric means.** Otherwise, an unexplained cohort can drive article rankings and publishing decisions.

## A signed crawler was being counted as an assistant

The classifier had a quieter error. A verified signature replaced the client’s declared role with `signed-agent`. That let a signed SEO crawler enter the AI agents group.

Our catalogue also missed four documented names. [ExaSearchBot](https://crawler.exa.ai/) crawls for search; [ExaUser](https://crawler.exa.ai/exauser) retrieves pages requested by users or applications. [AhrefsBot and AhrefsSiteAudit](https://ahrefs.com/robot) declare crawling and auditing roles. Their signing evidence cannot substitute for those distinctions.

The repair recognizes all four names, preserves the declared role when a signature verifies, and reports signing evidence separately. A request can belong to a crawler group and a signer breakdown without being counted twice in the total. Local signed fixtures and excluded live User-Agent controls passed; organic vendor-signed acceptance remains open. The [repair evidence](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/08-classification-repair.md) records that boundary.

**Identity, role and trigger answer different questions.** [HTTP Message Signatures](https://www.rfc-editor.org/rfc/rfc9421.html) verify covered message components against a key. A User-Agent declares a role and can be copied; it may not be covered by the signature. Neither establishes that a person asked to read this article. Exa’s clients share a signing directory, so the 1,003 historical Exa signer outcomes cannot recover the roles we failed to retain.

## Preserve uncertainty in the data

I kept the old beacon archive and marked its copied rows by source. New observations now carry collection and classifier versions. That lets a later report distinguish a measurement change from a traffic change without inventing missing historical evidence.

We also discarded the User-Agent after classification, leaving us unable to replay the Exa/Ahrefs gap against its original inputs. Established systems make different choices: [Plausible](https://plausible.io/data-policy) retains parsed software facts and discards raw UA; [the IETF](https://www.ietf.org/policies/web-analytics/) keeps raw visitor data for five days and aggregates for twelve months. I’ve prepared a separate, expiring diagnostic store with bounded, filtered UA evidence; collection remains off while its privacy boundary is settled. Filtering cannot prove arbitrary text contains no personal information. Evidence needed to fix a rule and facts needed for long-term reporting deserve different lifecycles.

Referrers needed the same discipline. Among 2,365 included internal-referrer events, **1,540 recorded `/` as their source**. That can mean the homepage, but it can also mean an origin-only URL whose path was omitted. [Referrer Policy](https://www.w3.org/TR/referrer-policy/) allows detail to be withheld. We had stored more certainty than the input supported.

New observations retain the internal category but omit that ambiguous root source path. Historical rows remain intact and get an explicit label. The tradeoff loses some genuine homepage transitions while avoiding false precision.

The [referrer-abuse policy](/filter-referrer-spam-without-deleting-analytics-history) also separates retained observations from public reporting. Exclusions are versioned and disclosed; unapproved names appear as Other. This prevents automatic promotion of untrusted destinations while preserving evidence for review. It does not authenticate every referral or resolve R1.

## Correct totals can still break production

The first referral assessment repeated work across nine report queries. One historical report consumed **182,388 D1 row reads**. The account later exhausted its allowance.

Sharing the selected population and assessment reduced the same report to **33,259 reads**, an **81.8% reduction**, with identical output. The [recovery measurements](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/d1-read-budget/02-recovery.md) preserve the comparison.

[D1 row reads](https://developers.cloudflare.com/d1/platform/pricing/#definitions) measure query work. A fast response and a correct total don’t tell you what serving that report costs. Acceptance now includes Cloudflare’s local D1 runtime and production-metered reads. Versioned reports are cached for at most an hour, with their original calculation time preserved.

## Next, explain where the measurements diverge

For October 20–25 UTC, D1 recorded **694 Browser HTML events** while Cloudflare’s dashboard showed **117 non-bot beacon loads** after stats/API exclusions. Sampling and path reconciliation were incomplete. Neither number is a human ground truth, and their difference cannot be assigned wholesale to bots. [Beacon blocking, loss and sampling](https://developers.cloudflare.com/web-analytics/faq/) give us mechanisms to test.

The next experiment will follow labelled visits through page delivery, script execution, beacon attempt and receipt, including JavaScript-off and blocked-beacon cases. Owner exclusion has passed an agent-operated browser check; my normal browser profile still needs verification before those trials.

That is the next useful improvement: explain which collection stage accounts for a discrepancy. The system already makes its events, classifications, exclusions and costs more inspectable. A stronger readership claim will need evidence beyond a request reaching the server.

---

## Glossary

| Term | Meaning and source |
|---|---|
| Page event | An eligible recorded delivery; [collection boundary](/first-party-analytics-for-a-personal-blog). |
| Declared role | A client’s stated function; [Exa’s two clients](https://crawler.exa.ai/) show why one service can have several. |
| Message signature | Verification of covered components against a key; [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html), February 2024. |
| D1 row reads | Database work, separate from audience size; [metering definitions](https://developers.cloudflare.com/d1/platform/pricing/#definitions). |

Sources checked October 25, 2026 Pacific. The [research index](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/analytics-retrospective) retains the detailed methods, release receipts, verification corrections and remaining work.
