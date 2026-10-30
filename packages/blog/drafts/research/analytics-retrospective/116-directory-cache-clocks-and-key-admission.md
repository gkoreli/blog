# A fresh key directory can contain an expired proof

October 30, 2026 UTC. Continues [Research 115](115-offline-directory-response-profiles.md). The previous goal turn made progress through commit `d6f698e`; the owner has resumed the full goal. This experiment asks whether the directory audit can become a truthful, affordable runtime advisory. It remains outside the collector.

## Three clocks, not one

Our request verifier caches HTTPS-discovered keys using directory cache policy and a local cap. The directory possession signature has its own `created`/`expires`; a published key can separately have custom `nbf`/`exp`. An HTTP-fresh cached key set does not make every associated assertion current. [RFC 9111 §4.2](https://www.rfc-editor.org/rfc/rfc9111.html#section-4.2) defines HTTP freshness; [RFC 9421 §2.3](https://www.rfc-editor.org/rfc/rfc9421.html#section-2.3) defines signature parameters. Neither authenticates readership or purpose.

A bounded review found three adoption hazards: the audit exported no next time transition; it admitted a reviewed public demonstration key that our request verifier rejects; and duplicate entries repeated expensive key work. The review supplied hypotheses, not independent validation. We reproduced them with [19 frozen conditions](../../../scripts/check-directory-response-cache.mjs) across ten synthetic scenarios, recording exact Node/local-workerd results and pass-through WebCrypto counters. [Receipt](directory-cache-clocks-audit.json).

| Fixed input / decision | Observed result |
| --- | --- |
| Directory HTTP lifetime 3,600 seconds; possession proof expires after 5 seconds | Authority count 2 at expiry; 0 one millisecond later |
| Future proof becomes active at +5 seconds | Authority count changes 0 → 2 without changing directory bytes |
| One key reaches its `exp`, or reaches its `nbf` | Admitted/verified denominator changes independently of HTTP/proof lifetime |
| Two proofs have different expiry times | Authority count changes 2 → 1 → 0 |

Applying a hypothetical HTTP-only memo policy to these actual recorded-time audits produces stale results at **8 of 19 decision points**. A policy model that also respects the next known transition, retains input identity, and refuses partial/not-assessed reuse has **zero stale results in this sample**: 17 reassessments/two reuses. These are deliberately selected boundary cases, not a traffic error rate, benchmark of cache effectiveness, or a deployed cache. HTTP freshness was a supplied one-hour model input; no HTTP cache implementation or conditional fetch was tested.

## Repairs delivered in audit `.30.2`

The [adapter](../../../../analytics/src/directory-response-audit.ts) now returns the supplied assessment time, next known reassessment boundary, and the reviewed public-key policy version. It tracks future proof activation/expiry and key validity transitions. Signature expiry is inclusive at our zero-skew recorded clock, so its next millisecond is the reassessment point; key `exp` admission ends at the boundary. Null means no known representable transition, never unlimited validity. Partial/unsupported snapshots still cannot support reuse. A caller must separately establish transport freshness, input/cache identity and policy compatibility.

The [RFC 8032 §7.1](https://www.rfc-editor.org/rfc/rfc8032.html#section-7.1) / [RFC 8037 Appendix A](https://www.rfc-editor.org/rfc/rfc8037.html#appendix-A) example publishes both key material and its private seed. Anyone can sign with it. Our old offline audit returned one admitted/authority key for that fixture; the existing incoming-request verifier correctly rejected `known-test-key`. The repaired adapter applies the same reviewed demonstration-material policy, reports its rejected-entry count/reason, and admits zero keys. This is policy rejection, not failed cryptography. The independent pinned RFC library verifies the fixture's signature and authority coverage, as expected. That distinction prevents a mathematically valid public example from becoming trusted identity evidence. The reviewed list is not a complete detector of weak or compromised keys.

Per-audit thumbprint/import deduplication preserves every entry's metadata and validity checks. A later forbidden or conflicting duplicate still rejects that key identity.

| Synthetic directory | Before digest/import/verify calls | After |
| --- | --- | --- |
| 128 copies of one key; one proof | 128 / 128 / 1 | 1 / 1 / 1 |
| Same duplicates; both proof fields absent | 128 / 128 / 0 | 1 / 1 / 0 |
| 128 distinct keys; two proofs | 128 / 128 / 2 | 128 / 128 / 2 |

Counters wrap and call the actual cryptographic methods unchanged, are restored in `finally`, and produce identical results to uninstrumented calls. Before/after inputs have the same SHA-256; 18 common results remain identical after projecting version/new facts. The demonstration-key admission is the one deliberate repair. These are operation counts, not CPU, latency, provider charges or production prevalence. The distinct-key case shows why we cannot extrapolate the duplicate improvement to every directory; absence still requires admission work in this audit.

## Borrowed implementation lessons

We inspected immutable [`jose` source](https://github.com/panva/jose/blob/5a6a5b63bf970bea89f0aa2e5f7eb322e6962ae1/src/jwks/remote.ts), package version 6.2.14/MIT. Its remote JWKS implementation separates maximum cache age from unknown-key cooldown, tracks update timestamps, and guards against older reloads replacing newer state. It also treats pending fetch reuse specially in Cloudflare Workers because cross-request asynchronous work is not automatically reliable. Those are useful design mechanisms; this was source inspection, not execution or evidence that our current request cache fails. A JWKS cache alone does not implement Web Bot Auth response possession.

The next implementation gate is a local native concurrency/cancellation experiment: within-request and cross-request misses, late completion, cold/warm keys and optional advisory failure must preserve request verification and explicit unknowns. We should not copy a pending-promise strategy into the new advisory without testing those conditions.

## Checks and boundaries

All **328 analytics tests**, workspace typechecks and 19 exact before/after Node/workerd comparisons pass. Fifteen independently specified temporal expectations cover positive expiry, negative activation and mixed deadlines; four corrupted receipt/input/count controls are rejected. The reference wrapper rechecks 18 pinned source files. Its new clock matrix performs 102 semantic checks: 96 match and six explicit key-validity/demonstration-admission differences remain; zero unexplained. The separate established 35-case regression remains 183 matches/twelve documented differences across 195 checks. Datasets stay separate; these are not population accuracy measurements.

The minified analytics entry is still exactly 220,746 bytes, SHA-256 `8c42b505bca70cc7503d1e1a08558b6a34a52a9246817ce22232f3b01f0fda39`, matching Research 115's local bundle. No production request, D1 statement, fresh vendor directory capture, dependency, schema/report/collector policy or article change. Three bounded public source reads resolve/capture the immutable jose revision and package metadata; vendor documentation/RFC web reads are separate. Raw inputs, source captures, receipts and checks are privately archived. Code and local acceptance do not establish deployment activation or current production behavior.

The [machine receipt](directory-cache-clocks-audit.json), [counter harness](../../../scripts/check-directory-response-cache.mjs), [policy comparison](../../../scripts/summarize-directory-cache-experiment.mjs) and [unit expectations](../../../../analytics/test/directory-response-audit.test.mjs) make the decision inspectable. Keep the adapter offline while testing the runtime/cache boundary. The full goal remains active and incomplete; native-provider, human/device, discovery, source-purpose and privacy evidence retain their separate requirements. The retrospective stays short, with these details in its research trail.
