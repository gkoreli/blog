# A matching key is not automatically an admissible key

October 27 Pacific / October 28 UTC. Continues [clock admission](41-verification-clock-admission.md) and [the bounded proof audit](40-bounded-signature-audit.md). Human trials remain deferred. This iteration hardens directory-key admission; it does not identify an operator or authenticate a declared purpose.

## The lost constraint

The verifier checked `use` and the presence of a verification operation, then imported only the public key's `kty`, `crv` and `x` members. That normalization discarded algorithm declarations, duplicate operation entries and other constraints before WebCrypto could examine them. A mathematically valid proof could therefore receive a verified result even when its published key metadata was incompatible or malformed.

The [before matrix](key-metadata-before.json) uses one independently signed proof and varies only directory metadata. In both Node and local workerd, **eight of sixteen cases** verified despite failing the proposed public-key admission policy: incompatible/malformed algorithms, duplicate operations, malformed extractability, a private-key member, inconsistent signature operations, and two orders of conflicting metadata for the same key identity. Six other cases are valid controls; sign-only and encryption-use keys were already rejected, although their reason was the less useful key-not-found. These are selected fixtures, not an observed production attack, affected-row count or population error rate.

## Identity, permission and runtime support answer different questions

[RFC 7638 §3.2](https://www.rfc-editor.org/rfc/rfc7638.html#section-3.2) computes identity from required public-key members. Optional metadata does not change that identity. Our thumbprint helper now follows that separation; a matching thumbprint is followed by a separate admission decision.

[RFC 7517 §4.3](https://www.rfc-editor.org/rfc/rfc7517.html#section-4.3) prohibits duplicate operation values and requires consistency when `use` and `key_ops` coexist. Its [algorithm declaration](https://www.rfc-editor.org/rfc/rfc7517.html#section-4.4) describes the intended algorithm. The application's public-only import profile also requires a Boolean `ext` when present and rejects private-key members. Those profile decisions are explicit; a permissive runtime conversion is not our application policy.

The [Web Cryptography Level 2 draft's Ed25519 import procedure](https://www.w3.org/TR/webcrypto/#ed25519-operations) recognizes both `EdDSA` and `Ed25519` algorithm names. Actual imports differ in the [recorded runtimes](key-metadata-runtime.json): Node 24.14.1 accepts both; workerd 1.20260301.1 accepts `EdDSA` and rejects `Ed25519`. Both reject an incompatible algorithm and duplicate operations. Both coerce the string extractability value used here; workerd rejects the inconsistent-use case while Node imports it. These scoped results matter more than assuming that two implementations behave identically.

The [native capability documentation](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/) establishes API support, not every alias in an installed binary. Level 2 remains a working draft. A pinned workerd source page was unavailable, so no C++ source-line explanation or equivalence with the current production binary is claimed. [Source cross-references](key-metadata-sources.json) preserve those distinctions.

Direct imports inspect one patched JWK. They do not implement directory selection or the duplicate-entry conflict policy; those are separate application results in the matrix.

## Repair

[`webbotauth.ts`](../../../../analytics/src/webbotauth.ts) retains a matching identity even when its metadata is rejected. It reports **key-metadata-rejected / policy-rejected**, rather than pretending the key is absent. Mixed accepted/rejected entries for that identity report **key-metadata-conflict** in either order. An unrelated rejected key does not poison a valid selected identity.

Accepted operation, use and extraction constraints reach native import. The algorithm is first restricted to the two supported names on the fixed Ed25519 curve; only then is the `Ed25519` alias adapted to `EdDSA` for this older workerd import API. This does not erase an incompatible declaration. Unknown optional members remain ignored. Private members never reach import or telemetry.

Imported-key and directory caches now carry public-key policy `2026-10-28.1`; old-policy entries are rechecked. Collection/verifier advance to **2026-10-28.4**. Classifier, signature evidence/coverage/receipt/report schemas, discovery destinations, replay policy, dependencies and optional collection remain unchanged. The offline reconciler accepts the new profile while preserving older profiles.

## What passes—and what remains unknown

[After repair](key-metadata-after.json), both application paths meet all sixteen recorded admission expectations. Direct import differences remain visible rather than being described as agreement. Four regressions bring analytics to **217 tests**; site tests remain **106**, with workspace types, validation and an isolated **32-post build** passing. [Six native collector/D1 controls](key-metadata-storage.json) preserve exact status, reason, outcome and profile in their acknowledged receipts. All six are referral-excluded and have no optional request evidence. The first storage helper incorrectly queried a nonexistent exclusion column; the accepted run checks the actual stored referrer with the active policy evaluator. [Source checks](key-metadata-checks.json) distinguish that setup error and a corrected compile annotation from accepted results.

[The retained Exa replay](key-metadata-retained-exa.json) repeats the earlier two exact chain/storage/directory commitments and verifies both proofs with profile `.4`. Their stored profile remains `.2`, using a directory captured after receipt. No fresh keys, production request or SELECT is used; the replay cannot establish current-profile production persistence or directory contents at receipt time. The earlier `.2` acceptance stays accepted.

All experimental directories are intercepted. No rule, permission, migration, raw-capture activation or human trial occurs. Source delivery and deployment activation require their own receipt. The main article remains unchanged, with this learning linked through its existing research trail.

Expected-operator authorization, human trigger, replay uniqueness, DNS/egress safety and native cryptographic agreement remain open. Duplicate entries whose metadata is admissible but whose validity windows differ still use the existing first-match time policy; this experiment does not prove those semantics order-independent. That is the next bounded test, using the existing independent fixture before proposing a policy. No broad production census is needed for it.


## Delivery checkpoint

[Release metadata](key-metadata-release.json) accepts source `3f32c26`, native Ready in 41 seconds and Worker `58bf641b` at 100% production traffic. Seven bindings retain no optional owner grant, diagnostics or calibration. No new visit, direct production SELECT, tail, preview, rule or permission change occurs. Activation is separate from a production metadata-rejection test; no affected production cohort or new `.4` signed persistence is claimed. The isolated article still has the preceding accepted bytes, without a fresh served-content claim.

Private captures and ephemeral signed fixtures are preserved outside Git in `~/.local/share/gkoreli/analytics-evidence/2026-10-28-directory-key-constraints/` with 0700/0600 permissions and a hash manifest. Five retained replay inputs are hash-linked to the previous archive. October 31 is a review target, not automatic erasure. All owned native test/build/CLI processes have exited. The broader goal remains open; next is the declared duplicate-validity experiment, with human trials still deferred.
