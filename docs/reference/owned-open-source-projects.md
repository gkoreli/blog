# Goga’s public projects: problem and source index

Use this index to find an implementation, recommendation or useful question for a real engineering problem. An article is one possible source; the code, package documentation or working example may be the more useful link. The [X conversation procedure](../../.agents/skills/launch-article-on-x/references/publication-verification.md#x-conversations-and-useful-outreach) owns outreach decisions and publication mechanics.

## Scope and evidence

Reviewed November 6, 2026 through the connected GitHub repository inventory and public repository reads. This snapshot covers eight public repositories owned by `gkoreli` returned by that inventory, including one fork, plus relevant packages inside them. It does not establish an exhaustive inventory of organization-owned projects. Only public repository material is included.

Descriptions below summarize repository metadata and pinned READMEs, with the Homebrew formula inspected directly. They are a discovery aid, not a new runtime test, security audit, benchmark or production acceptance. Before making a consequential current claim, read the relevant current source and its conditions. Historical evaluation or deployment statements in a README remain reports from their authors until their evidence is inspected.

| Problem or conversation | Relevant project or implementation | Useful contribution |
| --- | --- | --- |
| Initial HTML, JavaScript-dependent content, static sites, web components, Vite | [Nisli](#nisli) | The same template API can serve static output and browser interaction; show the SSG integration rather than promising SEO rankings. |
| Repeated repository exploration, agent context cost, delegation, evidence reports | [ghx](#ghx) | Batch remote reads or delegate reconnaissance with claims, citations, commands and uncertainty. |
| Agents forgetting decisions, cross-client context, local memory, task history | [backlog-mcp](#backlog-mcp) | Keep durable entities in readable Markdown and retrieve only the context needed. |
| Bring-your-own agent, website tools, session grants, app chatbots | [AgentPort](#agentport) | Lend a user-chosen agent a site-defined toolset for a scoped session. |
| Web terminals, Ghostty WASM, headless VT, React and PTY sessions | [ghostty-vt-js](#ghostty-vt-js-and-ghostty-mcp) | Reuse the terminal engine across browser and backend; distinguish parsing, rendering and session transport. |
| Controlling an existing Ghostty desktop workspace from agents | [ghostty-mcp](#ghostty-vt-js-and-ghostty-mcp) | CLI/MCP access to the macOS API with stable IDs and explicit verified/unverified mutation receipts. |
| Agent/crawler traffic, request identity, bot analytics, HTTP evidence | [Blog analytics source](#blog-and-its-reusable-implementations) | Separate client declarations, signed components, network evidence and observed resource use. |
| Robots rules, initial HTML checks, partial audit reports, before/after report comparison | [Site audit source](#blog-and-its-reusable-implementations) | Supply inspectable resource outcomes and policy decisions; keep an audit distinct from a real provider trial. |
| Installing ghx through Homebrew | [homebrew-tap](#homebrew-tap) | Link the maintained formula/install route when installation is the actual problem. |
| Repurposing Android photo frames, ADB, backups, kiosk dashboards | [photo-frame-dashboard](#photo-frame-dashboard) | Share the matching device record and verification method, preserving hardware-specific limits and upstream credit. |

## Nisli

[Repository](https://github.com/gkoreli/nisli) · MIT · [reviewed README](https://github.com/gkoreli/nisli/blob/45303135b4e1500f6edd6f93799b82e4ee22a0a9/README.md).

A reactive web-component framework with fine-grained signals, typed factories, light-DOM templates, dependency injection, routing and static generation, without a virtual DOM or framework compiler. `@nisli/core` documents no runtime dependencies. The repository also contains `@nisli/router`, `@nisli/ssg` and the source-copying `@nisli/ui` component registry.

The relevant static-site mechanism is [`buildStaticSite()` in `@nisli/ssg`](https://github.com/gkoreli/nisli/blob/45303135b4e1500f6edd6f93799b82e4ee22a0a9/packages/ssg/README.md): it accepts ordinary core templates. The README demonstrates a shared router across browser, Vite and static output, plus the `nisliHmr()` Vite plugin. Static generation uses the SSG package; installing core alone does not automatically prerender an arbitrary application.

For the practical example, [gkoreli.com’s SSG integration decision](../adr/0018-nisli-ssg-and-publication-navigation.md) records complete document assembly and progressive enhancement. The blog uses esbuild; Nisli’s Vite integration is a separate supported path. Do not describe the blog itself as Vite-built.

Useful angle: keeping article content in delivered HTML while adding native-component interaction. “Most agent-friendly,” universal speed superiority over React and better SEO outcomes are not established by this review. Describe the actual mechanism, or cite a specifically inspected comparison with its workload and conditions.

## ghx

[Repository](https://github.com/gkoreli/ghx) · MIT · [reviewed README](https://github.com/gkoreli/ghx/blob/6f267d975987c38c3f2061fd1e93ef424418cd0e/README.md).

Repository reconnaissance for agents, offered as a specialist sidecar and a standalone Go CLI/MCP tool. The sidecar returns a schema-validated report containing the answer, verified claims, source evidence, commands, uncertainty and next reads. Session files and OpenTelemetry traces make its work inspectable. The classic CLI batches GitHub operations and provides file maps, search and a codemode sandbox.

Useful angle: reduce unnecessary exploration output in the main agent’s context, or make delegation auditable. Distinguish a report passing its schema from its claims being correct. The README links both negative and confirmatory evaluation records; read the relevant run before repeating performance, token-saving or quality claims. The repository description’s approximate token-reduction figure is not a universal sidecar improvement.

## backlog-mcp

[Repository](https://github.com/gkoreli/backlog-mcp) · MIT · [reviewed README](https://github.com/gkoreli/backlog-mcp/blob/c9bf171f4647a55683e32411868995466e372ac8/README.md).

A local-first, Markdown-backed engine for agent context and memory. Tasks, decisions and memories share a store across MCP clients, a CLI and a live read-only viewer. YAML-frontmatter entities remain human-readable and diffable; substrate declarations own types/workflows, while local hybrid search and progressive disclosure support retrieval.

Useful angle: durable cross-session decisions without loading the entire work history into every prompt. The README explicitly selects the project home and documents correction lineage for memories. Do not promise that persistent storage makes every memory current or every agent recall successful. Legacy Workers/D1 hosting is retained but descoped; lead with the local path.

## AgentPort

[Repository](https://github.com/gkoreli/agentport) · Apache-2.0 · [reviewed README](https://github.com/gkoreli/agentport/blob/85ec9ec6cb49de07f11565e6284166c6257a6daa/README.md).

Bring a user’s own agent to a website. A site exposes a small toolset through `AgentPort.connect()`, and the user chooses their agent. The documented connection path prefers an installed wallet, then a separate-origin wallet popup, then a connect code. It combines session-scoped grants, a relay, pairing and tool approvals; the README positions WebMCP as a complementary tool surface.

Useful angle: site developers can supply application capabilities while the user retains their chosen agent and context. Point to the integration example or [app-builder guide](https://github.com/gkoreli/agentport/blob/85ec9ec6cb49de07f11565e6284166c6257a6daa/docs/APP-BUILDER.md) when relevant. `navigator.agent` is not a universally available browser API. The project labels itself early; refresh runtime, authentication, deployment and protocol evidence before claiming present compatibility. Its README’s release checks were not rerun for this index.

## ghostty-vt-js and ghostty-mcp

[Repository](https://github.com/gkoreli/ghostty-vt-js) · MIT with third-party notices · [reviewed README](https://github.com/gkoreli/ghostty-vt-js/blob/0aea47831f467a03b7fd33bfa0166adc80d49c32/README.md).

`@gkoreli/ghostty-vt-js` builds an interactive TypeScript web terminal on Ghostty’s public C ABI compiled to WebAssembly. It documents WebGL2 rendering with Canvas 2D fallback, headless text/HTML/ANSI export, an optional React adapter and a PTY session host. Useful angle: one terminal-state engine across frontend and backend, with the rendering and transport layers identified separately.

Credit Ghostty’s upstream engine and the README’s derived browser-code and write-queue attributions to Coder’s ghostty-web and xterm.js. This is an unofficial community project. The showcased paced workload is not a cross-library speed ranking; assess addon, accessibility and terminal-feature gaps before suggesting migration.

The same repository contains the independent [`@gkoreli/ghostty-mcp`](https://github.com/gkoreli/ghostty-vt-js/blob/0aea47831f467a03b7fd33bfa0166adc80d49c32/packages/ghostty-mcp/README.md): a CLI/MCP adapter for Ghostty’s macOS AppleScript API. It can inspect layout, read terminals, send/paste input and create or change tabs. Stable-ID tab changes report verified or unverified postconditions. Useful angle: control an existing desktop terminal rather than build a browser terminal. Screen reads use the clipboard, creation may activate the app, and split-tree geometry is unavailable; do not promise invisible control or complete workspace restoration.

## Blog and its reusable implementations

[Repository](https://github.com/gkoreli/blog) · code MIT; posts, prompts and images CC BY-NC-ND 4.0 · [reviewed README](https://github.com/gkoreli/blog/blob/a05633fe4481ea11eac2d7cf30f14af175b99dd7/README.md).

The publication itself is an inspectable Nisli/SSG and Cloudflare Workers application. It owns content discovery, metadata, feeds, citations and complete documents. Its Markdown twins, shaping prompts and operational records can be useful implementation references rather than generic article promotion.

- [`@gkoreli/analytics`](https://github.com/gkoreli/blog/blob/a05633fe4481ea11eac2d7cf30f14af175b99dd7/packages/analytics/README.md): cookieless Worker/D1 page-response analytics, preserving declarations, signature verification and other evidence separately. It is a private workspace package in a public source repository, not a verified standalone registry install. Link its source or minimal Worker example for integration questions; a request does not itself establish reading, a human trigger or citation.
- [`@gkoreli/site-audit`](https://github.com/gkoreli/blog/blob/a05633fe4481ea11eac2d7cf30f14af175b99dd7/packages/site-audit/README.md): public-page/fixed-path retrieval, robots interpretation, source HTML evidence, optional representations and explicit partial outcomes. It also provides local robots evaluation and saved-report comparison. Its checklist is not a calibrated AI-readiness/ranking score, and synthetic UA probes do not prove real provider access. The default transport contract depends on Cloudflare Workers’ public-network filtering; do not recommend dropping it into an unrestricted Node server as equivalent.

These are source-level descriptions. Present live tool availability, current production acceptance and independent adoption only when separately checked.

## homebrew-tap

[Repository](https://github.com/gkoreli/homebrew-tap) · [reviewed `ghx.rb`](https://github.com/gkoreli/homebrew-tap/blob/960e301298dea8e41f0fb69b34a111df4fce5402/ghx.rb).

A distribution repository for Goga’s tools, rather than another agent framework. The reviewed root contains one generated ghx formula with macOS/Linux architectures, release archives, hashes and bundled skills. No README or root license was found in this snapshot; do not silently assign ghx’s MIT license to every tap file. Use it when installation is the missing step, and refresh the formula before naming its current version.

## photo-frame-dashboard

[Repository](https://github.com/gkoreli/photo-frame-dashboard) · fork of [wesbos/photo-frame-dashboard](https://github.com/wesbos/photo-frame-dashboard) · [reviewed README](https://github.com/gkoreli/photo-frame-dashboard/blob/7e39fa425a25d96931d41358953e497d6a0026b3/README.md).

Device records and scripts for gaining ADB access, verified backups, root and custom launcher/browser/kiosk operation on two Android photo frames, plus a Vite family dashboard using mock data. The README distinguishes the Skylight 150-CAL/RK3566 and BIUFRAME/RK3126 units and their different routes.

Useful angle: a concrete device-specific record, including the failed-write/readback distinction and backup verification. Preserve Wes Bos’s upstream project credit. Each record covers one unit; model branding does not guarantee identical hardware or a transferable flashing recipe. No repository license was identified in the metadata, README or root listing reviewed here; resolve reuse terms before recommending copied scripts. Private firmware captures and identifiers are excluded from this index.

## Snapshot baselines

These commit IDs pin what the descriptions above read; they are not claims that the default branches remain unchanged.

| Public repository | Branch | Reviewed commit |
| --- | --- | --- |
| `gkoreli/backlog-mcp` | `main` | `c9bf171f4647a55683e32411868995466e372ac8` |
| `gkoreli/blog` | `main` | `a05633fe4481ea11eac2d7cf30f14af175b99dd7` |
| `gkoreli/ghx` | `mainline` | `6f267d975987c38c3f2061fd1e93ef424418cd0e` |
| `gkoreli/homebrew-tap` | `main` | `960e301298dea8e41f0fb69b34a111df4fce5402` |
| `gkoreli/nisli` | `main` | `45303135b4e1500f6edd6f93799b82e4ee22a0a9` |
| `gkoreli/agentport` | `main` | `85ec9ec6cb49de07f11565e6284166c6257a6daa` |
| `gkoreli/ghostty-vt-js` | `main` | `0aea47831f467a03b7fd33bfa0166adc80d49c32` |
| `gkoreli/photo-frame-dashboard` | `main` | `7e39fa425a25d96931d41358953e497d6a0026b3` |
