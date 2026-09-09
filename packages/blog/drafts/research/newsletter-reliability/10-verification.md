# Subscription bombing controls: local server verification

Checked September 9, 2026, at 01:49 UTC (September 8 PDT). The implementation is in the working tree awaiting integration. This receipt records local handler tests; deployment and production acceptance require separate evidence.

All 37 [server regression tests](../../../test/newsletter.test.mjs) passed against the actual newsletter handlers and SQL migrations. The tests exercise admission, provider outcomes, token lifecycle, and signed webhook suppression. The [client receipt](12-client-verification.md) separately records 25 passing form tests and source type checking.

## Method

Run from the repository root:

```sh
pnpm -C packages/blog exec node --import tsx --test test/newsletter.test.mjs
```

Runtime: Node `v24.14.1`, built-in SQLite `3.51.2`. Each test creates an isolated in-memory database from the real `0001`, `0003`, `0004`, and `0005` newsletter migrations. `0002` is an existing-install compatibility patch and is deliberately excluded from the sequential schema setup.

The database adapter executes the production SQL. Each D1-shaped `batch()` runs inside a SQLite `BEGIN IMMEDIATE` transaction with commit or rollback; admission is never replaced with JavaScript counters. Concurrent handler calls use `Promise.all()` and share that store. Separate cases inject a failure before or during the admission transaction and a failure when recording the final provider outcome.

Fetch is replaced for the entire test. Only the named Siteverify and Resend endpoints receive synthetic responses; every other URL throws. Each simulated mail call first checks that its attempt ID already has a database reservation. The native IP limiter is a controlled fixture, and signed webhook requests use a synthetic HMAC key. No production query, email, provider-account change, or deployment occurred.

For window tests, fixtures move recorded reservation timestamps into earlier windows. This tests the SQL's use of persisted timestamps without waiting in real time. It does not measure distributed clock behavior or D1 throughput.

## Observed results

| Test conditions | Local result |
|---|---|
| Twenty concurrent new signups for one normalized address, with distinct IPs | One reservation and one simulated mail call; all callers receive generic 202 |
| Twenty mixed signup/resend requests for a pending address after cooldown | One additional reservation and send; previous token still activates; retained opt-out token unchanged |
| Same address across both routes and different IPs | Immediate retry sends nothing; later attempts stop at three within a day; admission resumes outside the daily window |
| Forty concurrent requests for different addresses in one hour | Twenty-five reservations and mail calls; fifteen 429 responses |
| Four shifted hourly windows | One hundred admitted operations; the next request receives 429 despite being outside the hourly window; admission resumes outside the daily window |
| Provider 400, provider 500, network exception, or successful HTTP response without an email ID | Failed or unknown outcome retained; 503 with ten-minute retry guidance; no additional operation during cooldown |
| Provider 500 followed by accepted response | Two calls use the exact same JSON body and idempotency key; one reservation stores the returned provider ID |
| Three failed recipient attempts plus twenty-two unknown operations | Recipient and hourly limits count failures; twenty-five admitted operations produce forty-seven provider calls because unknown operations retry once |
| Admission transaction fails at statement 1, 3, or 4 | Transaction rolls back; no subscriber, reservation, or mail call remains |
| Provider accepts but outcome write fails | Reservation remains `reserved`; an immediate retry sends nothing |
| Migration imports an existing token, or an older deployment writes a token after migration | Replacement preserves that token through its original expiry and keeps the opt-out token |
| Confirmation GET, then POST, unsubscribe, and a new signup cycle | GET leaves pending state; POST activates; ordinary unsubscribe allows later confirmation; an old token cannot activate or revoke the new cycle |
| Signed bounce, complaint, or explicit confirmation opt-out | Outstanding tokens revoked; later public signup and resend calls produce no additional mail |
| Old unsubscribed and bounced rows during migration | Ambiguous old opt-outs remain suppressed as `legacy-inactive`; bounces remain suppressed |
| Resend for an unknown address, or either route for an active subscriber | No new subscriber or additional email |
| Bad verifier secret/token/hostname/action, malformed verifier response, network failure, or verifier HTTP failure | Both routes stop before reservation and mail; invalid requests and unavailable services have distinct statuses |
| Cached widget client has no action, or an empty action | A valid hostname-bound verifier result remains accepted |
| Missing required bindings, IP limiter rejection, malformed input, missing token, foreign Origin, or oversized request | No reservation or mail |
| Unknown or expired confirmation link | HTTP 400; pending subscriber remains pending |
| Signed webhook mixes valid and invalid current/legacy recipient fields with duplicates | All three valid normalized recipients suppressed once; log contains event type and recipient count |
| Signed null/array/unknown webhook payload, malformed JSON, invalid signature, malformed or stale timestamp | No unintended suppression; malformed JSON rejected; invalid authentication receives 401 |
| Webhook exceeds 64 KiB without Content-Length | HTTP 413 and no suppression |

The provider tests establish the request and local outcome contract. They do not prove that Resend delivered mail, that a mailbox accepted it, or that its real idempotency service deduplicated a retry.

## Remaining acceptance

The root implementation session completed the separate local D1/workerd check below. The Node SQLite suite alone does not accept the Cloudflare runtime. Neither local check measures cross-location production traffic, the native limiter's scope, real provider timeouts, or production read/write cost.

Real browser verification, live confirmation delivery, confirmation and unsubscribe, and operational notification of unavailable services remain separate checks. Suppression tests establish the stored-state behavior exercised above; they do not establish indefinite retention. At inspection, the existing inactive-row cleanup still deletes old suppressed subscriber records after 90 days. That retention boundary must remain explicit or be changed before making an indefinite opt-out claim.

The implementation receipt and test counts can support the engineering article as local evidence. They cannot support claims that the blog was attacked, that every legitimate reader can subscribe, or that historical failures have been recovered.

## Actual local D1 acceptance

At `2026-09-09T01:47:23.908Z`, [the executable fixture](repro/d1-admission.mjs) ran the actual admission store and fresh migrations against Miniflare `4.20260301.1` / local workerd D1. [Machine-readable results](repro/d1-admission-results.json): fresh migration path passed; 48 concurrent mixed-endpoint store calls for one address admitted one operation; the per-address day ceiling stopped at three; four waves of 60 concurrent calls admitted 25 each and stopped at 100/day; an injected subscriber-insert failure rolled back the reservation. Window tests shift fixture timestamps. No provider calls or production data were used.

## Integration and migration

The first isolated integration checkout at base `c235029` passed all 96 blog tests, all workspace typechecks, and the production build of 25 posts. Wrangler `4.71.0` dry-run passed with the expected DB, native rate-limit and asset bindings: 183.68 KiB upload / 49.16 KiB gzip. The build reused the existing public widget key from served HTML; no secret was copied, changed or rotated. A concurrent referrer-context commit subsequently moved main to `c338059`; the final combined checkout is tested separately before integration.

Production work was limited to metadata and the required additive migration. The pre-migration schema check used two statements: `PRAGMA table_info(subscribers)` reported 0 reads; the targeted `sqlite_master` lookup reported 35 reads, total 35. It found the existing 13 subscriber columns and campaign delivery table, with no suppression column or confirmation-attempt table. No subscriber addresses or tokens were selected.

Newsletter migration 0005 completed at `2026-09-09T01:58:35.569181Z`. Wrangler's file-import result reported success, seven queries, 44 total rows read and seven rows written. It exposed only aggregate import metering, not per-statement read values. Total metered read work for the preflight and migration was 79; this is query read work, not 79 subscribers. Private exact captures are under `/Users/goga/Documents/goga/private-evidence/newsletter-reliability/2026-09-09/` (`schema-before.json`, `migration-0005.json`). Wrangler prefixed its JSON with upload progress, causing the receipt wrapper's JSON parse to fail after the successful import; the saved response was inspected and the migration was not rerun.

Schema application is complete. Code activation and a designated recipient's end-to-end flow remain pending until their receipts are appended. The old Worker remains compatible with the additive schema while rollout completes. No real email has been sent by this task.

## Final combined code check

Implementation commit `86dad93` includes the concurrent committed article/referrer/UI work already on main. Its isolated checkout passed all 100 blog tests, all workspace typechecks, and the production build of 25 posts. The sender now respects provider rate-limit wait hints up to three seconds within the interactive budget, and does not retry early for a longer or malformed hint. Two new controlled-timer regressions bring server coverage from 37 to 39 cases; client coverage remains 25. Exact check output is saved privately as `final-tests.txt`, `final-typecheck.txt` and `final-build.txt` beside the migration captures. The code is committed and pushed to main; activation is checked separately.

## Production activation and bounded HTTP checks

The deployment metadata returned Worker version `e8c69b0d-3174-4e8f-a3f9-5788f2868686` at 100% in deployment `6214b171-fd5d-44a8-8abc-8d1f8e56c3fd`, activated September 9 at `02:07:43.752278Z`, after implementation commit `86dad93` was pushed. The metadata contains no source-commit annotation, so version timing alone is not an exact source attestation. The subsequent live behavior matches the changed routes and served copy.

At `2026-09-09T02:10:26.088Z`, four bounded checks passed: unknown confirmation GET returned 400 with the updated form-action CSP; both signup and resend rejected missing proof with 400 and an opaque request ID; the privacy page served the new confirmation-retention copy. [Sanitized receipt](repro/live-smoke-results.json). No valid proof, real recipient, email send, activation or opt-out was attempted. These HTTP responses do not expose D1 metered reads; their possible DB work is outside the 79 direct-SQL reads reported above.

The active version has the expected DB, native limiter, Turnstile and send-key bindings, but **no RESEND_WEBHOOK_SECRET**. Signed webhook suppression is therefore locally tested code awaiting its production connection. The existing Chrome session's Resend webhook URL redirected to login. Account access is needed to inspect existing endpoints and install the corresponding signing secret; do not infer that a live provider webhook exists.

A single end-to-end confirmation message still needs an explicitly designated recipient. No address has been authorized in this session. The pending acceptance sequence is real challenge, request, provider acceptance, received email, GET preview and POST activation. General diagnostic ingestion/alerts and historical recovery remain open; none is completed by these deployment checks.
