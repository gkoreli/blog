# Subscription form: bounded failures and local verification

Implemented and checked September 9, 2026, at 01:31 UTC; accepted-response recovery was updated and rechecked before 01:49 UTC (September 8 PDT). This receipt covers the local client changes awaiting integration. It does not record a deployment or a successful production subscription.

The form now stops before the subscription API when verification is unavailable, restores a usable retry after failures, and reports a static diagnostic stage. This addresses the widget coverage and recovery gaps identified in the [September 7 audit](02-client-audit.md). The earlier probe results remain historical evidence of the inspected revision.

## Implementation

- [The initializer](../../../src/client/subscribe.ts) retries widget initialization on submit if the script arrived after page initialization. Missing script, site key, or widget container cannot cause a blank-token POST.
- Widget render and execute exceptions, error/timeout/unsupported callbacks, and expiry during an attempt report their stage and restore the button. Removing a failed widget invalidates its callbacks before a new attempt starts. Repeated or late callbacks cannot submit twice.
- Verification has a 30-second deadline. The API request has a 35-second deadline and an abort signal. A late response cannot replace the outcome of a newer attempt. These are application timeout choices; the browser check must still assess slow connections and challenge interaction.
- The request captures the address when the reader submits. It preserves the existing restricted attribution fields: page path, bounded `utm_source`/`utm_campaign`, and an external referrer hostname.
- Only HTTP 202 produces the accepted message. The copy asks readers to look for confirmation if needed and allows a retry in ten minutes. The form and email remain available because a generic acceptance can represent suppression or a cooldown after a failed or unknown send. It does not promise that another email was sent. HTTP 400, 429, 503, and unexpected statuses keep the form available and show a bounded, status-specific message. A 503 with `Retry-After: 600` asks the reader to check their inbox before retrying in ten minutes; the header is not logged.
- Reports contain `interaction_error`, `subscribe_form`, a static stage such as `subscribe_widget_unavailable`, and an HTTP status when available. The form does not pass addresses, request bodies, challenge tokens, provider callback payloads, exception text, or API response bodies to the logger. A synchronous logger failure cannot interrupt form recovery.

The widget sends `action: subscribe`; automatic widget retry is disabled, and refresh uses manual mode. The application creates a fresh widget for each retry. These options and callback names match the [Cloudflare widget configuration reference](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/), checked September 9, 2026. This API documentation establishes the interface; it does not establish real-world signup success or abuse resistance.

## Executed checks

Run from the repository root:

```sh
pnpm -C packages/blog exec node --import tsx --test test/subscribe.test.ts
pnpm -C packages/blog exec tsc --noEmit
```

Both commands passed. The [25 tests](../../../test/subscribe.test.ts) import the actual initializer and invoke its registered events and callbacks using controlled DOM, timers, widget, logger, and fetch objects. The tests cover:

| Behavior | Observed local result |
|---|---|
| Script arrives late; initializer called twice | One widget execution and one API request |
| Missing script, site key, or widget container | No API request; button remains usable; static diagnostic |
| Invalid email | Native validity reporting; no challenge execution |
| Render/execute exception or widget error/timeout/unsupported/expiry | Retry restored; fresh widget works; old callbacks ignored |
| Callback fails synchronously inside render | No execution and no leftover timer |
| Challenge never completes or returns an empty token | No API request; bounded failure and retry |
| Repeated success callback or repeated submit while pending | One request with the address captured at submission |
| Request timeout or expiry while request is pending | Abort signaled; retry restored; late success ignored |
| HTTP 400/429/503/500 or unexpected 200 | No success display; status recorded; response details excluded |
| Generic 202 or 503 with a ten-minute retry interval | Form and email retained; static retry guidance; a later verified request remains possible |
| Network failure while cleanup and logger also throw | Retry restored; no leftover deadline |

All network responses in these tests are synthetic. The test harness cannot reach the real subscription endpoint or send email. No dependency or new framework was added.

## Acceptance boundaries

Real browser challenge execution, rendering, accessibility, slow or blocked script loading, email receipt, confirmation, and unsubscribe still need separate acceptance evidence. A local abort does not establish that the server cancelled processing, so timeout and network-error copy asks the reader to check for a confirmation email before retrying.

This change improves reports emitted by the subscription form. It does not repair the shared logger transport or ingestion, establish durable report delivery, cover failure to load the site's JavaScript, or identify historical readers. Those remain separate worklist items.
