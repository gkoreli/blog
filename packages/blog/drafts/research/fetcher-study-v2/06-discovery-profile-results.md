# Incoming discovery-profile experiment: unsupported is an outcome

October 31, 2026 UTC. Executes the [frozen design](03-new-experiment-design.md) with 20 synthetic signed inputs; this is new incoming-request research, not a repeat of the earlier directory-response proof experiment. [Exact baseline/final comparison](discovery-profile-comparison.json).

## Finding and repair

The origin-only verifier profile `.31.2` rejects explicit well-known/tenant directory paths before fetching keys and categorizes them as invalid. The new draft's direct-URL discovery shape makes that a capability boundary worth exposing. Candidate `.31.3` retains origin-only discovery and emits `unsupported-signature-agent-location`, mapped to `unsupported`, for otherwise admitted HTTPS DNS URLs with a non-root path. The exhaustive audit then remains partial/exhausted with one unsupported/unresolved candidate; it no longer treats an unassessed new location as an assessed negative.

Five supplied path cases change invalid→unsupported, including an intentionally damaged proof. That damaged proof also remains unassessed cryptographically in the local verifier: unsupported never means valid. Two IP/local path cases change invalid→policy-rejected because host admission now precedes the supported-path check. Every supplied resolver call and verified acceptance stays unchanged. Query/fragment/credentials/scheme/type exclusions retain their local-profile behavior. This repair does not implement full direct URL discovery or claim complete draft conformance.

Baseline and final both execute 20 cases through default verification, explicit-candidate verification and exhaustive audit: 60 API contexts per runtime. The actual Node v24.14.1 and local workerd results match exactly for each source state. Eighteen mathematical positives and two corrupted negatives are independently checked against the fixture's canonical bases using WebCrypto; several positive-math controls deliberately contain malformed/unsafe/profile-incompatible inputs. Mathematical verification is not full protocol validity.

- [Baseline Node/workerd receipt](discovery-profile-baseline-native.json).
- [Final Node/workerd receipt and source hashes](discovery-profile-final-native.json).
- [Actual collector/local D1/report persistence](discovery-persistence-native.json): six controlled incoming requests plus one explicitly historical row; six included report events, one referral-excluded event, one unsupported event, three included policy rejections, one unsigned event and one historical unrecorded event. Optional capture stays off; directory calls remain zero.
- [Fixture generator](../../../../analytics/test/fixtures/discovery-profile.mjs), [regression tests](../../../../analytics/test/discovery-profile.test.mjs) and [native harness](../../../scripts/check-discovery-profile.mjs).

The runtime's 2 KiB signature-evidence bound remains unchanged. The first full suite exposed that adding a long closed reason pushed an artificial complete-failure-set control over budget. A compact closed unknown marker now preserves every known reason without retaining unknown free text or truncating the list. The all-declarations worst-case control is 2045 bytes. Historical stored evidence is untouched. All 392 analytics tests pass.

The public stats cache version is `.31.8`; `.31.2` remains a recognized historical verifier profile. No schema, eligibility, human label, production data or expanded directory fetch policy changes.

## Reproduce in a checkout

With the repository's pinned runtime and installed frozen dependencies, use new absolute output names. The preparation step generates synthetic signing material; execution reuses exactly those bytes and refuses existing output files:

```sh
node packages/blog/scripts/check-discovery-profile.mjs --prepare /absolute/path/new-input.json
node packages/blog/scripts/check-discovery-profile.mjs --run /absolute/path/new-input.json /absolute/path/new-private-result.json /absolute/path/new-public-receipt.json
```

The native runtime needs a permitted local listener. No account, real key endpoint, production Worker or remote database is used. `--node-only` runs the three APIs without native agreement. The public receipt contains only synthetic identifiers, derived results and hashes; never substitute private production headers into this publication harness.

The baseline receipt binds the earlier source hashes and the same frozen input as the final receipt, SHA-256 `9866dc04191aa8b6b4c0d533108600c22d9613b5f71c5027a162ed095ff238ac`. Core source mutation is checked across execution so a concurrent edit cannot silently produce a mixed-source receipt. A future generated fixture has its own keys/hash and is a new run.

## Failed checks retained

- Initial native startup hit a loopback permission error. A permitted run then exposed a harness constant exported as a Worker RPC handler; keeping the profile value internal fixed the harness. These were transport/harness failures, not verifier outcomes.
- The added long failure code exceeded two existing evidence-budget tests. The final compact unknown marker preserves their bounds and all reasons.
- The first collector acceptance reused an archived SQL predicate pinned to `.27.5`, so it selected zero current controls even though storage/report assertions passed. The harness now parameterizes the current profile while leaving the historical SQL file unchanged; the final native run passes.
- The initial article build used an unloaded `http` highlighter; existing `text` fences fit the actual renderer. One existing content test expected present-tense replay wording; its expectation now preserves the dated past-tense correction. These are publication checks, not new measurement results.

## Decision

Keep the narrow resolver and accurate unsupported state. Full direct URL support would require a deliberate identity/cache/publisher migration, including same-origin tenant paths, query semantics and root-resource ambiguity. Its design is separate from evidence that existing clients migrated. Publish the new local finding beside the September reference and the already completed historical improvements. Source delivery, activation and served acceptance remain separate release checks.
