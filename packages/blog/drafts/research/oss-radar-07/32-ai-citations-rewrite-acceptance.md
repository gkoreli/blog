# AI-citations rewrite: acceptance and publication

September 11, 2026. Parent synthesis on `main`, following the full request preserved as prompt 19. **Published and verified:** release `4f8e39e` replaces the earlier Promptfoo-centered article. Research, manuscript review, final build, local acceptance, and live checks are complete.

## What changed

The article is now **AI Citations: Do Agents Preserve the Evidence Behind an Answer?** Its subject is AI citations, research agents, attribution, and engineering-source credibility. OpenScholar and STORM receive the deepest treatment. ALCE/Self-RAG, TruLens/DeepEval/Ragas, Promptfoo, and Phoenix contribute distinct implementation findings. Promptfoo reports the two real subscription CLI runs; it no longer supplies the article's governing question. Phoenix is explicitly source-available under ELv2.

The [rewrite brief](27-ai-citations-rewrite-brief.md) records the purposive ten-candidate sample and the decision to decline DeepTRACE's headline percentages. PaperQA2 is a comparison from OpenScholar's paper, not an independently audited code project in this sample. The [generation](24-citation-generation-oss.md), [evaluation](25-citation-evaluation-oss.md), and [credibility](26-source-credibility-and-citation-evidence.md) audits contain the primary evidence. No new model experiment ran during this rewrite. The five synthetic Ragas function checks remain labeled research receipts and do not supply article results.

The [manuscript](../../oss-radar-07-promptfoo.md) and [served TypeScript module](../../../posts/026-oss-radar-07-promptfoo.ts) share the narrative and one combined glossary/source table. The obsolete Promptfoo-centered content and local-mock diagram were removed from the current article, while their historical evidence remains in this directory. The published URL stays `/oss-radar-07-promptfoo` to preserve existing links; title, description, headings, and discovery metadata now name AI citations.

## Independent review and resolutions

- [Generation review](29-generation-manuscript-review.md): numbers, populations, and code claims pass. Changed the opening to “not necessarily easier to verify.” Identified the paper's PaperQA2 baseline using the OpenScholar datastore and linked Table 1 beside 48.0. The same-base-model claim applies only to the GPT-4o baseline versus OpenScholar comparison.
- [Evaluation and capture review](30-evaluation-manuscript-review.md): independently verified source snapshots, exact real-answer/stdout retention across summary/library/restarted-CLI results, and the frozen footprint. Repaired links to include the actual TruLens, DeepEval, Ragas, and Promptfoo `raw`/metadata definitions. No evaluator accuracy claim was inferred from code inspection.
- [Credibility and voice review](31-credibility-manuscript-review.md): Wallat, Khan, Google, and publisher implications pass. Narrowed the two closing bets to the outcomes their tests could establish: additional citation errors caught, and precise current engineering evidence prevailing over familiar but outdated sources. Removed repeated “My take” labels and several redundant caveat endings. Retained the study-led opening to meet the author's requested numbers-first direction; the personal publication stake follows the finding bullets. Clarified equivalent supplied information in Khan's comparisons and named Google's AI Overviews/AI Mode scope.

These reviews describe identified manuscript snapshots; this acceptance records the parent changes made in response.

## Additional publisher-analytics source

Rechecked Microsoft's February 10, 2026 [AI Performance preview announcement](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview) on September 11. It reports citations, cited pages, and sampled grounding queries across Microsoft Copilot, Bing AI summaries, and selected partners. It explicitly distinguishes appearances from ranking, authority, or placement. The article uses it as publisher-analytics prior art and distinguishes these counts from claim-support review. It is a proprietary product comparison, not another OSS sample entry or a claim that the preview has complete coverage. The current Google [AI-feature guidance](https://developers.google.com/search/docs/appearance/ai-features) was rechecked separately: indexed/snippet-eligible pages, no special AI file/schema, and no guarantee of serving.

## Discovery and transparency

- Publication role: reader-growth, with the author's publisher stake connecting it to the analytics series.
- Reader/search job: understand how open-source research agents produce citations, how to check the cited source, and what evidence makes engineering work credible.
- H1: **AI Citations: Do Agents Preserve the Evidence Behind an Answer?**
- HTML title: **AI Citations: Open Source Tools, Evidence, and Trust**.
- Description leads with OpenScholar, STORM, TruLens, and the real Codex/Claude runs. It promises findings and limits without presenting the article as a live assistant benchmark.
- Publication date stays September 10; the material rewrite uses September 11 as `lastModified`. RSS retains the original publication date.
- Nineteen complete shaping prompts remain public. The existing footprint is explicitly labeled **earlier research** and excludes this rewrite and the real CLI continuation. Its manifest remains byte-for-byte unchanged, SHA-256 `36d3e870bd4d6efae26e45af1035065f7b071934f21f907c5aa75f048657dbd0`.
- [Sharing copy](../../social/oss-radar-07-promptfoo/launch.md) now follows the broader article. It has not been posted to X or HN.

## Validation and release

Final client/Worker type checking and the production build pass; the build contains 26 posts. [Local acceptance](repro/rewrite-review/local-check.json) verifies one H1, 29 source entries in one glossary, three comparison tables, 19 exact prompt messages, date/metadata consistency, 265 relative research/task links with no broken targets, and the unchanged frozen manifest. The rendered title and narrative contain **2,667 words**, giving **14 minutes** at 200 words per minute. HTML title length is 52 characters; description length is 149.

The [viewport checks and screenshots](repro/rewrite-review/README.md) use explicit 1440×1000 and 390×844 dimensions. The hero, opening, and comparison table were visually inspected. All tables fit the desktop article width; mobile tables scroll inside their own wrappers, with no document overflow. The generated social image has the new title and was visually checked. `git diff --check` passes. The native UI connection was unavailable; a fresh local headless Chrome profile provided the preview.

The [live release receipt](ai-citations-rewrite-verification.json) records release **`4f8e39e766145bed4464fdf31c1c3d1a9a7e26e9`**. Cloudflare build **`9e29fd1f-b1c6-496c-b58c-69f4742548d5`** completed successfully at **2026-09-11T17:05:39Z**. Acceptance at **17:06:11 UTC** returned HTTP 200 for every checked surface. The complete article body, explicit Markdown, negotiated Markdown, social image, and pinned public footprint manifest match the local build/manifest exactly. All nineteen prompts match their source; the live footprint scope excludes the rewrite. CSL-JSON and the post catalog carry the new title.

The first multi-surface probe observed the earlier footprint-scope paragraph on the prompts page while the article body was already current. A fresh check and the full repeated probe returned the new scope and passed. This was a transient mixed-version observation during release checking; its cause was not diagnosed. The receipt records the fully matching result, not that initial partial state. Whole-page byte equality is unnecessary because Cloudflare may inject scripts; the complete article body is compared. The original generation scripts and code findings remain separate from publication verification.

The larger citation-frequency study and a distinct analytics engineering continuation remain open work. They are not prerequisites for publishing these completed findings and are not counted as completed by this article.
