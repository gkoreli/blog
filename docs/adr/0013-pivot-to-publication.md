# ADR-0013: Pivot to Publication — Four Sections, Stable Shell, Expressive Interior

## Status

Proposed — 2026-04-19

## Context

The site started as a minimal engineering blog (think overreacted.io) — one flat feed, one sidebar listing all posts chronologically. That model cracked fast.

Seven posts in and we have three distinct voices already present: personal essays (procrastination), OSS analysis (OSS Radar issues), and engineering deep-dives (ghx, ghx, codemap, topologies). A photography section (Frames) is pending. These are not the same kind of content. A reader who follows the essays does not expect to land on a GitHub CLI architecture piece next. A reader who subscribes for OSS Radar is confused by a procrastination reflection.

The site is also not a stripped-down engineering notebook anymore. There are custom preamble animations per post, glass panels, interactive canvas components, a neural network visualisation, a topology diagram — each post is already treated as a distinct art object. The content model needs to catch up to the reality of what is actually being published.

The problem is not too much ambition. The problem is that the current information architecture has **one visual treatment for every form of content and one flat feed for all of it**. That makes abundance feel accidental rather than curated.

The metaphor that fits: a personal publication with sections. Not a blog with categories. Not a CMS with taxonomy. Sections — like a newspaper or a magazine. Each section has editorial identity. The publication shell (sidebar, navigation, section labels, archive logic) stays stable. The post body stays free.

### What is wrong with the current structure

| Layer | Problem |
|-------|---------|
| **Sidebar** | Lists all posts flat — it is a second content feed, not a nav rail |
| **Homepage** | One mixed chronological stream — no sectioning, no editorial orientation |
| **PostMeta** | No `section` field — content has no primary identity anchor |
| **Routes** | No section archive pages — each section has no home of its own |
| **Post pages** | No section label shown — reader cannot tell what kind of piece they are reading |
| **Frames** | Section does not exist yet — no photo journal, no image-first layout |

### The four sections

| Section | Voice | Format |
|---------|-------|--------|
| **Essays** | Reflective, personal, slow | Long-form prose, minimal structure, spacious |
| **Engineering** | Technical, builder-mode, precise | Code, diagrams, structured, methodology-heavy |
| **OSS Radar** | Curatorial, analytical | Serialised issues with consistent structure |
| **Frames** | Visual, experiential, present-tense | Image-first, captions, minimal text |

---

## Decision

### 1. Add `section` to `PostMeta` as a required first-class field

```typescript
// src/lib/frontmatter.ts
const sectionSchema = z.enum(['essays', 'engineering', 'oss-radar', 'frames']);
export type Section = z.infer<typeof sectionSchema>;

const frontmatterSchema = z.object({
  title: z.string(),
  date: z.union([z.string(), z.date()]),
  description: z.string(),
  section: sectionSchema,
  tags: z.array(z.string()).optional().default([]),
  layout: z.enum(['default', 'immersive']).default('default'),
  featured: z.boolean().optional().default(false),
});
```

Every post belongs to exactly one section. No opt-out, no "uncategorised." Forcing a primary identity is the whole point.

For the Frames section, also add optional image support:

```typescript
// Additional fields for Frames posts
images: z.array(z.object({
  src: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
})).optional().default([]),
```

**Migrate existing posts:**

| Post | Section |
|------|---------|
| 001 — The Agentic Product Engineer | `engineering` |
| 002 — OSS Radar #01 | `oss-radar` |
| 003 — How ghx Was Born | `engineering` |
| 004 — Topologies of Thoughts | `engineering` |
| 005 — Procrastination | `essays` |
| 006 — OSS Radar #02 | `oss-radar` |
| 007 — You Don't Need Codemap | `engineering` |

### 2. Redesign the sidebar into a publication nav rail

Remove the post list entirely. The sidebar is navigation infrastructure, not a second feed.

```
gkoreli.com
"Where excitement ends, depth begins."
[GitHub] [X] [LinkedIn] [🌙]

Home
Essays
Engineering
OSS Radar
Frames
── ✦ ──
About
Stats
```

The sparkle separator divides section nav (content destinations) from site nav (meta pages). Same link styling as today. Zero per-section CSS.

No article list. Readers who want chronological browsing use section archive pages or RSS.

### 3. Redesign the homepage into a publication front page

The homepage answers: what is this place, what lives here, where do I go next.

**Structure:**

```
[ Masthead ]
  Goga Koreli
  "A personal publication — essays, engineering notes, OSS Radar, and Frames."
  Inline project links: backlog-mcp · @nisli/core · gkoreli.com

[ Featured ]
  One piece only — latest, or manually flagged via `featured: true` in frontmatter

[ Essays ]
  2 recent items → "View all Essays"

[ Engineering ]
  2 recent items → "View all Engineering"

[ OSS Radar ]
  Latest issue card + issue number → "View all issues"

[ Frames ]
  Latest entry with thumbnail(s) → "View all Frames"

[ Footer ]
```

The section blocks replace the current mixed chronological feed. Post cards within each block include the date and description but **not** a section label (they are already inside a labelled section block). The "View all" link anchors each section to its archive.

The project cards become inline text links — understated, present, not competing with content.

### 4. Add section archive pages

Each section gets its own `/[section]/` route:

| URL | Title | Format |
|-----|-------|--------|
| `/essays` | Essays | Prose-first list, title + date + description |
| `/engineering` | Engineering | Denser list, title + date + tags |
| `/oss-radar` | OSS Radar | Issue-numbered cards, serialised feel |
| `/frames` | Frames | Thumbnail grid or filmstrip |

Each archive page has:
- Section name as heading
- One-line editorial intro for the section (what this section is about)
- Full archive of posts in that section, reverse-chronological
- Link back to homepage

Build pipeline generates these from the same posts data, filtered by `section`.

New paths to add in `src/lib/paths.ts`:
```
/essays/index.html
/engineering/index.html
/oss-radar/index.html
/frames/index.html
```

### 5. Show section label on every post page

At the top of every post, above the title:

```
← Engineering        (link back to /engineering)
```

Or styled as a pill/badge — same as existing tag styling but bigger, placed before the title.

This solves the "where am I" problem for readers who land directly from search or a shared link.

### 6. Give each section a distinct editorial mood (within the same shell)

Not separate sites. Not different CSS files. Subtle differentiation within the existing design token system:

| Section | Mood direction |
|---------|---------------|
| **Essays** | More spacious, quieter, softer line spacing, longer paragraphs |
| **Engineering** | Standard density, code blocks prominent, structured components welcome |
| **OSS Radar** | Issue number in header, structured `StatRow` and `Scoreboard` patterns, serialised feel |
| **Frames** | Full-bleed images first, caption below, text minimal, `cinematic` layout option |

Implemented via a `data-section` attribute on `<body>` or the content wrapper. Section-specific CSS scoped under `[data-section="essays"] .content { ... }`. Small surface area, not a separate CSS file per section.

### 7. The stable shell / expressive interior contract

This is the core architectural principle this ADR establishes:

**Stable shell (DRY, consistent):**
- Sidebar navigation
- Section labels on post pages
- Breadcrumb: section → post
- Archive page structure
- RSS feed (filtered by section + unified)
- `posts.json` includes `section` field
- `llms.txt` describes sections

**Expressive interior (not DRY, per-post freedom):**
- Post body HTML
- Custom preamble components (`preamble()` export)
- Per-post animations
- Rich content components used selectively
- Layout mode (`default` vs `immersive`)
- Any custom CSS injected via TypeScript posts

Nothing in the interior needs to know about the section system. The section metadata lives in `PostMeta`. The shell reads it. The post body ignores it.

---

## Consequences

### What changes

| Layer | Before | After |
|-------|--------|-------|
| `PostMeta` | No section field | `section` required enum |
| Sidebar | Post list + nav | Section nav only |
| Homepage | Chronological feed | Section-preview publication front page |
| Routes | `/`, `/{slug}` | + `/essays`, `/engineering`, `/oss-radar`, `/frames` |
| Post pages | No section context | Section label + back link |
| Frames | Does not exist | Image-first section with `images[]` in frontmatter |
| `page.ts` | Passes all posts to sidebar | Passes section nav items only |
| `index.ts` | `indexTemplate(posts)` | `indexTemplate(posts)` with section grouping |
| Build pipeline | Generates post pages + homepage | + 4 section archive pages |

### What does not change

- Post file format (`.md` and `.ts`)
- Custom preamble pattern (`preamble()` export)
- Layout modes (`default`, `immersive`)
- Animation and canvas component system
- Glass panel design language
- Dark/light theming
- Prompts transparency system
- RSS, sitemap, LLM text generation
- Worker API routes
- Cloudflare deployment

### Migration effort

1. Add `section` to `frontmatterSchema` in `src/lib/frontmatter.ts`
2. Update 7 existing posts with `section:` in frontmatter
3. Rewrite `page.ts` sidebar nav section
4. Rewrite `index.ts` homepage template
5. Add `src/templates/section.ts` archive page template
6. Add 4 new page generators in `build.ts`
7. Add section label to `post.ts` template
8. Add `data-section` to page shell, add scoped CSS stubs
9. Update `paths.ts` with new routes
10. Update `posts.json` and `llms.txt` generation to include `section`

### Risks

- **Existing posts without `section`**: Validation will reject them. Migration (step 2) must happen before the build will pass. This is a hard dependency.
- **Frames without images**: A Frames post with no `images[]` should be valid — some entries might be text-only visual impressions. Do not make `images` required.
- **Featured post logic**: If no post is flagged `featured: true`, fall back to the most recent post. Homepage should never show an empty featured slot.
- **OSS Radar issue numbers**: Currently embedded in the slug (`oss-radar-01`, `oss-radar-02`). This is fine for now. A proper `issueNumber` field can be added later without touching this ADR's scope.

---

## The principle in one sentence

**Stable shell, expressive interior** — the publication navigation and section identity are DRY infrastructure; the post body is a free art object every time.
