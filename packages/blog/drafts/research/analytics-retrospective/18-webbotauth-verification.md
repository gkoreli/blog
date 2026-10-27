# Web Bot Auth: what our verifier authenticates

October 26 Pacific / October 27, 2026 UTC. Extends the [assumption audit](17-detection-assumptions-and-experiments.md), [original protocol review](02-standards-and-libraries.md) and [classification task](../../../../../docs/tasks/TASK-0119.md). This is a dated implementation/evidence audit, not a full conformance certificate.

## Answer and actual evidence

A dedicated local verifier already existed at [`webbotauth.ts`](../../../../analytics/src/webbotauth.ts), called by the collector before classification. It reconstructs the signed message and verifies Ed25519 with discovered public keys. It does not depend on Cloudflare supplying a verdict. The gap was preserving what verification covered, its operating policy and native availability.

The [retained Exa sample](exa-native-verification.json) contains 19 native log records for October 26 UTC. All 19 verify with the revised verifier at their recorded timestamps against a separately captured, later Exa directory. All declare ExaSearchBot and use the quoted-string header form. Their signatures cover authority and Signature-Agent, but none covers User-Agent, method, path, query or target URI. Each has a 300-second validity window and arrived 0–3 seconds after creation.

These are **19 records, not 19 proven unique events**: two nonidentical records share one provider ID, leaving 18 distinct IDs. We preserve the collision. The export lacks both native verification booleans, although a native category is present. Missing booleans do not establish a negative verdict. No exact D1 join or complete sampling/retention coverage is claimed.

The later key capture proves this key set validates these retained messages at their original times; it does not prove the directory's contents at receipt, current-time freshness, all Exa traffic being signed, a human trigger or a citation. The [maintained reproducer](reverify-exa-capture.mjs) makes zero network/page requests and emits only an aggregate receipt. Raw messages, addresses, URLs, signatures and nonces remain in a restricted private archive with an October 31 retention review.

## Standards, vendor claims and local policy

| Authority | Checked claim | Our implementation / limit |
|---|---|---|
| [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html), February 2024 | Signatures cover selected message components; verification and application policy are separate. | Ed25519 and a supported request-component subset. No blanket RFC conformance claim. |
| [Web Bot Auth WG draft -00](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00), September 1, 2026 | An active draft, separate from RFC 9421. Minimal authority coverage leaves other request properties outside the proof. | Record actual coverage; dictionary and legacy compatibility are distinct. Directory discovery only, not every discovery mode or algorithm. |
| [ExaSearchBot](https://crawler.exa.ai/), July 30, 2026 | Vendor says every ExaSearchBot request is signed and supporting providers verify automatically. | The retained sample supports bounded cryptographic acceptance, not universal prevalence or our native-provider verdict. Do not extend this claim to every Exa product. |
| [Cloudflare native implementation](https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/), October 8, 2026 | Currently documents quoted strings, rejects later dictionary form, and has no nonce database. | Our dictionary acceptance does not establish native acceptance. Keep native assessment independent and unavailable as null. |
| [Cloudflare Apache-2.0 reference](https://github.com/cloudflare/web-bot-auth/tree/e4d3167886d0e7508d55fc5c501f1e498a3d4f5c) | Returns authenticated components, signature parameters and key information. | Borrow the separation of facts and policy; no new dependency or copied bulk rules. [Pinned source hashes](webbotauth-reference-sources.json). |
| [Akamai primary explanation](https://www.akamai.com/blog/security/redefine-trust-web-bot-authentication) | Describes edge authentication followed by local access policy. | No Akamai deployment or interoperability acceptance on this site. |

Directly fetched HTTPS directories and redistributed key sets have different trust conditions in the WG draft. We fetch the former; we do not ingest third-party key registries or claim directory-response proof validation. Merely hosting a key authenticates an origin/key relationship, not a company's reputation, task, authorization or human principal. The existing reviewed signer catalogue controls public naming; it is not an authorization list.

## Changes prepared in this iteration

- Keep successful signature coverage, wire form, validity/age and explicit `expiry-only` replay policy. Production caps signature lifetime/age at 24 hours with the existing 60-second skew allowance; this is a versioned local policy, not proof of replay prevention.
- Respect directory max-age and Age, cap cache lifetime, avoid reuse under no-store/no-cache, expire imported keys with the directory/key, enforce key activation/expiry, refresh an unknown key once per origin/30 seconds, and invalidate removed imported keys on refresh. No complete HTTP-cache implementation is claimed.
- Require the protocol media type, HTTP 200 and no redirect; bound bodies to 64 KiB, keys to 128, cache maps to 256 and pending distinct-directory fetches to 64. The collector's existing two-second deadline aborts fetch work. These limits are per isolate, not a global abuse budget or full SSRF defense.
- Add nullable `signature_evidence` through migration 0012. Keep raw signature/key/nonce/header values out of this new field. Record local failure reasons, profile and independent native booleans; test-injected verdicts are labelled and cannot claim cryptographic coverage.
- Add a public coverage/availability summary using the same selected population, exclusions and single SQL report statement. Counts overlap. Historical absence remains unknown; no backfill or reclassification. Cache/report version changes with these semantics.
- Disclose routine derived facts on /privacy. The optional raw diagnostic profile remains off. Linked observations remain potentially personal; this change does not settle the existing collection-basis, retention or rights questions.

The [decision](../../../../../docs/adr/0016.11-signature-verification-evidence.md) and source files define the implementation. Collection/verifier profiles advance to `2026-10-27.1`; classifier remains `2026-10-26.3`.

## Acceptance and next bounded work

[Native local D1 acceptance](webbotauth-local.json) runs the actual collector/verifier/persistence/report code. It applies the additive migration over an old row, then checks minimal, bound, tampered and unsigned fixtures. Old evidence stays null. Two verified fixtures differ in signed coverage; the tampered signed UA fails. Injected native false values remain independent. This is synthetic directory input, not provider verification. The prepared seven-day signed-agent SELECT also runs successfully in local D1; its [production plan](webbotauth-production-plan.json) caps direct acceptance reads at 50,000.

Source checks, migration application, source push, deployment activation, served UI/API and organic future writes must be recorded separately. Local acceptance alone proves none of the latter.

Still open: invalid-versus-unavailable reporting, exact/all-match client tokens and explicit declaration conflicts, unknown network/client states, documented vendor-IP verification, broader RFC/draft/reference differential vectors, safe discovery beyond current bounds, nonce/replay policy if needed, and labelled human/automation/error experiments. No current result establishes a gold-standard human count.

## Possible dedicated article

Central question: **What does a verified bot signature actually prove?** Open with a real Exa signature that survives an unsigned UA/path change. Explain signer, coverage, freshness and replay separately; show directory rotation/cache behavior and native/local interoperability differences. End with the real 19-record evidence and its limits. This research supports that article; no separate article is drafted or published from a tentative “might” request.

[Source checks](webbotauth-source-checks.json) pass: 97 analytics tests, 106 site tests, workspace types, 314 relative links and an isolated 31-post build. Article 1,232 words and 30 prompts. [Pre-release production acceptance](webbotauth-pre-release.json) records migration 0012 applied before push and the prepared report SELECT with 41274 metered reads, zero writes, within the 50,000 ceiling. Schema inspection used 74 additional reads; migration bookkeeping and public fills are separate. Source activation and future writes remain to verify.

## Release acceptance — October 27, 2026 UTC

[Production receipt](webbotauth-release.json) records source `d723a88`, its native build and 100% activation at 14:58:00 UTC. The served article matches the isolated build; 30 prompts and the new privacy disclosure are live. A seven-day signed-client report returns 225 historical views with no fabricated coverage. MISS/HIT bodies match. The browser renders all fifteen new rows and keeps the explanatory note.

[Final local release checks](webbotauth-local-release-checks.json) rerun the actual collector, final verifier bounds and the [recent-write](webbotauth-prospective-acceptance.sql) / [exact control](webbotauth-control-acceptance.sql) queries. The reproducer now derives artifact names from its output argument, so it can run again without colliding with fixed temporary paths. The earlier local receipt remains historical.

The bounded production recent-write inspection found no new-profile row before the control. One unsigned synthetic /privacy request, carrying a deliberately supplied excluded referrer, then stored one new-profile evidence record with absent signature, unavailable native booleans and no optional structured capture. Its exact two-second/path/referrer retrieval used one read; this is a release control, not organic traffic. Matching live policy hash plus local exclusion tests establish its exclusion rule; no separate fresh All-report count reconciliation is claimed. Organic signed collection acceptance remains open.

Acknowledged direct SELECT work totals **41,352 reads, zero writes**: 41,274 prepared report, 74 schema inspection, three recent inspection and one control retrieval. Migration bookkeeping, the single observation write, public report fills/browser reads and unrelated account work are additional. Python's Markdown request returned 403; curl retrieved the same excluded representation successfully. This transport difference was observed, not diagnosed.

Next bounded implementation: separate invalid and unavailable verification outcomes, repair exact/all-match declaration handling and explicit unknown network/client states, then validate documented vendor methods and measure labelled errors/abstentions. A new organic signed arrival must separately accept coverage persistence. The broader improvement goal remains active.
