# OSS Radar #07 worklist

Check date: September 8, 2026. Repository baseline: gkoreli/blog at `935abf29de1a755d2e278f90d4794c11d18a6a43`.

**State:** The first article release and its partial footprint are [published and verified](18-publication-verification.md). The [real subscription CLI experiment](20-subscription-cli-experiment.md) and [source review](21-real-answer-source-review.md) are now complete: two real answers, both retained through database/export, with three material errors found in Claude's answer. The [article revision](22-real-experiment-article-revision.md) is built and checked with this evidence, a product judgment, and one consolidated glossary/source table; live acceptance follows the release. The prompt record contains seventeen complete messages. The earlier [footprint](19-research-footprint.md) stays frozen and excludes this continuation.

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
| Run real directed answers and source review | Complete: two subscription CLI answers, exact preservation, reviewed sources | [Execution](20-subscription-cli-experiment.md), [review](21-real-answer-source-review.md) |
| Run the larger citation-frequency pilot | Open; separate from the completed directed cases | [Experiment plan](03-experiment-plan.md) |
| Build OSS Radar #07 | Complete; release module is in `posts/` | [Publication module](../../../posts/026-oss-radar-07-promptfoo.ts), [manuscript](../../oss-radar-07-promptfoo.md) |
| Check publication style, references, and render | Complete: 38 sources, 10 glossary terms, current type/build/Markdown checks; earlier desktop/mobile review | [Candidate review](11-publication-candidate-review.md), [source refresh](16-publication-source-check.md) |
| Design the dedicated background animation | Complete: projected stacks, six-second motion, and a separate phone composition | [Current revision](15-mobile-depth-and-motion-review.md), [first design](14-evidence-plates-canvas.md) |
| Exercise capture failures, persistence, and tracing | Complete: 10 synthetic cases, 11 HTTP attempts, explicit local join | [Method and accepted exports](repro/capture/README.md) |
| Verify and publish OSS Radar #07 | Complete: release `ccd6bc6`, Cloudflare activation, and served-content acceptance | [Publication verification](18-publication-verification.md) |
| Recover and publish research footprint | Complete: 43,272,331 measured tokens, eight sessions, explicit exclusions, and live acceptance | [Footprint methodology and receipt](19-research-footprint.md) |
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
- [First publication verification](18-publication-verification.md): deployed commit, exact served-content checks, and environment differences.
- [Real subscription CLI experiment](20-subscription-cli-experiment.md): route, conditions, execution, and the missed available subscription path.
- [Real-experiment article revision](22-real-experiment-article-revision.md): the editorial repair, one reference table, build checks, and release acceptance.
- [Real-answer source review](21-real-answer-source-review.md): both answers, retained sources, explicit judgments, and useful tool-record failures.
- [Research footprint](19-research-footprint.md): recovered sessions, ownership evidence, exclusions, accounting, and footprint release checks.
- [Publication module](../../../posts/026-oss-radar-07-promptfoo.ts) and [Markdown manuscript](../../oss-radar-07-promptfoo.md): article with Sources & Evidence and a dated glossary.
- [Repository baselines](baselines.json): pinned source revisions and read-only checks.
- [Promptfoo fixture probe](repro/README.md): runnable module-level reproduction, original source snapshot with its MIT licence, synthetic response, and saved result.
- [Installed Promptfoo probe](repro/installed/README.md): guarded local HTTP experiment, capture-provider prototype, exact dependency lock, full summaries, and cache evidence.
- [Capture continuation](repro/capture/README.md): complete failure matrix, input/response hashes, persisted exports, local trace join, source hashes, and accepted records.

## Prompts

[Exact shaping prompts](../../../prompts/oss-radar-07-promptfoo.prompts.md).

The record contains seventeen complete prompts. The first fifteen remain unchanged. The subscription-experiment request and the request to remove internal planning and consolidate the glossaries were appended verbatim.

The September 8 request explicitly asks for a prompts section for this issue. It overrides the usual OSS Radar exception that omits public prompts. This is an issue-specific decision; no shared skill or prior issue was changed. Keep the complete initial prompt intact. The second recorded answer delegated the experiment timebox decision.

The filename matches the final slug. The initial thirteen-prompt release passed local and live checks; the footprint receipt owns the later fifteen-prompt revision.

## Publication boundary

The original controlled tests established the OpenRouter adapter omission and local retention. The later CLI experiment establishes that two real subscription-backed answers and their emitted records survive the custom-provider/database/export path. Source review found errors in one answer; preservation itself did not grade truth. The native Codex and Claude integrations were code-inspected, not executed in this experiment.

## Next bounded action

Publish the article revision with the real result, a reader-facing product judgment, and one glossary/reference section. Verify the served HTML, Markdown, prompts, and release commit. The earlier browser blocker and unrun one-answer status are historical. No API purchase or production analytics query is needed.

The larger citation-frequency study and distinct engineering continuation remain open. The existing fixture/trace work is complete and must not be repeated as if unrun. The earlier footprint manifest remains frozen; the new experiment and follow-up are outside that cutoff.
