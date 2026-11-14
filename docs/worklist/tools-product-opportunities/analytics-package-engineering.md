# Portable analytics reporting and signature engineering

November 13, 2026 Pacific. Active engineering following the [landscape comparison](analytics-industry-comparison-2026-11-13.md). Starting source `e30024eb`; unrelated editorial changes and raw exports are outside this work.

## Accepted scope

The existing `@gkoreli/analytics` package already owns collection, classification, storage and report queries. Complete the reusable delivery boundary: move the existing cache into the package, expose a composed reporting interface, add a small server-rendered report to the standalone Worker, and provide explicit durable cold-fill admission and reported-query-cost controls. Preserve current blog behavior unless a separately recorded change is necessary.

Expand HTTP signature interoperability through a dedicated public-key domain module, shared by request verification and directory-proof auditing. Cover the five public-key algorithms initially defined by RFC 9421, preserving algorithm/key constraints, demonstration-key rejection, bounded discovery, historical profiles and meaningful negative tests. Public-directory discovery cannot safely distribute an HMAC secret; transport-unavailable HTTP components remain explicit limits rather than invented wire data.

## Work and acceptance

1. Inspect standards, source boundaries and existing local/production receipts before changes. Record architecture in ADR-0016.24.
2. Implement public-key material, identity, admission and verification behind a small interface; exercise supported algorithms, tampering, key/algorithm confusion, directory duplicates, cache separation and metadata restrictions in Node and native Workerd.
3. Extract reusable report delivery, compose query/caching/admission, and supply a basic script-free report. Verify cache behavior, failure recovery, concurrent admission, unknown meters and HTTP privacy with meaningful regressions.
4. Freeze the existing fresh-schema baseline; append portable upgrades and compare fresh and existing installations against the blog's historical chain. Test installation outside the blog and preserve real setup failures.
5. Run affected suites, workspace types, native portability, Markdown validation, isolated build and Worker dry-run. Review scoped source/privacy diff; commit and push to main. Keep source delivery, activation and current production acceptance distinct.

Independent operator adoption is still a future outcome. A local agent-operated setup validates portability and report interpretation, without establishing another site's adoption. No outreach or npm publication is part of this engineering.

## Current state

The initial inspection found an uncached starter, blog-owned cache/dashboard, and Ed25519-only cryptography. [ADR-0016.24](../../adr/0016.24-portable-reporting-and-signature-domains.md) records the resulting boundaries and the module migration map.

Implementation is complete locally in package version `0.2.0`: reusable report selection/cache/delivery; typed admission policy and D1 adapter; script-free report; ordered upgrades after the frozen baseline; a shared five-algorithm public-key module used by request and directory-proof verification. The blog imports the package cache while keeping its publication-specific presentation. The report-facts migration promotes only equivalent predecessor facts; source bytes and derived values remain unchanged. New formats and unrelated stale facts retain complete-source fallback.

Local checks currently pass: 484 analytics tests, 440 site tests, workspace types, fresh-schema/minimal-Worker portability, five-algorithm Node/Workerd comparisons, three published RFC verification vectors and native durable-admission/guarded-upgrade controls. The current affected Workerd `1.20261108.1` passes 66 complete-report comparisons across 33 selectors and 211 synthetic observations. A valid 2049-bit RSA modulus has a separate interoperability control; modulus policy measures actual bits rather than assuming byte alignment. Full RFC conformance, nonce replay enforcement and body-digest validation remain outside the request adapter's accepted scope.

A separate generated project confirms pinned Node 24.14.1/pnpm 9.15.4, successful normal online installation after an offline-cache failure, successful subsequent warm-cache installation, and all three ordered migrations. Six real local HTTP page responses produce six acknowledged observations and three daily IDs: three headless declarations, two unsigned ExaSearchBot declarations and one unresolved client. The report returns MISS then a byte-identical HIT. Browser inspection confirms the script-free report, labelled composition and working seven-day navigation; no mobile-viewport or independent human-use claim. These are controlled local inputs, not customer adoption.

An isolated build succeeds with 46 posts. The shared build output is untouched. The first sandboxed native/HTTP attempts are retained as local socket-permission failures; accepted local-socket runs are separate. Initial expectation failures identify the new evidence version, expanded algorithm support and the reporting fingerprint; they are corrected without enlarging the persisted evidence budget or changing historical fixtures. Unsupported-algorithm controls now use HMAC rather than newly supported RSA.

Production preflight: fresh database metadata succeeds; constant `SELECT 1` returns zero reads/writes, and the indexed upper-bound query costs one read/zero writes. No observation content is selected. The guarded facts promotion will run only after source delivery under a frozen ID bound and finite intervals, with a 1,000,000-read/150,000-derived-write review ceiling and no source mutation. Native D1 reports three writes for a one-row fingerprint update because indexes contribute to the meter; this evidence sets the prospective write ceiling. Check complete returned meters after each interval and stop on missing meters or the ceiling. Budget-table creation is unused by the existing blog and remains an explicit opt-in migration there. Activation and guarded migration acceptance remain delivery work.

Private commands, failed checks, raw native/HTTP receipts and generated-project artifacts remain in ignored `packages/blog/worklog/operations/analytics-package-20261113/` and the named temporary evaluation/build directories. Generated local secrets, dependencies and database state are excluded from the evidence archive. A public normalized acceptance receipt and manifest commitment will record completed delivery separately.
