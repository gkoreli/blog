# Can the failed subscriptions be recovered?

Checked September 7 UTC, 2026. No recoverable pending subscription was found in the current database. For the inspected verification rejection, the application never persisted the submitted address or called the email provider. The retained reports cannot supply an address or a count of distinct people.

## What exists, and what does not

| Source | Completed check | Recovery value and limit |
|---|---|---|
| Current D1 subscribers | One active row from April 8; no pending, unsubscribed, or bounced rows | No current pending address to resume. Cleanup means this is not a lifetime signup census |
| Client-error reports | Five subscription HTTP 400 reports; the explicit report contains a generic message, not form contents | Evidence of reported failures; no submitted addresses. Shared browser properties do not identify a person |
| Subscription handler and inspected Worker rejection | `invalid-input-secret` rejection occurs before subscriber lookup/write and mail scheduling | This request has no subscriber or provider record to recover. The other four reports have the same generic verification message, but their detailed server reasons were not separately inspected |
| Campaign delivery logs | No rows | These logs do not cover confirmation sends, so they cannot clear historical confirmation failures |
| Resend sent-email and API logs | Both read endpoints returned HTTP 401, `restricted_api_key`; the existing key is restricted to sending | Older attempts that reached sending may be identifiable here. No provider history or addresses were retrieved |
| D1 Time Travel | A read-only bookmark lookup for September 6 at 02:59 UTC succeeded | Historical state can contain only data previously written. No historical rows were inspected and no restore was performed |
| Repository backups | No separate subscriber export or backup was found in the repository scan | This does not establish that the owner has no backups elsewhere |

The logger intentionally avoids collecting form contents. That is a useful separation: diagnostics should explain a failure without becoming another address database. The audit found broader redaction weaknesses for arbitrary error text; those do not mean the five generic subscription reports contain the entered addresses.

## Full-column log recheck — 06:11 UTC

After the owner asked whether logs might still contain an address, the investigation read every column of every retained client-error row. All thirteen records were returned, including the same five signup failures. No string field matched an email-address pattern; the subscription messages remain generic and no request-body field exists. [Sanitized capture](recovery-log-recheck.json). This read cost thirteen rows read and zero writes.

The broader claim that no address could exist anywhere would exceed the evidence. Only one detailed Worker rejection was inspected, and full Worker/Resend history access remains incomplete. Native dashboard access failed again during the recheck. A transient Wrangler authentication failure cleared after checking the existing login; it is not evidence of a production subscription error.

## The remaining historical lead

Resend's [sent-email API](https://resend.com/docs/api-reference/emails/list-emails) exposes recipients and sending outcomes. An authorized read of retained confirmation sends could identify addresses that passed verification and reached the provider, including pending rows later deleted by cleanup. The existing application's send-only key cannot perform that read, and native browser access failed during this follow-up. A signed-in Resend dashboard review remains open work.

Resend documents [30-day email-data retention](https://resend.com/docs/dashboard/webhooks/how-to-store-webhooks-data), with flexible retention for Enterprise. This is a provider limit, not a claim that this account has thirty days of matching messages. It cannot recover a September request that stopped before sending, or establish the April incident's recipients from ordinary current retention.

D1 [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) retains seven days on the Free plan and thirty on Paid. The documented restore changes the existing database in place, and historical clone/fork is not supported. This database also holds analytics. A speculative rollback would change unrelated production state and still could not recover a request never written. A bookmark is not a recovered subscription.

## Credential repair checkpoint

The ignored local environment file contains an existing Turnstile secret. A direct Siteverify request using that secret and a synthetic invalid response returned HTTP 200 with `invalid-input-response`, rather than `invalid-input-secret`. This suggests the local credential is recognized. It does not validate a real browser token or establish that the secret belongs to the public widget served by the blog.

A read of that widget's configuration returned HTTP 403 with the available Wrangler OAuth credential. Native dashboard access also failed. The widget match and end-to-end signup remain unverified; no production credential was changed during this investigation. TASK-0124 requires the matching credential and a controlled confirmation test before calling the flow repaired. Secret values are excluded from captures and public artifacts.

## Recovery action

For the friend, the concrete recovery path is to restore and validate signup, then have him submit again and follow the confirmation message. We have not sent him anything or activated an address. Finding an old confirmation recipient would establish that the system attempted a message, not that the mailbox owner completed subscription.

For future failures, evaluate a bounded retry record for validated subscription intent, with explicit retention and send controls. Keep it separate from operational logs and active subscribers. An outage must not silently activate an address, and persisting an address before a challenge has its own abuse and storage costs. This is proposed work, not an implemented recovery queue.

The current result is zero recovered addresses. Historical provider review is incomplete; the total number of affected people remains unknown.
