# Fresh experiment: a protocol update changes which URL supplies the key

Frozen October 31, 2026, 19:49 UTC, before implementation or execution. Status: **source inspection complete; experimental results not yet produced**. This is a local-only migration experiment for the fetcher-study follow-up. It does not reopen the accepted 20-context DuckAssistBot coverage replay, the 52-proof recovery or the 13 native trace controls.

## The decision this can change

Should the publication's verifier continue to describe a signed full directory URL as invalid, support a bounded new discovery profile, or explicitly expose that the new profile is unsupported? A new Internet-Draft is not evidence that current providers have migrated. September captures and older stored results retain their actual profiles.

The hypothesis is that the existing origin-only resolver rejects otherwise cryptographically valid messages using the new direct-URL discovery form **before any key fetch**, then labels the local outcome `invalid`. The selected hardening response preserves the origin-only fetch policy and distinguishes an unsupported HTTPS discovery location from cryptographic invalidity. It does not adopt arbitrary-directory resolution. A root-only URL is ambiguous across the two discovery models: the existing implementation appends the well-known path, whereas direct discovery fetches the supplied root resource. Thus accepting a more general URL without versioning its identity and lookup semantics would be an unsafe repair.

Competing explanations: malformed structured fields; an incorrectly constructed signature base; an unavailable/mismatched key; a deliberate narrower local URL policy; or a failure in the test's resolver rather than the verifier. The experiment separates parsing, mathematical verification, URL admission, requested resource and final attribution.

## Primary-source change

The [October 29 working-group draft `-01`](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-01) changes discovery to the HTTPS URL carried in the signed member; its changelog removes the old discovery types. Sections 4.1 and 5.5 distinguish a particular key-set URL from its host and require lookup by URL/key pair. The fetch retains a query, while the identifier discards it. Section 5.2.1 disallows dictionary-member parameters. The document remains work in progress. These are requirements to compare, not a conformance or adoption claim about our code or a vendor.

Source URLs for review: [identity](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-01#section-4.1), [member syntax](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-01#section-5.2.1), [discovery](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-01#section-5.5), [SSRF considerations](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-01#section-6.7), and the visible changelog in [the complete document](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-01).

[Research 114](../analytics-retrospective/114-directory-possession-and-profile-drift.md) already identified the newer draft and the separation between discovery and optional directory-possession proofs. [Research 115](../analytics-retrospective/115-offline-directory-response-profiles.md) implements an offline **response** proof adapter and independent comparison. Those are completed work, not findings of this experiment. The new experiment tests the **incoming request** discovery form and the truthfulness of its failure category, through the normal verifier, explicit candidate verifier and exhaustive audit. Compatibility rejection is not a security defect or proof that a provider is sending forged traffic.

## Baseline confirmed by code inspection

Base commit: `f2c1c48e2c1067cc7b51ca0e141e91435f4b10af`, verifier profile `2026-10-31.2`.

- [`directoryLocation()`](../../../../analytics/src/directory-discovery.ts) admits an HTTPS DNS origin only (`pathname === '/'`, no query/fragment/credentials), returns that origin as `agent`, and appends `/.well-known/http-message-signatures-directory`. It rejects a full well-known path before discovery.
- [`signatureAgentComponentValue()`](../../../../analytics/src/webbotauth.ts) accepts the older `type=directory` member parameter. This is an explicit compatibility subset; it is not the `-01` member rule.
- `verifyCandidate()` calls `directoryLocation()` before `resolveVerificationKey()`. `invalid-signature-agent` is mapped to `invalid` by [`verificationOutcome()`](../../../../analytics/src/signature-evidence.ts). Therefore the outcome category can currently imply more about an unfamiliar discovery form than the code has established about its cryptography.
- The file comment already says the verifier is not a full RFC/draft implementation. Preserve this exception. Earlier [standards review](../analytics-retrospective/02-standards-and-libraries.md) concerns the older origin/type-based model, and existing [directory tests](../../../../analytics/test/directory-discovery.test.mjs) intentionally reject non-root locations. A broader interpretation must be deliberate, versioned and tested rather than silently replacing those guards.

## Frozen fixture and controls

Use synthetic Ed25519 keys created by the fixture; no downloaded keys, private telemetry, production bindings or active credentials. Fix `now` to `2026-10-31T19:49:00Z`, a 300-second lifetime and an independent RFC 7638 public-key thumbprint. Request target: `https://publication.example/fixture`. Sign `@authority` plus the selected `signature-agent` member using independently assembled canonical bytes. Do not use the verifier's own `buildSignatureBase()` to create the signer oracle.

Give the root key set and well-known key set **different keys** so a request to the wrong resource cannot accidentally verify. Maintain an exact synthetic URL-to-response map. The resolver must throw on every unlisted URL, record every call, and return a fresh `Response`. No fallback to global `fetch` is permitted. Each case gets a fresh cache so the current shared cache cannot hide a lookup mistake.

| Case | Signed member form/location | Purpose and distinguishing observation |
| --- | --- | --- |
| L1 | Legacy string `"https://keys.example"` | Existing captured-profile control: resolver requests the well-known resource and verifies. |
| L2 | Dictionary `proof="https://keys.example";type=directory` | Older dictionary-profile control; preserve its compatibility result. |
| D1 | Dictionary `proof="https://keys.example/.well-known/http-message-signatures-directory"` | New direct URL: independent signature math should pass; baseline is expected to reject before any fetch. |
| D2 | Dictionary `proof="https://keys.example/tenant-a/jwks.json"` | A non-well-known direct URL is a distinct identifier; do not attribute it to the whole domain or fetch the host's well-known keys instead. |
| D3 | Dictionary `proof="https://keys.example/tenant-a/jwks.json?version=one"` | Distinguish fetched URL from normalized identifier. If supported, fetch the exact query-bearing resource and record a query-free identity under the chosen profile. |
| A1 | Dictionary root URL, signed with the root resource's key | Demonstrate migration ambiguity: direct discovery and legacy origin discovery cannot both be inferred from identical syntax alone. A rejected result under the older local profile is not proof that the root-published signature is forged. |
| N1 | Copy D1, flip one signature byte | Independent crypto negative control. A future supported direct-URL path must reject it; a baseline pre-discovery rejection cannot establish a crypto check occurred. |
| N2 | Full directory URL on `127.0.0.1` | Syntax/egress policy control. Zero resolver calls regardless of any supplied key or valid signature math. |
| N3 | D1 with a signed `type=directory` member parameter | Strict new-profile rule versus deliberate legacy compatibility. Never strip a signed parameter and verify a different base. |
| N4 | D1 resolver returns a redirect | If direct lookup is implemented, fail discovery without following it or attributing the target. Baseline still stops earlier; keep those stages distinct. |

Before execution, extend the URL-admission negative set to include malformed URL text, non-HTTPS, credentials, query and fragment, local suffix and IP literal forms. Preserve their existing no-fetch rejection semantics. In the selected narrow hardening, only an otherwise admitted HTTPS DNS location with an explicit path can become a closed `unsupported` outcome; a query/fragment or unsafe host must not accidentally obtain that status through a path-first check. Pair same-origin `/tenant-a/jwks.json` and `/tenant-b/jwks.json` messages to prove that distinct path identifiers remain distinct assertions and never become the same accepted origin identity. Report exact final case counts in the executed receipt rather than treating these controls as already run.

The direct-syntax mathematical oracle verifies each original signed base directly with WebCrypto, without discovery. N1 must fail that oracle. This is a signature-math control, not an independently implemented full Web Bot Auth verifier.

## Execution and acceptance

1. Freeze fixture/source hashes and baseline profile before changing code. Compile analytics fixtures with the pinned runtime in an isolated output/check-out if another session is writing `.test-dist`.
2. Run the ten cases against the actual baseline API in Node 24.14.1. Save per-case canonical-base digest, fixture digest, oracle result, parser result, admission result, exact synthetic resolver call list, local result/reason, closed evidence outcome and returned identifier. Do not expose generated private keys or signature bytes in the public receipt.
3. Run the identical serialized fixture through actual local workerd, with the same stub resolver, clock and fresh-cache rule. Require exact normalized result agreement for default verification, `verifyWebBotAuthCandidate()` and `auditWebBotAuth()`. This tests our two runtimes, not the provider-managed verification service.
4. Choose the smallest warranted response from the branches below. Re-run the exact frozen cohort on that candidate, retaining the baseline and failed attempts. All original-profile controls and unsafe-location zero-fetch checks must remain true.
5. The final article receives a result table only after the receipts exist. Until then this design stays proposed. No production probes, account setting changes, D1 statements, network key lookups or live vendor behavior claims.

Stop after the baseline conditions plus the explicit admission negatives, the paired native run and one selected candidate response. A transport/fixture failure is not a verifier result; fix the harness and retain that failure. New scope, other algorithms or an unrestricted arbitrary-directory resolver require another declared experiment.

### Response branches

- **No runtime mismatch:** retain code; publish a supported-profile/migration explanation and the negative result.
- **New form unsupported under an intentional narrow policy (selected candidate):** make that profile boundary explicit and use a closed unsupported outcome where warranted, rather than claiming cryptographic invalidity. Preserve the unsafe-address guard and existing origin identities. This is useful hardening while the broader resolver remains deferred. Bump the verifier profile for changed outcome semantics; retain historical `.31.2` results unchanged. A `.31.3` candidate is proposed, not delivered by this design.
- **Implement bounded direct discovery:** introduce an explicit resolution/profile contract. Keep fetched URL, identity URL and historical origin separate; use the full directory URL in key/cache scope; preserve no-redirect, byte/time/concurrency limits, DNS/egress caveats and explicit vendor recognition. Do not drop a tenant path to manufacture a familiar operator identity. Query-bearing identity normalization and the root-form ambiguity need their own asserted policy. An unrecognized new profile should abstain, not silently guess.

## Exact implementation/test entry points for the parent

- Public APIs: `parseSignatureAgentHeader()`, `buildSignatureBase()` (comparison only), `createWebBotAuthCache()`, `verifyWebBotAuth(request, { now, includeEvidence: true, cache, fetcher })`, `verifyWebBotAuthCandidate()`; `verificationEvidence(request, result)` exposes `localOutcome`.
- URL policy is the separately testable `directoryLocation(uri)` export. Existing controls live in `packages/analytics/test/directory-discovery.test.mjs`; generated-signature setup lives in `webbotauth-evidence.test.mjs` but should not be copied as the independent signing oracle because that setup uses `buildSignatureBase()`.
- The maintained native harness pattern is `packages/blog/scripts/check-native-trace-signatures.mjs`: bundle actual analytics TypeScript with esbuild, then run it in installed Miniflare/workerd using controlled bindings. This new fixture needs no Tail Worker or redaction path.
- `auditWebBotAuth()` is exported by `packages/analytics/src/webbotauth-audit.ts`; it calls the explicit candidate API and maps `verificationOutcome()`. A new failure reason must retain its unsupported category through all three paths, not just the default result.
- `pnpm -C packages/analytics exec tsc -p tsconfig.test.json` compiles Node fixture imports. A targeted Node test file can then run without the full suite. Confirm current runtime and output ownership before execution.

## Source commitments

At the base commit, SHA-256:

| Source | SHA-256 |
| --- | --- |
| `packages/analytics/src/directory-discovery.ts` | `48a15a0f4c839cecb649660b75e051a2aa6fa46b3be513acc20072abf9579a09` |
| `packages/analytics/src/webbotauth.ts` | `54348a11b372528ae042dc31b17b42c06104ec16e72e32b1e025b1f94aa38411` |
| `packages/analytics/src/signature-evidence.ts` | `b284f1e4366d371dda5e3e7b9dedeebc45bfab3f8a983663df09e534160baf75` |
| `packages/analytics/src/versions.ts` | `e233a71efd6eb6d91d9ab7197bd449bad3767120c0f8299a1c101be1259fb68e` |

These source hashes are a frozen local baseline, not a claim about currently deployed Worker bytes or the current managed service.

## Harness failures retained before native acceptance

The first native baseline attempt could not listen on loopback (`EPERM`); no native receipt resulted. The permitted native attempt then reached workerd and rejected the harness's named constant export (`VERIFIER_PROFILE_VERSION` is not a function/handler). The harness now keeps that constant internal and returns it through `runFixture()`. This was a harness-export failure, not a protocol-verification result. The original Node baseline receipt and its earlier harness hash remain unchanged. Subsequent receipts identify the corrected harness hash and the same frozen input digest.

## Prepared experiment artifact

The [fixture](../../../../analytics/test/fixtures/discovery-profile.mjs) now contains **20 frozen cases**: 18 independent mathematical positives and two deliberately corrupted negatives. The exact input file was created once, privately, and has SHA-256 `9866dc04191aa8b6b4c0d533108600c22d9613b5f71c5027a162ed095ff238ac`. The final set includes the ten primary conditions as adapted to the selected narrow response, malformed/non-HTTPS/credential/IP/local/query/fragment controls, two distinct tenant paths and three existing origin compatibility controls. The unreachable redirect branch remains deferred because the selected intervention never fetches an explicit path.

The [maintained harness](../../../scripts/check-discovery-profile.mjs) bundles actual analytics TypeScript into memory; it does not write shared `.test-dist`. It checks all three API paths for every case, enforces exact-map no-network resolution, compares the supplied independently assembled signature bytes through WebCrypto, asserts legacy controls and zero-fetch behavior, and refuses a source mutation during measurement. `--prepare` refuses an existing input; `--run` reads that existing input and refuses existing output files. A candidate must use the same input path, not call prepare again.

Run from the repository root with Node 24.14.1 and installed repository dependencies. Use new output paths inside an existing private directory:

```sh
node packages/blog/scripts/check-discovery-profile.mjs --prepare /absolute/private/new-input.json
node packages/blog/scripts/check-discovery-profile.mjs --run /absolute/private/new-input.json /absolute/private/new-baseline.json /absolute/new-public-baseline.json
```

The native run needs local loopback-listener access. `--node-only` as the last argument produces an explicitly Node-only receipt. The original Node baseline, `discovery-profile-baseline-node.json`, and corrected-harness Node baseline, `discovery-profile-baseline-node-checked.json`, preserve `.31.2` output, 20 cases and 60 API-path outcomes per execution. Both match the independent mathematical controls. Native baseline and candidate receipts must be linked by the parent after their runs; this note does not imply that they have already passed.

November 1 continuity correction: the intermediate Node-only files are retained in the [private archive](private-archive.json). The public [accepted baseline](discovery-profile-baseline-native.json) contains both Node and workerd results; [final results](06-discovery-profile-results.md) supersede the preceding pending-run status. The frozen design and its earlier execution state remain historical.
