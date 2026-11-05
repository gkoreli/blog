# Cloudflare Turnstile: What Kept Breaking My Signup Form

My blog's client-error logs had me worried that people were trying to subscribe and getting nowhere. In the month I checked, there were 48 retained Turnstile widget errors. All 21 reports that included phase information marked the form as `idle` and the signup operation as `not-started`.

The same investigation also found real integration failures. A production secret had been invalid. A template change had dropped the public key from the rendered form. During the latest repair, my AI agent introduced a loader change that passed its local tests and failed against Cloudflare's actual JavaScript API.

Keeping this form working meant answering several different questions:

- Did the browser receive the configuration and load the real API?
- Did an error interrupt someone's submission, or happen in an idle widget?
- Could the form recover without sending a duplicate request?
- Did the request eventually produce a confirmation email and an active subscription?

This is the account of those failures on my own blog, through November 5, 2026. Several came from my integration. The challenge failures still have an unresolved cause. I cannot turn the error count into a count of readers lost.

## A table of errors looked like a table of failed signups

My form rendered a widget when the page initialized, then called `execute()` when someone submitted. An error callback could run before that submission. The application logged it under `subscribe_form` and displayed a verification-failed message even though nobody had asked to subscribe.

That made the logs and the interface tell the same misleading story.

The bounded query covered October 6 at 00:00 through November 5 before 15:15 UTC. Its result was:

| Retained evidence | Reports | What I could establish |
|---|---:|---|
| Older widget errors | 27 | Their phase and provider code were missing |
| Newer widget errors | 21 | Every report said `idle`, operation `not-started`, code `300031` |
| Other client errors | 1 | Outside this widget cohort |

The query, its native D1 checks and the aggregate results are in the [dated investigation](https://github.com/gkoreli/blog/blob/ed00e62/packages/blog/drafts/research/newsletter-reliability/27-current-idle-widget-errors.md). These are retained reports, with incomplete delivery and retention, rather than a census of visits or attempts.

Cloudflare's [error reference](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/) groups `300*` under generic challenge failure. The remaining digits are internal. I found no public explanation of `031` in that reference. Its bot-detection guidance does not independently identify the operators behind my reports.

I now retain an idle failure as a diagnostic without replacing the form's message with a failed-subscription claim. A later submission can create a fresh widget. Recording the phase made the error useful; counting it alone had made it alarming.

## The server secret existed, and verification still failed

An earlier failed signup returned `invalid-input-secret` from Siteverify. The form suggested trying again or allowing bot protection in the browser. Those instructions could not repair the server credential.

Turnstile has two separate keys: the public sitekey used by the widget and the private secret used by the server. Cloudflare [defines invalid-secret errors separately from invalid response tokens](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/). Checking that a Worker binding named `TURNSTILE_SECRET_KEY` existed established only that a binding was present.

The September 9 live test reproduced the invalid-secret failure. Installing an existing recognized secret in the production Worker was followed by a successful real verification and a completed signup. No new key pair was generated. The [acceptance record](https://github.com/gkoreli/blog/blob/ed00e62/packages/blog/drafts/research/newsletter-reliability/15-live-signup-acceptance.md) separates that configuration change from code deployment and mailbox receipt.

I still cannot say who installed the old value or when it became invalid. Normal secret metadata does not reveal that history. The useful correction was to report a server configuration failure accurately and test the deployed widget and secret together.

## The public key disappeared between source and HTML

In October, the configuration problem moved to the browser. The build had a public key, but the rendered form had no `data-turnstile-sitekey` attribute for the client to read.

I use `@nisli/core` templates and static generation. The source had tried to insert an optional attribute through a nested template inside an opening tag:

```ts
novalidate${turnstileSiteKey ? html` data-turnstile-sitekey="${turnstileSiteKey}"` : ''}
```

That nested template was not an attribute-syntax string. The installed renderer produced malformed attributes and lost the key. An isolated build reproduced the saved production HTML; this was a concrete failure in how I used the template system.

The repair bound the value directly:

```ts
novalidate data-turnstile-sitekey=${turnstileSiteKey}
```

My client tests had supplied the expected dataset by hand. They could test missing-key handling, but they could not detect that the real template had stopped delivering the key.

The replacement coverage renders the actual forms through the actual static-generation path, reads their DOM attributes and initializes the actual client from a snapshot. The build also rejects the malformed binding markers and a configured main form missing its key. [Reproduction and repair](https://github.com/gkoreli/blog/blob/ed00e62/packages/blog/drafts/research/newsletter-reliability/17-rendered-sitekey-regression.md).

If you are implementing a similar form, verify the value where the client consumes it. A correct environment variable does not guarantee a correct DOM attribute.

## A readiness fix broke against the real API

The agent introduced another failure while fixing the others.

I asked the agent to read the authoritative documentation and check whether we were using the native API properly. It added `turnstile.ready()`. The tests supplied a fake method that immediately called its callback. They passed.

The deployed browser test failed. The actual API rejected `ready()` with our deferred script tag, throwing native error `3857`.

Cloudflare's [explicit-rendering documentation](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/) contains a deferred-script example with an `onload` callback. Its advanced example using `ready()` loads the script synchronously. We combined the loading mode from one example with the readiness method from another. Reading the documentation had not ensured that the combination was valid.

The public `api.js` captured during this investigation contains the guard that rejects that combination. The corrected loader keeps `defer` and uses the documented callback pattern. This is the relevant part of my integration:

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

The form listens for that event, or renders directly if the API is already available. A submission waiting for the script starts verification once. If the script never loads, the attempt reaches a deadline and restores the form. The snippet is only the loading signal; it does not implement those form states itself.

The regression test now supplies a `ready()` method that throws and checks that this deferred integration never calls it. Separate tests cover delayed and absent loading. The [corrected client](https://github.com/gkoreli/blog/blob/9c0b674/packages/blog/src/client/subscribe.ts) then passed the real browser signup.

The fake API omitted the constraint that mattered. A passing test against it was insufficient acceptance evidence.

## Mode, appearance and execution answer different questions

My widget had been configured as Invisible. I wanted verification to stay out of the design, but I also wanted a reader to have somewhere to interact when an extra check was required.

Cloudflare [recommends Managed mode](https://developers.cloudflare.com/turnstile/concepts/widget/), which can choose a non-interactive check or a checkbox. I switched the existing widget to Managed while preserving its hostname and key. That choice gives the provider an interactive option. It does not establish that Invisible caused `300031` or that Managed reduces false rejection on my site.

The client configuration controls two other decisions:

```js
execution: 'execute',
appearance: 'interaction-only',
size: 'compact',
```

Execution determines when the challenge runs. Appearance determines when the widget becomes visible. These are [separate controls](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/). In this form, submission starts execution, and the widget appears when interaction is needed.

That also changes the application's timing requirements. My normal verification deadline is thirty seconds. The first before-interactive callback replaces it with a two-minute window; repeated callbacks cannot keep extending it. These are limits I chose, with controlled tests for their behavior. The live acceptance did not require a checkbox, so it does not validate every interactive browser condition.

The configuration review also found a disclosure detail: Invisible mode requires a reference to the Turnstile Privacy Addendum. My policy linked the general privacy policy; I added the explicit addendum link. UI options can carry obligations outside the widget code.

## Retry and expiry need an application state machine

A single failure handler was doing too many jobs. It could handle an idle widget error, a failure during verification, or a late event after the token had already been handed to the server.

I now distinguish idle, verifying and sending. Once the success callback supplies a token, the attempt moves to sending and the widget is removed. Callbacks from an old widget cannot abort that request or attach themselves to a later attempt.

For selected transient failures, I allow one automatic recovery within the attempt's deadline. A repeated failure or configuration error ends that attempt and restores manual retry. Cloudflare [documents automatic retry and repeated error callbacks](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/). Its callback return value also affects native console logging; `retry: 'auto'` is the retry setting. Returning `true` alone is not my terminal-recovery mechanism: terminal handling removes the failed widget.

The server has a different retry problem. Tokens are single-use and expire after five minutes. A lost validation response can leave the caller unsure whether Cloudflare processed the token. The [Siteverify API](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) accepts an `idempotency_key` for safely retrying validation. My verifier permits at most two five-second calls with the same UUID and identical body. Invalid-secret failures stop immediately; successful responses still have to pass the application's hostname and action checks.

I do not automatically retry the signup POST. If its response is lost, the server may still have admitted a confirmation email. The form asks the reader to check their inbox before another attempt. Verification recovery and permission to send another email need separate rules.

## Error reporting had its own failure modes

A callback calling my logger did not establish that I had received a useful record. Earlier versions could return a successful ingestion response before confirming a database write. A browser queuing a beacon was another different outcome.

The current default reporter uses keepalive fetch and expects the endpoint's `204` storage acknowledgment. The endpoint waits for a confirmed insert. Reporting has a per-page budget and duplicate limits, so a callback loop cannot generate unlimited reports from one page. Transport failure produces a static local warning without recursively reporting itself.

Each report now carries the build and occurrence time alongside the subscription phase, elapsed time, widget/API state, online and visibility state, and recovery choice. Each submitted attempt gets a random reference that also travels in a request header. The server validates its shape and records it alongside its own request reference. That helps join a browser failure to server activity even when the browser never receives a response. It is a lookup hint supplied by the client, not authentication or a persistent visitor identity.

I keep addresses, challenge tokens and arbitrary provider response text out of these diagnostics. More useful context does not require copying the form into the log. An attempt rejected before admission creates no new recipient record. Its error report cannot recover an address that attempt never persisted; older subscription or provider records require separate evidence.

There is also a gap before the main application starts. An early inline reporter now records selected main-script, Turnstile-script and enforced Turnstile CSP failures. The site's CSP already permitted the required resources; this repair did not relax it. Cloudflare's [CSP reference](https://developers.cloudflare.com/turnstile/reference/content-security-policy/) identifies the script and frame permissions to check. If JavaScript or the reporting request cannot run, the early reporter cannot report its own absence.

The initial HTML now uses POST and keeps the submit button disabled until its handler is installed, with no-script guidance. Without that guard, losing the main script could leave a default form submission putting an email address in a GET URL.

The loader regression provided a real storage check: two controlled browser reports reached production D1, one idle and one during verification. Their build and bounded context survived ingestion. They remain labelled repair-regression evidence; I have not counted them as reader failures. [Live readback and limits](https://github.com/gkoreli/blog/blob/ed00e62/packages/blog/drafts/research/newsletter-reliability/28-managed-verification-and-diagnostics.md).

## A successful challenge still left me wondering whether signup worked

I looked at this message on my own form and treated it as an error:

> Request received. If confirmation is needed, check your inbox and spam folder. No email? You can try again in ten minutes.

It was the normal HTTP `202` response. The application kept it generic so a request would not disclose whether an address was already active, suppressed or inside its cooldown. An already-active address intentionally received no new confirmation. The inherited rust-colored styling made the accepted response look like a failure.

I kept the membership protection, added distinct pending/success/error styling, and changed the copy to explain that new subscriptions need confirmation while existing subscribers are already set. That fixes what the response communicates. It still cannot promise that every accepted request sent an email.

My acceptance test now follows the whole operation:

| Stage | Evidence I check |
|---|---|
| Browser verification | The real form obtains a token through the provider API |
| Server verification | Siteverify succeeds; hostname and action handling pass |
| Confirmation admission and sending | A durable admission matches an accepted provider outcome |
| Mailbox receipt | The designated mailbox receives the confirmation; placement and authentication are inspected |
| Activation | Confirmation leaves the subscription active in the database |

Cloudflare's [dummy keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) are useful for deterministic automated cases. They cannot establish that the deployed production keys work together or that an email reaches its mailbox. My tests need those different levels of evidence.

On November 5, one designated cycle passed real verification, admitted one confirmation and reached Gmail Inbox with SPF, aligned DKIM and DMARC passing. I confirmed the message myself before the agent opened its link; the agent then independently read active state and a cleared confirmation hash. The real Worker verification and accepted-send events matched the same durable admission. The [sanitized receipt](https://github.com/gkoreli/blog/blob/ed00e62/packages/blog/drafts/research/newsletter-reliability/subscription-recovery-live-acceptance.json) records those stages separately.

The blog still uses Turnstile. I have a working tested path and better evidence for locating the next failure. I do not yet have a population false-rejection or delivery rate, or a defensible count of historical readers lost. Bounce and complaint feedback also remains unconnected to the correct sending account. Those limits matter when deciding what the repaired form has actually established.

---

## Glossary

| Term / claim | Primary source | Date |
|---|---|---|
| Sitekey, secret and Managed/Invisible modes | [Cloudflare widget documentation](https://developers.cloudflare.com/turnstile/concepts/widget/) | Updated April 16, 2026; checked November 5 |
| Deferred loading, onload callback and synchronous `ready()` example | [Cloudflare client rendering](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/) | Updated June 17, 2026; checked November 5 |
| Execution, appearance, expiry and interaction callbacks | [Widget configurations](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/) | Updated June 28, 2026; checked November 5 |
| Challenge error families and internal suffixes | [Client error codes](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/) | Updated September 25, 2026; checked November 5 |
| Retry behavior and callback logging | [Client error handling](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/) | Updated May 5, 2026; checked November 5 |
| Mandatory validation, token lifetime and idempotent retry | [Siteverify](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) | Updated October 22, 2026; checked November 5 |
| Script and frame permissions | [Turnstile CSP guidance](https://developers.cloudflare.com/turnstile/reference/content-security-policy/) | Updated May 5, 2026; checked November 5 |
| Predictable automated test behavior | [Dummy testing keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) | Updated October 20, 2026; checked November 5 |
