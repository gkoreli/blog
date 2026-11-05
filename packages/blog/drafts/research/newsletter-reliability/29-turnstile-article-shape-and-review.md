# Turnstile pain-points article: shape, evidence and review

November 5, 2026. Owner request: write about the pain points of Turnstile. [Full draft](turnstile-pain-points.md), [selected exact prompts](turnstile-pain-points.prompts.md). This is a new companion draft in the existing newsletter worklist, under TASK-0128. The broader [subscription-bombing draft](article.md) retains its first-email abuse/admission subject. Neither article is published by this drafting task.

## Center and form

Working title: **Cloudflare Turnstile: What Kept Breaking My Signup Form**. Governing form: a practical field note drawing on completed investigations, rather than a general verdict on Turnstile. Ending: the currently accepted path and unresolved measurement/account limits. No new production query, challenge, email or configuration change is needed for writing.

The stranger's payoff is a method for separating configuration, generated HTML, native loading, idle callbacks, recovery, logging and completed signup. The author's substance is his worry about losing subscribers, concrete failures in his own platform, the AI agent's repair regression, his mistaken reading of an accepted response, and owner confirmation of the fresh test. No new feelings, scenes or personal costs are invented.

The supported claim is that reliable integration needs evidence at those separate stages. The draft rejects an attribution of all failures to Cloudflare, an exhaustive catalog of possible Turnstile defects, a measured anti-bot/false-rejection verdict, and an estimate of lost readers. The provider's generic challenge failure remains unexplained in this cohort.

## Claim audit

| Draft claim | Evidence state and basis | Boundary retained |
|---|---|---|
| 48 widget reports; 21 newer reports idle/not-started/300031 | Observed bounded aggregate, [Research 27](27-current-idle-widget-errors.md), fixed October 6–November 5 before 15:15 UTC | Retained reports; 27 older widget reports lack phase/code; no people/loss count |
| Generic family, internal suffix | Primary documented: Cloudflare [error reference](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/) | No public `031` diagnosis found in that reference; no independent bot label |
| Invalid production secret and recognized-secret repair | Observed real flow, [September acceptance](15-live-signup-acceptance.md) | Binding existence versus value validity; unknown installer/duration |
| Public key lost through nested opening-tag template | Reproduced actual SSG, [Research 17](17-rendered-sitekey-regression.md), Nisli core 0.57.0 / SSG 0.4.0 | Application's template usage; no vendor outage or historical loss attribution |
| `ready()`/defer regression and onload repair | Observed controlled browser failure; code-inspected native API; [Research 28](28-managed-verification-and-diagnostics.md) | Agent introduced this regression; synchronous docs example misapplied; no claim docs alone caused it |
| Managed mode can require interaction | Primary documented [widget modes](https://developers.cloudflare.com/turnstile/concepts/widget/); live dashboard saved | No false-rejection improvement measured; live accepted cycle required no checkbox |
| Execution and appearance are separate | Primary documented [configuration](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/) | Three-line excerpt is configuration, not a complete initializer |
| One recovery, deadlines, stale-event isolation | Code-inspected source `9c0b674`, controlled tests, Research 28 | Chosen operating limits; no production race-frequency or interactive-population claim |
| Callback return values and retry are distinct | Primary documented [error handling](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/) | Non-falsy return suppresses native logging; `retry` sets auto recovery, terminal cleanup removes widget |
| Single-use tokens, five-minute life, validation idempotency | Primary documented [Siteverify](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/); pinned verifier | At most two five-second calls in this application; same body/key; no automatic signup POST retry |
| Default reporting, storage acknowledgment, closed context and bootstrap | Code-inspected/reproduced; Research 28 and earlier acknowledgment records | Reports can still be blocked/lost/capped/spoofed; selected bootstrap coverage only |
| Pre-admission rejection leaves no new recipient record to recover | Code-inspected handler; [recovery boundary](04-recovery.md) | Older subscriber/provider records remain a separate question; no recipient extraction from errors |
| Generic 202 and success styling | Actual client/handler plus reported owner confusion, Research 28 | No membership disclosure or promise that every 202 sends mail |
| Fresh Inbox/authentication/activation and matched ledger | Observed records plus owner-reported confirmation, [live receipt](subscription-recovery-live-acceptance.json) | One designated cycle; no causal DMARC claim, general delivery guarantee or agent-confirmation claim |

## Primary source checks

All provider sources were reopened November 5, 2026. Dates in the draft glossary are provider-reported update dates, not dates of our measurements: modes April 16; rendering June 17; configuration June 28; error codes September 25; error handling/CSP May 5; Siteverify October 22; testing October 20. Our empirical claims reuse dated research and the receipt above. Repository links pin accepted records to `ed00e62` and runtime code to `9c0b674`.

The native API captured during the implementation is the official `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit`, SHA-256 `f81aea26170f33b3fc344bcfcdfc5f578b90008ea7fd1366d77a99964cf8ae58`. Inspection confirms the async/defer guard and native error 3857. Its raw vendor source remains in private operational evidence, not vendored into this article. The loader snippet reproduces our own callback/state/event names and explicitly leaves the rest of the state machine in the linked source.

The article does not claim its server timings, token retry policy or diagnostic budgets are universal defaults. It does not republish addresses, token URLs, raw headers, dashboard captures or provider message identifiers. Sender DNS and wrong-account setup details remain in the operational evidence; the article retains only the final open feedback boundary to keep its Turnstile subject clear.

## Positioning and editorial checks

Applied shape-article, blog-writing, earned-trust-writing, article-discovery-positioning, shareable-engineering and polish-prose. Role: bridge between a recognizable integration problem and Goga's documented platform work.

Reader language: Turnstile errors, signup not working, `300031`, missing sitekey, `ready()` with defer, verification retry. These are source/owner terms and query hypotheses, not measured search demand. Payoff: distinguish the failed stage, choose recovery deliberately, and validate the real output/API/mailbox path.

Title alternatives considered: **Cloudflare Turnstile Pain Points** is too broad to communicate the article's practical result; **Turnstile Is Losing My Subscribers** claims unmeasured causality and loss; **Cloudflare Turnstile: What Kept Breaking My Signup Form** names the system, owned failure and earned scope. Proposed slug: `cloudflare-turnstile-signup-failures`; proposed description: “Cloudflare Turnstile signup failures on my blog: invalid keys, broken rendered HTML, a readiness regression, noisy errors, retries, and full-flow verification.” Proposed tags: `[cloudflare, turnstile, observability]`, section `engineering`. No publication date, post number or served metadata is assigned.

The skim review follows worry and counts, server/public configuration, actual loader incompatibility, mode/recovery choices, report delivery, then complete signup acceptance. The agent's introduced failure remains explicit. Rejected claims include “48 lost subscribers,” “300031 proves bots,” “Managed fixed challenge rejection,” “a false callback return is itself the retry switch,” “unit mocks verify production keys,” and “one Inbox result proves deliverability.” No comparative benchmark or new source survey is added.

## Prompt provenance and delivery

The companion prompt file preserves six complete, relevant non-private messages in chronological order, including the new article request. The operational authorization containing the designated private email is omitted as a whole; it remains private. The existing TASK-0128 checkpoint already excludes test-address authorization from public prompt provenance. The unrelated lock-status exchange and repository instruction message are excluded. This is a selected shaping record, not a complete conversation transcript. No prompts are fabricated, trimmed into quotations, or silently redacted. No measured research footprint or exclusive writing-cost claim is assigned to the reused investigation.

Draft acceptance requires a full body, checked primary claims, exact selected prompts, working local/pinned repository links and actual Markdown rendering. Keep outside `posts/`; source delivery is a scoped commit/push of draft and notes, not site activation. Before a later publication, reconcile any new live facts, choose release metadata, move the prompt record to the matching final slug, retain the omission disclosure, and check generated HTML/canonical/Markdown/prompts output in an isolated build.

Draft checks pass through the actual Marked/Shiki renderer: one H1, three tables, four highlighted code blocks and no executable script tags. All six pinned repository targets exist and their public unauthenticated HTTPS HEAD requests return 200. The web-reading service first returns cache misses for two GitHub links; those are not treated as missing artifacts. The selected prompt count is six, with no recipient or token included. [Machine receipt](turnstile-article-draft-checks.json). No source behavior, shared `dist/`, production flow or release metadata changes during this writing task.
