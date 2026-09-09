# Personal-blog analytics, Matomo, and agent subscriptions

Started September 9 UTC / September 8 PDT, 2026. [TASK-0141](../../../../../docs/tasks/TASK-0141-compare-blog-analytics-with-matomo-and-research-agent.md).

The owner wants an evidence-based account of what this blog should build itself, what Matomo already supplies, and how a publication could serve agents that subscribe for people. The intended result is a working example other engineering blogs can inspect. Advantage claims need a defined comparison and measured result.

- [Exact human prompts](source.prompts.md): four complete messages in received order, including the repeated preservation request and the question about human delegation. These belong to this new investigation, outside article 024's frozen provenance.
- [Comparison with Matomo](01-matomo-and-agent-subscriptions.md): shared features, one demonstrated verification difference, costs and limits, and the live feed check.
- [Delegation prior art](02-delegation-prior-art.md): established authorization standards, current agent-specific proposals, and what an approval record can establish.
- [Subscription protocols and implementations](03-agent-subscription-protocols.md): existing readers, feeds, WebSub, Microsub/IndieAuth, ActivityPub, MCP, and WebMCP.
- [Two experiment plans](04-experiments-and-decision.md): authorized following and matched analytics observations, with denominators, failure cases, and completion boundaries.
- Measured receipts: [feed retrieval](feed-probe.json), [signature comparison](signature-comparison.json), and its [local reproducer](reproduce-signature-fixture.mjs).
- The [HN follow-up](../article-024-hacker-news/00-worklist-index.md) owns the launch measurements and deployed referrer-context change.
- [TASK-0140](../../../../../docs/tasks/TASK-0140-audit-deterministic-guarantees-and-prior-art-for-referral.md) separately owns deterministic referral defenses. Reuse its findings rather than duplicating production probes.
- The [newsletter worklist](../newsletter-reliability/00-worklist-index.md) owns confirmation and delivery reliability. Agent enrollment must use those guarantees, not bypass them.

## Research questions

1. Which features overlap with Matomo's current server-side, bot, referral, and funnel implementations?
2. Which differences are demonstrated in code or production, which might benefit a small publication, and which remain untested?
3. What separates identifying a requesting client, verifying its signer, authorizing a subscription, delivering an update, and establishing that a person used it?
4. Which existing mechanisms fit discovery, durable following, delivery, and revocation: feeds, WebSub, WebMCP, MCP, or something else?
5. What bounded experiments could turn the next article into a reproducible demonstration?

## Status and next action

The source/code research and two small executed checks are complete. Matomo already covers server collection, AI reports, page transitions, and funnels. The reviewed ChatGPT provider detects header fields without verifying them cryptographically; our local verifier rejects its placeholder fixture. This is a specific difference, not evidence of better overall audience accuracy. The blog's existing RSS feed already permits reader-side following.

The authorization review found mature building blocks and active agent-specific work, but no settled publication-specific grant shared across the reviewed clients. Account approval, an enrolled agent key, successful subscription, delivery, and human reading remain separate evidence.

**Next bounded action:** select and pin a disposable reader/server pair for experiment 1, then execute its fixed follow/restart/recovery/unfollow/revoke sequence. A narrower grant to one publication is a separate extension. Experiment 2 reuses TASK-0120's known-client calibration and adds a pinned Matomo observer. Neither experiment, new subscription endpoint, enrollment, email, or unattended job was activated during this review.

The protocol reviews used two delegated researchers. Their source/version ledgers are embedded in artifacts 02 and 03; primary links identify the exact revisions where available. The root review inspected Matomo 5.13.0 at commit `04c528673024239d858998eebc34e1f8afa1acf3` and blog `c338059`. Original downloaded Matomo sources and release metadata are preserved locally under `/Users/goga/.local/share/gkoreli/analytics-evidence/2026-09-09-agent-readership/`; public file hashes are in the comparison receipt. No research-token total is asserted for this unfinished publication work.

To repeat the local signature check from the repository root:

```sh
pnpm -C packages/analytics exec tsc -p tsconfig.test.json
node packages/blog/drafts/research/agent-readership/reproduce-signature-fixture.mjs
```

This command compiles the current verifier and runs the local fixture with network access disabled in its fetch dependency. It does not run Matomo. Compare the current verifier with the recorded commit before treating a later result as a reproduction of the original baseline.
