# First-party client logging audit

Inspected September 7 UTC, 2026, at source revision `3d92b10b7a495ab537646b141e2dc9bbba7e20e7`. The logger is implemented. At the inspected revision ADR-0011 still said implementation was pending; this investigation adds a dated correction to that ADR. The logger provided the five current subscription error reports and eight older reports.

## Coverage that exists

`packages/blog/src/client/main.ts` creates a logger, registers `window.error` and `unhandledrejection`, and passes it to the subscribe form. The form explicitly reports non-success API responses and caught network errors. The transport uses a same-origin beacon with a keepalive-fetch fallback. The Worker validates fields, enriches reports with request metadata, writes D1, and emits a structured warning. A nightly cleanup retains 30 days.

This is a useful small reporting path. Its existence and the actual stored events answer whether client logging exists. The missing paths below answer why it cannot establish every failed signup.

## Executed local probes

Run from repository root:

```sh
pnpm -C packages/blog exec tsx drafts/research/newsletter-reliability/repro/audit.mjs
```

[Probe source](repro/audit.mjs) and [recorded results](repro/results.json). Node v24.14.1; the actual application modules run against synthetic DOM, transport, verifier, and D1 fixtures. Fetch is replaced throughout; no production requests or emails occur. This tests handler behavior, not a real browser, real Turnstile challenge, Cloudflare quota enforcement, or email delivery.

| Probe | Observed local result | Consequence |
|---|---|---|
| Invoke registered widget error callback with a synthetic error code | Message displayed; zero reports; callback returns true | Widget failures can be visible to a reader and absent from our client table |
| Inspect registered timeout/unsupported callbacks | Neither is registered | Dedicated outcomes and recovery paths are absent |
| Mock Siteverify `invalid-input-secret` HTTP 400 | Subscribe returns 400 with browser-remediation message; no DB/email call | An operator configuration failure is presented as visitor verification trouble |
| Throw on Siteverify fetch | Verification returns `ok: true` | Network failures bypass the verifier under current policy |
| Omit verifier secret | Verification returns `ok: true` | Runtime omission silently skips protection; required deployment bindings are a separate control |
| Beacon returns true | Transport resolves without invoking fetch | Queue acceptance is the only observed delivery state |
| Fetch transport receives HTTP 500 | Transport promise resolves | Server rejection is not detected by this transport |
| Submit 9,532-byte synthetic event without Content-Length | Handler returns 204 and writes one row | The stated 8 KiB maximum is not enforced against actual body bytes |
| Send that request with an unrelated Origin | Handler accepts it | No application-level origin check; this probe does not bypass browser CORS or prove cross-origin JavaScript can submit it |
| Put synthetic query details in source/referrer and an address in message | Those values reach the DB fixture | Server truncation does not reapply client URL redaction, and arbitrary message text is not sanitized for addresses |
| Force D1 persistence failure | Response 204; zero stored rows | Acknowledgement does not establish durable storage; failure reaches Worker console only |
| Supply occurredAt | Value is parsed but omitted from the INSERT | The table keeps receipt time, not the reported browser occurrence time |
| Redact a token-like path and address-bearing message | Path segment and address survive | Query stripping alone is not a general sensitive-data filter |

Cloudflare documents that returning true from the widget error callback suppresses additional Turnstile error logging. Our callback both claims to have handled the error and omits the report. [Client-side errors](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/), checked September 7.

## Other inspected gaps

- **Bootstrap and resources:** global handlers are installed from the main module after its static imports. They cannot cover failure to load that reporting module. The `error` listener is not registered in the capture phase, and there is no explicit resource-error or CSP-violation listener. Element resource errors do not bubble. [Element error events](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/error_event), checked September 7. This is a code/DOM-semantic finding, not a browser-load reproduction.
- **Widget readiness and recovery:** the widget is initialized only if `window.turnstile` is available at initialization. The missing-widget path submits an empty token, which production rejects. There is no explicit readiness wait or script-load report, no subscription fetch deadline, and no dedicated recovery/reporting around `render()` or `execute()` exceptions. Script order alone has not been reproduced as the cause of this incident.
- **Correlation:** the server stores the ray of `/api/client-error`, not the failed `/api/subscribe` request. `buildId` is supported by types but never supplied by default context; all 13 stored reports lack it. Correlation currently relies on time/path/status and manual inspection.
- **Budgets and delivery:** there is no per-page event budget, duplicate suppression, ingestion limiter, bounded retry or stored-delivery acknowledgement. These omissions do not prove historical transport loss or abuse. `sendBeacon(true)` means queued, not a response or a successful D1 commit. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon), checked September 7.
- **Error isolation:** the logger catches rejected transport promises, but calls context/redaction/sampling outside that catch. A synchronous error there can escape. An injected service should uphold its promise not to disrupt the feature it observes.
- **Server outcomes:** rate-limit rejection has no structured reason log in the subscription handler. Invalid secrets, token failures and verifier HTTP errors share one 400 response. Confirmation email is sent under `waitUntil`; failure logs only to Worker console after the browser has received 202. Campaign `delivery_logs` does not cover this send.

## Smallest useful repair

The separate [lifecycle probe](repro/lifecycle.mjs) uses the real subscription migrations in an in-memory SQLite database and calls the application handlers with synthetic addresses and mocked mail. It reproduced unique-email errors for both unsubscribed and bounced addresses submitting again, and an unknown confirmation token returning HTTP 200 with an active-subscription message despite zero active rows. [Recorded results](repro/lifecycle-results.json). TASK-0129 tracks these state-machine bugs; they are independent of browser reporting and do not prove anyone encountered them in production.

TASK-0125 should add bounded widget/load/timeout reporting and usable recovery, retain safe error codes, set the release revision, and connect browser reports to the failed operation. TASK-0126 should make important server outcomes durable with a retention/cost budget, enforce actual payload size and server sanitization, and provide a way to notice configuration failures promptly. A new dashboard, session replay, or a third-party SDK is not a prerequisite.

Success needs exercised failures: widget error, unavailable script, configuration failure, token expiry, API network timeout, rejected report transport, and failed persistence. Verify the expected message and outcome record, not only that a listener or table exists. Browser execution and production signup validation remain open work.
