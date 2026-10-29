# A queued report and a confirmed write need different receipts

Started October 29, 2026 UTC. [Research 20](20-production-diagnostic-readback-and-cleanup.md) independently read back one production report; the endpoint's 204 alone could not prove storage. This iteration repairs that acknowledgment contract and makes the transport's boundary explicit.

## The contract

The [writer](../../../../client-observability/src/db.ts) now requires `run()` to resolve with success and exactly one affected row for its single INSERT. A negative or contradictory acknowledgment is unconfirmed. Its error cause preserves only the bounded result status and affected-row count, with invalid counts left unknown. A [D1 result](https://developers.cloudflare.com/d1/worker-api/prepared-statements/#run) supplies success and operation metadata; the one-row invariant is our policy for this INSERT.

The [handler](../../../../client-observability/src/server.ts) awaits the handled confirmation before returning 204. It returns an empty, uncached 503 when storage is unconfirmed, without a retry instruction or arbitrary error details in the response. A received log is marked pending; a separate storage outcome is confirmed or unconfirmed. The same handled promise stays registered with `waitUntil` for the existing disconnect lifetime. Cloudflare [documents awaiting response-dependent work](https://developers.cloudflare.com/workers/runtime-apis/context/#waituntil) separately from keeping work alive after disconnect. Registration is tested here; actual network-disconnect behavior is not measured.

`FetchTransport` accepts only the endpoint's 204 acknowledgment and refuses redirects. Other 2xx values, including HTML 200 or accepted 202, remain unconfirmed. HTTP `ok` [covers all 200–299 statuses](https://fetch.spec.whatwg.org/#ok-status), so it is insufficient for this application contract. Response bodies are not copied into exceptions. No automatic retry is added.

The typed receipt distinguishes `server-acknowledged`, `browser-queued` and `disabled`. A successful `sendBeacon` call still proves queueing only. A rejected queue uses the existing single fetch fallback. The default logger remains fire-and-forget and isolates transport failures from the interaction; it does not now promise durable delivery of every browser report. Payload fields, schema, retention, newsletter verification and sending are unchanged.

## Paired native evidence

The [reproducible experiment](../../../scripts/check-client-error-acknowledgment.mjs) snapshots baseline source `728b17e` and current source, bundles the same [fixture](../../../test/fixtures/client-error-ack-worker.js), and runs both in workerd with native D1. All injected HTTP responses and storage faults stay local. The [results](client-error-acknowledgment-native.json) cover seven write conditions and fifteen transport conditions per version:

| Write condition | Old HTTP | New HTTP | Inserted rows in each fixture |
|---|---:|---:|---:|
| Normal write | 204 | 204 | 1 |
| Gated write | Early 204 | 204 after confirmation | 1 |
| Native missing-table rejection | 204 | 503 | 0 |
| Injected negative acknowledgment | 204 | 503 | 0 |
| Native zero-change result | 204 | 503 | 0 |
| Injected unexpected affected count | 204 | 503 | 0 |
| Write commits, then acknowledgment throws | 204 | 503 | 1 |

The delayed control holds the write behind an explicit gate, so the ordering result does not depend on a latency threshold. Both versions register completion; only the new response waits. The last row is essential: **503 does not establish that nothing was stored.** Retrying an unconfirmed report could create another record. These are labelled fault cases, not an estimated production error rate or evidence that four historical reports were lost.

Transport controls cover expected/unexpected success statuses, redirects, rejections, network failure, queued beacons, fallback and disabled reporting. Only 204 produces the server acknowledgment. Queueing produces its own receipt with no fallback request. The source makes one `run()` call per handler and at most one injected fetch call per applicable send; provider-internal retries and real browser transport are not measured.

To reproduce locally, use a fresh output directory and the pinned runtime:

```sh
node packages/blog/scripts/check-client-error-acknowledgment.mjs 728b17efe9e18238b76f90609be1aeb00e024736 /tmp/client-error-acknowledgment
```

This requires local IPC and the baseline commit in the checkout; it does not contact production. Both native runtimes are disposed. [Checks](client-error-acknowledgment-checks.json): all 144 site tests, workspace types, 22 Markdown validations and an isolated 33-post build pass. An initial unshipped candidate omitted the existing disconnect registration; the accepted candidate preserves it while awaiting the same completion. No historical report, article prose or analytics classification is rewritten.

Source delivery, activation and a labelled production success/readback/cleanup remain separate acceptance work. Failure behavior is accepted in the native matrix, not through a production outage. Build identity, operation correlation, admission, actual-byte limits, bootstrap coverage, actual browser delivery and the wider readership/native-verification requirements remain open.

The private 116-file archive preserves baseline/current snapshots, initial and accepted candidates, native results, checked build/source and handoff under SHA-256 manifest `58f9a41b1ad7b3566fecaab406bedc99b9d421d6f064d6289082961352487a5c`. Runtime hashes match the isolated snapshot. October 31 is a review date, not automatic deletion.
