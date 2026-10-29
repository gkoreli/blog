# The post-census delta: more evidence, substantial uncertainty

October 29, 2026 UTC. Continues the [accepted Parallel method iteration](84-parallel-documented-signing-and-address-methods.md). The previous goal turn made progress by deploying documented methods and accepting selected controls. Human trials remain deferred. This iteration examines every retained row above the frozen census maximum through a new preflight maximum; it does not revisit older rows or infer a new whole-table total.

## The bounded population

The [October 29 census](78-refreshed-retained-population.md) contains 33,189 observations through its private maximum ID, with last observed event at 05:57:57 UTC. Its immutable archive manifest and original preflight response are hash-checked before reusing that bound.

The new preflight finds **383 retained rows**, all with detailed signature evidence. The accepted aggregate agrees: **378 included, five referral-excluded, zero owner-excluded**, with stored event times **06:04:07–16:47:57 UTC**. No selected time is malformed or before the baseline event cutoff. The fixed ID scope includes backdated events if present; it is not a timestamp filter.

| Stored kind, included observations | Count |
| --- | ---: |
| AI assistant declaration | 1 |
| AI crawler declaration | 13 |
| AI search declaration | 56 |
| Browser | 39 |
| Cloud browser | 112 |
| Other bot | 46 |
| Search crawler | 7 |
| SEO crawler | 3 |
| Unresolved | 101 |
| **Total** | **378** |

These are stored classifications, not authenticated operators, distinct people or attention. The five exclusions are retained in the raw denominator. Their count is not, by itself, an exact attribution to this investigation's earlier controls. [Closed results and joint groups](post-census-delta-production.json) preserve inclusion and version differences rather than flattening them.

The included population has 351 collection `.29.3` rows, six `.29.4` and 21 `.29.5`; raw counts are 351, nine and 23. Classifier stamps are coherent for all 383 records: 351 older-profile and 32 current-profile records, with no returned conflicting, unrecognized or missing profiles. This checks the retained fields used by the diagnostic, not the original parser or whole-record authenticity. The observation-source distribution was not selected; no all-edge claim is made.

Separate statements agree on total cardinality and inclusion, but do not hold one transaction snapshot. Old-row edits/deletions and later appends remain unexamined. **Adding 383 to the old census is not a fresh whole-database count.**

## What the new evidence still cannot establish

Among included observations, 339 record absent signatures, two are unverified and 37 record verified outcomes. All 37 have coverage summary mask 8: authority binding without recorded UA, method, path, target-URI or query binding. This summary does not inspect every other possible covered header. No new proof bytes or nonces are recovered here, so these are not 37 newly replayed or demonstrably unique proofs.

All 383 records retain unavailable native bot booleans; absence is not `false` and no managed-verifier agreement can be calculated. Of 81 included named declarations, **56 have a method in today's registry and 25 have none**. That is current capability applied to retained declaration facts, not 56 successful authentications. Seventeen of the methodless observations declare Meta-WebIndexer. Historical vendor/network assessments remain as recorded. [Method groups](post-census-delta-methods.json) expose those distinctions.

The two unverified observations require different follow-ups:

| Retained declaration | Stored local reason | Separate stored address assessment | Interpretation limit |
| --- | --- | --- | --- |
| DuckDuckBot | `signature-invalid` | Listed | No original-wire reconstruction or exact retained-context replay yet |
| ExaSearchBot | `verification-timeout` | No positive address outcome recorded | Unavailable verification, not a negative identity finding |

The aggregate does not identify the particular address feed, original headers or timeout stage. A listed-address assessment and failed-signature outcome on the same record are a reason to recover the exact evidence, not to declare impersonation or override a failed proof.

## Most abstentions concern retained request metadata

The reason/context subset reconciles to **103 observations**: the 101 Unresolved records plus the two unverified outcomes, with no overlap. The Unresolved reasons are **91 `fetch-metadata-absent`, nine `unrecognized-browser-claim` and one `fetch-metadata-support-unknown`**. All 103 subset records have a missing retained mode value, incomplete retained navigation inputs and no recorded activation claim. This does not establish which collection or transport stage lost a value.

Among the Unresolved records, 83 carry a parsed Firefox-family claim: 82 in the metadata-absent group and one support-unknown. That is not authentication of an actual Firefox process, version, person or bot. [Context groups](post-census-delta-context.json) retain the joint distribution and older/current classifier distinctions.

[MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Mode) describes request mode and restricts header emission to potentially trustworthy URLs. The [Fetch Metadata Working Draft](https://www.w3.org/TR/fetch-metadata/) defines context/redirect behavior; the [Fetch Standard](https://fetch.spec.whatwg.org/#forbidden-request-header) defines the browser API's request-header restriction and explicitly supports WebDriver BiDi UA emulation. Those sources do not turn a declaration or missing retained field into a human label. Actual scheme, engine operation and original-wire presence remain unmeasured here. Human trials stay deferred; no rule is loosened to reduce the abstention count.

## Repair the diagnostic before trusting its result

The active client-method diagnostic still admitted only classification envelope `2026-10-27.2`, while collector `.29.4` introduced compact `2026-10-29.1`. Native controls reproduce the false-unrecognized case. The reader now accepts both envelopes while preserving closed candidate/status validation and classifier-stamp coherence. Older coherent declarations remain literal facts; unknown or conflicting profiles stay explicit. Stored classifications and public report semantics do not change.

The [new bounded helper](../../../scripts/check-post-census-delta.mjs) reuses the production signature, network and directory projectors and existing method/context diagnostics. It rejects a 2,049th-row sentinel, groups beyond 2,048, excessive detailed/label work, malformed bounds, duplicate groups and private canaries. Native controls exercise old/compact records, profile conflicts, exclusions, backdated/future/invalid times and adjacent exact IDs above JavaScript's safe-integer range. Concrete and parameterized results agree.

Two documentation checks matter beyond the green native result:

- Embedding the referral policy pushed the concrete query over D1's documented **100,000-byte statement limit**. Removing indentation outside quoted literals preserves data and brings the final aggregate to **98,834 bytes**. Quoted whitespace/escaped apostrophes are tested; unfamiliar quoting/comment grammar requires review.
- The local runtime accepted a 38-argument `json_object`, while [D1 documents a 32-argument maximum](https://developers.cloudflare.com/d1/platform/limits/). The new builder splits non-null closed fields across bounded objects before production. No over-limit production probe is run, and no claim is made about undocumented enforcement.

The [existing report builder at e405f55](https://github.com/gkoreli/blog/blob/e405f55/packages/analytics/src/stats.ts#L497) also has a larger JSON call in static source; [source notes](post-census-delta-sources.json) preserve that separate contract-review lead without claiming a live failure. Cross-references also catch a terminology discrepancy: the Fetch Metadata draft uses a response-header term where the normative Fetch Standard places `Sec-` under request-header restrictions. Primary documentation still needs to be read in context.

## Cost and acceptance

The 2,048-row native fixture costs **125,776 reads/zero query writes** across the four planned statements. Its distribution is not production-cost equivalence. Existing 15-case/712-row method and 16-case/114-row cohort checks also pass with their original default limits.

Fresh allocation/database metadata confirms the intended binding. A twelve-file immutable plan precedes the first SELECT; a separate seven-file plan freezes the accepted upper bound and all three main SQL files before execution. Every statement runs once through Wrangler `--command`:

| Statement | Metered reads | Writes |
| --- | ---: | ---: |
| Bounded preflight | 383 | 0 |
| Full new-ID aggregate | 18,069 | 0 |
| Client methods | 14,770 | 0 |
| Context/reasons | 4,433 | 0 |
| **Total** | **37,655** | **0** |

The 500,000-read review threshold is not server-enforced. [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) distinguishes returned records from scanned work; rolling Wrangler zeroes are not treated as proof of quota headroom. [Read-replication documentation](https://developers.cloudflare.com/d1/best-practices/read-replication/) supplies no held-snapshot guarantee for these separate CLI calls. [Checks and limits](post-census-delta-checks.json) preserve failed local attempts and exact successful SQL sizes.

No site visit, public report fill, human label, raw-capture activation, runtime change or old-row mutation occurs. The article stays at 1,375 words/31 prompts; no new build/served check is needed for diagnostic/evidence-only changes. Private IDs, plans, raw responses, metadata and captures remain outside Git; October 31 is a review date, not automatic erasure.

Next: native-test an indexed selector for the DuckDuckBot invalid and Exa timeout records, then recover their exact retained receipt/request contexts before interpreting either failure. Missing-mode Firefox claims, the report argument contract, original-wire fidelity, native agreement, R1 attribution and human/device accuracy remain open. The full goal stays active; human trials remain deferred.
