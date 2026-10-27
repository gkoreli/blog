# An unavailable field must survive the export

October 27, 2026 UTC. The [storage-receipt release](27-observation-storage-receipts.md) accepted a real unsigned request in Wrangler's live tail. Retained inspection found a different representation of the same receipt. This iteration preserves explicit absence/unknown states across that boundary without changing classification, database evidence or collection scope.

## The observed difference

A structured Workers Logs query for `receipt.signature.outcome = "verified"`, over the displayed Last 1 hour selection, returned zero events. The same field with `absent` returned six, validating the field search against a positive case. The UI warns that events can take two minutes to appear and retains its pricing/sampling warning. This establishes no complete denominator or absence of signed traffic.

The structured-filter export contains exactly those six storage logs, 10,964 bytes, SHA-256 `26b6a57e79be53c9e8d88e12fd275907dc35c731df231067785c1bd6e728b09b`. Unlike the [earlier full-text query/export](26-organic-exa-and-join-boundaries.md), this export matches the displayed count. Do not generalize the earlier discrepancy into a claim that exports always ignore filters. Filtering storage messages also excludes their related invocation/attempt records; it does not supply their request context automatically.

Three records match the prior live tail by their existing operation reference, exact log timestamp, collection version and receipt version. In **each matched copy**, the retained export omits **seven null fields and two empty arrays** present in the live record. All shared known fields agree. [Closed comparison](receipt-v1-export-comparison.json), [maintained comparer](compare-receipt-captures.mjs).

| Omitted receipt field | Original live value |
|---|---|
| Signature signer, reason, signed-UA status and coverage | null |
| Native verified-bot, signed-agent and category value | null |
| Declaration candidates and verification reasons | empty arrays |

Those are 21 omitted nulls and six omitted arrays across three operations, not 27 missing requests. The six retained verdicts are two Browser, one Other bot, one Cloud browser and two Unresolved. Three are the known control/article/privacy checks. The remaining three are not accepted operator labels; their request context was not in this filtered export. None has a reviewed client declaration or a verified signature outcome. Do not turn those kinds or missing fields into identities, humans or exact purposes.

**The evidence locates a difference between live records and a retained export. It does not identify the responsible ingestion, storage, API, UI or export stage.** Primary docs recommend structured logging and explain queries, but do not establish byte-for-byte round-trip preservation of these values. Historical receipt `.1` and database JSON remain unchanged.

## Encoding explicit states

Receipt **2026-10-27.2** uses nonempty scalar values in nested objects:

| Fact | Encoding |
|---|---|
| Native booleans and signed-UA coverage status | `true`, `false`, `unavailable` strings; unavailable never becomes false |
| No authenticated signer, reason or category value | `none`, alongside the separate outcome/category status |
| Declaration/reason sets | Zero or positive count and sorted comma-separated reviewed names, or `none` for zero |
| Component coverage | Explicit `unavailable` status, or `recorded` with actual boolean flags and replay policy |
| Injected verifier profile | `not-applicable`, with the separate test-injected source/outcome |

No null, empty string or array is emitted by this receipt version. Counts and names preserve conflicts rather than selecting one client. Catalogue tests reject the delimiter or sentinel in canonical names/reasons. These are transformed representations of already-stored facts, not additional raw collection. The receipt snapshot still precedes binding and emits only after the existing one-row acknowledgement. D1 arrays/nulls, collection `.8`, classifier `.5`, verifier `.6`, signature evidence `.4` and report/cache semantics remain unchanged. Receipt version changes independently because only its log encoding changes.

## Checks and source basis

[Native local evidence](scalar-receipt-local.json), reproduced by [the updated collector helper](../../../scripts/check-observation-receipt.mjs), runs fifteen controlled cases through workerd/D1/crypto: twelve stored rows and ten accepted receipts. It compares transformed facts with actual stored evidence, checks all receipt leaves are scalar/nonempty, and covers absent signals, conflicting Exa roles, real fixture crypto, changed coverage, directory timeout, injected verification, write/acknowledgement uncertainty and optional diagnostic failure. The largest receipt in these fixtures is 802 bytes; it is not a global maximum or a production-cost forecast. Fixture keys/directories/provider metadata are substituted, not real vendor/native verification.

The omission-model test removes only the nulls and empty arrays observed above; it is not an emulator of Cloudflare's entire pipeline. Four comparison tests reject incomplete tail JSON, duplicate/ambiguous operation matches, same-time nonmatches, profile/time/version mismatches, unknown versions and incomplete live schemas. They also ensure missing scalar evidence remains a reported difference. Comparison output contains fixed known field names and counts, not raw values or identifiers. Accepted equality is scoped to known receipt fields, not arbitrary log contents or provider authentication.

| Primary source | What it supports |
|---|---|
| [Cloudflare Query Builder](https://developers.cloudflare.com/workers/observability/query-builder/) | Structured field filters differ from text search. Events returns matching events; Invocations groups context. Counts describe log records. Scalar fields support querying; no complete-export fidelity guarantee follows. |
| [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) | Structured object logging exposes indexed fields. Our original implementation followed that capability; observed loss still requires testing the retained representation. |
| [Native real-time logs](https://developers.cloudflare.com/workers/observability/logs/real-time-logs/) | Wrangler supplies invocation context and console messages for a prospective comparison; it can drop messages and does not persist the source. |
| [Workers Observability REST query schema](https://developers.cloudflare.com/api/resources/workers/subresources/observability/subresources/telemetry/methods/query/) | Keys/values and typed filters support explicit dimensions. Its existence/null operators do not prove where this specific export omitted values. No new API credential or permission is needed for the existing signed-in UI. |

Source checks pass 168 analytics tests, 106 site tests, workspace types and an isolated 32-post build. The article links the concrete omission lesson at 1,250 words and preserves 31 shaping messages. The first build command used the wrong entry-point directory and failed before generation; the corrected isolated build is the accepted one. No shared development output was built into.

Next acceptance: publish the checked source, verify activation, capture two referral-marked automated controls in Wrangler tail, then export their structured receipt `.2` records and compare the same operations. One control has no reviewed declaration; the other deliberately claims both ExaSearchBot and ExaUser, without a signature. It is our synthetic conflict control, not Exa. This log-format experiment needs no production SELECT or diagnostic/trial binding. Keep fresh signed-vendor/native and human/device acceptance open; human trials remain deferred.

Raw copies and UI captures stay in the restricted `2026-10-27-receipt-fidelity` archive with an October 31 investigation-copy review. The original tail remains in its existing restricted receipt archive. No automatic deletion, provider-wide erasure or lawful-basis conclusion follows. Explicit log states improve interpretability, not population accuracy or proof of a human trigger.
