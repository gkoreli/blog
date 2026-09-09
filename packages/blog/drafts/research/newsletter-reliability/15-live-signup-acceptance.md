# Live signup acceptance — September 9, 2026 UTC

The authorized test completed: a real browser challenge passed, Resend accepted one confirmation, the message appeared in Gmail, and its confirmation POST activated the subscription. The first attempt also exposed a current `invalid_secret` failure. Installing the existing recognized secret in the production Worker repaired that failure. Gmail placed the confirmation in **Spam**, so inbox placement remains unfinished work.

[Sanitized machine receipt](repro/live-signup-results.json). Implementation: `86dad93`; the earlier local tests, migration and activation receipts remain in [10-verification.md](10-verification.md). This check used one owner-designated address. Its exact authorization, original subscriber snapshot, tokens, provider ID, request captures and SQL are private, outside Git.

## Failure, binding repair and completed cycle

| UTC time | Observation or action | What it establishes |
|---|---|---|
| 02:19:23 | Targeted preflight found the designated address already active | A normal signup should send no new confirmation; this was not a newly recovered reader |
| 02:26:10 | Browser POST returned 503; Worker `dd8e6377-19ee-40e3-8fa5-85e4c4283073` logged `verification_failed`, `invalid_secret` | A fresh configuration failure, separate from the September 7 capture and earlier owner-reported repair |
| 02:32:03 | Existing ignored local secret with a deliberately invalid response returned Siteverify HTTP 200 / `invalid-input-response` | The credential was recognized; this synthetic probe alone did not establish its match to the live widget |
| 02:32:24 | `wrangler secret put TURNSTILE_SECRET_KEY` installed that existing secret; deployment `77144fcf-5d96-42d0-ae1d-64d316cf793f` activated version `cb0c95ff-9409-402b-9999-1aa16d43bc89` at 100% | The Worker binding changed. No widget key was generated or rotated, and no application code was changed during this test |
| 02:32:56 | A fresh real form submission returned 202 / `unchanged` on that version | The live widget and installed secret worked together; the active address received no new mail |
| 02:33:40 | Ordinary unsubscribe POST returned 200 and the Unsubscribed page | Began the authorized re-subscription cycle; the original row and stable unsubscribe token were preserved privately beforehand |
| 02:34:59 | Real form submission returned 202; version `7501d89c-c3ac-4b05-9ec3-748eb4d0a800` logged `reserved`, then `accepted`, provider HTTP 200 | One admitted confirmation succeeded after the next code deployment as well; its opaque attempt ID links the request to the private ledger record |
| 02:36:22 | Targeted D1 reads found pending state and one accepted attempt with a provider ID | Persistence and provider acceptance are recorded separately from activation |
| Approximately 02:37–02:38 | Scoped Gmail search found one matching confirmation, displayed at 19:35 PDT in Spam; its first-party link opened the confirmation preview | Observed mailbox arrival and Spam placement for this one message |
| 02:38:19 | Targeted read after opening the GET preview still found pending state | Fetching the link did not activate the subscription |
| 02:38:29–02:38:58 | Confirmation button POST displayed “You're in.”; final D1 check found active state, a cleared subscriber confirmation hash and the accepted attempt revoked | Completed activation. Original creation time and unsubscribe token were preserved. No direct SQL repair or rollback was needed |

The secret deployment is documented separately because [Cloudflare's command creates and immediately deploys a Worker version](https://developers.cloudflare.com/workers/configuration/secrets/#adding-secrets-to-your-project). Cloudflare [defines invalid-secret errors separately from invalid response tokens](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/#error-codes-reference); both sources checked September 9 UTC. The old deployed secret is unreadable through normal secret metadata, so this check does not attribute who installed it, when it became invalid, or whether earlier repair attempts ever worked.

The subsequent code deployment `ccb73481-4186-454e-b510-457a17a450aa` activated version `7501d89c-c3ac-4b05-9ec3-748eb4d0a800` at 02:34:24 UTC. Runtime versions are known from the captured requests; deployment timing is not an exact source-commit attestation. Other repository work was deploying concurrently.

## Mailbox result and remaining delivery work

Gmail labeled the message Spam and described it as similar to messages previously identified as spam. The confirmation link remained usable, and the test completed from that message. No message was marked “not spam,” no filter was created, and no extra confirmation was requested to improve the apparent result.

A public DNS check at 02:41:50 UTC returned SPF at `send.gkoreli.com` and a DKIM record at `resend._domainkey.gkoreli.com`. It returned no TXT answer for `_dmarc.gkoreli.com` through the local resolver. This is a configuration lead, not a diagnosis of Gmail's decision. The original-message authentication headers were not successfully inspected; competing Chrome activity interrupted UI actions. DNS record presence does not prove this message passed authentication. [TASK-0145](../../../../../docs/tasks/TASK-0145-investigate-gmail-spam-placement-for-subscription.md) tracks the bounded follow-up.

Production bounce/complaint delivery remains [TASK-0142](../../../../../docs/tasks/TASK-0142-connect-resend-bounce-and-complaint-events-to-subscriber.md): the earlier deployment inspection found no `RESEND_WEBHOOK_SECRET`, and this test did not configure the provider endpoint or verify a signed event. General error-ingestion protection and alerts, and historical recovery, also remain open. A completed test does not establish that every reader can subscribe, that future messages reach Inbox, or that old failed addresses were recovered.

## Query cost and private evidence

Seven direct diagnostic statements each read one row and wrote zero: initial state (1), private rollback snapshot (1), pending state and attempt lookup (1 + 1), state after preview (1), final state and attempt lookup (1 + 1). Total: **7 rows read, 0 rows written**. The same row was read repeatedly; this does not mean seven subscribers. These totals exclude Worker SQL behind the public endpoints, which the HTTP receipts do not meter. No broad subscriber or client-error scan ran, and migration 0005 was not repeated.

Private captures are in `/Users/goga/Documents/goga/private-evidence/newsletter-reliability/2026-09-09/live-signup/`, with owner-only directory/file permissions. The Worker tail was restricted to the testing connection's IP and confirmation log label, and stopped after acceptance. That filter alone does not identify a person; the controlled action sequence, timestamps, version IDs and matching target ledger entry support this test's attribution. Shared Chrome activity caused interrupted and delayed UI actions; the database and server receipts were used to verify outcomes before any retry.

The address is left active. The article remains an unpublished draft in this worklist folder.
