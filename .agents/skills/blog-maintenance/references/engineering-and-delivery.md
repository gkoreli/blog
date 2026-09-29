# Engineering and Delivery

- Use strict TypeScript. No `any` or type assertions except `as const`; fix schemas, type guards, or upstream types.
- Use Markdown for standard posts and TypeScript for custom layouts. Use registered native web components for interactivity. Follow [content and build](content-and-build.md) for formats and commands.
- Keep dependencies and infrastructure proportionate to the publication. The `blog-analytics` D1 binding serves analytics, newsletter state, and client-error reports; do not assume each package has a separate database.
- Preserve complete readable HTML without client JavaScript. Add interactivity through `@nisli/core` components.
- Use the repository's personal Git identity and configured credentials. Do not replace them with global work-account settings.
- Run relevant checks, then commit and push scoped changes directly to `main`. Create a PR only when requested. Preserve concurrent changes and use an isolated checkout when needed.
- Publish after factual and functional checks pass; avoid indefinite cosmetic revisions. Cross-posts must use a canonical URL pointing to `gkoreli.com`.
