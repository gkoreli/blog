---
title: "Building Blog Analytics: What the Numbers Can Prove"
seoTitle: "Building Blog Analytics with Cloudflare Workers and D1"
alternativeHeadline: "A retrospective on page events, bot identity, referrer abuse, query costs, and the evidence still missing from my blog analytics"
date: "2026-10-25"
lastModified: "2026-10-25"
description: "Lessons from building Cloudflare Workers and D1 blog analytics: define page events, separate agent identity from purpose, preserve history, and measure query costs."
section: engineering
tags: [analytics, cloudflare-workers, d1, bots, observability]
series:
  id: "measurement-boundaries"
  title: "Measurement boundaries"
  order: 6
---

# Building Blog Analytics: What the Numbers Can Prove

My blog analytics reported 1,423 Browser page events and 1,107 daily client IDs. Page, date, device and referrer totals reconciled. One unreviewed referrer still accounted for 397 of those events, and none of the inspected traffic had been excluded as mine. The counter was consistent. Its ability to tell me who was reading remained limited.

Those are the results of an October 25, 2026 Pacific audit, captured just after midnight October 26 UTC. The report covers September 27 through October 26 UTC, with the last day partial. I am freezing that window here rather than treating a live dashboard as a permanent result. The [audit, queries and sanitized measurements](https://github.com/gkoreli/blog/blob/a04ee04/packages/blog/drafts/research/edge-vs-rum/05-analytics-audit-2026-10-25.md) preserve the details.

The initial audit did not cover the whole interval since the previous analytics feature release on September 8 Pacific, September 9 UTC. Its database inventory counted 31,536 stored observations; counting that inventory did not analyze every historical event. The later full-interval follow-up below closes the September 9–26 aggregate-analysis gap while preserving the original snapshot.

This system has moved from a browser beacon to Cloudflare Workers and D1, gained request classifications and signature verification, acquired a referrer-abuse policy, exhausted a database read allowance, and received several corrections. The useful lessons extend beyond a personal blog:

- Define the recorded event before naming the metric.
- Keep client identity, declared role and request purpose separate.
- Preserve the evidence and versions behind a reporting decision.
- Test operating cost as well as output correctness.
- Give unresolved questions an experiment and an acceptance condition.

I still want to understand how people and agents use my articles. This retrospective explains what the work has made observable, where my interpretation went too far, and what I intend to test next.

## Start with the event your instrument can observe

The original system displayed **97 AI Reads**. Those rows came from a later browser-script request. A normal crawler could fetch an article without executing that script and never enter the table. The query counted its inputs correctly; the name implied an event I had not collected.

In [the original rebuild](/first-party-analytics-for-a-personal-blog), I moved collection to the HTTP response boundary. The Worker serves the static asset, checks the actual response, and schedules a minimized observation. Cloudflare's [Worker-first asset routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/) makes that possible; asset-first routing would bypass this collector for matching assets.

The current pipeline is:

```text
Request + response
  -> successful, non-prefetch page GET?
  -> reduced request evidence and daily HMAC ID
  -> declared-client rule and signature verification
  -> D1 observation with source, representation and reason
  -> owner exclusions and versioned referral assessment
  -> shared report, bounded cache and public dashboard
```

Today, an eligible page event can represent HTML or a negotiated Markdown twin. Direct `.md` assets, feeds, API requests, redirects and errors remain outside this page counter. That definition evolved after the initial HTML-only cutover. A resource such as `llms.txt` still needs its own question and measurement boundary.

The write runs inside [`ctx.waitUntil`](https://developers.cloudflare.com/workers/runtime-apis/context/#waituntil). That extends background execution; it does not turn a delivered page into a guaranteed durable analytics row. Page delivery, persistence, rendering and reading are separate stages.

For another builder, this is the first design exercise: write one sentence describing what a stored row establishes. Then compare that sentence with the nouns on the dashboard. The architecture, schema, labels and privacy disclosure need to agree on the same event.

## Preserve history without pretending the method stayed the same

The old table contained **2,564 beacon events**, starting in March. I kept the original archive and copied a minimized, source-marked representation into the new read model. The [cutover verification](https://github.com/gkoreli/blog/blob/main/docs/tasks/TASK-0020.md) recorded 2,564 source rows, 2,564 copies and zero missing rows.

That preserves useful history. It does not make a script event equivalent to an edge response. The source column records the distinction, and the public methodology names the change.

I also changed the daily identifier. The old construction used a public date with IP and User-Agent in a hash. The current code derives a daily HMAC key from a secret, then hashes length-prefixed site/date/IP/User-Agent fields and retains 128 bits. It uses [native Web Crypto HMAC](https://www.w3.org/TR/2017/REC-WebCryptoAPI-20170126/#hmac), rather than a custom cryptographic primitive.

The result groups requests with the same inputs within one UTC day. An address or User-Agent change can split one person's activity; shared inputs can combine different people. Raw IP and User-Agent are not stored in the edge table, but the retained identifier is still pseudonymous. Cookieless describes one implementation choice, not anonymity or a definition of a reader.

Method boundaries belong in the data and the explanation. A jump after a collection change cannot, by itself, support a story about audience growth.

## Make classifications explainable, then test the rules

Moving collection to the edge made non-JavaScript traffic visible. It also made browser User-Agents a weak default classification. An HTTP client can declare Chrome; browser automation can send real navigation headers.

The current Browser rule combines request shape with a reviewed hosting-network list. It checks a navigation/document request, HTML acceptance and an Accept-Language, with network exclusions. [Fetch Metadata](https://www.w3.org/TR/2026/WD-fetch-metadata-20260921/) describes browser request context. It does not authenticate a person. Network membership is likewise context: a browser on a server can still be operated for someone.

Over September 4–5 UTC, those rules changed **372 browser-UA events into 95 Browser HTML events**. The 277-event difference measures the rules' effect. The separate script counter recorded 14 loads. My earlier interpretation assigned too much of that disagreement to automation. The [corrected investigation](/how-i-separate-readers-from-bots-without-javascript) preserves the result while leaving its causes unresolved.

Making the rules inspectable exposed ordinary implementation bugs too. Our HTML-acceptance parser mishandled quality weights and wildcard specificity. A check that merely finds `text/html` can accept `text/html;q=0`, despite that representation being explicitly unacceptable under [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#section-12.5.1).

In a [constructed twelve-case ingestion experiment](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/edge-vs-rum/03-local-experiment.md), seven parser results disagreed with the expected interpretation before the repair and zero did afterwards. Five cases moved out of Browsers and two moved in. The same experiment corrected missing ASN-provenance markers. A later deployment receipt checked subsequent production writes.

That is a bounded repair, not a production accuracy estimate. The original Accept headers were not retained, so the stored booleans cannot reveal how many historical events would change. Correctness required interpreting each input properly; a smaller total would have been an inadequate acceptance condition.

## Test what a populated field actually means

The recent audit found a referrer category and request-source ASN marker on every inspected event. That establishes population among stored rows. It does not independently validate the network, authenticate a referral or reveal eligible responses that never reached storage.

Reading the collector made the distinction concrete. `asn_source = request` is a marker our writer sets whenever the extracted ASN is non-null. The [native Cloudflare property](https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties) identifies the request's network; the organization field names the ASN owner. Neither identifies the operator behind a request. At that review, a local probe showed that our finite-number check accepted negative or fractional fixtures. The subsequent integer/range guard rejects them. The full-interval production aggregate found zero invalid non-null ASNs; this is preventive validation, not a measured correction to historical traffic.

The referrer fields contain application policy too. Our internal category compares normalized hostnames and treats `www` as an alias. A supplied `http://www.gkoreli.com:8080/engineering` is internal under that rule while having a different origin from the HTTPS blog. `internal` therefore does not mean browser `same-origin`. Historical origin-only internal URLs became `/`, which cannot tell me whether the source was the homepage or another page whose path was removed by policy. New collection keeps the internal category but omits that ambiguous source path; the dashboard labels old root sources explicitly. The [Referrer Policy draft](https://w3c.github.io/webappsec-referrer-policy/#referrer-policy-strict-origin-when-cross-origin) explains why a referrer can lose detail. The policy on my response governs subsequent requests from that document; it cannot authenticate incoming referrals from someone else's site.

The [field-semantics study and supplied-input probe](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/09-field-semantics-and-evidence-boundaries.md) preserve these cases, including legitimate HTTP referrer forms our parser currently groups as unusable. None establishes how often the cases occur in production. The next acceptance needs four distinct checks: fields populated, transformations correct for supplied inputs, actual browser behavior observed, and production collection coverage measured. More filled columns cannot substitute for the last two.

## Investigate the shape of a spike before celebrating it

Today's audit found two different patterns. October 21 UTC had **195 Browser events from 17 daily IDs**, with substantial repeated page fetching. October 24 had **303 events from 302 IDs**, including 286 that reported one unreviewed referrer. I call that hostname R1 here to avoid promoting it.

R1 contributed **397 events across seven days**, including 103 of the toolchain article's 115 Browser events and 91 of the plugin-apps article's 132. It materially changes how I would interpret those rankings.

I followed up through the repository's Wrangler CLI, using a frozen cutoff, owner predicates and aggregate SELECTs checked against isolated local D1 fixtures. The [method and receipts](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/03-wrangler-followup.md) reproduce all 397 events. The same daily IDs have no additional recorded page events in that inspected population.

The stored request context adds a useful complication:

| `Sec-Fetch-Site` alongside the external R1 referrer | Events |
|---|---:|
| `cross-site` | 138 |
| `none` | 135 |
| `same-origin` | 124 |

All have navigation-shaped flags and no stored signature outcome. The same-origin/external-referrer combinations need an explanation. These records do not support treating the whole cohort as ordinary cross-site clicks, and even the cross-site declarations do not authenticate a referral.

What can I determine exactly? The supplied-host cohort and its recorded distribution. What remains unknown? Its operator, whether every event was automated, and whether that external site caused a real navigation. Synthetic clients or modified headers are possibilities, not an attribution result.

Keeping more request characteristics might narrow a future investigation. It would not automatically identify a person. The daily HMAC cannot recover fields never retained, and a time/path match against another dataset remains a correlation unless a reliable join establishes the same request.

## Extend the audit to the whole interval

The [complete retained-data follow-up](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/10-full-interval-and-field-hardening.md) covers September 9 at 02:07:43 UTC through October 26 at 02:17 UTC, with the first and last days partial. Its eleven aggregate sections reconcile **14,835 included events**, with nine owner-excluded controls and 22 referral-policy exclusions. The previously missed interval contributes 6,431 included events. This closes the aggregate-analysis gap; it does not recover requests that were never persisted.

Equal complete weeks make the change easier to assess:

| UTC week beginning | All included events | Browser events |
|---|---:|---:|
| September 14 | 2,286 | 306 |
| September 21 | 2,087 | 259 |
| September 28 | 1,860 | 253 |
| October 5 | 2,090 | 266 |
| October 12 | 1,738 | 168 |
| October 19 | 2,507 | 711 |

The last week's Browser count is 2.32 times the first complete week's. But R1 supplies **388 of its 711 events**. A sensitivity calculation without that cohort gives **323 versus 306**, only 5.6% higher. That subtraction is not an accepted exclusion or a corrected human count. Repeated requests, owner activity and other unknowns remain.

The wider window also changes the provenance claim: all retained rows have referrer categories, but three included early events lack ASN provenance. Of 2,365 included internal-referrer events, **1,540** record `/` as source. That scale makes the root-path ambiguity worth fixing. Historical rows remain intact; new observations carry collection and classifier versions, both initially `2026-10-26.2`, so the method boundary can be queried directly.

The single aggregate statement used **361,147 D1 reads and zero writes**, within its declared 750,000-read ceiling. It passed local D1 boundary/exclusion fixtures first. A failed initial metadata authentication call is retained in the method record; ordinary CLI status checking and one metadata retry recovered access before the aggregate ran. No credential was extracted and no audience-query retry was needed.

## Separate agent identity from role and authorization

At the initial audit, the **AI agents** group contained 1,054 stored signed-agent outcomes and 91 declared on-demand-fetcher matches. Most of the signed outcomes are associated with Exa. The grouping joins evidence that answers different questions.

Wrangler confirmed that all **1,003 Exa-signed events** retain a generic `bot` class and a null client name. At that point, the matcher had no named Exa rules. The [preserved baseline probe](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/ua-coverage.json) returned that same generic result for the official ExaSearchBot, ExaUser, AhrefsBot and AhrefsSiteAudit User-Agents.

[Exa documents search crawling](https://crawler.exa.ai/) separately from [ExaUser retrieval](https://crawler.exa.ai/exauser), requested by users or applications. Both document the same signing directory. The signer origin therefore cannot recover the historical role we failed to retain. [Ahrefs](https://ahrefs.com/robot) likewise distinguishes client roles and publishes network verification information. A declared name and verified service infrastructure would still need separate evidence.

The model I need is clearer when split into questions:

| Question | Candidate evidence | Remaining boundary |
|---|---|---|
| Which key/directory verified? | HTTP-message-signature result under a recorded profile | Not automatically a recognized vendor or a unique fresh request |
| Which service is recognized? | Documented vendor identifier; applicable native or vendor verification | Not the service's individual end user |
| What role does the client declare? | Versioned UA rule or provider category | A declaration/assessment; its signature coverage matters |
| What action was authorized? | Validated scoped credential or cooperative task receipt | Permission/credential use, not a measured human trigger |
| Was the article read or understood? | No current telemetry establishes this | A fetch is insufficient |

### The first repair: preserve the role when a signature verifies

The follow-up on October 25 Pacific, October 26 UTC, fixes those four catalogue gaps. ExaUser now maps to the declared on-demand-fetcher kind, ExaSearchBot to AI search, and AhrefsBot and AhrefsSiteAudit to a new SEO/site-audit crawler kind. Token boundaries reject prefixed and suffixed lookalikes. Anyone can still copy a valid-looking User-Agent; matching a name does not authenticate its operator.

Adding names alone would have left a second error. Signature verification previously overrode the declared role with `signed-agent`. A signed Ahrefs crawler would still enter the AI agents group. The collector now retains a recognized named role and keeps the signature outcome in its existing separate fields. The report adds a signer aggregate over the same included selection. A request can therefore appear under a declared crawler role and a signing directory without adding an extra event to the total.

The public filter is now **Assistants & signed clients**, with the signed-client fallback explicitly covering historical or unknown roles. The four main groups remain disjoint. Declared names and stored verified-key outcomes are separate panels that overlap those groups; they are evidence dimensions, not additional audience totals.

The [repair record](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/08-classification-repair.md) preserves the before/after probe, exact source commitments and acceptance boundaries. Tests exercise all four official declarations unsigned, signed and with failed verification, including real ingestion through a locally generated Ed25519 fixture key. The report also passes Cloudflare's local D1 runtime with owner/referral exclusions and a historical unknown-role row. That fixture proves behavior for a controlled key, not that Exa or Ahrefs sent it.

Live acceptance then sent four deliberately synthetic copies of those declarations under an already verified referral exclusion. Wrangler found one correctly named and classified observation for each. The public `/privacy` report excluded all four; an equivalent repeat reused the cached report. That bounded SELECT cost twelve D1 reads and wrote zero rows, with public report fills additional. Live vendor-signed role acceptance remains open; the signed path was checked with the local fixture key. The [release receipt](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/classification-release-acceptance.json) records the conditions and limits.

There is no historical rewrite. The 1,003 Exa and 42 Ahrefs signer outcomes in the frozen audit keep their original classifications. Exa's shared signing directory cannot tell me which of its two roles those old rows declared. This is a prospective collection repair with an explicit boundary; it does not turn unknown history into a cleaner story.

Our verifier uses native Ed25519 through `crypto.subtle`, but its protocol parsing and policy are local code. [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html) is the published HTTP Message Signatures standard; the bot-specific [working-group protocol](https://datatracker.ietf.org/doc/draft-ietf-webbotauth-httpsig-protocol/) is still a draft.

That distinction matters in the implementation. Our supported profile accepts authority-only signatures. Such a signature can remain reusable against the origin during its validity window; it is not necessarily bound to a unique path, method or body. The verifier checks validity times but does not track nonce reuse. Narrower coverage limits where a signature can be reused; it does not establish one-time use. The [source review](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/02-standards-and-libraries.md) also identifies origin handling, dictionary association, directory media type and key-cache behavior for further testing. These are review findings, not a newly executed exploit or a full conformance verdict.

A valid signature is useful evidence under defined trust and coverage rules. It is not a universal proof of purpose. A client that controls a signing directory can identify as that directory without becoming a recognized service. Even a recognized service's declared role may not be covered by the accepted signature.

## Check native capabilities before adding another subsystem

Cloudflare documents [AI Crawl Control](https://developers.cloudflare.com/ai-crawl-control/) across plans. That is a useful first comparison surface before considering additional products. Its request population still needs alignment with this counter's host, successful page responses, dates and sampling; today's pass did not capture its current results.

Cloudflare's current documentation lists Workers fields for [signed-agent and verified-bot category evidence](https://developers.cloudflare.com/bots/reference/bot-management-variables/). Its [Verified bots documentation](https://developers.cloudflare.com/bots/concepts/bot/verified-bots/) now describes service behaviors and Direct versus Intermediary operation. That is a richer vocabulary than our September capability summary.

It is a reason to inspect actual access, not evidence that these fields are already populated for my Worker. Workers Paid and an Enterprise Bot Management entitlement are different products. Provider categories also describe a service; they do not hand me the particular user's request or authorization.

For anonymous ordinary requests, there is no universal deterministic actor identity waiting inside another header. Cooperative clients can provide stronger proofs: a recognized signing identity, covered request assertions, or an optional publication-issued scoped credential. Such a credential could establish an allowed action under a policy. It still would not establish who physically used it, their attention, or their understanding. I do not intend to require an account to read public articles.

The [native capability matrix](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/01-native-capabilities.md) maps each candidate to documentation, local code, measured receipts and missing acceptance. This also keeps library responsibilities honest: Matomo supplies a pinned hostname list, Zod checks data shape, uPlot draws server aggregates, and native crypto supplies primitives. None turns a valid-looking report into authenticated readership.

## Public transparency needs a reporting policy

My earlier referrer ranking gave an untrusted destination exposure. The [referrer defense](/filter-referrer-spam-without-deleting-analytics-history) now separates retained observations, versioned inclusion rules and public name approval. Unknown included names appear as Other; exclusions apply across every metric and are disclosed separately.

The policy combines **2,348 hosts from a pinned Matomo snapshot** with reviewed local rules. The release checked rule precedence and **9,409 cross-evaluator fixtures** so the TypeScript review path and database reporting path agreed on the tested cases. That establishes implementation behavior, not the fraction of real-world abuse detected.

Today's policy excluded zero events in the inspected selection. R1 remained counted but unnamed. That result exposes the policy's limit: preventing automatic public promotion is easier to guarantee than authenticating every referral. Adding a reviewed exclusion can be a defensible reporting decision without pretending that I identified the operator.

Preserving history helps corrections, but minimization has consequences. New referrer categories distinguish external, internal, absent and unusable values. Recognized internal paths support page transitions. The [September controls](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/article-024-hacker-news/07-transition-release-acceptance.md) verified supplied-header capture and exclusion, not actual browser click journeys. Historical nulls cannot recover internal paths discarded by the old parser.

I now treat a historical report as a result with a window, selection, policy/version and calculation time. Retaining observations permits recalculation; saving exact report bytes preserves what the dashboard actually said.

## Correct counts can still be too expensive to serve

The referral assessment initially repeated across nine report queries. One historical report used **182,388 D1 row reads**. That was fast enough locally to look acceptable, while spending 3.65% of the then-applicable five-million-read daily allowance on one report. The account later exhausted that allowance.

The repair shared the selected population and referral assessment. For the retained identical report, production reads fell to **33,259**, or **81.8% fewer**. The [incident and recovery evidence](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/d1-read-budget/02-recovery.md) separates that measurement from the owner-reported paid-plan upgrade and from cache acceptance.

[D1 rows read](https://developers.cloudflare.com/d1/platform/pricing/#definitions) count query work, not distinct visitors, returned rows or stored observations. One statement is not automatically cheaper either. A candidate passed Node SQLite and then hit a D1 SQL limit; subsequent acceptance included the actual local D1 runtime.

The Worker cache now reuses validated reports for at most an hour, capped at UTC midnight, with policy and report versions in the key. It preserves the original calculation time. Cloudflare's [Cache API is local to a data center](https://developers.cloudflare.com/workers/runtime-apis/cache/); our concurrent-fill controls are local to an isolate. Neither creates a global query budget.

Today's investigation also had a cost. An initial Wrangler SQL-file execution returned an import summary instead of the individual query results, while reporting 203,083 reads and zero row writes. The subsequent result capture and follow-up bring directly measured SQL work to **630,169 reads**. Public report fills are additional. Keeping the unhelpful first execution in the accounting is part of explaining the method honestly.

The transferable check is concrete: verify output, measure the complete report's service-metered work, then estimate that work across observed cold fills and other account activity. Latency and a correct total are insufficient operating criteria.

## The next iteration starts with a known client

Owner exclusion is the first gate. The current query supports it, but today's window contains zero excluded owner events and the only daily mark is from September 9. A mark for one client/day cannot cover a later date or changed address/User-Agent. I cannot assign the October 21 spike to my own tools just because that explanation is plausible.

The calibration question is still live too. For October 20–25 UTC, D1 recorded **694 Browser HTML events**, while Cloudflare's signed-in dashboard showed **117 non-bot beacon loads** after stats/API path exclusions. That was a UI observation without group-level sampling and complete path-reconciliation receipts, so I am not publishing an accepted ratio or a bot estimate. Cloudflare documents [beacon blocking, loss and sampling](https://developers.cloudflare.com/web-analytics/faq/); those are mechanisms to test, not causes already allocated to this gap.

The [improvement plan](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/05-improvement-plan.md) orders the work by the evidence needed:

1. **Inspect retained native evidence.** Full-interval stored-data aggregation is complete above. Native field availability, retained logs, sampling and reliable joins still need actual-access evidence.
2. **Verify owner/test exclusion for the actual browser and UTC day.** The new owner-marking page exposes the existing authenticated endpoint. A successful form submission still needs stored-event and public-report acceptance before calibration; cached reports can be stale.
3. **Extend the role/signer repair.** The Exa/Ahrefs catalogue gaps and signature precedence are repaired in the follow-up above. Collection/classifier versions on each observation, broader catalogue review and native vendor recognition remain open. Keep historical roles unknown where inputs are missing.
4. **Test the supported signature profile and native verification paths.** Keep recognition, coverage, freshness and unavailable fields explicit.
5. **Make a reviewed R1 reporting decision.** Preserve its evidence and the false-exclusion tradeoff; do not turn a policy into an identity claim.
6. **Run labelled browser/beacon experiments.** Pair normal, blocked-beacon, JavaScript-off and warm-cache cases, recording each collection stage and unknown join.

An optional scoped task receipt comes later, only for a real cooperative client whose question needs it. A new authentication service, custom beacon or queue has to earn its maintenance cost by answering something the current native tools cannot.

I have a more inspectable counter than the one that displayed AI Reads. I can explain its event, classification rules, policy effects and query costs, and I can point to specific missing evidence. I still cannot use it to count people reading. The next useful result is a verified owner flow and a labelled collection experiment, with the same care for what failed or remained unknown as for what worked.

---

## Glossary

| Term / claim | Primary source and scope | Date |
|---|---|---|
| Worker-first collection | [Cloudflare asset routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/) and [`waitUntil`](https://developers.cloudflare.com/workers/runtime-apis/context/#waituntil): routing and bounded background work, not reading or guaranteed persistence. | Checked October 25, 2026 Pacific |
| Request context | [Fetch Metadata Working Draft](https://www.w3.org/TR/2026/WD-fetch-metadata-20260921/): browser request relationships and activation semantics. | September 21, 2026 draft; checked October 25 |
| HTML acceptance and referrer | [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html): quality/specificity and `Referer` semantics. | June 2022; checked October 25, 2026 |
| Daily HMAC identity | [Web Crypto HMAC](https://www.w3.org/TR/2017/REC-WebCryptoAPI-20170126/#hmac): keyed computation; our grouping and privacy choices are application policy. | January 2017 Recommendation; checked October 25, 2026 |
| Agent message signatures | [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html) and [Web Bot Auth protocol draft](https://datatracker.ietf.org/doc/draft-ietf-webbotauth-httpsig-protocol/): signature scope and an evolving bot-specific profile. | February 2024 RFC / September 2026 draft `-00`; checked October 25 |
| Exa client roles | [ExaSearchBot](https://crawler.exa.ai/) and [ExaUser](https://crawler.exa.ai/exauser): documented role distinction and signing directory. | Pages dated July 30 / September 30, 2026; checked October 25 |
| Ahrefs client roles | [Ahrefs crawler documentation](https://ahrefs.com/robot): SEO/database crawling and site auditing; declarations remain separate from network or signature verification. | Checked October 25, 2026 Pacific |
| Native bot evidence | [Cloudflare variables](https://developers.cloudflare.com/bots/reference/bot-management-variables/), [Verified bots](https://developers.cloudflare.com/bots/concepts/bot/verified-bots/), and [signed-agent entitlement](https://developers.cloudflare.com/ruleset-engine/rules-language/fields/reference/cf.bot_management.signed_agent/): documented surfaces, not a receipt of this zone's access. | Checked October 25, 2026 Pacific |
| Referral source list | [Matomo snapshot `e65db652`](https://github.com/matomo-org/referrer-spam-list/tree/e65db652cade6882aa9a76bbb65c9bb17e079f4b): pinned data, separate from local overrides and public name approval. | 2,348 archived entries; rechecked October 25, 2026 |
| Query work and caching | [D1 pricing definitions](https://developers.cloudflare.com/d1/platform/pricing/#definitions), [SQLite materialization](https://www.sqlite.org/lang_with.html#materialization_hints), and [Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/): metering and execution/cache boundaries. | Checked October 25, 2026 Pacific |
| Beacon comparison | [Cloudflare Web Analytics FAQ](https://developers.cloudflare.com/web-analytics/faq/): collection and sampling limits; not a human ground truth. | Checked October 25, 2026 Pacific |

The [research index](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/analytics-retrospective) links the source/implementation matrix, claim ledger, Wrangler receipts and proposed plan. Private originals and credentials remain outside Git. Capture hashes commit to bytes the author retains; they do not let a public reader independently authenticate the provider's results. This article publishes its complete shaping prompts, with no measured token-cost claim and no reopening of earlier articles' frozen research footprints.
