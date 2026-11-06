# Preserve the suppression interval on duplicate events

November 5 Pacific / November 6 UTC, 2026. A bounded follow-up to the
[four-hour engineering iteration](32-four-hour-engineering-iteration.md).
This note records local source acceptance, not current production behavior.

## Reproduction and rule

The bounce and complaint SQL helpers previously assigned their retention
anchor to `datetime('now')` on every invocation. In actual production SQL against
isolated SQLite, an already bounced row with an 89-day-old `bounced_at` received
a new timestamp on another bounce. An already complained row behaved the same
way for `unsubscribed_at`. A duplicate invocation could therefore rescue an
otherwise eligible 91-day-old inactive row from cleanup.

[Resend's webhook ingester](https://resend.com/changelog/webhooks-ingester)
explicitly accounts for duplicate events. This application already suppressed
the address repeatedly without activating it; the defect was its repeated
extension of the blog's inactive-row retention interval.

The [SQL repair](../../../../newsletter/src/db.ts) preserves the existing
transition policy:

- Bounce sets `bounced_at` when entering `bounced`, or repairs a missing anchor.
  Another bounce while already bounced keeps the anchor.
- Complaint sets `unsubscribed_at` when entering the unsubscribed/complaint
  state, or repairs a missing anchor. Another complaint in that state keeps it.
- A new complaint after ordinary unsubscribe starts its suppression interval.
  Existing explicit confirmation opt-out already starts an interval on first
  application and preserves it on repeats.
- Bounce continues to preserve an existing suppression reason; complaint
  continues to assign `complaint`. The stable opt-out token is preserved.

Both helpers still revoke confirmation attempts and change subscriber state in
one database batch. A failed subscriber update rolls back token revocation.
No migration, dependency, event ledger or new runtime abstraction is added.

This is idempotence for an unchanged suppression state, not event deduplication.
Without persisted event identity, the application cannot distinguish a new
cross-family transition from a replay after an intervening transition. A bounce
after complaint, then complaint again, retains the existing state-transition
semantics and can start another interval. Signed events arriving after deletion
can also affect a newly retained row for the same address. This repair does not
claim permanent suppression, exact event ordering or a maximum lifetime across
new suppression transitions. The existing 90-day cleanup policy remains.

## Checks and limits

[Fifteen focused controls](../../../test/newsletter-suppression-transitions.test.mjs)
execute the actual production migrations and SQL on isolated SQLite with real
transactions. Before the patch, eleven passed and four failed: duplicate
89-day anchors and cleanup at day 91 for both event families. Afterward all
fifteen pass. They also cover transitions from active/pending, missing anchors,
complaint after ordinary unsubscribe, explicit confirmation opt-out, retained
opt-out tokens, cross-family reason policy, and actual trigger-induced rollback.
These are constructed database conditions, not observed production events.

The combined newsletter suite passes **172/172**, and newsletter TypeScript
checks pass. The SQLite fixture deliberately executes the application SQL; it
does not emulate mutations with JavaScript state. These controls do not replace
native D1 deployment acceptance, prove external webhook delivery, or establish
current production behavior. No production query, schema mutation or email was
needed. The coordinator owns source delivery and deployment acceptance.

## Subsequent native D1 acceptance

At **2026-11-06 07:27:59 UTC**, a separate private fixture bundled the actual
`db.ts` helpers into local workerd at compatibility date `2026-03-06`, applied
fresh production migrations to native D1, and passed **eight controls**. For
both bounce and complaint it preserved the 89-day same-state anchor, assigned a
fresh anchor on transition from active, deleted the 91-day row after a repeated
event and cleanup, and rolled back token revocation/state when an actual D1
trigger aborted the subscriber update. The earlier SQLite counts above remain
separate evidence.

Worker bundle SHA-256:
`6b0ddc51080a24188d6555df117fd9a8bd8fd4e9a95a0397b88e3f72898e52e5`.
Imported database-source SHA-256:
`26624b6a03c6378e3c2b7bf98b1ccaa277ea6dd2ac65e7df6ea58a80cee98b0a`.
Private fixture and raw receipt remain under
`/private/tmp/gkoreli-suppression-native-20261106/`. External network was rejected;
production queries and email calls were zero. This establishes the changed CASE
SQL and transactional rollback in local D1; deployment activation and external
webhook behavior still require their own evidence.
