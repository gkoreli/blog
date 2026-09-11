# Article revision: real answers, product judgment, one glossary

Prepared September 10, 2026 PDT / September 11 UTC. The [real experiment](20-subscription-cli-experiment.md) and [source review](21-real-answer-source-review.md) are committed at `9d99ae8fac8fefc24fc45b4a962ef776d122f405` and pinned from the article.

## What changed

- The opening and a new section report the two subscription-backed CLI runs, their retained records, and the concrete denominator error in Claude's final answer.
- The article explains the available native Codex and Claude integrations without claiming they were executed. The custom CLI path, controlled OpenRouter tests, and inspected SDK code remain distinct.
- The conclusion gives a product decision: use Promptfoo for repeatable evaluation with checked capture and source review; use a direct CLI for a one-off answer archive. Internal trial planning moved to the worklist.
- Sources and definitions are consolidated into one **Glossary & sources** table: 45 distinct references, each dated and explained, including all ten original term definitions exactly once. The second glossary was removed. No shared rendering component was changed.
- The manuscript, served TypeScript module, description, hero text, 14-minute reading time, and draft X copy agree. X and HN copy remain unpublished.
- Seventeen exact shaping prompts are retained. The prior footprint's numbers and manifest remain frozen; its scope explicitly excludes the subsequent runs and reviews.

## Verification before release

`pnpm -C packages/blog typecheck` and `pnpm -C packages/blog build` passed. The build produced 26 posts. The CLI experiment wrapper also passed a separate strict TypeScript check against its pinned Promptfoo installation, after adding an explicit response-presence assertion and version guard. No model generation was repeated for these static checks.

Rendered HTML and the generated Markdown endpoint contain one article H1 and one consolidated glossary. All ten definitions occur once. All 45 references have dates and rationales; every material external body link appears in the reference table. Every table row matches its header width. Both appended prompts appear in the rendered transparency page. The final article's title and narrative fit 14 minutes at the repository's 200-word rule. Whitespace checks passed.

A separate agent reread the OSS Radar skill, project-deep-dive reference, and TypeScript reference, and reviewed the final source against the retained answers. It found no material blocker. This is agent review, not human reception. No fresh browser screenshot was obtained because the native computer-use connection failed earlier; the current checks inspect the built HTML and Markdown. Earlier desktop/mobile canvas checks remain historical, and the canvas implementation did not change.

## Release acceptance

Commit/push and exact live-content acceptance are pending at this pre-release checkpoint. The live receipt will be added here after Cloudflare serves the revision.
