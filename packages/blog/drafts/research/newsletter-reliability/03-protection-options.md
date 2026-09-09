# Newsletter abuse controls: chosen scope and earlier alternatives

Initial assessment September 7 UTC, 2026; expanded September 8 PDT / September 9 UTC with [original-decision history, 2026 prior art, and the comparison protocol](05-prior-art-2026.md). Updated at the break checkpoint: the [chosen implementation](09-design-and-implementation.md) keeps the existing platform and Turnstile, with shared atomic sending limits. It is deployed and has one [completed authorized live flow](15-live-signup-acceptance.md), including a Gmail Spam finding. No comparative effectiveness study was performed. The alternatives below remain dated research, not pending builds or a selected provider migration.

## Current scope: simple signup on our existing platform

Goga's follow-up asks why a personal blog cannot own a button and a public POST endpoint. It can. The earlier Buttondown recommendation interpreted simplicity too narrowly as outsourcing subscriber operations. No migration was selected, and a Buttondown URL is not a prerequisite for this work. Keep ownership and abuse protection as separate decisions.

The existing Worker, D1, and Resend integration already implements pending subscriptions, confirmation, and unsubscribe. Public signup is an ordinary product requirement. Its abuse exposure comes from letting an unknown caller trigger mail to a supplied address. Email confirmation controls activation; it does not prevent the first unwanted confirmation. Turnstile assesses the request, without proving control of the supplied mailbox. Request and email limits bound repeated use. These responsibilities can remain small application functions using the existing services.

The implemented decision is to retain the platform and mandatory Turnstile verification, while giving both public confirmation routes the same sending budget:

1. Real verification and the ordinary unsubscribe/re-subscribe and confirmation cycle passed after the September 9 binding repair. Read the [live receipt](15-live-signup-acceptance.md) before any repeat test; earlier owner reports do not define the current acceptance state.
2. Both routes share one admission per normalized address per ten minutes, at most three/address/day, and aggregate ceilings of 25/hour and 100/day. Failed and ambiguous attempts remain charged; provider retries reuse the same operation key and body. These are blog policy values with tested local enforcement, not universal safe thresholds.
3. Preserve usable retries, earlier unexpired confirmation links and suppression. The [local regressions](10-verification.md) cover failure and concurrency cases; the one live flow does not establish every browser, provider retry or signed webhook path. No queue, new framework or provider migration was added.

The next work is Gmail placement (TASK-0145), the signed provider-event connection (TASK-0142), and broader client logging/ingestion/alerts (TASK-0125/0126). Reconsider Turnstile if measured reader failures justify changing it; keeping the first-message allowance does not depend on that verifier choice. Provider migration remains an optional maintenance tradeoff. The research below preserves its benefits and limitations; it does not establish that owning this API is unreasonable.

## Earlier managed-service recommendation

On September 8 PDT, Goga asked for a simple, safe capability for a personal blog. The agent proposed the managed-service plan below. Goga's follow-up clarified that simplicity must also allow owning the platform. Building several alternative abuse-control systems remains outside the immediate work.

**Optional alternative: Buttondown's hosted signup page.** The blog would need a Subscribe link to the newsletter's real public URL. Buttondown documents default double opt-in, managed signup protection, and subscriber export. Its first 100 subscribers are free. These are documented capabilities, not results from a completed trial of our newsletter. [Signup integration](https://docs.buttondown.com/building-your-subscriber-base), [confirmation](https://docs.buttondown.com/double-opt-in), [firewall](https://docs.buttondown.com/firewall), [export API](https://docs.buttondown.com/api-exports-create), [pricing](https://buttondown.com/pricing), checked September 9 UTC, 2026.

Use the provider's standard confirmation and protection settings. Keep the subscribe page on `buttondown.com`: its firewall documentation says CAPTCHA recovery is unavailable on custom hosting domains. If an inline email field is wanted later, its supported HTML form can preserve our styling; submit it normally. The provider explicitly warns against using `fetch` for that endpoint because validation and challenge flows can require navigation. No custom signup proxy or provider abstraction is needed.

If this option is selected, the bounded adoption work would be:

1. Obtain the actual newsletter account and public signup URL. Provider choice is currently a recommendation; no account, purchase, or migration is recorded.
2. Verify signup → confirmation received → active subscription → unsubscribe → deliberate resubscription with a designated, authorized test address. Check mobile Safari and a desktop browser, duplicate submission, visible error recovery, and a subscriber export. Keep the scope to the supported service, without simulating attacks against it.
3. Replace the blog's signup form with the verified hosted link, remove its Turnstile script and form handler, update the privacy disclosure, and disable the old signup/resend endpoints and sender. A failed migration must not send readers back to the known-broken form; retain the hosted URL during local integration rollback.
4. Preserve existing confirmed subscriptions and suppression state. Before moving any existing address, make sure an old unsubscribe link suppresses that address in the new sender too. Leaving an old D1-only unsubscribe route running would not achieve that. Keep required legacy data and links until this is verified; never activate addresses merely found in error or provider logs.

This choice would transfer subscriber operations to a provider. The tradeoff is provider dependency and future cost as the list grows. A controlled completion test establishes the tested path, not guaranteed delivery or a population success rate. Recovery of older failed attempts and general client-error logging remain separate unfinished work.

This alternative was not selected. TASK-0127 records the implemented initial decision above. No current task depends on a Buttondown account.

## Protect the operation that can be abused

The protected operation is sending confirmation email and creating pending state. A completed challenge is one input to that decision. It cannot replace correct subscription transitions, delivery handling, or knowledge of whether the form works.

At the September 7 baseline, signup applied a native per-IP limiter, validated the address, checked Turnstile, wrote pending state and scheduled email. A pending address could refresh its tokens and receive another message. `/api/resend-confirmation` sent to existing pending addresses without Turnstile. The implemented repair removes that exception: both routes now share verification and atomic admission.

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

Before the simplicity constraint, the proposed immediate work was restoring the configured credential and comparing a repaired custom flow with a maintained provider's supported signup flow. Credential repair remains relevant if the custom flow must serve during migration; it is not a prerequisite for using a hosted signup page. Buttondown supplies operational prior art; listmonk supplies a pinned implementation of self-hosted ALTCHA. A different verifier can still be mandatory or conditional, and hosted forms have their own protection and recovery policies.

The earlier conversational preference for a widget-free trial is now qualified by the [2026 review](05-prior-art-2026.md). Confirmation emails themselves can participate in subscription bombing. Address cooldowns and global ceilings bound our contribution but do not establish that accepting the first unsolicited send is harmless. No-challenge intake remains a candidate with an explicit residual-risk decision. Neither this incident nor provider marketing selects the winner.

## Failure policy must be deliberate

The September 7 code allowed missing-secret and fetch-network-error cases, but rejected a bad secret. The current implementation rejects unavailable or invalid verifier configuration with a service error and sends nothing. Invalid reader proof receives a distinct rejection. This keeps the send policy consistent while accepting that a verifier outage can stop signup; the form provides retry guidance and static diagnostics. Alerting remains unfinished.

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

No peer-reviewed CAPTCHA usability result or cross-provider benchmark is claimed. The [later source comparison](05-prior-art-2026.md) includes 2026 threat reporting, an author-hosted subscription-bombing study, provider controls, open-source code, and counterevidence. A broader article argument about reader friction still needs evidence beyond the configuration failures and one completed flow. The [handoff](14-handoff.md) records the remaining work without reopening the initial platform decision.
