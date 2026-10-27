# Edge page observations versus Cloudflare RUM

**October 27 production-stage preparation:** [Protocol 08](08-production-stage-protocol.md) implements expiring owner-guarded trial routes, shared D1 stage counters and the actual production collector with permanent owner exclusion. Native local workerd/Worker/crypto acceptance is saved; browser CSP enforcement, source activation and actual production/human/device controls remain separate. No temporary production configuration is active from this preparation.

**October 27 matched calibration:** [Twenty-four executed trials](07-matched-classifier-calibration.md) compare a pinned baseline with identical live request inputs and actual current collector/local-D1 persistence. Twelve Browser → Unresolved; three automated Browser outcomes remain under injected unlisted-network evidence. The evaluation-only mapping records six decisions/fifteen abstentions across 21 stored controls, with three storage failures separate and no human negatives. [Client-form repair](../analytics-retrospective/22-client-form-and-calibration.md) prevents desktop hardware claims from preferences/defaults. The lab is stopped and viewport reset; production stages, actual JS-off, human/device controls and native coverage remain open.

Started September 6, 2026 UTC. Continuation of article 024, FLDR-0008 row 10, TASK-0120. Governing form: an evidence-led engineering investigation. Living center: finding which collection stage explains a measured counter disagreement. The experiment decides the section; the draft does not invent a result to fill a planned section.

**October 26 UTC continuation:** [Eighteen controlled local trials](06-controlled-stage-experiment.md) and [the verified receipt](2026-10-26-stage-lab.json) establish specific stage divergences with the real collector/native local D1. All browser trials were agent-operated. CSP blocking, injected write failures and narrow viewports retain their exact conditions; no JavaScript-off, human or mobile-hardware claim. [Recent native request inputs](../analytics-retrospective/15-native-input-recovery.md) are partly recovered, with sampling and D1 eligibility/join differences unresolved. Independent correctness replaces counter agreement as the goal. Production/human/device trials below remain planned. No active lab/server or scheduled capture remains.

**Latest review — October 25 Pacific / October 26 UTC:** the [current analytics audit](05-analytics-audit-2026-10-25.md), [sanitized measurements](2026-10-25-audit.json), and [exact SELECT method](2026-10-25-audit.sql) record reconciled live totals, two different Browser spikes, a 397-event unreviewed referral cohort, zero observed owner exclusions, and the unresolved signer/purpose grouping. October 20–25 has 694 Browser HTML events versus 117 UI-observed non-bot beacon loads after dashboard/API exclusions; sampling and full path receipts are missing, so no accepted ratio is published. Controlled browser trials remain pending. The audit is complete; it does not reopen accepted releases or imply a running job. Resume the bounded actions in that report.

**Same-day retrospective and extension:** [Wrangler follow-up](../analytics-retrospective/03-wrangler-followup.md), [native capabilities](../analytics-retrospective/01-native-capabilities.md), [standards/libraries](../analytics-retrospective/02-standards-and-libraries.md), and [improvement plan](../analytics-retrospective/05-improvement-plan.md) extend the current evidence without rewriting that capture. R1 context and Exa role loss are measured; actor identity, actual native entitlement and historical log joins remain unknown. The [new builder's retrospective](../../../posts/030-building-blog-analytics-what-the-numbers-can-prove.md) reports completed work and the planned next iterations separately. Its research index owns the article's release record; calibration remains here and in the existing tasks.

Article 024's corrected revision is published at its stable URL. This follow-up starts from the 95 Browser HTML observations versus 14 non-bot RUM page loads for September 4–5. Those are different populations with no shared request identifier; 81 is not an established count of bots or lost beacons.

**September 7 checkpoint:** the [publication handoff](../../../../../docs/handoffs/2026-09-07-publication-checkpoint.md) preserves the closed article, releases, draft, and worktree archive. Before further production capture, follow [TASK-0131's D1 budget checks](../../../../../docs/tasks/TASK-0131-d1-analytics-read-budget.md). Browser experiments below are planned, with no unattended job started by this checkpoint. The owner's next research exploration is [Trellner](../../../../../docs/tasks/TASK-0132-explore-trellner-research-further-ai-citation-sources-and-a.md); this experiment remains open rather than silently cancelled.

## Work and evidence

| Work | Status | Evidence / next acceptance condition |
|---|---|---|
| Preserve historical evidence | Complete for September 4–5 baseline; additional September 3 RUM saved with an explicit D1 failure | [Existing capture and limits](../readers-vs-bots/16-claims-and-work-status-2026-09-06.md) |
| Reproduce known parser/provenance defects | Executed locally | [Baseline](01-local-baseline.json), [repaired run](02-local-repair.json), [method and findings](03-local-experiment.md) |
| Correct future HTML acceptance and provenance writes | Merged and deployed September 6; [verification](04-release-verification.md) | 39 tests pass, including actual SQLite ingestion; no historical rewrite |
| Match existing Cloudflare observations | Recent invocation access and request recovery accepted; exact D1/RUM joins incomplete | [Native recovery](../analytics-retrospective/15-native-input-recovery.md); provider retention/sampling and representation eligibility remain unresolved |
| Local browser stage trials | Executed: 18 local cases, three per condition | [Method/results](06-controlled-stage-experiment.md); known automation, local first-party beacon, no production receipt claim |
| Production human/browser/device trials | Pending | Execute the controlled protocol below after owner exclusion acceptance; retain every failed/unknown stage |
| Separate signer identity from client role | TASK-0119 remains open | Preserve signature evidence; unknown trigger stays unknown. Full study is lane row 4. |
| Follow-up article | Started, unpublished | [Working draft](../../edge-page-views-versus-cloudflare-rum.md) |

A separate case study, [How I Defend My Analytics Against Referrer Spam](../../../posts/025-filter-referrer-spam-without-deleting-analytics-history.md), documents the deployed referral policy and preservation of report evidence. Its [article record](../referrer-spam/00-article-passport.md) is separate from this experiment. The historical 95-versus-14 comparison retains its original scope; subsequent extractions must state the referral policy and reconcile included/excluded observations. This reporting repair does not satisfy the paired-browser experiment gate.

## First browser experiment

Use an owner-marked test browser and an isolated test path whose eligibility matches article responses. Verify the owner mark and public-total exclusion before any trial. If an isolated path changes beacon injection or eligibility, document and fix that mismatch before interpreting the result. Do not tag ordinary readers or use a persistent browser identifier.

Run three paired repetitions per condition, with exact UTC start/end times and the same page/browser/network. Counterbalance allowed/blocked order. Keep a local trial ID and, where available, the response's Cloudflare request identifier. A URL/time correlation alone remains a candidate match.

| Condition | Controlled change | Observe separately |
|---|---|---|
| Normal navigation | JS and beacon allowed; cold cache | Edge arrival, response, injected script, script execution, beacon attempt, response/receipt, later RUM presence |
| Beacon blocked | Same browser and JS, block the beacon resource or endpoint explicitly | Which stage disappears; page rendering should remain observable |
| JS disabled | Same page/network, scripting disabled | Edge classification and absent script execution; do not equate this with automated access |
| Warm navigation / back-forward | Reuse cache, then back/forward restoration | Whether an edge request occurs and which RUM lifecycle event fires |

Record the block point, navigation/delivery type, response status, cache state, browser version, deployment version, and observation times. Keep failed and unjoined trials. Inspect existing Cloudflare diagnostics first; add telemetry only when a named stage cannot otherwise be observed. A request-scoped trial marker is useful for controlled visits; it is not permission to correlate ordinary visitors across sessions.

A successful trial demonstrates a possible mechanism under its recorded conditions. It does not measure that mechanism's historical prevalence. Repeatability and known inputs matter more than a ratio moving toward one.

## Publication boundary and data decisions

Publish the follow-up when it contains executed browser trials, their artifacts, a supported explanation of at least one collection difference, and a clear unresolved remainder. A complete fourteen-day headline requires fourteen complete days. Smaller Browser totals are not acceptance criteria.

The next two priorities remain explainable identity/role grouping (TASK-0119) and controlled collection calibration (TASK-0120). The small parser/provenance repair establishes a sounder starting point for both. User-Agent, city, and TLS observations are neither automatically forbidden nor proof of identity. Retain a field when it answers a concrete investigation question; first inventory existing diagnostics, access, retention, and combinations. This initial repair adds no new visitor field: it corrects a derived value and populates an existing provenance column.

The author direction and exact prompts are preserved in the [article 024 prompt record](../../../prompts/how-i-separate-readers-from-bots-without-javascript.prompts.md), including the request to finish that revision and start this next iteration. Before this draft is published, freeze its own materially shaping prompt record.
