# Offline access evidence

`@gkoreli/analytics/access-evidence` exports `analyzeAccessEvidence(input: unknown)`, `ACCESS_EVIDENCE_VERSION`, `ACCESS_EVIDENCE_PROFILE` and `ACCESS_EVIDENCE_MAX_BYTES`. It has no transport, collector or calibration side effects. Use it to reconcile a bounded set of controlled attempts with saved response, security and collector evidence. It cannot estimate all blocked readership.

The input is strict JSON: unknown fields reject the whole input. Maximum serialized UTF-8 size is 256 KiB; at most 32 attempts, 128 security records and 32 collector records per attempt. Duplicate references reject within each record family; collector references must also be distinct across attempts. Local references do not prove unique underlying provider events.

```ts
import { analyzeAccessEvidence } from '@gkoreli/analytics/access-evidence';
const report = analyzeAccessEvidence(savedInput);
```

## Input contract

Envelope: `{ version: "access-evidence-v1", provenance: "saved-control" | "synthetic", attempts: [], securityRecords: [] }`.

Each attempt requires:

| Field | Value |
| --- | --- |
| `reference` | Nonempty opaque reference, at most 128 characters |
| `executed` | Boolean; unexecuted plans cannot carry response, collector or operator evidence |
| `declaredOperator` | `automation`, `human-reported` or `unconfirmed`; never inferred from headers |
| `labelSource` | `controlled-client-receipt`, `agent-controller`, `human-attestation` or `unconfirmed` |
| `context` | Exact `{ method, host, path, query }`; uppercase method, lowercase DNS host, serialized absolute path, query without a leading `?` |
| `startInclusive`, `endExclusive` | UTC instants, whole seconds or exactly three fractional digits; positive half-open window of at most 60 seconds |
| `timingBasis` | `execution-window` or `receipt-second-window`; the latter requires an aligned one-second window and a response |
| `response` | `null` or `{ status, receivedAt, ray }`; status 100–599, instant inside the window, Ray `null` or 16 lowercase hex digits without the data-center suffix |
| `collector` | `null` or `{ scope, state, records }`; scope is a nonempty private reference to the supplied lookup conditions; state is `complete`, `partial` or `unavailable` |

A controlled receipt can support either an automation or human-reported declaration. `agent-controller` must pair with automation; `human-attestation` with human-reported; `unconfirmed` with unconfirmed. The caller must establish these declarations independently. This module does not authenticate them.

Collector records require `{ reference, kind, collection, classifier }`: kind is a string or null; method stamps are valid calendar-date `YYYY-MM-DD.N` strings (one to six counter digits) or null. Unknown kinds become `unrecognized`, missing kinds `not-recorded`. Syntactic method stamps remain separate from authenticated deployed semantics. An unavailable lookup cannot supply records. Partial lookups may supply records without claiming completeness. Only a declared complete scope with no records becomes `complete-empty`; that is not proof of absent Worker invocation or global storage absence.

Each security record requires `{ reference, context, datetime, ray, action, source, ruleId, sampleInterval }`. Context and Ray follow the attempt rules; `datetime` is UTC at whole-second precision. Provider action/source/rule strings may be empty but are limited to 128 characters; `sampleInterval` is null or a positive safe integer. These are minimized projections, not raw provider exports. Do not pass UA, IP, credentials, metadata or arbitrary provider fields.

## Joining and interpreting the output

A security record can join only to an executed attempt with the same response Ray, exact request context, and an overlapping provider second/window. Two candidate attempts leave it ambiguous and unallocated. Several records may join one attempt. Same-Ray context disagreement within the time window stays separate from out-of-window Ray reuse. There is no tolerance expansion, URL decoding, suffix stripping or path/query normalization.

The report numbers attempts and security records in input order; retain the private input to map ordinals back to evidence. It omits references, context, Rays and arbitrary provider labels. It retains allowlisted operator/provenance states, response status, supplied-record counts, stored kinds, syntactic method history and lookup availability. An exact `source=bic` / `ruleId=bic` pair is reported as BIC; other combinations are `not-established`. Empty action is `not-recorded`. Sample intervals are retained without multiplying counts. Repeated identical security facts are surfaced without deduplication. Differences in omitted native fields cannot be recovered.

Totals have separate denominators: planned/executed attempts, received responses, supplied security records, attempts with assigned records, lookup availability and supplied collector records. Ambiguous records never become assigned records. `unknownCollectorAttempts` counts executed attempts with no supplied or unavailable lookup; partial lookups have their own counter. Zero supplied collector records alongside an unknown lookup remains unknown. No rate of human accuracy, unique visitors, demand, successful article delivery, reading or useful agent work follows from these counts. A block paired with 2xx or collector rows produces a warning, not an invented explanation.

Cloudflare documents [non-unique Ray IDs](https://developers.cloudflare.com/fundamentals/reference/cloudflare-ray-id/) and [multiple/sampled security events](https://developers.cloudflare.com/waf/analytics/security-events/). The [actual BIC replay and acceptance](../blog/drafts/research/discovery-experiment-02/04-offline-access-ledger.md) owns the dated evidence. BIC is not an RFC9421 verdict. The existing calibration evaluator remains independent.
