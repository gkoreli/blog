# Personal-blog analytics, Matomo, and agent subscriptions

Started September 9 UTC / September 8 PDT, 2026. [TASK-0141](../../../../../docs/tasks/TASK-0141-compare-blog-analytics-with-matomo-and-research-agent.md).

The owner wants an evidence-based account of what this blog should build itself, what Matomo already supplies, and how a publication could serve agents that subscribe for people. The intended result is a working example other engineering blogs can inspect. Advantage claims need a defined comparison and measured result.

- [Exact human prompts](source.prompts.md): three complete messages in received order, including the repeated preservation request. These belong to this new investigation, outside article 024's frozen provenance.
- [Comparison and agent-subscription research](01-matomo-and-agent-subscriptions.md): findings, source boundaries, and the questions still being tested.
- The [HN follow-up](../article-024-hacker-news/00-worklist-index.md) owns the launch measurements and deployed referrer-context change.
- [TASK-0140](../../../../../docs/tasks/TASK-0140-audit-deterministic-guarantees-and-prior-art-for-referral.md) separately owns deterministic referral defenses. Reuse its findings rather than duplicating production probes.
- The [newsletter worklist](../newsletter-reliability/00-worklist-index.md) owns confirmation and delivery reliability. Agent enrollment must use those guarantees, not bypass them.

## Research questions

1. Which features overlap with Matomo's current server-side, bot, referral, and funnel implementations?
2. Which differences are demonstrated in code or production, which might benefit a small publication, and which remain untested?
3. What separates identifying a requesting client, verifying its signer, authorizing a subscription, delivering an update, and establishing that a person used it?
4. Which existing mechanisms fit discovery, durable following, delivery, and revocation: feeds, WebSub, WebMCP, MCP, or something else?
5. What bounded experiments could turn the next article into a reproducible demonstration?

Current status: prompts preserved; source and code comparison in progress. No agent subscription endpoint or new enrollment is implemented by this research task.
