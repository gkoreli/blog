# AGENTS.md — Blog Project Context

## Vision

A personal engineering blog at `gkoreli.com` by Goga Koreli. Built with `@nisli/core` (my own zero-dependency reactive web component framework), hosted on GitHub Pages + Cloudflare.

The blog fills a gap: there's plenty of AI hype content but very little from engineers who actually build with agents daily — the real decisions, failures, trade-offs, and workflows. This is a builder's journal, not a tutorial site.

## Problem Space

Agentic engineering is the most interesting frontier in software right now, but the content landscape is noisy in the wrong ways:

- **Hype camp**: "AI will replace all developers", "I built a SaaS in 10 minutes" — no mention of the 10 hours debugging after
- **Skeptic camp**: "AI code is garbage, real engineers write their own" — dismissing the shift entirely
- **Vibe coding camp**: ship fast, quality optional, dopamine-driven — graveyard of average products

What's actually missing: honest, grounded writing about what it means to build with agents daily. The real principles — context engineering, steering agents through hard problems, knowing when to stop the agent from pivoting to easy solutions. The depth problem: agents default to naive/average solutions, and someone without engineering depth will pivot with them.

This blog exists in that gap. Builder's journal, not a tutorial site. Every post includes the raw prompts that generated it — full transparency that this is AI-assisted writing with human substance.

## Writing Process

Blog posts are AI-assisted with human substance. The workflow:

1. **Author provides golden data** — raw prompts with perspective, experience, specific problems, lessons learned
2. **Agent distills and structures** — applies the blog-writing skill (`.agents/skills/blog-writing/SKILL.md`)
3. **Iterative refinement** — author reviews, pushes back on prose, requests structural changes
4. **Every post ships with raw prompts** — full transparency, readers can see the human thinking behind the AI output

### Writing Skill (`.agents/skills/blog-writing/SKILL.md`)

Covers voice, structure, formatting balance, sourcing rules, glossary format, and quality checklist. Key principles:

- **Formatting balance** — prose for narrative/arguments, bullets for enumerable points, blockquotes (with literal `"` quotes) for strong opinion statements. Anti-pattern: walls of prose when bullets would be clearer. Anti-pattern: everything as bullets losing narrative voice.
- **Sourcing rules** — original author first (not Wikipedia or aggregators), no paywalled sources, authoritative builder blogs and company engineering blogs preferred. Glossary uses table format with dates on every source.
- **What makes a great article** — states a problem clearly, introduces novel ideas, debunks myths, showcases best practices AND anti-patterns, highlights gotchas, shares personal growth, is transparent.

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

- **No type assertions** — `as string`, `as any`, `as unknown` are banned. If types don't flow naturally, fix the source (add a Zod schema, narrow with type guards, or fix the upstream type). The only exception is `as const`.
- **Markdown-first** — posts live in `posts/` as `.md` files with YAML frontmatter
- **Build script** — `src/build.js` converts markdown to HTML using `@nisli/core` components
- **Keep it simple** — no CMS, no database, no complex build chains. Markdown → HTML → deploy.
- **Dogfooding** — the blog itself proves `@nisli/core` works as a standalone npm dependency
- **Web components in posts** — for interactive elements, use `<nisli-*>` custom elements directly in markdown. No JSX, no MDX.
- **Git config** — this repo uses local git config (personal email, not the global Amazon config)
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
| Git identity | **Goga Koreli (personal email)** | Set via local git config for this repo. |
| GitHub account | **gkoreli** | Primary dev identity across GitHub and npm. |
| Rendering | **SSG (static site generation)** | Build script pre-renders markdown → complete HTML at build time. No server needed. Crawlers and AI agents get full HTML. Nisli/core hydrates interactive components client-side. See "How SSG Works" below. |
| Markdown parser | **marked** | Already used in backlog-mcp viewer. Fast, minimal, passes through raw HTML (web components survive parsing). |
| Syntax highlighting | **shiki** (build-time) | Uses TextMate grammars (same as VS Code) — pixel-perfect accuracy on edge cases (nested templates, JSX in TS). Outputs pre-highlighted HTML with inline styles — zero client-side JS shipped. highlight.js runs client-side and has coarser grammars. For a static blog, build-time highlighting is strictly better. Integrates via `marked-shiki`. Dual themes (`github-light` + `github-dark`) rendered in a single pass using CSS variables — code blocks switch with the page theme via `[data-theme]` selector, zero JS. |
| CSS approach | **Vanilla CSS** | Blog CSS is ~200 lines: typography, layout, code blocks, nav/footer. Tailwind would add a build step (PostCSS), config file, and 3MB dependency for no gain. Utility classes in tagged template literals are noisy. Nisli/core is zero-dep — the blog should match that philosophy. |
| Frontmatter validation | **Zod** | `gray-matter` parses YAML frontmatter but returns `{ [key: string]: any }`. Zod schema validates at build time — missing `title`, `date`, or `description` fails the build with a clear error instead of silently producing broken HTML. Zero `as string` / `as any` casts in the codebase. |
| Body font | **Lora** (Google Fonts) | Literary serif designed for screens. Creates warmth and essay-like feel for long-form technical writing. Falls back to Georgia. Inspired by overreacted.io's serif approach but more contemporary than Georgia/Times. Not a newspaper font — designed for digital reading. |
| Node version | **22.x** | Current LTS. Pinned in `package.json` engines and GitHub Actions. |
| Language | **TypeScript (strict)** | Latest ECMAScript standards, strict type checking, no `any`. Build script and all tooling are `.ts` files run via `tsx`. ESNext target — always tracks latest standard, no manual bumping. |
| Project structure | **pnpm monorepo** | `packages/blog` is the site. Extensible for future packages (e.g. `packages/ui` for a blog-specific component library). Same pattern as backlog-mcp. Trivial to set up now, painful to restructure later. |
| Icons | **Cohesive SVG icon set** | Custom gradient line-art SVGs in `public/icons/`. Inspired by backlog-mcp's futuristic style — same geometric line-art approach but using the blog's green gradient (`#1a6b4e` → `#6ec9a8`). Never use emoji — always use SVG icons from the icon set. Icons: logo, sun, moon, github, npm, posts, sparkle. |
| Accent colors | **Green primary + sky blue secondary** | Primary: `#1a6b4e` / `#6ec9a8`. Secondary: `#93c5fd` (soft sky blue). Green dominates all gradients (60%+), blue is only the trailing hint. Three-stop pattern: dark green → mint → sky blue. Rationale: grass-and-clear-sky — natural, no muddy midpoints. Purple was too dominant, gold looked like spoilage, cyan was indistinguishable from green. |
| Logo | **Georgian გკ negative space** | Georgian Mkhedruli letters გ (g) and კ (k) — "Goga Koreli". Font-extracted SVG paths (Noto Sans Georgian Bold via opentype.js) masked out of a gradient rounded square. Letters sit at the bottom like TypeScript's logo. Same file serves as sidebar logo and SVG favicon. Georgian script is distinctive in tech — nobody else uses it. |
| CI/CD | **GitHub Actions → GitHub Pages** | Push to `main` triggers build + deploy. No versioning (not a library). No preview deploys (single author, use `pnpm dev` locally). Concurrency cancels in-progress deploys. |
| OG images | **satori + @resvg/resvg-js (build-time)** | Per-post 1200×630 PNG. Dark gradient background, centered layout with logo, sparkle separator, post title, tagline. Lora Bold font loaded from `public/fonts/`. Both are devDependencies (build-time only). |
| 404 handling | **`public/404.html` → redirect to `/`** | GitHub Pages serves `404.html` for unknown routes. Meta refresh redirects to home instantly. |
| Custom domain | **gkoreli.com via Cloudflare** | A records (4× GitHub Pages IPs) + CNAME for www. Cloudflare proxy enabled with SSL mode Full. `CNAME` file in `public/` so GitHub Pages remembers the domain across deploys. |

## Design Philosophy

Researched and decided 2026-03-05. Reference these — don't re-decide.

**Inspiration sources:** shiki.style (sidebar nav, code-first), antfu.me (restraint, whitespace), overreacted.io (literary serif warmth), knifecoat.com (sidebar, code prominence, terminal aesthetic), joshwcomeau.com (code blocks as primary content).

### Layout
- **Sidebar navigation stays** — meaningful for a technical blog with structured content. Inspired by shiki.style and knifecoat.com. Not every blog needs to be single-column.
- **3-column CSS grid** — sidebar | content (800px) | gutter. Content always centered, sidebar right-aligned within its column (close to content, not pinned to edge). Gutter is empty, exists for symmetric centering.
- **Code blocks get visual priority** — they're the primary content. Generous padding, full-width within the content column, prominent but not overwhelming.
- **Tagline** — "Where excitement ends, depth begins." in the sidebar. Captures the philosophy: the real work starts after the dopamine of new ideas fades.
- **Pages** — `/about` page with full bio, projects, and connect links. Home page has hero (name, projects grid, brief about) + post list separated by sparkle.

### Typography
- **Lora serif for body** — loaded from Google Fonts, falls back to Georgia. Designed for screens, not print — warmer and more contemporary than Georgia (which looks like a newspaper). Inspired by overreacted.io's literary feel.
- **Monospace for code only** — SF Mono / Fira Code. Code should feel distinct from prose.
- **Generous line-height** (1.7+) for body text, tighter for headings.

### Color
- **Light theme default** — warm cream tones (`#faf8f5` bg), not pure white. Easier on eyes for long reading sessions. Inspired by joshwcomeau.com's warm palette.
- **Dark theme** — warm dark gray (`#1a1a1a`), not blue-black. Muted text, green accent. Designed separately, not just inverted.
- **Primary accent** — muted green (`#1a6b4e` dark / `#6ec9a8` light). Earthy, calm, distinct from the typical blue link. Used for links, icon strokes, and as the dominant gradient color.
- **Secondary accent** — soft sky blue (`#93c5fd`). Grass-and-clear-sky pairing with green. Only appears as the trailing end of gradients — green always dominates (60%+ of gradient). Never used standalone; exists to give gradients a visible color shift without competing with green. Three-stop gradient pattern: `#1a6b4e` → `#6ec9a8` (60%) → `#93c5fd` (100%).
- **Low contrast intentionally** — text is dark but not black (`#2d2a24`), muted text is warm (`#7a7568`). Comfortable for extended reading.

### Code Blocks (Shiki)
- **Dual themes in one render** — shiki outputs both `github-light` and `github-dark` token colors as CSS variables in a single HTML pass. `defaultColor: false` means no inline colors — everything controlled via `[data-theme]` CSS selectors.
- **Zero JS for code theme switching** — the theme toggle sets `data-theme` on `<html>`, CSS selectors activate the right shiki variables. No re-rendering, no client-side highlighting.
- **Why this matters** — code blocks are the most visually complex element on the page. Getting them right in both themes with zero runtime cost is a significant UX win.

### Interactive Components
- **Islands architecture** — SSG renders the full page shell and content at build time. `@nisli/core` web components handle interactive islands (theme toggle, future interactive demos).
- **Progressive enhancement** — page is fully readable without JS. Components upgrade when JS loads.
- **`<nisli-*>` components in markdown** — drop custom elements directly into posts for interactive demos. Browser upgrades them natively.

### Sidebar UI
- **Icon buttons** — individual bordered 32×32px buttons with SVG icons. Same visual treatment as theme toggle.
- **Two-button theme toggle** — sun and moon side by side in a joined pill. Active button gets `background: var(--color-surface)` + full opacity. Inactive is dimmed. Immediately obvious which mode is active.
- **Sparkle separator** — gradient line with sparkle SVG icon in center (inspired by backlog-mcp's epic-separator). Separates icon buttons from post navigation. Uses the three-stop gradient.
- **Tags as `#hashtags`** — no pills or badges. Tags render as `#tag-name` with the `#` using gradient text (`background-clip: text`). Muted, developer-native, doesn't compete with content. Inspired by antfu.me and overreacted.io treating metadata minimally.

### Build Pipeline
- **Four-step build** — `cleanDist()` → `copyStaticAssets()` → `buildHTML()` → `bundleClient()`. Each step is independent with clear ordering. Prod uses all four, dev uses steps 2+3 only.
- **esbuild handles all assets** — JS and CSS are esbuild entry points with `entryNames: '[name]'` to flatten output. HTML references `/main.js` and `/main.css`.
- **RSS feed** — generated at build time from post metadata. Zero dependencies — hand-rolled XML template. Autodiscovery `<link>` in `<head>` so readers and agents find it automatically.
- **Semantic HTML** — `<article>`, `<time>`, `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`. Agents can identify main content vs navigation without heuristics.
- **AI agent access** — `llms.txt` (content directory for AI agents), `robots.txt` (allow all), pre-rendered HTML (full content without JS), RSS feed (`/feed.xml`).
- **External links** — all external links open in new tabs (`target="_blank" rel="noopener"`). Markdown renderer auto-detects external vs internal links. Internal links (`/about`, `/hello-world`) stay in same tab.
- **Dev server** — browser-sync serves `dist/` with WebSocket-based live reload. `bs.watch()` (chokidar) watches `src/` and `posts/` for changes. HTML rebuilt via subprocess (`tsx build-html.ts`) to avoid Node module cache. esbuild context handles JS/CSS bundling.
- **Never run `pnpm build` while `pnpm dev` is running** — esbuild's context holds the dist directory. Production build would nuke it.

### Anti-Patterns (Design)
- Don't use pure white (`#ffffff`) or pure black (`#000000`) — always warm/muted
- Don't use sans-serif for body text — the literary serif is a deliberate identity choice
- Don't remove the sidebar to "simplify" — it's a navigation pattern that scales with content
- Don't add animations or transitions unless they serve comprehension (not decoration)
- Don't use different fonts for light vs dark — same typography, different palette
- Don't use emoji for UI elements — always use SVG icons from `public/icons/`. Emoji render inconsistently across platforms and break the cohesive visual identity. The icon set uses gradient line-art matching the blog's color palette.

## Current State

- **Repo**: https://github.com/gkoreli/blog
- **Structure**: pnpm monorepo — `packages/blog` is the site
- **Domain**: `gkoreli.com` (bought on Cloudflare)
- **Domain (reserved)**: `gogakoreli.com` (separate project later)
- **License**: MIT
- **Branch**: `main`
- **Status**: Live at gkoreli.com — design system complete, first post published, CI/CD active
- **Done**: SSG pipeline, shiki dual themes, theme toggle, sidebar nav, SVG icon set, Georgian გკ logo/favicon, Zod frontmatter validation, warm cream/dark palette, Lora serif typography, GitHub Actions deploy, Cloudflare DNS, RSS feed, llms.txt, OG image generation (satori + resvg), about page, 404 redirect, blog-writing agent skill
- **Next**: Mobile responsive (sidebar collapse), proofread and publish first post, write more content, @nisli/core SSR (TASK-0477)

## Tech Stack

- **Framework**: `@nisli/core` (npm dependency)
- **Package manager**: pnpm (enforced via `packageManager` field)
- **Content**: Markdown + YAML frontmatter in `posts/`
- **Hosting**: GitHub Pages
- **DNS/CDN/SSL**: Cloudflare
- **CI/CD**: GitHub Actions
- **Analytics**: Plausible or Umami (TBD)

## Future Vision

- Email newsletter (Buttondown or Resend)
- Series/tags for organizing content by topic
- Prompt archive — each post's raw prompts published alongside the polished article
- Mobile responsive — sidebar collapses on small screens
- The blog becomes the public face of the `gkoreli` builder identity — connecting GitHub, npm, and writing into one coherent presence
