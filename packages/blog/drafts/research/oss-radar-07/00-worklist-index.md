# OSS Radar #07 worklist

Check date: September 8, 2026. Repository baseline: gkoreli/blog at `935abf29de1a755d2e278f90d4794c11d18a6a43`.

**State:** four options researched; Promptfoo recommended; topic selection and the live pilot remain open. A small offline adapter probe is complete. No article draft, production change, paid model call, or organic-citation result is included in this work.

**Article form:** project deep dive under the OSS Radar skill. Choose one project. The engineering continuation will use the evidence-led investigation form and answer a distinct question about the blog.

## Worklist

| Work | State | Record |
|---|---|---|
| Review recent articles, credibility research, and current operating state | Complete | [Options](01-options.md), [ledger](02-evidence-ledger.md) |
| Verify four August–September candidates and inspect relevant code | Complete | [Options](01-options.md), [baselines](baselines.json) |
| Probe Promptfoo's response normalization with an offline fixture | Complete, narrowly scoped | [Method](repro/README.md), [result](repro/result.json) |
| Select the project and run its bounded pilot | Open | [Experiment plan](03-experiment-plan.md) |
| Write, verify, and publish OSS Radar #07 | Open | Requires the project verdict and completed experiment artifacts |
| Develop the engineering continuation | Open | Requires useful blog code and new operating evidence |

Formal tracker: [FLDR-0011](../../../../../docs/folders/FLDR-0011-oss-radar-07-worklist.md). Execution task: [TASK-0134](../../../../../docs/tasks/TASK-0134-oss-radar-07-project-experiment-and-article.md).

The existing [Trellner research task](../../../../../docs/tasks/TASK-0132-explore-trellner-research-further-ai-citation-sources-and-a.md) retains its priority and remains open. This shortlist does not complete its domain comparison, live study, or current-source audit. The [citation surface task](../../../../../docs/tasks/TASK-0106.md) also retains its unresolved public-design decision.

## Artifact map

- [Four options and recommendation](01-options.md): dated developments, rationale, product theories, experiments, code, and article continuations.
- [Evidence ledger](02-evidence-ledger.md): claims, sources, evidence states, limits, and current PR states.
- [Experiment plan](03-experiment-plan.md): the recommended first-week scope, comparison rules, outputs, budget, and stopping conditions.
- [Repository baselines](baselines.json): pinned source revisions and read-only checks.
- [Promptfoo fixture probe](repro/README.md): runnable module-level reproduction, original source snapshot with its MIT licence, synthetic response, and saved result.

## Prompts

[Exact shaping prompts](../../../prompts/oss-radar-07.prompts.md).

The September 8 request explicitly asks for a prompts section for this issue. It overrides the usual OSS Radar exception that omits public prompts. This is an issue-specific decision; no shared skill or prior issue was changed. Keep the complete initial prompt intact. The second recorded answer delegated the experiment timebox decision.

The provisional prompt filename is `oss-radar-07.prompts.md`. When the final article slug is chosen, move the file to that exact slug and verify the normal prompts page. There is no matching published post yet.

## Next bounded action

Use the installed Promptfoo 0.122.2 package against a mock endpoint to check whether the source-level omission appears in exported evaluation results. If it does, prototype raw-response capture and replay the same response through both paths. Obtain a successful bounded API/billing preflight only when the live pilot starts. Do not query production D1 merely to repeat known counts.

One week is a planning target, not an automation or a promised publication date. Keep null results, failed runs, and explicit no-change decisions in the record.
