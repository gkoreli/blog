# Enforce the diagnostic limit on the body we consume

October 30, 2026 UTC / October 29 Pacific. Continues [truthful acknowledgments](21-truthful-error-report-acknowledgments.md) and the still-open actual-byte requirement in [TASK-0126](../../../../../docs/tasks/TASK-0126-make-subscription-outcomes-durable-and-protect-the.md). The owner asks to keep work active. The prior claim that every useful engineering step depended on sign-in or human trials was too broad: this existing ingestion defect can be repaired independently. Search intent and human/native accuracy still need their own missing observations.

## Failure and repair

The handler checked Content-Length against 8,192, then called request.json() without measuring the bytes consumed. An absent, zero, understated or malformed hint could bypass the intended cap. Unknown JSON fields are discarded by the schema, so an oversized but otherwise valid object could still create a diagnostic row. This is a local reproduction, not evidence of production abuse or historical inflation.

The [handler](../../../../client-observability/src/server.ts) now reads the body stream, counts each nonempty Uint8Array and rejects overflow before JSON parsing, enrichment, logging or storage. Exactly 8,192 bytes remain admissible. Streaming TextDecoder preserves multibyte sequences split across chunks. Empty chunks add no retained string parts. Missing, already-consumed, failed or invalid-JSON bodies return 400. Overflow returns the existing empty, no-store 413. The early length-hint rejection and truthful 204/503 storage acknowledgment remain intact.

On overflow the reader is cancelled without awaiting its cancellation promise; a nonsettling producer cannot delay that rejection. This does not bound provider buffering, the size of one already-delivered chunk, network bytes, zero-byte progress, CPU time or slow-stream duration. A per-request time limit and broader rate/origin/admission controls remain separate work. No automatic retry is added.

Existing [confirmation parsing](../../../../newsletter/src/confirmation-request.ts) and [webhook parsing](../../../../newsletter/src/webhook.ts) already count streamed bytes. This repair applies that boundary to the separate diagnostic package while preserving its 413 result and avoiding a wait on cancellation. It does not merge packages or change those other handlers.

The [Streams standard](https://streams.spec.whatwg.org/#rs-default-reader-read) supplies the read/done and cancellation contracts. [Workers Request documentation](https://developers.cloudflare.com/workers/runtime-apis/request/#properties) describes body consumption in the actual runtime. The application policy is our inclusive 8,192-byte limit; neither document makes Content-Length a substitute for counting the application stream.

## Paired evidence

The [offline reproducer](../../../scripts/check-client-error-body-limit.mjs) snapshots an explicit full baseline commit and current source, bundles the same [fixture](../../../test/fixtures/client-error-body-worker.js), then invokes the actual handlers in separate workerd instances with native D1. It uses constructed Request streams, not production network framing. No raw reader record or public request is involved.

The [closed native results](client-error-body-limit-native.json) compare eleven conditions per version: ordinary input, the inclusive boundary, no hint, zero/short/malformed hints, Unicode boundary/overflow, a larger finite stream, invalid JSON and a reader failure. Six previously accepted oversized cases return 413 with zero run calls/inserted rows after repair. Three valid cases still return 204 with one confirmed insert each. Invalid JSON/read failure remain 400 with no write. The larger-stream control cancels after its first overflowing chunk without pulling the remainder.

Four [unit groups](../../../test/client-error-body-limit.test.mjs) also cover consumed/missing bodies, misleading hints, split UTF-8 and a producer whose cancellation never settles. These are labelled admission/error cases, not measured production loss, human labels or bot classifications.

Reproduce with the pinned runtime and a fresh output directory:

```sh
node packages/blog/scripts/check-client-error-body-limit.mjs 3b8a2d077affcd41328cc40c6b3e9ae9b458e2c0 /tmp/client-error-body-limit
```

The baseline SHA is checked against the source receipt below before acceptance. An initial harness cursor advanced beyond the final partial chunk and never closed; source inspection identified that fixture bug, the owned run was stopped and the corrected fixture passed. It is not counted as a handler or production failure. An initial root-level test command could not resolve the package-local tsx loader; the package-scoped command passed. Typecheck caught a combined discriminant arm; separate closed arms resolve the narrowing without assertions. Both native runtimes from the accepted run are disposed; a process check finds no body-limit harness or workerd serve process left running.

All 148 site tests and workspace types pass. The final isolated 33-post build passes; checked source files match its snapshot and main.js remains byte-identical to the earlier checked client. [Checks](client-error-body-limit-checks.json) keep initial failures and final acceptance separate. Source delivery, activation and production-path acceptance remain separate gates. Article prose, prompts, collector/classifier/verifier, schema, exclusions and optional diagnostic capture remain unchanged. This repairs admission of private error reports; it supplies no new readership or signature-verifier accuracy claim.

The private 46-file prepublication archive preserves failed and accepted fixtures, checked source, tests/types/build receipts and native before/after results under manifest SHA-256 `64644d205e791c0ed9f277ed083fd0a7c4cb7f01daca93453e91cae21058e16e`. October 31 is a review date, not automatic deletion.
