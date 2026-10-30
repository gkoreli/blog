# Verify the signature, then verify what it covers

October 30, 2026 UTC. Implements the offline follow-up from [Research 114](114-directory-possession-and-profile-drift.md). No fresh vendor capture, account access, reader collection or production query is needed. This does not resolve the separate readership/search/native-oracle gates.

## Delivered capability

[`@gkoreli/analytics/directory-response-audit`](../../../../analytics/src/directory-response-audit.ts) accepts a directory URL, response headers, exact bytes and explicit experiment/capture time. It uses the existing Structured Field parser and key-admission helpers, with a dedicated response signature-base adapter. There is no implicit fetch, directory cache, provider enrollment or access decision. A snapshot prevents caller mutation during asynchronous verification.

The output keeps three questions separate:

| Question | Evidence returned |
| --- | --- |
| Did an admitted key verify this covered response at the supplied time? | Per-proof signature/admission outcome, without labels or key identifiers |
| Does it prove possession for the requested hostname? | Distinct admitted-key count under the documented Cloudflare directory `-03` component shape |
| Does it also bind the supplied directory body? | Separate IETF protocol `-01` Appendix B count requiring signed digest coverage **and** a matching digest |

These are bounded compatibility measurements, not full conformance or native Cloudflare results. Unsupported components, encoding or digest algorithms, missing inputs, orphan members and candidate limits cannot become successful verification. Known positives remain visible alongside unresolved candidates; all-keys results are null where evidence cannot support a negative. Duplicate keys/proofs do not increase the key denominator. Conflicting validity windows or forbidden metadata reject the affected key under explicit local admission policy.

Supported: Ed25519; request `"@authority";req`; response `content-digest` without component parameters; optional response `@status`; SHA-256/SHA-512 over identity-encoded content bytes. Other content encodings are unassessed, avoiding a comparison against silently decompressed bytes. Caps: 65,536 body bytes, 32,768 header name/value units, 128 key entries, at most 16 paired candidates. Zero clock skew and explicit time are part of this offline profile; there is no nonce/replay database or implicit maximum age. A signature is time-valid at its exact expiry boundary; custom key `exp` admission expires at that boundary. Neither establishes current validity when replaying an older capture.

## Independent and native checks

[Native harness](../../../scripts/check-directory-response-audit.mjs): **35 exact Node/workerd comparisons**, comprising 33 labelled synthetic response conditions and Research 114's two preserved public responses. Synthetic cases include valid authority/body proofs, SHA-512 and status coverage, changed body/header/authority/signature, expired/future proofs, exact validity boundaries, incomplete multi-key directories, repeated proofs, metadata conflicts and unsupported evidence. Node tests also cover nine context/size/encoding/option gates, candidate/orphan handling and asynchronous mutation. All 326 analytics tests and workspace typechecks pass.

The [reference wrapper](probe-directory-reference.py) rechecks all 18 saved source files at [`pyauth/http-message-signatures` commit `1de433d`](https://github.com/pyauth/http-message-signatures/tree/1de433d9a49fd608475c6054ab14a1652c088844). Only the validation clock is substituted; key resolution is confined to each supplied directory. It executes three independent calls per candidate: signature verification, required authority coverage, and authority plus required digest coverage with explicit `body=` verification. **195 semantic checks: 183 agree, 12 have documented scope/admission differences, zero unexplained differences.**

The twelve differences are not discarded: the reference supports the signed request-path component our bounded adapter leaves unsupported (four comparisons), and it verifies key material for four metadata/validity-policy fixtures our adapter rejects (eight comparisons). Repeated-proof counts and distinct-key counts remain different units. The [comparison helper](../../../scripts/summarize-directory-response-comparison.mjs) asserts exact row/candidate alignment and this explicit difference set. Four altered/missing/reordered receipt controls are rejected.

For the preserved Exa/Ahrefs responses, both implementations verify all three authority proofs at their capture times and return no body-bound proof. This is independent agreement on those exact saved messages, not a fresh endpoint check, incoming crawler request, managed-provider verdict or historical key census.

## The useful failure

Changing a digest-bound fixture's body preserves the signature over its unchanged header but makes the digest mismatch. Our authority-possession count stays separate; its body-bound count becomes zero. The pinned reference reproduces both outcomes. Supplying `body=` explicitly enables its digest check; merely invoking signature verification does not. Inspect the pinned implementation's behavior rather than assuming every library call authenticates the body. [RFC 9530 §§2, 6.3](https://www.rfc-editor.org/rfc/rfc9530.html) explains the digest's content scope and its use with signatures; the [current Web Bot Auth draft Appendix B](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-01#appendix-B) supplies this optional domain-binding profile. Research 114 cross-references the provider's older deployed component shape. The draft remains work in progress.

The initial typecheck exposed the Workers `TextDecoder` options contract; explicit fatal UTF-8/BOM handling fixed it. The first native run was stopped by the sandbox's loopback-listener restriction; the permitted local run completed. Both are preserved as execution history. No Rust/runtime dependency was installed, and no runtime lockfile changed.

## Delivery and remaining boundary

This module is exported through its own package subpath and is not imported by the collector or public report. Before/after minified **analytics entry** bundles are byte-identical: 220,746 bytes, SHA-256 `8c42b505bca70cc7503d1e1a08558b6a34a52a9246817ce22232f3b01f0fda39`. This is a local bundle comparison, not current production acceptance or a full-site build. Collector/verifier versions, schema, reports and article are unchanged. No D1 statement, live site request, new human label or native-provider comparison occurs.

[Machine receipt](directory-response-profile-audit.json) records the closed matrix, checks, source hashes and private archive. Source, activation and production measurement remain separate. Before runtime adoption, measure response-validation/cache costs and define compatibility policy for missing or unsupported possession proofs; preserve direct TLS URL identity separately. The current implementation provides an inspectable offline capability without changing what we tell readers about the traffic already collected. The short retrospective stays concise; this detail is linked research.
