# Directory proofs establish possession, not readership

October 30, 2026 UTC. Independent work authorized while the owner is away from the locked Mac. Continues [Research 77](77-direct-signed-bots-and-registry-evidence.md), whose directory-response verification was unexecuted. The account, human-trial and privacy gates recorded after [Research 113](113-fresh-current-production-calibration.md) remain open. This inquiry requires none of them.

## What we measured

One successful direct HTTPS capture per reviewed directory, at 15:53:05 UTC, with no redirects, credentials or reader telemetry. Private inputs retain request URL, timestamps, response headers and exact body bytes. The offline [probe](probe-directory-possession.mjs) checks those bytes against capture hashes, reconstructs only the observed authority-only RFC 9421 base and uses Node 24.14.1 Ed25519 verification. It rejects other input shapes rather than posing as a general parser. [Machine receipt](directory-possession-audit.json).

| Captured publisher | Keys / response proofs | Crypto and capture-time validity | Covered component | Signature lifetime |
| --- | --- | --- | --- | --- |
| [Exa](https://crawler.exa.ai/.well-known/http-message-signatures-directory) | 1 / 1 | Pass | `"@authority";req` | 300 seconds |
| [Ahrefs](https://ahrefs.com/.well-known/http-message-signatures-directory) | 2 / 2 | Pass | `"@authority";req` | 604,800 seconds |

All three advertised `keyid` values match independently calculated RFC 7638 thumbprints. None of these responses includes or signs `Content-Digest`. For each proof, changing the authority, signature byte or verification key fails crypto verification. Adding an unrelated JSON member changes the body hash while leaving the cryptographic proof valid: the unchanged signing key is still present, and the body is outside the signed base. Fifteen control assertions pass. Four malformed/mismatched input controls are rejected. No mutation is sent to a vendor or our site.

This does **not** demonstrate an attack on either HTTPS endpoint: TLS protects the original body in transit. It demonstrates the narrower evidence available from a detached authority-only signature. Capture-time validity is not current validity or replay prevention. Today's Exa response has one key; Research 77's older capture had two. The observation does not establish why a key disappeared, its revocation status, or how any historical request should be classified.

## Three profiles must stay distinct

1. [Cloudflare's deployed integration documentation](https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/) currently names directory draft `-03` and requires the authority component with `req`, timestamps, thumbprint and directory tag. Its example has authority-only coverage. Registration and actual native request verification remain separate. Our captures have that documented component shape; we did not run Cloudflare's managed registration or verifier.
2. The active [IETF protocol draft `-01`](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-01), published October 29, requires `content-digest` alongside authority for the **optional domain-binding possession proof** in Appendix B. It explicitly permits URL-identity verification through direct TLS key discovery without that appendix (§§4.4–4.5). These captures lack the Appendix B body coverage; that is not a failed incoming-request signature or evidence that vendor traffic is illegitimate. RFC 9421 is a published RFC; this Web Bot Auth profile remains a work in progress.
3. Our current [`fetchDirectory`](../../../../analytics/src/webbotauth.ts) uses HTTPS discovery, manual redirects, strict media/body/key bounds and cache policy. It does **not** check directory-response signatures. Local request verification and reviewed publisher mapping cannot be described as completing either provider registration or the newer domain-binding proof. This is an explicit capability boundary, not a reason to invalidate all TLS-discovered keys.

The distinction matters: the current draft says a successfully resolved URL/key identifies a signer of the covered message. It does not prove a benign operator, permission to fetch, a human user, or that somebody read the article (§4). Product roles and vendor ownership still need their separately documented mappings; purpose remains an assertion or inference unless independently evidenced.

## What we learned from Cloudflare's implementation

The provider docs link [`http-signature-directory`](https://crates.io/crates/http-signature-directory). We fetched version **0.7.0**, Apache-2.0, verified its registry SHA-256, and reviewed its published source at commit [`b4c8556`](https://github.com/cloudflare/web-bot-auth/blob/b4c855647c1e7c715601cc13d5a9119d90014113/crates/http-signature-directory/src/main.rs). The component resolver rejects authority without `req` (lines 70–87); the candidate filter requires timestamps, directory tag, matching thumbprint and authority (lines 300–320). That filter does not require `content-digest`. Its HTTP-field resolver exists even though the README describes an authority-only tool; source and documentation should not be collapsed into a stronger guarantee.

This was **source review**, not CLI execution or independent RFC agreement. The installed Cargo shim has no configured Rust runtime; no runtime was installed. Two docs.rs reads were unavailable, so the checksum-pinned registry archive supplied the source. Initial sandbox DNS failures precede the authorized network captures and are preserved. No dependency was added.

## Next bounded improvement

Keep URL/TLS discovery, directory possession, signed body coverage, incoming request verification, publisher attribution and declared purpose as separate evidence fields. Start with an offline response adapter and versioned profile matrix: authority-only provider compatibility versus Appendix B digest-bound possession; mismatched authority/body/digest/key, expired proofs and partial multi-key directories need distinct outcomes. Compare against a pinned independent RFC implementation before considering runtime adoption. Preserve unavailable or unsupported states, and measure added fetch/cache/verification costs before changing collection.

Do not automatically require the newest draft for old traffic, silently promote a self-published key to a known company, or call an absent directory signature a bot verdict. No collector, classifier, schema, native comparison or article change, or deployment acceptance, occurs here. The short retrospective already separates identity from reading; this finding belongs in its linked research rather than another article paragraph. Search query/page data and labelled human visits still require the pending access/input. The goal remains incomplete; its tracker is still blocked, with this newly completed independent work recorded separately.

Private evidence: `/tmp/gk-directory-proof-20261030`, with the durable location and archive manifest in the machine receipt. Raw headers, bodies, fetched source and execution inputs stay outside Git. Reproduce offline with `node probe-directory-possession.mjs <private-capture>/network`; no network is used by the probe.

[Research 115](115-offline-directory-response-profiles.md) implements and checks the proposed offline adapter, including the independent RFC comparison. This earlier capture and its limits remain unchanged.
