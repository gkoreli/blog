# Join the confirmation lifecycle in the native runtime

At **2026-11-06 07:49:36 UTC**, a private fixture exercised the actual newsletter
HTTP handlers, confirmation application, provider adapters, token generation,
Web Crypto verification and production SQL together in local workerd/native D1.
This follows the [application extraction](37-confirmation-application-boundary.md)
and [suppression transition checks](38-suppression-transition-idempotence.md).
The [sanitized receipt](39-native-confirmation-lifecycle.json) records six
selected lifecycle controls and the bundle/migration hashes.

Fresh D1 used production migrations 0001, 0003, 0004 and 0005. An owned local
outbound service intercepted only Siteverify and confirmation-mail destinations.
It supplied valid synthetic proof verdicts and synthetic accepted email IDs.
Before returning each mail acceptance, it checked the corresponding durable
reservation existed with outcome `reserved`. Unexpected destinations failed.
The native IP limiter was a success stub: this control does not test its quota.

| Selected lifecycle | Observed result |
|---|---|
| Fresh address and captured client intent | Native handler returns 202; one reservation precedes one synthetic send; accepted receipt is acknowledged; observations correlate the client intent |
| Same address inside cooldown | Generic 202; no additional send |
| Confirmation GET then POST | GET leaves pending; POST activates, clears the current confirmation hash and revokes issued attempts |
| Already active address | Generic 202; no additional send |
| Signed synthetic bounce, then signup and old-token activation | Webhook returns 200; row is bounced/suppressed and attempts revoked; signup returns 202 without sending; old token POST returns 400 |
| Provider acceptance followed by a D1 receipt-write trigger failure | Public 202; accepted observation has `receiptConfirmed: false`; persisted attempt remains charged as `reserved`; repeated signup returns 202 without another send |

The receipt-failure condition used an actual D1 trigger aborting `UPDATE OF
outcome`, rather than a mocked repository exception. Its accepted observation
establishes only the synthetic provider receipt; the persisted reservation and
failed acknowledgment remain separate facts.

All six controls passed. Total synthetic outbound calls were six verifier calls
and two email calls. Real email calls and production queries were zero. Raw
fixture and receipt remain private under
`/private/tmp/gkoreli-confirmation-lifecycle-20261106/`; the public receipt contains
no address, message, token, signature, secret or request/attempt UUID.

Compatibility date was `2026-03-06`; bundled worker SHA-256 was
`772c1672734c4ea07c32f6a984229b3921b7c3936e960ba7e3d1f238dac71fa6`.
This joined control adds native execution evidence to the earlier focused tests.
It does not run the production router, real Turnstile challenge, native limiter
quota, Resend infrastructure, browser UI or mailbox. It neither repeats nor
extends the historical designated Inbox cycle. Source delivery, Worker activation
and current external acceptance remain separate evidence gates.
