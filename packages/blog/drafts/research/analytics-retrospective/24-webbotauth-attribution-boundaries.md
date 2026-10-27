# Web Bot Auth: capability and attribution boundaries

October 27, 2026 UTC. Follow-up to the Exa verification question, continuing TASK-0119. The [existing protocol audit](18-webbotauth-verification.md) and its release receipts remain the history of implementation and production acceptance. This iteration adds executable regression coverage and clearer capability documentation; it changes no runtime behavior, policy version, collection, schema or published article.

## Yes, there is a dedicated capability

[`webbotauth.ts`](../../../../analytics/src/webbotauth.ts) implements Ed25519 verification, supported RFC 9421 request components and HTTPS directory discovery. [`vendor-signatures.ts`](../../../../analytics/src/vendor-signatures.ts) separately compares Exa declarations with its documented origin. [`signature-evidence.ts`](../../../../analytics/src/signature-evidence.ts) preserves outcome, coverage, profile and independent nullable native inputs. The [package capability map](../../../../analytics/README.md#web-bot-auth) links discovery admission, demonstration-key rejection, persistence and reports.

The [RFC](https://www.rfc-editor.org/rfc/rfc9421.html) defines HTTP Message Signatures; [Web Bot Auth -00](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00) is a separate active Internet-Draft. Our implementation supports a subset, not full conformance. RSA/ECDSA verification, every RFC component/parameter, other discovery mechanisms and redistributed-directory proofs are not implemented here.

## What Exa's claim establishes—and what we measured

[ExaSearchBot](https://crawler.exa.ai/) documents search crawling; [ExaUser](https://crawler.exa.ai/exauser) documents live retrieval requested by a user or an Exa API application. Both vendor pages claim signed requests and automatic verification on supporting providers. These are vendor claims, not measurements of this site's complete traffic or native fields.

The [saved Exa result](exa-native-verification.json) covers 19 retained October 26 records, 18 distinct provider IDs. All verify at recorded times with a later directory capture; none binds UA or path. Native verification booleans are unavailable. This iteration does not recapture requests, join them to D1 or establish current vendor/native agreement. The [17:40 UTC public-directory inspection](exa-directory-2026-10-27.json) found two Ed25519 keys; reading that directory does not verify an incoming request or its response signature.

## Twelve independently signed controls

The [shared fixture](../../../../analytics/test/fixtures/webbotauth-attribution.mjs) assembles signing bytes without our base builder. It generates an ephemeral key and intercepts every directory fetch at `fixture.example`. Exa UA strings and the injected Exa member are synthetic claims; no Exa key or native provider participates. Header mutations use `Headers.set` to replace values case-insensitively rather than accidentally append a second value.

| Control | Actual local result |
|---|---|
| Minimal selected dictionary member | Fixture origin verifies; documented Exa origin differs |
| Signed UA/path positive | Verifies with UA coverage recorded |
| Change unsigned UA from ExaSearchBot to ExaUser and change path | Still verifies fixture origin; no Exa identity upgrade |
| Add an unsigned Exa dictionary member | Authenticated signer remains fixture origin |
| Rename only outer Signature/Signature-Input labels | Still verifies the covered member |
| Repeat the same signed nonce/request | Still verifies; policy remains expiry-only |
| Correct signed Content-Digest header/body positive | Verifies signed header |
| Change body bytes while retaining signed digest header | Still verifies header; body comparison is absent |
| Change signed UA, signed path or signed authority—three controls | Each fails with signature-invalid |
| Verify beyond expiry plus allowed skew | Fails with expired |

[Saved aggregate](webbotauth-attribution.json) records twelve controls, five minimal-signature successes, three additional bound/header successes, four failures and one intercepted directory fetch. Network calls, production page calls and D1 queries: zero. These selected controls are not population error rates, full conformance or an exploitation finding.

[Scoped checks](webbotauth-attribution-checks.json) pass 145 analytics tests, workspace types and 233 relative document links. The separate unfinished calibration evaluation is excluded from this delivery's test count and changes. No site build or production probe is needed for comments, regression fixtures and research documentation; no new activation or service-health claim follows.

Reproduce from the repository root:

```sh
pnpm -C packages/analytics test
node packages/blog/drafts/research/analytics-retrospective/probe-webbotauth-attribution.mjs /tmp/new-attribution-result.json
```

## Three standards boundaries worth preserving

**Coverage is selective.** [RFC 9421 §7.2.1](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.1) explains unsigned-field mutation. Its [§7.2.8](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.8) requires comparing a signed Content-Digest with actual content to establish body integrity. Our `covered.contentDigest` records header coverage only. [`eligibility.ts`](../../../../analytics/src/eligibility.ts) restricts this collector to GET; the POST fixture exercises the verifier directly, not an eligible page observation. General body authentication would need a separate design and acceptance.

**A nonce is not replay prevention by itself.** The [WG draft §5.2.3 and C.6](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00#section-5.2.3) leave nonce policy to deployments and describe atomic check-and-record requirements. [Cloudflare](https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/#signature-input-header) currently documents no nonce validation/database and recommends short expiry. Our repeated-request result is expected under the recorded expiry-only policy. A future duplicate indicator must distinguish protocol replay from legitimate retries and must not silently delete observations.

**Outer labels and covered member keys differ.** [RFC 9421 §7.2.5](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.5) permits outer relabelling. The WG draft's [§5.2.1](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00#section-5.2.1) says the matching-label member must be signed, while [§6.6.1](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00#section-6.6.1) permits outer relabelling and [E.2.1](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00#appendix-E.2.1) uses sig2 with agent2. We record this tension and preserve attribution to the actually covered member. No new matching-label rejection, claim of draft-wide conformance or upstream clarification is asserted.

## Next implementation and article boundaries

1. Accept an organic signed request through the deployed collector and safely compare local proof/coverage with native availability on that same request. Do not substitute another fixture or infer native false from absence.
2. Design bounded replay diagnostics separately: define scope, retry semantics, atomicity, expiry, privacy and cost before storing signature/nonce-derived identifiers. Current observations remain request events, not proven unique agent actions.
3. Complete discovery safety against actual Workers DNS/egress capabilities; URL admission does not prevent permitted DNS names resolving privately or rebinding.
4. Expand independent/differential vectors and document supported profiles, keeping mathematical validity, local policy, vendor-origin match and role claims distinct.

The existing [dedicated-article outline](18-webbotauth-verification.md#possible-dedicated-article) remains a proposal. A useful article can open with an authenticated signer whose unsigned role changes, then teach coverage, origin attribution, expiry/replay and native interoperability through these inspectable examples. Publishing another article is not treated as an accomplished outcome.
