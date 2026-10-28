# Compatibility must not erase why verification failed

October 27 Pacific / October 28 UTC. Continues [key validity and cache boundaries](43-key-validity-and-cache-boundaries.md). Human trials remain deferred. This iteration corrects failure evidence; it does not add a supported wire format or authenticate another vendor.

## The format already worked; the errors did not

The verifier supports dictionary, quoted-string and legacy bare-URI Signature-Agent values. Independently signed positive controls verify in all three forms. But after a bare-URI verification failed, a fallback replaced the underlying cause with `bare-uri-signature-agent`, classified unsupported. An invalid signature, expired proof, unavailable directory and rejected key metadata could therefore look like the same format limitation. Mixed candidate failures lost their reason set as well.

[The before capture](wire-failures-before.json) covers **three forms × fourteen scenarios × three APIs per runtime**: 42 cases and 126 API paths in both Node and local workerd, plus input inspection. Eleven bare-URI default-path cases disagree with their scenario's expected reason; positive controls and the corresponding dictionary/quoted-string results expose the inconsistency. These are controlled fixtures, not production prevalence or vendor accuracy measurements.

## Keep message syntax, cryptographic result and policy separate

[RFC 9421 §2.1](https://www.rfc-editor.org/rfc/rfc9421.html#section-2.1) defines signature-base construction from fields; [§3.2](https://www.rfc-editor.org/rfc/rfc9421.html#section-3.2) defines verification against application requirements. The [current WG draft §5.2.1](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00#section-5.2.1) specifies a dictionary Signature-Agent. Our compatibility forms remain a local extension, not proof of full draft conformance. If an application deliberately rejects a format, it should do that consistently. A format this profile already accepts must not replace a later error with a format rejection.

The [independent Python comparison](wire-failures-reference.json) executes the previously pinned library, after rechecking eighteen source hashes against [its manifest](complete-audit-sources.json). Three valid proofs verify and their three covered-field mutations fail. Eighteen calls cover tagged-set and explicit-label selection, including absent-label failures. This is generic RFC message verification; the library does not supply our directory policy or Web Bot Auth wire parsing. [Its error-handling documentation](https://pyauth.github.io/http-message-signatures/#error-handling) and primary source preserve exceptions, while our telemetry keeps closed reason codes and never copies arbitrary exception messages. No dependency is added.

## Repair and measured effect

The default, selected-proof and inspection paths now preserve malformed-field, no-eligible-tag and actual candidate results. Default multi-candidate failures retain their sorted reason set. The audit can count profile negatives, unavailable keys/directories and unsupported algorithms in their proper buckets. An unresolved mixture stays indeterminate; a negative cryptographic result remains distinct from unavailable verification.

[After repair](wire-failures-after.json), all 126 API paths per runtime meet the recorded expectations. [The comparison summary](wire-failures-delta.json) separates reason/outcome changes from unchanged acceptance. Successful proof coverage still records the observed form. The old fallback code remains readable for historical stored evidence; existing rows are not rewritten or retrospectively assigned an underlying cause we did not retain. Negative wire form itself is not newly collected by this repair.

Three new regressions and the corrected captured bare-URI regression yield **224 analytics tests**. Site **106 tests**, workspace types, validation and an isolated **32-post build** pass. [Eight native collector/D1 controls](wire-failures-storage.json) preserve exact status/reason/outcome/profile and reason-count/name receipts, including the mixed-failure set. All are referral-excluded with optional request evidence absent. The shared storage helper's existing [metadata](wire-failures-metadata-compatibility.json) and [validity](wire-failures-validity-compatibility.json) modes each retain six passing controls. [Source checks](wire-failures-checks.json) record hashes and scope.

The two earlier exact-linked [Exa proofs still replay](wire-failures-retained-exa.json) under verifier `.6`, using the same later-captured directory. Their stored profile remains `.2`. This supplies compatibility evidence, not new-profile production persistence, receipt-time keys or a fresh vendor action. Collection/verifier advance to **2026-10-28.6**; classifier, key-admission policy, evidence/coverage/receipt/report schemas, discovery, trust registry, dependencies and replay policy remain unchanged. Optional capture and human trials remain off/deferred. The main article stays unchanged and links this learning through its existing research trail.

## Separate production acceptance

After checked delivery and activation, the planned live acceptance is one excluded scripted `/privacy` request with a bare-URI Signature-Agent and an invalid Structured Field signature. Its expected result is malformed-signature-fields, before directory discovery. It is valid HTTP transport, not an HTTP parser attack or a vendor-signed request. No human label, actual vendor action or public-view count is inferred.

[The exact-reference SQL](wire-failure-storage-reference.sql) has only a primary-key predicate, retaining contradictory status/version/path facts. [Native acceptance](wire-failures-query-native.json) preserves neighboring text IDs above JavaScript's safe-integer range, returns contradictory fixture fields and measures one read per statement. The production plan allows one command-mode SELECT after obtaining the actual acknowledged row reference, with a reviewed 100-read post-execution threshold, no broad scan and no quota retry. The threshold is not a database-enforced cap. Delivery, activation, the control and its readback need a separate release receipt before being claimed complete.

Broader purpose/human/native agreement and privacy/retention remain unresolved. After this iteration, re-audit the original goal's requirements and evidence gaps before choosing more protocol fixtures; do not let synthetic conformance work substitute for labelled detection measurements or live evidence.


## Live acceptance checkpoint

[The release receipt](wire-failures-release.json) accepts source `ad18af6`, native Ready in 56 seconds and Worker `e6073f71` at 100% traffic. Seven bindings retain no optional owner grant, diagnostics or calibration. One scripted control returns HTTP 200; its filtered live tail contains one attempt and one acknowledged storage event on that exact Worker. Three ASCII signature fields and the private marker match the native event. This is scoped transport evidence, not general header/Latin-1 fidelity.

The actual outcome is **malformed-signature-fields / invalid**, with no authenticated signer or coverage and no optional request evidence. One command-mode primary-key SELECT returns the exact text reference, with no status/version/path filter hiding contradictions. All **29 closed receipt fields match** the stored projection. The row is referral-excluded. The diagnostic SELECT costs **one metered read / zero writes, changed_db=false** under the reviewed 100-read postcheck; normal collection and provider work are additional. No retry or broad scan occurs. This closes the one-failure live persistence gate, not valid vendor signing, human accuracy, native cryptographic agreement or new-profile organic signed acceptance.

The filtered tail is stopped by targeting its owned process group, and its parent handle reports terminal exit. No preview, rule, permission, migration or human trial is introduced. The main article remains unchanged; its isolated bytes still match the preceding accepted article, without a fresh served-content claim. Private captures and ephemeral fixtures are archived outside Git at `~/.local/share/gkoreli/analytics-evidence/2026-10-28-wire-failure-fidelity/`, with 0700/0600 permissions and a hash manifest; five older replay inputs remain hash-linked. October 31 is a review target, not automatic erasure. The broader goal remains open. Next is the original-goal evidence audit described above.


[Original-goal and method-coverage audit](45-goal-and-method-coverage-audit.md) rechecks the broader requirements, preserves the human-label gap and identifies documented Google-Agent/DuckDuckBot methods as the next bounded implementation. The live one-failure acceptance above remains accepted.
