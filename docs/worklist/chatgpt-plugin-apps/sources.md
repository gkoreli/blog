# Source register

## October 4 release and founder assessment

Opened October 4, 2026 UTC. [Assessment notes](release-and-founder-assessment.md) distinguish shipped artifacts, scheduled product migration, and commercial hypotheses.

| ID | Source | Role and boundary |
|---|---|---|
| R1 | [npm registry package](https://registry.npmjs.org/@openai%2Fmcp-extensions) | Confirms extension SDK `0.1.0` publication September 29, 2026. No package installation or host run. |
| R2 | [GPT overview](https://help.openai.com/en/articles/8554407-gpts-in-chatgpt) and [retirement/migration FAQ](https://help.openai.com/en/articles/20001519-custom-gpt-retirement-and-migration-faq) | Planned December 11 retirement and qualified Enterprise deferrals, account-specific availability, and migration gaps. Scheduled changes, not completed rollout. |
| R3 | [GPT Store launch](https://openai.com/index/introducing-the-gpt-store/) | Historical provider-reported creation count; does not establish adoption, later earnings, or commercial failure. |
| R4 | [App Store ten-year retrospective](https://www.apple.com/newsroom/2018/07/app-store-turns-10/) | Provider-reported cumulative developer earnings and evolution of payments/subscriptions. No typical-founder profit or ChatGPT forecast. |
| R5 | [Shopify Unite 2021](https://www.shopify.com/partners/blog/shopify-unite-announcements-2021) | Historical commercial terms and extension points; supporting comparison, not current pricing or an earnings result. |

D2, D6, and D7 were fetched again; rollout and checkout caveats remain. Access failures and differences between GPT help pages are recorded in the assessment. Private raw captures stay outside Git.

## Additional prior art for the second editorial pass

Opened October 3, 2026 UTC. [Review notes](prior-art-and-editorial-review.md) explain which claims and design choices these support.

| ID | Source | Role and boundary |
|---|---|---|
| N1 | [ChatGPT plugins](https://openai.com/index/chatgpt-plugins/) | March 23, 2023 historical backend-API integration; not current rollout guidance. |
| N2 | [Apps in ChatGPT / Apps SDK](https://openai.com/index/introducing-apps-in-chatgpt/) | October 6, 2025 announcement already describes interactive UI and app suggestions. Does not measure reach for a new listing. |
| N3 | [MCP Apps official launch](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/) | January 26, 2026 UI extension and reported multi-host support; no local compatibility test. |
| N4 | [Jupyter widget basics](https://ipywidgets.readthedocs.io/en/stable/examples/Widget%20Basics.html) | One backing object and synchronized views; ideas borrowed for app/document state. |
| N5 | [VS Code custom editors](https://code.visualstudio.com/api/extension-guides/custom-editors) | Document/view separation, edits, undo/redo, invalid state, and saving without depending on a visible webview. Its own API contract, not a ChatGPT guarantee. |
| N6 | [Willison's artifact journal](https://simonwillison.net/2024/Oct/21/claude-artifacts/) | Firsthand examples of useful generated one-time tools; not controlled evidence against plugins. |
| N7 | [Claude-powered artifacts](https://claude.com/blog/claude-powered-artifacts) | Provider description of creating/sharing apps using visitors' subscriptions. Historical limitations are not asserted as current. The original Anthropic URL redirects here. |
| N8 | [VS Code MCP Apps launch](https://code.visualstudio.com/blogs/2026/01/26/mcp-apps-support) | January 26, 2026 Insiders support at announcement; not a claim that every host/feature was tested today. |
| N9 | [MCP Apps SDK](https://github.com/modelcontextprotocol/ext-apps/tree/82221c0c8ce7661efa6771c9d461511b1650495f) | Pinned September 25 commit, package 2.0.3. Inspected vanilla app tool call, host capabilities, and hybrid-web-app guidance; no live cross-host run. |
| N10 | [Plugin authentication](https://developers.openai.com/plugins/build/auth) | Backend account and OAuth requirements remain app responsibilities. |
| N11 | [Plan-usage registration/sign-in](https://developers.openai.com/siwc/token-sharing-open-source/sign-in) | Distinguishes separately authorized inference permission from simply having a plugin interface; no sign-in performed. |
| H1 | [HN guidelines](https://news.ycombinator.com/newsguidelines.html), [FAQ](https://news.ycombinator.com/newsfaq.html), and [MCP Apps discussion](https://news.ycombinator.com/item?id=46020502) | Curiosity/title rules, ranking limits, and selected reader objections; not a representative preference survey or spread forecast. |

Additional access: Jupyter event documentation, MCP Apps overview, and Algolia story/discussion reads. They inform inspection but do not add unsupported article claims. The guessed `anthropic.com/news/artifacts` endpoint returned 404 and is excluded. Private raw captures and repositories remain under `/tmp/plugin-research/` for this session, outside Git.

## October 3 refresh

The publication article uses refreshed official pages and source commit `ca16cb3bc015baaa1b849082d8755bbef18770cb` ([repository](https://github.com/openai/mcp-extensions/tree/ca16cb3bc015baaa1b849082d8755bbef18770cb)). D1–D7 and A1 were opened directly October 3, 2026 UTC. A1 now loaded from X, superseding the earlier access gap for the announcement text. Audience and organic recommendation claims remain attributed/unmeasured. Raw page captures and the inspection checkout are private session artifacts outside Git, in `/tmp/plugin-research/` for this session; public findings are in [research.md](research.md#october-3-source-refresh-and-article-development).

G1–G6 were reinspected at the new pin. Their original September 29 perma-links below remain the historical register. The October 3 article links to the refreshed pin. The diff changes specification cross-references and issue templates; controller and server code used by the article are unchanged. The original X timestamp is displayed as September 29, 2026, 5:48 PM; no local-time conversion is asserted.

The prior clone/network gap below also describes the original pass only. This session successfully cloned the blog and extension repository after enabling the execution tool's network access, retaining the configured proxy and TLS verification.

## September 29 source register

Access date: September 29, 2026, Pacific time (September 30 UTC). Documentation dates below are access dates unless explicitly stated. They are not invented publication dates.

| ID | Source | Role and boundary |
|---|---|---|
| A1 | [Tibo’s post](https://x.com/thsottiaux/status/2104991765904375896) | Starting announcement. Direct fetch returned 403. Its text was recovered from an indexed copy at [Codex Resets](https://codexresets.net/). Attribution only; the mirror is not independent verification of the audience or rollout. |
| D1 | [Plugin architecture](https://developers.openai.com/plugins/concepts/plugins) | Package structure, MCP Apps foundation, optional UI, and shared directory. |
| D2 | [Plugin extensions](https://developers.openai.com/plugins/build/extensions) | Native host surfaces, examples, and Free/Go web rollout caveat. |
| D3 | [Quickstart](https://developers.openai.com/plugins/quickstart) | Personal MCP plugin registration and explicit Work invocation; not organic discovery. |
| D4 | [Optimize metadata](https://developers.openai.com/plugins/guides/optimize-metadata) | Tool selection and direct/indirect/negative prompt evaluation; not cross-plugin recommendation ranking. |
| D5 | [Submit and publish](https://developers.openai.com/plugins/deploy/submission) | Verification, automated checks, review, publication, and distinct package/server updates. |
| D6 | [Checkout API](https://developers.openai.com/plugins/build/monetization) | Current physical-goods approval and selected embedded-checkout beta; does not establish generic software-plugin subscriptions. |
| D7 | [User-facing plugins guide](https://learn.chatgpt.com/docs/plugins) | Supported surfaces, installation, skills/MCP composition, and surface-specific capabilities. |
| G1 | [Extension specification](https://github.com/openai/mcp-extensions/blob/e314720a0daac326217d1f123fcf51647868fa9f/docs/spec.md) | Pinned contract: platform support, entrypoints, file resources/writes, and model context. |
| G2 | [TypeScript SDK README](https://github.com/openai/mcp-extensions/blob/e314720a0daac326217d1f123fcf51647868fa9f/typescript/README.md) | Extension availability after initialization and SDK usage. |
| G3 | [TypeScript package](https://github.com/openai/mcp-extensions/blob/e314720a0daac326217d1f123fcf51647868fa9f/typescript/package.json) | Source package version `0.1.0`, Apache-2.0, MCP Apps and MCP SDK dependencies. Does not prove registry publication. |
| G4 | [Bits & Bolts README](https://github.com/openai/mcp-extensions/blob/e314720a0daac326217d1f123fcf51647868fa9f/plugins/bits-and-bolts/README.md) | Example purpose, source-build instructions, inspection controls; no live run performed. |
| G5 | [App controller](https://github.com/openai/mcp-extensions/blob/e314720a0daac326217d1f123fcf51647868fa9f/plugins/bits-and-bolts/src/app/controller.ts) | Source-inspected live tools, geometry edit state, version-checked writes, and conflict handling. |
| G6 | [Server registration](https://github.com/openai/mcp-extensions/blob/e314720a0daac326217d1f123fcf51647868fa9f/plugins/bits-and-bolts/src/server/register.ts) | Server tool/resource registration; supports distinction between backend operations and mounted-view tools. |
| P1 | [Goga’s AgentPort article](https://github.com/gkoreli/blog/blob/d80bc89919a2d87d28f6b4d6207292519b283890/packages/blog/posts/016-bring-your-own-ai-agent.md) | Author’s existing ownership position. Same authorship; not independent validation of that position. |

## Access gaps and exclusions

- Direct X access failed; no video, full reply thread, or account analytics inspected.
- A search result for `developers.openai.com/plugins/app-guidelines` appeared, but direct opens returned 404. Do not base a settled policy claim on that snippet. The draft uses the opened checkout reference and submission guide instead.
- Markdown versions of several official pages did not load in the web tool. HTML pages were opened successfully; these failures are not evidence that the feature is absent.
- Broader Sign in with ChatGPT plan usage and inference are adjacent topics left out of this first draft. A navigation label or failed guessed URL is insufficient to establish their contract.
- Git clone failed because the execution environment’s network proxy was unavailable. Repository reads and delivery use the GitHub connector. No production build was performed for these unpublished Markdown files.

## Pin

Repository: `openai/mcp-extensions`.

Inspected commit: `e314720a0daac326217d1f123fcf51647868fa9f`.

Confirmed against the repository’s `main` branch response; its tree is `13b8c527a026fc1275ae6ec8fb6bbf25a1fb64d4`. Each inspected file was requested at the commit ref; use its permalink rather than mutable `main`.
