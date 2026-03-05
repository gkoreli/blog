# ADR-0002: nisli-static — Build-Time HTML Templates for @nisli/core

## Status

Accepted — 2026-03-05

## Context

The blog's build pipeline needs to generate HTML in Node at build time. nisli/core's `html` tagged template is designed for the browser — it creates DOM markers, walks the DOM tree, and creates reactive bindings. None of that works in Node (no `document`, no `HTMLElement`, no `customElements`).

The initial approach was raw TypeScript string concatenation:

```typescript
// What we started with — writing HTML like it's 2002
export function pageShell({ title, content }: { title: string; content: string }): string {
  return `<!DOCTYPE html>
<html><head><title>${title}</title></head>
<body><main>${content}</main></body></html>`;
}
```

This works but has problems:
- No auto-escaping — XSS-prone if any user input reaches templates
- No composability — can't nest templates cleanly, arrays need manual `.join('')`
- Different syntax from nisli/core — build-time templates look nothing like client-side components
- Violates the framework's own philosophy — nisli/core exists to eliminate raw HTML string manipulation

## Decision

Build `nisli-static` — a static `html` tagged template that mirrors nisli/core's syntax but resolves to strings instead of DOM. This is a prototype of what will become `@nisli/core/server`.

### API

```typescript
import { html, raw } from 'nisli-static';

// Auto-escaped values
html`<h1>${title}</h1>`                    // escapes &, <, >, ", '

// Raw HTML (opt out of escaping for pre-rendered content)
html`<div>${raw(markdownOutput)}</div>`    // passes through as-is

// Nested templates — just works
html`<ul>${posts.map(p => html`<li>${p.title}</li>`)}</ul>`

// Conditionals
html`${hasDate ? html`<time>${date}</time>` : ''}`

// Get the string
const output = html`<h1>Hello</h1>`.toString();
```

### How It Works

`html` returns a `StaticResult` object with a `toString()` method. Values are resolved:

| Value type | Behavior |
|-----------|----------|
| `string`, `number` | HTML-escaped and inserted |
| `null`, `undefined`, `false` | Renders empty string |
| `true` | Renders empty string (for boolean attributes) |
| `StaticResult` (nested `html`) | Inserted without escaping (already safe) |
| `RawHtml` (from `raw()`) | Inserted without escaping (trusted content) |
| `Array` | Each element resolved recursively, concatenated |

### Escaping

All string values are HTML-escaped by default: `&` `<` `>` `"` `'`. This prevents XSS even if dynamic content reaches templates. To insert pre-rendered HTML (markdown output, syntax-highlighted code), use `raw()`.

### Path Alias

Templates import from `nisli-static` via a tsconfig path alias:

```json
// tsconfig.json
{ "paths": { "nisli-static": ["./src/nisli-static/static.ts"] } }
```

```typescript
// templates/page.ts
import { html, raw } from 'nisli-static';
```

When this moves to `@nisli/core/server`, only the alias changes — templates stay the same.

### Usage in the Blog

```typescript
// templates/post.ts
import { html, raw } from 'nisli-static';
import type { PostMeta } from '../lib/frontmatter.js';

export function postTemplate(meta: PostMeta, htmlContent: string) {
  return html`<article>
    <h1>${meta.title}</h1>
    <time datetime="${meta.date}">${dateStr}</time>
    ${meta.tags.length > 0
      ? html`<div class="tags">${meta.tags.map(t => html`<span class="tag">${t}</span>`)}</div>`
      : ''}
    <div class="post-content">${raw(htmlContent)}</div>
  </article>`;
}
```

Same `html` tagged template syntax as nisli/core. Same nesting, same conditionals, same array mapping. The only difference is `raw()` for pre-rendered content — the browser version doesn't need this because it uses `html:inner` attribute binding.

## Vision: @nisli/core/server

### SSG vs SSR — Same Primitive, Different Caller

The rendering function (`html` → string) is the same for both SSG and SSR. The difference is when you call it:

- **SSG (Static Site Generation)**: `renderToString` is called once at build time. Output is written to files, deployed to a CDN. No server at runtime. Same HTML served to every visitor.
- **SSR (Server-Side Rendering)**: `renderToString` is called on every HTTP request by a running server. Can produce different HTML per request (user-specific content, auth state, etc.).

`nisli-static` is the rendering primitive — it doesn't care who calls it or when. The blog uses it for SSG (called once during `pnpm build`), but the same `html()` + `raw()` would work in an Express handler for SSR. The framework provides the renderer; the application decides the execution model.

### Long-Term Goal

The long-term goal is to unify browser and server rendering in nisli/core:

```typescript
// Same component, same html — works in both environments
import { html, component } from '@nisli/core';

const PostHeader = component('post-header', (props) => {
  return html`<h1>${props.title}</h1><time>${props.date}</time>`;
});

// Browser: mounts to DOM (existing behavior)
import { mount } from '@nisli/core';
mount(html`<post-header title="Hello"></post-header>`, document.body);

// Node: renders to string (new capability)
import { renderToString } from '@nisli/core/server';
const output = renderToString(html`<post-header title="Hello"></post-header>`);
```

This follows the same pattern as Lit SSR (`@lit-labs/ssr`) and React's `renderToString` — components don't know or care if they're rendering to DOM or string. The entry point decides.

### What Full SSR Requires (not built yet)

- `html` returns a `TemplateResult` consumable by both `mount()` and `renderToString()`
- `renderToString()` resolves signals to their current `.value`
- `renderToString()` resolves `when()` conditionals and `each()` lists
- `renderToString()` traverses component trees — calls setup functions, renders child templates
- DOM shim or DOM-free resolution for `component()` definitions in Node
- Declarative Shadow DOM output for components that use Shadow DOM

### Migration Path

1. **Now**: `nisli-static` in the blog repo — standalone `html()` + `raw()`, string output
2. **Next**: Move `static.ts` into `@nisli/core` as `@nisli/core/server` export. Blog swaps the tsconfig alias to point at the real package. Templates unchanged.
3. **Later**: Build full `renderToString()` that resolves component trees, signals, control flow. The `html()` and `raw()` primitives remain the same — `renderToString()` adds component-level resolution on top.

## Alternatives Considered

### DOM shim (linkedom, happy-dom)

Fake the browser DOM in Node so nisli/core's existing `html` works server-side.

Rejected because:
- Heavy dependency for what amounts to string concatenation
- Slow — creating and serializing a full DOM tree to get an HTML string
- Fragile — DOM shims don't perfectly match browser behavior
- nisli/core's template engine creates reactive bindings, event listeners, effects — all wasted work in a static context

### Separate template language (EJS, Handlebars, Pug)

Use an established server-side template language for build-time HTML.

Rejected because:
- Different syntax from nisli/core — developers context-switch between two template systems
- Adds a dependency for something we can build in ~80 lines
- Doesn't advance the framework — we want to prove nisli/core can do SSG

### Raw string concatenation (template literals)

Just use TypeScript template literals directly, no abstraction.

Rejected because:
- No auto-escaping — every dynamic value is a potential XSS vector
- No composability — nesting templates requires manual string management
- Arrays need `.map().join('')` everywhere
- Looks nothing like nisli/core — defeats the dogfooding purpose

## Consequences

- `nisli-static` is ~80 lines of TypeScript with zero dependencies
- Templates use the same `html` syntax as nisli/core — low cognitive overhead
- Auto-escaping by default prevents XSS in build-time templates
- `raw()` is an explicit opt-in for trusted content — makes trust boundaries visible
- Path alias means migration to `@nisli/core/server` is a one-line config change
- This is a stepping stone, not the final design — full SSR is a separate project
