# Directory order and cache warmth must not choose key validity

October 27 Pacific / October 28 UTC. Continues [directory-key constraints](42-directory-key-constraints.md). Human trials remain deferred. The accepted two `.2` signed observations remain accepted; this experiment neither rewrites them nor establishes a new production cohort.

## Two reproducible inconsistencies

The [before capture](key-validity-before.json) uses an independently signed proof while changing only directory entries and the trusted caller's assessment time. With the same key listed once as active and once as expired, putting the active entry first verifies; putting the expired entry first returns key-expired. Active/future entries show the same order dependence. Different active windows and bounded/unbounded duplicates also choose their bounds by order. A malformed time entry disappears entirely, so a single malformed matching key looks missing and a malformed duplicate can be hidden by another entry.

The second problem appears after warming an imported-key cache at an allowed time. Moving the supplied assessment time just before the key's activation still verifies from that cache; a fresh cache returns key-not-yet-valid. Both default and selected-proof APIs reproduce it in Node and local workerd. Forward expiry controls already agree. This is a caller-time/cache inconsistency, not evidence of a production clock failure or an HTTP-controlled clock.

The matrix contains **20 cases × three APIs per runtime**, plus **four warmed/fresh traces per runtime**. It tests actual Ed25519 verification, not injected verdicts. No request, key or reader telemetry reaches a remote resolver.

## Define the application policy explicitly

The [WG draft's directory and rotation sections](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00#section-5.5) show activation/expiry metadata and overlapping publication during rotation. [RFC 7517 §4.5](https://www.rfc-editor.org/rfc/rfc7517.html#section-4.5) recommends distinct identifiers for different keys, with exceptions. Neither source supplies our exact duplicate-window resolution policy. Different public keys can rotate normally; the issue here is different bounds attached to one public-key identity.

Our local policy now refuses differing activation/expiry bounds for that identity as **key-validity-conflict / policy-rejected**, even when both windows currently allow verification. Identical duplicates remain admissible. This deliberately trades verification coverage for an explicit refusal to choose an advertised window by order. It is not a universal RFC-invalid verdict; its production prevalence and effect on legitimate publishers are unmeasured.

Malformed or empty bounds remain attached to their recognizable key identity and produce the existing metadata-rejection/conflict reasons. The existing safe-integer seconds policy remains an application restriction; fractional numbers are not claimed universally invalid under every timestamp specification. Activation is inclusive and expiry exclusive. Imported-key cache entries retain activation and check it on each hit; expiry remains capped by both directory freshness and the key's expiry. Public-key policy advances to **2026-10-28.2**, invalidating older directory/imported-key cache entries.

## A specification spelling also needed support

The [current WG draft §5.5.1](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00#section-5.5.1) restricts directory `alg` to HTTP Signature Algorithm names. The JWK/WebCrypto references used in research 42 use JOSE names. Our prior profile rejected the draft's exact lowercase `ed25519` token, although it admitted `EdDSA` and `Ed25519`. The new profile recognizes all three exact spellings on the fixed curve, validates first, then adapts to the tested older workerd import alias. Arbitrary case folding remains unsupported. This is an explicit compatibility profile across those references, not draft-wide conformance or a new cryptographic algorithm. [Source cross-references](key-validity-sources.json) retain the namespace distinction.

## Accepted checks and limits

[After repair](key-validity-after.json), all 60 API paths per runtime meet their recorded profile expectations. All four warmed/fresh traces agree in each runtime. Audit completeness means all scoped profile decisions were assessed; a policy rejection does not become a valid signature or an identified operator.

Four regressions bring analytics to **221 passing tests**, including millisecond activation/expiry boundaries, reusable cached keys and old-policy cache rejection. Site **106 tests**, workspace types, validation and the isolated **32-post build** pass. [Six native collector/D1 controls](key-validity-storage.json) match exact acknowledged receipt/status/reason/profile facts; optional request evidence is absent. The generalized [storage helper](../../../scripts/check-key-metadata-storage.mjs) retains its default metadata mode, separately checked on its original [six controls](key-validity-metadata-compatibility.json). [Source checks](key-validity-checks.json) record scope and hashes.

[The retained Exa replay](key-validity-retained-exa.json) still verifies both previously exact-linked proofs using profile `.5` and the earlier later-captured directory. Stored profile stays `.2`. No fresh keys, production visit or direct SELECT supplies these results. Collection/verifier become **2026-10-28.5**; classifier, evidence/coverage/receipt/report schemas, trust registry, dependencies and replay policy remain unchanged. Optional diagnostics stay off; no rule, permission, migration or human trial occurs.

The concise article remains unchanged and links this finding through its research trail. Code activation needs a separate receipt; `.5` signed production persistence, native cryptographic agreement and actual human/purpose accuracy remain unproven. Broader conformance, DNS/egress and privacy/retention work stay open. Next bounded work should inspect failure-reason fidelity across supported wire forms: a legacy bare-URI fallback currently masks the underlying negative result. Preserve evidence before deciding whether that compatibility behavior should change.
