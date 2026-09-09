# What our blog analytics adds beyond Matomo—and what agent subscriptions need

Research review, September 9 UTC / September 8 PDT, 2026. [Worklist](00-worklist-index.md) · [Exact owner prompts](source.prompts.md). This is a source and implementation comparison, with two small executed checks. It is not a full Matomo deployment benchmark or a published article.

We are rebuilding some established analytics features. Matomo already offers page-transition reporting and server-side collection. Its current documentation also describes dedicated AI-agent and chatbot reports, including Cloudflare integration. A claim that our blog is distinctive simply because it observes agents without browser JavaScript would be wrong. [Matomo AI Chatbots Overview](https://matomo.org/faq/reports/ai-chatbots-overview-report/), [HTTP tracking integration](https://matomo.org/faq/how-to/set-up-ai-chatbot-tracking-with-the-http-tracking-api/).

Our strongest demonstrated difference is narrower: the blog requires cryptographic verification before recording a verified signer, while the reviewed Matomo ChatGPT provider detects particular header values. Our integrated Worker and explicit request reasons may also fit this publication well. Neither establishes better overall audience accuracy, total cost, or operational reliability.

The upstream code baseline is Matomo **5.13.0**, published August 16, 2026, resolved from GitHub's latest-release endpoint on September 9 UTC: commit `04c528673024239d858998eebc34e1f8afa1acf3`, tree `f5ba6ef42e5ee8f7cd94cc976649e77546a41c78`. Current developer pages identify themselves as v6 in places, so the comparison distinguishes pinned code from live documentation. Our deployed baseline is blog commit `c338059`, whose referral capture and reporting passed [production acceptance](../article-024-hacker-news/07-transition-release-acceptance.md). [Matomo release](https://github.com/matomo-org/matomo/releases/tag/5.13.0).

## Where we overlap with Matomo

| Question | Matomo evidence | Our current behavior | Assessment |
|---|---|---|---|
| Can collection work without browser JavaScript? | HTTP Tracking API and server-log imports; AI chatbot Worker integration | Observe eligible served HTML/Markdown responses in the existing Worker | Shared capability; ours has a different integration and storage choice |
| Can AI traffic have its own reports? | Dedicated AI Agents and AI Chatbots reports | Named UA rules, signatures, and a closed set of request classifications | Shared objective; compare exact detectors and evidence |
| Can bots be retained deliberately? | `bots=1` and log import's `--enable-bots`; dedicated chatbot processing also exists | Store recognized automation and expose it through separate public groups | Retaining automation is not unique |
| Can one see movement between pages? | Page Transitions already provides previous/following actions | Newly deployed reported internal page pairs | Established feature; our current pairs do not form a full visit history |
| Can one analyze a conversion funnel? | Funnels plugin has ordered steps, goal integration, and reports | No complete multi-step conversion model implemented | Matomo provides substantially more here |
| Are cookies required? | Matomo supports cookieless configurations and configurable visit matching | Site/day-scoped HMAC client IDs; no analytics cookie | Both can avoid cookies; their units and linking behavior differ |
| Can the operator inspect the code? | Open-source core and extension points | Open-source blog, SQL, policies, and research receipts | Inspectability is shared; our public evidence record is an editorial practice |

Sources checked September 9: [Tracking API](https://developer.matomo.org/api-reference/tracking-api), [server-log collection](https://matomo.org/guide/tracking-data/import-server-logs/), [bot collection options](https://matomo.org/faq/new-to-piwik/faq_63/), [page transitions](https://matomo.org/faq/reports/transitions-analyze-the-previous-and-following-actions-of-your-visitors-for-each-page/), [Funnels](https://plugins.matomo.org/Funnels), [visitor matching and cookieless mode](https://matomo.org/faq/general/faq_21418/).

We already depend on Matomo's published spam-referrer list, pinned by revision and hash. This is direct reuse, not an independently developed replacement for its underlying research. Our contribution there is the site's versioned reporting policy and preserved local evidence.

## One concrete difference: detection versus signature verification

Matomo 5.13.0's ChatGPT provider returns a match when `Signature` and `Signature-Input` are nonempty and `Signature-Agent` equals the quoted ChatGPT origin. These values can also arrive through tracking parameters. The provider does not verify the signature cryptographically. Its upstream test explicitly expects a match for placeholder signature strings. This is a finding about that provider, not a claim that every Matomo deployment accepts arbitrary external tracking input. [Pinned provider](https://github.com/matomo-org/matomo/blob/04c528673024239d858998eebc34e1f8afa1acf3/plugins/AIAgents/Providers/ChatGPT.php), [pinned test](https://github.com/matomo-org/matomo/blob/04c528673024239d858998eebc34e1f8afa1acf3/plugins/AIAgents/tests/Unit/Providers/ChatGPTTest.php).

We passed the same placeholder fields to our local `verifyWebBotAuth`. It returned **`unverified: malformed-signature-fields`**, with **zero network fetches**. Our verifier checks supported signed components, validity times, the directory key's thumbprint, and Ed25519 verification before producing `verified`. The [comparison receipt](signature-comparison.json) records the baseline and source hashes; the [local reproducer](reproduce-signature-fixture.mjs) preserves the exact input. PHP was unavailable, so we inspected Matomo's implementation and test expectation rather than running its full stack. [Our verifier at the compared commit](https://github.com/gkoreli/blog/blob/c338059/packages/analytics/src/webbotauth.ts).

This supports a specific advantage when the question is whether a request carries a valid signature associated with an origin. It does not establish provider reputation, human delegation, or actual reading. A legitimate signature can belong to a crawler. Our verifier is a particular implementation, not a general certification of Web Bot Auth conformance or protection against every replay or resource-exhaustion case.

Our unsigned client names remain claims too. Matomo's pinned chatbot detector performs UA substring matching; so do our named-UA rules. Neither turns a copied `ChatGPT-User` string into authenticated ChatGPT identity. [Matomo detector](https://github.com/matomo-org/matomo/blob/04c528673024239d858998eebc34e1f8afa1acf3/plugins/BotTracking/BotDetector.php), [our classifier](https://github.com/gkoreli/blog/blob/c338059/packages/analytics/src/classify.ts).

## Architecture differences that may matter to a personal blog

Our analytics writes directly to D1 from the site's existing Worker. Matomo On-Premise uses its own PHP/database environment; Matomo Cloud offers another operating model. Avoiding a separate analytics installation fits this repository, but maintaining our parser, schema, reports, defenses, and migrations consumes engineering time. That time belongs in any cost comparison. [Matomo requirements](https://matomo.org/faq/on-premise/matomo-requirements/), [our package](../../../../analytics/README.md).

Our stored request reason, selected navigation headers, network provenance, representation, and signer status make particular counting decisions inspectable. Versioned referral policy permits changing public inclusion without deleting the original hostname evidence. This is useful for a builder's journal. It is not a demonstrated feature that Matomo cannot implement through its own configuration, APIs, dimensions, or plugins.

There are costs to our simpler model. Every request receives one primary class, so identity, purpose, and network evidence compete for that label; a signed crawler still needs its role explained separately. Daily IDs do not establish durable readership. Page observations omit failed deliveries and many non-page requests. New internal-source paths cannot recover discarded history. The earlier D1 incident also showed that small infrastructure can still need careful query budgeting. [Existing claims ledger](../readers-vs-bots/16-claims-and-work-status-2026-09-06.md), [D1 recovery](../d1-read-budget/02-recovery.md).

Matomo's dedicated chatbot collection is itself request-oriented: its documentation describes a separate processing route that creates no visit/session records. It can report error responses and requested documents; our page counter deliberately requires successful eligible responses. A future accessibility report needs those missing outcomes in its own denominator. The Matomo guide also documents retention controls for raw chatbot telemetry, whereas this blog's analytics currently has no automatic expiry. [Integration and retention behavior](https://matomo.org/faq/how-to/install-ai-chatbot-tracking/), [our eligibility rules](https://github.com/gkoreli/blog/blob/c338059/packages/analytics/src/eligibility.ts), [our privacy disclosure](https://gkoreli.com/privacy).

We can credibly present this as a small, inspectable implementation tailored to an engineering publication. Describing it as a broadly superior Matomo alternative would require considerably more evidence and product work.

## Agent following already has a useful starting point

The live feed check at **02:15:51 UTC** returned **25 items and 25 distinct GUIDs**. All items contain descriptions; none contains a full-content `content:encoded` element. The response supplies an ETag, and an immediate conditional request returned **304 with zero body bytes**. No hub link was present in the feed. [Measured feed receipt](feed-probe.json), [RSS template](https://github.com/gkoreli/blog/blob/c338059/packages/blog/src/templates/rss.ts).

An agent host can keep a person's follow list, poll this feed, and fetch new articles. The publisher need not receive that person's identity or even maintain a subscription row. A publisher-managed subscription, by contrast, can record an approved callback or email destination and send updates there. These are distinct, valid models with different visibility. Our current page-observation code does not measure feed polling as page views, so following through a reader can create value that the dashboard does not currently show.

The authorization question therefore has two possible locations: the user can authorize a reader/agent service to manage their follows, or authorize an agent to manage a subscription held by this blog. Existing protocols cover much of both. The [delegation review](02-delegation-prior-art.md) distinguishes established grants from current agent-specific proposals; the [subscription review](03-agent-subscription-protocols.md) covers implemented reader APIs and delivery protocols.

WebMCP can make a page's subscription actions explicit to browser agents. Chrome's August 7 documentation describes an origin trial from Chrome 149; the September 4 specification is a Community Group draft and uses `document.modelContext`. It does not supply a publication's background delivery service. [Chrome documentation](https://developer.chrome.com/docs/ai/webmcp), [draft specification](https://webmachinelearning.github.io/webmcp/).

WebSub supplies topic discovery, callback verification, leases, delivery, and unsubscription. Callback verification confirms a pending subscription at the receiving endpoint; it does not independently attest to a person's grant to an agent. MCP provides another tool/notification interface, but its July 28 revision replaces the older resource-subscription calls with `subscriptions/listen`. A notification stream alone is not a durable reader subscription or delivery receipt. [WebSub](https://www.w3.org/TR/2026/REC-websub-20260602/), [MCP changes](https://modelcontextprotocol.io/specification/2026-07-28/changelog).

## What would make the next article valuable

The strongest next demonstration is a complete, bounded follow lifecycle: an explicitly authorized agent discovers the publication, stores the follow, receives a new item, handles a duplicate, and stops after revocation. Record who authorized which action, which component stored that decision, what was delivered, and what remains unknown about human consumption. Keep public content readable without enrollment.

Alongside that, run a shared synthetic request corpus through our collector and a pinned Matomo installation. Measure classification results, retained evidence, collection losses, and operating work under the same conditions. That would replace broad comparisons with useful results. The [experiment worklist](04-experiments-and-decision.md) defines both studies and their completion boundaries.

The publication's opportunity is to demonstrate how these parts work together and expose their limits. It does not depend on inventing every part, claiming a new standard, or predicting which protocol will win in 2027. No new agent-subscription interface was enabled during this research.
