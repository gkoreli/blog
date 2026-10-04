# Three questions, prior art, and the second editorial pass

October 3, 2026 UTC. Owner asked for three additional interesting questions answered with evidence, ideas borrowed from prior art, a stronger Hacker News title/opening, and practical plain prose. The exact request is in the [article prompt record](../../../packages/blog/prompts/chatgpt-plugin-apps.prompts.md).

## 1. What changed since the earlier ChatGPT apps?

**Answer:** interactive UI and in-conversation recommendations were already in OpenAI's October 6, 2025 announcement. The January 26, 2026 MCP Apps release made UI an official extension and reported several supporting hosts. September's extension specification describes additional ways to open the app and integrate it with the host. Calling the whole UI/discovery idea new would overstate the launch.

Evidence: [2023 plugin announcement](https://openai.com/index/chatgpt-plugins/), [2025 Apps SDK announcement](https://openai.com/index/introducing-apps-in-chatgpt/), [January MCP Apps release](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/), and [OpenAI extension spec](https://github.com/openai/mcp-extensions/blob/ca16cb3bc015baaa1b849082d8755bbef18770cb/docs/spec.md). The historical announcements establish what providers described at those dates; they do not prove current rollout or recommendation rates.

Applied revision: add the four-step history, remove the implication that all apps/UI/discovery originated in September, explain user-opened sidebar/thread/file entrypoints without a partial registration snippet.

## 2. Why install an app if the assistant can generate one?

**Answer:** a generated interface is a serious alternative for a one-time task. A maintained plugin should earn its use through data, account access, reliable editing, preserved work, or continued maintenance. The relevant test is the task and the next session, not whether an interface exists. This is an editorial judgment supported by prior-art capabilities, not measured demand.

Evidence: [Simon Willison's October 21, 2024 artifact journal](https://simonwillison.net/2024/Oct/21/claude-artifacts/) includes a QR decoder, YAML converter, and pricing calculator with artifacts/code. It is firsthand evidence of his use, not a controlled plugin comparison. [Anthropic's AI-powered artifact page](https://claude.com/blog/claude-powered-artifacts) describes generating and sharing apps whose visitor usage counts against the visitor's subscription; this is the provider's contract, not an independently measured economic result. Its historical storage/API limitations are not asserted as today's limitations.

Design choices borrowed:

- [Jupyter widgets](https://ipywidgets.readthedocs.io/en/stable/examples/Widget%20Basics.html): multiple views share one backing object. Keep claim data distinct from the visible panel and from the selected context sent to the assistant.
- [VS Code custom editors](https://code.visualstudio.com/api/extension-guides/custom-editors): document/view separation, document-change propagation, edit events with undo/redo, and saving without relying on a visible panel. Propose the same operation behind both app controls and assistant calls, with explicit undo and revision checks.
- Bits & Bolts source: conditional writes, unsaved edits preserved on conflict, and distinction between the saved request's edits and changes made while saving. Continue to label this as source inspection.

Applied revision: compare Markdown, generated UI, and a maintained plugin; extend the proposed evidence workspace and configuration editor to include undo, invalid input, changed targets, external edits, and returning to previous work. No comparison experiment was run.

## 3. How much could work in another host?

**Answer:** share product data/rules and MCP tools/UI where supported; isolate host-specific opening, files, and context behavior. A shared protocol is useful but does not guarantee compatibility for every feature. Export and a standalone interface can make the core useful independently of a host. These are proposed architecture choices.

Evidence: the [January MCP Apps release](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/) and [VS Code's dated launch](https://code.visualstudio.com/blogs/2026/01/26/mcp-apps-support) report support. `modelcontextprotocol/ext-apps` was inspected at `82221c0c8ce7661efa6771c9d461511b1650495f` (September 25 commit, package 2.0.3): [vanilla example](https://github.com/modelcontextprotocol/ext-apps/blob/82221c0c8ce7661efa6771c9d461511b1650495f/examples/basic-server-vanillajs/src/mcp-app.ts#L81-L90) calls a server tool from the UI; [App source](https://github.com/modelcontextprotocol/ext-apps/blob/82221c0c8ce7661efa6771c9d461511b1650495f/src/app.ts#L748-L769) exposes host-advertised capabilities; [hybrid-web-app guidance](https://github.com/modelcontextprotocol/ext-apps/blob/82221c0c8ce7661efa6771c9d461511b1650495f/plugins/mcp-apps/skills/convert-web-app/SKILL.md) separates shared rendering from initialization/data access. The [OpenAI SDK](https://github.com/openai/mcp-extensions/blob/ca16cb3bc015baaa1b849082d8755bbef18770cb/typescript/README.md) explicitly allows unsupported extensions to remain unavailable.

Source code and provider reports do not substitute for a cross-host run. No portability result is claimed. The viewed third-party conversion skill was read as architecture evidence; its implementation/confirmation workflow was not invoked.

## Hacker News fit

The [HN guidelines](https://news.ycombinator.com/newsguidelines.html) favor intellectual curiosity, original sources, and ordinary faithful titles. The [FAQ](https://news.ycombinator.com/newsfaq.html) describes time, votes, flags, account/site weighting, and moderation as ranking inputs. There is no basis for a guaranteed title recipe.

The November 2025 [MCP Apps discussion](https://news.ycombinator.com/item?id=46020502) contains specific objections that this article can answer: [whether the UI idea was already present](https://news.ycombinator.com/item?id=46022557), [whether generated task-specific UI is a better direction](https://news.ycombinator.com/item?id=46022551), and [platform dependence](https://news.ycombinator.com/item?id=46021960). These are selected examples from one thread, not a representative audience survey. The article answers the technical/product questions without adopting that thread's forecasts.

An Algolia read on October 3 also returned several submissions of Willison's same artifact article with the same title and very different point/comment totals ([one substantial discussion](https://news.ycombinator.com/item?id=41929174), [another submission](https://news.ycombinator.com/item?id=41913378)). That undermines attempts to attribute reception to the title alone. It is not an invitation to repost; the guidelines govern submission.

The blog's [own earlier launch notes](../../../packages/blog/drafts/research/article-024-hacker-news/02-experiments-and-article-direction.md) similarly preserve the title and inspectable evidence without claiming they caused the traffic outcome.

Title choices considered:

| Candidate | Assessment |
|---|---|
| **ChatGPT Plugin Apps: What Changed, and What I'd Build** | Selected. Names the platform, promises the actual distinction and proposed products, and fits the article without implying a live build. |
| ChatGPT Plugin Apps: Lessons from Jupyter and VS Code | More specific about prior art, but hides the generated-app alternative and launch-history answer. |
| What Becomes Worth Building Inside the Conversation? | Earlier framing is abstract and fails to tell a cold reader which capabilities are being investigated. |

The new opening starts with the inspectable camera/edit/save distinction in the CAD source. The previous opening imagined a successful product before explaining the mechanism. Retain the proposed scenario later, where its evidence and open tests are clear. The article adds original synthesis through the dated history, action trace, prior-art design choices, and task comparisons. Those make it more useful than an announcement recap; reader interest and spread remain unmeasured.

No HN submission, generated HN comment, solicitation, or automated posting is part of this work. The page title is an editorial candidate for the owner's review; actual HN submission text should be written/selected by the owner under the current guidelines.

## Prose cuts and replacements

| Before | Revision and reason |
|---|---|
| Imagined evidence-workspace success in the opening | Start with existing CAD code; move the proposed workflow to its product section. |
| Plugin-shape table plus several generic paragraphs | One short explanation tied to the claim-checking task. |
| Partial entrypoint registration JSON | Remove. It is neither a complete tutorial nor necessary to understand the opportunity. |
| “mounted interface”, “domain state”, “durable saving adds a separate boundary” | “open editor”, “the app tracks the work”, and explicit saving/version behavior. Keep API identifiers where they help inspect the code. |
| Long AgentPort comparison table and repeated ownership explanation | One contextual paragraph; the main article stays about plugins. |
| Five-stage discovery explanation, prompt taxonomy table, and audience number | Shorten to separate measurements and two concrete prompts. Remove the audience-size detour. |
| Repeated “this is a proposal / not tested” endings | One source-scope sentence at the start and specific qualifications beside provider/cross-host claims. Preserve proposed experiments as conditional. |
| Repeated concluding statements about the opportunity | End with one task, three alternatives, and the next decision. |

The second pass is shorter despite the added questions and sources. Readability improvements are editorial judgments, not reader-test results. Publication remains pending explicit approval after the prior automatic-review rejection of the main-branch push.
