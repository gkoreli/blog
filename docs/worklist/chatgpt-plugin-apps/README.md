# ChatGPT plugin apps: research and article

Started September 29, 2026, Pacific time. Status: article and approved process files published and verified October 4, 2026 UTC. Earlier development and approval records below remain historical.

## Read here

- [Publication article](../../../packages/blog/posts/028-chatgpt-plugin-apps.md)
- [Historical first draft](../../../packages/blog/drafts/chatgpt-plugin-apps.md)
- [Research findings](research.md)
- [Source register](sources.md)
- [Claim ledger](claims.md)
- [Three questions, prior art, and editorial review](prior-art-and-editorial-review.md)
- [Release, adoption, and founder opportunity](release-and-founder-assessment.md)
- [Complete article shaping prompts](../../../packages/blog/prompts/chatgpt-plugin-apps.prompts.md)
- [Original research requests](source.prompts.md)

## Purpose and form

Goga wants to research, explore, brainstorm, and publish because the work inspires him and may help someone else. The supplied starting point is Tibo’s September 29 post about native apps, plugin extensions, and in-conversation discovery. Treat this as an exploratory engineering article, with a research-journal basis. Do not manufacture a prior experiment, a business decision, or a settled forecast.

Central question: **What becomes worth building when an application can contribute tools and an interface inside the assistant someone already uses?**

Reader promise: explain the product surfaces, inspect a real example, separate discovery from invocation, and identify what a small experiment could resolve.

Author promise: connect the supplied curiosity and writing motive to Goga’s published AgentPort position. Suggested products and judgments in the draft are proposals for his review, not verbatim statements or accepted build commitments.

The repo’s Shape Article, Blog Writing, Earned-Trust Writing, Article Discovery and Positioning, and Polish Prose guidance govern this work. The emphasis is currently on source synthesis because no new firsthand plugin experiment exists. This is a deliberate departure from roughly equal teaching/author substance, consistent with Goga’s current request to explore while writing. Do not pad the author’s presence with invented stories.

## Completed

- Read the repository’s writing and delivery rules and existing unpublished-draft convention.
- Read official plugin architecture, extensions, invocation metadata, submission, and checkout documentation.
- Pin `openai/mcp-extensions` at `e314720a0daac326217d1f123fcf51647868fa9f`; inspect the specification, TypeScript SDK README/package, Bits & Bolts README, app controller, and server registration.
- Trace the CAD viewer’s separation of view changes, unsaved geometry edits, and version-checked saving.
- Read the existing AgentPort article for the ownership comparison.
- Write a full first draft with contextual sources and a glossary; preserve the complete visible shaping messages.

## Evidence limits and next work

No live plugin was installed, built, or tested. No model-selection eval, organic recommendation observation, user study, revenue test, or audience verification was performed. The announcement’s text came from an indexed copy because direct X retrieval failed; no quote or audience figure is treated as independently verified.

The next bounded experiment is a synthetic claim-and-source workspace: one claim list, one selected evidence passage, one correction operation, and a visible evidence status. Compare a direct request, an indirect task request, and a request the tool should not handle. Separately observe whether a new session recommends the plugin without an explicit invocation. This is proposed work; creating these notes does not authorize paid infrastructure or establish results.

Before publication: refresh rollout and commerce claims, confirm the draft’s proposed judgments with Goga’s direction, decide whether the first-pass research article is sufficient or a live example would materially improve it, and move exact shaping prompts to the canonical article prompt path. Retain the evidence boundaries even if the article publishes without an experiment.

## Positioning

Working title: **ChatGPT Plugins: What Can We Build Beyond Tool Calls?**

Reader language: building apps inside ChatGPT, plugin extensions, sidebar apps, plugin discovery. Plausible search queries are hypotheses, not measured demand. Payoff: understand what the documented interface enables and what it leaves unknown. Proposed slug: `chatgpt-plugin-apps`; section: `engineering`; tags: `chatgpt`, `mcp`, `plugins`, `product-engineering`. Set the publication date only when the article actually publishes.

Relationship: the ownership comparison links to `/bring-your-own-ai-agent`. No claim that this platform validates AgentPort, makes it obsolete, or reproduces its entire goal.

## October 3 promotion

Owner direction: develop a real article that Goga can read to learn and get excited about opportunities in the news. The full message is preserved in the [canonical prompt record](../../../packages/blog/prompts/chatgpt-plugin-apps.prompts.md).

Title: **ChatGPT Plugins: What Becomes Worth Building Inside the Conversation?** Slug: `chatgpt-plugin-apps`; publication date: October 3, 2026 UTC. Reader payoff: distinguish plugin shapes, understand operations on a mounted app, see how context and version-checked saving support useful interfaces, and evaluate two concrete product probes. Reader language and plausible queries: ChatGPT plugin apps, building apps inside ChatGPT, MCP app file editors. These are positioning hypotheses, not measured search demand.

The article develops an evidence workspace using this research's actual claim ledger and source register, then a specialist file editor. Both remain proposed experiments. Source inspection adds the distinction between server and mounted-view tools and the handling of edits made while saving. The diagram explains the interaction pattern; it is not a runtime screenshot.

The source-synthesis emphasis remains intentional: the owner's goal is learning and inspiration, and no new firsthand host experiment exists. Author presence comes from the supplied writing motive, the existing research artifacts, AgentPort's published ownership position, and clearly proposed choices. No extra personal story or success was invented to satisfy a ratio.

Official documentation and the original X announcement were fetched directly on October 3. The extension repo was checked at `ca16cb3bc015baaa1b849082d8755bbef18770cb`; changes since the original pin update specification links and issue templates, not the inspected controller behavior. The [refresh receipt](research.md#october-3-source-refresh-and-article-development) records scope and remaining limits.

### Delivery receipt

Publication checks passed October 3 using Node `24.14.1` and pnpm `9.15.4`: `pnpm -C packages/blog validate` (18 Markdown posts), `pnpm typecheck`, and `pnpm build` (29 total posts, including TypeScript). The fresh `/workspace/blog` checkout had no development server or shared build output. Generated output has exactly one article H1, canonical URL, Markdown twin, copied SVG, and a prompt page with five complete shaping messages; original three messages are preserved verbatim. Relative/internal links and Markdown fences were checked, and the SVG was rendered and visually inspected. The current page implementation requires an H1 in the Markdown body, despite the writing reference's shell-rendering statement; the article follows the verified output without changing shared instructions.

Content is committed locally at `ed98f4d` and prepared for direct `main` delivery. Automatic approval review rejected the push: it classified the default-branch update as a public release requiring explicit publication authorization beyond developing the article. A publication approval question was sent to Goga. No remote ref was updated by this attempt, and no workaround was used. Deployment activation and live HTTP acceptance remain unverified. If release occurs after October 3, update the proposed frontmatter publication date to the actual release date. No live plugin experiment, recommendation measurement, user study, revenue test, or audience verification has been performed.

Next bounded product action remains the evidence-workspace probe described above. It is not implemented or an accepted paid-infrastructure commitment.

## October 3 second editorial pass

Current title: **ChatGPT Plugin Apps: What Changed, and What I'd Build**. The article now answers three questions: what changed relative to 2023 plugins, 2025 Apps SDK, and January MCP Apps; why a maintained app must compete with an interface generated for one task; and which product/tools/UI can be shared while host integrations need checking.

[Prior-art and editorial notes](prior-art-and-editorial-review.md) record the evidence, borrowed design choices, Hacker News discussion examples, title alternatives, opening rationale, and prose cuts. Jupyter and VS Code supply document/view, undo, and saving ideas. Claude artifacts supply a serious alternative. SDK code and host reports supply a limited portability basis, not a cross-host test.

The new exact shaping message is appended to the canonical prompt file; no previous prompt was changed. The article opens with actual source behavior, omits the partial registration example, shortens the AgentPort comparison, and uses plain words for the open editor and saved changes. Source and evidence limits remain visible. Publication is still pending the earlier explicit-release approval; this revision request authorizes further writing and research, not a new main-branch attempt.

Second-pass checks passed with Node `24.14.1` and pnpm `9.15.4`: frontmatter validation (18 Markdown posts), production build and built-HTML validation (29 total posts), and `git diff --check`. Checked generated H1/title, canonical URL, prompt page, post index, image reference, internal/relative links, and original prompt preservation. Six messages now parse, with the prior five unchanged. The revised SVG was rendered and visually inspected. TypeScript/code files did not change; the earlier passing typecheck remains applicable and was not repeated. Whole-source whitespace word count changed from 3,257 to 2,843; this is an edit-size measure, not a readability result.

Article, supporting evidence, review notes, and prompt provenance are ready for a local scoped commit. The earlier main-branch publication approval is still pending. No new runtime/plugin experiment, readership result, or guaranteed Hacker News outcome is claimed.

## October 4 release and founder assessment

Goga asked whether this is hype, a real change in ChatGPT interaction, and a source of unprecedented founders or inventors. The [assessment](release-and-founder-assessment.md) adds published npm-package evidence, the current planned custom GPT retirement/migration, practical integration and access gaps, and bounded comparisons with GPT Store creation and App Store reported earnings. Rollout and checkout sources were fetched again. The article now separates a concrete developer release, scheduled product transition, plausible interaction value, and unmeasured commercial outcomes.

The existing title and three technical questions are retained. The new section adds a migration opportunity and a proposed trial that measures completed work, later use, payment interest, and costs separately. Seven complete shaping messages are preserved; the previous prompt text is byte-for-byte unchanged. No live plugin, user interview, paid service, or founder outcome is invented.

Validation passed October 4 with the pinned Node `24.14.1` and pnpm `9.15.4`: all 18 Markdown posts validate, and the site build produces 29 posts. Generated output checks confirm one H1, canonical URL, Markdown twin, copied image, the new section and scheduled dates, and the seventh prompt at the article's prompt route. Worklist relative links and Git whitespace checks pass. These are content-only changes; the earlier typecheck remains applicable. The isolated checkout has no active development server.

The revision is ready for a scoped local commit. The prior automatic approval rejection of the main-branch push remains in force pending Goga's explicit publication approval. No new push, remote ref change, deployment, or live acceptance check occurred. Before eventual publication, refresh the prepared article date and any time-sensitive migration or rollout guidance.

## October 4 authorized publication

Goga explicitly instructed: **“Please go ahead and publish it.”** This resolves the prior publication-approval blocker and authorizes pushing the prepared article to `main`, which the repository's Cloudflare Workers Git integration builds and deploys. No further approval is required for this release.

Preflight: the worktree was clean, and fetched `origin/main` remained `598ed5b`, an ancestor of the four local article commits through `9c0a84b`. No concurrent remote changes required integration. The publication date and AgentPort forward-link modification date are set to October 4, 2026 UTC.

The extension, user-guide, checkout, and dedicated GPT migration pages were fetched again October 4 before release. The article's rollout limits, physical-goods checkout scope, December 11 retirement schedule, qualified Enterprise deferrals, and custom-action/sharing migration gaps remain supported. No live plugin or market result is added. The public article route returned 404 before publication, as expected for the unreleased article. Final content checks, push, deployment, and public HTTP acceptance are recorded separately below when completed.

Final checks passed with pinned Node `24.14.1` and pnpm `9.15.4`: 18 Markdown posts validate, and the production build produces 29 posts. Generated HTML, post index, and RSS carry the October 4 publication date; the article has one H1 and its canonical URL. Its Markdown body, SVG, and prompt route are present, and the seven shaping messages remain unchanged. `git diff --check` passes. A verification-script assertion initially compared the generated Markdown endpoint to the full YAML-frontmatter source; the pipeline intentionally emits the article body plus citation metadata. Checking the body against that contract passes and required no product change.

### Initial public release and expanded approval

The shell push failed because no shell GitHub credentials were available. The connected GitHub account has write access and was used for Git blob/tree/commit creation and a non-forced `main` update. The first accepted release is [`6884d61`](https://github.com/gkoreli/blog/commit/6884d618911d3c058e220320b0f027208530a560), containing the article and illustration. Its tree exactly matched the isolated, validated two-file release. The commit uses Goga's personal Git identity.

Automatic approval review initially rejected uploading the research worklist, the AgentPort cross-link edit, and the raw prompt page as exceeding article-only publication approval. Those files were kept local, and the initial article directly credits AI collaboration. The owner then explicitly authorized those same process artifacts: **“Including this its part of the process”**, attached to the explanation naming the raw prompts, worklist, and older article edit. This expanded approval supersedes those scope blocks. No approval rejection was bypassed.

Initial live acceptance: the article, Markdown twin, SVG, `posts.json`, RSS, and sitemap returned HTTP 200 at `gkoreli.com`. HTML contains the October 4 date, one H1, canonical URL, and direct AI credit. Live Markdown and SVG bytes match the validated isolated build. The feed and index contain the new article and correct date. This verifies public content, not plugin runtime behavior or a particular Worker deployment version; the combined GitHub status endpoint returned no legacy status records.

The next release includes the canonical seven-prompt record, dated research/worklist evidence, historical draft pointer, and AgentPort forward-link edit under the expanded approval. Private raw page captures, connector payloads, and operational logs remain outside Git. Final checks and public prompt-page acceptance are recorded after that release completes.

### Complete publication receipt

Expanded process-file release: [`ccabd6e`](https://github.com/gkoreli/blog/commit/ccabd6e668d635f3e018ac15224aa68e1d916181). All nine scoped files were uploaded and the returned tree matched the isolated checked-out source. `main` advanced without force. The historical-draft pointer initially triggered a separate approval rejection; comparison with the existing public Git file proved that only a two-line supersession link was being added, with no new disclosure of draft text. That evidence and the corrected October 4 link were accepted before publication.

Final checks passed: 18 Markdown posts validate and the build produces 29 posts. The canonical prompt source preserves seven exact shaping messages. The built article exposes the normal AI collaboration link, its prompt page, and the AgentPort forward link. The draft-pointer correction affects no generated page or runtime code. No further typecheck or broad test rerun was needed for these content changes.

Public HTTP acceptance at approximately 01:51 UTC October 4: [article](https://gkoreli.com/chatgpt-plugin-apps), [seven-prompt page](https://gkoreli.com/chatgpt-plugin-apps/prompts), [Markdown twin](https://gkoreli.com/chatgpt-plugin-apps.md), SVG, post index, and AgentPort article all returned 200. The prompt page contains the seventh request and seven-prompt count; the article links to it and displays the AI collaboration label. AgentPort contains its forward link. The index has the October 4 publication date. Live Markdown and SVG still match the isolated build byte-for-byte. RSS and sitemap presence were also verified during the initial release.

The article, illustration, prompts, research notes, and related link are published. The earlier approval scope blockers are resolved. No live plugin, recommendation, retention, customer-payment, or readership experiment is implied by these publication checks. Raw operational captures remain private outside Git. The next product step is the proposed evidence-workspace trial, not unfinished publication work.
