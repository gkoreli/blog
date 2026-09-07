---
title: "How I Filter Referrer Spam Without Deleting Analytics History"
seoTitle: "Filter Referrer Spam Without Losing Analytics History"
alternativeHeadline: "Versioned Matomo rules, local exceptions, and saved reports keep referral filtering reversible."
date: "2026-09-06"
lastModified: "2026-09-06"
description: "A public dashboard ranked a suspicious referrer first. I added Matomo rules, local exceptions, and saved reports while retaining the observations."
section: engineering
tags: [analytics, http, cloudflare-workers, open-source]
series:
  id: "measurement-boundaries"
  title: "Measurement boundaries"
  order: 5
---

# How I Filter Referrer Spam Without Deleting Analytics History

My public analytics dashboard ranked a suspicious referrer first, with **35 views**. I wanted those requests excluded without destroying the evidence behind that decision. The deployed repair uses Matomo's referrer spam list, local exceptions, and a separate rule for which names can appear publicly. A capture command also preserves reports, because keeping database rows alone cannot tell me what yesterday's dashboard showed.

- Excluded observations remain stored, and every public metric applies the same policy.
- Unreviewed included hostnames become an unnamed aggregate instead of gaining public exposure.
- Archived rules explain a calculation; a saved response preserves what was actually reported.

## How a reported referrer became a public ranking

The ranking treated a hostname supplied by a client as something worth showing readers. In the [September 6 capture](https://github.com/gkoreli/blog/blob/fe9456e011e3e2dd7c0f691fe8ba8c247cd03a6d/packages/blog/drafts/research/readers-vs-bots/17-referral-abuse-defense-verification.md), that hostname was `uniuit.com`. Displaying the name gave it exposure regardless of whether anyone followed a real link from that site.

Referrer spam is an established form of abuse. Matomo's [May 2015 explanation](https://matomo.org/blog/2015/05/stopping-referrer-spam/) describes automated requests carrying fabricated referrers to get a site noticed in analytics. Our repeated homepage/article requests supported a local exclusion, but did not authenticate an operator or prove that motive. The [request investigation](/how-i-separate-readers-from-bots-without-javascript) preserves that distinction.

My requirement during the repair was:

> "we still need to save those data for historical provenance reasons right?"

The design had to preserve the evidence behind an exclusion, including evidence that could later overturn it.

## Separating observations from reporting decisions

The repair gives three concepts separate responsibilities in [my first-party analytics](/first-party-analytics-for-a-personal-blog):

| Concept | Responsibility |
|---|---|
| Observation | Retain the reported hostname and existing request fields. |
| Assessment | Apply a versioned include/exclude rule, with its source and reason. |
| Public display | Name reviewed hosts; group other included names as “Other reported referrers.” |

The public API enforces name suppression before sending data to the browser. Unknown names remain counted unless an exclusion rule matches. That avoids declaring an unfamiliar source abusive simply because I have not reviewed it.

Exclusions affect totals, charts, pages, devices, and referrer rankings, including the All selection. The report separately shows how many observations its policy excluded for the selected scope. Hiding a row while leaving those requests in the headline total would leave the measurement inconsistent. The [ADR](https://github.com/gkoreli/blog/blob/e1aa4a305ef934b1f089b24894321558db5f1603/docs/adr/0016.6-versioned-referral-policy-and-matomo-source.md) records these boundaries.

Display approval permits a name to appear. It does not authenticate a referral: a client can supply a familiar hostname too.

## Using Matomo rules with local exceptions

Matomo supplies maintained prior art, but its list could not decide this case for me. The [pinned source](https://github.com/matomo-org/referrer-spam-list/blob/e65db652cade6882aa9a76bbb65c9bb17e079f4b/spammers.txt) contained **2,348 hosts** and omitted the hostname under investigation. That required a reviewed local rule.

For someone implementing the filter, the matching boundary matters. After parsing and normalizing a hostname, a subtree rule has this meaning:

```typescript
host === ruleHost || host.endsWith(`.${ruleHost}`)
```

For `example.com`, that includes `sub.example.com` and excludes lookalikes such as `notexample.com` or `example.com.other.test`. This illustrates the boundary; the [production evaluator](https://github.com/gkoreli/blog/blob/fe9456e011e3e2dd7c0f691fe8ba8c247cd03a6d/packages/analytics/src/referral-policy.ts) enumerates suffixes and resolves rule precedence. Matomo's [inspected matcher](https://github.com/matomo-org/matomo/blob/79c953a035723b8a7ee80b87074daf82976e954e/core/Tracker/Visit/ReferrerSpamFilter.php#L28-L45) searches the whole referrer string. I adopted its list with narrower matching semantics.

Reviewed local rules override upstream entries; more specific local rules can refine broader ones. An explicit include can correct a false positive. Each change gets a new policy version, while the exact upstream bytes, their hash, and the evaluator identity remain archived. List membership is a reporting signal whose mistakes I must be able to correct.

## Preserving historical reports

Retained observations support recalculation. They do not automatically reconstruct an earlier dashboard: late writes, owner exclusions, and other classification changes can alter the result even under the same referral policy.

The [report-capture command](https://github.com/gkoreli/blog/blob/fe9456e011e3e2dd7c0f691fe8ba8c247cd03a6d/packages/analytics/policies/README.md) saves the exact received JSON and its hash, checks the advertised policy against the archive, and refuses to overwrite an earlier capture. Deployment records bind the policy to the released code. Captures are explicit, not automatic snapshots of every report.

This repair adds no visitor field and deletes no observation. The retained evidence is a bounded hostname and selected request fields; full original referrer headers were never stored. Keeping that evidence and saving report responses answers two different historical questions.

## Referrer filtering results and costs

The fixed August 8–September 6 UTC check produced **972 Browser observations before referral exclusions: 937 included plus 35 excluded**, all 35 through the local rule. These were separate read-only production queries, not a transactional snapshot. [Verification record](https://github.com/gkoreli/blog/blob/fe9456e011e3e2dd7c0f691fe8ba8c247cd03a6d/packages/blog/drafts/research/readers-vs-bots/18-matomo-referral-policy-verification.md). Subsequent [live verification](https://github.com/gkoreli/blog/blob/e1aa4a305ef934b1f089b24894321558db5f1603/packages/blog/drafts/research/readers-vs-bots/19-referral-policy-activation.md) confirmed the deployed policy, suppressed names, and scoped exclusion counts.

The public evidence records aggregates and hashes; private captures let me audit the original reads.

Filtering at query time costs database work. In that production sample, the totals query went from **7.77 to 14.95 milliseconds**, with rows read increasing from **8,423 to 19,826**. Those are database measurements, not page latency. The ADR records the larger benchmark and when to reconsider stored or materialized results.

**Update, September 7 UTC:** that cost assessment was incomplete. The full report used **182,388 rows read across nine statements**—about **3.65% of D1's free daily read allowance for one report**. The account subsequently exhausted the allowance. Its query profile was dominated by the repeated referral matcher, although the metrics do not identify who requested those reports. Short database execution time had concealed an unacceptable read budget. [Incident evidence](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/d1-read-budget/00-incident.md); [Cloudflare's scanned-row accounting](https://developers.cloudflare.com/d1/platform/pricing/).

The correction calculates the report from one shared assessment and caches public results for at most an hour, with their calculation time visible. Local D1 checks preserve the previous output across 148 cases. The daily cap blocked the production cost benchmark, so I cannot yet report a measured reduction in billed reads. Cache storage is local to a Cloudflare data center, which also prevents treating one cached result as a global quota guarantee. [Revised decision and verification limits](https://github.com/gkoreli/blog/blob/main/docs/adr/0016.7-budget-d1-reads-and-cache-public-reports.md).

The maintenance cost also remains: review new names, update the source, and reverse mistaken exclusions. Clients can change or omit the header; even a correctly implemented rule can hide legitimate visits. The reconciled counts verify policy application, without establishing how many requests came from people.

The repair gives me an accountable reporting decision: the observation remains available, the rule has a reason and version, and a saved report records what I published.

---

## Glossary

| Term | Meaning and source | Date |
|---|---|---|
| Referrer spam | Fabricated referral information intended to gain exposure through analytics. [Matomo explanation](https://matomo.org/blog/2015/05/stopping-referrer-spam/). | Published May 13, 2015; checked September 7, 2026 UTC |
| Matomo referrer spam list | Community-contributed hostname list; our release uses a fixed revision. [Source README](https://github.com/matomo-org/referrer-spam-list/blob/e65db652cade6882aa9a76bbb65c9bb17e079f4b/README.md). | Revision `e65db652`; checked September 7, 2026 UTC |
| Referral policy | Our versioned reporting rules, distinct from retained observations and public name approval. [Decision record](https://github.com/gkoreli/blog/blob/e1aa4a305ef934b1f089b24894321558db5f1603/docs/adr/0016.6-versioned-referral-policy-and-matomo-source.md). | Policy `2026-09-06.2`; activated September 7, 2026 UTC |
