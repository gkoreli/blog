---
id: TASK-0134
title: OSS Radar 07 project experiment and article
status: in_progress
parent_id: FLDR-0011
created_at: '2026-09-08T19:21:39.000Z'
updated_at: '2026-09-11T03:27:00.000Z'
type: task
---
Goga selected **Promptfoo** for **OSS Radar #07: Can Promptfoo Preserve the Evidence Behind an AI Answer?** The research tests its design and adoption fit for preserving citation evidence; the planned engineering continuation must answer a distinct question about code used on the blog.

**Publication: complete.** [Release `ccd6bc6` and live acceptance](../../packages/blog/drafts/research/oss-radar-07/18-publication-verification.md) verified the article, 38 source cards, glossary, thirteen initial prompts, metadata, Markdown, and assets. The [research-footprint record](../../packages/blog/drafts/research/oss-radar-07/19-research-footprint.md) owns the later measured-subset accounting and release checks. The [prompt record](../../packages/blog/prompts/oss-radar-07-promptfoo.prompts.md) now contains fifteen complete messages, including the footprint and connector-wording requests. The [publication module](../../packages/blog/posts/026-oss-radar-07-promptfoo.ts) is the served source.

The [publication decision](../../packages/blog/drafts/research/oss-radar-07/17-publication-decision.md) supersedes the earlier real-answer release gate. The article publishes controlled results and recommends a bounded trial. It does not claim a working production citation pipeline or measured live source-support accuracy. The [source refresh](../../packages/blog/drafts/research/oss-radar-07/16-publication-source-check.md) records the newer 0.123.0 release separately from the tested 0.122.2 baseline.

## Completed research and experiments

- [Source/design and prior-art review](../../packages/blog/drafts/research/oss-radar-07/06-promptfoo-design-and-prior-art.md), [product purpose/trajectory](../../packages/blog/drafts/research/oss-radar-07/08-promptfoo-purpose-and-trajectory.md), and the original four-option comparison are saved in the [worklist](../../packages/blog/drafts/research/oss-radar-07/00-worklist-index.md).
- The [installed comparison](../../packages/blog/drafts/research/oss-radar-07/repro/installed/README.md) ran three evaluations and two local requests. The built-in OpenRouter summary omitted fixture citation fields; its cache and a custom provider retained them.
- The [capture continuation](../../packages/blog/drafts/research/oss-radar-07/repro/capture/README.md) retained ten controlled cases and all eleven attempts through saved database results and both JSON exporters. One explicit local trace join also passed. All payloads were synthetic.
- [Trigger/citation research](../../packages/blog/drafts/research/oss-radar-07/04-trigger-provenance-and-ai-citations.md), [measurement contract](../../packages/blog/drafts/research/oss-radar-07/07-citation-measurement-contract.md), and [rendered candidate review](../../packages/blog/drafts/research/oss-radar-07/11-publication-candidate-review.md) preserve rationale, method, limits, and earlier checks.

## Remaining follow-up

The [one-answer preflight](../../packages/blog/drafts/research/oss-radar-07/12-directed-answer-preflight.md) remains unrun. Browser access failed before any Perplexity question was submitted, so there is no model outcome or import result. Its question and review rubric are unchanged. The [provider-choice correction](../../packages/blog/drafts/research/oss-radar-07/13-provider-choice-and-web-capture.md) still applies: no particular provider or API-credit purchase is required, and a web-answer import cannot establish preservation of original API fields.

After the release, the next bounded experiment is that answer capture, Promptfoo import/export check, and source review. The broader 72-call study and an engineering continuation using new blog code remain open. This task stays `in_progress` for that continuation; it must not be read as an unpublished-article status after release.

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
