# Subscription confirmation controls

Implemented locally September 9, 2026 UTC. Deployment and live-email acceptance are separate receipts in [10-verification.md](10-verification.md). The [worklist index](00-worklist-index.md) is the entry point; [13-data-access-decision.md](13-data-access-decision.md) records the ORM question.

## Decision and threat

Keep the blog's Worker, shared D1 database, Resend sender, and Turnstile. The public endpoint remains unauthenticated: it accepts a request to verify an address, not permission to subscribe that address to future articles. The abuse to bound is the first confirmation email, which can annoy a mailbox owner even when double opt-in prevents newsletter activation. No observed bombing attack is claimed by the September incident evidence.

No queue, new service, runtime dependency, provider migration, or private ORM was added. We own a small integration and its failure policy. This decision is scoped to confirmation requests; the separate authenticated campaign sender and general diagnostic ingestion still have their own worklists.

## Admission before email

`confirmation-request.ts` handles both public POST routes. It rejects a supplied foreign Origin, validates the actual JSON body against 4 KiB, normalizes the supplied address with trim/lowercase, checks the existing native per-IP limiter, and verifies Turnstile before storage. Missing-origin requests can be legitimate direct clients; Origin is not authentication. Address normalization does not collapse provider-specific aliases into a mailbox identity.

Turnstile has a five-second fetch deadline. Missing configuration, network errors and verifier service failures return 503; invalid proof returns 400. Both paths send nothing. Hostname must match the request host. New widgets set action `subscribe`; absent or empty action remains compatible with the previously deployed client. Unexpected nonempty action is rejected. A verifier outage can still stop signup, so the client reports a retryable service failure rather than silently weakening the policy.

`confirmation-store.ts` uses one D1 batch transaction. A conditional insert tests the shared budget and reserves an attempt; guarded subscriber writes run only if that reservation exists. A failed statement rolls back the batch. It does not use separate application-level read/check/write steps.

| Scope | Rolling limit |
|---|---:|
| One normalized address | One admission per 600 seconds |
| One normalized address | Three admissions per 24 hours |
| Both endpoints together | 25 admissions per hour |
| Both endpoints together | 100 admissions per 24 hours |

These are starting blog policy values, not measured optimal thresholds, promises to accept all genuine demand, or Resend plan limits. A burst of genuine interest may hit the aggregate ceiling. An attacker who passes verification may consume it. The ceiling bounds confirmation admissions, not all Worker requests, D1 reads, campaign sends, or provider API calls.

Every `reserved`, `accepted`, `failed`, and `unknown` attempt stays charged. Imported `legacy` token rows do not represent measured new admissions and are excluded. Therefore the guarantee covers the new admission path after activation; it cannot retroactively cap sends by the old deployment or reconstruct its history. D1 uses its own current time for the windows. The native limiter remains an additional per-IP signal with Cloudflare's documented locality and consistency limits.

## Delivery and truthful retries

An admitted request awaits Resend. One operation uses at most two eight-second fetch attempts, with up to three seconds of waiting after a provider rate-limit response, the same serialized body and the same `newsletter-confirmation/<attempt-id>` idempotency key. A provider response with a valid message ID records `accepted`; rejection records `failed`; a timeout, malformed success response or ambiguous provider failure records `unknown`. The ID and HTTP status are stored when available. A longer or malformed provider wait hint stops the inline retry rather than triggering an early call. No response body, address, or raw token is included in routine confirmation diagnostics.

API acceptance is not inbox delivery. The D1 transaction does not include Resend. If the Worker stops after reserving but before sending, the row remains charged without a delivered email. If Resend accepts but the outcome update fails, the reservation remains and the handler does not start a new send. This is not an outbox and provides no durable background replay. The owner has chosen a bounded interactive retry, not promised crash recovery.

Active, suppressed and address-limited cases return generic 202 without a send. Global capacity returns 429. Failed or unknown delivery returns 503 with a 600-second retry hint. The browser keeps the form and email available after 202, because a generic response cannot promise a new email exists. It tells the reader to check the inbox and spam folder before retrying after ten minutes. It reports static diagnostics for missing/late widgets, widget failure, expiry, unsupported browsers, request failures and timeout; it never falls back to a blank verification token.

## Tokens, opt-outs, and state

Each admission has a hashed confirmation token with its own 24-hour lifetime. A new request does not invalidate an earlier unexpired email link. Existing pending tokens are imported during migration; a guarded compatibility statement also captures tokens written by the old Worker between migration and activation.

GET confirmation links display a page. POST activates an eligible pending address and revokes every issued token for that address. This prevents an email scanner's GET alone from activating a subscription; it does not establish that every POST comes from a human. Expired, unknown and previously used tokens cannot activate a later subscription cycle or revoke its new tokens.

The unsubscribe token remains stable while the row is retained, so old footer links keep working across ordinary resubscription. Browser GET previews the action, POST applies it; mailbox-provider one-click POSTs remain supported. An ordinary unsubscribe permits a later fresh confirmation request. A complaint, bounce, explicit confirmation-mail block, or conservatively migrated legacy inactive state suppresses new admissions. All those state changes revoke confirmation tokens.

Confirmation-mail opt-out also unsubscribes from the newsletter. An already admitted provider call can finish after an opt-out; there is no atomic cancellation across D1 and Resend. The confirmation block is advertised as up to 90 days because existing nightly inactive cleanup deletes that state after 90 days. A repeated block does not restart an existing inactive-state retention clock. It is not a permanent suppression list. Old unsubscribed rows did not distinguish complaints from ordinary opt-outs; migration preserves that uncertainty as `legacy-inactive` rather than silently reactivating them.

## Data and retention

Migration `0005_confirmation_admission.sql` adds `suppression_reason` to subscribers and one indexed `confirmation_attempts` table. The table contains address, opaque attempt ID, token hash, reservation/expiry timestamps, revocation flag, outcome and optional provider ID/status. It is private operational state, not public analytics. Cleanup removes attempts older than seven days. Pending rows expire after the latest token's lifetime; active rows remain until opt-out, while inactive rows follow the existing 90-day policy.

Routine confirmation logs contain opaque attempt ID, route mode, stage, static reason, and provider HTTP status. They do not retain the submitted address for pre-admission failures. That is an intentional privacy boundary and does not solve historical address recovery. Signed webhook handlers log event type and recipient count only. Worker request logs and the email provider have separate storage/access policies; this code does not establish their retention or redaction behavior.

## Rollout and acceptance

1. Run the handler/client regressions, package typechecks, and actual local workerd D1 migration/concurrency/rollback probe.
2. Inspect the live schema with a bounded metadata check. Do not rerun old incident searches or select subscriber addresses. If quota access fails, stop and use service metadata to resolve access.
3. Apply newsletter migration 0005 once to the shared database before activating code that reads the new table. It is additive for the old Worker. Preserve the migration receipt. Never run migration 0002 sequentially after the authoritative fresh schema: it is an old-install compatibility patch. The root Wrangler migration directory belongs to analytics; this newsletter migration uses its explicit file.
4. Commit and push only owned work to `main` after the checks; verify the resulting deployment activation. Preserve unrelated concurrent changes. An accepted deploy is not subscription acceptance.
5. With an explicitly designated recipient, check request → provider acceptance → received email → GET preview → POST activation. Keep private addresses/tokens outside Git. Verify suppression/lifecycle behavior with fixtures; do not send attack traffic or test messages to unrelated recipients.

The local probe already passes the fresh migration path, concurrent address and aggregate caps, and rollback on failed subscriber write. [The JSON receipt](repro/d1-admission-results.json) records runtime and date. Remaining verification and exact deployment status belong in [10-verification.md](10-verification.md), not inferred from this design.

## Remaining work and change criteria

General client-error ingestion still needs actual-byte enforcement, server-side sanitization, rate limits and an honest persistence contract (TASK-0126). Configuration-failure alerts and a routine operator review are not implemented by structured logging. Historical provider/Worker access remains incomplete (TASK-0130). No new endpoint here recovers missing addresses or proves complete client reporting.

Review the starting limits when observed legitimate demand reaches them. Review Turnstile if measured completion failures justify a change, using the common scenarios in the earlier options artifact. A removal decision would still need to retain bounded first-message sending. Preserve dated evidence, operator rationale and the actual activation/acceptance boundary when changing policy.
