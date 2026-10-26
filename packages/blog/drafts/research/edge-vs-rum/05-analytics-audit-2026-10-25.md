# Analytics audit — October 25, 2026 Pacific

The arithmetic reconciles, but these numbers still cannot establish readership, genuine referrals, or human-directed agent activity. Two recent Browser spikes need investigation, owner exclusion has no coverage in the inspected window, and the identity/purpose grouping repair remains open. This is a completed current-state audit, not completed calibration or an article revision.

## Scope and evidence

Read the September handoffs, TASK-0104/0119/0120/0131, current ingestion/reporting code, service metadata, live public reports, and the signed-in Cloudflare dashboard. Public reports were calculated October 26 at **01:03:18 UTC** (Browsers) and **01:03:50 UTC** (All), October 25 at 18:03 Pacific. The 30-day report selects September 27 through October 26 UTC inclusive; October 26 is partial. The aggregate capture's latest stored observation is 01:03:34 UTC. Sources were read sequentially.

[Sanitized measurements and commitments](2026-10-25-audit.json) and [exact aggregate SQL](2026-10-25-audit.sql) accompany this report. Raw receipts stay in the author's private `analytics-evidence/2026-10-26-analytics-audit/` archive. R1 below is an alias; its supplied hostname remains private and unapproved for public display.

## What the current report counts

| Public group | Recorded page events |
|---|---:|
| Browsers | 1,423 |
| AI agents | 1,145 |
| Crawlers | 1,320 |
| Automation | 4,497 |
| All | 8,385 |

The Browser headline also shows **1,107 daily client IDs**. These are daily HMAC identities derived from site/date/IP/User-Agent. They do not identify 1,107 people, returning readers, or sessions. The same person can produce multiple IDs, and multiple people can share an ID. Distinct IDs across traffic groups or pages are not generally additive.

For both captured reports, page, date, kind, device, and referrer-state event totals reconcile. Named referrers + Other reported referrers + host-null events also reconcile. Daily ID totals reconcile with the daily series. The separate aggregate batch reproduces all 8,385 events and the 1,423 Browser events. All recent Browser events are HTML with `navigation-shaped` evidence; there is no legacy beacon/UA-only mixture in this window.

This establishes consistency of the inspected aggregates. It does not establish complete collection or classification accuracy.

## Two different spikes

| UTC day | Browser events | Daily IDs | Observed concentration |
|---|---:|---:|---|
| October 11 | 88 | 31 | 52 events are in host-null daily-ID cohorts with at least ten events; one reaches 38 distinct paths. |
| October 21 | 195 | 17 | 180 events are in host-null daily-ID cohorts with at least ten events. The largest has 59 events and a cohort reaches 56 distinct paths. |
| October 24 | 303 | 302 | 286 events report the same unreviewed external hostname, R1; each ID contributes one event within that day's R1 cohort. |
| October 25 | 119 | 119 | R1 supplies another 92 events, also one per ID within that cohort. |

“Host-null” includes internal referrals as well as absent headers. It does not mean direct arrival. The report distinguishes 586 absent-referrer, 329 internal-referrer, and 508 external-referrer Browser events. Its compatibility field `unattributedViews = 915` is 586 + 329, not 915 direct visits.

R1 supplies **397 events (27.9% of Browsers)** across seven UTC days, 45 recorded countries, and 247 ASNs. October 24–25 contribute 378 of those events. These patterns warrant review; they do not authenticate referrals, establish automation, identify an operator, or justify an automatic exclusion.

The cohort materially changes apparent article performance: R1 contributes **103 of 115** Browser events for the toolchain article and **91 of 132** for the plugin-apps article. Removing R1 would leave 1,026 Browser events as a sensitivity calculation. That is not a corrected human count or an accepted reporting-policy change.

The public display boundary still works: R1 is unnamed inside **465 Other reported referrer events**, out of 508 external-referrer events. Active referral policy `2026-09-06.2` excludes **zero events** in this selection. Zero policy matches does not establish zero abuse; the policy is a pinned list and reviewed local rules, not an authenticity check. Its version/hash still match the September release.

## Owner exclusion has no observed coverage here

Among 8,385 recent stored events, **zero** have ingestion owner flags and **zero** are excluded by either owner mechanism. The owner table contains one mark, dated September 9. A daily mark does not cover later dates, a different address, or another User-Agent.

This does not prove which events are Goga's or his tools'. It means the current public totals have no observed owner exclusions in this window. Browser QA and other self-generated navigation could contribute; the October 21 spike cannot be assigned to them from this evidence. Do not subtract guessed owner activity or run new production browser trials until exclusion is verified for the actual client and UTC day.

## “AI agents” still mixes identity and purpose

The group contains **1,054 signed-agent events** and **91 declared on-demand-fetcher events**. Signed outcomes comprise Exa 1,003, Ahrefs 42, ChatGPT 7, DuckAssist 1, and DomainsBot 1. The 91 declared fetcher matches are ChatGPT-User 70 and Claude-User 21.

The classifier still gives a verified signature precedence over the unsigned client-role classification. Most of this group therefore measures verified signer associations, not demonstrated human requests. A declared fetcher name also does not establish who triggered it. These are stored verifier outcomes; historical signatures were not independently replayed or reverified in this audit.

[TASK-0119](../../../../../docs/tasks/TASK-0119.md) was already open for this distinction in September and remains open. Preserve the verifier evidence while representing client role and trigger knowledge separately. Simply renaming all signed events as on-demand AI readership would preserve the misleading inference.

## Browser-beacon comparison remains unresolved

For **October 20 00:00 through October 26 00:00 UTC**, D1 contains **694 Browser HTML events**. The signed-in Cloudflare Web Analytics page-view report shows **137 page loads**, then **117** after excluding paths starting with `/stats`; adding the `/api` prefix exclusion leaves 117. Both path exclusions and “Exclude bots = Yes” were visibly present after loading. The only reported host is gkoreli.com. The dashboard's local date selector was October 19 17:00 through October 25 17:00 PDT; its URL encodes the matching UTC endpoints.

This is a UI-observed comparison, not a validated GraphQL export. Group-level sample intervals, full per-path reconciliation, daily beacon totals, and the bots-included population were not captured. **No accepted ratio is published.** The difference cannot be partitioned into bots, blocked scripts, missed beacons, caching/lifecycle differences, or owner activity from these totals. Neither source measures people or provides a shared authenticated event join.

Cloudflare documents beacon blocking and delivery loss, as well as query sampling. Those are possible mechanisms, not explanations measured here. [RUM FAQ](https://developers.cloudflare.com/web-analytics/faq/), [GraphQL sampling](https://developers.cloudflare.com/analytics/graphql-api/sampling/), checked October 25 Pacific.

Automatic approval review rejected reading Wrangler's stored OAuth credential for the direct GraphQL capture. The script did not complete a credential read or GraphQL request. The signed-in dashboard provided the safer read path; no credential extraction was retried. The dashboard observation is transcribed in the private archive and must not be presented as a raw API receipt.

The paired browser experiments in [TASK-0120](../../../../../docs/tasks/TASK-0120.md) remain unrun. The elapsed calendar time did not complete them or the longer calibration in [TASK-0104](../../../../../docs/tasks/TASK-0104.md).

## Operational correctness and audit cost

- Every inspected recent event has `asn_source = request`, a non-null ASN, and a referrer category. This supports the future-write provenance repair; it does not validate the values independently or repair historical gaps.
- The database contains 31,536 observations and is 13,127,680 bytes. Metadata initially reported 1,249 rows read and 1,496 written over its rolling 24-hour window. Those are dated, potentially lagging service metrics, not a UTC-day total or a measure of this subsequent audit.
- The latest deployment receipt is October 21 at 16:21:07 UTC, Worker version `23a32f14-ba45-45b6-a6d9-70418c04db86` at 100%. Local source commit is `8b71d3b`. These are separate observations; no Git-to-deployment attestation was inspected.
- One canonical Browser report returned MISS; an equivalent request with reordered/irrelevant parameters returned HIT with identical bytes and preserved calculation time in SEA. This verifies that instance of cache reuse, not global cache performance or expiry behavior.
- The seven SELECTs ran against a local SQLite schema before production. Their remote result receipts report **214,019 reads and zero row writes**, itemized in the JSON. The first attempt used Wrangler's file endpoint, which executed the SELECT batch but returned only an import summary: **203,083 reads, zero row writes**, and `changed_db: true`. That receipt is retained without claiming a zero-mutation API guarantee. A subsequent argument error was rejected locally before execution.
- Combined metered SQL work is **417,102 reads**, within the planned one-million-read ceiling. Two cold public HTTP reports also consumed unmeasured query reads; 417,102 is not the entire audit or account cost. No migration, policy activation, row rewrite/deletion, controlled article request, newsletter operation, or runtime deployment was performed.

## Next bounded work

1. Verify exclusion for the actual owner/test browser and current UTC day, then run TASK-0120's labelled normal/blocked/JS-off/cache cases. Observe collection stages separately; keep unknown joins unknown.
2. Complete TASK-0119's signer/role/trigger distinction and make those meanings visible alongside the headline metrics.
3. Review R1 through the existing [referral worklist](../../../../../docs/folders/FLDR-0009.md), with retained timing/header/network evidence where available. Decide inclusion/exclusion only after that review; keep evidence and the current report snapshot.
4. Obtain a bounded per-day RUM export with sampling and eligibility receipts through an authorized access path if a numerical cross-source ratio is needed. This audit does not schedule a capture or reopen the completed reporting/cache releases.

Completed: current reports, aggregate reconciliation, candidate/referrer concentration, owner coverage, signature composition, dashboard comparison, metadata, cache reuse, and saved methods/results. Remaining: classification accuracy, source authenticity, owner attribution/exclusion acceptance, controlled browser trials, and collection-loss attribution. The next implementation should address those gaps rather than claim that a smaller total is more truthful.
