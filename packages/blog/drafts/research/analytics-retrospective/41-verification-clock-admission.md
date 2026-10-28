# A valid proof needs a usable verification clock

October 27 Pacific / October 28 UTC. Follow-up to [the bounded audit](40-bounded-signature-audit.md). Human trials remain deferred by the owner. The two accepted collection/verifier `.2` signed observations remain accepted on their recorded evidence; this experiment does not reopen that result.

## What failed

The default verifier accepted an independently generated Ed25519 proof when its trusted caller supplied `new Date(NaN)`. Comparisons with `NaN` failed to reject an expired key, and the resulting non-finite age serialized as JSON `null`. The selected-proof API already rejected non-finite time with a generic error. The audit rejected an invalid Date but threw for a string clock or a throwing `getTime()` method.

The [before capture](verification-clock-before.json) records **12 cases / 36 API paths**. Three default-path cases verified with unusable clocks, including the expired-key case. Two audit paths threw. Infinity produced misleading expiry/future rejections in the default path rather than admitting that the assessment time was unusable. This is a caller-option defect, not evidence of an HTTP clock bypass or production clock failure. The page collector uses the current Date; no affected production row or prevalence is established.

## What the standard and another implementation teach

[RFC 9421 §3.2.1](https://www.rfc-editor.org/rfc/rfc9421.html#section-3.2.1) separates application requirements from cryptographic success; [§7.2.2](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.2) discusses replay controls. Our freshness/key-validity policy needs a usable time even when the signature math succeeds.

The [pinned Cloudflare reference source](https://github.com/cloudflare/web-bot-auth/blob/e4d3167886d0e7508d55fc5c501f1e498a3d4f5c/packages/http-message-sig/src/core.ts#L1033) explicitly rejects non-finite numeric `policy.now`. The maintained [comparison probe](probe-verification-clock.mjs) executes that actual module: finite time verifies after one key resolution; NaN and Infinity fail with `PolicyViolation` before resolution. This tests its generic numeric-clock API, not every Web Bot Auth wrapper or native Cloudflare service. [Existing source/dependency hashes](reference-components-sources.json) and the module hash in both captures pin the comparison. Browser fetching of the pinned GitHub page failed; the saved, hashed source and actual module execution supply the source evidence. No library or dependency is adopted into production.

## Repair and visibility

A shared [clock admission helper](../../../../analytics/src/verification-clock.ts) reads once, catches clock errors and snapshots a finite, representable Date value. Default and selected-proof verification return the closed reason **`invalid-verification-time`**, classified **indeterminate**, before directory/cache discovery. The audit returns **not-assessed / invalid-options**, with unknown candidate totals and no attempts. No raw clock value or error message enters the result.

Absent signature input still returns absent without requiring a clock in the two verifier APIs. Audit configuration admission deliberately precedes input inspection. These entry-point semantics remain explicit rather than forcing absence into a signature failure. Valid-clock expiry, future-time and expired-key controls retain their existing outcomes. Collection and verifier advance to **2026-10-28.3**; classifier, evidence/coverage/receipt/report schemas, trust, replay policy and optional collection are unchanged. Historical versions remain supported by the offline reconciler.

## Acceptance and limits

[After repair](verification-clock-after.json), all 36 paths complete without throwing; no unusable-clock case verifies or resolves a directory. [Native workerd/WebCrypto](verification-clock-native.json) independently passes the same 12-case/36-path matrix. Three regressions also cover clock reads, closed evidence and absence precedence. **213 analytics tests / 106 site tests**, workspace types and the isolated 32-post build pass. [Nine native collector/D1 controls](verification-clock-collector.json) retain exact receipt/storage agreement; report cost remains 7,665 reads before/after, with zero additional reads in that fixture.

[Source checks](verification-clock-checks.json) separate accepted checks from setup failures: the first native run could not open a sandbox loopback listener, and an initial isolated build ran before the changed sources were copied. Neither is accepted as a repair check. The successful native run and corrected isolated build are recorded separately. All experimental resolver requests are intercepted; there are zero production requests or direct production SELECTs in these tests.

Code delivery, deployment activation and production acceptance remain separate gates. A current `.3` signed production proof is not supplied by local fixtures or the earlier `.2` observations. Human/device accuracy, operator intent, native cryptographic agreement, DNS/egress hardening, broader conformance and collection/retention decisions remain open. The concise article stays unchanged; this detailed learning is linked from its existing research trail. The next bounded action is checked delivery and activation; prospective `.3` signed persistence remains a separate observation to collect without manufacturing vendor or human labels.


## Delivery checkpoint

[Release metadata](verification-clock-release.json) records checked source `eac41e3`, a native Ready build in one minute and Worker `d3b5e223` at 100% traffic. Seven bindings retain no optional owner grant, diagnostics or calibration. This accepts code activation; no invalid caller option is sent to production, no actual production clock failure is reproduced, and no direct production SELECT or new visit is used. The isolated article hash matches the preceding accepted article, with no fresh served-content claim.

Private fixtures, captures and logs are preserved outside Git in `~/.local/share/gkoreli/analytics-evidence/2026-10-28-verification-clock/`, with 0700/0600 permissions and a hash manifest. October 31 is a review target, not automatic erasure. All owned test/build processes have exited; no tail, preview or human trial was started. Next bounded work should audit remaining trust/authorization and conformance assumptions against retained fixtures and primary implementations; a future `.3` signed persistence observation remains a separate gate, without repeating a broad census.


[Directory-key constraint follow-up](42-directory-key-constraints.md) separates matching key identity from admissible metadata and records native import differences. It preserves the clock repair and prior signed-persistence evidence.
