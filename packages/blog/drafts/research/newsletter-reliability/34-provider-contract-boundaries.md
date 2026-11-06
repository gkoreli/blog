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

## Third bounded increment — campaign batch adapter (2026-11-06)

This increment preserves the first repair (`d63ea5b`) and the second repair
(`9f6346f`). It changes only the provider boundary; the separately owned campaign
admission work decides whether a campaign may start. Resend's finite idempotency
window is extra protection, not durable campaign admission.

`sendNewsletterBatch` now accepts an optional sixth `idempotencyKey` argument.
Each result keeps `email`, `resend_id` and `error`, adding
`outcome: accepted | failed | unknown`. Only a complete response with one valid,
unique ID per requested recipient produces accepted results with a null error.
The [Resend batch contract](https://resend.com/docs/api-reference/emails/send-batch-emails)
assigns response IDs by request index; missing, extra, duplicate or malformed
rows make the entire receipt unknown. Acceptance describes the provider receipt,
not mailbox delivery. Definite request rejection is called failed; transport,
408/409/server failures and malformed success remain unknown. All errors are
closed static codes, with no provider text, tokens or addresses copied into them.

The audience is copied before awaiting the provider so receipt mapping cannot be
changed by a caller mutating its input. The optional identity is supplied as an
Idempotency-Key header after bounded printable-ASCII validation. Empty batches
make no request; batches above the documented 100-message maximum are rejected
before effects. Existing callers may omit the key. There is exactly one provider
call per nonempty admitted batch, with no automatic replay.

Fetch uses manual redirects with explicit 3xx refusal. One eight-second elapsed
signal covers both request and response reading. The response reader separately
observes that signal, caps declared and received bytes at 64 KiB, validates UTF-8,
and releases its lock. Cancellation is initiated without waiting for an arbitrary
stream cancel hook. These are application limits, not claimed provider defaults.

The new [batch tests](../../../test/newsletter-batch-provider.test.mjs) cover ordered
acceptance, optional/supplied identity, malformed/partial/extra/duplicate IDs,
closed rejection and uncertainty outcomes, redirects, broken JSON/UTF-8,
body-size enforcement without Content-Length, stalled stream cancellation,
nonsettling cancellation hooks, caller mutation and pre-effect input guards.
The focused provider, batch and campaign set passes 91 tests, and the active
newsletter package typecheck passes at this checkpoint.

The [native script](../../../scripts/check-newsletter-provider-redirects.mjs) now
also runs the batch adapter. Node's three redirected adapter calls reach the
owned origin three times and the redirect target zero times. Workerd's normal
batch returns two accepted IDs; redirected, partial and oversized receipts
remain unknown, each after one provider call and zero redirect-target calls.
An actual unfinished response body returns provider_timeout after 8,008 ms in
this local run. The intentional default-follow counterexample remains separate
and still forwards its synthetic body once. No external provider call, email,
production change or migration is made by these controls.

## Fourth bounded increment — response consumption (2026-11-06)

The first three increments remain separate accepted code checkpoints. This repair
adds an adapter-specific [provider response reader](../../../../newsletter/src/provider-response.ts),
without changing the request-body boundary used by webhook/campaign handlers.
Each provider attempt records its deadline before fetch: five seconds for
Siteverify and eight seconds for confirmation/batch delivery. Response headers
do not grant another full timeout. Reading observes both the original signal and
an independent timer for the remaining time, then validates bounded UTF-8 JSON.
This covers custom response streams which do not inherit a fetch signal.
Actual and declared body caps are 16 KiB for Siteverify/confirmation and the
existing 64 KiB for batch. Cancellation hooks are never awaited during rejection.

Confirmation IDs now use the batch structural check: nonempty, at most 128
characters, no leading/trailing whitespace or control characters. The previous
sender reproduced accepted results for a single space or newline; these now
remain unknown after the existing bounded retry. This does not assert that any
structurally valid synthetic ID exists at the provider.

A first HTTP 408 now remains unknown and stops after one call, with the existing
HTTP-rejected stop diagnostic. That diagnostic names the transport stop, not
proof of nonacceptance. This is a conservative application policy: [RFC 9110
section 15.5.9](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.9)
describes a request reception timeout and permits repeating an outstanding
request; it does not prescribe our email knowledge model. The [Resend error
contract](https://resend.com/docs/api-reference/errors) does not document 408 as a
permanent email validation rejection. No claim is made that a conforming origin
necessarily accepted an incomplete request. We decline to treat this status alone
as an application-level receipt proving that an email was never accepted.

The new [response tests](../../../test/newsletter-provider-response.test.mjs)
exercise malformed IDs, first 408, declared/actual byte caps in both adapters,
and stalled bodies detached from transport cancellation. Controlled elapsed time
consumes all but 20 ms before headers and verifies each original attempt has only
that remainder; neither adapter receives a fresh body timeout. The earlier rate
wait test now mocks only the short wait, allowing independent deadline timers
to remain real. All 163 combined newsletter/provider/campaign/request-boundary/
diagnostics tests pass, and the active newsletter typecheck passes.

Native workerd controls accept normal requests and reject oversized provider
replies, whitespace IDs and first 408 as expected. An independent 100 ms body
budget, with 60 ms deliberately spent awaiting headers and no transport abort
signal, stops after 107 ms in this local run. The batch stalled-body control still
stops at its original eight-second budget (8,003ms here). This establishes local
runtime behavior and bounded policy; it does not measure production latency or
current provider behavior. No provider calls, emails or deployment occur.

## Fifth bounded increment — elapsed-read timeout cleanup (2026-11-06)

A follow-up review reproduced a cleanup gap in the fourth increment's response
reader. If a body read completes after the deadline before the timer callback
runs, the elapsed-clock check returns timeout. Previously that path released the
reader lock and cleared its pending timer without cancelling the unread body.
A detached response stream therefore remained open even though the caller had
already received an honest unknown/unavailable result. This was a resource
cleanup defect, not an accepted response or an extension of the returned result's
budget.

The elapsed-read timeout path now invokes the same nonblocking cancellation used
by the timer and abort listener before returning. The new regression advances a
controlled clock during the stream's pull, leaves the signal unaborted, and makes
the cancel hook never settle. It verifies timeout, initiated cancellation and a
released reader lock without waiting for that hook. The three focused provider
suites pass 91 tests; newsletter typecheck passes. No public result shape,
provider retry policy, action compatibility or application behavior changes.

The existing local native controls still accept ordinary provider requests,
reject redirect targets, and enforce response size/receipt boundaries. A detached
100 ms reader budget with 60 ms spent awaiting headers stops after 103 ms in this
run. These local timing observations are not a production CPU-inclusive real-time
limit: [Cloudflare's timer documentation](https://developers.cloudflare.com/workers/runtime-apis/performance/)
explains that deployed performance/Date clocks advance after I/O, while local
Wrangler clocks also advance during CPU execution. The bounded response sizes
limit decoding/parsing work; the deadline controls establish waiting/read policy.
No production calls, emails or deployment are part of this repair.
