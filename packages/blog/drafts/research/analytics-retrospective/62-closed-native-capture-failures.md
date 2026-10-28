# A failed measurement needs its own evidence

October 28, 2026 UTC. Continues [the live header experiment](61-live-native-header-boundaries.md). That run produced one HTTP 503 whose cause could not be established. The previous goal turn made progress through live measurements and publication. This iteration improves the instrument without relabelling its historical failure or opening deferred human trials.

## The distinction we were losing

The accepted route returned the same empty 503 for an owner-check deadline, an owner-check rejection and another failure while constructing or logging a capture. An HTTP response established delivery, but supplied no evidence about which operation failed. Counting that request as a negative bot result would have been wrong.

The separate diagnostic route now returns a closed `native-bot-capture-unavailable-v1` envelope. It contains a request-scoped response ID, registered control and planned condition, request start time, unavailable outcome and one of three reasons:

| Reason | What is established | What remains unknown |
|---|---|---|
| `owner-check-timeout` | The 500 ms deadline settled before the owner check | Whether metadata, hashing, storage or scheduling accounts for the delay; whether underlying work later completes |
| `owner-check-error` | The owner-check promise rejected before the deadline | The failing service or root cause; no raw exception is retained |
| `capture-error` | The guarded capture operation failed outside that owner-check result | The specific post-guard operation; the label also covers an injected clock or logger failure |

The successful capture profile remains v1. The controller becomes v3, with a separate failure validator, reason counts, failure response/log joins and reused-ID counts across successes and failures. Empty, malformed or differently profiled 5xx bodies stay `unestablished`; non-503 responses cannot supply a recognized failure reason. Unavailable results never become expected bot outcomes or enter a successful-capture denominator.

The matching private log event is `analytics.native_bot_capture_unavailable`. Logging is best effort: a valid response may have no captured log, which the controller reports separately. If response-ID generation itself fails, the route closes before owner lookup with the original empty 503; it cannot invent a join. There are no exception strings, User-Agent, IP, candidate header or inferred bot verdict in the new envelope.

## What the authoritative sources establish

- [Cloudflare's D1 timeout documentation](https://developers.cloudflare.com/d1/observability/debug-d1/#d1-binding-timeout-behavior) says binding calls have no per-call timeout or `AbortSignal`. Its timer-race example limits waiting, not execution. This route performs only the existing owner SELECT, but work and its cost can outlive the measurement deadline. No cancellation or zero-cost claim follows.
- [ECMAScript's `PerformPromiseRace`](https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-performpromiserace) attaches settlement handlers to each input. It provides no cancellation step. The regression controls settle the losing owner promise after the response and check that no late capture appears.
- [OpenTelemetry's error convention](https://opentelemetry.io/docs/specs/semconv/registry/attributes/error/) recommends predictable error categories with low cardinality. We borrow that design principle with three fixed operation-level reasons; we do not add an SDK or claim OpenTelemetry instrumentation.
- [Upstream workerd's D1 client](https://github.com/cloudflare/workerd/blob/9965fdda6b96f76562d78ececbbd812931cf6573/src/cloudflare/internal/d1-api.ts#L656) implements `first()` through its query-or-throw transport, returns null for no rows and has no abort argument. Captured source SHA-256: `84877074fa96811b6d4651fba05c6cce80df09a702efb2fa79fa06b52a3a9ed6`. This is current upstream source review, not a claim that those bytes are the installed runtime. The installed Workers type declaration independently exposes the same no-signal `first()` API.

The code cross-reference is [the route](../../../../analytics/src/native-bot-capture.ts), [the shared owner check](../../../../analytics/src/owner.ts), [controller](../../../scripts/run-native-bot-capture.mjs) and [native fault harness](../../../scripts/check-native-capture-failures.mjs). The whole owner operation includes metadata and daily-profile hashing before D1, so calling every timeout a database timeout would overstate the evidence.

## Executed acceptance

[Five workerd fault controls](native-capture-failures.json) execute the actual handler with deliberately injected owner, clock and logger behavior. Owner rejection, owner timeout and clock error have three exact failure response/log joins. Logger failure retains its closed response with zero joins. Expiry returns empty 404 before diagnostics. These are injected instrument tests, not five actual production failures or a D1 latency estimate.

The separate [composed Worker/native D1 run](native-capture-failure-composed.json) passes twenty HTTP controls and seven successful captures. Dropping the local owner table produces `owner-check-error`; observations remain at their prior count, with zero raw-diagnostic or calibration rows. Three additional metadata fixture controls preserve deliberate empty `cf` versus Miniflare fallback behavior. They remain fixtures, not managed-provider verdicts.

Node acceptance includes late owner success and rejection after timeout, expiry during a rejected check, post-guard clock failure, logger failure and response-ID failure. The controller rejects extra fields and unknown reasons, detects duplicate IDs across success/failure populations, and keeps absent, conflicting and duplicate log matches distinct. Analytics: **259 tests**; site: **116 tests**; workspace types pass. Local runtime is pinned Node 24.14.1. The first sandboxed native command failed to open its loopback listener; the explicitly approved local rerun passed. No production request or D1 diagnostic query occurred in these checks.

The [offline replay](native-capture-historical-replay.json) uses the original live plan, ledger and tail, without retrying requests or changing the frozen receipt. All eleven compared totals match: 23 responses, 19 captures, 22 expected outcomes and one unavailable. The new reason totals retain exactly one `unestablished`, with zero recognized historical failure envelopes. **The historical 503 is still unexplained.**

## Delivery and next evidence

The route stays off by default. No binding or request-header rule is activated; the classifier, verifier, report profiles, collection policy and original twelve automation labels are unchanged. The article remains 1,280 words/31 prompts: this instrument detail belongs in its linked research trail rather than another retrospective paragraph.

Source delivery and production activation are recorded separately in [the release receipt](native-capture-failure-release.json). Production activation and an off-mode check are pending at this local checkpoint; local tests cannot establish them. A frontend build is unnecessary for this route-only source change; composed Worker bundling and workspace types validate its imports, while the normal delivery pipeline performs the publication build.

Next: verify activation and closed off-mode behavior, then execute only missing, independently eligible live controls. Isolated disabling before expiry, genuine provider-positive and relay cases remain unexecuted. Generic known-bot delivery still does not establish managed cryptographic agreement, operator intent or a human reader. Human/device trials and the full analytics goal remain open.

## Production acceptance

Source `e3e0d60` is pushed after preserving two unrelated concurrent Mac-worktree research commits. Build `d313490e` completes its 32-post build and deployment; the full log identifies Worker `8482029c`. The same source-linked rollout is Ready at 100%. CI runs Node 24.22.1 versus local pinned 24.14.1. No updated asset files are uploaded; the article and client remain unchanged.

A single direct, collection-ineligible readiness GET supplies a true candidate and receives empty JSON 404 with no-store. Fresh name-only Wrangler metadata after deployment confirms the temporary capture and owner-grant bindings absent; no credential values are read or changed. This proves off-mode rejection alongside source activation, not execution of a new production failure reason. There is no direct D1 diagnostic SELECT, report fill, owner POST or human label.

The nine-file private publication archive and screenshot manifest are recorded in the release receipt, separately from twelve frozen local evidence files. Both use restricted modes and October 31 review rather than automatic deletion. The original unexplained 503 and all missing live conditions remain open. Next is a fresh, smaller dynamic-versus-disabled experiment entirely before rule expiry; no expired configuration is replayed.
