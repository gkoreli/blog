---
id: TASK-0134
title: OSS Radar 07 AI citations research, article, and engineering continuation
status: in_progress
parent_id: FLDR-0011
created_at: '2026-09-08T19:21:39.000Z'
updated_at: '2026-09-11T17:07:29.943793+00:00'
type: task
---

**Current article state — September 11:** the full AI-citations rewrite is **published and verified at `4f8e39e`**. Completed research, three independent reviews, build/viewport checks, and exact live-content matches are recorded in [acceptance 32](../../packages/blog/drafts/research/oss-radar-07/32-ai-citations-rewrite-acceptance.md). The governing subject is **AI Citations: Do Agents Preserve the Evidence Behind an Answer?** The author's latest request supersedes the earlier requirement to make Promptfoo the article's center.

This task retains its separate engineering-continuation scope, so article publication alone does not complete the whole task. The larger citation-frequency pilot is also unrun. Neither is a release gate for the findings already established.

## Completed research and experiments

- [OSS generation audit](../../packages/blog/drafts/research/oss-radar-07/24-citation-generation-oss.md): ALCE, Self-RAG, STORM/Co-STORM, OpenScholar, code baselines, and reported study populations.
- [Evaluation and observability audit](../../packages/blog/drafts/research/oss-radar-07/25-citation-evaluation-oss.md): TruLens, DeepEval, Ragas, Phoenix, code behavior, and license boundaries.
- [Credibility audit](../../packages/blog/drafts/research/oss-radar-07/26-source-credibility-and-citation-evidence.md): citation support, causal attribution, source preferences, and publishing implications.
- [DeepTRACE audit](../../packages/blog/drafts/research/oss-radar-07/28-deeptrace-comparison-audit.md): useful design, with headline comparisons declined for recorded reasons.
- [Real subscription CLI experiment](../../packages/blog/drafts/research/oss-radar-07/20-subscription-cli-experiment.md) and [source review](../../packages/blog/drafts/research/oss-radar-07/21-real-answer-source-review.md): one real Codex answer and one real Claude Code answer; exact retained records across summary/library/reopened database exports; three material errors identified in Claude's answer. No answer was resampled.
- Earlier [installed connector test](../../packages/blog/drafts/research/oss-radar-07/repro/installed/README.md) and [capture continuation](../../packages/blog/drafts/research/oss-radar-07/repro/capture/README.md) are completed synthetic transport/persistence tests. They did not call OpenRouter or any model. The [claim audit](../../packages/blog/drafts/research/oss-radar-07/23-openrouter-claim-audit.md) corrects the former misleading wording.
- Three independent manuscript reviews, parent synthesis, current metadata, one glossary/source table, and draft sharing copy are saved under the [worklist](../../packages/blog/drafts/research/oss-radar-07/00-worklist-index.md).

## Publication and provenance

Current [served module](../../packages/blog/posts/026-oss-radar-07-promptfoo.ts), [manuscript](../../packages/blog/drafts/oss-radar-07-promptfoo.md), and [rewrite brief](../../packages/blog/drafts/research/oss-radar-07/27-ai-citations-rewrite-brief.md). The existing URL is retained. Nineteen exact human prompts are public at the author's explicit request.

The [partial footprint](../../packages/blog/drafts/research/oss-radar-07/19-research-footprint.md) remains frozen: eight sessions, 43,272,331 tokens, fifteen prompts and twenty-three research Markdown artifacts at its cutoff. Those counts describe earlier work; they exclude the real CLI continuation, full rewrite, and subsequent prompts. Do not enlarge or relabel the snapshot without new attributable accounting.

Historical receipts: [first publication](../../packages/blog/drafts/research/oss-radar-07/18-publication-verification.md), [real-experiment revision](../../packages/blog/drafts/research/oss-radar-07/22-real-experiment-article-revision.md). Current acceptance belongs to artifact 32; earlier source counts, titles, and publication decisions are historical.

## Remaining scope

1. Separately implement a useful analytics continuation with new operating evidence, using the [measurement contract](../../packages/blog/drafts/research/oss-radar-07/07-citation-measurement-contract.md). It must answer a distinct question from this OSS synthesis.
2. Keep the larger citation-frequency pilot and [Trellner research task](TASK-0132-explore-trellner-research-further-ai-citation-sources-and-a.md) explicitly uncompleted until their own evidence requirements are met. The two directed answers cannot establish organic discovery or a population error rate.

Do not repeat completed fixture, CLI, or review work as if unrun. Do not restore the old browser-only blocker: the subscription CLI route already ran successfully. Share-copy preparation does not authorize posting to X or HN.
