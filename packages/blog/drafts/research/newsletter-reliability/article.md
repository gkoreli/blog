# Newsletter Bot Protection: What Broke, and What My Logs Missed

Working draft, September 6, 2026 Pacific. Evidence-led field note; production repair and the protection decision remain open. This file is outside `posts/` and has no publication date or release metadata.

My friend could not subscribe to my blog because the server's bot-verification key was invalid. The form suggested retrying or allowing bot protection in his browser. When I asked whether other readers had met the same failure, our logs could show five failed submissions. They could not tell me how many people had given up before a report reached us.

- The inspected server error identified a configuration failure. Our message gave the reader advice that could not fix it.
- First-party browser logging helped diagnose the incident, but the widget's own error callback did not report errors.
- Removing the widget would remove one dependency. It would still leave me responsible for confirmation-email abuse, delivery failures, and a subscription flow that tells the truth.

## The server had a more useful answer

The immediate cause was specific: Cloudflare's verifier returned `invalid-input-secret`. That is the error for an invalid or expired server secret. It does not say that Cloudflare classified my friend as a bot. [Siteverify documentation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

The flow uses a Cloudflare Worker, D1 for subscription state, Resend for mail, and Turnstile before creating a pending subscription. The Worker has the secret key; the page has the public site key. The failed request stopped at verification, before the database write or confirmation email.

Our handler treated that configuration problem like every other verification rejection. It returned HTTP 400 and the same suggestion to retry or allow bot protection. The structured server log preserved the useful distinction, but the response discarded it. A local reproduction with a synthetic invalid-secret response produced the same result. [Code and recorded probe](02-client-audit.md).

The first repair is to make the deployed credential valid and verify a complete signup. The failure message also needs to distinguish a service problem from something the reader can retry. Neither repair requires a verdict about CAPTCHA systems in general.

## Five reports do not tell me who I lost

The history is incomplete in two ways: some reports expire, and some errors are never reported. Counting what survives cannot answer how many people tried to subscribe.

At the September 7 UTC capture, the client-error table held thirteen records. Five were the current subscription failures. Six were older Pixi/CSP errors in the animation lab, and two were ResizeObserver errors on the stats page. The five signup reports shared iPhone Safari details. Those details cannot distinguish people reliably.

There was an earlier warning in the repository. An April 11 incident note describes a reader in Georgia using Brave on a Mac who received a subscription failure after the verifier returned HTTP 400. That account helped motivate the browser logger. It does not preserve enough evidence to establish the same root cause, continuous breakage since April, or whether the reader was a different person. [Historical evidence](01-evidence.md).

Our client table retains thirty days. Workers Logs on the account's Free plan retains three. A supplemental search of sampled HTTP data returned no signup groups for September 1–6, but absence from that sample cannot clear the flow. The attempt to inspect the full retained Worker history through our CLI credential was denied, so that part of the audit remains open. [Workers retention](https://developers.cloudflare.com/workers/observability/logs/workers-logs/), [sampling limits](https://developers.cloudflare.com/analytics/graphql-api/sampling/).

I can describe the failures we recorded and the earlier incident someone documented. I cannot turn those records into a count of readers lost.

## Can I recover the subscriptions?

The question became more painful when I asked whether we could recover the addresses. The current database had no pending subscriptions to resume, and the inspected request failed before saving its address or scheduling mail. An error report could tell me something went wrong without giving me anyone to contact.

The five reports do not establish five lost subscribers. They could include repeated attempts, and the logger deliberately excludes form contents. For requests rejected at verification, a database backup cannot recover data that was never written.

Older attempts that reached confirmation sending are a separate possibility. Resend's retained history could contain those recipients even after our cleanup deleted their pending rows. Our available key could send mail but could not read that history, so the provider review remains unfinished. Finding a recipient would still not establish a confirmed subscription. [Recovery checks and limits](04-recovery.md).

For my friend, recovery means getting the form working and giving him a reason to try again. For anyone we cannot identify, I have no automatic repair for the missed contact. That is part of the cost of this failure, even while its size remains unknown.

## The error callback handled the message and lost the evidence

The browser logger works for some failures and misses others. This section is for someone implementing the flow; the practical consequence is that an empty error table cannot establish a working form.

The main script reports uncaught JavaScript errors and unhandled promise rejections. The subscription form reports failed API responses and network errors. Those explicit reports are how we found the five recent failures.

But the Turnstile error callback calls `setError()`, returns `true`, and never calls the logger. Cloudflare treats that return value as the application having handled the error and suppresses its additional logging. In a local probe, invoking the registered callback displayed the message and sent zero reports. [Callback behavior](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/), [reproduction](repro/results.json).

Delivery has another boundary. Our transport stops when `sendBeacon()` says it queued the report. Its fetch fallback also resolves on HTTP 500. On the server, a failed D1 write can leave the request acknowledged with 204 and no stored row. These are reproduced possibilities, not a measurement of how many production reports disappeared. [Beacon semantics](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon), [local audit](02-client-audit.md).

The useful next step is modest: report the known widget failures, give the form a bounded recovery path, correlate the failed request with its report, and record important server outcomes independently. More context is useful only if the record arrives and excludes addresses and tokens.

## What am I protecting the newsletter from?

The decision should start with the operation that can hurt someone: sending mail to an address the requester may not control. Requiring an email confirmation helps prevent unwanted activation, but the first message has already gone out.

The current per-IP limit is three attempts per minute. Cloudflare documents that binding as local to each Cloudflare location and eventually consistent. It cannot serve as a strict global send budget. Pending addresses can also request another confirmation through a route without Turnstile. Any replacement has to cover both paths. [Rate-limit behavior](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/), [control assessment](03-protection-options.md).

There are three plausible directions: repair the mandatory widget, require a challenge only after a justified abuse signal, or replace the widget with explicit send limits and double opt-in. A widget-free flow would still need per-address cooldowns, duplicate handling, and a deliberate limit on total sending. The available evidence has not measured their comparative effectiveness on this blog.

The audit also reproduced two ordinary application bugs: an inactive address can hit a database uniqueness error when subscribing again, and an unknown confirmation token can produce a page claiming the subscription is active. Neither is fixed by a better bot detector. [SQLite reproductions](repro/lifecycle-results.json).

My skepticism now has a more precise question: which controls protect the sending operation, and which failures can prevent a reader from subscribing without telling me? The worklist starts with restoring the existing flow and observing its outcomes. Whether Turnstile belongs in the resulting design remains open.

---

## Glossary

| Term / claim | Source | Checked |
|---|---|---|
| Invalid verifier secret | [Cloudflare Siteverify](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) | September 7, 2026 |
| Widget callback handling | [Cloudflare client errors](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/) | September 7, 2026 |
| Queued browser report | [MDN sendBeacon](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon) | September 7, 2026 |
| Operational retention | [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) | September 7, 2026 |
| Sampled HTTP estimates | [Cloudflare GraphQL sampling](https://developers.cloudflare.com/analytics/graphql-api/sampling/) | September 7, 2026 |
| Per-location rate limits | [Workers binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) | September 7, 2026 |

The [investigation](00-investigation.md) separates observed logs, historical reports, code inspection, local reproductions, and proposed repairs. The three [human prompts](source.prompts.md) are preserved exactly. Research and drafting were assisted by an agent; private operational logs are not published.
