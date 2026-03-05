# AGENTS.md — Blog Project Context

## Vision

A personal engineering blog at `gkoreli.com` by Goga Koreli. Built with `@nisli/core` (my own zero-dependency reactive web component framework), hosted on GitHub Pages + Cloudflare.

The blog fills a gap: there's plenty of AI hype content but very little from engineers who actually build with agents daily — the real decisions, failures, trade-offs, and workflows. This is a builder's journal, not a tutorial site.

## Problem Space

Agentic engineering is the most interesting frontier in software right now, but the content landscape is thin:
- Most "AI engineering" content is prompt tips or tool reviews
- Almost nobody writes about multi-agent delegation, context engineering, or agent-driven development workflows
- Build-in-public content about open source developer tools (MCP servers, web component frameworks) is rare and valuable
- Engineers who build their own tools AND write about them have natural credibility — the blog content and the code reinforce each other

## Content Strategy

Build-in-public approach — document the journey with specifics over polish.

**Core topics:**
- `@nisli/core` — zero-dependency reactive web component framework
- `backlog-mcp` — MCP server for AI agent task management
- Agentic engineering — delegation, context engineering, design-first workflows
- Monorepo architecture, TypeScript tooling, open source maintenance

**Distribution:**
- Publish on `gkoreli.com` first (source of truth, canonical URL)
- Cross-post to dev.to
- Share on X with `#BuildInPublic`
- LinkedIn for milestone posts

## Content Format: Markdown + YAML Frontmatter + Web Components

Posts are `.md` files with YAML frontmatter. Interactive elements use native web components directly in markdown — no MDX.

**Post format:**
```markdown
---
title: "Why I built @nisli/core"
date: 2026-03-05
description: "A zero-dependency reactive web framework in 660 lines"
tags: [nisli, web-components, framework]
---

# Why I built @nisli/core

Regular markdown prose, code blocks, images, links...

And when you need interactivity, drop in a web component:

<nisli-counter initial="0"></nisli-counter>
```

### Why not MDX?

MDX compiles markdown into JSX — it fundamentally assumes a React/Preact runtime. `@nisli/core` is a vanilla web components framework using tagged template literals, not JSX. Using MDX here would require one of:

1. Writing a custom MDX compiler that outputs web component calls instead of JSX — significant effort for no gain
2. Adding React as a dependency just for MDX processing — defeats the zero-dep philosophy
3. Using MDX at build time and stripping the React runtime — fragile and complex

None of these make sense. The blog exists to prove `@nisli/core` works standalone.

### Why markdown + web components is better for us

- **No framework mismatch** — markdown parser passes through HTML tags, browser upgrades them into live web components via `customElements.define()`. This is the native web platform way.
- **Zero extra dependencies** — no MDX compiler, no JSX transform, no React runtime
- **Same interactive power** — any `@nisli/core` component can be embedded directly in markdown as a custom element
- **Portable content** — posts are valid markdown that renders anywhere (GitHub, dev.to, any markdown viewer). MDX only renders in MDX-aware toolchains.
- **Simpler build pipeline** — parse frontmatter, convert markdown to HTML, wrap in nisli/core shell. Done.

MDX solves a React-ecosystem problem. We're in the web components ecosystem. Different world, different tools.

## Best Practices (for agents working on this project)

### How SSG Works

```
posts/001-hello-world.md          ← you write markdown
        ↓
src/build.js (Node, build-time)   ← parses frontmatter, converts md → HTML (marked),
                                     highlights code (shiki), wraps in page shell
        ↓
dist/hello-world/index.html       ← complete HTML with all content baked in
        ↓
GitHub Pages serves static files  ← browser gets pre-built HTML instantly
        ↓
@nisli/core JS loads              ← upgrades any <nisli-*> tags into interactive components
```

The markdown never reaches the browser. Content is readable without JS (SEO, crawlers, AI agents). Nisli/core adds interactivity as progressive enhancement.

### Rules

- **Markdown-first** — posts live in `posts/` as `.md` files with YAML frontmatter
- **Build script** — `src/build.js` converts markdown to HTML using `@nisli/core` components
- **Keep it simple** — no CMS, no database, no complex build chains. Markdown → HTML → deploy.
- **Dogfooding** — the blog itself proves `@nisli/core` works as a standalone npm dependency
- **Web components in posts** — for interactive elements, use `<nisli-*>` custom elements directly in markdown. No JSX, no MDX.
- **Git config** — this repo uses local git config (`Goga Koreli <gogakoreli@icloud.com>`), not the global Amazon config
- **Auth** — pushes authenticate as `gkoreli` via PAT stored in macOS Keychain

## Anti-Patterns

- Don't over-engineer the blog infrastructure — the posts are the product, not the build system
- Don't add dependencies unless absolutely necessary — the framework is zero-dep, the blog should be minimal-dep
- Don't write generic tutorials — write from direct experience building real tools
- Don't polish endlessly before publishing — ship ugly, iterate
- Don't cross-post without canonical URLs pointing back to `gkoreli.com`

## Decisions Log

Decisions made before building. Reference these — don't re-decide.

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Package manager | **pnpm** | Faster, strict deps, disk-efficient. `packageManager` field in package.json enforces it. |
| Content format | **Markdown + YAML frontmatter** | Web components ecosystem, not React. MDX requires JSX runtime — incompatible with nisli/core. See "Content Format" section. |
| Interactive elements | **Native web components in markdown** | `<nisli-*>` custom elements inline. Browser upgrades them. No build step needed for interactivity. |
| Hosting | **GitHub Pages + Cloudflare** | Free, fast, custom domain support. Cloudflare provides DNS, CDN, SSL, DDoS protection at no cost. |
| Domain | **gkoreli.com** | Matches GitHub/npm identity. `gogakoreli.com` reserved for separate project. |
| Registrar | **Cloudflare** | Wholesale pricing, free WHOIS privacy, integrated DNS. |
| License | **MIT** | Matches backlog-mcp. Blog source is public. |
| Branch | **main** | Not `mainline` (Amazon default). Set via local git config. |
| Git identity | **Goga Koreli \<gogakoreli@icloud.com\>** | Set via local git config for this repo. |
| GitHub account | **gkoreli** | Primary dev identity across GitHub and npm. |
| Rendering | **SSG (static site generation)** | Build script pre-renders markdown → complete HTML at build time. No server needed. Crawlers and AI agents get full HTML. Nisli/core hydrates interactive components client-side. See "How SSG Works" below. |
| Markdown parser | **marked** | Already used in backlog-mcp viewer. Fast, minimal, passes through raw HTML (web components survive parsing). |
| Syntax highlighting | **shiki** (build-time) | Uses TextMate grammars (same as VS Code) — pixel-perfect accuracy on edge cases (nested templates, JSX in TS). Outputs pre-highlighted HTML with inline styles — zero client-side JS shipped. highlight.js runs client-side and has coarser grammars. For a static blog, build-time highlighting is strictly better. Integrates via `marked-shiki`. |
| CSS approach | **Vanilla CSS** | Blog CSS is ~200 lines: typography, layout, code blocks, nav/footer. Tailwind would add a build step (PostCSS), config file, and 3MB dependency for no gain. Utility classes in tagged template literals are noisy. Nisli/core is zero-dep — the blog should match that philosophy. |
| Node version | **22.x** | Current LTS. Pinned in `package.json` engines and GitHub Actions. |
| Language | **TypeScript (strict)** | Latest ECMAScript standards, strict type checking, no `any`. Build script and all tooling are `.ts` files run via `tsx`. ESNext target — always tracks latest standard, no manual bumping. |
| Project structure | **pnpm monorepo** | `packages/blog` is the site. Extensible for future packages (e.g. `packages/ui` for a blog-specific component library). Same pattern as backlog-mcp. Trivial to set up now, painful to restructure later. |

## Current State

- **Repo**: https://github.com/gkoreli/blog
- **Structure**: pnpm monorepo — `packages/blog` is the site
- **Domain**: `gkoreli.com` (bought on Cloudflare)
- **Domain (reserved)**: `gogakoreli.com` (separate project later)
- **License**: MIT
- **Branch**: `main`
- **Status**: Scaffolded — monorepo structure, tsconfig, first post draft
- **Next**: Wire up `@nisli/core` rendering, GitHub Actions deploy, Cloudflare DNS

## Tech Stack

- **Framework**: `@nisli/core` (npm dependency)
- **Package manager**: pnpm (enforced via `packageManager` field)
- **Content**: Markdown + YAML frontmatter in `posts/`
- **Hosting**: GitHub Pages
- **DNS/CDN/SSL**: Cloudflare
- **CI/CD**: GitHub Actions
- **Analytics**: Plausible or Umami (TBD)

## Future Vision

- RSS feed for dev community subscribers
- Open Graph auto-generated social cards
- Email newsletter (Buttondown or Resend)
- Series/tags for organizing content by topic
- The blog becomes the public face of the `gkoreli` builder identity — connecting GitHub, npm, and writing into one coherent presence
