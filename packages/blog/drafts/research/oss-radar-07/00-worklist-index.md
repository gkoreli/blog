# OSS Radar #07 worklist

Check date: September 8, 2026. Repository baseline: gkoreli/blog at `935abf29de1a755d2e278f90d4794c11d18a6a43`.

**State:** Release prepared at Goga's request on September 10, 2026 PDT. The article publishes the completed controlled tests and a bounded trial recommendation. It contains 38 dated source cards, a ten-term glossary, thirteen exact prompts, runnable experiments, recorded exports, and the reviewed immersive presentation. The current isolated type check and 26-post production build passed. Push and live verification are the remaining publication steps. The real-answer test remains unrun follow-up work; browser access failed before a question could be submitted. See [publication decision](17-publication-decision.md) and [source refresh](16-publication-source-check.md).

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
| Run the bounded pilot | Open; one-answer preflight first | [Experiment plan](03-experiment-plan.md) |
| Build OSS Radar #07 | Complete; release module is in `posts/` | [Publication module](../../../posts/026-oss-radar-07-promptfoo.ts), [manuscript](../../oss-radar-07-promptfoo.md) |
| Check publication style, references, and render | Complete: 38 sources, 10 glossary terms, current type/build/Markdown checks; earlier desktop/mobile review | [Candidate review](11-publication-candidate-review.md), [source refresh](16-publication-source-check.md) |
| Design the dedicated background animation | Complete: projected stacks, six-second motion, and a separate phone composition | [Current revision](15-mobile-depth-and-motion-review.md), [first design](14-evidence-plates-canvas.md) |
| Exercise capture failures, persistence, and tracing | Complete: 10 synthetic cases, 11 HTTP attempts, explicit local join | [Method and accepted exports](repro/capture/README.md) |
| Verify and publish OSS Radar #07 | Release prepared; push and live verification pending | [Publication decision](17-publication-decision.md) |
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
- [Earlier publication readiness](09-publication-readiness.md): historical comparison with #05/#06 and the initial reference correction.
- [Desktop takeover](10-takeover-and-evidence-review.md): article passport, source audit, additional implementation evidence, and access boundary.
- [Candidate review](11-publication-candidate-review.md): historical discovery package, promise ledger, and rendered checks; its release gate is superseded.
- [Frozen directed preflight](12-directed-answer-preflight.md): unchanged question/rubric, preferred web capture, optional API route, and decision rule.
- [Provider-choice correction](13-provider-choice-and-web-capture.md): no required provider or API purchase; distinguishes web-answer import from live API-field preservation.
- [Evidence-plates canvas](14-evidence-plates-canvas.md): first delegated design and technical checks, preserved as history.
- [Mobile depth and motion](15-mobile-depth-and-motion-review.md): author feedback, projected stacks, faster movement, and revised phone composition with rendered checks.
- [Publication source refresh](16-publication-source-check.md): September 10 release/issue audit and comparison with the newer runner.
- [Publication decision](17-publication-decision.md): tested scope, unavailable browser, and unfinished real-answer follow-up.
- [Publication module](../../../posts/026-oss-radar-07-promptfoo.ts) and [Markdown manuscript](../../oss-radar-07-promptfoo.md): article with Sources & Evidence and a dated glossary.
- [Repository baselines](baselines.json): pinned source revisions and read-only checks.
- [Promptfoo fixture probe](repro/README.md): runnable module-level reproduction, original source snapshot with its MIT licence, synthetic response, and saved result.
- [Installed Promptfoo probe](repro/installed/README.md): guarded local HTTP experiment, capture-provider prototype, exact dependency lock, full summaries, and cache evidence.
- [Capture continuation](repro/capture/README.md): complete failure matrix, input/response hashes, persisted exports, local trace join, source hashes, and accepted records.

## Prompts

[Exact shaping prompts](../../../prompts/oss-radar-07-promptfoo.prompts.md).

The record contains thirteen complete prompts through the explicit publication instruction. The original twelve entries remain unchanged; the publication request is appended verbatim. Spelling, punctuation, Markdown, and message boundaries are preserved.

The September 8 request explicitly asks for a prompts section for this issue. It overrides the usual OSS Radar exception that omits public prompts. This is an issue-specific decision; no shared skill or prior issue was changed. Keep the complete initial prompt intact. The second recorded answer delegated the experiment timebox decision.

The filename matches the final slug, and the thirteen-prompt page passed the current isolated-build check.

## Publication boundary

The controlled tests establish the adapter omission and explicit capture's local retention. The release recommends a bounded trial; production citation reporting is not adopted or implemented. All recorded model payloads are synthetic. A real answer and source review could change the later adoption decision. The [publication decision](17-publication-decision.md) supersedes the earlier requirement to finish that example before releasing these findings.

## Next bounded action

Finish push and live acceptance for the prepared article. After publication, resume the [one-answer protocol](12-directed-answer-preflight.md) when browser access is available, using the existing Perplexity membership or another explicitly documented route. Preserve its result, verify the imported record through Promptfoo, and review its sources. No provider or API purchase is required. A web capture cannot establish live API-field or billing preservation. No production analytics query is needed.

The local trace/export work is complete; do not repeat it as if unrun. The [capture manifest](repro/capture/recorded/manifest.json) commits to the accepted records and source hashes. The telemetry interruption and accepted local blocking behavior remain documented. The larger citation study and distinct engineering continuation stay open; publication does not complete them.
