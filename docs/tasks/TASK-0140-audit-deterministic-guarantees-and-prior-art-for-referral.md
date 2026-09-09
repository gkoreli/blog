---
id: TASK-0140
title: Audit deterministic guarantees and prior art for referral defenses
status: in_progress
parent_id: FLDR-0009
created_at: '2026-09-09T01:58:21.263Z'
updated_at: '2026-09-09T01:58:47.324Z'
type: task
---
The owner asks whether false headers, impersonated approved referrers, absent referrers, and automated traffic can be resolved deterministically, individually or entirely, and how other systems handle them.

Compare current primary standards/provider documentation and pinned open-source Matomo/Plausible behavior. Separate enforced reporting/admission/resource invariants from truth about human identity and actual external click-throughs. Identify controls already deployed, related referrer-context work already in progress, feasible bounded next steps, rejected overclaims, and meaningful local acceptance cases. Preserve findings and references in a separate research record; the published article 025 footprint remains frozen.

This task authorizes research and a concrete engineering recommendation. It does not by itself add visitor tracking, gate reading, configure WAF rules, alter billing, perform production probes, or open suspicious destinations.

Evidence: [guarantees, pinned prior art, and acceptance plan](../../packages/blog/drafts/research/referral-defense-guarantees/00-evidence-and-options.md); [complete research prompt](../../packages/blog/drafts/research/referral-defense-guarantees/source.prompts.md). This continuation is outside article 025's frozen research measurement.
