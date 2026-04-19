# ADR-0014: Pages vs Components — Architectural Separation

## Status

Accepted — 2026-04-19.

---

## Context

The blog accumulated page-level templates in `src/templates/` alongside non-page utilities (RSS feed, sitemap, JSON-LD fragments, the page shell). The result was a flat directory where an endpoint-producing file (`about.ts`) sits next to a fragment-producing file (`jsonld.ts`) with no structural signal to distinguish them.

The section archive pages revealed the problem most sharply. All four section landing pages (Essays, Engineering, OSS Radar, Frames) were rendered by a single generic `SectionArchive` component with runtime conditionals — a `section` switch inside one function. This is convenient for three lines of build code but it destroys the ability to give each section its own structure, visual hierarchy, and editorial tone. It treats "sections are similar" as a permanent constraint rather than a starting assumption.

The publication model (ADR-0013) demands the opposite. Each section is a distinct room. A room has a floor plan. It should have its own file.

---

## Decision

**Introduce a `src/pages/` directory as a first-class layer in the architecture.**

A *page* is defined as: a TypeScript module that exports a single template function, maps to exactly one URL endpoint, and is responsible for the full content of that page. Pages are constructed from reusable components but are not themselves reusable.

A *component* is defined as: a reusable factory function that renders a self-contained UI fragment. Components do not know about routing. They live in `src/components/{name}/{name}.ts`.

### Directory map

```
src/
  pages/                     ← NEW: one file per URL endpoint
    home.ts                  ← homepage (was templates/index.ts)
    about.ts                 ← about page (was templates/about.ts)
    post.ts                  ← individual post pages (was templates/post.ts)
    prompts.ts               ← prompts sub-page (was templates/prompts.ts)
    privacy.ts               ← privacy policy (was templates/privacy.ts)
    stats.ts                 ← stats dashboard (was templates/stats.ts)
    design-language.ts       ← design language reference (was templates/design-language.ts)
    essays.ts                ← Essays section archive (NEW dedicated page)
    engineering.ts           ← Engineering section archive (NEW dedicated page)
    oss-radar.ts             ← OSS Radar section archive (NEW dedicated page)
    frames.ts                ← Frames section archive (NEW dedicated page)
  templates/                 ← Non-page templates: shell, feeds, sitemaps, structured data
    page.ts                  ← HTML shell wrapper (not a page itself)
    rss.ts                   ← RSS feed (not a page)
    sitemap.ts               ← sitemap.xml (not a page)
    llms.ts                  ← llms.txt / llms-full.txt / posts.json
    jsonld.ts                ← structured data fragments
    components.ts            ← backward-compat re-export shim
  components/                ← Reusable UI fragments
    ...
```

### Rules

1. Every file in `src/pages/` exports exactly one primary function named after the page.
2. Pages import from `src/components/` and `src/templates/` — never the reverse.
3. `build.ts` imports exclusively from `src/pages/` for page generation. It does not import from `src/components/` directly for page content.
4. Each section landing page is its own file. No shared section template with runtime branching.

---

## Consequences

**Positive**
- Each section page can evolve independently — different markup, layout rhythm, and component mix — without touching other sections.
- The architecture is self-documenting: opening `src/pages/` gives a complete map of the site's URL space.
- Designer or author can open `pages/essays.ts` and understand the entire Essays page without reading conditional logic.
- Build errors are traceable to a specific page file rather than a shared template.

**Negative**
- More files. Pages that are currently near-identical (essays and engineering list views) will have some duplication.
- `build.ts` import list grows by 4 (four new section page imports replace one `section.ts` import).

**Mitigated**
- Duplication is intentional. Shared structure stays in components (`LitItem`, `PageHero`, `OSSRadarCard`). What is deduplicated is the *divergence gate* — the conditional logic that will accumulate if sections share one template.

---

## Migration

The four `src/templates/` page files (`about.ts`, `index.ts`, `post.ts`, `prompts.ts`, `privacy.ts`, `stats.ts`, `design-language.ts`) are moved to `src/pages/` with import paths updated. The generic `sectionArchiveTemplate` in `templates/section.ts` is removed; each section has its own page. `build.ts` updated accordingly.

The `SectionArchive` component in `src/components/section-archive/` is removed; its logic is distributed into the four section page files where it belongs.
