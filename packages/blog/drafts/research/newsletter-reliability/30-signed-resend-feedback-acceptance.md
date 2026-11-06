# Signed Resend feedback is connected and suppression is measured

November 5, 2026 Pacific / November 6 UTC. Follows the account-access limit in [Research 28](28-managed-verification-and-diagnostics.md). The owner identifies two possible existing logins and completes GitHub/Resend sign-in. The authenticated account now shows verified `gkoreli.com`, the exact earlier confirmation marked Delivered and the earlier inert control marked Bounced. Its Webhooks page initially has no endpoints. This directly establishes the correct sender scope; the team's shared display name alone had not.

## Setup and activation

One enabled endpoint now targets `https://gkoreli.com/api/webhooks/resend`, listening only for `email.bounced` and `email.complained`. Its signing secret is read through the account UI, stored privately and installed as `RESEND_WEBHOOK_SECRET`. The other four required Worker bindings remain present. No sender/Turnstile key is rotated and no broader API credential is created. The wrong-team endpoint from the earlier attempt is not reused; its last observed state remains disabled.

Native deployment metadata allocates Worker `8a43b7c0-c675-4372-b29c-cfc5888729de` at 100% at 05:40:45 UTC. This is configuration activation, with no application source change. [Machine receipt](resend-feedback-live-acceptance.json) records the existing webhook source hash and last source commit separately. A fresh unsigned POST returns 401, rather than the unconfigured 501, without a database operation on that rejection path.

## Native checks and live provider controls

Before any production fixture write, the actual compiled handler runs in local workerd/D1 against the current fresh-install newsletter migrations. Locally signed bounce and complaint events produce their intended state transitions; an unsigned request is rejected. The exact preflight, insert, readback and cleanup SQL also run natively. A cleanup with the wrong source removes zero rows. The first sandboxed run cannot open loopback; the authorized local run passes. That host restriction is separate from service behavior.

Resend [documents inert test addresses](https://resend.com/changelog/sending-test-emails) for bounce and complaint simulations. After a targeted production preflight confirms neither test address exists in `subscribers`, the control inserts exactly two **pending**, labelled test rows. They are never active newsletter recipients. Two send-only API calls use those native test addresses and fixed per-control idempotency keys. No email is sent to a real person and no fresh signup or confirmation cycle is performed.

Resend's endpoint view records both callbacks as Success, HTTP 200, one attempt each. The payload's provider email ID matches the corresponding exact send receipt for each control. The server accepts these through its configured Svix signature gate. Independent D1 readback establishes:

| Native event | Stored status | Suppression reason | Confirmation hash |
|---|---|---|---|
| `email.bounced` | `bounced` | `bounce` | Cleared |
| `email.complained` | `unsubscribed` | `complaint` | Cleared |

The existing admission predicate excludes bounced or suppressed rows. This is source-inspected behavior, not an additional live attempt to send to either suppressed control. The provider's [event reference](https://resend.com/docs/webhooks/event-types) distinguishes permanent rejection from a spam complaint. Its [retry/replay guidance](https://resend.com/docs/webhooks/retries-and-replays) remains relevant to later delivery failures; no historical event replay or backfill is claimed here.

Exact ID/email/source/status/reason/null-token cleanup guards remove only the two owned fixtures. A final targeted read confirms both test addresses absent. Raw provider/event IDs, signing secret, fixture tokens, dashboard payloads and SQL receipts remain private. The endpoint stays enabled after cleanup.

## Metering and acceptance boundary

Five CLI query groups, with seven statements, report 18 reads and 16 writes: preflight 2/0, seed 8/14, readback 4/0, guarded cleanup 2/2, absence 2/0. Seed and cleanup each change exactly two logical subscriber rows; the reported D1 write meter is not a subscriber count. The webhook handler's additional database work is not metered by those CLI receipts. No broad reader scan, schema migration or real-subscriber repair occurs.

TASK-0142's endpoint, signing-secret and signed-event/suppression acceptance is complete. This later setup result does not rewrite the historical November 5 16:33 UTC Inbox/signup receipt or prove population deliverability and future callback completeness. The new article revision can cite the completed feedback as a separate follow-up; its writing needs no further production tests.
