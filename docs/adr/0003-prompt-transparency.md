# ADR-0003: Prompt Transparency — Exposing Prompts Behind Blog Posts

## Status

Proposed — 2026-03-05

## Context

Each blog post is written with AI agent assistance. The author feeds the agent with raw thinking, corrections, and direction via a series of prompts. These prompts are saved in `prompts/001-*.prompts.md` as `---`-delimited blocks.

The blog's core thesis is that this is *not* AI slop — it's directed, intentional, experience-driven writing. Exposing the prompts proves that claim. The question is: how should prompts appear in the post UI?

### Constraints

- Prompts are raw, unpolished, stream-of-consciousness — that's the point
- They can be long (the current file is ~9KB, 10 prompts)
- Not every reader cares — most want the article, some want the "behind the scenes"
- Must not disrupt the reading flow of the article itself
- Blog is SSG (static HTML), client JS is minimal (`@nisli/core` hydration)
- Current post template is `<article>` with `<header>` + `<div class="post-content">`

## Proposals

### Proposal A: Inline Accordion at End of Article

A collapsible section at the bottom of every post, before the footer. Collapsed by default. Single click expands to show all prompts sequentially.

```
┌─────────────────────────────────────┐
│  [article content]                  │
│                                     │
│  ▶ Prompts behind this post (10)    │  ← collapsed <details>
│                                     │
│  footer                             │
└─────────────────────────────────────┘
```

Expanded:

```
┌─────────────────────────────────────┐
│  ▼ Prompts behind this post (10)    │
│  ┌────────────────────────────────┐ │
│  │ Prompt 1                       │ │
│  │ for the problem space, i hear  │ │
│  │ people talking about...        │ │
│  ├────────────────────────────────┤ │
│  │ Prompt 2                       │ │
│  │ capture this information...    │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Implementation**: Native `<details><summary>` — zero JS needed. Build pipeline reads `.prompts.md`, splits on `---`, renders each block in a styled container. Monospace font for prompts to visually distinguish from article prose.

**Pros**:
- Zero JS, works with SSG perfectly
- Doesn't disrupt reading flow at all
- Simple to build — just template changes + CSS
- Accessible by default (`<details>` is keyboard-navigable)
- Progressive enhancement — works without JS

**Cons**:
- All prompts load in the HTML even when collapsed (page weight)
- Flat list — no way to correlate "this prompt shaped that section"
- Easy to miss if reader doesn't scroll to bottom

---

### Proposal B: Separate Prompts Page (Linked)

Each post gets a companion page at `/{slug}/prompts`. The article has a visible link/badge near the header: "View 10 prompts behind this post →". The prompts page shows the full prompt chain with numbering and visual treatment.

```
Article page:                         Prompts page:
┌──────────────────────────┐          ┌──────────────────────────┐
│  The Agentic Product     │          │  Prompts behind:         │
│  Engineer                │          │  "The Agentic Product    │
│  Mar 5, 2026             │          │   Engineer"              │
│  🔗 10 prompts behind    │ ──────►  │                          │
│     this post            │          │  ┌─ Prompt 1 ──────────┐ │
│                          │          │  │ raw text...          │ │
│  [article content]       │          │  └──────────────────────┘ │
│                          │          │  ┌─ Prompt 2 ──────────┐ │
│                          │          │  │ raw text...          │ │
└──────────────────────────┘          └──────────────────────────┘
```

**Implementation**: Build pipeline generates an additional HTML page per post when a `.prompts.md` file exists. Post template adds a link in the header. Prompts page uses the same `pageShell` layout.

**Pros**:
- Zero page weight impact on the article itself
- Prompts page is independently linkable/shareable ("look at the prompts for this post")
- Clean separation — article is article, meta is meta
- Can evolve independently (add timestamps, annotations later)

**Cons**:
- Navigation friction — reader leaves the article to see prompts
- Two pages to maintain per post (though automated)
- Loses the "it's right here, look" immediacy

---

### Proposal C: Sticky Side Panel (Toggle)

A floating button on the article page (e.g., bottom-right corner or in the header) that slides in a side panel overlay showing prompts. The article stays visible underneath/beside it.

```
Normal:                               Panel open:
┌──────────────────────────┐          ┌────────────────┬─────────┐
│  [article content]       │          │  [article]     │ Prompts │
│                          │          │  (dimmed or    │ ┌─────┐ │
│                          │          │   narrowed)    │ │ P1  │ │
│                     [📋] │          │                │ ├─────┤ │
└──────────────────────────┘          │                │ │ P2  │ │
                                      │                │ └─────┘ │
                                      └────────────────┴─────────┘
```

**Implementation**: A `<nisli-prompt-panel>` web component. Button click toggles a fixed-position panel that slides from the right. Panel content is embedded in the HTML (like Proposal A) but hidden until toggled. Scrollable independently from the article.

**Pros**:
- Side-by-side reading — can see prompts while reading the article
- Feels interactive and modern
- Doesn't leave the page
- The floating button is a curiosity hook ("what's that?")

**Cons**:
- Requires JS (web component) — breaks the zero-JS-for-content principle
- Complex on mobile — side panel doesn't work, needs fallback (probably becomes Proposal A)
- More CSS/JS to maintain
- Overkill for what is essentially a list of text blocks

## Evaluation

| Criteria                        | A: Accordion | B: Separate Page | C: Side Panel |
|---------------------------------|:---:|:---:|:---:|
| Reading flow preserved          | ✅  | ✅  | ⚠️  |
| Zero JS                         | ✅  | ✅  | ❌  |
| Independently shareable         | ❌  | ✅  | ❌  |
| Discoverability                 | ⚠️  | ✅  | ✅  |
| Mobile experience               | ✅  | ✅  | ⚠️  |
| Implementation simplicity       | ✅  | ⚠️  | ❌  |
| Side-by-side reading            | ❌  | ❌  | ✅  |
| Page weight impact              | ⚠️  | ✅  | ⚠️  |

## Decision

**Accepted** — Proposal B + A teaser hybrid.

### Architecture

Prompts are a **first-class route**, not a widget embedded in the article.

1. **`/{slug}/prompts`** — standalone page with full prompt chain, own template, own meta tags
2. **Article teaser** — lightweight card at the bottom of the article showing prompt count + preview of the first prompt + link to the full prompts page
3. **`parsePrompts()`** — separate function from `parsePost()`, reads `prompts/{slug}.prompts.md`, splits on `---`, returns structured data

### Why this is the long-term choice

- **Independent evolution** — prompts page template evolves without touching article template
- **Shareable** — prompts page has its own URL, og:tags, meta description
- **Future-proof** — when prompt files gain metadata (timestamps, labels, section links), only the prompts template changes
- **Conditional** — no prompts file = no teaser, no route. Zero empty states
- **Composable** — side panel (Proposal C) can be layered on later as progressive enhancement, not as the foundation

### What this is NOT

- Not an accordion buried at the bottom (undersells the feature)
- Not a JS-dependent panel (violates minimal-JS principle)
- Not a coupled system (article and prompts are separate concerns with separate rendering)
