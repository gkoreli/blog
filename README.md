# gkoreli.com

Personal engineering blog by [Goga Koreli](https://gkoreli.com). Agentic engineering, open source developer tools, and building in public.

Built with [@nisli/core](https://www.npmjs.com/package/@nisli/core) — a zero-dependency reactive web component framework.

> "Where excitement ends, depth begins."

## Stack

- **Framework**: [@nisli/core](https://www.npmjs.com/package/@nisli/core) — signals, templates, web components
- **Content**: Markdown + YAML frontmatter in `posts/`
- **Syntax highlighting**: [Shiki](https://shiki.style) — dual themes, build-time, zero client JS
- **Validation**: [Zod](https://zod.dev) — frontmatter schema validation at build time
- **Bundler**: [esbuild](https://esbuild.github.io) — JS + CSS bundling
- **Hosting**: GitHub Pages + Cloudflare
- **CI/CD**: GitHub Actions — push to `main` → build → deploy

## Development

```bash
pnpm install
pnpm dev        # browser-sync dev server on localhost:3000
pnpm build      # production build → packages/blog/dist/
pnpm typecheck  # TypeScript verification
```

## Project Structure

```
packages/blog/
├── posts/           # Markdown blog posts
├── public/          # Static assets (icons, images, CNAME)
└── src/
    ├── pipeline/    # Build scripts (prod, dev, build steps)
    ├── lib/         # Markdown, frontmatter, paths, fs utilities
    ├── templates/   # Page shell, post, index, about, RSS
    ├── client/      # @nisli/core components (theme toggle)
    └── styles/      # Vanilla CSS — warm cream/dark palette
```

## License

MIT
