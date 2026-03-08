# ADR-0007: Navigation Hierarchy + Responsive Layout

## Status

Accepted — 2026-03-07. Navigation hierarchy, responsive layout, burger menu.

## Context

The sidebar nav treated About, Stats, and blog posts as equal siblings. No visual hierarchy, no responsive story — sidebar was hidden on mobile losing all navigation. Layout shift: sidebar width varied by content (283px vs 285px across pages).

## Decision

### Navigation Hierarchy

Two `sidebar-section` navs with identical link styling. The sparkle separator is the only visual divider — no labels, no icons, no special treatment. Pages above, posts below.

```
gkoreli.com
"Where excitement ends..."
[GitHub] [npm] [LinkedIn] [🌙]
About                      ← sidebar-section (pages)
Stats
─── ✦ ───                  ← sparkle separator
The Agentic Product...     ← sidebar-section (posts)
```

Adding a new page = one `<a>` tag. Same link styling, zero per-section CSS.

### Sidebar HTML Structure

Split into three zones for clean responsive behavior:

```html
<aside class="sidebar">           <!-- flex column, gap: 1rem -->
  <div class="sidebar-bar">       <!-- logo + burger (row on mobile) -->
  <div class="sidebar-social">    <!-- icon buttons (hidden on mobile, shown in overlay) -->
  <div class="sidebar-nav">       <!-- sections + separator (hidden on mobile, shown in overlay) -->
</aside>
```

The bar is always horizontal on mobile. Social and nav toggle independently via the burger.

### Layout: Intrinsic Grid

```css
grid-template-columns: 1fr minmax(0, var(--content-max)) 1fr;
```

- Content centered via symmetric `1fr` columns (sidebar left, gutter right)
- `minmax(0, 800px)` — content shrinks on narrow viewports, no horizontal scroll
- Sidebar sizes to its content (no fixed width) inside `.sidebar-wrapper` with `justify-content: flex-end`
- Sidebar spacing: single `gap: 1rem` on parent — no individual margins

### Layout Shift Fix

`.sidebar-wrapper` fills the full `1fr` grid column. Sidebar aligns right inside it. Wrapper width is grid-determined, not content-dependent.

### Responsive: One Media Query + Intrinsic Layouts

**Single media query at 768px** — the only structural layout change:
- Grid switches to single column
- Sidebar becomes horizontal header bar (logo + burger)
- Social + nav hidden until burger opens full-screen overlay
- Body scroll locked when overlay is open

**Everything else is intrinsic** — no media queries:
- Projects: `repeat(auto-fit, minmax(200px, 1fr))` — reflows 3→2→1
- Stats totals: `flex-wrap` with `flex: 1 1 150px` — reflows naturally
- Sidebar bar: `flex-wrap: wrap` — wraps on narrow screens

**Resilience principle**: New code doesn't break responsiveness because:
- Content goes in `.content` — grid handles width
- Page links go in `sidebar-section` — one `<a>` tag
- `--content-max` constrains width; `minmax` handles shrinking
- No component knows what breakpoint it's in

### Burger Menu: `<nisli-burger-menu>`

Web component built with `@nisli/core` — same pattern as `<nisli-theme-toggle>`.

- Hidden on desktop (`display: none`), shown on mobile (`display: block; margin-left: auto`)
- Toggles `body.menu-open` class — CSS controls the overlay
- Full-screen overlay: sidebar becomes `position: fixed; inset: 0`
- Bar stays in place, social + nav appear below it
- Escape key to close, body scroll locked when open
- Icon swaps between menu/close via `computed()` signal binding
- ~20 lines of component code

**Why web component**: Encapsulated state, consistent with theme toggle, accessibility built in (`aria-expanded`), no global script hacks.

### Future: Hamburger Enhancements

When page count exceeds ~5: focus trap, click-outside-to-close, slide animation.

## Constraints

- Static HTML from `@nisli/core` build pipeline (no client-side routing)
- CSS custom properties for theming (`--color-*`)
- Dark/light mode via `data-theme` attribute
- Current layout: `.layout` CSS grid with `sidebar | content | gutter`
- Per-page bundle isolation remains non-negotiable

## Future Pages (captured for planning, not committed)

Pages that are likely based on current trajectory:

| Page | Purpose | Agent counterpart |
|------|---------|-------------------|
| `/projects` | In-depth project pages (backlog-mcp, @nisli/core, blog) — deeper than homepage cards | `/projects.json` |
| `/prompts` | Standalone browsable prompt library — currently per-post only | Already exists: `/{slug}/prompts` |
| `/talk` | Conversational interface to the blog's body of work. Not a generic chatbot — grounded in posts, ADRs, prompts as context | Same endpoint accepts API calls from other agents |
| `/contribute` | Structured way to engage with ideas before they become posts. Open questions, weigh in. More active than GitHub issues | Structured JSON for agent consumption |
| `/uses` | Stack and tools with rationale | Markdown endpoint |
| `/changelog` | Public changelog of the site itself — on-brand for transparency. ADRs + git history already exist | Already exists: git log |

### Human-and-Agent First Principle

Every page has a dual interface:
- **Human layer**: HTML with visual design, navigation, interactivity
- **Agent layer**: structured endpoints (`.md`, `.json`, API) for programmatic access

This pattern is already established: posts have HTML + `.md` endpoints, stats has dashboard + `/api/stats`, discoverability has HTML + `llms.txt` + `sitemap.xml`. Navigation design (top bar, sidebar) is purely the human discovery layer. Agent discovery is `llms.txt` + structured endpoints — a separate, already-solved layer.

### The "Talk to the Blog" Idea

Not a naive chatbot. A conversational interface where the context is the author's actual body of work — posts, ADRs, raw prompts, decision rationale. Visitors ask questions and get answers grounded in real thinking, not generic AI responses. The markdown endpoints and `llms-full.txt` already provide the context corpus. This is the kind of page that justifies the "this is 2026" framing — agents as first-class participants in the blog experience, not just consumers of RSS feeds.
