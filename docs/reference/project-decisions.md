# Project Decisions

Consult the relevant ADR before changing an established choice. Implementation files provide current values; tasks and dated handoffs provide deployment and acceptance evidence.

## Architecture

| Concern | Decision and reason | Reference |
|---|---|---|
| Framework | `@nisli/core` as a standalone dependency; readable HTML with interactive web components | [Architecture](../adr/0001-blog-architecture.md) |
| Content | Markdown and YAML frontmatter for prose; TypeScript tagged templates for custom layouts | [Static templates](../adr/0002-nisli-static.md), [rich posts](../adr/0009-layout-system.md) |
| Rendering | Build-time HTML, Markdown and citation representations; client code enhances complete content | [Generated representations](../adr/0006-ai-readable-blog.md) |
| Hosting | Cloudflare Workers static assets and server APIs, with the shared `blog-analytics` D1 binding | [Worker configuration](../../wrangler.jsonc) |
| Analytics | Edge observations with source-marked legacy continuity, pseudonymous daily clients, and request-based reader categories | [Observation semantics](../adr/0016-analytics-observation-semantics.md), [composition](../adr/0016.3-audience-composition-and-citable-articles.md) |
| Analytics purpose | Inform a publication decision; add a metric only when it can change that decision | [Decision loop](../adr/0016.1-analytics-purpose-and-decision-loop.md) |
| Referral policy | Versioned, reviewable treatment of referrer evidence and abuse | [Referral policy](../adr/0016.6-versioned-referral-policy-and-matomo-source.md) |
| Report cost | Meter complete reports and preserve the versioned cache contract | [Read budget](../adr/0016.7-budget-d1-reads-and-cache-public-reports.md) |
| Newsletter | D1 state, Resend delivery, and Turnstile protection | [Subscriptions](../adr/0010-email-subscriptions.md) |
| Diagnostics | Shared client-error reporting with explicit data and operational limits | [Observability](../adr/0011-client-error-observability.md) |
| Prompts | Separate prompt pages linked from the article header and teaser | [Prompt transparency](../adr/0003-prompt-transparency.md) |
| Design | Shared navigation and typography; custom article layouts where useful | [Navigation](../adr/0007-navigation-and-layout.md), [layout](../adr/0009-layout-system.md), [visual system](../adr/0013.1-publication-visual-layer.md) |

## Implementation conventions

- Use pnpm and the Node version in [the runtime pin](../../.mise.toml); [package.json](../../package.json) defines the supported major version.
- Use strict TypeScript, marked for Markdown, Shiki for build-time code highlighting, Zod for Markdown frontmatter, esbuild for bundles, and vanilla CSS. TypeScript targets ESNext; browser bundles target es2024.
- [The production build](../../packages/blog/src/pipeline/prod.ts) validates generated HTML. The standalone Markdown validator fails on invalid frontmatter; it does not validate TypeScript post exports.
- [OG generation](../../packages/blog/src/lib/og.ts) uses satori and resvg for 1200×600 PNGs with local Lora fonts.
- Unknown routes serve [the 404 page](../../packages/blog/public/404.html) with navigation links. Preserve `not_found_handling: "404-page"`, `html_handling: "drop-trailing-slash"`, and `run_worker_first: true` unless the routing decision changes.
- Cloudflare Git integration builds and deploys pushes to `main`. Confirm activation and behavior separately when reporting a release.
- Source code is MIT; content is CC BY-NC-ND 4.0 under [LICENSE](../../LICENSE).
- The public identity is `gkoreli` on GitHub/npm and `gkoreli.com` on Cloudflare. `gogakoreli.com` is reserved for a separate project. Use the personal repository Git identity.

## Analytics invariants

Retain method boundaries and source provenance when classifications change. Public labels describe request evidence, not a claim to identify a human. Reader groups must remain disjoint and add up to All; use `READER_GROUPS` and the stored `reader_kind` contract. Preserve documented legacy evidence levels rather than deleting history.

Do not add AS13335, AS36183, AS20940, AS54113, or AS15169 to the hosting-ASN list. Follow the network-evidence ADRs before modifying classification. Do not store raw IP or User-Agent in edge observations. Keep audience measurement, crawler access, and abuse protection distinct.

## Visual identity

Use the Georgian გკ logo and SVG icon set in `packages/blog/public/icons/`. The logo uses Georgian letterforms cut out of a green-gradient square and also serves as the favicon. Use the established green/sky brand gradient and section accent tokens; see the [design reference](../../.agents/skills/blog-maintenance/references/design-system.md) for values and layout rules.
