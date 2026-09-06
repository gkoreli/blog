# Two implementation priorities for agent-inclusive analytics

Proposed September 5 PDT / September 6 UTC, 2026. Supports post 024 and the broader article series. Based on artifact 12's production measurements. Planning only: no new production collection or deployment is introduced by this document.

Implementation detail and subsequent source review: [artifact 14](14-evidence-backed-implementation-plan.md) refines these two priorities with pinned open-source precedents, data contracts, experiment conditions, acceptance gates, and release sequencing. Read both before implementation; artifact 14 preserves this document's diagnostic collection scope.

**Subsequent scope clarification, September 5 PDT:** inspect existing Cloudflare logs and traces first. Preserve the verifier and existing identity evidence; the immediate signature repair is grouping and wording. New diagnostic storage and schema expansion below remain contingent proposals, not prerequisites. The [series worklist](../../../../../docs/folders/FLDR-0008.md) assigns the full calibration study to lane row 10 and the identity study to row 4; article 024 receives corrections and a compact dated result. This clarification governs where the earlier plan suggests broader implementation or article expansion.

## What the data established

- September 4–5 UTC: 467 eligible observations; 372 have the original browser-UA class; 95 remain in Browsers. Classification moves 277/372 (74.5%).
- The matched aggregate RUM window has 14 non-bot page loads after `/stats` exclusion, with sample interval 1. The 6.79× discrepancy is not a measured bot fraction.
- Sixty cloud-classified requests pass the complete navigation predicate, including one 34-request / 32-path burst in about one second.
- Twenty-two browser-class rows form a repeated page-pair/referrer cluster on AS17638. One raw request declares a Redroid Android WebView. This supports an automation hypothesis; it does not prove every request's operator or purpose.
- Nine requests have production-verified signatures: two deliberate DuckAssist tests, five Ahrefs requests, and two Exa requests. Identity and purpose cannot be represented by the same classification decision.
- September 3 Worker deployment and September 4 migration are separate boundaries. `owner_clients` is empty. Local code is not deployment evidence.

## Priority 1 — Separate client identity evidence from traffic purpose

Work item: TASK-0119. Reader question: which services fetch each article, what establishes their identity, and what do we know about why they fetched it?

Implementation:

1. Keep a bounded client-role classification separate from identity evidence. Signature verification must not automatically turn a crawler into an on-demand assistant. Preserve `unknown` purpose when no documented role applies. A declared vendor role is evidence about a client family, not proof of a particular user's action.
2. Expose identity basis independently: UA declaration, verified signature, or no named identity. Do not claim vendor-IP validation until that check exists and has been measured. Preserve signer evidence without conflating it with trust or purpose.
3. Add explicit collection/classifier version provenance for new observations. Map old deployment windows only when supported; mark reconstruction separately. Do not manufacture missing evidence. Retain revision records for any later reclassification.
4. Make the per-article composition show role, identity basis, and reason, with totals that reconcile. Introduce overlapping signature facets only as facets, never as additive population totals.
5. Release verification must record the deployed version and migration status separately, and exercise the existing owner-marking path using a controlled owner request. Do not exclude an entire ASN as the author.

Acceptance evidence:

- Tests for signed crawler, signed assistant, signed unknown-purpose client, unsigned UA declaration, invalid signature, and unnamed browser shape.
- The saved nine-request signature cohort produces the same nine signature facts while preserving explicit limits on role attribution. Known test requests stay distinguished in research results.
- Every new row has collection/classifier provenance; old rows remain interpretable.
- A controlled owner observation remains in storage and is excluded from the intended audience aggregate after marking; deployment/version evidence is recorded.
- Old and new aggregate totals reconcile, and any changed group counts have a revision record or an explicitly versioned read-model explanation.

Article result: a measured before/after of signed-traffic attribution and a concrete explanation of why signed identity did not prove assistant readership. Acceptance does not require increasing or decreasing audience totals.

## Priority 2 — Measure the causes of the edge/beacon discrepancy

Work item: TASK-0120. Reader question: how much disagreement comes from classification, actual browser execution, beacon loss, or eligibility differences?

Implementation and experiment sequence:

1. Build an isolated test route/dataset using the production extraction/classification functions. Exclude test traffic from audience totals. Add synthetic run IDs only to experiment traffic; never reuse them to track ordinary visitors.
2. Record independently known client, driver, network setup, and exact software versions in experiment manifests. Test available real-browser navigation, JavaScript disabled, an explicitly configured beacon blocker, default headless navigation, headless with a browser UA, plain HTTP, and copied browser headers. Add real-device WebView and Redroid when those environments are actually available. Unavailable cells are missing, not inferred results.
3. Pair changes: same browser/network with JS on/off, same headless client with UA changed, and the same client on available normal/cloud networks. Use 10 repeated navigations per available condition as an initial deterministic diagnostic, not a representative accuracy sample. Expand only failures and variable cases.
4. In the experiment dataset distinguish successful response, script execution, beacon attempt, and server receipt. Retain missing and failed attempts in denominators. A received beacon proves receipt of that event, not humanity or reading comprehension. Protect the test endpoint against replay and accidental public-count contamination.
5. Continue production comparison over fixed complete UTC windows using the existing RUM dataset. Add collection success/failure counts with bounded error codes and no per-person identifiers. Do not add a permanent audience-wide beacon as a prerequisite; decide whether a short production calibration is justified after controlled results.
6. Publish the known-input classification matrix, beacon-delivery counts, exclusions, production predicate ablation, and unresolved differences. No universal two-to-one acceptance threshold.

Acceptance evidence:

- A reproducible command and frozen manifest for each available condition, with attempts/successes/failures and exact numerator/denominator definitions.
- Known manual and automated sessions are both tested; no inference of human identity from header presence or JS execution.
- Normal browsing continues to work without the experiment script. Test traffic cannot affect public totals.
- At least one measured result for each available JS-off, blocked-beacon, and headless condition, plus a limitations list for missing environments.
- A decision follows the results: narrow a claim, repair collection, change a classifier rule with counterexamples, or leave the residual unexplained. Do not force a repair merely to complete the article.

Article result: an executed explanation of which mechanisms can produce the 95-versus-14 discrepancy, with demonstrated failures and boundaries. Controlled trials cannot attribute a share of real production traffic to each mechanism without further evidence.

## Additional evidence and collection boundaries

Owner clarification after the initial plan: useful User-Agents, city-level network geolocation, and TLS details should not be discarded merely because they describe a client. They are not automatically a privacy violation. Preserve diagnostic value while limiting collection by purpose, retention, and access. This section supersedes the initial blanket exclusion of raw UA and device-build evidence. It does not change production collection yet.

Use compact fields for routine dashboards and retain bounded request diagnostics where they allow investigations and rule replay. A raw UA supplied the Redroid clue that the existing D1 model could not recover. The diagnostic layer is therefore useful, not redundant. Row-level telemetry is not automatically anonymous.

| Evidence | Store | Purpose and restriction |
|---|---|---|
| Method provenance | Small collection/classifier version IDs | Explain changes without collecting more about clients |
| Claimed engine support | Parsed engine family/version and Fetch Metadata support status | Preserve the actual premise behind the version gate; retain bounded UA in diagnostics to support parser corrections |
| Claimed client form | Browser/WebView/headless/HTTP-client/unknown categories, plus bounded raw UA in request diagnostics | Detect tokens such as Redroid and reproduce classification; do not collapse away useful declared software/build details |
| Network geolocation | ASN/country; city where a concrete investigation needs it | Treat IP-derived city as network geolocation, not a person's location; keep row-level diagnostics private |
| Transport | HTTP/TLS version and cipher where useful to a defined test | Ordinary connection properties are distinct from a persistent client fingerprint; avoid collecting handshake secrets or random values without a specific need |
| Representation negotiation | Small enum: HTML preferred / Markdown preferred / wildcard / other / absent, plus representation served | Existing `accepts_html` merges explicit HTML and wildcard; preserve the distinction without raw headers |
| Navigation/referrer consistency | Derived enum from existing fields | Investigate external referrer with `Sec-Fetch-Site: none`; this is an anomaly, not proof of automation |
| Collection health | Per-time-bucket eligible/recorded/failed counts and bounded error code | Distinguish pipeline loss from audience behavior; no raw exception strings or visitor IDs |
| Verified client identity | Verification status plus a bounded, documented public service identity where available | Separate verification from purpose; avoid exposing arbitrary signer hostnames as a public personal identifier |
| Experimental execution stages | Short-lived run ID for synthetic/author-operated tests; stage counts | Identify where beacons disappear without a stable audience identifier |

Prefer deriving anomalies from fields already stored before adding fields, but retain enough source evidence to correct a bad parser or rule. For ordinary request diagnostics, preserve bounded UA and relevant protocol headers. Exclude authorization/cookies, secrets, form contents, unrestricted query strings, and full referrers that could contain private data. Do not assume an arbitrary client-supplied header is safe merely because its name is User-Agent: bound it and keep it out of public exports without inspection. Existing D1 raw-IP exclusion stays; vendor-IP checks can operate transiently and store the result and source-list version.

Do not introduce canvas/font probing, cross-site tracking, or cross-day person identifiers for this work. TLS version/cipher is different from building a stable identity using JA3/JA4 or other fingerprints; the latter is outside these two tasks. The existing daily HMAC is pseudonymous and links requests within a day. Neither hashing nor truncation makes all combinations of detailed observations anonymous.

W3C's [Privacy Principles](https://www.w3.org/TR/privacy-principles/) and [fingerprinting guidance](https://www.w3.org/TR/fingerprinting-guidance/), checked September 6 UTC, support minimizing both collected data and exposed identifying detail. These are engineering design references, not a legal certification of the proposed collection.

## Operational logs, disclosure, and retention

The D1 minimization statement does not describe all operational telemetry. In this investigation the Cloudflare invocation log supplied a raw UA, city-level metadata, and TLS details. That difference is not itself a finding of infringement. [Cloudflare documents invocation logs as containing request, response, and related metadata](https://developers.cloudflare.com/workers/observability/logs/workers-logs/). Keep this diagnostic capability; verify supported redaction and retention controls, then make the privacy page distinguish D1, operational logs, and RUM accurately. Do not disable logging or purge historical rows as part of this plan.

Current first-party analytics rows have no automatic expiration, as the privacy page states. Proposed diagnostic retention for this investigation is 14 days, sufficient for the planned calibration window; retain aggregate results and deliberately selected, sanitized experiment captures with the article. Validate volume and cost before choosing the storage implementation. This is a proposal for new diagnostics, not an instruction to delete existing analytics or change Cloudflare retention. Historical aggregate totals remain intact.

## Order and scope

Prepare Priority 1 first, because it repairs the meaning of agent readership. Build the isolated experiment harness next. These are two bounded work items, not a redesign of the analytics platform or ten speculative article outlines. Article prose follows the resulting measurements. Reviewable code, migrations, local validation, privacy text, and an exact deployment plan precede publication or deployment decisions.
