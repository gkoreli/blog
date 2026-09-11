---
id: TASK-0134
title: OSS Radar 07 project experiment and article
status: in_progress
parent_id: FLDR-0011
created_at: '2026-09-08T19:21:39.000Z'
updated_at: '2026-09-11T04:15:00.000Z'
type: task
---
Goga selected **Promptfoo** for **OSS Radar #07: Can Promptfoo Preserve the Evidence Behind an AI Answer?** The research tests its design and adoption fit for preserving citation evidence; the planned engineering continuation must answer a distinct question about code used on the blog.

**Publication: complete.** [Release `ccd6bc6` and live acceptance](../../packages/blog/drafts/research/oss-radar-07/18-publication-verification.md) verified the article, 38 source cards, glossary, thirteen initial prompts, metadata, Markdown, and assets. The [research-footprint record](../../packages/blog/drafts/research/oss-radar-07/19-research-footprint.md) owns the later measured-subset accounting and release checks. The [prompt record](../../packages/blog/prompts/oss-radar-07-promptfoo.prompts.md) contains fifteen complete messages at that frozen release, including the footprint and connector-wording requests. The [publication module](../../packages/blog/posts/026-oss-radar-07-promptfoo.ts) is the served source.

The [publication decision](../../packages/blog/drafts/research/oss-radar-07/17-publication-decision.md) supersedes the earlier real-answer release gate. The article publishes controlled results and recommends a bounded trial. It does not claim a working production citation pipeline or measured live source-support accuracy. The [source refresh](../../packages/blog/drafts/research/oss-radar-07/16-publication-source-check.md) records the newer 0.123.0 release separately from the tested 0.122.2 baseline.

## Completed research and experiments

- [Source/design and prior-art review](../../packages/blog/drafts/research/oss-radar-07/06-promptfoo-design-and-prior-art.md), [product purpose/trajectory](../../packages/blog/drafts/research/oss-radar-07/08-promptfoo-purpose-and-trajectory.md), and the original four-option comparison are saved in the [worklist](../../packages/blog/drafts/research/oss-radar-07/00-worklist-index.md).
- The [installed comparison](../../packages/blog/drafts/research/oss-radar-07/repro/installed/README.md) ran three evaluations and two local requests. The built-in OpenRouter summary omitted fixture citation fields; its cache and a custom provider retained them.
- The [capture continuation](../../packages/blog/drafts/research/oss-radar-07/repro/capture/README.md) retained ten controlled cases and all eleven attempts through saved database results and both JSON exporters. One explicit local trace join also passed. All payloads were synthetic.
- [Trigger/citation research](../../packages/blog/drafts/research/oss-radar-07/04-trigger-provenance-and-ai-citations.md), [measurement contract](../../packages/blog/drafts/research/oss-radar-07/07-citation-measurement-contract.md), and [rendered candidate review](../../packages/blog/drafts/research/oss-radar-07/11-publication-candidate-review.md) preserve rationale, method, limits, and earlier checks.

## Real-answer continuation

The [subscription CLI experiment](../../packages/blog/drafts/research/oss-radar-07/20-subscription-cli-experiment.md) and [source review](../../packages/blog/drafts/research/oss-radar-07/21-real-answer-source-review.md) are complete. One fresh Codex and one fresh Claude Code invocation used saved subscription logins. Both real answers and emitted records survived the summary, library exporter, and restarted CLI database export. The review found three material errors in Claude's answer. No answer was resampled.

The browser failure was not the only available route. The earlier fixture-only publication decision did not satisfy this real-answer request. The prompt record now has seventeen exact messages; the original footprint remains frozen and excludes the continuation.

The [article revision](../../packages/blog/drafts/research/oss-radar-07/22-real-experiment-article-revision.md) is built and checked: real results, product/adoption advice, and one consolidated glossary/reference table. Deployment acceptance follows the release. The larger 72-call study and distinct engineering continuation remain open; publication does not complete them. This task remains `in_progress` for that continuation.

Acceptance:

- Pin the chosen repository/release and record a complete claim table and competing product theories.
- Retain exact prompts, input fixtures, failures, results, scripts, costs, and evidence limits.
- Produce at least one runnable or explorable article artifact with real results.
- Connect an adopted code change or explicit no-adoption verdict to the owned problem.
- Keep the Radar product verdict distinct from the engineering article's new operating result.
- Include the task-trigger and citation distinction in the article; distinguish citation counts, source-support evaluation, and untested causal reliance.
- State what prior work already does and identify our contribution through retained data and a reproducible method, without claiming category-level novelty.
- Apply article shaping, fact checking, discovery, prose, and visual checks before publication. Carry the Sources & Evidence entries and dated glossary into the publication render.
- Match the final article slug to the preserved prompts file and verify its page.

Do not mark TASK-0132 complete through this task: its source audit, domain comparison, and study have their own evidence requirements. Reuse the existing newsletter and citation worklists where the selected option overlaps them.
