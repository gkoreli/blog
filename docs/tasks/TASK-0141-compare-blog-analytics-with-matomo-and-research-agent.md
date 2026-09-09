---
id: TASK-0141
title: Compare blog analytics with Matomo and research agent subscriptions
status: done
parent_id: FLDR-0008
created_at: '2026-09-09T02:02:12.763Z'
updated_at: '2026-09-09T02:50:00.000Z'
type: task
---


**Complete; saved and pushed in `c42ab3a`.** Read the [Matomo comparison](../../packages/blog/drafts/research/agent-readership/01-matomo-and-agent-subscriptions.md) or the [full artifact index](../../packages/blog/drafts/research/agent-readership/00-worklist-index.md). Four full owner messages are preserved in `source.prompts.md`, including the repeated preservation request and the question about human delegation.

Compare the deployed blog with pinned Matomo code and current primary documentation. Distinguish overlap, demonstrated differences, missing features and untested superiority claims. Explore feeds, WebSub, WebMCP, MCP and scoped authorization for agents subscribing on a human's behalf. Record concrete experiments for a future article.

Acceptance: readable comparison, source/version ledger, code-backed claims, explicit unknowns, a subscription lifecycle proposal and a bounded experiment worklist. No new subscriber enrollment, emails or production subscription protocol is authorized by this research task. The current referrer-context implementation remains owned by TASK-0135; referral-defense research remains in TASK-0140.

## Research completed — September 9 UTC / September 8 PDT

The [Matomo comparison](../../packages/blog/drafts/research/agent-readership/01-matomo-and-agent-subscriptions.md), [delegation review](../../packages/blog/drafts/research/agent-readership/02-delegation-prior-art.md), and [subscription review](../../packages/blog/drafts/research/agent-readership/03-agent-subscription-protocols.md) record dated primary sources and distinguish pinned code, documented behavior, executed checks, and proposals. Two delegated researchers covered authorization and subscription protocols.

Executed checks: live RSS retrieval returned 25 distinct item GUIDs and a zero-body conditional 304; our local verifier rejected the upstream Matomo placeholder-signature fixture with zero network requests. Matomo's full stack, client interoperability, actual agent enrollment, and human approval were not tested. There is no measured overall superiority claim.

The [experiment worklist](../../packages/blog/drafts/research/agent-readership/04-experiments-and-decision.md) preserves two proposed extensions. They have not run and are not unfinished acceptance criteria for this task. TASK-0119 retains identity/purpose implementation, TASK-0120 retains calibration, and the ten-post lane remains in FLDR-0008. Article 024 and its frozen footprint were not reopened. The [September 9 break checkpoint](../handoffs/2026-09-09-analytics-and-agent-research-checkpoint.md) is the current resume record for this thread.
