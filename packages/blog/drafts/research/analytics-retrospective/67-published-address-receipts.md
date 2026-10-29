# Preserve published-address facts in the storage receipt

October 29, 2026 UTC. Continues [the five-feed release](66-documented-feed-adapters-and-meta-ads.md). The previous turn changed authoritative state and accepted live evidence: progress. Human-operated trials remain deferred. No retained population is rescanned in this iteration.

## The concrete gap

Research 66's two synthetic requests had exact stored receipts, but their published-address assessments were visible only through a separate D1 readback. The Amzn-SearchBot claim retained its declared AI-search role while the stored address check was not-listed. Inspecting just the receipt hid that distinction. Meta-ExternalAds had no configured method; that is different from a missing assessment or a failed lookup.

[`vendor-ip-receipt.ts`](../../../../analytics/src/vendor-ip-receipt.ts) now projects the network evidence already supplied to the insert. Receipt `2026-10-29.1` retains the original method profile and check time, address availability/header/family without an address, declaration/configuration counts, ordered source names, overlapping summary flags and per-source outcomes, failure reasons and feed snapshots. It preserves snapshot digest, collection/validation/freshness times, publisher version and entry count. None of these authenticates an unsigned client name or a human trigger.

The projection uses explicit scalar states for an unrecorded assessment, no checks, missing snapshot and unavailable publisher version. A publisher value that happens to equal `none` is distinguished by its separate availability field. Source order survives map encoding because the four-source request budget depends on evaluation order. Two Ahrefs declarations can still share one source check; configured declaration count is not check count.

The snapshot is made before the insert and emitted after the existing one-row acknowledgement. It is a copy of insert inputs, not an independent readback or new verification verdict. Collection `2026-10-29.3` versions this logging contract. Classifier, verifier, IP method, public report/cache, schema, raw-capture settings and runtime dependencies remain unchanged. No historical receipt or classification is rewritten.

## Borrow the data-model discipline, test the actual exporter

[OpenTelemetry's log model](https://opentelemetry.io/docs/specs/otel/logs/data-model/) separates event and observation timestamps, correlation context and attributes; it calls for meaningful mappings between formats. Its [common specification](https://opentelemetry.io/docs/specs/otel/common/) treats nulls, zero and empty arrays as meaningful, while discussing lossy representations and exporter limitations. This supports preserving semantics; it does not explain Cloudflare's earlier omissions or certify this encoding.

The [Collector implementation at commit `adbedb4`](https://github.com/open-telemetry/opentelemetry-collector/blob/adbedb4fd801bee1dfc20f06bdaf845239145478/pdata/plog/generated_logrecord.go) exposes reference-backed attributes, `CopyTo` and a dropped-attribute count. The useful ideas are explicit copying and accounting for loss. We add no OpenTelemetry dependency and invent no dropped-field count for Cloudflare. Our tests mutate nested inputs after projection to check snapshot isolation.

[Cloudflare's logging guidance](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) recommends structured JSON for indexed fields and documents head sampling, retention and truncation. These limits mean a missing log is not proof that an event was never stored. Application receipt equality, provider export fidelity and population completeness remain different questions. [Source captures](network-receipt-sources.json) record HTTP results, digests and the pinned Collector commit. An initial guessed structured-logging URL and two guessed source paths were unavailable; the cited successful sources replace them.

## Native and historical acceptance

[Before/after controls](network-receipt-native.json) run baseline `697c8a7` and current code through actual local workerd, collector and D1 with intercepted fixture feeds and explicitly supplied edge context. Fourteen pairs cover no declaration, unconfigured Meta, listed/nonlisted, timeout, HTTP failure, relay exclusion, wrong media type, malformed feed, cooldown, shared Ahrefs, owner/referral exclusion and mixed-source budget exhaustion. All fourteen current receipts agree with their exact stored network evidence. Their other receipt fields, public totals, kind counts and network summaries agree with the baseline. Four clock fields are excluded only from the before/after network comparison; exact receipt/storage comparison excludes none.

Fourteen constructed live/retained pairs test export reconciliation, not actual provider ingestion. The largest receipt in this fixture cohort is 2,801 bytes; this is not a universal maximum. The unchanged exact two-reference SQL passes native D1 and uses a primary-key plan. Normal native controls add fixture rows; they are not production writes.

The existing acknowledgement harness passes 29 trials with 24 success receipts, including real local cryptography, optional diagnostic failure and ambiguous acknowledgements. Negative acknowledgement can still accompany a stored row. A missing success receipt remains insufficient to prove no write.

[Two archived live Research 66 receipts](network-receipt-legacy.json) re-project exactly under their recorded `.28.2` receipt format; no network child is synthesized. Current comparison validates stored network consistency through the existing report SQL and rejects missing/unknown/contradictory facts. This shared validator is not an independent address oracle. Known older receipt projections keep their original fields, signer-display conventions and source scopes. The invocation analyzer recognizes the new version as an observed receipt, with proof/field acceptance still separate.

Fresh checks pass: **273 analytics tests, 117 site tests, workspace types, 21 Markdown validations and an isolated 32-post build**. One initial test expectation still named the prior collection version and was corrected. Initial local native/build launches were blocked by sandbox socket permissions; the authorized local reruns passed. The article adds eleven words, reaching **1,358 words/31 prompts**, while keeping its problem and limits intact.

## Delivery and remaining work

[Release evidence](network-receipt-release.json) separates source publication, activation and production measurement. Local acceptance does not establish deployed behavior. The next check is exact source/version attribution followed by two labelled, referral-excluded synthetic controls and a native-tested exact-reference readback. Human trials remain deferred. Genuine newest-profile signed proof chains, request-level native-verifier agreement, R1 attribution and applicable privacy decisions remain open in [the goal audit](current-goal-audit.json).

The frozen private source/native archive contains 39 captured files plus its manifest, with 0700/0600 modes. Manifest SHA-256: `b70294888842fcf8b35272d0872f4fe04362c2ad0f41bbffa1f5a89d4166e2f0`. October 31 is a review date, not automatic deletion. Later activation and live evidence will use a separate archive.
