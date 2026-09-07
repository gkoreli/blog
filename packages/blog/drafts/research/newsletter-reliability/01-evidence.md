# Retained evidence and historical limits

Checked September 6 Pacific / September 7 UTC, 2026. Machine-readable results and private-capture SHA-256 commitments: [evidence-summary.json](evidence-summary.json). Initial production source revision: `3d92b10b7a495ab537646b141e2dc9bbba7e20e7`.

## What the captures establish

The complete retained D1 `client_errors` table contained 13 records. The table's cleanup rule deletes records older than 30 days; the oldest surviving record was August 26 UTC. This is a census of surviving stored reports at capture, not of browser failures.

| Recorded error | Path | Reports | UTC date |
|---|---|---:|---|
| Subscription verification failure, HTTP 400 | `/` | 5 | September 7 |
| Pixi environment does not allow `unsafe-eval` | `/animations-lab` | 6 | August 26 |
| ResizeObserver loop with undelivered notifications | `/stats` | 2 | August 26 |

The subscription reports occurred between 04:49 and 04:59 UTC on September 7, or 21:49–21:59 PDT on September 6. They have one shared iPhone Safari User-Agent value. That does not establish one person, five people, or independent subscription intentions. No other subscription reports survived in this table at capture.

All 13 rows have null `build_id`. Six Pixi reports have stacks; the remaining reports do not. The current Pixi renderer imports `pixi.js/unsafe-eval`, and MEMO-0081 documents the CSP repair. Those older errors do not establish that the current animation build remains broken. The ResizeObserver cause and present impact have not been reproduced in this investigation.

The subscriber table contains one retained active row, created and confirmed on April 8. No other current subscriber statuses or campaign delivery-log rows were returned. The cleanup deletes expired pending subscriptions and older inactive subscriptions, so this is not an all-time signup count. Campaign `delivery_logs` does not record confirmation-email attempts; an empty table says nothing about their historical success.

## Server rejection inspected

The signed-in Workers dashboard exposed the subscription rejection at September 7 04:59:36.660 UTC with:

```json
{
  "reason": "turnstile_failed",
  "turnstileReason": "siteverify_http_400",
  "turnstileErrorCodes": ["invalid-input-secret"]
}
```

The deployed Worker version attached to that event was `412fc7ab-237c-4f1c-b891-b9dfa02c3dfd`. Private request identifiers are intentionally omitted. Cloudflare defines this code as an invalid or expired server secret. It is not a reported classification of the visitor as a bot. The handler rejects before subscriber lookup/write or confirmation-email scheduling. The [local reproduction](repro/results.json) independently exercises that code path with a synthetic response. [Siteverify reference](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), checked September 7, 2026.

Only that expanded server event was inspected in detail. Matching time/message/browser characteristics support investigating the five reports together; they do not make the detailed error code a separately observed fact for every report.

A later bulk query to `/workers/observability/telemetry/query` returned HTTP 403 with the existing Wrangler OAuth credential. The signed-in dashboard worked during the initial diagnosis, but subsequent native UI access failed. A full retained Worker-log census, including console warnings and background email errors, remains open. Neither that permission failure nor the initial transient D1 authentication error is evidence of a site outage.

The account's observed Free Workers plan retains logs for three days. Sampling can also limit collection. Configuring a sampling rate of 1 does not recover expired records or override account limits. [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/), checked September 7, 2026.

## Supplemental zone queries

Authenticated GraphQL `httpRequestsAdaptiveGroups` queries searched `/api/subscribe` in separate UTC day windows from September 1 through September 7 05:14:48.410 UTC. Each query used `requestSource: eyeball`, `limit: 10000`, and recorded `avg.sampleInterval`.

- September 1–6 returned no matching groups.
- September 7 returned four groups, all POST 400, with an estimated count sum of seven and sample intervals 1, 2, and 3.
- The seven is a sampled estimate. Subtracting the five D1 reports does **not** establish two additional attempts or people. No unique-person result is reported.

Separate daily zone queries for responses with `edgeResponseStatus >= 500`, September 4 through September 7 05:16:09.651 UTC, returned no matching groups. This is a negative result within adaptive zone data, not proof that no Worker failures, caught exceptions, or failed background operations occurred. The original subscription failure itself returned 400.

These queries broaden the search beyond the surviving browser reports while keeping their limits explicit. They do not replace the inaccessible full Worker event search.

## Earlier reported reader failure

[ADR-0011](../../../../../docs/adr/0011-client-error-observability.md), dated April 11, records a reader in Georgia using Brave on macOS who received a subscription failure after Siteverify returned HTTP 400. The Git history provides contemporary implementation context:

- `b3671ebf37db55241349d160fa7a306e9f776999`: added structured rejection logging and differentiated verifier results on April 11.
- `da2c44c`: changed Siteverify requests to JSON and parsed error codes from non-2xx responses later that day.
- `54e1845`: added the first-party browser logger that day.
- `4598939`: corrected the server export for client-error cleanup that day.

This establishes an earlier repository account of a reader-facing incident. The original April raw logs are not part of this capture. We cannot establish that April's HTTP 400 had September's `invalid-input-secret` cause, that the fault persisted continuously, or that the April reader was a different person from the friend mentioned now. Goga was asked whether the people were distinct; no answer was available at this checkpoint.

## Recovery follow-up

[Recovery checks](04-recovery.md) found no current pending subscriptions. The rejected flow has no saved address or confirmation send to reconstruct. Resend read endpoints denied the application's send-only credential; historical provider review remains open. A local secret passed a synthetic credential check, but the matching-widget read was denied and production has not been changed.

A follow-up at 06:11:07 UTC read all columns of all thirteen retained records, including referrer and stack fields. It found no address-like text and no request-body column; the five signup reports still carried the same generic message. The read succeeded with thirteen metered reads and zero writes. [Sanitized follow-up](recovery-log-recheck.json). This strengthens the bounded table finding; the full Worker and provider histories remain uninspected.

## Claims ledger

| Claim | Stage / state | Evidence | Supports | Cannot prove / counterevidence | Disposition |
|---|---|---|---|---|---|
| The latest inspected rejection is an invalid server secret | Verifier / observed | Expanded Worker event; official error definition | Configuration failure at that request | Who changed the secret, when it became invalid, all previous causes | Keep |
| Five signup error reports survive | Browser reporting / observed | Complete D1 table read | Five stored reports | Five people, every failed attempt, total lost subscribers | Keep with unit |
| There was an earlier reader failure | Historical / reported | April ADR and contemporary commits | An earlier documented incident | Different person or identical root cause | Keep as reported |
| No other readers failed | Identity / unsupported | No complete identity or attempt history | Nothing | Missing widget reports, expired logs, lost transport | Reject |
| Seven recent attempts failed | Zone HTTP / sampled | Four adaptive groups, count sum seven | An estimated status aggregate | Exact count; two extra attempts beyond D1 | Reject exact wording |
| The client logger has useful coverage | Client / observed and code-inspected | Reports in D1; global and explicit handlers | Successful capture of three error classes | Complete browser coverage | Keep bounded |
| Widget errors are invisible to explicit reporting | Client / reproduced | Synthetic widget error callback sent zero reports | A concrete coverage gap | How often real visitors hit it | Keep |
| Turnstile should be removed | Architecture / proposed | Failure plus alternative-control analysis | A decision worth testing | Comparative abuse or completion rate | Open |
| A lack of 5xx proves health | HTTP / unsupported | Adaptive query returned zero groups | No matching returned groups | 4xx configuration errors, caught and background failures | Reject |

## Reproduction and privacy

Private captures were archived outside the repository with owner-only directory and file permissions. The public JSON records query windows, aggregate results and hashes of twelve private capture files. They contain no credentials; client records retain operational browser context and are kept outside Git. Hashes commit to the author's copies; readers cannot independently recreate the account's results without access.

The D1 queries were read-only and small: the initial all-error aggregate read 13 rows, its grouping read 29 rows, and the subscriber summary read one row. The account usage alert visible during the investigation is an independent concern, not evidence that these queries or the newsletter caused high account usage.
