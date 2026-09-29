# Engineering and Delivery Conventions

Read before implementation, checks, commits, or delivery. The owner’s direct-to-main preference applies after relevant checks; preserve work belonging to other sessions. For article form and the clarification of generic tutorials, use [publication context](../../shape-article/references/publication-context.md).

### Rules

- **No type assertions** — `as string`, `as any`, `as unknown` are banned. If types don't flow naturally, fix the source (add a Zod schema, narrow with type guards, or fix the upstream type). The only exception is `as const`.
- **Markdown-first** — posts live in `posts/` as `.md` files with YAML frontmatter
- **Build script** — `packages/blog/src/pipeline/build.ts` builds the site; `build-html.ts` is the HTML-only entry point used by development tooling.
- **Keep it simple** — no CMS, no complex build chains. The `blog-analytics` D1 database is shared by analytics, newsletter state, and client-error reports. Markdown → HTML → deploy.
- **Dogfooding** — the blog itself proves `@nisli/core` works as a standalone npm dependency
- **Web components in posts** — for interactive elements, use `<nisli-*>` custom elements directly in markdown. No JSX, no MDX.
- **Git config** — this repo uses local git config (personal email, not the global Amazon config)
- **Delivery workflow** — after the relevant checks pass, commit and push directly to `main`. Do not create pull requests unless Goga explicitly requests one. Preserve concurrent uncommitted work; use an isolated checkout when needed, then integrate the tested changes. Owner preference recorded September 6, 2026.
- **Auth** — pushes authenticate as `gkoreli` via PAT stored in macOS Keychain

## Anti-Patterns

- Don't over-engineer the blog infrastructure — the posts are the product, not the build system
- Don't add dependencies unless absolutely necessary — the framework is zero-dep, the blog should be minimal-dep
- Teach directly from evidence and the author's work; avoid interchangeable tutorials detached from that basis. The September 19 earned-trust direction clarifies the older anti-tutorial wording.
- Don't polish endlessly before publishing — ship ugly, iterate
- Don't cross-post without canonical URLs pointing back to `gkoreli.com`
