# Article passport: Subscription Bombing

Created September 8 PDT / September 9 UTC, 2026. Working title: **Subscription Bombing: How I Protect My Blog**. This is the article lane of the existing newsletter reliability worklist. [Draft](article.md), [source ledger](07-source-ledger.md), [claims ledger](08-claims-ledger.md), [human prompts](source.prompts.md).

Current evidence update: the [authorized live flow](15-live-signup-acceptance.md) completed after a fresh production verifier-binding repair. Gmail placed the confirmation in Spam. Earlier implementation-only and acceptance-pending passages below are dated shaping history; this new receipt governs the current draft. The same investigation form and reader problem remain. Do not turn one completed subscription into an audience-wide success claim or omit the Spam result to manufacture closure.

## Living center and form

Goga wants readers to subscribe to his personal blog, and he wants to keep owning the small platform he built. A friend's failed signup prompted the investigation. The agent's recommendation to migrate to a hosted newsletter service overreached: a desire for simplicity was not a decision to give up the platform. The question is how to bound what a public request can make the blog send without turning a form into a new infrastructure project.

The governing form is an **evidence-led engineering investigation with a build-journal present**. It begins with an owned failure, tests what protection must accomplish, and records implementation and writing together. `shape-article`, `blog-writing`, its investigation reference, and the firsthand-evidence reference govern this pass. This is an AI-assisted collaborative article, not an exposed essay. Preserve actual prompts and judgments; do not manufacture personal scenes or feelings.

The reader problem is subscription bombing through confirmation mail. Turnstile, Workers, D1, and Resend are implementation context. The title gives the problem priority; the body earns the mechanism and keeps the failure to serve a legitimate reader visible.

## Governing claim and disproof

**Claim to test:** the existing stack can support a small signup flow that bounds its unconfirmed-email sending, handles repeated requests coherently, and tells the reader when an operation failed.

Disproof includes a tested send beyond the shared limit; a resend path bypassing admission; concurrent requests each taking the same last allowance; a retry creating an unintended extra email; activation from an invalid token; claimed success after a known failed send; or required machinery that contradicts the owner's small-platform constraint. A passing local test does not establish production activation, audience-wide accessibility, inbox placement, or resistance to every attack.

The stronger claim, “this prevents subscription bombing,” is rejected. One unwanted confirmation from each of many sites can still flood an inbox. This implementation can bound the blog's contribution and expose failures. It cannot authenticate a mailbox owner before that mailbox receives its first message.

## Protected human material

- A friend could not subscribe, and the owner was upset about missing contact with readers.
- Recovering addresses mattered; do not reduce the question to a logging feature. A never-persisted address cannot be reconstructed from a backup, and retained reports do not identify distinct people.
- The owner challenged the agent's migration recommendation because the visible interaction is an API POST. Explain the actual responsibilities without treating ownership as inherently too complicated.
- Work is happening now. Do not turn an owner-reported repair into a freshly verified deployment or proposed protection into a completed result.

## Reader and movement

The primary reader operates a small public form that sends email: a newsletter, waitlist, or similar opt-in service. They need the first-email abuse mechanism and the minimum enforcement, state, and failure handling worth owning. The publication role is **bridge**: a transferable problem carries Goga's judgment about his own platform.

Move from significance and findings to the friend's distinct configuration failure, public input versus permission to send, common signup/resend admission, honest provider outcomes and lifecycle, then the tradeoff between limiting abuse and delaying a legitimate reader. A compact stage table explains the mechanism without a new component. Change technical register with one sentence.

Keep detailed retention, account usage, vendor comparison, and recovery access in linked worklist artifacts unless essential to the main claim. Do not reopen a broad provider survey.

## Evidence and release state

The incident is a September 7 UTC observation at `3d92b10b7a495ab537646b141e2dc9bbba7e20e7`. This article lane inspected baseline `a85c151d92c9577a3266951ada3ad01b86cb381b`. Neither establishes the currently active deployment.

The article lane has now inspected the local shared admission, sender, lifecycle, migration, and client implementation. The draft describes that code in present tense and labels it local. Its initial limits are 600 seconds between admissions and three per rolling day for one normalized address, with 25 per rolling hour and 100 per rolling day across both public sending routes. Failed and unknown sends remain charged. The 25 controlled client tests and source typecheck passed according to [12-client-verification.md](12-client-verification.md). The [37 handler tests](10-verification.md) passed with actual migrations and a Node SQLite transaction adapter. Actual local workerd D1 separately passed the [admission and rollback fixture](repro/d1-admission-results.json) at September 9 01:47:23.908 UTC. Release revision, deployment, and live acceptance remain pending. TASK-0124's owner-reported earlier repair is separate from this change's acceptance.

Before publication, reconcile draft and implementation; apply discovery positioning, shareable-engineering, and polish-prose where appropriate; run the title/opening/headings/table/section-endings skim check; validate rendering and metadata; preserve exact shaping prompts. This task does not publish the article. No frozen footprint, release date, or active post route exists yet.

Human review of the actual draft is useful when available. Agent review does not establish human reception. A later observation window should record bounded send outcomes, legitimate retry problems, and corrections without labeling challenge rejections as independently verified bots.

## Implementation-era shaping receipt

The updated mechanism section now gives the exact limits and unit, the shared transactional reservation, same-operation provider retries, confirmation preview/POST transition, preserved token validity, suppression policy, and usable client retry. It names the principal costs: failures consume capacity; aliases can reach one inbox; no crash-replay outbox; already-admitted mail can finish after opt-out; inactive cleanup limits suppression to retained state; and production activation is unverified. Legacy token imports do not establish old send counts or retroactive coverage.

The first skim pass showed the central problem, response, and limits in the opening, headings, tables, and section endings. A sentence pass removed an overbroad suggestion that every account system necessarily repeats email signup. Exact shaping prompts now total nine. The owner's ORM question is preserved in the [data-access decision](13-data-access-decision.md); it does not displace the article's first-email abuse center. The server receipt is now reconciled, including its 25-operations/47-provider-calls example. The article remains unpublished; final code pinning and a release audit are still required before publication.

## Positioning and engineering review

Applied `article-discovery-positioning`, then `shareable-engineering`, with a final sentence pass under `polish-prose`. This is a draft positioning decision, not a metadata release or a traffic forecast.

The primary reader job is protecting a small public signup endpoint from contributing confirmation mail to an inbox flood. Secondary subjects already explained are double opt-in, shared send limits, D1 transactions, provider retries, and subscription failure handling. Language comes from the owner's prompt, primary threat documentation, and implementation. There is no page-filtered search or reader-reception evidence for this unpublished article. Excluded promises: complete anti-spam prevention, vendor comparison, universal production tutorial, inbox delivery, and a demonstrated attack on this blog.

Three coherent candidate representations were considered. All share the existing opening as standfirst, `subscription-bombing` as a provisional slug, `[email, cloudflare, newsletter]` as provisional tags, the current headings, and links to the failure evidence and implementation receipts. None changes served metadata.

| Candidate | H1 | seoTitle | Description | Decision |
|---|---|---|---|---|
| Owner's subject and stake | Subscription Bombing: How I Protect My Blog | Subscription Bombing Protection for a Small Blog | How I bound confirmation-email requests with Workers, D1, and Resend while keeping signup usable and its failures inspectable. | Keep the working title. It names the abuse and owns the system; verify its tense against release state |
| Mechanism first | Subscription Bombing: Protecting the First Email | Protecting Newsletter Confirmation Emails | The first opt-in message can participate in subscription bombing. Here is the bounded sending policy I implemented for my blog. | Honest, but less explicit about the owned platform and repair |
| Operations first | Newsletter Signup: Limits, Retries, and Confirmation | Reliable Newsletter Signup with Workers and D1 | My blog's signup and resend routes now share admission rules, bounded retries, and explicit confirmation states, tested locally. | Accurate but gives supporting operations priority over the owner's central problem |

The chosen package promises a bounded protection mechanism, fulfilled by the shared admission section and its local D1 reproduction. “My blog” identifies the owned system and incident; it supplies no independent credibility guarantee. The limits and same-operation retry distinction are inspectable assets; they are not a benchmark of bots blocked or subscribers gained. The title remains provisional because publication must make deployment state clear.

Internal links serve specific jobs: incident and recovery context, deeper implementation, verification method, and the ORM boundary decision. No unrelated published-article link is added merely for shared Cloudflare or abuse terminology. A future distribution hypothesis is that engineers operating small email forms may recognize the first-confirmation problem; no posts or messages are sent. The observation window, if released, is the first 30 days for attributable replies, corrections, implementer reports, and page-filtered discovery signals. Respond to material correctness issues immediately; do not churn metadata from daily traffic variation.

The engineering review retained the failed signup, agent overreach, exact allowance unit, simulated-provider boundary, shifted fixture windows, alias limitation, nonpermanent suppression, interrupted-send uncertainty, and live acceptance gap. It rejected “five lost subscribers,” “47 sent emails,” “a successful CAPTCHA proves mailbox ownership,” and “the blog was attacked.” Rendered article routes, final code pins, social metadata, and human reception are not accepted by this Markdown-only review.
