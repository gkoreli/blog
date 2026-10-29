# Missing browser headers: test the storage question before naming the client

October 29, 2026 UTC. Continues the unresolved-record lead from [Research 85](85-post-census-delta-and-diagnostic-contracts.md), after [Research 87](87-report-json-contract-and-null-preservation.md). Human-operated trials and normal-profile owner verification remain deferred. The full analytics goal remains open.

## What this closes

The frozen **383-observation** delta contains **101 Unresolved** records: 91 metadata-absent reasons, nine unrecognized browser claims and one support-unknown reason. A single bounded Wrangler SELECT returns all 101, preserving owner/referral flags and exact private storage references. All are edge observations, with all four stored Fetch Metadata fields null. There are no owner flags or external referrers in this selected cohort; these observations remain included under the previously assessed referral policy.

**100 exact request contexts now reproduce the stored fields and classifications.** Their retained request-header objects contain none of `Sec-Fetch-Mode`, `Sec-Fetch-Dest`, `Sec-Fetch-Site` or `Sec-Fetch-User`. Ten metadata fields and six derived classification-evidence fields match, alongside the known storage-receipt projection and a receipt from a separate query. Current Node and local workerd replay agree for every recovered context. No metadata/storage mismatch is observed within that comparison.

This narrows the storage question. It does not establish what arrived on the original wire, which browser engine ran, whether an intermediary altered headers, who operated the client or what the request served. **All 100 remain Unresolved.**

| Stored reason | Selected | Exact retained context accepted |
|---|---:|---:|
| Fetch Metadata absent | 91 | 91 |
| Unrecognized browser claim | 9 | 8 |
| Fetch Metadata support unknown | 1 | 1 |
| Total | 101 | 100 |

The remaining unrecognized record has no returned receipt in an exact storage-reference lookup over the selected window. Its cause and availability elsewhere remain unknown. Zero returned events does not prove that a request or receipt never existed.

## Recovery counts are evidence too

The native selector fixture uses 383 rows, IDs above JavaScript's safe-integer range, range boundaries, owner preservation, unknown reasons, duplicate/partial output and excess-row sentinels. Its primary-key query plan is checked before the immutable production plan. Both local selection and the single-attempt production SELECT report **1,453 reads and zero writes**. Equality here is observed, not a future cost guarantee. The 10,000-read threshold is a post-execution review threshold, not a database-enforced cap.

The receipt query covers 06:00–17:00 UTC. It exports 101 receipts, but exact references identify only 100 within the frozen range and one outside it. Equal counts would have concealed the missing candidate. The documented [Invocations view](https://developers.cloudflare.com/workers/observability/query-builder/) groups matching invocations; its JSON export here still contains matching receipt events only. An anchored request-ID Regex retrieves **400 records across 100 request groups**. No time/path proximity substitutes for an identity join.

Eight bulk log-ID collision groups initially quarantine twelve contexts. An archived adaptive plan permits twelve individual exact request-ID selections. Each returns the same complete four-record chain, with unique log IDs inside that independent native selection. The full records match the bulk capture. All twelve can then be accepted; the original collisions remain recorded. Request IDs, operation IDs, collection profiles, Worker versions, receipt projections and truncation flags are checked together.

The first receipt-only pass saw four colliding records; the complete chain exposed twelve affected contexts. An initial analyzer incorrectly required trace spans to have Worker-log version fields. That failed closed for all remaining contexts; the repaired check applies to the invocation and Worker logs. Neither preliminary result is accepted evidence. Eleven mutation controls reject missing invocations, duplicate IDs, wrong operation IDs, changed receipt copies/metadata/UA/stored fields, truncation and incomplete or ambiguous recaptures.

A Copy-as-JSON action returned stale clipboard contents from the preceding report investigation. Shape/content checks rejected it. Downloads supplied the accepted captures. The first download wait expired because a limit dialog still required its final Download action; the displayed 1,000-record limit was then confirmed. These were export/control outcomes, not new D1 statements. Provider log-query cost is not returned; seventeen logical filter selections do not account for all underlying export/UI requests.

## What the request facts support

The accepted contexts contain **83 Firefox-family claims, seven Chromium-family claims, two WebKit-family claims and eight unrecognized claims**, across fourteen distinct retained UA strings. Ninety-one claim a version our heuristic treats as supporting Fetch Metadata; nine do not. These are parsed declarations, not authenticated engines or people.

Every retained URL is HTTPS; every forwarded-protocol value says HTTPS; every provider TLS field says TLSv1.3. Ninety-seven report HTTP/1.1 and three HTTP/2. These facts narrow the retained transport context. They neither explain missing headers nor attribute the requests to automation. One hundred current replays preserve the stored kind/reason despite 99 records carrying the older `.29.1` classifier stamp and one carrying `.29.2`. This is current replay, not reconstruction of the historical runtime.

The [W3C Fetch Metadata Working Draft dated September 21](https://www.w3.org/TR/2026/WD-fetch-metadata-20260921/) describes request context on potentially trustworthy URLs. `Sec-Fetch-User` is conditional on activated navigation; its absence alone is not anomalous. [MDN's mode reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Mode) describes mode and transport scope. Neither authenticates a UA string. The pinned [Fetch Standard request-header definition](https://fetch.spec.whatwg.org/commit-snapshots/59afe349913d56898c947576216f1c2579308be7/#forbidden-request-header) reserves `Sec-` names against web API control. That boundary does not turn arbitrary HTTP clients into authenticated browsers. The W3C draft's Sec-prefix paragraph links response-header terminology; the Fetch request-header definition supplies the applicable boundary.

Eight local Node/workerd controls cover missing metadata, navigation shape, subresources, unknown mode/client, an older version claim, normalization and missing network evidence. **A locally constructed request satisfies Browser shape**, including with normalized header casing/whitespace. This measures the rule's behavior; it supplies neither a real visitor label nor a population error rate. Missing evidence remains an abstention rather than a new bot heuristic.

Owner settings and the historical public-path registry are not replayed. This cohort's absent or origin-only internal referrers do not require that registry to reproduce null source paths. The capture remains a provider view, qualified by [retention, sampling and truncation](https://developers.cloudflare.com/workers/observability/logs/workers-logs/). No complete original-wire retention claim follows from a false truncation flag.

## Delivery and next experiment

The [selector](../../../scripts/check-unresolved-metadata-selection.mjs), [reconciler](analyze-unresolved-metadata.mjs) and [native replay checks](../../../scripts/check-unresolved-metadata-replay.mjs) improve the investigation. Collector, classifier, verifier and report behavior are unchanged. Optional raw-capture bindings remain off. No experimental own-site request or human label was created. The retrospective gains one short paragraph; the prompt record is unchanged because the owner instruction is already preserved.

Next: prepare a local, labelled automation experiment comparing an agent-operated browser's direct request with a controlled relay that removes Fetch Metadata. Preserve both stages and count decisions/abstentions. This can test a mechanism without human trials; it cannot establish the cause of these historical requests. Human/device error rates, native managed verification, R1 attribution, whole-history correctness and privacy decisions remain open.

Evidence: [production aggregates](unresolved-metadata-production.json), [native selection](unresolved-metadata-native.json), [Node/workerd replay and negative controls](unresolved-metadata-replay.json), [checked sources](unresolved-metadata-sources.json). [Checks](unresolved-metadata-checks.json) pass: types, 22 Markdown posts, isolated 33-post build, native selection, 108 Node/workerd comparisons and eleven linkage negatives. The initial build hit sandbox IPC restrictions; the same isolated snapshot passed with approved local runtime access. [Publication acceptance](unresolved-metadata-release.json) separately links source `fb83e99` to a Ready build, log-linked Worker and fresh CLI 100% allocation. One planned ineligible direct Markdown GET returns 200 and matches the entire checked build. Fresh served HTML and a per-request version trace were not inspected. Raw headers, addresses, URLs, identifiers and source-page captures remain outside Git with mode 0600 in mode-0700 directories. October 31 is a review date, not automatic erasure.


Private recovery commitments: initial-plan manifest `76185bd1c97f57cdeee4c747c8278fc27c1205afa531cb10c768a56797c03ef7`; adaptive-plan manifest `ee0142aeb3d8daf386621285ae9d9a16d81c0bc87540ddecac209a7f8b2ca01b`; data manifest `c1a2ae8be9f9b47ebd7a21f987eee2b0362d91a6b8ce07edb5fa940445ff64b6` (99 files). No automatic erasure.


Live-plan manifest `1b8df5f0dec998b75248c18bce77bc28d436c511956ed6c4676212edc5d7dd61`; live acceptance manifest `5886de72a1ac721d0bdf634bf2700461afbb0acc3f433aa25a37b76524d1cb52` (19 files). Local Node 24.14.1 differs from the provider build's 24.22.1; both are recorded.
