# ADR-0007: Navigation Hierarchy + Responsive Layout

## Status

Phase 1 accepted — 2026-03-07. Sidebar nav split: page links above separator, posts below.

## Context

The sidebar nav treats About, Stats, and blog posts as equal siblings — same `<a>` styling, same list. This is misleading: utility/feature pages and blog posts are fundamentally different content types that grow at different rates. As more pages are added (Projects, Talk, Contribute), blog posts get pushed down and the nav becomes a flat soup with no hierarchy.

### Current Layout

```
gkoreli.com
"Where excitement ends..."
[GitHub] [npm] [LinkedIn] [🌙]
─── ✦ ───
About                    ← same styling as posts
Stats                    ← same styling as posts
The Agentic Product...   ← blog post
```

### Problem

1. Page links (About, Stats) and blog posts look identical — no visual hierarchy
2. Adding more pages (Projects, Talk, Contribute) pushes posts further down
3. No mobile responsive story — sidebar is unusable on small screens
4. Scales poorly beyond 3-4 total nav items

## Decision

Two-phase approach: sidebar split now, top bar when page count or mobile demands it.

### Phase 1: Sidebar Nav Split (now)

Move page links (About, Stats) above the separator as a compact nav row. Posts own everything below the separator. Page links are smaller, muted — clearly secondary to blog content.

```
gkoreli.com
"Where excitement ends..."
[GitHub] [npm] [LinkedIn] [🌙]
About · Stats              ← page nav: small, inline, muted
─── ✦ ───
The Agentic Product...     ← posts: full prominence
Post Two
Post Three
```

**Rationale**: Minimal code change. Immediately establishes hierarchy. Scales to ~5 page links. No new layout elements. Zero throwaway work — the page nav row promotes directly to a top bar in Phase 2.

### Phase 2: Top Bar + Mobile Responsive (future)

When page count exceeds ~5 or mobile responsive is built, promote the page nav row to a lightweight full-width top bar above the sidebar+content grid.

```
Desktop:  [top bar: logo · About · Stats · Projects · Talk]
          [sidebar (posts only) | content | gutter]

Mobile:   [top bar: logo · ☰]
          [content, full width]
          ☰ opens: page links + post list
```

**Rationale**: The top bar becomes the single source of truth for navigation on all screen sizes. The sidebar becomes a desktop-only enhancement for content discovery. The hamburger menu on mobile solves the "sidebar doesn't fit" problem.

**Trigger**: Build Phase 2 when one of these happens:
- More than 5 page links in the sidebar nav row
- Mobile responsive work begins
- A page like `/talk` needs prominent placement

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
