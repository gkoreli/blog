# Two experiments for agent readership and analytics

These studies would give the next articles original results: whether an authorized agent can maintain a useful follow, and what two analytics implementations record from the same known requests. The [comparison](01-matomo-and-agent-subscriptions.md), [delegation review](02-delegation-prior-art.md), and [subscription review](03-agent-subscription-protocols.md) supply the starting evidence. This worklist was recorded September 9 UTC / September 8 PDT, 2026. The studies below have not run.

## What has already been measured

| Check | Executed result | Boundary |
|---|---|---|
| Existing feed, September 9 at 02:15:51 UTC | 25 items, 25 distinct GUIDs; conditional retrieval returned 304 with zero body bytes | Descriptions only; no hub link in the feed. No agent enrolled or followed. [Receipt](feed-probe.json) |
| Placeholder signature fixture | Our verifier rejected malformed fields without a network request; Matomo's pinned provider test expects detection | One local verifier execution and upstream source/test inspection. Matomo itself was not run. [Receipt](signature-comparison.json) |
| Referrer context in production | Eight intended HTTP cases plus one bootstrap request stored the expected evidence; all nine excluded from public totals | Scripted requests, not human-reader or browser calibration. [Release acceptance](../article-024-hacker-news/07-transition-release-acceptance.md) |

These are useful checks of specific behavior. None measures an overall accuracy advantage or proves that a person read an article.

## Experiment 1: an authorized agent follows a publication

Start with a reader that already supports subscriptions. The first question is whether the agent can preserve the person's instruction across new items, restarts, and revocation. A successful result would demonstrate a useful reading workflow without requiring every publisher to install a new protocol.

Use a disposable local reader account, an independently operated reader client, and a controlled fixture feed. Pin the server and client versions before execution. Prefer a Microsub/IndieAuth pair if two functioning clients are available; Miniflux's API provides a simpler fallback, but its application key tests a different authorization model. Record any fallback instead of treating the designs as equivalent. The [protocol review](03-agent-subscription-protocols.md) links the contracts and implementations.

1. Record the operator's exact instruction and the account approval separately. State whether the grant permits following any feed or only this publication. Preserve the visible approval terms and the granted scope; exclude credentials from the public receipt.
2. Have the agent discover the feed from the publication page and create the follow. Verify persisted state through the independent client. Log one subscription operation even if a retry requires several HTTP requests.
3. Publish three fixture item IDs sequentially. Include one duplicate delivery and one correction that retains its original item ID. Restart the agent between items; interrupt retrieval once and recover. Record the expected item sequence before running it.
4. Verify that each distinct item becomes available once, the correction remains associated with its original item, and an outage can be reconciled against the feed. Record retrieval, summary generation, and notification to the test operator as separate outcomes. No step is labelled human reading without separate observation.
5. Unfollow the feed and revoke the client grant as separate actions. Test that future authorized management requests fail after revocation. Verify what stops: an unfollow should remove the reader's follow; revoking a client token alone may leave the reader server collecting an existing subscription. Measure that behavior rather than assuming both operations mean the same thing.

Run this fixed sequence three times from fresh test state. Report every run, including failures. Measure operation success out of attempts, unique items stored out of expected items, duplicates surfaced, missed items after recovery, and observed revocation delay. These counts describe a deliberately small interoperability experiment; they are not a population reliability estimate.

If this works, the next extension can test a **publication-specific grant**. An authenticated test account approves one enrolled agent key, one publication, named actions, a destination, and an expiry. The protected service checks that grant on use. Add negative cases for an unrelated key, wrong publication, changed destination, expired grant, revoked grant, and a retry of subscription creation. This is an application design using established authorization mechanisms, not a new standardized follow permission. Select the actual client and authorization service before claiming interoperability.

For publisher-managed delivery, define whether revoking a grant also cancels the subscription and cancels queued deliveries. Keep a separate owner-controlled way to unsubscribe after an agent loses access. A server can prevent future delivery under its control; it cannot retract an article already delivered or prevent fetching public content.

The first experiment is complete when the fixed sequence, independent state checks, failures, and revocation behavior have a reproducible receipt. It can support an article about agents maintaining subscriptions. It earns a stronger claim about publication-specific authorization only after the extension passes. WebSub delivery and WebMCP tools remain subsequent options tied to a demonstrated need.

## Experiment 2: compare the same requests in Matomo and this blog

Reuse [TASK-0120](../../../../../docs/tasks/TASK-0120.md)'s controlled-client work. Adding Matomo as another observer can explain what is common, different, and missing without creating a competing calibration program. Start with local fixtures; production trials need their own bounded query plan and verified test exclusion.

Pin our build, Matomo version, enabled plugins, tracking configuration, and any trusted forwarding layer. The inspected Matomo baseline is 5.13.0; verify availability before installing it. Give both systems the same synthetic events at equivalent observation points. Separate a comparison of server collection from a comparison involving browser beacons. If one integration omits a header or status, report that transformation as part of the result.

| Known case | What to observe |
|---|---|
| Human-operated browser with the beacon allowed, then blocked | Served response, collection attempt, receipt, stored class, report inclusion |
| Agent-driven browser and ordinary HTTP client | Operator and software known from the trial; browser-shaped headers are not the ground-truth label |
| Copied crawler UA, placeholder signature, valid fixture signature, tampered signature | Claimed identity, authenticated signer, classification reason, and rejected evidence separately |
| External, internal, missing, and malformed referrers | Stored category, safe public path, query removal, and transition-report behavior |
| RSS poll, Markdown fetch, 304, redirect, and 404 | Each system's eligibility rules, omissions, and access-outcome reporting |

The synthetic request manifest supplies expected inputs and the known operator. It should not predetermine whether every product's different report labels are errors. Define comparable output questions first: did the collector retain the request, did it authenticate a signer, and did the report include it under the stated rules?

Record attempted requests, successful responses, collector receipts, stored observations, and report rows as separate denominators. For the labelled human/automation cases, publish the full classification table and exclusions. Keep cryptographic identity verification separate from that classification table. A self-generated valid key tests verification; it does not authenticate a commercial provider.

Capture software/setup time, measured request volume, storage, all report statements' D1 reads and writes, Matomo's relevant database work, and any billed resources. Those are different cost measures; converting them into comparable operating cost requires an explicit workload and pricing basis. Do not interpret lower latency or fewer SQL statements as lower cost. Preserve commands, manifests, configuration, and sanitized outputs so another operator can repeat the experiment.

Completion requires an explanation for each observed difference, or an explicit unresolved result with enough evidence to investigate it. It does not require equal counters, a predetermined winner, or an explanation of every historical 95-versus-14 observation.

## Data to retain for these questions

Keep test run and event IDs, timestamps, public item IDs, versions, operation type, collection outcome, exclusion reason, retry/deduplication result, and revocation timing. A publisher-managed grant also needs a site-scoped account reference, enrolled key, permitted publication/actions, expiry, approval reference, and delivery destination in its protected operational store. Raw tokens, private keys, email addresses, and full approval transcripts do not belong in public analytics exports.

User-Agent, city, and TLS observations may answer particular client or network questions. They cannot substitute for a grant or show that a human requested an action. Reuse existing evidence and retain an additional field only when an experiment needs it; state its purpose and retention period. Do not discard useful diagnostic data merely because it concerns automation, and do not add unrelated identity data to compensate for an absent authorization flow.

## Work ownership and publication boundary

[TASK-0141](../../../../../docs/tasks/TASK-0141-compare-blog-analytics-with-matomo-and-research-agent.md) completes this research and experiment design. Execution remains open here; no scheduler or background trial was created. [TASK-0119](../../../../../docs/tasks/TASK-0119.md) owns the existing identity/purpose separation, [TASK-0120](../../../../../docs/tasks/TASK-0120.md) owns calibration, and [TASK-0140](../../../../../docs/tasks/TASK-0140-audit-deterministic-guarantees-and-prior-art-for-referral.md) owns referral-defense claims. Reuse their evidence.

Article 024 stays complete except for a necessary factual correction. The next article should explain an executed result and the decision it changes. The research alone supports a protocol comparison; a title promising a working authorized agent subscriber requires the lifecycle experiment. Choosing a protocol or drafting an endpoint does not meet that promise.
