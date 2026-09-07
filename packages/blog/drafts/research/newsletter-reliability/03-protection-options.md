# Newsletter abuse controls: decision in progress

Checked September 7 UTC, 2026. This is an architectural assessment, not a deployed change or a comparative effectiveness study.

## Protect the operation that can be abused

The protected operation is sending confirmation email and creating pending state. A completed challenge is one input to that decision. It cannot replace correct subscription transitions, delivery handling, or knowledge of whether the form works.

The existing flow applies a native per-IP limiter, validates the address, checks Turnstile, writes pending state, and schedules email. A pending address can refresh its tokens and receive another message. `/api/resend-confirmation` also sends to existing pending addresses without Turnstile, behind the same per-IP limiter. Controls must cover both send paths.

Threats to evaluate:

- Repeated confirmation mail to an address the requester does not control.
- Distributed attempts that avoid a per-IP limit and exhaust send or storage budgets.
- Duplicate/concurrent requests that invalidate earlier links or race on unique email state.
- Legitimate readers whose script, browser, network, or provider verification fails.
- Operational errors in keys, deployments, database quotas, or the mail provider.

Double opt-in prevents activation before confirmation. The first message has already been sent by then, so it does not itself prevent confirmation-email abuse. This follows directly from the [subscription handler](https://github.com/gkoreli/blog/blob/3d92b10b7a495ab537646b141e2dc9bbba7e20e7/packages/newsletter/src/subscribe.ts) and [confirmation handler](https://github.com/gkoreli/blog/blob/3d92b10b7a495ab537646b141e2dc9bbba7e20e7/packages/newsletter/src/confirm.ts).

## Candidate designs

| Candidate | What it addresses | Remaining cost / required evidence |
|---|---|---|
| Repair mandatory Turnstile | Restores the intended pre-send verification path | Browser dependency, configuration lifecycle, verifier availability; needs actual completion and abuse observations |
| Apply Turnstile only when a defined abuse condition is met | Can reduce the number of readers exposed to a challenge | Trigger must be justified and tested; shared networks and distributed abuse complicate thresholds |
| Remove the widget after adding send controls | Removes that browser/verifier dependency | Needs per-address cooldown, pending deduplication, deliberate IP and global send budgets, double opt-in, and a tested abuse response |

The current native limiter is configured as three attempts per 60 seconds per IP. Cloudflare documents its counters as local to each location and eventually consistent. It is not a strict global email budget. Neither a hidden field nor a browser-header heuristic is an adequate replacement for controlling email volume. [Rate limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/), checked September 7.

The initial recommendation is to restore the configured credential and measure the complete flow, while making configuration failures visible to the operator. The architecture work should evaluate a widget-free path with explicit send budgets against a conditional challenge. This is a recommendation for investigation; the incident alone does not select the winner.

## Failure policy must be deliberate

Current code allows missing-secret and fetch-network-error cases, but rejects a bad secret. This gives different abuse and availability behavior to three failures of the same dependency. A replacement policy must state what happens during each condition and which controls still bound sends. Logging the decision is part of the control.

Required controlled cases: successful signup and confirmation; invalid/expired challenge; script unavailable; widget error or unsupported browser; slow/no response; invalid configuration; verifier/network outage; repeated target address; distributed send attempts; limiter/DB/provider failure; expired, invalid and repeated confirmation; inactive-address resubscription.

Use synthetic addresses and mocked providers locally. Any real email test needs a designated authorized recipient. Record each outcome stage without placing address or token contents in diagnostics. Decide acceptable send ceilings and failure recovery before relaxing the current policy.

## Primary sources and boundaries

| Source | Checked | What it establishes / does not establish |
|---|---|---|
| [Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) | September 7, 2026 | Required validation and error meanings; no measured false-positive rate for our readers |
| [Turnstile client errors](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/) | September 7, 2026 | Callback, retry and timeout behavior; no proof a blocker caused this incident |
| [Widget configuration](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/) | September 7, 2026 | Available lifecycle callbacks and execution modes; no confirmation of this account's dashboard widget type |
| [Turnstile CSP](https://developers.cloudflare.com/turnstile/reference/content-security-policy/) | September 7, 2026 | Required script/frame allowances; no evidence to relax the site's CSP |
| [Workers rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) | September 7, 2026 | Locality and consistency limits; no universal safe newsletter threshold |
| [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) | September 7, 2026 | Retention and collection limits; not a lifetime incident archive |
| [GraphQL sampling](https://developers.cloudflare.com/analytics/graphql-api/sampling/) | September 7, 2026 | Adaptive estimates; not an exact set of failed attempts |
| [Resend logs](https://resend.com/docs/dashboard/logs/introduction) | September 7, 2026 | A provider-side source for older attempts that reached sending; read requests returned 401 because the available key is restricted to sending. No account email history was obtained; see [recovery](04-recovery.md) |

No peer-reviewed CAPTCHA usability result or cross-provider benchmark is claimed in this first pass. A broader article argument about reader friction needs evidence beyond this one configuration failure.
