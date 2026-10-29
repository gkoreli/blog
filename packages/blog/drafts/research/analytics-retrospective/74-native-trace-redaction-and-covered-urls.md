# Native trace redaction can break replay of a valid request

October 29, 2026 UTC. Continues [Research 73](73-retained-header-provenance-and-replay.md). The previous turn delivered a tested diagnostic. This iteration tests the native tracing boundary directly with **13 synthetic requests**, without human trials or production traffic.

**Twelve requests verify inside the producer. Seven verify from its default trace views. All twelve still verify from unredacted synthetic views.** Header and URL redaction account for five lost replays in this controlled cohort. The invalid-proof control fails at every stage.

## Follow one request across the actual boundary

The [maintained harness](../../../scripts/check-native-trace-signatures.mjs) starts an isolated local producer and Tail Worker through installed Miniflare `tails`, not a JavaScript imitation of redaction. Both use `cf: {}`. A service binding returns the trace to the harness; directory resolution uses only each fixture's supplied keys. No remote resolver or production service receives a request.

The [fixture](../../../../analytics/test/fixtures/native-trace-signatures.mjs) constructs independent signing bytes and synthetic keys. The producer verifies the incoming request. After invocation, the consumer obtains both native default and `getUnredacted()` views, reconstructs their requests, and verifies each under the supplied fixed clock. Node separately replays both serialized views. Each input has one eligible proof; all 13 trace deliveries are untruncated with outcome `ok` and no exceptions.

The installed local runtime supplies `scriptName: null`, contradicting our first test's expected name. Association uses the configured single producer and unique synthetic case key, with one trace per case. This is not a production identifier or joining contract. Runtime versions are **Miniflare 4.20260301.1 / workerd 1.20260301.1**, compatibility date `2026-03-06`; these are not the current managed Cloudflare detection service.

| Synthetic condition | Producer verified | Default trace verified | Unredacted trace verified |
|---|---:|---:|---:|
| Covered Cookie | Yes | No | Yes |
| Covered innocuous `x-monkey` header | Yes | No | Yes |
| Covered target URI with ID-shaped path | Yes | No | Yes |
| Covered path with ID-shaped segment | Yes | No | Yes |
| Covered query with ID-shaped value | Yes | No | Yes |
| Signed literal Cookie marker | Yes | Yes | Yes |
| Signed literal URL marker | Yes | Yes | Yes |
| Unsigned Cookie | Yes | Yes | Yes |
| Unsigned ID-shaped URL | Yes | Yes | Yes |
| Signed User-Agent | Yes | Yes | Yes |
| Unsigned Authorization | Yes | Yes | Yes |
| Baseline | Yes | Yes | Yes |
| Invalid proof | No | No | No |

The benign header is useful counterevidence: a redaction heuristic need not mean the original value was personal or secret. Neither marker shape nor a failed captured-context proof identifies the upstream actor or purpose. Unsigned context changes can leave a proof valid.

## What the provider documents

Cloudflare's [TailRequest contract](https://developers.cloudflare.com/workers/runtime-apis/handlers/tail/#tailrequest) documents heuristic header and URL redaction, false positives/negatives, and unredacted access. Matching substrings in header names can replace values; ID-shaped URL tokens can also be replaced. Its separate [Tail Workers description](https://developers.cloudflare.com/workers/observability/logs/tail-workers/) explains post-invocation delivery. The installed Miniflare source maps `tails` into runtime services; the actual experiment exercises that mapping.

These sources and the [pinned trace code from Research 73](https://github.com/cloudflare/workerd/blob/aa494794c44a900592c8281b191302d3b0a6e2a5/src/workerd/api/trace.c%2B%2B#L382) describe different version/surface evidence. They do not identify the exact source revision or capture path of the historical production dashboard export. The earlier two marker-shaped Cookie values remain insufficient to prove their original bytes or redaction path. No production unredacted capture is requested or enabled.

## Improve visibility where the test found a gap

The previous diagnostic exposed possible header loss but reported no marker facts for covered URLs. Profile **`2026-10-29.2`** now counts marker-shaped occurrences in supported covered authority, target URI, path and query components. The token-shape check includes hostname case normalization; it is not a provider-redaction assertion. Arbitrary names, URLs and values are not returned.

The signed literal URL marker still verifies and carries the marker count. An unsigned redacted URL has no covered URL marker count and still verifies. Missing input, unsupported components, unavailable resolution, candidate budgets and original-request uncertainty retain their existing meanings. No production classifier, verifier policy, schema, collector, receipt or report version changes.

The [native receipt](native-trace-signatures.json) preserves all producer/default/unredacted outcomes. Node agrees on all 26 serialized trace replays. The pinned [independent RFC verifier](https://github.com/pyauth/http-message-signatures/tree/1de433d9a49fd608475c6054ab14a1652c088844) agrees on **39 contexts**: 13 original fixture messages plus 26 actual native views. It verifies 31 and rejects eight. The eight failures include the original invalid proof in three representations and five redacted valid proofs; they are not eight independently observed invalid requests. Eighteen source files and five dependency versions are rechecked. [Reference results](native-trace-reference.json) bind the same fixture and capture digests.

## Acceptance and limits

All **281 analytics tests**, workspace types, script syntax and Markdown validation pass. The controlled Worker bundle has 151 inputs; the diagnostic module and helper remain absent. An isolated publication build checks the revised article separately from the shared development output; [checks](native-trace-checks.json) record its result and scope. No fresh deployment or served-page result is implied by local acceptance.

The article replaces one implementation-heavy paragraph with this bounded finding: **1,359 words, one more than before, with 31 unchanged shaping prompts**. Its title, opening and promised measurement scope remain appropriate. The displaced cache investigation remains linked through [Research 65](65-client-methods-and-directory-failures.md), not erased. No new human editorial request or prompt is manufactured from an automatic continuation.

Next: inspect the documented retained Workers Logs/export surface and existing captured representations for URL fidelity, especially covered components. Native TailRequest behavior is now reproduced; equivalence with the production export remains unproven. Managed-verifier comparison, the older 52 proofs, R1 attribution, privacy decisions and human/device accuracy remain open. Human trials remain deferred.

The private archive contains 29 captured files plus its manifest, with 0700 directories/0600 files. Manifest SHA-256: `9b142346698fee9dca37caeb0df57d62b39c990f3d415a9263c4313d2535eb08`. Prior archives remain unchanged. October 31 is a review date, not automatic erasure.
