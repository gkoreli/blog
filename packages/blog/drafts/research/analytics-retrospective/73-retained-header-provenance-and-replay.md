# A retained request is a representation, not the original wire

October 29, 2026 UTC. Continues [Research 72](72-latest-signed-proofs-and-log-identifiers.md). Human trials remain deferred by the owner. This iteration reuses its fixed 03:15–04:15 UTC export; no new site visits, production queries or collection settings are introduced.

## What the existing headers establish

The [maintained analyser](analyze-retained-header-provenance.mjs) binds the original export digest, preserves all 409 request references and the seven log-ID collision groups, and emits only closed availability counts. These are selected invocation representations, including assets, not readership or complete traffic.

| Retained field | Nonempty, uninterpreted | Placeholder-shaped | Absent |
|---|---:|---:|---:|
| User-Agent | 409 | 0 | 0 |
| Cookie | 0 | 2 | 407 |
| Authorization | 0 | 0 | 409 |
| CF-Connecting-IP | 409 | 0 | 0 |
| X-Real-IP | 409 | 0 | 0 |
| CF-Connecting-IPv6 | 0 | 0 | 409 |
| CF-Worker | 1 | 0 | 408 |
| X-OpenAI-Host-Hash | 1 | 0 | 408 |
| Forwarded | 0 | 0 | 409 |

The four exact marker shapes are `REDACTED`, `[REDACTED]`, `[redacted]` and `<redacted>`. Empty values are zero for these fields. All 409 retained addresses in each of the two populated IP fields have valid syntax; syntax does not authenticate their provenance. [Machine-readable counts](retained-header-provenance.json) contain no address or arbitrary header values.

Cloudflare's [HTTP header documentation](https://developers.cloudflare.com/fundamentals/reference/http-headers/) distinguishes direct origin delivery, same-zone and cross-zone Worker subrequests, and Pseudo IPv4. A same-zone script can affect `X-Real-IP`, while cross-zone requests have a reserved address. `CF-Worker` describes a subrequest's owning zone; WAF evaluation has a separate field/stage. These origin-facing rules cannot establish the topology of every retained Worker invocation. Our existing network verifier already rejects marked Worker subrequests and the reserved sentinel; no new source is trusted here.

The branded `X-OpenAI-Host-Hash` name is an unreviewed hint, not an authenticated operator. Neither its presence nor a `CF-Worker` value establishes who triggered a fetch, delegation or actual use. Forwarded's retained absence still does not prove wire-complete absence.

## Redaction changes the verification question

Cloudflare's [pinned workerd trace implementation](https://github.com/cloudflare/workerd/blob/aa494794c44a900592c8281b191302d3b0a6e2a5/src/workerd/api/trace.c%2B%2B#L382) conditionally replaces Cookie and credential-like header values when producing redacted trace views. It also distinguishes redacted and unredacted request access. This supplies a concrete mechanism; it does not prove the exact dashboard/export path or deployed source revision behind our two marker-shaped values. We did not request unredacted credentials.

[RFC 9421 §7.2.3](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.3) explains why changes to covered components break signatures. A replay failure against a changed capture can therefore be correct cryptography and weak evidence about the original request simultaneously. A later directory also cannot reconstruct the resolver's original key snapshot.

The new optional [`retained-signature-audit`](../../../../analytics/src/retained-signature-audit.ts) requires a valid recorded clock, including rejecting null rather than falling back to the present. It retains the existing bounded candidate audit under `capturedInputAudit`. Closed availability counts expose missing covered header components, possible marker values and unresolved components. Original-request validity and historical directory equivalence remain explicitly unestablished, including after successful replay. It does not change collector classifications, verifier policy, access decisions or historical rows.

## Test both sides of the ambiguity

The [synthetic signer](../../../../analytics/test/fixtures/retained-signature.mjs) constructs its own canonical bytes and keys; it does not call our signature-base builder.

| Labelled condition | Captured-context result | Interpretation |
|---|---|---|
| Original signed Cookie | Verified | Supplied context and keys agree |
| Replace its covered value with a marker | Not verified | Original validity remains unknown to the adapter |
| Remove the covered field | Indeterminate, missing field exposed | No invalid-original claim |
| Corrupt proof with intact-looking input | Not verified | Still no proof of original capture fidelity |
| Sign the literal value `REDACTED` | Verified | Marker shape must not bypass cryptography |
| Add marker in an unsigned Cookie | Verified | Availability counts only declared covered components |
| Failed first proof plus valid second proof | Both retained | One success does not erase the failure |

Node and local workerd agree on **18 cases each**, including unavailable resolution, deadline/abort, candidate limits, malformed/oversized fields, missing/null/invalid clocks and caller mutation. The [native receipt](retained-signature-native.json) preserves their exact closed outputs. Our first test incorrectly expected missing input to be invalid, then unsupported; inspection showed the existing audit returns **indeterminate**. The final assertions preserve that outcome.

The pinned [pyauth implementation](https://github.com/pyauth/http-message-signatures/blob/1de433d9a49fd608475c6054ab14a1652c088844/http_message_signatures/resolvers.py) raises on unavailable covered fields; its verifier wraps component failures into its signature exception taxonomy. We compare verification success/failure, not equal diagnostic categories. It agrees on the [eight selected messages](retained-signature-reference.json): five verify, three fail. Eighteen source files and five dependency versions are rechecked. These are generic RFC comparisons, not managed Cloudflare verification.

The same two retained Exa originals from Research 72 still verify in all three implementations. Their captured covered components have no missing fields or marker shapes. This adds no new Exa observation, invalid-rate estimate, original-wire guarantee or human/purpose evidence. Synthetic Cookie failures must not be attributed to Exa.

## Delivery and next boundary

All **280 analytics tests**, workspace types, targeted tests and Markdown validation pass. The controlled Worker bundle has 151 inputs; neither the diagnostic module nor its inspection helper survives in it. This is a dependency check, not a production build or deployed-byte comparison. Collection, verifier, classifier, receipt, schema and report/cache versions stay unchanged. [Checks and source commitments](retained-signature-checks.json) record retrieval failures and the accepted source path separately.

The article remains at 1,358 words/31 prompts, with the new evidence discoverable through this research index and the package documentation. No fresh activation or served-page check is claimed.

Next: exercise the local native tracing boundary with synthetic covered headers to compare the request seen by verification against its retained trace view. A provider-specific capture profile needs direct evidence before explaining production failures. Managed-provider agreement, the older 52 outcomes, R1 attribution, privacy decisions and human/device accuracy remain open in the [goal audit](current-goal-audit.json).

The private archive preserves 32 captured files plus its manifest, with 0700 directories/0600 files. Manifest SHA-256: `cbffdcbdaeccc95a028fb7e918ce48babf60aeda495b7403d48c58ff13736280`. Prior archives remain unchanged. October 31 is a review date, not automatic erasure.
