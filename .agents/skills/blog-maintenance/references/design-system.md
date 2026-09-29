# Design System and Interface Conventions

Read for layout, typography, colors, icons, code presentation, or interactive interface changes. [ADR-0007](../../../../docs/adr/0007-navigation-and-layout.md), [ADR-0009](../../../../docs/adr/0009-layout-system.md), and [publication visuals](../../../../docs/adr/0013.1-publication-visual-layer.md) retain the decision history. Preserve the September 11 amendment keeping sidebar navigation on article pages.

## Design Philosophy

The original design was researched on 2026-03-05. The maintained notes below include later publication changes and source-backed corrections from 2026-09-28; they are not a claim that the March design is unchanged. Current values live in [shared design tokens](../../../../packages/design/tokens.css), [layout CSS](../../../../packages/blog/src/styles/layout.css), and the [page shell](../../../../packages/blog/src/templates/page.ts).

**Inspiration sources:** shiki.style (sidebar nav, code-first), antfu.me (restraint, whitespace), overreacted.io (literary serif warmth), knifecoat.com (sidebar, code prominence, terminal aesthetic), joshwcomeau.com (code blocks as primary content).

### Layout
- **Sidebar navigation stays** — meaningful for a technical blog with structured content. Inspired by shiki.style and knifecoat.com. Not every blog needs to be single-column.
- **3-column CSS grid** — `1fr minmax(0, var(--content-max)) 1fr`. Content always centered, sidebar right-aligned within its column. Gutter mirrors sidebar for symmetric centering. `minmax` lets content shrink on narrow viewports — no horizontal scroll.
- **Sidebar sizes to content** — no fixed width. Sits inside `.sidebar-wrapper` with `justify-content: flex-end`. The current sticky sidebar uses `gap: 0` with spacing in its sections; the earlier `gap: 1rem` description is superseded.
- **Sidebar HTML zones** — `sidebar-bar` (logo + burger), `sidebar-social` (icon buttons), `sidebar-nav` (sections + separator). Clean separation for responsive behavior.
- **The sidebar is the same on every page** — including articles. There is no article-specific navigation state. Posts pass `currentSection`, so an article lights its own section. Focus mode (articles hiding `.sidebar-nav`) was superseded 2026-09-11: it left readers who arrive on an article with no door to the rest of the publication, and section structure lives in the sidebar. See the amendment in ADR-0009.
- **Shell breakpoint (768px)** — the main grid/sidebar structural change. Other page and component styles have their own media queries; this is not a repository-wide one-query limit. Grid goes single-column, sidebar becomes horizontal header bar with burger menu. Everything else is intrinsic: `auto-fit` grids, `flex-wrap`, `minmax`.
- **`<nisli-burger-menu>` web component** — toggles full-screen overlay on mobile. Same `@nisli/core` pattern as theme toggle. Escape to close, body scroll locked, `aria-expanded`.
- **Code blocks get visual priority** — they're the primary content. Generous padding, full-width within the content column, prominent but not overwhelming.
- **Tagline** — "Where excitement ends, depth begins." in the sidebar. Captures the philosophy: the real work starts after the dopamine of new ideas fades.
- **Pages** — `/about` page with full bio, projects, and connect links. The [home page](../../../../packages/blog/src/pages/home.ts) now shows a featured cover story and a latest-post stream separated by sparkle. The name/projects/bio hero belongs to the older homepage design.

### Typography
- **Lora serif for body** — loaded from Google Fonts, falls back to Georgia. Designed for screens, not print — warmer and more contemporary than Georgia (which looks like a newspaper). Inspired by overreacted.io's literary feel.
- **Monospace for code and compact UI metadata** — SF Mono / Fira Code. Body prose remains Lora; navigation categories, project links, and small publication labels also use monospace in the current design.
- **Generous line-height** (1.7+) for body text, tighter for headings.

### Color
- **Light palette and theme selection** — warm cream tones (`#faf8f5` bg), not pure white. Light is the base CSS palette; the shell selects a saved preference or the operating system’s dark preference before rendering, rather than forcing light for every new reader. Easier on eyes for long reading sessions. Inspired by joshwcomeau.com's warm palette.
- **Dark theme** — warm dark gray (`#1a1a1a`), not blue-black. Muted text, green accent. Designed separately, not just inverted.
- **Primary accent** — muted green (`#1a6b4e` in the light theme / `#6ec9a8` in the dark theme). Earthy, calm, distinct from the typical blue link. Used for links, icon strokes, and as the dominant gradient color.
- **Secondary accent** — soft sky blue (`#93c5fd`). Grass-and-clear-sky pairing with green. Only appears as the trailing end of gradients — green always dominates (60%+ of gradient). Never used standalone; exists to give gradients a visible color shift without competing with green. Three-stop gradient pattern: `#1a6b4e` → `#6ec9a8` (60%) → `#93c5fd` (100%).
- **Warm text colors** — light-theme text is dark but not black (`#2d2a24`), and muted text is warm (`#7a7568`). Preserve the restrained palette without treating “low contrast” as a requirement or a verified accessibility result.

The publication also has section accents: warm gold for Essays, blueprint blue for Engineering, and rust for OSS Radar. These named tokens are distinct from the sky-blue end of the brand gradient; the original green/sky brand rule does not prohibit section identity colors. See [ADR-0013.1](../../../../docs/adr/0013.1-publication-visual-layer.md).

### Code Blocks (Shiki)
- **Dual themes in one render** — shiki outputs both `github-light` and `github-dark` token colors as CSS variables in a single HTML pass. `defaultColor: false` emits theme colors as inline CSS variables rather than a single default foreground; `[data-theme]` CSS selectors choose which variables to use.
- **Zero JS for code theme switching** — the theme toggle sets `data-theme` on `<html>`, CSS selectors activate the right shiki variables. No re-rendering, no client-side highlighting.
- **Why this matters** — code blocks are the most visually complex element on the page. Getting them right in both themes with zero runtime cost is a significant UX win.

### Interactive Components
- **Islands architecture** — SSG renders the full page shell and content at build time. `@nisli/core` web components handle interactive islands (theme toggle, future interactive demos).
- **Progressive enhancement** — page is fully readable without JS. Components upgrade when JS loads.
- **`<nisli-*>` components in markdown** — drop custom elements directly into posts for interactive demos. Browser upgrades them natively.

### Sidebar UI
- **Icon buttons** — individual bordered 28×28px buttons (the earlier design used 32×32px) with SVG icons. Same visual treatment as theme toggle.
- **Two-button theme toggle** — sun and moon side by side in a joined pill. The active button is fully opaque over a sliding thumb; inactive buttons are dimmed. [theme-toggle.css](../../../../packages/blog/src/styles/theme-toggle.css) owns the current dimensions and treatment. Immediately obvious which mode is active.
- **Sparkle separator** — gradient line with sparkle SVG icon in center (inspired by backlog-mcp's epic-separator). Used between publication content areas, including the homepage cover and stream. The sidebar uses its own section separator; the earlier icon-to-post-navigation placement is historical. Uses the three-stop gradient.
- **Tags as `#hashtags`** — no pills or badges. Tags render as `#tag-name` with the `#` using gradient text (`background-clip: text`). Muted, developer-native, doesn't compete with content. Inspired by antfu.me and overreacted.io treating metadata minimally.

### Anti-Patterns (Design)
- Don't use pure white (`#ffffff`) or pure black (`#000000`) — always warm/muted
- Don't use sans-serif for body text — the literary serif is a deliberate identity choice
- Don't remove the sidebar to "simplify" — it's a navigation pattern that scales with content
- Don't hide the sidebar nav on article pages — the shell is stable across pages; a reader mid-article must always be one click from a section (ADR-0009 amendment, 2026-09-11)
- Don't add animations or transitions unless they serve comprehension (not decoration)
- Don't use different fonts for light vs dark — same typography, different palette
- Don't use emoji for UI elements — always use SVG icons from `public/icons/`. Emoji render inconsistently across platforms and break the cohesive visual identity. The icon set uses gradient line-art matching the blog's color palette.
