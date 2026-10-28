# Test the reference implementation's input paths too

October 27 Pacific / October 28, 2026 UTC. Continues [ASCII repair 36](36-signature-ascii-and-http-whitespace.md), [TASK-0119](../../../../../docs/tasks/TASK-0119.md) and [the worklist](00-worklist-index.md). Human trials remain deferred. This follow-up executes the pinned reference code; the earlier phase inspected it without claiming complete behavioral equivalence.

## Agreement is evidence with a scope

The [maintained component probe](probe-reference-components.mjs) invokes the pinned Cloudflare reference's public `createSignature` API. A fixture signer captures its actual base bytes and returns dummy signature bytes. We compare those bytes with our builder, using both a JavaScript `Request` and an explicit request descriptor containing the same method, URL and fields. This tests base construction, not signature verification, time policy, provider behavior or vendor identity.

Eight ordinary controls agree across all three paths: ordinary target, empty query, absent query, encoded path/query and full target URI, default port/host case, IPv6 authority, method case, and interior horizontal whitespace. Fixed parameters make serialization reproducible; they are not a claim that a signature is current. After repair, a ninth produced-base agreement covers an uncovered non-ASCII field. Rejections and missing bases stay separate from byte-equality counts.

The boundary controls show why a reference is not an unquestionable oracle:

| Input | Pinned reference: `Request` path in Node | Pinned reference: descriptor path | Local builder before / after this repair |
|---|---|---|---|
| Eight ordinary controls | Produces expected base | Same bytes | Same bytes / same bytes |
| Covered non-ASCII field | Produces UTF-8 bytes | Rejects malformed field | Rejects / rejects, preserving research 36's repair |
| Uncovered non-ASCII field | Produces supported base | Rejects the descriptor's field snapshot | Produces matching base / unchanged |
| Covered ASCII control or DEL | Produces a base | Rejects malformed field | Produces base / rejects malformed field |
| Fragment-bearing target | Rejects invalid component | Rejects invalid component | Produces base / rejects target |

Here, `nativeReference` in the [closed comparison](reference-components-comparison.json) means a JavaScript `Request` input in Node, **not a Cloudflare edge verdict**. The before capture and later byte-level probe have different result formats; their methods and source/profile boundaries remain explicit. No population accuracy percentage is computed from these deliberately selected cases.

## What we executed and borrowed

The reference is [Cloudflare's source at `e4d3167`](https://github.com/cloudflare/web-bot-auth/blob/e4d3167886d0e7508d55fc5c501f1e498a3d4f5c/packages/http-message-sig/src/core.ts). Its `snapshotRequest` takes different paths for `Request` objects and descriptors. Descriptor fields pass through `copyFields`, HTTP normalization and ASCII validation; `Request` fields use `fieldsFromHeaders`. The tested base builder then encodes the extracted components. These observed branches explain the selected differences; they do not establish the current deployed provider's implementation or every use of the library.

The pinned [package manifest](https://github.com/cloudflare/web-bot-auth/blob/e4d3167886d0e7508d55fc5c501f1e498a3d4f5c/packages/http-message-sig/package.json) fixes `structured-headers` at **2.1.1**. We execute that MIT parser as a temporary research dependency, preserving its registry integrity and source/module hashes in [the reference manifest](reference-components-sources.json). No dependency, lockfile or copied upstream implementation is added to the production workspace. The useful idea is to validate message components at the application's own boundary and test each library input representation separately.

The core file again matches the earlier saved SHA-256. Four pinned source files and the parser are preserved privately. A root `pnpm-lock.yaml` retrieval returned 404; the exact dependency comes from the pinned package manifest. The initial temporary install selected global pnpm 10.33.0 because the research directory lacked a package-manager declaration. Declaring pnpm 9.15.4 and repeating with frozen lockfile/scripts disabled supplies the reproducible installation; this does not change the repository's runtime or dependencies. The first native helper invocation lacked esbuild's stdin resolution directory; the corrected run is the measured result.

[RFC 9110 §5.5](https://www.rfc-editor.org/rfc/rfc9110.html#section-5.5) distinguishes field content from ASCII controls, while [§7.1](https://www.rfc-editor.org/rfc/rfc9110.html#section-7.1) excludes fragments from the HTTP target URI. [RFC 9421 §2.5](https://www.rfc-editor.org/rfc/rfc9421.html#section-2.5) requires component-resolution errors and a final ASCII base. Agreement with a path that produces unsupported bytes would not override those requirements.

## Construction and HTTP delivery are separate boundaries

[The initial nine-case native experiment](request-context-boundaries-before.json) constructs fields inside workerd and separately sends them through the local HTTP client. NUL, CR and LF fail construction. ASCII controls 1 and 31, plus DEL, survive construction and formerly produce a base; the local client rejects their wire requests, with zero corresponding Worker invocations. HTAB, space and non-breaking space reach the local Worker through that client; the earlier non-ASCII guard still rejects the covered non-breaking-space base.

This is not a finding that Cloudflare production accepted malformed headers. A permissive constructor does not prove wire delivery, and a local client rejection does not prove all possible ingress paths reject. The repair protects the exported verifier when a caller constructs such a request. It does not claim to have recovered historical malformed requests.

The new guards reject normalized covered fields containing DEL or an ASCII control other than HTAB, with closed invalid reason `malformed-field-component`. They reject non-HTTP schemes and fragment-bearing request URLs, including an empty trailing `#`, as `invalid-request-target`. Encoded `%23` remains valid. Both checks happen before key discovery; no authenticated signer or verified coverage is retained for these failures. Uncovered fields remain outside covered-component validation.

Collection and verifier profiles become `2026-10-28.1`; classifier, evidence shape, receipt version, public report/cache and history remain unchanged. No new raw capture, migration, origin trust, library dependency or security-product setting is introduced.

## Native collector and regression acceptance

Three added [tests](../../../../analytics/test/signature-ascii.test.mjs) exercise independently signed control characters, invalid/encoded targets and seven explicit derived-component vectors. Analytics passes **194 tests**; site passes 106 and workspace types pass. These selected tests do not certify full RFC/draft conformance.

[Native acceptance](request-context-local.json), reproduced by [the maintained helper](../../../scripts/check-signature-context.mjs), runs seven actual collector/workerd/D1/WebCrypto controls. The wire carries only ASCII; the wrapper deliberately constructs malformed fields or fragment URLs inside the Worker before collection. An independently signed positive remains verified. Five malformed contexts retain invalid outcomes, the non-ASCII regression stays unsupported, and one malformed-field control is referral-excluded. With one historical row, the public fixture report contains seven events: one verified, four invalid, one unsupported and one not recorded. Optional raw evidence is absent, supplied fixture `cf` metadata is empty, and only the supported control causes an intercepted directory lookup.

The same helper repeats the nine construction/transport cases against the repair. It also verifies that the local HTTP client removes both nonempty and empty fragments before Worker receipt, while the deliberately constructed fragment controls reach the verifier and reject. The existing exact-reference SQL executes against native D1 with one read/zero writes. All owned local runtimes are disposed; no malformed request is sent to production.

## Delivery and remaining acceptance

[Source checks](request-context-source-checks.json), source push, activation and prospective integration remain separate. The retrospective stays at 1,251 words/31 prompts; its existing research-36 link leads to this follow-up, without adding another paragraph of protocol detail to the reader's article. The dedicated protocol article remains [proposed](18-webbotauth-verification.md#possible-dedicated-article).

Next: accept the source and activation, then use one ordinary, referral-excluded unsigned production request to verify the new profile and unchanged storage integration by exact private row reference. That can establish integration only; the malformed-context guard acceptance is the native local experiment above. It must not be described as a malformed production request or native/provider agreement. Review the one-read local plan and a 100-read post-execution threshold before command-mode Wrangler; no retry after quota/threshold rejection.

Rulesets dry-run authorization remains unavailable through the previously tested CLI route; no repeat is made. Raw-header capture fidelity, organic signed exact-row acceptance, native cryptographic comparison, independent human/device rates, broader vectors, binary wrapping, replay, DNS/egress and privacy/retention remain open. The wider goal stays active.

## Production profile integration

[Release acceptance](request-context-release.json) accepts source `1804550`, native Ready (46 seconds) and observed 100% activation at 00:07:45 UTC on October 28. The native row associates the exact source commit with the active version. One ordinary unsigned ASCII curl control at 00:08:53 UTC returns HTTP 200. Its filtered tail names that version and records the new collection/verifier profiles, absent signature, Unresolved shape, unavailable coverage/native booleans and empty native category. Optional owner-grant, diagnostic and calibration bindings remain absent.

The private returned row reference supplies the previously native-accepted primary-key SELECT. Command-mode Wrangler returns one row for **one metered read/zero diagnostic writes**, below the reviewed 100-read post-execution threshold; `changed_db` is false. Ten closed receipt/storage facts agree. The stored referral flag is the expected control; no separate fresh public-report fill is made. This cost excludes the collector's write, HTTP requests and metadata/dashboard work.

The ASCII fixture's User-Agent round-trips through its request-context capture, without closing research 36's Latin-1 fidelity limit. The served article remains byte-identical to the isolated build at 1,251 words/31 prompts. This production control proves profile/storage integration only: no malformed field or fragment-bearing request was sent to production, and no new vendor/native/human accuracy label is supplied. The malformed-context outcomes remain native local constructed-request results.

The filtered tail is stopped; no preview or viewport override is active. These observations supersede the pending source/activation/integration gates above. Next bounded work: recover and compare an organic signed observation through the current collector using the exact private reference, without replacing absent provider booleans with synthetic facts or aggregate joins. Human trials remain deferred; the broader standards, capture and privacy limits remain open.

Private raw captures, pinned source, compiled reference, dependency lock/integrity and check logs are preserved in `~/.local/share/gkoreli/analytics-evidence/2026-10-28-reference-components/`: 52 files plus a hash manifest, directory mode 0700 and file mode 0600. Disposable `node_modules` is excluded; source and compiled artifacts preserve the executed reference. October 31 is a review date, not automatic erasure or a backup guarantee. Private operation/database references and operational request context stay outside Git.
