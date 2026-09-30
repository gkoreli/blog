# Source register

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
