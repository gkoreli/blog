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
