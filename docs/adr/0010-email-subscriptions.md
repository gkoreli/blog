# ADR-0010: Email Subscriptions — D1 + Resend + Turnstile

## Status

Accepted April 8, 2026; initial implementation shipped that day. Revised September 9, 2026 UTC for the subscription-bombing repair. Local implementation, activation and live completion are separate evidence stages. Consult the [current verification receipt](../../packages/blog/drafts/research/newsletter-reliability/10-verification.md) before claiming the new behavior is deployed or email delivery works.

The [worklist and research index](../../packages/blog/drafts/research/newsletter-reliability/00-worklist-index.md) contains the current design, primary sources, tests, review, raw shaping prompts and unpublished article. The [detailed implementation decision](../../packages/blog/drafts/research/newsletter-reliability/09-design-and-implementation.md) governs the current subscription flow. Earlier versions of this ADR remain in Git history; their setup instructions and gap lists are not current acceptance receipts.

## Why this exists

The April launch needed a way for readers to hear about later articles. The blog already used Cloudflare Workers and D1, so it added a small newsletter package with Resend delivery and Turnstile verification. The preserved decision was an urgent launch under a free-stack preference, not a comparative reliability or abuse study. An invisible widget was a later aesthetic preference. See the [historical rationale and 2026 prior art](../../packages/blog/drafts/research/newsletter-reliability/05-prior-art-2026.md).

The September 7 investigation found a verifier-secret rejection before subscriber storage and mail scheduling. Five client reports did not establish five distinct readers, and their diagnostics did not retain submitted addresses. The owner subsequently reported a repair in another session; retrieve TASK-0124's acceptance evidence instead of assuming the old failure continues or rotating credentials again. [Recovery findings](../../packages/blog/drafts/research/newsletter-reliability/04-recovery.md) distinguish inspected stores from provider and Worker histories still inaccessible.

Goga wants to keep his platform and keep the subscription integration small. A managed-provider recommendation was never a selected migration. This revision protects the first confirmation email as well as later newsletter activation. It does not claim that the blog experienced a subscription-bombing attack.

## Decision

Keep the existing Worker, shared `blog-analytics` D1 binding, Resend, and Turnstile. Add one indexed confirmation-admission table and an explicit suppression reason on subscribers. No new runtime dependency, service, queue or private database framework is required. The [ORM decision](../../packages/blog/drafts/research/newsletter-reliability/13-data-access-decision.md) records the benefits and limits of keeping prepared SQL for this repair.

| Route | Methods | Current contract |
|---|---|---|
| `/api/subscribe` | POST, OPTIONS | Verification, shared admission, bounded confirmation send |
| `/api/resend-confirmation` | POST, OPTIONS | Same verification and admission; pending rows only |
| `/api/confirm/:token` | GET, POST | GET previews; POST activates an eligible pending address |
| `/api/unsubscribe/:token` | GET, POST | GET previews; POST opts out, including mailbox-provider one-click POST |
| `/api/send` | POST | Existing newsletter campaign sender, bearer `ADMIN_SECRET` |
| `/api/webhooks/resend` | POST | Signed bounce and complaint events suppress recipients |

A public signup request is not authenticated consent. Turnstile assesses a request; email confirmation establishes a later activation action. Neither identifies who first submitted the address. CORS controls browser access and is not an abuse budget or authentication system.

## Request and delivery behavior

Both public POST routes share `confirmation-request.ts` and `confirmation-store.ts`:

1. Reject a supplied foreign Origin and non-JSON content type. Apply the existing native per-IP limiter. Read at most 4 KiB of actual body bytes, then validate and normalize the address.
2. Verify Turnstile with a five-second deadline and expected hostname. New widgets use action `subscribe`; empty/missing action supports older cached clients. Missing configuration or verifier unavailability returns 503; invalid proof returns 400. No mail is sent on either path.
3. In one D1 batch transaction, check the budget, reserve the attempt, preserve any legacy pending token, and update eligible subscriber state. A subscriber-write failure rolls back the reservation.
4. For an admitted request, await Resend with at most two eight-second attempts using the same serialized body and idempotency key. A short provider rate-limit hint can add up to three seconds of waiting; a longer hint stops the inline retry. Record accepted, failed or unknown outcome and available provider message ID/status.
5. Return generic 202 for accepted mail or a no-send state. Failed/unknown mail returns 503 with a ten-minute retry hint; global capacity returns 429. A 202 does not prove a new email was sent or arrived in the inbox.

The starting policy is one admission per normalized address per ten minutes, at most three per address in a rolling day, and shared aggregate limits of 25 per rolling hour and 100 per rolling day. Failed, unknown and reserved attempts remain charged. Imported legacy token records do not claim measured sends and do not consume the new budget. These are chosen blog limits, not a provider-plan allowance or measured optimal thresholds.

Native rate limiting remains three requests per sixty seconds per IP, shared by both routes. Its counters are local and eventually consistent, so the D1 transaction supplies the shared email-admission ceiling. The cap covers new-path confirmation admissions, not historical sends, all API calls, campaigns or D1 read work.

The D1 transaction cannot include the email provider. There is no outbox or background crash replay. A Worker crash can leave a charged reservation without an email, and an already admitted send can finish after an opt-out. A failed outcome write does not trigger another send. See the design artifact for these remaining tradeoffs and the review criteria.

## Browser, tokens and suppression

The client retries widget initialization on submit, reports widget failures and deadlines, uses a fresh widget for a retry, ignores stale callbacks, and never submits an empty-token fallback. The verification deadline is thirty seconds and the API deadline thirty-five seconds. It keeps the form and email available after generic 202 and explains when to retry. Static client diagnostic messages omit raw provider responses and form values.

Confirmation tokens contain 256 random bits and are stored as SHA-256 hashes. Each issued token retains its original 24-hour expiry; requesting another email does not invalidate an earlier unexpired link. Successful activation revokes all issued tokens. Unknown, expired and used tokens cannot activate a new subscription cycle. GET alone never activates; the extra POST protects against simple email-link prefetch, not every possible automated interaction.

Unsubscribe tokens are stored raw so newsletter footers can include stable links while the row exists. A database disclosure would expose addresses and usable opt-out tokens; hashing confirmation tokens does not protect those other fields. Unsubscribe GET previews and POST applies the action. Confirmation-email links can also block further confirmation requests.

An ordinary unsubscribe permits later renewed confirmation. Bounce, complaint, explicit confirmation-mail opt-out, and conservatively migrated legacy inactive state suppress admissions. Activation and opt-outs revoke issued confirmation tokens. The inactive-row retention policy removes suppression after ninety days; the interface therefore advertises a confirmation block of up to ninety days, not a permanent one.

## Storage, diagnostics and cleanup

| Store | Purpose and boundary |
|---|---|
| `subscribers` | Address, status, token state, suppression reason, request source/context and timestamps |
| `confirmation_attempts` | Address, opaque ID, token hash, reservation/expiry/revocation, outcome, optional provider ID/status; seven-day retention |
| `delivery_logs` | Existing campaign-send records; separate from confirmation admission and its retention |
| `client_errors` | Existing first-party browser reports; general ingestion hardening remains TASK-0126 |

The newsletter shares D1 capacity with analytics and browser diagnostics. Investigations must budget production reads and preserve private captures outside Git. A second database in the same account would not itself isolate account-level allowances.

Routine confirmation logs contain the opaque request ID, mode, stage, static reason and provider HTTP status. Signed webhook logs contain event and recipient count, not addresses. These statements do not establish the retention or redaction of separate provider history or Cloudflare request logs. Pre-admission diagnostics intentionally do not retain the submitted address.

Nightly cleanup at 03:00 UTC removes expired pending rows, inactive rows older than ninety days using status-event timestamps, and confirmation attempts older than seven days. Those are this blog's storage policies, not categorical legal requirements or proof of compliance. Signed complaint/bounce processing is part of the implemented protection; live webhook configuration still requires its own receipt.

## Migration and deployment procedure

Inspect the schema before applying anything. Newsletter migrations are explicit files against the shared database; the root Wrangler `migrations_dir` points to analytics and is not the newsletter migration history.

- A fresh newsletter schema uses `0001_create_subscribers.sql`, then `0003_add_bounced_at.sql`, `0004_delivery_logs.sql`, and `0005_confirmation_admission.sql`.
- `0002_for_existing_installs.sql` is only a compatibility patch for a pre-April-8 schema. Never execute it after the current fresh-install 0001, and never rerun ALTER migrations blindly.
- The current installation already has 0001/0003/0004. Apply 0005 once before activating the new code. It adds a nullable column/table while leaving the old Worker able to run. It imports known pending token hashes and preserves old inactive-state uncertainty.

After local tests and a bounded live-schema check, the explicit production command for this revision is:

```bash
pnpm exec wrangler d1 execute blog-analytics --remote \
  --file packages/newsletter/migrations/0005_confirmation_admission.sql
```

Keep its receipt. Stop after a quota rejection and resolve access through metadata; do not retry expensive SQL. Then build and deploy the tested source through the repository's direct-main delivery workflow. Git integration deploys pushes to `main`. Verify schema, code revision and active deployment separately from a designated recipient's complete signup flow.

Existing configuration uses `TURNSTILE_SITE_KEY` in the build environment; `TURNSTILE_SECRET_KEY` and `RESEND_API_KEY` are Worker secrets. The native `SUBSCRIBE_RATE_LIMITER` binding is required by signup. `RESEND_WEBHOOK_SECRET` is required to process signed bounce/complaint events. `ADMIN_SECRET` protects the separate campaign sender. Do not print secrets or change them because an old failure capture exists. Current widget dashboard mode, DNS authentication, provider limits, webhook setup and actual inbox delivery require account evidence; a successful build establishes none of them.

The package's lack of runtime dependencies is a maintenance choice, not a ban on established libraries. Evaluate any proposed library through the built artifact and current deployment limits. Historical one-megabyte Worker-limit and package-size claims are not valid current instructions.

## Remaining work

The [verification receipt](../../packages/blog/drafts/research/newsletter-reliability/10-verification.md) records completed local tests and the deployment/live-email boundary. TASK-0124 tracks the designated recipient's complete acceptance; TASK-0126 still includes general diagnostic-ingestion protection and configuration-failure review/alerts; TASK-0130 retains the incomplete historical recovery audit. Do not mark those tasks complete because confirmation admission is implemented.

The article remains outside `posts/` and unpublished. Future provider migration, removal of Turnstile, permanent suppression storage, campaign automation and a subscriber dashboard are possible decisions, not work automatically authorized by this repair.

## Primary references

Current source dates and claim limits are in [the source ledger](../../packages/blog/drafts/research/newsletter-reliability/07-source-ledger.md).

- [Cloudflare D1 database API](https://developers.cloudflare.com/d1/worker-api/d1-database/) — prepared bindings and transactional batches.
- [Cloudflare native rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) — locality and consistency limits.
- [Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) — proof validation, expiry, hostname and action.
- [Resend idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys) — retry identity and provider retention.
- [Resend event types](https://resend.com/docs/webhooks/event-types) — API/provider events do not prove inbox placement.
- [Svix manual verification](https://docs.svix.com/receiving/verifying-payloads/how-manual) — existing webhook signature protocol.
