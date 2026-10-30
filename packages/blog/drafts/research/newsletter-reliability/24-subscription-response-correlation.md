# Which signup failed, and which request reported it?

October 30 UTC, 2026. Local implementation, labelled native acceptance and scoped hosted association below. Production correlation remains unmeasured.

A browser's diagnostic request has its own Cloudflare Ray ID. That ID does not identify the earlier signup request. Our confirmation handler already generates a random UUIDv4, returns it as `x-request-id` on every response, and includes it as `attemptId` in structured server logs where that stage logs. Admitted sends use the same ID in the private confirmation ledger. The client was discarding the response identifier. A stored `subscribe_api_rejected` report could identify its client build and HTTP status while still lacking a direct lookup key for the failed operation.

## The implementation and its boundary

New `subscribe-error-v2` evidence retains a syntax-bounded response ID, independently of the ingestion Ray. Each submission owns its evidence. Failure/cleanup preserve that attempt's phase and ID before clearing active state. A retry starts fresh; a late response from the previous attempt is ignored. Generic 202 responses continue to mean request received, without emitting an API-failure report.

| Observed client condition | Operation state |
|---|---|
| Widget failure before a signup fetch | `not-started` |
| Fetch invoked, no response observed before failure | `response-unavailable` |
| Response lacks the header | `response-id-missing` |
| Header fails exact UUIDv4 syntax | `response-id-invalid` |
| Fetch reports a redirect | `redirected-response`, identifier discarded |
| Direct response has a bounded identifier | `response-id`, plus lowercase UUID |
| v2 operation metadata absent or malformed | `unrecorded` or `invalid` |

Existing v1 rows/clients remain supported with their original semantics; the parser does not invent an operation state for them. The existing JSON evidence column stores v2 without a migration. Browser redaction, server parsing and the writer independently rebuild closed fields, discarding extra properties. No response body, email, challenge token, arbitrary header collection or new cross-request browser identifier is added. Existing private diagnostic retention applies.

This is a **client-reported lookup hint**, not an authenticated join. A caller can forge or reuse a correctly shaped UUID. A useful investigation must independently match server evidence, compatible route/stage/time and context. A ledger row exists only after admission; early failures may have a structured log but no ledger row, and some validation returns have no stage log. Log retention/sampling can also prevent a match. No-response failures remain uncorrelated by this mechanism: the server may have received or committed a request whose response never reached the client. This iteration deliberately does not turn a timeout into a “never received” claim. A future outgoing operation reference would need a separately reviewed trust, retention and admission design.

## What we borrowed from existing practice

[OpenTelemetry's HTTP conventions](https://opentelemetry.io/docs/specs/semconv/http/http-spans/) distinguish outbound attempts, received response status and failures without an observed status. We apply that distinction through static failure stages and closed response states. Our custom operational evidence is not an OpenTelemetry span or a claim of conformance.

The [OpenTelemetry JavaScript fetch implementation](https://github.com/open-telemetry/opentelemetry-js/blob/main/experimental/packages/opentelemetry-instrumentation-fetch/src/fetch.ts), inspected on this date, has separate success/error completion paths and observes response-body completion. That wider lifecycle is a useful boundary: our form inspects status/headers and does not measure full body transfer. We do not copy its global fetch instrumentation, add its SDK, or claim runtime equivalence from source review. The linked main-branch source is mutable.

[W3C Trace Context privacy/security considerations](https://www.w3.org/TR/trace-context/#privacy-considerations) reinforce keeping correlation values bounded and separate from credentials or identity. We reuse our existing server-generated operation reference; we do not introduce traceparent/tracestate or claim UUID validation authenticates a report. [Cloudflare explicitly cautions that Ray IDs are not guaranteed unique](https://developers.cloudflare.com/fundamentals/reference/cloudflare-ray-id/). Retaining the correct operation's reference is more precise than treating the logger's Ray as a universal key.

## Paired labelled experiment

The [reproducer](../../../scripts/check-subscription-correlation.mjs) freezes a local plan before execution, compiles baseline/current clients, runs the actual subscribe initializer/default logger against a DOM fixture, and dispatches to actual handlers in local workerd with native D1. Missing configuration forces the real confirmation handler to return 503 before verification, admission or mail. The resulting report goes through the default beacon-false/fetch fallback, ingestion handler and independent D1 readback. This is not an actual-browser or production experiment.

[Closed native receipt](subscription-correlation-native.json): six conditions per client version each store exactly one acknowledged report. The unchanged response ID is independently compared with the server's structured configuration-failure log. Baseline matches **0/1** available direct-response references; current client matches **1/1**. Those are selected-control counts, not population delivery or authentication rates. Current missing/invalid/redirected responses retain their distinct states. A constructed lost-response control runs the server handler and then throws before the client receives its response: the report correctly says `response-unavailable` even though the server log exists. An idle widget error invokes no signup API.

The dispatch adapter asserts the client's keepalive setting but omits that browser-only option because local workerd rejects it. Browser queue/keepalive behavior is unmeasured. Four earlier harness invocations are preserved: an invalid baseline argument, then incomplete/deadline results traced to that unsupported option. The corrected script validates the baseline first and awaits an explicit diagnostic response. No failed run is overwritten or counted as acceptance. An initial isolated build also stops at sandbox-denied tsx IPC; the separately authorized local build passes.

[Checks](subscription-correlation-checks.json): 156 site tests, workspace types, 22 Markdown validations and an isolated 33-post build pass. Added tests cover UUID syntax, malformed/legacy evidence, discarded fields, cleanup context, retry identity, late responses, network/widget failures and successful 202 behavior. Native controls issue zero production requests/SQL, verification calls, provider sends or human labels. No source activation, live browser correlation or production readback is inferred from these checks. Article prose/prompts, traffic classification and readership estimates are unchanged.

The private 87-file archive preserves the plans, source snapshots, failed runs and results under manifest SHA-256 `6e7a8362638bebf4cad2126ac38a2ab27efabb019328420dedbc6b5254fac33a`. October 31 is a review date, not automatic deletion. All owned experiment/build command handles are terminal; native disposal is awaited. A sandbox-denied process listing provides no additional process-state evidence.

Next: source/build activation evidence, followed by bounded diagnostic origin/rate admission and remaining bootstrap/budget work. Human trials remain deferred; search demand, human growth, unexplained referrer attribution and native managed-signature agreement remain separate unresolved measurements. The full analytics goal stays active.


## Hosted association accepted

[Release receipt](subscription-correlation-release.json) joins source `7a24b214a6315fe70b53c946f32847137bf3d4e2`, successful native build `285692d3-df88-4ad7-b581-e4618e3d3575`, its deploy log and full Worker `b01cdda3-7766-425f-9fd1-9e5f11966872` at fresh Wrangler 100%. Only main.js is uploaded as a changed asset. Native Node 24.22.1 differs from pinned local 24.14.1; runtime policy is not changed.

One frozen static/prefetch GET returns 200 and exactly matches all 29,779 reconstructed client bytes, including the native build/source identifier. No production diagnostic is posted and no production SQL, verification, email or human trial runs. This accepts source/build/served-asset association; it does not accept actual browser or production operation correlation. No per-request Worker trace is joined.

The separate 16-file private release archive has manifest SHA-256 `72f8c3353a5aad872a72327828a777ed1ea5d2f4de417f9b62dd8d22026ffaa0`; the pre-request plan commitment is recorded in the receipt. October 31 remains a review date, not automatic deletion. This receipt belongs to the inspected code-bearing build: later builds, including a documentation follow-up, receive their own metadata and must not inherit these identifiers as proof of latest state.

Next bounded action: diagnostic origin/rate admission and remaining event/bootstrap budgets, with no-response operation correlation still an explicit design gap. All experiment/build command handles are terminal. The full analytics goal remains active; no human trials or provider terms are reopened by this release.
