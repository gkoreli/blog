# Newsletter abuse controls: decision in progress

Initial assessment September 7 UTC, 2026; expanded September 8 PDT / September 9 UTC with [original-decision history, 2026 prior art, and the comparison protocol](05-prior-art-2026.md). This is an architectural assessment, not a deployed change or a comparative effectiveness study.

## Current direction: adopt a maintained newsletter service

On September 8 PDT, Goga made the requirement explicit: this is a personal blog; subscription should work through a simple, safe capability we can adopt. This narrows the work. Building several alternative abuse-control systems is no longer the next step. The earlier comparison remains evidence, not an implementation checklist.

**Recommendation: Buttondown, starting with its hosted signup page.** The blog needs a Subscribe link to the newsletter's real public URL. Buttondown documents default double opt-in, managed signup protection, and subscriber export. Its first 100 subscribers are free. These are documented capabilities, not results from a completed trial of our newsletter. [Signup integration](https://docs.buttondown.com/building-your-subscriber-base), [confirmation](https://docs.buttondown.com/double-opt-in), [firewall](https://docs.buttondown.com/firewall), [export API](https://docs.buttondown.com/api-exports-create), [pricing](https://buttondown.com/pricing), checked September 9 UTC, 2026.

Use the provider's standard confirmation and protection settings. Keep the subscribe page on `buttondown.com`: its firewall documentation says CAPTCHA recovery is unavailable on custom hosting domains. If an inline email field is wanted later, its supported HTML form can preserve our styling; submit it normally. The provider explicitly warns against using `fetch` for that endpoint because validation and challenge flows can require navigation. No custom signup proxy or provider abstraction is needed.

The bounded adoption work is:

1. Obtain the actual newsletter account and public signup URL. Provider choice is currently a recommendation; no account, purchase, or migration is recorded.
2. Verify signup → confirmation received → active subscription → unsubscribe → deliberate resubscription with a designated, authorized test address. Check mobile Safari and a desktop browser, duplicate submission, visible error recovery, and a subscriber export. Keep the scope to the supported service, without simulating attacks against it.
3. Replace the blog's signup form with the verified hosted link, remove its Turnstile script and form handler, update the privacy disclosure, and disable the old signup/resend endpoints and sender. A failed migration must not send readers back to the known-broken form; retain the hosted URL during local integration rollback.
4. Preserve existing confirmed subscriptions and suppression state. Before moving any existing address, make sure an old unsubscribe link suppresses that address in the new sender too. Leaving an old D1-only unsubscribe route running would not achieve that. Keep required legacy data and links until this is verified; never activate addresses merely found in error or provider logs.

This choice would transfer subscriber operations to a provider. The tradeoff is provider dependency and future cost as the list grows. A controlled completion test establishes the tested path, not guaranteed delivery or a population success rate. Recovery of older failed attempts and general client-error logging remain separate unfinished work.

Next input: the public Buttondown signup URL. Production signup is still unrepaired. TASK-0127 stays in progress until the provider choice and the tested behavior are recorded. The custom-flow criteria below apply only if that flow is retained or used as an interim repair.

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

Before the simplicity constraint, the proposed immediate work was restoring the configured credential and comparing a repaired custom flow with a maintained provider's supported signup flow. Credential repair remains relevant if the custom flow must serve during migration; it is not a prerequisite for using a hosted signup page. Buttondown supplies operational prior art; listmonk supplies a pinned implementation of self-hosted ALTCHA. A different verifier can still be mandatory or conditional, and hosted forms have their own protection and recovery policies.

The earlier conversational preference for a widget-free trial is now qualified by the [2026 review](05-prior-art-2026.md). Confirmation emails themselves can participate in subscription bombing. Address cooldowns and global ceilings bound our contribution but do not establish that accepting the first unsolicited send is harmless. No-challenge intake remains a candidate with an explicit residual-risk decision. Neither this incident nor provider marketing selects the winner.

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

No peer-reviewed CAPTCHA usability result or cross-provider benchmark is claimed. The [later source comparison](05-prior-art-2026.md) includes 2026 threat reporting, an author-hosted subscription-bombing study, provider controls, open-source code, and counterevidence. A broader article argument about reader friction still needs evidence beyond this one configuration failure. TASK-0127's next action and acceptance scope are the managed adoption steps above.
