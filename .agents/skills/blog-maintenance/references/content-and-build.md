# Content Formats and Build Pipeline

Read for content format, rendering, validation, build output, development, or generated discovery files. Paths such as `posts/`, `src/`, and `dist/` are relative to `packages/blog/` unless qualified. Architecture rationale: [ADR-0001](../../../../docs/adr/0001-blog-architecture.md), [static templates](../../../../docs/adr/0002-nisli-static.md), [rich posts](../../../../docs/adr/0009-layout-system.md), and [generated representations](../../../../docs/adr/0006-ai-readable-blog.md).

## Content Format: Markdown + YAML Frontmatter + Web Components

Posts are `.md` files with YAML frontmatter. Interactive elements use native web components directly in markdown — no MDX.

For immersive/rich posts that need custom layout control, posts can also be `.ts` files in `posts/` that export `meta: PostMeta`, `article(): TemplateResult`, and optionally `preamble(): TemplateResult`. The build pipeline auto-discovers both formats. Use `.md` for standard prose posts, `.ts` when the post needs programmatic layout (custom components, topology diagrams, scroll-reveal sections). The `.ts` format uses `staticHtml` from `@nisli/core/static` (the current successor to the earlier `nisli-static` helper), with full TypeScript control over structure. See [the post schema](../../../../packages/blog/src/lib/frontmatter.ts) for `PostMeta` and [the build loop](../../../../packages/blog/src/pipeline/build.ts) for supported exports.

**Post format (markdown — default):**
```markdown
---
title: "Why I built @nisli/core"
date: 2026-03-05
description: "Why I chose native web components for this blog"
section: engineering
tags: [nisli, web-components, framework]
---

Regular markdown prose, code blocks, images, links...

And when you need interactivity, drop in a web component:

<nisli-counter initial="0"></nisli-counter>
```

The page shell renders the H1 from `title`; do not repeat it in the Markdown body. `section` is required and must be `essays`, `engineering`, or `oss-radar`. The counter tag illustrates the syntax; an interactive custom element also needs an implementation registered in the loaded client bundle.

### Why not MDX?

MDX requires a JSX runtime, but is not limited to React/Preact; its [official integration guide](https://mdxjs.com/docs/getting-started/#jsx) also documents Vue, Solid, and other runtimes (checked 2026-09-28). This repository chooses tagged templates and native web components, so adopting MDX would add a compiler/runtime integration without a demonstrated need.

The original decision considered these alternatives, rather than establishing an exhaustive list of what MDX can do:

1. Writing a custom MDX compiler that outputs web component calls instead of JSX — significant effort for no gain
2. Adding React as a dependency just for MDX processing — defeats the zero-dep philosophy
3. Using MDX at build time and stripping the React runtime — fragile and complex

The project rejected that integration cost. The blog exists to prove `@nisli/core` works standalone.

### Why markdown + web components is better for us

- **No framework mismatch** — markdown parser passes through HTML tags, browser upgrades them into live web components via `customElements.define()`. This is the native web platform way.
- **Zero extra dependencies** — no MDX compiler, no JSX transform, no React runtime
- **Same interactive power** — any `@nisli/core` component can be embedded directly into markdown as a custom element
- **Portable prose** — ordinary Markdown remains readable in other Markdown viewers. Embedded custom elements need their registered client implementation; their interactivity is not portable merely because the surrounding prose is Markdown. MDX source needs an MDX-aware toolchain.
- **Simpler build pipeline** — parse frontmatter, convert markdown to HTML, wrap in nisli/core shell. Done.

The maintained decision is Markdown plus native web components, not a claim that MDX only works with React.

### How SSG Works

```
posts/001-hello-world.md          ← you write markdown
        ↓
src/pipeline/build.ts (build-time) ← parses frontmatter, converts md → HTML (marked),
                                     highlights code (shiki), wraps in page shell
        ↓
dist/hello-world/index.html       ← complete HTML with all content baked in
        ↓
Cloudflare Workers serves static files  ← browser gets pre-built HTML instantly
        ↓
@nisli/core JS loads              ← upgrades any <nisli-*> tags into interactive components
```

HTML requests receive pre-rendered content readable without JavaScript. Markdown twins are also served at `/{slug}.md` and through content negotiation; saying Markdown never reaches a browser was too broad. Nisli/core adds interactivity as progressive enhancement.

### Build Pipeline
- **Production build** — the package command checks referral-policy output first, then [prod.ts](../../../../packages/blog/src/pipeline/prod.ts) loads local environment values and runs `cleanDist()` → `buildComponentStyles()` → `copyStaticAssets()` → `buildHTML()` → `validateHtmlOutput()` → `bundleClient()`. The earlier four-step description omitted component-style generation and output validation. Development uses [build-html.ts](../../../../packages/blog/src/pipeline/build-html.ts) for styles/assets/HTML and a separate esbuild context for client bundles.
- **Frontmatter validation** — `validatePosts()` checks Markdown posts at the start of every build; invalid posts are skipped with a clear warning. Run `pnpm -C packages/blog validate` for a nonzero exit on invalid Markdown frontmatter. The standalone validator does not validate `.ts` post exports. Uses `safeParse()` + custom `FrontmatterError` class.
- **Prompts pipeline** — `parsePrompts(slug)` checks `prompts/` for a matching `.prompts.md` file, splits on `---`, returns `{ count, prompts[], preview }` or `null`. Build loop generates `/{slug}/prompts` page when prompts exist, passes data to post template for header link + teaser card.
- **Asset handling** — esbuild bundles the JS and CSS entry points from [paths.ts](../../../../packages/blog/src/lib/paths.ts), with `entryNames: '[name]'` to flatten output. Static assets are copied separately. HTML references `/main.js` and `/main.css`, plus the additional bundles selected for a page.
- **RSS feed** — generated at build time from post metadata. Zero dependencies — hand-rolled XML template. Autodiscovery `<link>` in `<head>` so readers and agents find it automatically.
- **Semantic HTML** — `<article>`, `<time>`, `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`. Agents can identify main content vs navigation without heuristics. Note: prompts teaser uses `<section>` (directly related to article), not `<aside>` (tangential content).
- **AI agent access** — pre-rendered HTML (full content without JS), RSS feed (`/feed.xml`), `llms.txt` (known-site developer-tool directory; not an established organic ranking or citation lever, see [shareable-engineering](../../shareable-engineering/SKILL.md)), and `robots.txt` (allow all, `Content-Signal: search=yes, ai-input=yes`, content-license comment). The Worker negotiates representations on post and page paths: `Accept: text/markdown` returns the Markdown twin with `Content-Location`, `Accept: application/vnd.citationstyles.csl+json` or `application/x-bibtex` returns the citation files, and every HTML/Markdown response carries typed `Link` headers (`alternate` markdown, `describedby` posts.json, `author`, `license`, `alternate` CSL-JSON). Pure negotiation logic lives in `packages/blog/src/worker/negotiate.ts`; link building in `packages/blog/src/lib/typed-links.ts`; the content license constant in `packages/blog/src/lib/license.ts`.
- **`_headers` file** — `packages/blog/public/_headers` sets `Content-Type: text/plain; charset=utf-8` for `.txt` and `text/markdown; charset=utf-8` for `.md`. Cloudflare parses this at the edge. Without it, browsers default to Latin-1 for `text/plain`, mangling UTF-8 multi-byte characters (em dashes → mojibake).

### SEO & Discoverability (ADR-0006)

All SEO files are auto-generated at build time from `PostMeta[]`. Adding a new post or prompts file automatically updates everything. No manual maintenance for content changes.

**Auto-generated (zero maintenance):**
- `sitemap.xml` — the publication routes declared by [sitemap.ts](../../../../packages/blog/src/templates/sitemap.ts), articles, and `/{slug}/prompts` when prompts exist; not every Worker or utility route
- `llms.txt` — AI agent index with post links + prompts links
- `llms-full.txt` — full content for RAG/large-context models
- `posts.json` — structured post index with prompts URLs
- `/{slug}.md` — clean markdown per post (frontmatter stripped) with a trailing `## Cite this` block
- `/{slug}.csl.json` and `/{slug}.bib` — per-post citation representations (`templates/citation.ts`), license name from the content license constant
- `/license` — the content section of the repository `LICENSE`, rendered as a page
- `robots.txt` — access, `Content-Signal`, license comment, sitemap (`templates/robots.ts`)
- JSON-LD `BlogPosting` — in `<head>` of blog posts only
- `rel="canonical"` + `og:url` — self-referencing on every page
- `feed.xml` — RSS items

**Requires periodic manual update:**
- `llms.txt` intro/API/Source sections — only if site mission, API endpoints, or repo URL change (~never)
- `jsonld.ts` author info — hardcoded single author (~never)
- AI crawler regex in `packages/analytics/src/classify.ts` — sync from `ai-robots-txt/ai.robots.txt` (~quarterly)

**Key invariant:** `buildHTML()` in `build.ts` is the single source of truth. Generated article representations share the discovered metadata and content; Markdown posts supply raw Markdown and TypeScript posts supply converted rendered content. Site-level routes and author/license constants are additional inputs. See `docs/adr/0006-ai-readable-blog.md` Resilience Matrix for the full mapping.
- **External links** — the Markdown renderer sets `target="_blank" rel="noopener"` on non-root-relative/non-fragment links. Internal links (`/about`, `/hello-world`, `#section`) stay in the same tab. Raw HTML and TypeScript templates must set their own link attributes; the Markdown rule does not automatically rewrite them.
- **Dev server** — browser-sync serves `dist/` with WebSocket-based live reload. `bs.watch()` watches source, posts, prompts, and public assets; client-only source changes use the client rebuild path. HTML rebuilt via subprocess (`tsx build-html.ts`) to avoid Node module cache. esbuild context handles JS/CSS bundling.
- **Never run `pnpm build` while `pnpm dev` is running** — esbuild's context holds the dist directory. Production build would nuke it.
