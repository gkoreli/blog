# Admit a campaign before sending it

November 5 Pacific / November 6 UTC, 2026. This is the manual campaign sender's
bounded part of the [four-hour engineering iteration](32-four-hour-engineering-iteration.md).
No campaign was sent to a real recipient and no production database was queried
or changed by this subtask.

## Failure and decision

The previous `/api/send` handler checked for a campaign's delivery logs, called
the provider, and wrote those logs afterward. Two concurrent requests could both
pass the check before either produced a log. An unreadable successful provider
response or a log failure could also leave no duplicate guard for a retry.

The new consistency rule is one durable application execution per campaign ID.
An atomic insert into `newsletter_campaign_runs` reserves that ID before the
provider call. The table's unique identity and the existing indexed historical
delivery-log check protect both new and already recorded campaigns. Reserved or
interrupted IDs are charged and cannot be automatically replayed.

This is an at-most-one application execution policy. A crash or lost database
acknowledgment can reserve an ID without sending anything. That accepted cost
requires operator inspection; it does not authorize a fresh ID or an automatic
outbox replay. A provider effect and database receipt cannot share one transaction.
The audience is selected once for the execution. An opt-out can still race an
already admitted external call; this change does not make sending and opt-out
one cross-provider transaction.

## Domain and adapter boundaries

- [Campaign vocabulary and command validation](../../../../newsletter/src/campaign.ts)
  define campaign identity, content, recipients, admission, provider knowledge,
  counts and closed observations without HTTP or SQL types.
- [Application service](../../../../newsletter/src/dispatch-campaign.ts) selects
  the audience, admits the operation, delivers batches, records known recipient
  outcomes and confirms its aggregate receipt through explicit ports.
- [D1 repository](../../../../newsletter/src/campaign-store.ts) performs the
  unique insert and permits completion only by the generated owning request ID.
- [HTTP adapter](../../../../newsletter/src/send.ts) authenticates the admin,
  reads a bounded body, parses to `unknown`, validates the command, translates
  provider receipts and maps the result to the existing manual endpoint.

No framework, queue, automatic campaign scheduler or new runtime dependency is
added. Prepared SQL remains the persistence adapter. The additive
[migration 0006](../../../../newsletter/migrations/0006_campaign_admission.sql)
must be applied before the new sender is enabled. The coordinator confirmed
that production schema gate below before authorizing source delivery.
If the table is missing, admission fails closed before any provider call.

The table retains bounded opaque campaign IDs, generated request IDs, content
hashes, recipient counts and aggregate results. It stores no message content or
recipient snapshot. Identity rows have no automatic purge: deleting one would
remove its replay protection. Historical delivery logs retain their existing
separate data and policy.

The chosen command budget is 256 KiB, with the shared five-second body reader.
Subjects are one line of at most 200 characters. Provided campaign IDs are 1–128
ASCII identifier characters, beginning with a letter or number. These are blog
application limits, not Resend limits. Omitting an ID still creates a new one;
callers need a stable supplied ID to protect retries of the same intent.

## Preserve the facts after interruption

Provider acceptance, definite provider rejection, unknown outcome and recipients
not yet attempted have separate counts. An unknown first batch stops later
batches. The old recipient-log schema has no unknown state, so uncertainty is
retained in the campaign aggregate instead of being invented as failed delivery.

Known accepted provider calls remain accepted if their recipient-log write is
unconfirmed. The aggregate marks that interruption separately. A missing final
database acknowledgment sets `receipt_confirmed: false`; it does not assert that
the write definitely never happened. Reserved rows keep null outcome counts
until a receipt is confirmed. This mirrors the provider uncertainty correction
without conflating storage and delivery.

The existing JSON field `sent` is retained for compatibility and means provider
acceptance. It does not establish mailbox delivery. New `unknown`,
`not_attempted` and `receipt_confirmed` fields expose the narrower result. A
completed execution returns 200, an interrupted one 503, and an already admitted
or historically recorded ID 409. Changed content under an admitted ID conflicts.

Ordinary structured logs use the generated request ID, closed stage/reason and
counts. They exclude the supplied campaign ID, subject, message, recipients,
unsubscribe tokens, credentials and provider free text.

## Provider contract

The separately owned batch adapter uses a stable key formed from the opaque
request ID and batch index. Resend documents that batch keys expire after 24
hours; the D1 identity supplies protection beyond that provider window.
[Idempotency contract](https://resend.com/docs/dashboard/emails/idempotency-keys).

Resend's [batch response format](https://resend.com/docs/api-reference/emails/send-batch-emails#response-format)
maps each response entry to the request at the same index. The adapter requires
a complete array with valid distinct IDs before assigning acceptance by index.
Incomplete or malformed success remains unknown. One bounded provider call,
redirect confinement and closed errors are the provider reviewer's separate
increment, `d1e42372`, followed by its response-budget refinement `a1c52478`.
Final combined and native checks use that later source. No automatic batch retry
is introduced here.

## Reproduction and acceptance

[Focused tests](../../../test/newsletter-campaign-admission.test.mjs) execute the
production SQL against isolated SQLite fixtures. Sixteen cases cover concurrent
requests, lost responses, delivery-log and final-receipt failures, historical
IDs, empty audiences, changed content, identity beyond the provider retention
window, omitted-ID compatibility, unknown batch propagation, auth/configuration/command/body gates,
missing schema, a committed admission with lost acknowledgment, logging privacy
and SQL identity/ownership/count constraints. Newsletter typecheck passes.
The combined `newsletter*.test.mjs` suite passes all 157 cases against the
coordinated request-body and provider changes.

The [native control](../../../scripts/check-campaign-admission.mjs) bundles the
actual handlers into workerd and uses actual D1. Its before variant pins
`send.ts`, `email.ts` and `db.ts` to `18606bd`; token generation and the native
runtime are shared. Its after variant uses the new sender and coordinated batch
adapter. Every provider destination is intercepted by the owned local service.

| Constructed condition | Before provider calls | After provider calls | After evidence |
|---|---:|---:|---|
| Concurrent same campaign ID | 2 | 1 | First 200; second 409 while the first call is held |
| Unreadable successful provider receipt, then retry | 2 | 1 | 503 unknown; retry 409; aggregate interrupted |
| Accepted send, actual D1 log-trigger failure, then retry | 2 | 1 | Accepted count retained; receipt interruption; retry 409 |
| Malformed success for 101 recipients | 2 | 1 | 100 unknown, one not attempted; 503 |

The before controller reported 101 sent without valid provider receipts in the
last condition; the after controller preserves the missing evidence. These are constructed
faults, not observed production sends or estimates of prevented duplicate mail.
The public [check receipt](campaign-admission-checks.json) preserves scope,
bundle/migration hashes and aggregates. Raw local captures stay outside Git.

Initial native fixture runs exposed a migration-comment splitter issue and a
provider-simulation distinction: throwing in a local outbound service produced
an HTTP failure rather than an unreadable successful receipt. The corrected
control strips the pinned migrations' line comments and explicitly returns an
unparseable 200 body for that condition. Those fixture corrections are not
production failures.

## Production schema gate

The coordinator separately reports that the frozen migration was applied to the
intended production D1 database after its presence query passed isolated local
D1 and found the remote table absent. The stored `sqlite_master` schema matched
the normalized frozen DDL exactly, and the new table's count was zero. The four
remote statements reported 98 rows read and four written in total; each had one
provider attempt. No subscriber/history query, campaign record or email was
part of that gate. Private captures remain outside Git. This is the coordinator's
production schema evidence, separate from this subtask's local acceptance.

Source delivery, production migration, deployment activation and any live admin
operation remain separate gates. Production schema activation is confirmed;
deployment activation and live operator acceptance remain with the coordinator.
This work does not add automatic sending or claim exactly-once provider delivery.
