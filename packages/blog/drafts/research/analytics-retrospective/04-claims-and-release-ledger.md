# Retrospective claim ledger and release history

October 25, 2026 Pacific. This ledger connects documentation, implementation, dated tests and current observations. Source/code review is not a new production experiment. Older papers, ADRs and releases retain their original dates and evidence limits.

## Article shape and positioning

**Title:** Building Blog Analytics: What the Numbers Can Prove.

**Reader language:** Why do my server-side page views look inflated? Can I identify bots or AI agents? What does a signed request prove? How do I keep a public dashboard consistent and affordable?

**Discovery route:** a builder investigating Cloudflare Workers/D1 analytics, referrer spam, edge-versus-beacon disagreement, or agent identity. These are plausible intents grounded in the actual implementation and owner questions, not measured keyword demand or a traffic forecast.

**Concrete payoff:** define the event being counted; separate request, classification, identity, role and trigger; preserve correction paths; test reconciliation and query cost; choose the next bounded experiment.

**Author's contribution:** the source-aware migration, classifier corrections, retained referral-policy evidence, D1 cost repair, transition capture, today's audit and Wrangler follow-up. The author remains unable to identify every requester or establish an accurate reader total.

This is a retrospective with an unresolved engineering question, not a complete implementation tutorial or a universal anti-bot system. It continues the Measurement boundaries series as part 6. The preceding referrer article is its direct predecessor; the architecture and bot-detection articles supply deeper mechanisms. An older article's navigation link is outside its frozen research measurement; no historical usage manifest is reopened.

## Claims, counterevidence and disposition

| Claim / stage | Evidence state and source | Supports | Cannot prove / counterevidence | Disposition |
|---|---|---|---|---|
| The old 97 AI Reads described beacon events rather than observed original crawler requests | Historical implementation and [article 020](../../../posts/020-first-party-analytics-for-a-personal-blog.md); [source research](../analytics-wrong-event/00-research-index.md) | A naming/event mismatch motivated the edge collection boundary | No retrospective assertion that 97 models used the content | Explain the original mistake with its historical unit |
| Edge counting observes eligible delivered page responses | Code-inspected [Worker](../../../src/worker/index.ts), [eligibility](../../../../analytics/src/eligibility.ts), [composition](../../../../analytics/src/index.ts); [routing/background docs](01-native-capabilities.md) | Successful non-prefetch page GET is the event boundary; current negotiated HTML and Markdown can count | Best-effort background insertion, reading and rendering are different; direct `.md` files and feeds are excluded | Use current definition and mark the later representation change |
| All 2,564 legacy rows have a source-marked continuity copy | Dated [cutover evidence](../../../../../docs/tasks/TASK-0020.md), migration 0002 and article 020 | Historical copy verification and retained source archive | Equal meaning across beacon/edge eras or added entropy in copied daily IDs | Preserve method boundaries and avoid causal trend claims |
| Request rules changed 372 browser-UA events to 95 Browser HTML events over September 4–5 | [Dated measured baseline](../readers-vs-bots/12-production-followup-2026-09-05.md), [correction ledger](../readers-vs-bots/16-claims-and-work-status-2026-09-06.md) | Rule effect of 277/372; named reasons make selection explainable | Not 277 proven bots; 95 versus 14 RUM loads does not allocate causes | Retain both rule effect and unresolved comparison |
| Accept parsing and missing future provenance were repaired | [Twelve-case experiment](../edge-vs-rum/03-local-experiment.md), [release](../edge-vs-rum/04-release-verification.md), RFC 9110 mapping in [standards note](02-standards-and-libraries.md) | Seven constructed parser expectations corrected; twelve missing markers become zero; seven subsequent production markers observed | Constructed sample is not a production error rate; original Accept headers were not retained | Distinguish local repair, deployment and measured acceptance |
| Public referral projection prevents automatic naming; versioned rules apply consistently | [Policy fixtures/acceptance](../readers-vs-bots/18-matomo-referral-policy-verification.md), [activation](../readers-vs-bots/19-referral-policy-activation.md), policy implementation | Named/Other/excluded outcomes, 9,409 tested cross-evaluator cases, dated 35-view exclusion | Remaining observations are genuine, every spam host is listed, or the same rule identifies an actor | Present the publication boundary and reversible policy, not complete detection |
| Shared report assessment reduced one historical report's read work | [D1 recovery](../d1-read-budget/02-recovery.md), [measurements](../d1-read-budget/recovery-measurements.json), current stats/cache code | 182,388 → 33,259 reads for the retained identical report; dated cache reuse | Current all-filter report cost, global cache hit rate or elimination of loss | Keep the fixed cohort/conditions beside the percentage |
| New referrer categories/transitions capture additional context | [September 9 acceptance](../article-024-hacker-news/07-transition-release-acceptance.md) | Nine supplied-header control observations stored and excluded; internal paths recognized; historical nulls stay unknown | Authenticated referring sites, actual browser clicks, complete funnels or recovered lost paths | Explain the irreversible minimization tradeoff |
| Current Browser totals reconcile | [October audit](../edge-vs-rum/05-analytics-audit-2026-10-25.md), source JSON/SQL | 1,423 Browser events, 1,107 daily IDs, 8,385 all-group events in the captured selection | People, complete persistence, absent owner traffic or calibrated classifier accuracy | Distinguish consistency from audience inference |
| R1 has a reproducible 397-event cohort and contradictory-looking context claims | Observed [Wrangler follow-up](03-wrangler-followup.md), [receipts](wrangler-followup.json); Fetch Metadata standard | 138 cross-site, 135 none, 124 same-origin; no additional recorded events for the same 397 daily IDs in scope | Actor identity, every event fabricated, true referring click or a measured human count | Investigate; retain R1 alias and no policy change |
| The 1,003 Exa signer outcomes lack a stored Exa client name | Observed Wrangler aggregation; local four-UA probe and official Exa/Ahrefs sources in [standards note](02-standards-and-libraries.md) | Concrete matcher/catalogue gap plus missing historical role evidence | Which historical request was ExaSearchBot or ExaUser; particular account/task | Repair prospectively; retain historical role unknown |
| Cryptographic verification is bounded evidence | Code-inspected verifier + RFC 9421/current bot-auth draft in [standards note](02-standards-and-libraries.md) | Covered bytes verified against a discovered key under a particular profile/cache | Full conformance, unique request freshness, recognized vendor, benign intent, authorization or human direction | Plan profile tests and separate verification, recognition, coverage, role and trigger |
| Current native Cloudflare fields may improve attribution | Primary documented [capability matrix](01-native-capabilities.md) | Product vocabulary and candidate surfaces worth checking | Actual current entitlement, populated fields, all-R1 coverage or per-request user trigger | Inventory and capture minimal labelled receipts before integration |
| RUM still disagrees with our counter | UI-observed October 20–25: 694 Browser HTML events versus 117 filtered beacon loads | A current unresolved comparison | No group sampling/path receipt; not an accepted ratio or bot/loss estimate | Keep sampling/export and controlled trials open |

## Corrections that belong in the retrospective

- The early ADR's assertion that a counter gap *is* automation was too strong. Later task contracts and published article corrections explicitly withdrew that causal inference. The older text is history, not the current rule.
- Cloudflare's current native identity/category documentation is richer than the September capability summary. Account, zone, enabled product, exposed field and actual retained receipt remain separate facts.
- A smaller total is not an acceptance criterion. The Accept repair moved examples both into and out of Browsers.
- A new parser/version cannot recover raw fields never stored. Retention must serve a defined future question; complete raw capture is not a default solution.
- The local verifier uses native cryptography but local protocol parsing. Matomo is a data source/comparison, not our runtime; Zod and uPlot do not authenticate the data they validate/display.
- A historical test, release or source pin is not current production health. Today's audit and Wrangler reads supply dated current evidence for their own questions only.

## Release audit — completed October 25 Pacific

The article numbers and conclusions were checked against this ledger and the machine-readable captures. Source checks, workspace typechecks, the isolated 31-post build, generated HTML/Markdown/prompts and internal cross-references passed. Both reviews' four precision recommendations are incorporated. The source release is `c4a8ae8`; [the later publication receipt](publication-acceptance.json) separately records observed Worker activation, route availability, live Markdown equality and public five-prompt metadata. No live rendered-browser or HTML-body acceptance is claimed. No unmeasured token total, new signature conformance result, browser experiment or R1 classification is attributed to this writing pass.

| Requested outcome | Current authoritative evidence | Result |
|---|---|---|
| Explore and capture today's findings | Original audit plus six Wrangler SELECT receipts, sanitized aggregates, exact SQL templates, private captures and rechecked commitments | Complete for the stated windows and predicates; no actor/reading proof inferred |
| Read authoritative native and library sources | Capability and standards/library matrices with primary links, versions/check dates, local implementation and measured-receipt cross-references; installed versions rechecked | Complete; actual native entitlements remain a proposed access check |
| Make an improvement plan | Dependency-ordered plan with existing owners, acceptance evidence, boundaries and stop conditions | Complete as a plan; future implementation remains open |
| Write the retrospective builder's article | Article 030, historical/current claim ledger, source glossary, concrete mechanisms, corrections, limits and next experiments | Complete; supported first-person work and unresolved outcomes retained |
| Preserve transparency and provenance | Five full shaping messages, public methods/selected aggregates, private raw records, unchanged earlier frozen footprints | Complete; private hashes are not independent provider authentication |
| Validate and deliver | Source on main, isolated generated representations and checks, later live Markdown/index equality and HEAD availability | Complete for the publication scope recorded in the receipt |
