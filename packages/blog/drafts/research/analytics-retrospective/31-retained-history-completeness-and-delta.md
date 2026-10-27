# Complete fields are not complete evidence

October 27, 2026 UTC. Continues [the denominator repair](29-unreported-classifications-and-denominators.md) and [pointer/trust follow-up](30-filter-pointer-targets-and-browser-trust.md). Human trials remain deferred. This is a completeness census of the retained `page_observations` read model, not an accuracy assessment or a count of every delivered request.

## Scope and the previously unmeasured history

The main SELECT examines every retained row and partitions dates around **October 27, 2026 21:49:00 UTC exclusive**. It finds **32,272 rows**, all before the cutoff, with canonical stored dates spanning **March 7–October 27**. No unrecognized timestamps occur. Canonical formatting establishes neither clock accuracy nor the time a row entered the database.

The [earlier audit](10-full-interval-and-field-hardening.md) covered the release-to-cutoff window beginning **September 9 02:07:43** and ending **October 26 02:17:00 UTC exclusive**. Its query did not inspect dates before that start. Today's table has **16,693 earlier-dated rows**. This corrects any reading of the worklist's “full retained population” as the whole table. It does not prove those rows existed at the earlier capture time; the census does not inspect insertion history or perform a historical snapshot query. Original queries/results remain frozen.

| Stored date cohort, at today's cutoff | Retained | Currently included | Owner excluded | Referral excluded |
|---|---:|---:|---:|---:|
| Earlier than the prior audit's start | 16,693 | 16,637 | 0 | 56 |
| Prior audit's exact interval | 14,866 | 14,834 | 10 | 22 |
| Since the prior audit's cutoff | 713 | 651 | 42 | 20 |
| Total | **32,272** | **32,122** | **52** | **98** |

The disjoint status gives owner exclusion precedence. Five owner-excluded rows also match referral policy; those overlaps are retained separately and must not be added twice. Policy version/hash match the prior audit. The earlier frozen interval counted 14,835 included, nine owner-excluded and 22 referral-excluded. Today's evaluation has one fewer included event and one more owner exclusion, with the same retained count. All ten current owner exclusions for that interval come from the client registry. This is a current inclusion-state comparison, not proof of a specific changed row, a complete row-identity join or data loss.

The newly measured 713-row interval contains 651 included observations: 100 Browser, 96 AI search, 66 AI crawler, eight assistant declarations, seven SEO crawler declarations, ten Unresolved and 364 other stored classifications. These are classifications under multiple recorded rule versions, not people, verified devices or authenticated purposes. Forty-two owner exclusions include controlled work; the census does not label every excluded request's operator.

## The source boundary matters

The March dates prompted a separately planned, cheap source-boundary aggregate. At the common cutoff it finds **2,564 copied legacy beacon observations and 29,708 edge observations**. The earlier-dated cohort contains all 2,564 beacons plus 14,129 edge observations; the prior-audit and since-audit cohorts are edge observations. These are raw retained counts, not a source-by-exclusion intersection.

The source query runs later and sees **32,274 rows**, including **two at or after the cutoff**. Its before-cutoff count still matches 32,272. Those two rows are explicitly outside the dated comparison; do not call the different snapshot totals a collection failure. Matching cutoff counts do not establish exact-row identity or an atomic join across statements.

[ADR-0016](../../../../../docs/adr/0016-analytics-observation-semantics.md) keeps `page_views` as the original archive and `observation_source`/`source_event_id` on its minimized copy. Counting the archive again would double-count copied events. This census does not reconcile archive-copy completeness. A whole-table total also crosses collection methods and classification eras; it is unsuitable as a single comparable audience-growth series.

## What is complete, and what remains unknown

Every retained row has a recognized kind and a non-empty stored reason: **zero missing/unrecognized kinds and zero null/empty reasons**, including excluded rows. The native 10-total/5-composition counterexample from research 29 establishes a real decoder/query defect, but this census finds no affected stored rows at its cutoff. That repair is a completeness safeguard, not evidence that production lost half its classification breakdown.

For the **32,122 currently included observations**:

| Stored signature basis | Observations |
|---|---:|
| Verification detail not recorded | 30,806 |
| Stored verified outcome, proof/coverage detail unrecorded | 1,181 |
| No signature headers recorded | 128 |
| Local verified result, User-Agent uncovered | 7 |
| Total | **32,122** |

All seven detailed verified rows leave the User-Agent unsigned. Six carry the reviewed Exa display name and an AI-search classification; one carries Ahrefs and an SEO classification. Four of the Exa rows also store Cloudflare's Search Engine Crawler category under the current collection version. These are joint stored facts, not fresh cryptographic re-verification, authenticated declarations or exact retained-log/request joins. A category is not native-verifier agreement. The census leaves **1,025 included signed-client outcomes named Exa with unknown roles**; it cannot reconstruct discarded User-Agents from that fallback. A separately planned aggregate checks the raw Exa fallback subset directly: all **1,025 names are null**, and none has a request-evidence or classification-evidence record. The raw subset count matches the main census's included fallback count; these are separate snapshots, not an exact-row join. This supports the retained-role gap without assuming a fallback kind implies missing names. It does not rule out partial recovery from external retained logs.

No native verification boolean values are recorded anywhere in the main snapshot: 190 rows carry unavailable fields and 32,082 have no record. Within the included selection those counts are 135 and 31,987. Neither state means false. The included native-category table has eight named categories, 24 empty categories and 32,090 unrecorded categories; this differs from boolean availability. See the closed dataset for categories and their classification intersections.

Two conflicting-category and one multiple-name/same-category records occur in the raw population; none is currently included. These controlled/otherwise excluded records are not a population error-rate estimate. Profile fields remain unknown for history: 31,472 included rows lack both collection and classifier versions. Filled kinds/reasons do not recover those original methods or prove them correct.

## Method, validation and cost

[Closed production dataset](completeness-census-production.json), [main plan](completeness-census-plan.json), [source supplement plan](completeness-source-supplement-plan.json), [fallback-name plan](completeness-fallback-supplement-plan.json), [native acceptance](completeness-census-local.json), [maintained helper and strict decoders](../../../scripts/check-completeness-census.mjs).

The main query reuses the production referral evaluator and current closed kind, signer, signature-basis and native-category projections. It retains owner flag/client-mark evidence and referral overlap before applying the disjoint status. Reasons, profiles and declaration agreement are closed presence/state projections; no raw client IDs, referrer names, arbitrary reasons, signing origins, User-Agents or row IDs leave the query. Boolean typing and declaration fields describe stored JSON, not validation of every field or its provenance. Twenty-three adversarial native fixtures cover owner overlap, suffix lookalikes, cutoff edges, impossible dates, unknown kinds/reasons, stored signature/native shapes, approved naming, an empty population and malformed-result rejection. Original fixture rows remain unchanged by the SELECTs.

| Statement | Native scale control | Production reads | Production writes |
|---|---|---:|---:|
| Main completeness census | 20,000 rows / 193,362 reads | 328,331 | 0 |
| Source-boundary supplement | 20,000 rows / 60,000 reads | 96,822 | 0 |
| Retained fallback-name check | 20,000-row table / 20,000 reads | 32,273 | 0 |
| Total | Separate synthetic populations | **457,426** | **0** |

All three production executions use Wrangler `--command` with SQL as one argv value read from private preparation; neither uses import/file mode. All return `changes=0`, `changed_db=false`. The combined 500,000-read ceiling is a reviewed post-execution threshold, not a database-enforced limit. The source question emerged after the March finding; the retained-name question guards against inferring absent declarations from a fallback kind. Each supplement was separately planned/native-tested before its one production execution, using the remaining original combined ceiling. No cold public report probe was needed for the data investigation.

Preflight metadata reported 1,203,990 D1 reads over a rolling 24 hours. That is not a UTC-day/account-wide total or attribution of those reads to this task. Record this investigation's three direct SELECTs separately from unrelated service activity. Raw captures, expanded SQL and commitments remain private; public output contains only closed aggregates.

## Primary references and next work

- [SQLite date/time functions](https://www.sqlite.org/lang_datefunc.html): SQLite has no dedicated date type. The query accounts for noncanonical/impossible timestamp values explicitly rather than dropping them through a date filter; native fixtures test that behavior.
- [SQLite CTE materialization](https://www.sqlite.org/lang_with.html#materialization_hints): one selected population and referral assessment are reused. Materialization and local speed do not replace service metering.
- [D1 read definitions](https://developers.cloudflare.com/d1/platform/pricing/#definitions): reads measure query work; 457,426 reads do not mean 457,426 observations or visitors.
- [ADR-0016.7](../../../../../docs/adr/0016.7-budget-d1-reads-and-cache-public-reports.md): native acceptance, explicit budgets, exact metering and command-mode diagnostic execution.

Sources checked October 27, 2026. The concise retrospective now distinguishes the old audit window, the whole-table census and missing proof detail. No collector, classifier, verifier, schema or report/cache semantics change in this iteration. [Source checks](completeness-census-source-checks.json) accept helper syntax, analytics fixture compilation, strict result revalidation, frontmatter validation, local links and a 32-post isolated build. Unchanged runtime suites remain the prior 172 analytics/106 site passes; they were not rerun. The article is 1,250 words with 31 shaping prompts. Publication and activation remain separate from data acceptance.

Next bounded investigation: correlate the four current-collection Exa observations and the Ahrefs detailed outcome with retained native receipts and authoritative vendor method documentation. The stored intersections narrow the search; they do not establish an exact request join or independent native cryptographic agreement. Replay/DNS, retention/lawful-basis, loss/sampling and actual human/device error-rate work remain open. Human trials stay deferred.


**Collection-stage wording follow-up:** The source-aware census also narrows the article's generic “stored event” sentence to an edge event recording an eligible response. Copied beacon observations do not establish the same server-response boundary, and response eligibility does not prove client receipt or attention. The glossary likewise distinguishes edge responses from legacy beacons. This precision changes article prose only; no collection rule or stored history changes.


## Publication acceptance

[Publication receipt](completeness-census-publication.json) records the initial census source `a43c8ad` and final response/beacon wording source `4b68c83`, separate Ready builds and observed 100% activations. Final served Markdown matches the isolated build. The rendered article shows the complete-table count, updated Exa fallback count, census link and response-versus-beacon glossary. It stays 1,250 words with 31 shaping prompts. No additional direct SELECT was needed for publication; all three investigated statements remain 457,426 reads/zero writes. Ordinary article inspection is additional service work. No preview, tail or viewport override was started in this phase.

This closes the retained-table completeness census and its publication. It does not close the broader detection goal, current native/vendor receipt correlation, original archive-copy completeness, historical exact-row identities, privacy/retention decisions or human/device accuracy. The next bounded action remains current Exa/Ahrefs receipt and authoritative-method investigation. Human trials stay deferred. Private captures are retained outside Git with review dated October 31, 2026; this is not a verified erasure/backup guarantee.
