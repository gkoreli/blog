---
title: "Cloudflare Turnstile: What Kept Breaking My Signup Form"
seoTitle: "Debugging Cloudflare Turnstile Signup Failures"
date: "2026-11-06"
description: "Cloudflare Turnstile failures on my blog, traced through generated HTML, native script loading, attempt state, token validation, and completed signup."
section: "engineering"
tags: ["cloudflare", "turnstile", "observability"]
---

# Cloudflare Turnstile: What Kept Breaking My Signup Form

A repair to my blog's newsletter form passed its local tests and failed against Cloudflare's real Turnstile API. My AI agent introduced the regression: it combined `turnstile.ready()` with a deferred script, a combination the native API rejected.

I had asked for a careful review because the error logs made it look as though readers were trying to subscribe and getting nowhere. The investigation found several different problems. A server secret had been invalid. Generated HTML had lost the public key. Background widget errors looked like failed submissions. Then the repair added another failure.

What helped was tracing the request through separate stages and asking what evidence actually established each one:

- Inspect the configuration the browser receives and exercise the real provider API.
- Attach an error to an attempt and a phase before interpreting it as a failed signup.
- Follow verification through server acceptance, email receipt and subscription activation.

This is the method I arrived at through the failures on my own blog. It located several concrete defects. It did not explain every challenge failure or establish how many readers I had lost.

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

This snippet signals readiness. The [form initializer](https://github.com/gkoreli/blog/blob/9c0b674/packages/blog/src/client/subscribe.ts) listens for the event, or renders directly if the API is already available. A submission waiting for the script starts verification once. If loading never finishes, a deadline restores the form. Those states are necessary; the callback alone is not a complete initializer.

The regression test now supplies a `ready()` method that throws and checks that this deferred integration never calls it. Separate tests cover delayed and absent loading. The corrected code then passed the real browser signup. Reading the right documentation and running mocks had both been useful, but neither had exercised the invalid combination we shipped.

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

I now keep an idle failure as a diagnostic without showing a failed-subscription message. A later submit can create a fresh widget. Submitted attempts get their own random reference, phase, timing and build context. That gives me a way to locate a failure without treating each report as a person or a conversion event.

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

## Make callbacks belong to one attempt

Recovery becomes harder once the browser can be verifying, sending a request or waiting on an uncertain response.

Consider an expiry callback arriving after the token has been handed to the server. A shared failure handler could restore the form or abort the browser request while the server was already admitting an email. It could also let an old callback affect a new attempt. This is a race to handle, not a measured frequency of production failures.

My client moves the attempt from verifying to sending when it consumes the token, removes the widget and ignores callbacks from that old widget. Duplicate success callbacks cannot start another POST. A fresh manual attempt gets fresh identity and widget state.

For selected transient verification failures, I allow one automatic recovery inside the attempt's deadline. A repeated failure or configuration error ends the attempt and restores manual retry. Cloudflare [documents automatic retry and repeated error callbacks](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/). The return value also affects native logging; `retry: 'auto'` is the retry setting. My terminal path removes the widget, rather than relying on returning `true` to end its lifecycle.

The server has a separate retry boundary. Tokens are single-use and expire after five minutes. If a validation response is lost, another call needs to preserve the operation's identity. [Siteverify](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) accepts a UUID `idempotency_key` for retrying validation. My verifier permits two bounded calls with the same UUID and identical body. Invalid-secret failures stop immediately.

Successful validation also goes through application policy. My [pinned verifier](https://github.com/gkoreli/blog/blob/9c0b674/packages/newsletter/src/turnstile.ts) requires the exact hostname and rejects another nonempty action. It permits an absent or empty action for cached-client compatibility; this is not strict action-presence enforcement.

I do not automatically retry the signup POST. If its response is lost, the server may already have admitted a confirmation. The reader gets check-inbox guidance before another attempt. Retrying token validation and allowing another email have different consequences.

## Prove the outcome after verification

Even after these repairs, my own success message confused me:

> Request received. If confirmation is needed, check your inbox and spam folder. No email? You can try again in ten minutes.

It was the normal HTTP `202` branch, styled in the same rust color as errors. The response intentionally kept subscription membership private: an already-active or suppressed address, or one inside its cooldown, could receive it without a new email.

I kept that protection, separated pending/success/error styling and explained the existing-subscriber case. The accepted response now communicates its limited promise more clearly. It still cannot establish mailbox receipt or activation.

The diagnostic path needs evidence too. My default reporter now expects a `204` returned after confirmed storage. A bounded early reporter covers selected main-script, Turnstile-script and CSP failures, but cannot report when its own JavaScript or network request cannot run. Attempt references help join client evidence to server activity even without a received response; they remain client-supplied lookup hints. The [reporting record](https://github.com/gkoreli/blog/blob/ed00e62/packages/blog/drafts/research/newsletter-reliability/28-managed-verification-and-diagnostics.md) keeps the details and controlled readbacks. Logging an error is not itself proof of storing it.

On November 5 UTC, one designated signup cycle passed real verification, produced one accepted confirmation and reached Gmail Inbox with SPF, aligned DKIM and DMARC passing. I confirmed the message before the agent opened its link; the agent then independently read active state and a cleared confirmation hash. The Worker verification/send events matched the same durable admission. [Stage-by-stage receipt](https://github.com/gkoreli/blog/blob/ed00e62/packages/blog/drafts/research/newsletter-reliability/subscription-recovery-live-acceptance.json).

Signed bounce and complaint handling was verified later with Resend's inert test addresses, separately from that signup cycle. The [follow-up acceptance](https://github.com/gkoreli/blog/blob/e089f77/packages/blog/drafts/research/newsletter-reliability/30-signed-resend-feedback-acceptance.md) closes that setup gap without adding a claim about real-reader delivery.

The blog still uses Turnstile. My acceptance method now follows the form through generated HTML, the actual provider, an identified attempt, server validation and activation. The cause of the cohort's `300031` failures remains unknown. One completed Inbox cycle gives me a tested path; measuring how often legitimate readers can finish under real browser and network conditions remains open.

---

## Glossary

| Term / claim | Primary source | Date |
|---|---|---|
| Sitekey, secret and Managed/Invisible modes | [Cloudflare widget documentation](https://developers.cloudflare.com/turnstile/concepts/widget/) | Updated April 16, 2026; checked November 5 |
| Deferred onload and synchronous `ready()` examples | [Cloudflare client rendering](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/) | Updated June 17, 2026; checked November 5 |
| Execution, appearance and interaction callbacks | [Widget configurations](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/) | Updated June 28, 2026; checked November 5 |
| Generic challenge failures and internal suffixes | [Client error codes](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/) | Updated September 25, 2026; checked November 5 |
| Retry behavior and callback logging | [Client error handling](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/) | Updated May 5, 2026; checked November 5 |
| Secret errors, token lifetime and validation idempotency | [Siteverify](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) | Updated October 22, 2026; checked November 5 |
