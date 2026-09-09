# OSS Radar #07 worklist

Check date: September 8, 2026. Repository baseline: gkoreli/blog at `935abf29de1a755d2e278f90d4794c11d18a6a43`.

**State:** Goga selected Promptfoo on September 8. Working title: **OSS Radar #07: Can Promptfoo Preserve the Evidence Behind an AI Answer?** The working draft now includes a dated source appendix, a glossary, the tested capture-code excerpt, and a trigger/citation comparison table. Source research, the initial module probe, and an installed-package fixture comparison are complete. The paid pilot, trace/export join test, and organic-citation study remain unrun.

Continuation baseline: `b338d642f04da6a9c24af513212d4a6565778bc3`. The original baseline above belongs to the four-option investigation.

**Article form:** project deep dive under the OSS Radar skill. Choose one project. The engineering continuation will use the evidence-led investigation form and answer a distinct question about the blog.

## Worklist

| Work | State | Record |
|---|---|---|
| Review recent articles, credibility research, and current operating state | Complete | [Options](01-options.md), [ledger](02-evidence-ledger.md) |
| Verify four August–September candidates and inspect relevant code | Complete | [Options](01-options.md), [baselines](baselines.json) |
| Probe Promptfoo's response normalization with an offline fixture | Complete, narrowly scoped | [Method](repro/README.md), [result](repro/result.json) |
| Check installed evaluation summaries, transport cache, and a capture provider | Complete: one synthetic payload, three evaluations | [Method](repro/installed/README.md), [result](repro/installed/recorded/result.json) |
| Select the project | Complete: Promptfoo | Exact selection in the prompts record |
| Research task triggers, identity, and citations | Complete: source research; tests proposed | [Research](04-trigger-provenance-and-ai-citations.md), [article passage](05-article-section-trigger-and-citation.md) |
| Inspect Promptfoo's design and citation-analytics prior art | Complete for the draft's claims | [Design and prior art](06-promptfoo-design-and-prior-art.md) |
| Explain Promptfoo's purpose and current trajectory | Complete: dedicated draft section and source audit | [Purpose and trajectory](08-promptfoo-purpose-and-trajectory.md) |
| Define citation records and reporting units | Proposed; ready for pilot implementation | [Measurement contract](07-citation-measurement-contract.md) |
| Run the bounded pilot | Open | [Experiment plan](03-experiment-plan.md) |
| Start the OSS Radar #07 draft | Complete: first draft; review and further evidence open | [Draft](../../oss-radar-07-promptfoo.md) |
| Check publication style and reader-facing references | Complete for the manuscript: 32 source entries and 10 glossary terms | [Publication readiness](09-publication-readiness.md) |
| Verify and publish OSS Radar #07 | Open: real-answer workload evidence and final publication pass | [Scoped readiness assessment](09-publication-readiness.md) |
| Develop the engineering continuation | Open | Requires useful blog code and new operating evidence |

Formal tracker: [FLDR-0011](../../../../../docs/folders/FLDR-0011-oss-radar-07-worklist.md). Execution task: [TASK-0134](../../../../../docs/tasks/TASK-0134-oss-radar-07-project-experiment-and-article.md).

The existing [Trellner research task](../../../../../docs/tasks/TASK-0132-explore-trellner-research-further-ai-citation-sources-and-a.md) retains its priority and remains open. This shortlist does not complete its domain comparison, live study, or current-source audit. The [citation surface task](../../../../../docs/tasks/TASK-0106.md) also retains its unresolved public-design decision.

## Artifact map

- [Four options and recommendation](01-options.md): dated developments, rationale, product theories, experiments, code, and article continuations.
- [Evidence ledger](02-evidence-ledger.md): claims, sources, evidence states, limits, and current PR states.
- [Experiment plan](03-experiment-plan.md): the recommended first-week scope, comparison rules, outputs, budget, and stopping conditions.
- [Trigger provenance and AI citations](04-trigger-provenance-and-ai-citations.md): prior art, observation limits, a conceptual diagram, and a bounded test proposal.
- [Article passage](05-article-section-trigger-and-citation.md): sourced prose on task history and answer attribution for the Promptfoo draft.
- [Promptfoo design and prior art](06-promptfoo-design-and-prior-art.md): product theory, source trace, novelty limits, and adoption decision.
- [Citation measurement contract](07-citation-measurement-contract.md): proposed records, missing-data states, denominators, and the connection to the analytics thread.
- [Promptfoo purpose and trajectory](08-promptfoo-purpose-and-trajectory.md): what the tools do, the maintainers' public purpose, recent releases, OpenAI affiliation, and the boundary between shipped features and the Frontier plan.
- [Publication readiness](09-publication-readiness.md): comparison with published #05/#06, references/glossary corrections, supported scope, and concrete remaining publication work.
- [OSS Radar #07 draft](../../oss-radar-07-promptfoo.md): working article with Sources & Evidence and a dated Glossary; not published.
- [Repository baselines](baselines.json): pinned source revisions and read-only checks.
- [Promptfoo fixture probe](repro/README.md): runnable module-level reproduction, original source snapshot with its MIT licence, synthetic response, and saved result.
- [Installed Promptfoo probe](repro/installed/README.md): guarded local HTTP experiment, capture-provider prototype, exact dependency lock, full summaries, and cache evidence.

## Prompts

[Exact shaping prompts](../../../prompts/oss-radar-07.prompts.md).

The record contains eight complete prompts through the publication-readiness and references/glossary question. The seven existing entries remain unchanged; the latest request is appended verbatim. Spelling, punctuation, Markdown, and message boundaries are preserved.

The September 8 request explicitly asks for a prompts section for this issue. It overrides the usual OSS Radar exception that omits public prompts. This is an issue-specific decision; no shared skill or prior issue was changed. Keep the complete initial prompt intact. The second recorded answer delegated the experiment timebox decision.

The provisional prompt filename is `oss-radar-07.prompts.md`. When the final article slug is chosen, move the file to that exact slug and verify the normal prompts page. There is no matching published post yet.

## Publication boundary

The installed fixture earns a narrow adapter review. The stronger workload review should add a real-answer capture, then use the established publication module and rendered checks. The entire repeated citation study is not a blanket requirement for publishing the scoped Radar result. See [the readiness assessment](09-publication-readiness.md); the broader analytics and engineering work remains open.

## Next bounded action

Extend the successful fixture capture to missing fields, failures, retries, and charge provenance before the live preflight. Freeze the real question set and source-support rubric before viewing live answers. Then obtain a bounded API/billing preflight and verify the trace/export joins the study will depend on. Do not query production D1 merely to repeat known counts.

The installed result supports a narrow adoption decision: use Promptfoo's runner with explicit capture for the next experiment. Built-in OpenRouter summaries omitted the fixture's citation fields, while the transport cache retained them and a custom provider preserved them through programmatic JSON export. There were no live model calls or API charges. The first run encountered an opt-out beacon; the accepted rerun blocked it locally and records the limitation.

One week is a planning target, not an automation or a promised publication date. Keep null results, failed runs, and explicit no-change decisions in the record.
