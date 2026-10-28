# Nonce presence is not replay detection

October 27 Pacific / October 28 UTC. Continues [the three exact vendor chains](49-current-verifier-vendor-evidence.md). The previous iteration was progress: current-verifier persistence and independent signature checks are accepted for that selected cohort. Human trials remain deferred.

## Separate the questions

A valid signature can accompany several requests. A changed unsigned path does not create a different signed proof. A new nonce does not establish a new human action. Conversely, seeing the same signed token twice does not distinguish an attack, a retry, intentional reuse or a duplicated log export.

[RFC 9421 §7.2.2](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.2) separates sufficient component coverage, nonce-based detection and time limits. The active [Web Bot Auth working-group draft, revision 00 §5.2.3 and Appendix C.6](https://www.ietf.org/archive/id/draft-ietf-webbotauth-httpsig-protocol-00.txt) adds no nonce requirement beyond the RFC. It treats enforcement as deployment policy requiring an atomic check across its intended scope. It remains work in progress. The initial individual-revision-02 capture is preserved, but Datatracker shows it was replaced by the active working-group revision 00, published September 1, 2026. We checked the replay claims against that active revision before publication.

The [pyauth maintainer docs](https://pyauth.github.io/http-message-signatures/) return signed nonce metadata but assign replay detection to the caller. We execute the [pinned source](complete-audit-sources.json), not an assumed named release or API inferred from the live documentation. Our existing attribution test already accepted repeated nonces. Repeating that test alone would add no capability.

## New bounded diagnostic capability

[`webbotauth-reuse-audit`](../../../../analytics/src/webbotauth-reuse-audit.ts) examines a supplied cohort offline. It is exported as a separate package submodule and is not imported by the collector. It uses the existing verifier at each observation's recorded time with an explicit resolver transport.

The audit requires exact private request references from its evidence adapter. All copies of a repeated reference are excluded from distinct-observation assessment and counted explicitly. It does not deduplicate ambiguous evidence into an apparently clean dataset.

After cryptographic verification, transient digests compare the publisher, key, canonical signed base and signature bytes. Outer labels and unsigned headers do not change proof identity. Nonce comparisons use publisher and decoded Ed25519 key bytes: the same nonce text under another key or publisher is not merged. Two JWK spellings admitted by our resolver can share key bytes while producing different RFC thumbprints. The audit normalizes that material, so those aliases cannot split a nonce group. This does not claim both spellings conform to the JWK encoding specification. Multiple valid proofs in one observation stay separate from multiple observations. Changes in method, URL or User-Agent within a repeated-proof group are counted without exposing those values.

Digests, references, nonces, signatures and URLs are absent from the returned summary. The working maps have no persistence. The result records its scope and `enforcement: none`; it cannot serve as a global replay-prevention verdict.

Defaults are 64 observations, eight candidates per observation, a two-second overall deadline, a one-day maximum age and a 32,768-unit signature-header budget. Over-limit cohorts are not assessed. Candidate limits, unpaired context, missing/duplicate references, unavailable verification and deadline expiry remain explicit. Partial counts are lower bounds; unexamined context is not a measured absence of reuse. Transport receives an abort signal; this cannot force a caller-supplied transport to cooperate.

## Executed controls

The [native local workerd receipt](proof-reuse-native.json) accepts thirteen cohorts using independently constructed Ed25519 signing bytes and intercepted directories:

| Condition | Observed distinction |
|---|---|
| Same proof, changed outer label and unsigned path/UA | Two distinct references; one repeated proof group; changed context recorded |
| Different proofs, same publisher/key/nonce | One nonce group spanning different proofs |
| Same nonce text, different publisher or key | Separate scopes; no repeated nonce group |
| Same key bytes, different admitted JWK encoding/key ID | Two proofs; one repeated nonce group |
| Two copies of one request reference | Two ambiguous records; neither becomes a second observation |
| One valid and one altered-host signature | One valid proof; invalid signature adds no reuse |
| Repeated proof with no nonce | Proof reuse recorded; missing nonces do not form a nonce group |
| Two valid proofs in one observation | Two proofs, one observation; no cross-observation reuse |
| Observation/candidate budgets, unavailable keys, stalled resolver | Not-assessed or partial results; unresolved counts retained; deadline abort observed |

The [independent reference](proof-reuse-reference.json) rechecks eighteen pinned source files and verifies eighteen fixture message occurrences: sixteen single-proof successes, one two-proof success and one invalid-signature exception. Those inputs include the duplicated export records. Their signatures are valid; their references still fail our observation-identity gate. This compares cryptographic outcomes, not an independently implemented cohort-grouping algorithm. No network, D1 statement, production visit or human label is involved.

## What the retained vendor cohort shows

The [retained analysis](proof-reuse-retained.json) reuses the exact three request/receipt/D1 chains and later-captured directory bytes from research 49. The [adapter](analyze-retained-proof-reuse.mjs) checks the committed query hash, exact receipt projections, complete native chains and reviewed directory commitments before invoking the new audit. This adds no production query or visit.

All three proofs verify at their recorded times. All have nonempty signed nonce strings. There are **three distinct proofs and three publisher/key-scoped nonce values**, with **zero repeated proof or nonce groups in this selected three-request cohort**. No comparison is unresolved. This does not estimate replay prevalence or establish unique actions. Those limits also apply to distinct signatures, provider request references and operation IDs.

## Delivery and remaining work

This adds a diagnostic capability, not a production nonce ledger, classifier repair, count adjustment or expanded collection mode. The verifier, collection and report profiles stay unchanged. The generated Worker JavaScript is byte-identical to the baseline; new diagnostic code is excluded from the collector bundle. The retrospective replaces one sentence with the nonce/unique-action distinction and links this record, staying within its six-minute target.

[Checks](proof-reuse-checks.json) record 231 passing analytics tests, workspace types, native controls, independent reference calls, isolated publication build and source/Worker commitments. An initial fixture omitted the required directory media type and failed locally; correcting its transport made the intended signature cases pass. The first native invocation was blocked by the sandbox's loopback socket restriction; the authorized local retry succeeded. Neither failure is production evidence.

Production replay enforcement remains unimplemented. A per-isolate map would not prove global prevention. Before any shared nonce store, define scope, atomicity, availability behavior, admission bounds, expiry including clock skew, retention and metered cost. It must not silently collapse eligible deliveries into unique-action counts.

Next bounded research: audit the verifier's signed-parameter type and freshness admission against the pinned RFC/library source, using independent malformed-input and boundary controls. Broader human/device accuracy, R1 attribution, retained-history deltas, native verification agreement and privacy/retention decisions remain open under [the original-goal audit](45-goal-and-method-coverage-audit.md). Human trials stay deferred. Source push, activation and served-article acceptance are recorded separately.
