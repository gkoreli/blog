# Subscription-bombing review: send admission and lifecycle

Reviewed September 9, 2026 UTC, against `a85c151d92c9577a3266951ada3ad01b86cb381b` before the implementation in this worklist. This is an independent source review and design recommendation. It is not a production abuse test or acceptance record. The implementing agent will supply the final code, chosen limits, and test results separately.

The existing Worker, D1, Resend, and Turnstile stack can support a small, defensible newsletter. The missing guarantee is that both public routes must reserve permission to send under the same database-enforced limits before either calls the email provider. A queue, new framework, or new verification provider is not needed to establish that guarantee.

The September 7 capture establishes an invalid-secret failure, not observed subscription bombing. [The incident evidence](01-evidence.md) and [recovery record](04-recovery.md) remain the historical sources. [TASK-0124](../../../../../docs/tasks/TASK-0124-restore-subscription-verification-and-distinguish.md) now records an owner-reported parallel signup repair; this review did not verify its deployment or a completed live signup. Five error reports do not identify five people.

## Findings that affect the first implementation

| Priority | Source finding at the reviewed revision | Required behavior |
|---|---|---|
| P0 | `subscribe.ts:114–147` reads by email, then separately inserts or updates and sends. `resend-confirmation.ts:63–82` does the same for pending rows | One admission transaction shared by both endpoints; only the request that creates its reservation may send |
| P0 | The native limiter keys on source IP. Resend requires no Turnstile token | Per-address and aggregate limits must hold across IPs and both endpoints. If Turnstile remains required for confirmation mail, enforce it on resend too |
| P0 | `turnstile.ts` allows missing secrets and network failures; all explicit rejections become a reader-blaming 400 | Missing/bad configuration and verifier outage must have a defined service-failure policy. The minimal policy is no send and a retryable service error |
| P1 | Concurrent new requests can both observe no row, causing a unique-email failure. Concurrent pending requests can each rotate tokens and send | Database predicates decide eligibility and admission atomically. A rejected request must not change a token, expiry, or subscriber state |
| P1 | `refreshPendingTokens()` changes the supposedly permanent unsubscribe token and invalidates the previous confirmation token before the new send succeeds | Preserve the unsubscribe token. Preserve previously issued, unexpired confirmation links across an unsuccessful resend, or document and deliberately accept that remaining failure mode |
| P1 | `markBounced()` only updates active subscribers; a bounced confirmation leaves a pending address eligible for more confirmation mail | Apply bounce suppression to pending as well as active addresses |
| P1 | Both complaints and ordinary unsubscribe use `unsubscribed`. Cleanup later deletes inactive rows after 90 days | Do not implement resubscription by blindly clearing every inactive state. Separate complaint suppression if ordinary opt-outs may subscribe again; record the retention boundary |
| P1 | Confirmation sends run under `waitUntil`, omit provider idempotency, and discard the returned message ID | Await a bounded provider request, retain its acceptance ID or bounded error category, and retry only the same admitted operation with the same payload |
| P1 | An unknown confirmation token receives an “already confirmed” page asserting an active subscription | Use an accurate invalid/expired-link outcome unless the database establishes activation |

These are source-level failure paths, not proof that an attacker exercised them. The earlier [lifecycle reproduction](repro/lifecycle-results.json) already reproduced inactive-address unique errors and the false confirmation page with synthetic data. This review did not rerun that fixture.

## Minimal atomic admission

Add one small confirmation-send ledger. Each admitted operation has a random ID, normalized address or restricted address key, reservation time, outcome category, and optional Resend message ID. Index its address/time and time columns. Its retention must outlast the longest accounting window. Count reservations, including failed and unknown sends; deleting or refunding an ambiguous operation would weaken the ceiling.

The essential SQL shape is one conditional write followed by a guarded subscriber mutation in `db.batch()`. Generate the operation ID and token values in the Worker before preparing the batch. Every statement can bind those values directly. Later statements read the reservation row by ID; they do not need the result of an earlier `RETURNING` to construct their bindings.

The following is a design sketch, not a migration to apply. The implementing agent has selected initial limits of ten minutes between sends to one normalized address, at most three reservations for that address in a rolling day, twenty-five in a rolling hour, and one hundred in a rolling day overall. These are small-blog policy values, not a measured recommendation or the owner's provider allowance. Names and schema details must be reconciled with the actual implementation.

```sql
INSERT INTO confirmation_sends (id, email, reserved_at, outcome)
SELECT ?1, ?2, unixepoch(), 'reserved'
WHERE
  -- Conservative baseline: retained inactive rows remain suppressed.
  NOT EXISTS (
    SELECT 1 FROM subscribers
    WHERE email = ?2 AND status IN ('active', 'unsubscribed', 'bounced')
  )
  AND (
    ?3 = 'subscribe'
    OR EXISTS (
      SELECT 1 FROM subscribers WHERE email = ?2 AND status = 'pending'
    )
  )
  AND NOT EXISTS (
    SELECT 1 FROM confirmation_sends
    WHERE email = ?2 AND reserved_at > unixepoch() - 600
  )
  AND (
    SELECT count(*) FROM confirmation_sends
    WHERE email = ?2 AND reserved_at > unixepoch() - 86400
  ) < 3
  AND (
    SELECT count(*) FROM confirmation_sends
    WHERE reserved_at > unixepoch() - 3600
  ) < 25
  AND (
    SELECT count(*) FROM confirmation_sends
    WHERE reserved_at > unixepoch() - 86400
  ) < 100;
```

Within the same batch, an `INSERT … SELECT … ON CONFLICT(email) DO UPDATE` can create or refresh the pending subscriber only when `EXISTS (SELECT 1 FROM confirmation_sends WHERE id = ?)` is true. Limit the conflict update to permitted states, and preserve an existing unsubscribe token. A final query in that batch can return the admitted row and the values needed for mail. No admitted row means no provider call. Do not infer permission from a pre-transaction email lookup.

Cloudflare documents `batch()` as a sequential SQL transaction whose statements roll back together on failure. The D1 binding uses the primary unless the application opts into its Sessions API. These support this admission design, but the actual SQL and rollback behavior still require local D1 tests. A permissive mock or Node SQLite test alone is not D1 acceptance. [D1 database API](https://developers.cloudflare.com/d1/worker-api/d1-database/), checked September 9, 2026.

The native IP limiter remains a cheap request filter before verification and D1. Cloudflare describes its counters as location-local and eventually consistent, so it cannot establish an exact global mail ceiling. D1 admission supplies that guarantee for this blog's confirmation operations. It does not cap unrelated campaign sends or other applications sharing the provider account. [Workers rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/), checked September 9, 2026.

## Sending, tokens, and suppression

For the smallest release, await Resend with a timeout and at most one bounded in-request retry. Use `newsletter-confirmation/<operation-id>` as the idempotency key and keep every retry's recipient, token URL, and body identical. Record accepted, failed, or unknown without storing the provider's raw response body in ordinary logs. Resend retains deduplication keys for 24 hours and distinguishes a reused key with a different payload from a safe retry. Its guarantee does not cap different operation IDs. [Resend idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys), checked September 9, 2026.

An interrupted Worker can leave a reservation without a recorded outcome. Without a persisted or reconstructible message payload, another request cannot safely resume that exact send: the raw confirmation token existed only in memory. A fresh user request after the cooldown is another admitted operation. State this as a limit of the small design; do not call it an outbox or crash-recoverable delivery. A reservation still makes the attempt inspectable and limits repeat sending during that uncertainty.

The new ledger can also retain issued confirmation-token hashes until their expiry. That permits previously delivered links to remain valid if a later admitted resend fails, without storing raw confirmation credentials. If implemented, confirmation must require the matching subscriber to remain pending, enforce expiry, and invalidate the outstanding token set after activation or opt-out. Old tokens from a completed subscription cycle must never reactivate a later cycle. Supporting token history is a focused use of the same table, but its transition tests are essential.

Ordinary unsubscribe and delivery suppression need an explicit policy. The conservative SQL sketch suppresses all inactive rows; it does not restore self-service resubscription. To support a reader returning after an ordinary opt-out, distinguish that state from a complaint or bounce, require fresh verification and confirmation, and preserve the old unsubscribe link. Existing data cannot reveal which historical `unsubscribed` rows came from complaints without other evidence. The current 90-day cleanup also means existing suppression is not permanent. Keeping a restricted suppression identifier is a product/retention choice, not a claim that all personal data must always be deleted after a particular period.

Check suppression again before an external send where practical, but describe the boundary honestly: D1 and Resend do not share a transaction. An opt-out racing a provider request already in flight cannot recall that message. The enforceable promise is no newly admitted confirmation after suppression is committed, plus stopping any unsent work that observes it.

Confirmation copy should offer an opt-out link and avoid promising that ignoring one message prevents another public request. Preserving one unsubscribe token makes that link useful in both confirmations and later newsletters.

## Verification and observable failure

Keep the verifier change small: reject absent configuration, cap the fetch duration, parse the response defensively, check the expected hostname/action when configured, and separate token rejection from configuration or provider failure. Return an actionable retry message for service failure. Do not tell the reader to change privacy settings because the server secret is invalid. Cloudflare's API documents separate secret and response-token errors, single-use tokens, and hostname/action fields. [Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), checked September 9, 2026.

Fail-closed verification can temporarily deny real readers. That is an explicit availability tradeoff for this small release. A future degraded mode that permits sending during verifier failure must still pass identical D1 admission and suppression checks; it cannot be a silent catch block. Never fail open on a D1 admission error.

Keep browser and server outcomes distinct: provider acceptance is not inbox delivery, and returning 202 is not evidence that a pending write or send succeeded. Opaque operation IDs, safe categories, and the provider message ID are sufficient for this change. Actual addresses belong in restricted subscription state, not diagnostic messages or public research artifacts. General client-error ingestion hardening remains its own task.

## Regression cases that test the guarantees

| Scenario | Required observation |
|---|---|
| Many concurrent new signups for one address with distinct source IPs | One admitted operation inside the cooldown; one provider operation; no unique-email exception |
| Concurrent signup and resend for the same pending address | Both routes compete for the same reservation; denied requests leave tokens and expiry unchanged |
| Valid requests for many addresses at the last available hourly or daily slot | The combined endpoints never admit beyond the chosen rolling-window ceiling |
| Boundary immediately before and after cooldown/hour/day expiry | Exact documented inclusivity; no accidental fixed-window burst allowance |
| Provider accepts, then the network response is lost | Retry uses the same key and exact body; no new reservation; final outcome can remain unknown |
| Resend rejection, invalid JSON, or stalled body | Bounded response time, safe diagnostic category, reserved capacity retained, no fabricated provider ID |
| Subscriber mutation fails after the reservation statement | Entire D1 batch rolls back; no provider call |
| Provider accepts but saving its outcome fails | The pre-send reservation remains; no automatic fresh send or false delivery claim |
| Pending/active address receives a bounce or complaint | Later public requests send nothing and do not clear suppression |
| Ordinary unsubscribe then resubscribe, if supported | Fresh confirmation required; old opt-out link still works; complaint/bounce paths stay suppressed |
| A later resend is rejected or fails | Earlier issued, unexpired confirmation links retain the intended validity |
| Confirm, unsubscribe, and submit again; then reuse an old token | The old token cannot reactivate the new pending cycle |
| Unknown, expired, or already consumed token | Accurate page; no claim of activation unless the state transition occurred |
| Missing/bad secret, rejected token, verifier timeout, wrong hostname/action | Correct internal category; no D1 admission or email for rejected verification |
| Cleanup runs near the longest accounting window | It cannot erase reservations still needed to enforce a ceiling |

Use local D1 for transactional and concurrency cases, and intercept all provider requests. A live email test uses an explicitly designated address and a small recorded acceptance plan; no live abuse test is warranted.

## Limits to retain in the article

- The per-address bound applies to the exact normalization used by this application. Aliases and forwarding addresses can reach the same inbox; a global bound still applies. Do not claim one normalized address is one person or one mailbox, and do not strip provider-specific address syntax indiscriminately.
- An attacker who can pass verification may exhaust the blog's total budget and temporarily deny legitimate signups. Limits trade availability for bounded mail volume; their values need review against actual legitimate demand.
- One permitted confirmation from each of many unrelated sites can still overwhelm a recipient. This blog can bound its contribution, not prevent subscription bombing everywhere.
- A correct mail cap does not cap all incoming requests, verifier work, D1 reads, or logging volume. The shared database makes cheap early rejection and bounded diagnostics useful.
- A repaired invalid secret and a local concurrency test do not establish comparative CAPTCHA effectiveness, production inbox delivery, or a measured real-world attack rate.

This review read repository source and current primary documentation. It made no production database query, account change, outbound email, or runtime edit. Implementation findings and test receipts should be appended below once the actual diff is available.

## Implementation review — September 9, 01:39 UTC

Read the implementing agent's uncommitted `confirmation-store.ts`, `confirmation-request.ts`, `0005_confirmation_admission.sql`, and changes to `db.ts`, `email.ts`, `turnstile.ts`, `confirm.ts`, `unsubscribe.ts`, and `responses.ts`. The working tree was still changing. This receipt is source review, not a claim that the final diff or local D1 tests passed.

The implementation uses `confirmation_attempts` for admission, issued hashes, and send outcomes. The observed policy is ten minutes per address, three reservations per address per rolling day, twenty-five globally per rolling hour, one hundred globally per rolling day, and seven-day ledger retention. The conditional insert, guarded subscriber upsert, and result query share one batch. Failed, unknown, reserved, and accepted operations all consume capacity. No admission or token-replay bypass was found in this read.

The token-revocation guard addresses the cycle problem: the confirmation update requires a pending, unsuppressed subscriber and a valid token; the following revoke-by-email runs only if that subscriber is active inside the same transaction. Replaying an old token while a newer cycle remains pending does not revoke its new hashes. Admission preserves the existing unsubscribe token. Ordinary opt-out preserves existing suppression reasons, while bounce and complaint revoke pending hashes too. These conclusions still require the transaction and lifecycle regressions on local D1.

Two concrete review corrections were sent to the implementing agent. First, an earlier version preserved the first `unsubscribed_at` through resubscription and subsequent opt-out. A new inactive period could therefore be purged immediately using a date older than ninety days. The updated `CASE` resets the timestamp on a fresh active/pending-to-inactive transition or new confirmation block, while retaining it for the same repeated opt-out. Second, the new preview pages needed `form-action 'self'`; the old CSP forbade the confirmation and unsubscribe POST forms. Both corrections were visible in the 01:39 read.

One response-policy issue remained for the implementing agent to resolve: after a provider failure, a retry during the cooldown returned `unchanged` as 202, and the then-current client removed the form as though the process were complete. It also replaced the server's ten-minute/check-inbox guidance with a generic 503 message. Preserve anti-enumeration deliberately, but leave a truthful retry route when no new confirmation was accepted. The client deadline of thirty-five seconds exceeds the five-second verifier deadline plus two eight-second provider attempts; database and incoming-body time remain outside those dependency bounds.

Legacy rows are token compatibility records and use an outcome excluded from the new admission budget. This preserves old delivered links without inventing a historical send count. Consequently, the new limits apply to operations admitted by the new implementation after activation. They are not a claim about all messages sent during the preceding rolling day, and old Worker versions do not enforce the new ledger while they remain active. The article and deployment receipt must retain that boundary.

GET now previews confirmation and opt-out actions, with an explicit POST button for a browser and the existing token URL retained. This prevents a GET-only mail scanner from changing state; it does not authenticate a human. The remaining “one click to confirm” copy was flagged because the browser flow now requires a separate button press.

## Bounded webhook repair

The implementing agent assigned this reviewer `packages/newsletter/src/webhook.ts` only. The handler now treats parsed JSON as unknown and narrows the event and recipient fields. It processes every valid normalized address from Resend's `data.to` and the older `data.email.to` shape, deduplicating addresses before suppression. A malformed first recipient no longer hides later valid recipients. The database's suppression functions still control token revocation and state transitions.

Ordinary webhook logs now contain only the supported event type and recipient count. Removed the address/domain redaction output, unsupported legal conclusions, and obsolete bundle-size justification. The signed-payload algorithm, five-minute tolerance, and multiple-signature handling remain; timestamps must now be whole, safe integer Unix seconds. A small reader limits the actual body to 64 KiB before verification, including requests without `Content-Length`. Oversize bodies return 413, invalid body reads or signed JSON return 400, and invalid signatures return 401 without suppression writes.

`pnpm -C packages/newsletter typecheck` and `git diff --check` passed after this edit. Signed webhook, multi-recipient, invalid-shape, timestamp, and body-limit regression cases were handed to the agent maintaining the server tests. Those results remain separate from this type-check receipt. No provider event was generated, no live webhook was posted, and no production data was changed by this reviewer.
