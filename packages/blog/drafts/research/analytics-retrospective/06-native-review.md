# Native-platform review of the retrospective and improvement plan

Reviewed October 25, 2026 Pacific / October 26 UTC. Scope: [draft article](../../../posts/030-building-blog-analytics-what-the-numbers-can-prove.md), [improvement plan](05-improvement-plan.md), [native source review](01-native-capabilities.md), [frozen audit](../edge-vs-rum/05-analytics-audit-2026-10-25.md), [Wrangler follow-up](03-wrangler-followup.md), its exact SQL, and the installed Cloudflare types. No production requests, credential reads, new experiments, or article/plan edits in this review.

## Disposition

No blocking platform, metering, or attribution error found. The retrospective can be published as a bounded account of completed repairs and current unknowns. It does not need a universal identity solution, additional production instrumentation, or completed calibration to truthfully describe this work. The two improvements below would make the next implementation and native-capability choice more useful.

## Actionable findings

### 1. Include the accessible native comparison before discussing premium fields

**Priority: P2, reader-decision omission.** The article's “Check native capabilities” section names signed-agent/category fields and separates Workers Paid from Enterprise Bot Management, correctly. It does not mention that [AI Crawl Control is documented on all plans](https://developers.cloudflare.com/ai-crawl-control/) and has a [dashboard-backed GraphQL surface](https://developers.cloudflare.com/ai-crawl-control/reference/graphql-api/). Readers could miss the lowest-cost native comparison and understand the choice as local rules versus a premium entitlement.

Suggested disposition: add a short sentence identifying AI Crawl Control as the first native comparison to inspect, with actual permissions, sampling and page-eligibility alignment still required. Keep a deeper capability inventory in the linked matrix; no new dashboard execution or paid upgrade is a publication condition.

### 2. Make the pinned-type/runtime boundary explicit in implementation acceptance

**Priority: P2, implementation-plan omission.** The installed package resolves to `@cloudflare/workers-types` **4.20260306.1**. In its `index.d.ts`, `IncomingRequestCfPropertiesBotManagementBase` contains score, verifiedBot and detectionIds (around lines 10212–10237), but no `signedAgent`; no named `verifiedBotCategory` property is declared. The generic base extends `Record<string, unknown>`, so newly discovered top-level fields are unknown values, not validated typed facts. Current [native documentation](https://developers.cloudflare.com/bots/reference/bot-management-variables/#workers-variables) lists newer fields.

Suggested disposition: plan row 4 should include compatible generated/current binding types or explicit runtime narrowing at the field boundary, alongside actual availability receipts. Preserve absent/unavailable/false, and follow the repository's no-assertion/no-`any` rule. A missing declaration in this March snapshot is not evidence that Cloudflare lacks the runtime capability; conversely, a declared `botManagement` object does not prove actual entitlement or field population. No dependency update is necessary merely to publish the retrospective.

## Consequential claims that pass this review

- **Metered cost:** 182,388 / 5,000,000 is 3.64776%, supporting the rounded 3.65% for that historical free-plan report. The 182,388 → 33,259 comparison is tied to the retained identical report and correctly distinguished from the upgrade and cache acceptance. Today's combined direct SQL total is 417,102 + 213,067 = **630,169**. Public report work and account-wide totals remain explicitly outside it.
- **`waitUntil`:** the article accurately separates page delivery from durable persistence. The [native contract](https://developers.cloudflare.com/workers/runtime-apis/context/#waituntil) has a shared bounded post-response lifetime; it is not a durable-delivery guarantee. The plan appropriately makes Queues conditional on a measured gap rather than an automatic repair.
- **Cache:** the article correctly distinguishes data-center-local Cache API storage, isolate-local coalescing, and a global read budget. Today's one SEA hit supports the named reuse observation, not a global hit rate. The original calculation time and UTC-midnight cap remain explicit.
- **Native identity and entitlements:** current mappings and BotBase vocabulary are documented, while actual enabled zone fields remain unverified. The article does not equate Workers Paid with an Enterprise Bot Management entitlement or provider category with a per-request human trigger. The native note correctly preserves the distinction between current behaviors and legacy WAF category fields.
- **R1 attribution:** the frozen follow-up SQL supports a supplied-host cohort and same-ID context within the stated public population and exclusive cutoff. The article keeps that scope and does not turn the same-origin/external-referrer combinations, single-event IDs, geography or ASN into an actor identity or a universal automation verdict.
- **RUM comparison:** 694 Browser HTML events versus 117 dashboard-observed filtered loads is presented without an accepted ratio, bot fraction, sampling receipt or authenticated event join. This matches the audit's limitations.
- **Completed versus proposed:** local/runtime parser checks, historical production acceptance, today's SQL, documentation review and future engineering gates are distinguished. Retained trace/log inventory is proposed; no inspected historical spans are implied.

## Time-sensitive detail to preserve in execution

The native [Workers Logs documentation](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) currently distinguishes Free three-day from Paid seven-day retention; [traces document seven days](https://developers.cloudflare.com/workers/observability/traces/). October 24–25 is inside those documented windows at this review, subject to actual retention, sampling, truncation, permission and field coverage. The plan puts this inventory first, appropriately. It should not become an assertion that the records definitely exist, nor a reason to reopen the completed article if the window later closes.

The current plan's supported-access and credential boundaries are appropriate. Retain the explicit unknown when a native dataset is inaccessible instead of replacing it with zero or adding unrelated collection. The next bounded engineering result remains an actual owner/test exclusion receipt, followed by the separate role/catalogue correction and labelled collection trials.
