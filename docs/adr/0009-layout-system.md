# ADR-0009: Layout System — Rich TypeScript Posts

## Status

Accepted — 2026-03-31

## Context

The blog launched with markdown posts styled by `main.css`. The Topologies of Thoughts essay needed richer visual elements: canvas topology diagrams, a full-width hero, scroll-reveal animations, insight callouts, pull quotes, and section numbering.

The initial instinct was a separate "cinematic" layout — different shell, different fonts, different palette. This was wrong. It duplicates the page shell and fragments the design system.

The real need: expand the blog's vocabulary to support rich visual elements within the existing design system. Same shell, same fonts, same palette, same sidebar.

## Decision

### One Shell, Composable Content

There is no "cinematic mode." One `pageShell()` with slots:

- `preamble` — full-width content before the grid (e.g. cinematic hero), renders in normal document flow
- `layout` — CSS class variant (`layout-post`, `layout-immersive`) controlling sidebar behavior
- `scripts` — per-page script bundles loaded only where needed
- `gutter` — right column content (future: sticky TOC, side notes)

```html
<!-- Immersive post -->
<body>
  <div class="topo-hero">...</div>           <!-- preamble slot -->
  <div class="layout layout-immersive">       <!-- layout class -->
    <aside class="sidebar">...</aside>        <!-- nav hidden via CSS -->
    <main class="content">
      <article class="post-content">...</article>
    </main>
    <div class="gutter"></div>
  </div>
  <script type="module" src="/main.js"></script>
  <script type="module" src="/immersive.js"></script>  <!-- scripts slot -->
</body>
```

### Dual-Source Pipeline

Posts can be `.md` (prose-first) or `.ts` (rich, visual). Both go through the same pipeline and produce identical outputs: HTML page, `.md` endpoint, OG image, RSS entry, nav link, SEO files.

**Markdown posts** — YAML frontmatter, rendered through marked + shiki.

**TypeScript posts** — export `meta` (typed `PostMeta`), `article()`, and optionally `preamble()`. Same pattern as every non-markdown template in the codebase.

```ts
export const meta: PostMeta = { title, date, description, tags, layout: 'immersive', slug };
export function preamble() { return TopoHero({ kicker, title, byline }); }
export function article() { return html`<article class="post-content">...</article>`; }
```

Key difference: `.ts` posts bypass `postTemplate()` — they control their own `<article>` structure. The build pipeline passes `htmlContent` directly to `pageShell()`.

### Build-Time Component Factories

Rich elements are build-time factory functions in `src/templates/components.ts`, using the props-as-templates pattern from `@nisli/core`:

| Factory | HTML output | Purpose |
|---------|-------------|---------|
| `TopoHero({ kicker, title, byline })` | `<div class="topo-hero">` | Full-width hero with canvas |
| `SectionNum({ label })` | `<nisli-section-num>` | Monospace section kicker |
| `Insight({ label, content })` | `<nisli-insight>` | Callout card with accent border |
| `ScrollReveal({ content })` | `<nisli-scroll-reveal>` | Fade-in on scroll |
| `PullQuote({ content, cite })` | `<blockquote class="pull-quote">` | Styled blockquote with citation |
| `TopoDiagram({ mode })` | `<nisli-topo-diagram>` | Mini topology canvas |
| `SectionBreak()` | `<hr class="section-break">` | Visual separator |
| `Footnotes({ items })` | `<div class="footnotes">` | Numbered footnotes |

CSS-only components (`<nisli-insight>`, `<nisli-section-num>`) don't need JS registration — browser renders children, `components.css` styles the tag. Canvas components (`<nisli-topo-hero>`, `<nisli-topo-diagram>`, `<nisli-scroll-reveal>`) register via `@nisli/core` in the `immersive.js` bundle.

### Per-Page Script Bundles

Components are not in the global `main.js`. They ship in `immersive.js`, loaded only on immersive posts via the `scripts` slot in `pageShell()`.

```
src/client/
├── main.ts        → main.js       (theme toggle, burger menu — every page)
├── stats.ts       → stats.js      (uPlot chart — /stats only)
└── immersive.ts   → immersive.js  (topo-hero, topo-diagram, scroll-reveal — immersive posts only)
```

esbuild bundles all three as separate entry points. Pages that don't need a bundle don't load it.

### Focus Mode Sidebar

Article pages hide the sidebar nav but keep the logo, tagline, social icons, and theme toggle. CSS-only:

```css
.layout-post .sidebar-nav,
.layout-immersive .sidebar-nav { display: none; }
```

- `layout-post` — all markdown posts
- `layout-immersive` — `.ts` posts with `layout: 'immersive'`
- No class — home, about, stats (full sidebar)

### Accent Color Tokens

Three accent tokens for rich content, in both themes:

| Token | Light | Dark |
|-------|-------|------|
| `--color-accent-warm` | `#a88a2a` | `#e8c87a` |
| `--color-accent-rust` | `#b04a24` | `#c05a2e` |
| `--color-accent-blue` | `#4a7a94` | `#5b8fa8` |

Canvas components read these at runtime via `getComputedStyle()` and derive rgba variants. Both themes get correct colors without JS theme detection.

### Markdown Endpoints for Rich Posts

Every post produces a `/{slug}.md` endpoint for AI agent consumption. Markdown posts use `stripFrontmatter()`. TypeScript posts use [turndown](https://github.com/mixmark-io/turndown) with custom rules:

| Rule | Behavior |
|------|----------|
| `removeVisual` | Strip `<nisli-topo-hero>`, `<nisli-topo-diagram>`, `<canvas>` |
| `scrollReveal` | Unwrap — keep children |
| `insight` | Convert to blockquote: `> **label:** content` |
| `sectionNum` | Convert to bold: `**§ 0 — Title**` |
| `codeBlock` | Convert `.code-block` divs to fenced code blocks |

Turndown's bundled DOM parser (domino) handles custom elements natively — `querySelector`, `classList`, `nodeName` all work. No regex preprocessing needed.

### CSS Architecture

```
src/styles/
├── main.css          ← @import './components.css', tokens, layout, typography
└── components.css    ← all <nisli-*> component styles, .pull-quote, .footnotes, etc.
```

`main.css` imports `components.css` via `@import` — esbuild resolves at build time into one output file.

## Consequences

**Positive:**
- One shell, one build pipeline, two authoring formats
- Rich posts use existing design tokens — no palette drift
- Per-page bundles — regular posts pay zero JS cost for canvas components
- Turndown produces clean markdown from any HTML structure
- New components are additive — no architecture changes needed

**Negative:**
- `.ts` posts are more complex to author than markdown
- Turndown custom rules must be updated when new component types are added
- `components.css` grows with each new component type

**Trade-offs accepted:**
- `as HTMLElement` casts in turndown rules — domino provides full DOM but turndown types filter params as `Node`
- Dynamic import `as { meta, article }` for `.ts` posts — no runtime validator, type safety at the authoring boundary via `PostMeta`
