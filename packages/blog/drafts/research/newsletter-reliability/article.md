# Newsletter Bot Protection: What Broke, and What My Logs Missed

Working draft, started September 6 and updated September 8, 2026 Pacific. Evidence-led field note; production repair and the protection decision remain open. This file is outside `posts/` and has no publication date or release metadata.

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

Our client table retains thirty days. The initial capture recorded three days of Workers Logs on the account's then-Free plan; the subsequent owner-reported Paid upgrade is recorded separately and does not reconstruct expired logs. A supplemental search of sampled HTTP data returned no signup groups for September 1–6, but absence from that sample cannot clear the flow. The attempt to inspect the full retained Worker history through our CLI credential was denied, so that part of the audit remains open. [Retention and recovery evidence](01-evidence.md), [upgrade checkpoint](../../../../../docs/handoffs/2026-09-07-reliability-checkpoint.md), [sampling limits](https://developers.cloudflare.com/analytics/graphql-api/sampling/).

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

## Why Turnstile was there

The preserved decision was about shipping a signup form while a post was receiving attention. The April ADR records a free-service constraint, an existing Cloudflare stack, and an urgent need for a way to retain readers. Turnstile was the selected spam control. The later switch to invisible mode was explicitly about keeping the visible widget out of the blog's design. [Original ADR](https://github.com/gkoreli/blog/blob/2b3863c2a9bb3417d9c17e48fae39aeb53a9fd3d/docs/adr/0010-email-subscriptions.md), [mode-change record](https://github.com/gkoreli/blog/commit/568a95988249e4ca7198f0f7235c314eb639b5ef).

Those records explain the choice. They do not contain a comparative test of reader completion, abuse prevention, or maintenance. The examples cited in the ADR mostly demonstrated ways to build on Workers. They did not establish that operating the entire subscription flow myself was the best tradeoff.

The broader research changes the comparison. Buttondown documents conditional challenges and an automatic attack mode; listmonk has a self-hosted ALTCHA implementation. These are useful alternatives to examine, with their own restrictions and failure modes. The decision now includes how much of subscription operations I want to own, as well as which challenge policy to use. [Dated prior-art review](05-prior-art-2026.md).

## What am I protecting the newsletter from?

The decision should start with the operation that can hurt someone: sending mail to an address the requester may not control. Requiring an email confirmation helps prevent unwanted activation, but the first message has already gone out.

The current per-IP limit is three attempts per minute. Cloudflare documents that binding as local to each Cloudflare location and eventually consistent. It cannot serve as a strict global send budget. Pending addresses can also request another confirmation through a route without Turnstile. Any replacement has to cover both paths. [Rate-limit behavior](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/), [control assessment](03-protection-options.md).

There are three enforcement policies to compare: a mandatory challenge, a challenge after a defined abuse signal, or no challenge with explicit send limits. Verifier choice and a maintained hosted signup flow are separate implementation decisions. The available evidence has not measured their comparative effectiveness on this blog.

A widget-free flow would still need per-address cooldowns, duplicate handling, and a deliberate limit on total sending. Even then, one unwanted confirmation can contribute to a flood assembled across many websites. The Swiss NCSC's February 2026 report describes that exact abuse of otherwise legitimate signup systems. A sending ceiling bounds my contribution; it does not make it harmless. [NCSC report](https://www.bacs.admin.ch/en/26w6-en).

The audit also reproduced two ordinary application bugs: an inactive address can hit a database uniqueness error when subscribing again, and an unknown confirmation token can produce a page claiming the subscription is active. Neither is fixed by a better bot detector. [SQLite reproductions](repro/lifecycle-results.json).

On September 8, I narrowed the requirement: this is a personal blog, and I want subscribing to work through a simple capability I can adopt. The current recommendation is a maintained service's hosted signup page. We can test that flow without building each custom alternative first. The provider choice and production acceptance remain open. [Current worklist and adoption scope](03-protection-options.md#current-direction-adopt-a-maintained-newsletter-service).

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
| Conditional hosted protection and custom-domain limits | [Buttondown firewall](https://docs.buttondown.com/firewall) | September 9 UTC, 2026 |
| Self-hosted challenge implementation | [listmonk v6.2.0 verification module](https://github.com/knadh/listmonk/blob/ef0a75872463f10a4848af6c547d1c057405453a/internal/captcha/captcha.go) | September 9 UTC, 2026 |
| Confirmation-email bombing | [Swiss NCSC](https://www.bacs.admin.ch/en/26w6-en), published February 10, 2026 | September 9 UTC, 2026 |

The [investigation](00-investigation.md) separates observed logs, historical reports, code inspection, local reproductions, and proposed repairs. The six [human prompts](source.prompts.md) are preserved exactly. Research and drafting were assisted by an agent; private operational logs are not published.
