---
title: "How I Defend My Analytics Against Referrer Spam"
seoTitle: "Referrer Spam Defense for Public Analytics"
alternativeHeadline: "Public analytics need reviewed referrer names, consistent spam exclusions, and honest limits on what requests prove."
date: "2026-09-06"
lastModified: "2026-09-08"
description: "Suspected referrer spam gave an untrusted site exposure in my public analytics. Matomo rules and reviewed names now limit that abuse."
section: engineering
tags: [analytics, http, cloudflare-workers, open-source]
series:
  id: "measurement-boundaries"
  title: "Measurement boundaries"
  order: 5
researchFootprint:
  sessions: 4
  artifacts: 6
  totalTokens: 71572616
  inputTokens: 71151738
  cachedInputTokens: 68468352
  outputTokens: 420878
  reasoningOutputTokens: 153251
  wallClockMinutes: 4338
  startedAt: "2026-09-06T01:17:48.075Z"
  measuredAt: "2026-09-09T01:35:07.268Z"
  provenanceUrl: "https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/referrer-spam/10-research-footprint.md"
  scope: "Frozen on September 9 at 01:35 UTC from the full analytics investigation and three linked review sessions, including referral-policy engineering, the D1 repair, publication, editorial revision, and bookkeeping. It covers the first 18 prompts; later prompts and article edits are outside this measurement. Three earlier session prefixes (22,698,893 tokens) also appear in article 024's frozen footprint. These totals overlap and must not be added together; this is not an exclusive writing cost."
---

# How I Defend My Analytics Against Referrer Spam

My public analytics had put an untrusted website first in the referrer rankings, at **35 views**. Publishing that result gave the site exposure and risked presenting suspected spam as readership. I now filter suspected referrer spam and publish only reviewed referrer names, while disclosing exclusions and retaining the observations needed to challenge them.

- **Limit public exposure.** Unreviewed included hostnames appear under “Other reported referrers.”
- **Apply exclusions consistently.** Matching rules affect totals, charts, and rankings, with excluded observations counted separately.
- **Interpret referrers in context.** Referrers help identify where traffic comes from, but forged or missing values can distort that picture.
- **Verify the defense.** Test rotating names, matching edge cases, and totals that reconcile across reports.
- **Keep decisions correctable.** Stored observations, versioned rules, and saved reports preserve the evidence behind an exclusion.

## How a reported referrer became a public ranking

The ranking gave `uniuit.com`, a site I regarded as malicious, first place with 35 reported views in the [September 6 capture](https://github.com/gkoreli/blog/blob/fe9456e011e3e2dd7c0f691fe8ba8c247cd03a6d/packages/blog/drafts/research/readers-vs-bots/17-referral-abuse-defense-verification.md). I publish [analytics](/stats) as part of this blog's transparency model. Anyone opening that report could see the name at the top. I had given an untrusted destination exposure through my own publication.

In ordinary browsing, the [referrer header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referer) helps identify the page or site a visitor came from. That makes it useful for understanding how people discover the blog.

Referrer spam fabricates the claim that traffic came from a website. An automated client can send that website's name in a request without visiting it or following a link. Matomo's [May 2015 explanation](https://matomo.org/blog/2015/05/stopping-referrer-spam/) describes this mechanism and its incentive: getting the advertised site noticed in analytics. Such requests can inflate apparent readership and referral success without bringing an audience.

My assessment of the destination is separate from what the logs prove. The [repeated homepage/article requests](/how-i-separate-readers-from-bots-without-javascript) supported treating this cluster as suspected referrer spam. They did not independently establish malware or phishing, identify an operator, or prove that zero legitimate clicks occurred. The repeated requests made this cluster unreliable evidence of genuine readership from that site.

I did not need to prove every request's origin before withholding a public ranking. The defense needed two decisions: which observations to exclude from the metrics, and which referrer names to publish.

## Why fake referrers undermine public analytics

Public analytics give referral abuse an audience beyond the site owner. A high position can make an untrusted destination look like an established source of readers. My dashboard displayed hostnames as plain text, without outbound links, but the names were still visible and easy to look up.

- **Readers can be directed toward harm.** If someone visits an unsafe site because they found it at the top of my analytics, my blog helped them find it. That risks their safety and my credibility.
- **I can mistake activity for readership.** Counting suspected spam as evidence of an audience would let me tell myself the blog is growing without establishing that people are reading it.
- **Referral rankings can reward fabrication.** An automated client can repeat a hostname until it competes with actual sources of discovery. Publishing that claim gives the abuse the exposure the spammer seeks.

Authentic transparency requires explaining what was observed, what was excluded, and what remains unknown. Publishing untrusted referral claims without those distinctions would make my account of the blog less truthful.

## Separating observations from reporting decisions

The useful pattern in the prior art is an explicit filtering decision. Matomo's [tracker excludes matching visits](https://github.com/matomo-org/matomo/blob/cd1266ab025390e83cee7ca0ef98940028a113d5/core/Tracker/VisitExcluded.php#L136); Plausible's [ingestion pipeline drops spam-referrer events](https://github.com/plausible/analytics/blob/e74d6fb214b76664442d6a6bb8d96e74807ccfbf/lib/plausible/ingestion/event.ex#L64) before normal processing. For my public dashboard, I also needed control over which included names receive exposure. My retention requirement placed the exclusion in reporting, so a mistaken rule could be reversed over existing observations.

The repair gives three concepts separate responsibilities in [my first-party analytics](/first-party-analytics-for-a-personal-blog):

| Concept | Responsibility |
|---|---|
| Observation | Retain the reported hostname and existing request fields. |
| Assessment | Apply a versioned include/exclude rule, with its source and reason. |
| Public display | Name reviewed hosts; group other included names as “Other reported referrers.” |

The public API enforces name suppression before sending data to the browser. Unknown names remain counted unless an exclusion rule matches. That avoids declaring an unfamiliar source abusive simply because I have not reviewed it.

Exclusions affect totals, charts, pages, devices, and referrer rankings, including the All selection. The report separately shows how many observations its policy excluded for the selected scope. Hiding a row while leaving those requests in the headline total would leave the measurement inconsistent. The [ADR](https://github.com/gkoreli/blog/blob/e1aa4a305ef934b1f089b24894321558db5f1603/docs/adr/0016.6-versioned-referral-policy-and-matomo-source.md) records these boundaries.

Display approval permits a name to appear. It does not authenticate a referral: a client can supply a familiar hostname too.

The reporting outcomes are distinct:

| Referral assessment | Public metrics | Public referrer display |
|---|---|---|
| Excluded by a rule | Removed from included totals; disclosed in the exclusion count | No hostname |
| Included, name unreviewed | Counted | “Other reported referrers” |
| Included, name approved | Counted | Reviewed display name |
| No reported hostname | Counted | No referrer ranking entry |

An unfamiliar name alone is enough to withhold public exposure. Excluding its observations requires a matching reporting rule.

## Using Matomo rules with local exceptions

Matomo supplies maintained prior art, but its list could not decide this case for me. The [pinned source](https://github.com/matomo-org/referrer-spam-list/blob/e65db652cade6882aa9a76bbb65c9bb17e079f4b/spammers.txt) contained **2,348 hosts** and omitted the hostname under investigation. That required a reviewed local rule.

The [private review covered 23 distinct retained hostnames](https://github.com/gkoreli/blog/blob/fe9456e011e3e2dd7c0f691fe8ba8c247cd03a6d/packages/blog/drafts/research/readers-vs-bots/18-matomo-referral-policy-verification.md). None matched the upstream list. All 35 exclusions in the fixed-window check came from our local rule. This exposed a testing gap: a lower production count could demonstrate the local rule working while telling us nothing about whether we had integrated Matomo correctly. We tested every imported hostname separately.

For someone implementing the filter, the matching boundary matters. After parsing and normalizing a hostname, a subtree rule has this meaning:

```typescript
host === ruleHost || host.endsWith(`.${ruleHost}`)
```

For `example.com`, that includes `sub.example.com` and excludes lookalikes such as `notexample.com` or `example.com.other.test`. This illustrates the boundary; the [production evaluator](https://github.com/gkoreli/blog/blob/fe9456e011e3e2dd7c0f691fe8ba8c247cd03a6d/packages/analytics/src/referral-policy.ts) enumerates suffixes and resolves rule precedence. Matomo's [inspected matcher](https://github.com/matomo-org/matomo/blob/79c953a035723b8a7ee80b87074daf82976e954e/core/Tracker/Visit/ReferrerSpamFilter.php#L28-L45) searches the whole referrer string. I adopted its list with narrower matching semantics.

Reviewed local rules override upstream entries; more specific local rules can refine broader ones. An explicit include can correct a false positive. Each change gets a new policy version, while the exact upstream bytes, their hash, and the evaluator identity remain archived. List membership is a reporting signal whose mistakes I must be able to correct.

## Tests that made the referrer policy safer to change

A filter needs tests for the observations it keeps as well as those it removes. For implementers, these were the most useful checks: they exercise the public response and the database queries, beyond the hostname-matching function.

| Test | Saved result | What it establishes |
|---|---|---|
| Rotate unreviewed names | A fixture with **1,000 rotating hostnames**, plus nine ordinary and edge cases, kept **1,009 observations**: 1,005 Other, 3 under approved names, and 1 without a referrer. The attacking labels did not appear in serialized public JSON. | Name rotation cannot obtain automatic public exposure through this projection. Unfamiliar traffic remains counted unless separately excluded. |
| Compare both evaluators | TypeScript and SQLite agreed across **9,409 retained-host fixtures**, covering the upstream list, local overrides, lookalikes, and malformed historical input. Retained rows remained unchanged. | The policy used for review and the policy used for reports agree on the tested cases. |
| Exclude the entire selection | A historical fixture returned **0 included, 1 excluded**, while preserving the original reporting start date. | An empty chart still explains that filtering occurred; the exclusion remains inside the displayed period. |
| Alter a policy or capture | Tests rejected changed source bytes, conflicting rules, and a report capture carrying the wrong policy hash. | The review and capture tools check that policy labels correspond to the archived rules and received report. |

These are local test results from the [release verification](https://github.com/gkoreli/blog/blob/fe9456e011e3e2dd7c0f691fe8ba8c247cd03a6d/packages/blog/drafts/research/readers-vs-bots/18-matomo-referral-policy-verification.md), with inspectable [public-response fixtures](https://github.com/gkoreli/blog/blob/fe9456e011e3e2dd7c0f691fe8ba8c247cd03a6d/packages/analytics/test/contracts.test.mjs), [evaluator fixtures](https://github.com/gkoreli/blog/blob/fe9456e011e3e2dd7c0f691fe8ba8c247cd03a6d/packages/analytics/test/referral-policy.test.mjs), and [integrity checks](https://github.com/gkoreli/blog/blob/fe9456e011e3e2dd7c0f691fe8ba8c247cd03a6d/packages/blog/test/referral-policy.test.ts). They test implementation behavior, not the percentage of real-world spam detected.

The cross-language review exposed a concrete trap: JavaScript and SQLite do not case-fold every Unicode character identically. We used ASCII-only normalization for malformed retained hostname strings and added Kelvin-sign fixtures to check agreement; newly received HTTP(S) hosts already pass through URL/IDNA parsing. Testing only the TypeScript function would not check agreement with the SQL deciding the published counts.

The reusable practice is to test the whole decision path: normalization, rule precedence, database selection, and public serialization. A correct match function alone does not establish that an excluded observation has disappeared from every panel or that a hidden name cannot leak through the API.

## Preserving historical reports

An exclusion can be mistaken, so the design keeps the evidence needed to reconsider it. My requirement during the repair was:

> "we still need to save those data for historical provenance reasons right?"

Retained observations support recalculation. They do not automatically reconstruct an earlier dashboard: late writes, owner exclusions, and other classification changes can alter the result even under the same referral policy.

We encountered that immediately: the [first live capture and following candidate calculation](https://github.com/gkoreli/blog/blob/fe9456e011e3e2dd7c0f691fe8ba8c247cd03a6d/packages/blog/drafts/research/readers-vs-bots/17-referral-abuse-defense-verification.md) differed by two newly arrived unattributed observations, even before exclusions. Subsequent comparisons fixed the report clock and calendar window. That made the comparison clearer, while still leaving separate queries short of a transactional snapshot.

The [report-capture command](https://github.com/gkoreli/blog/blob/fe9456e011e3e2dd7c0f691fe8ba8c247cd03a6d/packages/analytics/policies/README.md) saves the exact received JSON and its hash, checks the advertised policy against the archive, and refuses to overwrite an earlier capture. Deployment records bind the policy to the released code. Captures are explicit, not automatic snapshots of every report.

The September 6 defense added no visitor field and deleted no observation. Its retained evidence was a bounded hostname and selected request fields; full original referrer headers had not been stored. Keeping that evidence and saving report responses answers two different historical questions.

## What the referrer filter changed

The fixed August 8–September 6 UTC check produced **972 Browser observations before referral exclusions: 937 included plus 35 excluded**, all 35 through the local rule. These were separate read-only production queries, not a transactional snapshot. [Verification record](https://github.com/gkoreli/blog/blob/fe9456e011e3e2dd7c0f691fe8ba8c247cd03a6d/packages/blog/drafts/research/readers-vs-bots/18-matomo-referral-policy-verification.md). Subsequent [live verification](https://github.com/gkoreli/blog/blob/e1aa4a305ef934b1f089b24894321558db5f1603/packages/blog/drafts/research/readers-vs-bots/19-referral-policy-activation.md) confirmed the deployed policy, suppressed names, and scoped exclusion counts.

The included referrer buckets also reconciled: **60 named + 7 Other + 870 without a referrer = 937**. The seven unreviewed referrals and the observations without a referrer stayed included. The defense preserved useful discovery data while applying a specific exclusion.

After deployment, I checked the selected report scopes separately. The live 30-day window had advanced to **August 9–September 7 UTC**, so these are activation checks rather than another before/after comparison:

| Live selection | Included observations | Excluded observations |
|---|---:|---:|
| Browsers | 936 | 35 |
| All traffic groups | 4,178 | 35 |
| Browsers on the homepage | 321 | 17 |

In each saved response, paths, time series, devices, and reader kinds summed to included views; referrer buckets reconciled too. No unapproved name appeared in the public report. This [live acceptance](https://github.com/gkoreli/blog/blob/e1aa4a305ef934b1f089b24894321558db5f1603/packages/blog/drafts/research/readers-vs-bots/19-referral-policy-activation.md) checked that changing a filter did not restore the excluded observations or produce contradictory panels. The public evidence records aggregates and hashes; private captures let me audit the original reads.

This has not eliminated all referrer spam. It closes automatic public promotion for unreviewed hostnames and removes rule-matched observations from the reports. A client can still impersonate an approved referrer, omit the header, or rotate names that remain included under the generic label. Excluding 35 observations verifies the policy's effect in that window; it does not prove that every remaining observation is genuine.

The implementation also had an operating cost. Repeating the referral assessment across panels made one report incur **182,388 D1 row reads**. A shared assessment reduced that to **33,259**, or **81.8% fewer reads**, for the identical historical report. Caching reduces repeated calculation but can leave reports up to an hour old. The [D1 incident](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/d1-read-budget/00-incident.md) and [repair verification](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/d1-read-budget/02-recovery.md) preserve the query details, read accounting, and limits of that result.

## Public analytics need evidence

I want to know whether people are reading the blog and which sources bring them here. Referrers help me identify those sources; filtering suspected spam makes that evidence more useful. The dashboard now controls name exposure and applies abuse exclusions consistently, while showing that filtering occurred. These reporting rules do not block the originating requests or prove that the remaining traffic is human.

The rules can still be wrong: clients can change headers, and a legitimate visit from an excluded domain will also be omitted. Reviewing evidence and reversing mistaken decisions remains part of the work. Keeping that correction path is how I can report suspected abuse honestly without promoting it or counting it as proof of an audience.

For a new suspicious source, the [maintenance workflow](https://github.com/gkoreli/blog/blob/fe9456e011e3e2dd7c0f691fe8ba8c247cd03a6d/packages/analytics/policies/README.md) is to inspect private aggregates, record the evidence for a rule, rerun the boundary and reconciliation checks, version the policy, and capture the deployed report. An unfamiliar name can stay grouped while I investigate. That gives me a practical way to improve the analytics without either rewarding spam or discarding every source I do not yet recognize.

---

## Glossary

| Term | Meaning and source | Date |
|---|---|---|
| Referrer spam | Fabricated referral information intended to gain exposure through analytics. [Matomo explanation](https://matomo.org/blog/2015/05/stopping-referrer-spam/). | Published May 13, 2015; rechecked September 9, 2026 UTC |
| Matomo referrer spam list | Community-contributed hostname list; our release uses a fixed revision. [Source README](https://github.com/matomo-org/referrer-spam-list/blob/e65db652cade6882aa9a76bbb65c9bb17e079f4b/README.md). | Revision `e65db652`; checked September 7, 2026 UTC |
| Spam-referrer ingestion filter | Plausible checks the supplied referrer before its normal event pipeline. [Inspected source](https://github.com/plausible/analytics/blob/e74d6fb214b76664442d6a6bb8d96e74807ccfbf/lib/plausible/ingestion/event.ex#L64). | Revision `e74d6fb2`; checked September 9, 2026 UTC |
| Referral policy | Our versioned reporting rules, distinct from retained observations and public name approval. [Decision record](https://github.com/gkoreli/blog/blob/e1aa4a305ef934b1f089b24894321558db5f1603/docs/adr/0016.6-versioned-referral-policy-and-matomo-source.md). | Policy `2026-09-06.2`; activated September 7, 2026 UTC |
