---
title: "Cloudflare Turnstile: What Kept Breaking My Signup Form"
seoTitle: "Debugging Cloudflare Turnstile Signup Failures"
date: "2026-11-07"
description: "In a controlled test, my form aborted its signup request after Turnstile reported success. Here's how I traced the races and uncertain email sends."
section: "engineering"
tags: ["cloudflare", "turnstile", "observability"]
---

# Cloudflare Turnstile: What Kept Breaking My Signup Form

My newsletter form could cancel its own signup request after Turnstile reported success. In a controlled reproduction, a repeated readiness callback created another widget while the POST was pending. An error from that widget could abort the request already in flight.

That was one failure in a longer investigation of my blog's signup form. A server secret had been invalid. Generated HTML had lost the public key. An AI-assisted repair passed local tests but used a readiness method the real Cloudflare API rejected. Meanwhile, idle widget errors made the logs look like failed submissions.

The code now makes ownership explicit: which attempt owns a callback, which durable record permits an email, and which observation establishes acceptance. A token, an HTTP response and an active subscription each prove different things.

The changes below fixed reproducible defects and gave those stages separate evidence. They did not explain every challenge failure or establish how many readers I had lost.

## Find the last stage you can prove

Turnstile's widget uses a public sitekey; server-side validation uses a private secret. Between the generated page and an active subscription, there are several opportunities for one part to work while the next part fails.

For a similar integration, I would start with this diagnostic map. The final column distinguishes findings from the validation policy I implemented.

| Symptom | Stage to inspect | Decisive check | Finding or policy here |
|---|---|---|---|
| `invalid-input-secret` | Server credential | Read the actual Siteverify result; test the deployed widget and secret together | Installing an existing recognized secret was followed by successful real verification |
| Widget cannot initialize because its sitekey is missing | Generated browser configuration | Read the served form's dataset and render that form through the actual SSG | Direct attribute binding restored the key; a hand-built test DOM had hidden the defect |
| Readiness exception with a deferred script | Native script integration | Exercise the real API with the actual script tag and initialization method | Deferred `onload` handling replaced the incompatible `ready()` call |
| `300031` in a widget error report | Challenge lifecycle | Read the attempt phase and operation state alongside the code | All 21 reports with phase evidence said idle/not-started; their challenge-failure cause remains unknown |
| Token rejected after the browser obtains it | Server validation | Inspect the validation result and the application's hostname/action policy | Policy: distinguish expiry/reuse, service failure and hostname/action rejection |
| Accepted response with no new email | Signup outcome | Join the request to its admission/send record, then check mailbox receipt and activation | Some accepted requests intentionally send nothing; one designated fresh cycle completed |

An absent report is another uncertainty. Reporting can fail, and stored records have retention limits. This map depends on positive evidence at the relevant stage; it cannot reconstruct every earlier attempt.

## Make callbacks belong to one attempt

The client already tracked verification and sending, but its readiness path could create a widget outside that lifecycle. A ready event was allowed to render while the form was already sending. Its error callback then entered the same failure handler used by verification and aborted the pending POST.

The [attempt model](https://github.com/gkoreli/blog/blob/b94063aa/packages/blog/src/client/subscription-attempt.ts) now owns one identity and a small lifecycle: verifying, sending, settled. Waiting for the API, rendering and interaction are steps inside verification. Its commands check both state and the deadline. Timer callbacks can arrive late in a background tab; checking the clock only in a timer would leave expired commands usable.

The DOM and provider adapter own a separate widget generation. Retiring that generation happens before cleanup, so a callback fired during removal is already stale. The model contains no DOM, fetch, email address or provider object.

| Event ordering reproduced locally | Rule enforced by the repair |
|---|---|
| Readiness repeats during a held POST | Sending cannot create a verification widget |
| `execute()` calls success synchronously, then throws | Token handoff has already transferred ownership to sending; the old stack cannot cancel it |
| An old render returns after a replacement widget exists | Old cleanup cannot clear the replacement's slot |
| Both native removal and the DOM fallback throw | Cleanup is reported separately and cannot prevent the single signup POST |
| A token or expiry callback repeats after handoff | A retired widget cannot send again or settle the request |

My recovery allowlist covers `300*`/`600*` error callbacks, iframe load error `200500`, and timeout codes `110600`/`110620`. It permits one fresh widget under the same attempt identity and existing deadline. Native `retry` is set to `'never'`; I own that recovery rather than combining two retry mechanisms. A repeated failure restores manual retry. Eligibility is a recovery policy, not a diagnosis of an internal suffix.

Native browser controls checked the actual generated forms and client with Cloudflare's native script and [official dummy keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/), which give fixed test behavior. Two concurrent forms each started one POST, survived repeated readiness while both responses were held, then completed when the local receiver released them. An always-failing dummy key produced one replacement, two reports under one attempt and no POST.

Those controls exercise real script integration against a local receiver. They do not test a human checkbox, production hostname enforcement or email delivery. [Browser reproductions and native receipts](https://github.com/gkoreli/blog/blob/b94063aa/packages/blog/drafts/research/newsletter-reliability/33-browser-attempt-domain.md).

## The fake API accepted what the real API rejected

The readiness regression was an example of a test missing the contract it needed to check.

I asked the agent to read the authoritative documentation and native API capabilities. It added `turnstile.ready()`. The fake implementation in its tests called the supplied callback immediately. The deployed browser failed, and inspection of the captured public API identified the async/defer guard and native error `3857`.

Cloudflare's [rendering documentation](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/) includes a deferred-script example with an `onload` callback. Its advanced example using `ready()` loads the script synchronously. We combined the loading mode from one example with the readiness method from another.

The corrected integration installs a global callback before loading the provider script:

```html
<script>
  window.gkTurnstileScriptState = 'loading';
  window.gkTurnstileReady = () => {
    window.gkTurnstileScriptState = 'ready';
    window.dispatchEvent(new Event('gk-turnstile-ready'));
  };
</script>
<script
  src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=gkTurnstileReady"
  defer
></script>
```

This snippet signals readiness. The [form initializer](https://github.com/gkoreli/blog/blob/b94063aa/packages/blog/src/client/subscribe.ts) listens for the event. It creates a widget only for an active attempt; if the API is already available, that attempt can start directly. A submission waiting for the script starts verification once. If loading never finishes, a deadline restores the form. Those states are necessary; the callback alone is not a complete initializer.

The regression test now supplies a `ready()` method that throws and checks that this deferred integration never calls it. Separate tests cover delayed and absent loading. That loader correction passed the November 5 UTC real browser signup recorded later in this article. Reading the right documentation and running mocks had both been useful, but neither had exercised the invalid combination we shipped.

## Test the runtime that will run the repair

The deeper audit nearly introduced another integration failure. Provider requests followed redirects by default. A local control showed a `307` forwarding the synthetic Siteverify secret/token body to a second owned origin. The proposed fix, `redirect: 'error'`, passed Node tests.

Workers rejected that option before sending any request. Its [native Request contract](https://developers.cloudflare.com/workers/runtime-apis/request/) supports `follow` and `manual`, and documents the unsupported error mode. A local workerd control reproduced the exception at my site's `2026-03-06` compatibility date. This proposal was corrected before delivery.

The server adapters now use `manual` and explicitly reject redirects. Native controls check both sides: ordinary verification and email requests still work, while redirected requests make zero calls to the target. A test that only expected a redirected request to fail would have passed an adapter that broke every request. Browser Fetch supports the error mode; the signup client uses it there.

Response reading needed its own boundary too. Getting headers does not finish a request. The server keeps each attempt's original five-second verification or eight-second email budget through bounded body consumption; headers do not start another full budget. Actual-byte limits and nonblocking cancellation cover unfinished or oversized streams. These are bounded application policies checked in the local runtime, not measured production latency guarantees.

## Preserve what you know across retries

The browser's token handoff is also a side-effect boundary. Once the POST starts, losing its response cannot establish that the server did nothing. I do not automatically replay that POST. Responses that leave the signup outcome uncertain, including gateway failures, give check-inbox guidance before another attempt.

Even HTTP `202` needs its application contract. The old client treated the status alone as accepted. It now requires JSON containing exactly `{ "ok": true }`, read within the same thirty-five-second request budget and a 4 KiB body cap. A `202` HTML page or unfinished body stays unconfirmed. The request reference and observed status survive a failed body read, so diagnostics retain the last fact the browser actually received.

The server has different retry rules. [Turnstile tokens](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) expire after five minutes and are single-use; Siteverify supports a UUID `idempotency_key` when retrying validation. My verifier permits two bounded calls with the same UUID and identical body. Invalid-secret failures stop immediately. Successful validation requires the expected hostname and rejects another nonempty action. Missing or empty action remains an explicit cached-client exception.

The provider decoder also checks the whole relevant verdict. A synthetic reply with `success: true` and `error-codes: ["invalid-input-response"]` previously crossed admission. It now returns verification unavailable. This is a contract test, not a claim that Cloudflare emitted that contradiction in production.

Email retry needs a further distinction. The sender reused its body and idempotency key, but its last response could overwrite an earlier uncertain outcome. A controlled first call lost its response after possible acceptance; a second returned `400`. The old code called the operation failed. That second response could not establish what happened on the first call.

| Evidence for the email operation | Knowledge retained |
|---|---|
| Non-retryable rejection on the first call, such as `400` | Failed; stop without another call |
| Lost response or malformed acceptance receipt | Unknown; preserve the charged admission |
| Unknown first result, then a rejection | Still unknown |
| Valid accepted replay for the same operation | Accepted by the provider |
| Accepted result, then lost database-write acknowledgment | Acceptance known; receipt persistence unconfirmed |

[Resend retains idempotency keys for twenty-four hours](https://resend.com/docs/dashboard/emails/idempotency-keys). My sender retries during the same signup request, with at most two bounded calls using the same body and key. A second call is limited to transport loss/timeout, HTTP `5xx` or `409`, an invalid success receipt, or a `429` with a supported numeric wait of at most three seconds (one second when absent). A durable admission stays charged for accepted, failed and unknown outcomes. [Provider contract reproductions](https://github.com/gkoreli/blog/blob/b94063aa/packages/blog/drafts/research/newsletter-reliability/34-provider-contract-boundaries.md).

## Configuration can fail on either side of the browser

The loader needed a public key in the browser and a valid private secret on the server. Both boundaries had failed at different times.

In September, a legitimate signup failed with `invalid-input-secret`. My form suggested retrying or allowing bot protection in the browser. Those instructions could not repair the server credential. Cloudflare [distinguishes secret errors from response-token errors](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/); the application needs to preserve that distinction when deciding what the reader can usefully do.

The September 9 live test reproduced the failure. Installing an existing recognized secret in the Worker was followed by successful verification and a completed signup. A binding's presence had not established that its value worked. The [dated acceptance](https://github.com/gkoreli/blog/blob/ed00e62/packages/blog/drafts/research/newsletter-reliability/15-live-signup-acceptance.md) does not identify who installed the earlier value or when it became invalid.

In October, the build had a public key but the generated form had no `data-turnstile-sitekey` attribute. I use `@nisli/core` templates and static generation. This opening-tag fragment tried to insert optional attribute syntax through a nested template:

```ts
novalidate${turnstileSiteKey ? html` data-turnstile-sitekey="${turnstileSiteKey}"` : ''}
```

The nested template was not an attribute-syntax string. The installed renderer produced malformed attributes and lost the key. An isolated build reproduced the saved production HTML.

The repair bound the value directly:

```ts
novalidate data-turnstile-sitekey=${turnstileSiteKey}
```

The old client tests had supplied the expected dataset by hand. They tested the client after bypassing the broken handoff. The replacement coverage renders the actual forms, reads their DOM attributes and initializes the actual client from a snapshot. The build also rejects a configured main form missing its key. [Reproduction and repair](https://github.com/gkoreli/blog/blob/ed00e62/packages/blog/drafts/research/newsletter-reliability/17-rendered-sitekey-regression.md).

For a form fed by generated HTML, inspect the value where the client consumes it. The successful September verification did not prove that October's generated form still delivered its key.

## Interpret an error in the attempt that produced it

The logs that prompted the latest investigation contained 49 retained client errors in a fixed window: October 6 at 00:00 through November 5 before 15:15 UTC. Of those, 48 were widget errors. Only 21 had phase/provider evidence; all 21 reported `idle`, operation `not-started`, and code `300031`. The other 27 widget reports lacked that evidence. [Query, aggregate and limits](https://github.com/gkoreli/blog/blob/ed00e62/packages/blog/drafts/research/newsletter-reliability/27-current-idle-widget-errors.md).

My form rendered its widget at initialization and executed the challenge on submission. Rendering could still invoke an error callback before an attempt was active. The application logged it under `subscribe_form` and displayed a verification-failed message. The component label and visible message made the event look like a failed signup.

Cloudflare's [error reference](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/) groups `300*` as generic challenge failure and reserves the remaining digits for internal use. I found no public diagnosis of `031` there. The code does not independently identify the operators as bots, and the report count does not establish subscriber loss.

The phase describes the callback being reported. An idle record cannot tell me whether that operator tried to subscribe earlier. Missing phase information leaves the older reports unresolved too.

The first repair stopped showing a failed-subscription message for an idle callback. The later refactor goes further: an idle form creates no widget. Submission captures an intent, creates a random attempt reference and gives its widget a defined lifetime.

That changes what the logs can count. Fewer idle widget errors after lazy initialization would follow from creating fewer idle widgets; it would not independently establish better signup completion. I need comparable builds and submitted-attempt outcomes before interpreting a rate change. Phase, timing and build context can segment the retained failure reports. They do not supply a count of all submitted or completed attempts.

## Keep widget mode separate from its timing

I moved the existing widget from Invisible to Managed so verification could ask for interaction when needed. Cloudflare [recommends Managed mode](https://developers.cloudflare.com/turnstile/concepts/widget/), which can choose a non-interactive check or a checkbox. This was a choice about the recovery path available to the reader. I did not establish that Invisible caused `300031` or measure a false-rejection improvement after switching.

The client controls two other decisions:

```js
execution: 'execute',
appearance: 'interaction-only',
size: 'compact',
```

Execution controls when the challenge runs; appearance controls when the widget becomes visible. These are [separate settings](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/). In my form, submission starts execution and the compact widget appears when interaction is needed.

An application deadline also has to allow that interaction. My normal verification window is thirty seconds. The first before-interactive callback replaces it with a two-minute window; repeated callbacks cannot extend it indefinitely. These are application limits tested with controlled callbacks, not provider defaults. The accepted live cycle did not require a checkbox, so it does not validate every interactive browser condition.

## Put the business boundary in the code

The server now separates confirmation policy from HTTP, SQL and provider responses. Its application coordinates verification, durable admission and a delivery receipt; each has an explicit outcome. [Application boundary and checks](https://github.com/gkoreli/blog/blob/b94063aa/packages/blog/drafts/research/newsletter-reliability/37-confirmation-application-boundary.md).

The public signup and resend routes admit at most one confirmation per address per ten minutes, three per address per rolling day, and shared ceilings of 25 per rolling hour and 100 per rolling day. These are policy values, not measured safe thresholds. The shared budget remains inside one D1 transaction. Moving its check into an in-memory object would let concurrent Workers admit against separate counts. The transaction reserves before the external call; a subscriber-write failure rolls back admission. A fresh native D1 control admitted once from forty-eight concurrent admission calls for one address, alternating signup and resend modes. It exercises the store directly.

That transaction cannot contain the email provider. There is no outbox or automatic crash replay. A Worker can stop after reserving and before sending, leaving an unused but charged admission. A send already admitted can finish after an opt-out. Those tradeoffs remain explicit.

Closed logs preserve the last observed stage without email addresses, tokens or arbitrary provider text. Even an unexpected delivery-adapter exception records unknown; it cannot authorize another send.

## Prove the outcome after verification

During the earlier live check, my own success message confused me:

> Request received. If confirmation is needed, check your inbox and spam folder. No email? You can try again in ten minutes.

It was the normal HTTP `202` branch, styled in the same rust color as errors. The response intentionally kept subscription membership private: an already-active or suppressed address, or one inside its cooldown, could receive it without a new email.

I kept that protection, separated pending/success/error styling and explained the existing-subscriber case. The accepted response now communicates its limited promise more clearly. It still cannot establish mailbox receipt or activation.

During a later no-send check, an already-loaded page reached a newer Worker. Its retained trace showed successful real verification followed by `unchanged` and `202`. Before/after readback found the active state and confirmation ledger count unchanged. Joining the request to its receiving Worker mattered: the page's build ID named that page build, not the receiving server. [Dated production check](https://github.com/gkoreli/blog/blob/cca34028/packages/blog/drafts/research/newsletter-reliability/2026-11-06-browser-production-no-send.md).

The diagnostic path needs evidence too. My default reporter now expects a `204` returned after confirmed storage. A bounded early reporter covers selected main-script, Turnstile-script and CSP failures, but cannot report when its own JavaScript or network request cannot run. Attempt references help join client evidence to server activity even without a received response; they remain client-supplied lookup hints. The [reporting record](https://github.com/gkoreli/blog/blob/ed00e62/packages/blog/drafts/research/newsletter-reliability/28-managed-verification-and-diagnostics.md) keeps the details and controlled readbacks. Logging an error is not itself proof of storing it.

On November 5 UTC, one designated signup cycle passed real verification, produced one accepted confirmation and reached Gmail Inbox with SPF, aligned DKIM and DMARC passing. I confirmed the message before the agent opened its link; the agent then independently read active state and a cleared confirmation hash. The Worker verification/send events matched the same durable admission. [Stage-by-stage receipt](https://github.com/gkoreli/blog/blob/ed00e62/packages/blog/drafts/research/newsletter-reliability/subscription-recovery-live-acceptance.json).

Signed bounce and complaint handling was verified later with Resend's inert test addresses, separately from that signup cycle. The [follow-up acceptance](https://github.com/gkoreli/blog/blob/e089f77/packages/blog/drafts/research/newsletter-reliability/30-signed-resend-feedback-acceptance.md) closes that setup gap without adding a claim about real-reader delivery.

The new browser, provider and D1 controls above were a later engineering iteration. The completed Inbox cycle remains its own dated production result; it does not certify every subsequent revision. Native dummy-key success, source delivery, Worker activation and a completed subscription each need their own receipt.

The blog still uses Turnstile. The repairs give each attempt a lifecycle and keep uncertain side effects uncertain. I can now test which boundary fails without using one generic widget error as the explanation for the whole signup. The cause of the 21 `300031` reports with phase evidence remains unknown, and the rate at which legitimate readers finish under real browser and network conditions remains unmeasured.

---

## Glossary

| Term / claim | Primary source | Date |
|---|---|---|
| Sitekey, secret and Managed/Invisible modes | [Cloudflare widget documentation](https://developers.cloudflare.com/turnstile/concepts/widget/) | Updated April 16, 2026; checked November 5 |
| Deferred onload and synchronous `ready()` examples | [Cloudflare client rendering](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/) | Updated June 17, 2026; checked November 5 |
| Execution, appearance and interaction callbacks | [Widget configurations](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/) | Updated June 28, 2026; checked November 5 |
| Generic challenge failures and internal suffixes | [Client error codes](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/) | Updated September 25, 2026; checked November 6 |
| Native retry options and callback logging | [Client error handling](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/) | Updated May 5, 2026; checked November 5 |
| Secret errors, token lifetime and validation idempotency | [Siteverify](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) | Updated October 22, 2026; checked November 5 |
| Workers redirect capability | [Workers Request API](https://developers.cloudflare.com/workers/runtime-apis/request/) | Checked November 5 Pacific / November 6 UTC; local compatibility date 2026-03-06 |
| Email retry identity and retention | [Resend idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys) | Checked November 5 Pacific / November 6 UTC |
| Sequential transactional admission | [D1 batch](https://developers.cloudflare.com/d1/worker-api/d1-database/) | Checked November 5 Pacific / November 6 UTC |

The wider audit also repaired [webhook authentication of decoded rather than original bytes](https://github.com/gkoreli/blog/blob/b94063aa/packages/blog/drafts/research/newsletter-reliability/36-request-body-and-webhook-contracts.md) and [campaign sends without durable admission](https://github.com/gkoreli/blog/blob/b94063aa/packages/blog/drafts/research/newsletter-reliability/35-campaign-admission.md); those adjacent defects do not explain Turnstile's generic challenge errors.

The [prompt record](/cloudflare-turnstile-signup-failures/prompts) preserves eight selected shaping messages in full. An operational authorization containing a private email and unrelated housekeeping are omitted.
