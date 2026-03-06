# ADR-0001: Blog Architecture — Build Pipeline, Site Shell, and Component Model

## Status

Accepted — 2026-03-05

## Context

We're building a personal engineering blog at `gkoreli.com` using `@nisli/core` (a zero-dependency reactive web component framework). The blog is statically generated (SSG) and deployed to Cloudflare Workers with static assets (migrated from GitHub Pages in March 2026).

The backlog-mcp viewer is a client-side SPA: one HTML file, one `<backlog-app>` root component, esbuild bundles everything, the browser renders it all. The blog is fundamentally different — content is pre-rendered at build time, the browser receives complete HTML. But nisli/core's component model still applies for interactive elements.

We need to define:
1. How the build pipeline transforms markdown into deployable HTML
2. How the site shell (layout) wraps every page
3. How nisli/core components integrate with static content
4. How the architecture scales as the blog grows

## Decision

### Build Pipeline

A single TypeScript build script (`src/build.ts`) orchestrates the entire pipeline:

```
posts/*.md → frontmatter parse → marked (markdown → HTML) → shiki (syntax highlight)
    → inject into page template → write to dist/

Static assets (CSS, JS, images) → copy to dist/
```

**Stages:**

1. **Discover** — glob `posts/*.md`, sort by filename prefix (NNN-)
2. **Parse** — extract YAML frontmatter (title, date, description, tags), separate markdown body
3. **Transform** — markdown → HTML via `marked`, code blocks highlighted via `shiki` at build time
4. **Template** — inject HTML content into a page shell template with header, nav, footer
5. **Generate index** — build home page with post list (title, date, description, link)
6. **Write** — output to `dist/` with clean URLs (`dist/hello-world/index.html`)
7. **Copy assets** — CSS, client JS bundle, images, favicon, CNAME

No framework needed for the build step — it's a plain Node script. `marked` and `shiki` are the only content dependencies. The build script itself is the "static site generator."

### URL Structure

```
gkoreli.com/                    → dist/index.html (post list)
gkoreli.com/hello-world         → dist/hello-world/index.html
gkoreli.com/about               → dist/about/index.html (future)
gkoreli.com/tags/nisli           → dist/tags/nisli/index.html (future)
```

Clean URLs via directory-based `index.html` files. No `.html` extensions in URLs. Slug derived from filename: `001-hello-world.md` → `/hello-world`.

### Site Shell (Layout)

Every page shares a common HTML shell. This is a **build-time template**, not a client-side component:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Goga Koreli</title>
  <meta name="description" content="${description}">
  <!-- Open Graph / social meta tags -->
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <header>
    <nav>
      <a href="/">gkoreli.com</a>
      <!-- minimal nav links -->
    </nav>
  </header>

  <main>
    ${content}
  </main>

  <footer>
    <!-- minimal footer -->
  </footer>

  <script type="module" src="/main.js"></script>
</body>
</html>
```

**Key decisions:**
- The shell is a TypeScript template function using `nisli-static`'s `html` tagged template — same syntax as nisli/core, but outputs strings.
- `<header>`, `<main>`, `<footer>` are semantic HTML, not web components. Content is static.
- `main.js` is a small client-side bundle that registers nisli/core components for interactive elements in posts.
- CSS is a single `styles.css` — vanilla CSS, loaded in `<head>`.

### Component Model — Two Layers

**Layer 1: Build-time (Node, `nisli-static`)**
- Page shell, post, and index templates use `html` tagged templates from `nisli-static`
- Same syntax as nisli/core's browser `html` — but resolves to strings, not DOM
- `raw()` for pre-rendered content (markdown output, syntax-highlighted code)
- These are composable template functions, not raw string concatenation
- See ADR-0002 for the full nisli-static design and migration path

**Layer 2: Client-side (browser, nisli/core)**
- Interactive elements embedded in posts: `<nisli-counter>`, `<nisli-demo>`, etc.
- Future: theme toggle, search, table of contents
- Registered via `main.js` — a small entry point that imports and defines custom elements
- Progressive enhancement: content is readable without JS, components add interactivity

```
src/
├── build.ts              ← build pipeline orchestrator
├── nisli-static/
│   └── static.ts         ← prototype of @nisli/core/server (see ADR-0002)
├── templates/
│   ├── page.ts           ← HTML shell template (imports from nisli-static)
│   ├── post.ts           ← single post page template
│   └── index.ts          ← home page / post list template
├── lib/
│   ├── markdown.ts       ← marked + shiki setup
│   ├── frontmatter.ts    ← YAML frontmatter parser
│   └── fs.ts             ← file discovery, output writing
├── client/
│   ├── main.ts           ← client entry point (registers components)
│   └── components/       ← nisli/core interactive components
└── styles/
    └── main.css          ← vanilla CSS
```

### Asset Pipeline

**CSS** — single `styles.css` file, vanilla CSS. Copied to `dist/` at build time. No PostCSS, no preprocessor.

**Client JS** — `src/client/main.ts` bundled with esbuild into a single `main.js`. This is the only JS shipped to the browser. Contains nisli/core + any interactive components. Expected size: <10KB gzipped for a blog with minimal interactivity.

**Images** — `public/` directory copied to `dist/` as-is. Standard static asset handling.

**Fonts** — system font stack initially. No custom fonts to start (zero network requests for fonts).

### Dev Experience

- `pnpm dev` — watch mode: rebuilds on file changes, serves locally
- `pnpm build` — production build: generates `dist/`
- `pnpm serve` — preview production build locally
- `pnpm typecheck` — type checking without emit

### Future Extensibility

This architecture supports growth without restructuring:

- **Tags/categories** — build script generates `dist/tags/{tag}/index.html` pages
- **RSS feed** — build script generates `dist/feed.xml` from post metadata
- **About page** — `src/pages/about.md` or similar, same template pipeline
- **Search** — client-side search component (nisli/core) over a build-time-generated JSON index
- **`packages/ui`** — shared component library consumed by the blog and potentially other projects
- **Multiple themes** — CSS custom properties, theme toggle component

## Alternatives Considered

### Full SPA with nisli/core (like backlog-mcp viewer)

One `<blog-app>` root component, client-side routing, fetch markdown at runtime.

Rejected because:
- SEO requires pre-rendered HTML — crawlers and AI agents can't execute JS
- Slower first paint — browser must download JS, parse it, fetch markdown, then render
- Unnecessary complexity — a blog doesn't need client-side routing
- Cloudflare Workers serves static files — no server to handle dynamic routes

### Existing SSG framework (Astro, 11ty, Hugo)

Use an established static site generator instead of a custom build script.

Rejected because:
- The blog exists to dogfood `@nisli/core` — adding another framework undermines that
- Our build pipeline is ~200 lines of TypeScript. An SSG framework adds thousands of lines of abstraction for features we don't need.
- Custom build script gives full control over the HTML output — important for web component integration
- Learning/debugging someone else's plugin system vs. reading our own 200-line script

### Server-side rendering (Next.js, Express)

Run a server that renders pages on each request.

Rejected because:
- Requires a running server (cost, ops, monitoring)
- Blog content is static — there's nothing dynamic about rendering the same markdown on every request. Cloudflare Workers serves pre-built files from the edge, with the option to add serverless functions for specific routes (e.g. analytics API) without running a full server.
- Blog content is static — there's nothing dynamic about rendering the same markdown on every request
- SSG gives identical SEO benefits with zero runtime cost

## Consequences

- Build script is our responsibility — no framework handles edge cases for us
- Every new page type (tags, RSS, about) requires adding a template and build logic
- Client-side JS is minimal but still needs bundling (esbuild)
- Two mental models: build-time templates (`nisli-static`) vs. client-side components (nisli/core) — but same `html` syntax in both, reducing cognitive overhead
