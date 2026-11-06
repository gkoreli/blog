# Confirmation intent, admission and external receipts

November 6, 2026 UTC / November 5 Pacific. Part of the fixed four-hour iteration
in [32](32-four-hour-engineering-iteration.md). This note records the server
application extraction and its acceptance; deployment and actual mailbox
outcomes remain separate.

## Domain language and ownership

`confirmation.ts` owns this site's existing immutable normalized address value,
confirmation mode, send-knowledge receipt and chosen admission limits. It imports
no HTTP, D1, provider or logging API. Normalization remains trim/lowercase, the
existing bounded 254-character address policy and existing syntax check; it is
not a new general email-address parser.

`request-confirmation.ts` coordinates proof verification, token issuance,
transactional admission, one delivery operation and receipt persistence through
explicit ports. It imports provider diagnostic types for observations, but the
domain has no provider dependency. The HTTP adapter retains Origin, JSON,
request-body and native limiter policy; the D1 adapter retains the existing
four-statement admission transaction and its exact SQL predicates.

The relevant aggregate invariant is shared durable admission, not a counter in
one JavaScript object. Cloudflare documents [D1 batch execution](https://developers.cloudflare.com/d1/worker-api/d1-database/)
as sequential transactional statements with rollback on failure. The [native D1
wrapper](https://github.com/cloudflare/workerd/blob/3189460a0784060d4618d810de56551578ce73b6/src/cloudflare/internal/d1-api.ts)
at inspected upstream revision `3189460a` routes the ordinary binding through its
primary session. That November 6 upstream snapshot is not asserted to be the
source embedded in local workerd `1.20260301.1` or the production service; the
local D1 controls below
exercise the actual SQL rather than emulate the budget with a mock counter.
This uses the domain/application separation described by [Microsoft's DDD
architecture guidance](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/ddd-oriented-microservice),
without adopting a framework, service split or general repository abstraction.

Only admitted results contain a usable unsubscribe token. Unknown SQL wire
fields are narrowed before returning that result; capacity and unchanged states
cannot accidentally reach the sender through a nullable token check. The public
response remains generic 202 for accepted or deliberate no-send states.

## Knowledge survives persistence and adapter failures

A provider-accepted receipt and an acknowledged receipt write are separate facts.
The store now requires a successful UPDATE acknowledgment affecting exactly one
attempt. An absent or malformed acknowledgment does not prove the write failed;
it produces `outcome_write_unconfirmed`, preserves known acceptance and never
replays delivery. Accepted provider results still receive 202 when the receipt
acknowledgment is lost. Admission stays charged in every case.

Independent review reproduced an additional application-port escape: a delivery
adapter can reject after a possible external effect. Ordinary provider transport
failures were already returned as receipts; this control exercises an unexpected
port exception. The application now records only unknown outcome with no
provider ID/status, emits `delivery_exception`, and returns check-inbox/ten-minute
guidance. It does not invent provider attempt counts or elapsed time. A lost
receipt acknowledgment on this path is recorded independently too.

Verification and delivery observations have finite stage/reason types. The
verification failure reason is sealed to the existing fourteen static values.
Delivery events now expose bounded attempt, elapsed, retry and stop diagnostics
and `receiptConfirmed`. Recipients, token values, provider IDs and arbitrary
exception/provider text are absent from routine application observations. Stored
consent/source fields and infrastructure request-history policy are unchanged.

## Acceptance and review

- Fourteen focused application/adapter cases cover immutable normalization,
  invalid proof before issuance/admission, no-send states, admission before one
  effect, retained opt-out identity, admission failure, three outcome/write-loss
  combinations, missing UPDATE acknowledgment and unexpected delivery escapes.
- Existing real-handler SQLite tests preserve concurrency, cooldown/day/global
  ceilings, rollback, retry identity, old-token compatibility and suppression.
- Workspace typecheck passes after the extraction. The subsequent integrated
  test receipt records the complete final tree; earlier counts remain dated.
- The saved `repro/d1-admission.mjs` is an active caller. Independent review found
  it still supplied a plain string. It now parses the domain value and requires
  a fresh explicit output path, avoiding replacement of its old JSON receipt.
  A fresh local workerd/D1 run at 07:20:28 UTC passes all five controls: fresh
  migrations; 48 concurrent mixed-route admissions producing one reservation;
  three address admissions across cooldowns; four 60-request waves producing
  100 admissions total under 25/hour and 100/day; and subscriber-write rollback.
- Ten paired native request/Web Crypto/D1 controls from Research 36 also pass
  against the integrated extraction, with zero outbound provider calls and zero
  production calls. These use constructed request streams; they do not measure
  incoming wire framing or real browser disconnect behavior.

Private fresh captures are `/private/tmp/gkoreli-confirmation-domain-admission-20261106.json`
and `/private/tmp/gkoreli-newsletter-request-boundaries-20261106-integrated/native.json`.
Historical committed outputs remain intact. Neither these local controls nor a
source push establishes current Worker activation, actual delivery or a change
in subscriber completion rates.

## Final domain contract — 07:49 UTC

A compiler control showed that a class with only a public readonly value still
accepted an unchecked structural lookalike. The address now keeps its normalized
value in a private field and exposes a getter. The factory is the typed entry
point; an automatic compiler fixture rejects lookalikes and mutation. Native D1
still reads the value explicitly. No new address syntax or wire policy is added.

The application also snapshots the complete command before its first await. A
paired synthetic-port control mutates the caller's DTO during proof verification:
`ddb71a2d` admits/sends/records the replacement identity, while the new version
keeps all three on the original intent. This is a public application-boundary
control, not evidence that the existing HTTP adapter exposed its private command
to another caller. The original `.ts` private harness was interpreted as CommonJS
by the loader; an unchanged `.mts` source snapshot fixes that harness before
the measured comparison. Private results preserve that distinction.

Sixteen application/compile-contract cases pass, newsletter types pass, and five
fresh native D1 controls pass after the private-field change. [Research 39](39-native-confirmation-lifecycle.md)
then exercises the joined final handlers, application, provider adapters, Web
Crypto and native D1 through six selected lifecycle/failure cases. Only outbound
provider replies and limiter success are synthetic. Its acceptance includes an
actual D1 trigger rejecting the outcome UPDATE after synthetic mail acceptance:
202 remains honest, receipt acknowledgment is false, the reservation stays
charged and a repeat does not send again.

These final controls do not send a real message. Implementation is frozen after
this bounded domain check; subsequent work is article/release/production
association unless a concrete defect requires a repair.
