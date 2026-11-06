# Provider contracts: preserve uncertainty and validate the verdict

November 5 Pacific / November 6 UTC, 2026. Part of the owner's four-hour code and
article continuation. The coordinator owns integration and publication; this
increment changes the Resend confirmation adapter and Siteverify response
boundary. It performs no production request, signup, send or database mutation.

## A rejected retry cannot explain the first attempt

The existing confirmation sender reuses an identical body and idempotency key
for at most two calls. That is consistent with Resend's
[idempotency contract](https://resend.com/docs/dashboard/emails/idempotency-keys):
the same operation can recover its accepted result without sending a second
message, within the provider's 24-hour retention window.

Its outcome model nevertheless lost information between calls. A locally
constructed transport first throws after possible provider acceptance and then
returns HTTP 400 or 429. The original function reports `failed`, because its last
response replaces the earlier unknown result. A rejection of the retry does not
establish that the earlier request sent nothing. The same downgrade follows an
unparseable successful response, HTTP 500 or an unresolved HTTP 409 operation.
Resend documents both permanent payload conflicts and in-progress operations
under [409 responses](https://resend.com/docs/api-reference/errors); status alone
does not resolve an earlier ambiguous send.

The sender now remembers acceptance uncertainty for the whole operation. A
valid accepted replay can resolve it. A later rejection retains `unknown`, with
the last observed HTTP status. A known rejection on the first call still returns
`failed` without an unnecessary retry. If parsing a successful response fails,
the observed HTTP status is preserved instead of being replaced by null.

This is an invariant about evidence, not a claim that Resend emitted those exact
sequences in production. Cooldown, durable admission and the two-call bound are
unchanged. The adapter still exports the same result union. It stores no raw
provider error body or exception text.

## A boolean is not the whole Siteverify verdict

The old verifier accepts this contradictory synthetic response:

```json
{
  "success": true,
  "hostname": "gkoreli.com",
  "error-codes": ["invalid-input-response"]
}
```

It returns `ok: true` while returning the token-rejection code in its diagnostics.
Cloudflare's [response contract](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
separates successful validation from failed validation and its error codes. The
implementation must reconcile those relevant fields before treating provider
transport data as a domain decision.

A small internal decoder now validates that relationship. A successful reply
requires a nonempty string hostname, a string action when supplied and no error
codes. Failed replies require recognized failure evidence; unknown text is not
copied into diagnostics. Missing, malformed or contradictory relevant fields
return the existing bounded `invalid_verifier_response` / unavailable result,
with the existing retry and idempotency behavior. Known rejection codes still
produce their existing classification, and mixed unknown provider strings are
discarded rather than logged.

Exact-hostname enforcement and the explicit cached-client action exception are
unchanged: absent or empty action remains accepted, another nonempty action is
rejected. Tightening that policy needs a separate compatibility decision. No
claim is made that Cloudflare currently returns the constructed contradiction.

## Domain boundaries and checks

The delivery adapter now preserves monotone knowledge of a potentially completed
side effect. The verification adapter validates external facts before the
application can reserve a confirmation. These are narrowly enforced boundaries,
without adding repositories, frameworks or transport types to the domain API.

[Focused regressions](../../../test/newsletter-provider-contracts.test.mjs) cover
ten ambiguous-first/later-rejection combinations, accepted replay, a definitive
first rejection, observed HTTP status on parse failure, malformed/contradictory
verdicts, existing action compatibility and privacy. One test exercises the real
confirmation handler and proves that a contradictory reply never reaches its
database admission boundary.

Validation: 25 focused tests plus the existing newsletter and subscription
diagnostic suites pass (72 tests total), and `pnpm -C packages/newsletter
typecheck` passes. The tests replace only outbound provider transport; no actual
email or provider request occurs. Scoped whitespace checks pass. Code delivery,
Worker activation and any native/live acceptance remain the coordinator's
separate integration steps.

The article can explain both repairs as testable limits of a response model:
unknown is not failed, and a successful flag cannot override contradictory
provider facts. They are local fault-injection results, not measurements of
provider reliability or subscribers lost.

## Separate audit finding handed to the coordinator

The existing webhook reader decodes bytes before signature verification. A
native HMAC control reproduces three results: plain signed JSON returns 200;
prefixing an unsigned UTF-8 BOM to that signed wire body still returns 200; and
authentically signing the BOM-prefixed bytes returns 401. The decoder strips the
BOM before computing the signature. Svix's
[raw-body contract](https://docs.svix.com/receiving/verifying-payloads/how-manual)
and [native implementation](https://github.com/standard-webhooks/standard-webhooks/blob/main/libraries/javascript/src/index.ts)
require exact payload bytes. This is a distinct authentication-boundary issue;
the coordinator owns its repair and integration. This increment does not edit
`webhook.ts` or claim that issue fixed.

## Second increment: confine endpoints and explain the stop

The first increment above was committed as
[`d63ea5b6`](https://github.com/gkoreli/blog/commit/d63ea5b62cbd86ab427348f8df67cdd1c0227651).
This continuation adds endpoint policy and a closed delivery receipt. It keeps
the earlier uncertainty and provider-verdict checks intact.

Both adapters previously used default redirect following. A local native Node
Fetch control remaps their provider endpoints onto an owned HTTP server that
returns a 307 to another owned origin. The destination receives both synthetic
Siteverify secret/token JSON and the synthetic confirmation-message body. The
Node runtime strips cross-origin Authorization, but still forwards the body.
No real credentials, recipients or external endpoints are used in this control.
An additional default-follow workerd control also forwards the synthetic body
to the constructed destination. Its outbound-service bridge observes a stripped
Authorization header; that local observation is not a cross-runtime credential
forwarding guarantee. The repair prevents the destination call altogether.

The first proposed repair uses the Fetch standard's `redirect: 'error'`. A Node
control accepts it and blocks forwarding. That is insufficient evidence for a
Workers deployment. Cloudflare's [native Request contract](https://developers.cloudflare.com/workers/runtime-apis/request/)
does not implement that mode: it throws before sending. An added workerd control
reproduces the TypeError at this site's `2026-03-06` compatibility date. The
incompatible proposal is corrected before this increment is committed or
deployed; it is not described as a production regression.

The repair uses `redirect: 'manual'` and explicitly rejects 3xx responses.
Siteverify returns unavailable / `verifier_redirect`, without replaying.
Confirmation delivery remains unknown and stops as `redirect-rejected` without
forwarding or retrying. The [native control](../../../scripts/check-newsletter-provider-redirects.mjs)
proves ordinary provider requests still work in workerd, then proves redirect
targets receive zero calls. A redirect-only failure test could have hidden a
configuration that prevented every upstream call.

The confirmation receipt retains outcome, provider ID and HTTP status and adds
only these closed facts:

| Diagnostic | Meaning |
|---|---|
| `attempts` | Actual provider calls started, one or two |
| `elapsedMs` | Nonnegative elapsed operation time |
| `retryReason` | Trigger of the second call: none, network, timeout, server, idempotency, rate-limit or invalid-response |
| `stopReason` | Accepted, HTTP rejected, retry exhausted, rate wait too long/invalid, or redirect rejected |

These live under `delivery.diagnostics`. An unknown outcome can accompany an
HTTP-rejected stop when an earlier response was ambiguous; the stop describes
the last adapter decision, not proof that nothing was sent. Native exception
messages and raw provider bodies are never copied into these facts. Portable
transport error names distinguish timeout from other network failure.

The existing interactive wait budget still permits only short delta-seconds
Retry-After values, up to three seconds, with a one-second default/minimum. The
parser now rejects fractional, hexadecimal, exponent, negative or empty values
instead of coercing them with Number. Longer or unsupported hints stop without
an early retry. A bounded policy declining a hint is not a claim that every
possible HTTP-date Retry-After representation is implemented. Response-body
cancellation is started without waiting on an arbitrary cancellation hook.

Checks after this change: all 45 provider tests pass. Newsletter typecheck passes
for the committed newsletter tree plus this owned adapter patch in an isolated
copy. The active worktree's later campaign caller awaits the separately assigned
batch-key/outcome contract and therefore is not called integrated type acceptance
at this checkpoint.
The native script passes Node and workerd controls: Node redirect origin calls
2, target calls 0; workerd provider calls 4 across a normal and redirected run,
target calls 0, normal verification true and confirmation accepted. The
capability control records `errorMode: throws-TypeError`. No production calls,
sends, shared build output or migration occur.

The earlier combined 87-test check passed before the final redirect cases and
concurrent application/client work. The next combined check exposes two fixture
assumptions outside this increment's ownership: a global timer mock also fires
the newly added request-body deadline, and the bootstrap VM lacks the native
Event used by its updated readiness handling. Both are handed to the integration
owner; this note does not call that combined check accepted until repaired.

Article implication: standards-compatible options and a passing Node test do
not establish the deployed runtime's capability. Record which native runtime was
tested, exercise its positive path, and keep endpoint confinement separate from
provider acceptance and delivery knowledge.
