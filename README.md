# gkoreli.com

Personal engineering blog by [Goga Koreli](https://gkoreli.com). Agentic engineering, open source developer tools, and building in public.

Built with [@nisli/core](https://www.npmjs.com/package/@nisli/core) — a zero-dependency reactive web component framework.

> "Where excitement ends, depth begins."

## Read

- [117 Pull Requests Later, It Wasn’t a Task Manager Anymore](https://gkoreli.com/one-hundred-pull-requests)
- [ghx field notes](https://gkoreli.com/how-ghx-was-born)
- [All engineering articles](https://gkoreli.com/engineering)
- [Subscribe or follow the RSS feed](https://gkoreli.com/#dispatch)

## Projects

- [ghx](https://github.com/gkoreli/ghx) — auditable repository reconnaissance for coding agents
- [backlog-mcp](https://github.com/gkoreli/backlog-mcp) — local-first context, memory, and work history for agents
- [@nisli/core](https://www.npmjs.com/package/@nisli/core) — zero-dependency reactive web components

## Stack

- **Framework**: [@nisli/core](https://www.npmjs.com/package/@nisli/core) — signals, templates, web components
- **Content**: Markdown + YAML frontmatter in `posts/`
- **Prompts**: Raw author prompts in `prompts/` — rendered at `/{slug}/prompts`
- **Syntax highlighting**: [Shiki](https://shiki.style) — dual themes, build-time, zero client JS
- **Validation**: [Zod](https://zod.dev) — frontmatter schema validation at build time
- **Bundler**: [esbuild](https://esbuild.github.io) — JS + CSS bundling
- **Hosting**: Cloudflare Workers with static assets
- **CI/CD**: Cloudflare Workers Git integration — push to `main` → build → deploy

## Development

```bash
pnpm install
pnpm dev        # browser-sync dev server on localhost:3000
pnpm build      # production build → packages/blog/dist/
pnpm validate   # check all posts have valid frontmatter
pnpm typecheck  # TypeScript verification
```

## Project Structure

```
packages/blog/
├── posts/           # Markdown blog posts
├── prompts/         # Raw author prompts per post (transparency feature)
├── public/          # Static assets (icons, images, CNAME)
└── src/
    ├── pipeline/    # Build scripts (prod, dev, validate)
    ├── lib/         # Markdown, frontmatter, paths, fs utilities
    ├── templates/   # Page shell, post, index, about, prompts, RSS
    ├── client/      # @nisli/core components (theme toggle)
    └── styles/      # Vanilla CSS — warm cream/dark palette
```

Every post can have a companion `prompts/{slug}.prompts.md` file with the raw `---`-delimited prompts that shaped it. The build generates a dedicated prompts page at `/{slug}/prompts` and adds a "Thoughts by human, co-written by AI" link in the article header.

## License

This repository is dual-licensed:

- Source code is licensed under the [MIT License](./LICENSE-MIT).
- Blog posts, prompts, and images are licensed under [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International](./LICENSE-CC-BY-NC-ND-4.0).
