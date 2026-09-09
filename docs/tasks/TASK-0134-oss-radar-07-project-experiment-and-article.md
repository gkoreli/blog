---
id: TASK-0134
title: OSS Radar 07 project experiment and article
status: in_progress
parent_id: FLDR-0011
created_at: '2026-09-08T19:21:39.000Z'
updated_at: '2026-09-08T21:59:19.313Z'
type: task
---

Goga selected **Promptfoo** for **OSS Radar #07: Can Promptfoo Preserve the Evidence Behind an AI Answer?** Run its bounded experiment and write the article as a project deep dive. Judge design, working behavior, extra code, and adoption for a citation-evidence workload. Develop a distinct engineering continuation from code used on the blog.

The September 8 preparation now includes source/prior-art research, the initial offline module probe, an installed-package fixture comparison, a custom capture-provider prototype, and the first article draft. The installed result distinguishes a missing citation field in the built-in summary from complete parsed data in the transport cache. Custom raw/metadata survived programmatic JSON export. All model responses were synthetic; no paid or production study ran. API trials, trace/export joins, author review, and publication remain open.

The [trigger/citation research](../../packages/blog/drafts/research/oss-radar-07/04-trigger-provenance-and-ai-citations.md) separates task authority, run trigger, signer identity, content access, citation support, and causal reliance. Its [article passage](../../packages/blog/drafts/research/oss-radar-07/05-article-section-trigger-and-citation.md) belongs in the [working draft](../../packages/blog/drafts/oss-radar-07-promptfoo.md). [Design and prior art](../../packages/blog/drafts/research/oss-radar-07/06-promptfoo-design-and-prior-art.md) constrain the novelty and adoption claims.

The [installed method and artifacts](../../packages/blog/drafts/research/oss-radar-07/repro/installed/README.md) retain the exact dependency lock, script, response fixture, full summaries, cache entry, and the resolved execution interruption. The [measurement contract](../../packages/blog/drafts/research/oss-radar-07/07-citation-measurement-contract.md) defines proposed records, denominators, and missing-data states.

The draft now has a dedicated **What Promptfoo is building** section, supported by the [purpose and trajectory audit](../../packages/blog/drafts/research/oss-radar-07/08-promptfoo-purpose-and-trajectory.md). It explains evaluation, adversarial testing, code scanning, recent tracing/accounting work, current OpenAI affiliation, and the stated Frontier plan without treating planned integration as shipped. All eight shaping prompts through the publication-readiness question are preserved verbatim in the [prompts file](../../packages/blog/prompts/oss-radar-07.prompts.md).

A comparison with published Radar #05/#06 is recorded in [publication readiness](../../packages/blog/drafts/research/oss-radar-07/09-publication-readiness.md). The manuscript now includes 32 dated source entries with reasons, a 10-term glossary, the tested capture-code excerpt, and a trigger/citation table. It remains outside `posts/`. The complete repeated citation study is not a blanket gate for a narrowly scoped adapter review; real-answer workload evidence and the final publication module/render pass remain open for the intended stronger review.

Next action: extend the capture provider to real response variants, absent fields, failures, retries, and charge provenance; freeze questions and the support rubric; then follow the bounded preflight in the [experiment plan](../../packages/blog/drafts/research/oss-radar-07/03-experiment-plan.md). The proposed one-week timebox and $20 incremental API ceiling are planning assumptions, not a purchase or scheduled job.

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
