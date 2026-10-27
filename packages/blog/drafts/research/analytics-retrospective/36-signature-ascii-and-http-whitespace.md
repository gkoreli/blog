# A canonicalization error behind a verified signature

October 27, 2026 UTC. Continues [coverage audit 35](35-goal-coverage-and-native-signal-boundary.md), [protocol review 18](18-webbotauth-verification.md) and [TASK-0119](../../../../../docs/tasks/TASK-0119.md). Human trials remain deferred. Source/local acceptance below is separate from deployment and actual-Worker acceptance.

## The reproduced defect

The verifier used JavaScript `.trim()` on HTTP fields. That removes Unicode whitespace, including a non-breaking space, beyond HTTP's space/tab normalization. An independently signed ASCII header could acquire non-breaking spaces at its boundaries and still verify: the verifier erased those added characters before constructing its base. Separately, it would verify some raw UTF-8 bases even though they were not usable RFC 9421 bases.

An ephemeral signer assembles a fixed-layout base without calling our builder. It uses a fixture origin and intercepted directory, with no external request. The [maintained probe](probe-signature-ascii.mjs) compares the previous core from `e3e6c50` with the repaired compiled module. Each run generates its own ephemeral key; these are comparable conditions, not the same signature bytes. The old core is bundled with unchanged discovery/key-policy dependencies, not presented as a replay of a historical production deployment.

| Control | Previous local result | Repaired result |
|---|---|---|
| ASCII field | Verified | Verified |
| HTTP space/tab padding | Verified | Verified |
| ASCII signature, non-breaking spaces added around covered User-Agent | Verified | Unsupported base, before discovery |
| Raw UTF-8 signature, interior non-breaking space | Verified | Unsupported base, before discovery |
| Raw UTF-8 signature, boundary non-breaking spaces | Signature invalid after trimming | Unsupported base, before discovery |
| Non-breaking space added before structured Signature-Agent | Verified | Malformed signer field, before discovery |

[Closed comparison](signature-ascii-comparison.json) preserves module/source hashes and the six-case results. An earlier exploratory probe used a synthetic custom header and recorded mathematical validity separately. Its raw UTF-8 positive is **not an RFC-valid positive**. The maintained matrix and this interpretation supersede any reading of that preliminary crypto result as standards conformance. No historical vendor request or production exploitation is established.

## Why the repair is narrower than “trim differently”

[RFC 9110 §5.5](https://www.rfc-editor.org/rfc/rfc9110.html#section-5.5) permits opaque non-ASCII field octets; they are not HTTP padding. [RFC 9421 §2.1](https://www.rfc-editor.org/rfc/rfc9421.html#section-2.1) requires non-ASCII values to obtain an ASCII representation before entering the signature base, and [§2.5 step 4](https://www.rfc-editor.org/rfc/rfc9421.html#section-2.5) rejects a final non-ASCII base. Binary wrapping with `;bs` is one representation; this verifier does not implement it. Signing arbitrary UTF-8 with a valid key is not sufficient.

The [pinned Cloudflare implementation](https://github.com/cloudflare/web-bot-auth/blob/e4d3167886d0e7508d55fc5c501f1e498a3d4f5c/packages/http-message-sig/src/core.ts#L387) separately normalizes HTTP space/tab and validates ASCII field content. Today's retrieved file matches the existing [reference manifest](webbotauth-reference-sources.json), SHA-256 `81d8586901f895a3c6dc5e6f0dba6c44c9c6ee89998e7de70043fd7e334789b4`. We inspected these functions and their snapshot call site; we did not execute the complete upstream verifier or establish behavioral equivalence. The failed web fetch and successful direct public-source retrieval are distinct access attempts.

The local repair applies space/tab trimming to ordinary fields and the structured signer input, then rejects any final non-ASCII base before directory lookup. `buildSignatureBase` retains its string-or-null interface. Verification records the new closed reason `non-ascii-signature-base` as **unsupported**, without claiming a negative cryptographic verdict or retaining coverage. Malformed structured signer fields retain their existing invalid reason. Uncovered non-ASCII headers do not invalidate an otherwise supported signature.

Collection advances to `2026-10-27.11` and verifier profile to `2026-10-27.7`. Classifier, signature-evidence shape, scalar receipt, report/cache version and stored history are unchanged. The new reason passes through the existing closed outcome/receipt paths. No new raw capture, migration, trust origin, vendor identity or network lookup is introduced. This is a supported-profile repair, not full RFC/draft conformance or universal header-grammar validation.

## Local acceptance

Two new [regression tests](../../../../analytics/test/signature-ascii.test.mjs) use the [independent fixture signer](../../../../analytics/test/fixtures/signature-ascii.mjs). They cover legal HTTP padding, non-ASCII boundary/interior mutations, mathematically valid raw UTF-8 signatures, malformed signer padding, pre-discovery rejection and an uncovered-field control. Analytics passes **191 tests**; site passes 106 and workspace types pass. The first suite run found the old pinned collection-version assertion; updating it to `.11` supplied the passing rerun.

[Native local acceptance](signature-ascii-local.json), reproduced by [the collector helper](../../../scripts/check-signature-ascii.mjs), runs the actual bundled collector in workerd/D1/WebCrypto. Six requests produce six stored observations. Two supported signatures retain User-Agent coverage; three unsupported requests and one malformed signer retain no authenticated signer or coverage. One unsupported observation is referral-excluded. With one historical row, the public fixture report contains six events: two verified, two unsupported, one invalid and one not recorded. One intercepted directory fetch serves the supported controls; unsupported/malformed cases trigger none.

The helper explicitly supplies empty fixture `cf` metadata. Its first native run stopped because Miniflare's default verified-bot value was false, rather than the expected unavailable state. That was a fixture assumption, not a production finding. The corrected configuration and assertions pass; no provider verdict is inferred. An initial restricted-listener failure is likewise preserved before the permitted localhost run. All local runtimes are disposed.

The [prospective control SELECT](signature-ascii-control-acceptance.sql) is executed against native local D1 and its plan uses the existing public/path/time index. Production acceptance must use command-mode Wrangler with a prepared narrow UTC window and reviewed post-execution read threshold. A native local plan is not a metered production result.

## Separate native Rulesets validation result

[Cloudflare's validation contract](https://developers.cloudflare.com/ruleset-engine/rulesets-api/dry-run/) supports `dry_run=true` without saving configuration. The [request-header API contract](https://developers.cloudflare.com/rules/transform/request-header-modification/create-api/) identifies zone-level `http_request_late_transform`, action `rewrite` and dynamic header expressions.

One guarded POST validates a candidate containing `to_string(cf.client.bot)`, an analytics-only probe header and a narrow host/path/referrer filter. The request enforces the exact API hostname/path and sole query parameter `dry_run=true`, follows no redirects and makes no retry. At 23:40:38 UTC it returns **403 / authentication error 10000**. A separate GET with the same refreshed Wrangler credential succeeds at 23:41:32 UTC and identifies this Free zone. The current OAuth scope list advertises no Rulesets/Transform write scope; no environment API token is present.

[Closed API evidence](native-rule-validation.json) establishes successful zone-read access and unavailable Rulesets dry-run access with this credential. It does not independently diagnose every cause of the API authorization failure, nor test field syntax, action validity, plan entitlement or delivery to the Worker. `result: null` in a failed response is not a successful validation. No rule is saved/deployed and no permission is expanded. Do not repeat the POST until a suitable existing authorization route is available. Browser dashboard activity and CLI identity refresh are additional service work; neither is a D1 statement.

## Delivery boundary and next acceptance

The retrospective links this failure through its existing verifier sentence; the [dedicated protocol article outline](18-webbotauth-verification.md#possible-dedicated-article) remains proposed. [Source checks](signature-ascii-source-checks.json), source delivery, activation and the actual excluded production control must remain separate records. The native Rulesets branch is unavailable through the current CLI authorization, while other engineering work remains possible; this is not a blocked status for the broader goal.

Next: accept the checked source, verify activation and send one excluded unsupported-base fixture with dummy signature bytes whose unsupported base must reject before discovery. Confirm its exact persisted reason/profile and no fabricated coverage under a reviewed read threshold. Do not call it a vendor-authenticated request. Organic current-version exact-row correlation, native cryptographic comparison, human/device rates, binary wrapping, broader independent vectors, replay, DNS/egress and privacy/retention remain open.

## Production acceptance and capture limit

[Release acceptance](signature-ascii-release.json) accepts source `5da4bc9`, native Ready (55 seconds) and a 100% activation at 23:49:37 UTC. The filtered control's tail names that active Worker version and records collection `.11` / verifier `.7`. The remote build uses Node 24.22.1 versus local pinned 24.14.1; runtime parity is not inferred.

One referral-excluded curl control at 23:51:14 UTC sends dummy signature bytes and a covered User-Agent with deliberately non-ASCII boundaries. HTTP is 200. Its scalar receipt records Unresolved, unsupported / `non-ascii-signature-base`, no signer/coverage, empty native category and unavailable native booleans. [The stronger exact-reference SELECT](signature-ascii-storage-reference.sql) replaces the wider window selection before execution. [Fresh native acceptance](signature-ascii-local-exact.json) establishes its primary-key plan and one-read/zero-write cost. Command-mode Wrangler then returns the one exact private row with **one metered read, zero writes**, under the reviewed 100-read post-execution threshold. Ten compared closed receipt/storage facts agree. The threshold is an acceptance check, not an enforced database cap.

The request-context capture is weaker than the scalar receipt for raw input fidelity. The control supplies Latin-1 `0xA0` bytes at the User-Agent boundaries; the tail displays U+FFFD replacement characters there. Its fixture header therefore does not round-trip exactly through that capture path. The responsible transformation stage is unestablished; we do not infer the exact characters visible to the Worker from the serialized tail context. The actual stored unsupported-base reason remains accepted. This does not turn the control into a production demonstration of the earlier whitespace-mutation acceptance. Production directory traffic was not independently measured; the pre-discovery sequence is supported by code and local controls.

The served article Markdown matches the isolated build exactly, and the rendered new evidence link is inspected. It remains 1,251 words/31 prompts. No additional public-report fill is made: the stored referral control and native-tested exclusion policy are not described as a fresh full public-report reconciliation. Optional owner-grant/diagnostic/calibration bindings remain absent. No rule, permission, migration or raw-capture activation occurs. The filtered tail is stopped; no preview or viewport override is active. HTTP/dashboard/identity/version work is additional service activity beyond the single diagnostic SELECT.

These observations supersede only the pending production gates above. Next bounded work: independent supported-profile/reference vectors and capture representability, without silently changing historical outcomes. The Rulesets branch still requires a suitable existing authorization route before another validation attempt; human trials remain deferred. Organic signed exact-row acceptance, native cryptographic agreement and the broader goal remain open.

Private captures, raw responses, source retrieval, controls and check logs are preserved in `~/.local/share/gkoreli/analytics-evidence/2026-10-27-signature-ascii/`: 55 files plus a hash manifest, directory mode 0700 and file mode 0600. October 31 is the investigation-copy review date, not automatic erasure or a backup guarantee. The public receipts contain closed results and commitments, not credentials, reader inputs or the private database reference.
