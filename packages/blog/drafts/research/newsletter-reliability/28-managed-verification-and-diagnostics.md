# Managed verification, recoverable failures and useful diagnostics

November 5, 2026. Follows the [fresh retained-error diagnosis](27-current-idle-widget-errors.md). Goga authorized one designated test recipient, a review against authoritative documentation, setup repairs and better client/Turnstile visibility. The recipient and operational captures stay private.

## What the configuration review establishes

The signed-in Cloudflare dashboard shows one widget, the same public key served by the site, one allowed hostname (`gkoreli.com`), Invisible mode and disabled pre-clearance. Its last-24-hour analytics view initially says no data available. That is a dashboard observation, not a zero-request count. The current browser successfully submits an already-active designated address and receives the normal request-received response. That control exercises verification and unchanged-subscriber handling; it intentionally sends no mail and does not verify new signup completion.

Cloudflare's [widget documentation](https://developers.cloudflare.com/turnstile/concepts/widget/) recommends Managed mode, which can choose an interactive checkbox when more verification is required. Invisible is a supported configuration, not a proven explanation for the retained failures. Managed gives this form an interactive recovery path; changing modes cannot establish how many prior visitors would have succeeded.

The [configuration reference](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/) documents execution and appearance separately, automatic retry, compact size and before/after-interactive callbacks. The existing explicit-render/execute integration is valid. Its manual-only failure path and short interaction deadline were application choices, not provider requirements.

[Server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) is mandatory; tokens expire after five minutes and are single-use. Hostname checking remains enforced and another action remains rejected. Previously cached clients with no action remain compatible. The new bounded retry uses the documented Siteverify idempotency key and identical request payload, with at most two five-second verifier calls. Email retries have their own existing idempotency key and admission ledger.

[Client error codes](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/) keep invalid-key, hostname, network/iframe, timeout and challenge failures distinct. The new implementation preserves the numeric client code and closed server provider codes; neither becomes a human/bot verdict. [CSP guidance](https://developers.cloudflare.com/turnstile/reference/content-security-policy/) identifies required script/frame permissions. No production CSP restriction is relaxed by this change.

The widget's Invisible-mode UI also requires a Turnstile Privacy Addendum reference. The site's existing text linked the general privacy policy; the explicit addendum link is now included. [Analytics](https://developers.cloudflare.com/turnstile/turnstile-analytics/), [challenge outcomes](https://developers.cloudflare.com/turnstile/turnstile-analytics/challenge-outcomes/) and [token validation](https://developers.cloudflare.com/turnstile/turnstile-analytics/token-validation/) are separate views. Challenge issues/solves, server token validation, admitted confirmation, provider acceptance, mailbox receipt and activation are not interchangeable conversion stages.

## Implemented behavior

- An idle widget error remains a diagnostic without replacing the form's message with a failed-subscription claim.
- One documented transient callback can retry automatically within the existing verification deadline; a second failure or a configuration failure restores a usable manual retry. There is no automatic signup POST retry.
- Managed interaction uses the compact widget, shown when interaction is required. Its first interactive callback allows two minutes; repeated callbacks cannot extend that deadline indefinitely.
- Once a token is handed off, the widget is removed. Late widget expiry/error events cannot abort an in-flight server operation or discard its eventual response.
- The initial HTML uses POST and disables submission until the handler is installed. Missing JavaScript cannot turn the email into a default GET query. A no-script message explains verification and links RSS; a failed main script produces visible retry guidance through the early reporter.
- Closed `subscribe-error-v3` evidence preserves a random reference for one attempt, elapsed milliseconds, online/offline and visibility states, widget/script readiness and automatic/manual recovery. It retains phase, provider code and available server response UUID. Historical v1/v2 remain supported; no rows are backfilled and no migration is required.
- The same syntactically validated attempt reference travels in `x-subscription-attempt-id` and server logs, including failures without a usable response. It is a forgeable lookup hint, not authentication or a persistent reader ID. CORS exposes the existing response reference/retry hint to allowed clients and permits the new request header.
- Server logs distinguish invalid inputs, configuration/limit decisions, verification success, closed provider failure codes/status, retry reason/count, verifier timing and admitted send outcome. Client ingestion logs now include event/build/occurrence references and bounded subscription evidence; confirmed storage logs carry the event ID.
- The default client uses keepalive fetch and checks the existing 204 persistence contract. It permits twenty reports per page and three copies of one normalized signature. Early inline reporting separately permits three deduplicated fixed stages for main/Turnstile script-load or enforced Turnstile CSP failures. Resource URLs and exception text are not copied by that bootstrap. Delivery failure produces a static local console warning without recursive reporting or automatic retries.

These are bounded operating policies, not measured optimal limits. Reports can be lost, blocked, spoofed, capped or repeated across page loads. Bootstrap reporting itself needs working JavaScript/network access and an allowed inline script. It covers selected resource/CSP failures, not every bootstrap exception or third-party iframe console message. No session replay, raw form capture or provider response-body capture is added.

## Verification and delivery

All 185 blog tests pass, including retry recovery, interactive deadline bounds, stale callback isolation, actual SSG form activation, v3 sanitization/legacy profiles, attempt-reference logging, early-script reporting without the main client and default reporting budgets. Workspace types and all 30 Markdown validations pass. Native workerd/D1 independently stores a closed v3 report and two early bootstrap reports; extra private-marker properties and resource URL details do not survive.

The initial native adapter rejected its unsupported keepalive option before those bootstrap requests reached workerd. The corrected adapter asserts that the browser request asks for keepalive and omits only that unsupported host option. This native result does not claim browser wire-delivery behavior. Other disposable-harness failures are preserved privately, separately from service failures.

The isolated production build and final release/live acceptance are recorded below when observed. Shared development `dist/` is untouched. No protection is removed, key rotated, subscriber directly edited in SQL or production fault burst performed. Existing confirmation admission ceilings remain in force.

### Source and served release accepted; browser acceptance waiting

[Release receipt](subscription-recovery-release.json): source `5ac791e` is pushed to main. Fresh CLI metadata allocates Worker `f5a3e7f6-0084-4a90-a87c-20615418f860` at 100% from 15:52:01 UTC. The 34,068-byte served client carries build `9d3fc9bb-c6b2-43a2-a62d-61df4b12203c` and that exact source; reconstruction with the actual bundler settings matches every byte. The fresh excluded `/owner` response independently has POST/disabled initial form behavior, no-script guidance, nonempty key and the early reporter before the external Turnstile script, with the same build identity. Its CSP already permits Turnstile scripts, frames and connections. The final isolated build covers 41 posts. No shared development output is used.

The Mac locked before Managed activation or the post-deployment browser test. Manual unlock is requested. The widget remains Invisible at this checkpoint; no unsubscribe, fresh confirmation send, mailbox receipt, activation or deployed browser diagnostic readback is claimed. The designated address remains active. The prepared private test runner uses ordinary unsubscribe/confirmation HTTP actions and targeted metered reads; it has not been executed.

### Additional sender and feedback findings

Fresh production binding-name inspection finds the four required secrets but no `RESEND_WEBHOOK_SECRET`. The available local Resend key returns `401 restricted_api_key` for read-only `/webhooks` and `/domains`; this does not establish that no endpoint exists in the account. Existing Cloudflare OAuth returns 403 on the widget API, so that credential cannot substitute for the signed-in dashboard. No new credential is created or permission broadened.

Both authoritative nameservers return no `_dmarc.gkoreli.com` TXT record. Public SPF and DKIM records are present. Newly accessible authentication headers on the retained September message independently show aligned `dkim=pass` and `spf=pass`, without a DMARC result. Its current Inbox label does not rewrite the original observed Spam placement or establish current mail delivery. No cause for that placement is inferred.

Resend's [DMARC guidance](https://resend.com/docs/dashboard/domains/dmarc) advises checking authentication and starting with `p=none` before stricter enforcement. A bounded proposed next DNS change is one `_dmarc` TXT policy beginning `v=DMARC1; p=none`; no record, aggregate-report recipient or stricter policy is installed here. [Webhook guidance](https://resend.com/docs/webhooks/introduction) describes delivery/bounce feedback separately from API acceptance. Existing TASK-0142 owns inspection and activation of the signed bounce/complaint connection; TASK-0145 owns sender-policy acceptance and mailbox placement. The browser/account access needed to complete those changes remains unavailable at this checkpoint.

## Remaining acceptance

### Further native API and success-state review

Goga correctly flags the generic request-received text as confusing. It is the normal HTTP 202 branch, also used for an already-active address to avoid exposing subscription membership. The message's inherited rust color incorrectly made accepted requests look like failures. The refined client gives pending, accepted and error states separate styling, explains the already-subscribed case, and preserves the ten-minute retry guidance without claiming an email was sent or a subscription activated.

Further review uses Cloudflare's actual [JavaScript API examples](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/) and [retry callback example](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/), plus the installed `@nisli/core` README and actual SSG/client tests. Native HTML attributes and DOM APIs remain appropriate for this form; adding another framework or SDK is not required for correctness.

| Native capability | Applied decision |
|---|---|
| `turnstile.ready()` | Wait before rendering; a waiting submission starts exactly once after readiness. A never-ready callback remains bounded by the form deadline. |
| Error callback return value | Return false during the single automatic retry, matching the documented example; terminal handling returns true. |
| `remove()` versus `reset()` | Fresh attempts retain fresh widgets; removal is documented and prevents old callbacks from being attributed to a new attempt. |
| `getResponse()` / hidden response field | Success callback hands the token directly to the existing JSON request; no second token copy or response field is needed. |
| `isExpired()` / expiry callback | Fresh callback token goes immediately to Siteverify; expiry handling and mandatory server validation remain the gates. |
| Action / hostname / optional cData | Existing `subscribe` action and exact hostname remain checked. The separate bounded attempt reference supplies correlation; no extra personal cData is needed. |
| Pre-clearance | Remains disabled: signup protection does not need an additional zone-clearance cookie. |
| Server API / native fetch | Direct JSON Siteverify is supported, including the shared idempotency key. A new dependency is unnecessary. |

All 189 tests, workspace types, Markdown validation and the isolated 41-post build pass. Six paired compiled-client/native Worker/D1 controls also pass; the updated fixture verifies the client attempt reference against the server log even for a constructed lost response. These are controlled local cases, not current browser/provider delivery evidence.

Publish the checked source, verify the active Worker and served client, then change the existing widget to Managed with its hostname/key/pre-clearance preserved. The designated address is currently active: exercise an ordinary unsubscribe POST followed by browser signup, one new confirmation receipt and confirmation activation, leaving it active. Record browser, provider, mailbox and D1 evidence separately. Verify one labelled browser diagnostic through the deployed logger with independent readback and guarded fixture cleanup. Keep the recipient, tokens, provider message details and raw logs outside Git.

Broader configuration-failure alerts, provider webhook setup and population delivery/false-rejection rates remain separate open work. This repair must not be described as proof that no future signup can fail or that historical lost subscribers were recovered.
