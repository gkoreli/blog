# AI-citations rewrite publication checks

September 11, 2026. These files record rendering and release preparation, not a citation-accuracy experiment. [Acceptance and review resolutions](../../32-ai-citations-rewrite-acceptance.md) owns the release status.

- `local-check.json`: checks the built article, metadata, RSS/sitemap dates, one glossary/source table, nineteen exact prompt messages, relative links, unchanged frozen footprint, and content hashes. Narrative word count includes the title and stops before the glossary; fourteen minutes uses 200 words per minute.
- `browser-check.json`: a local production preview in installed headless Google Chrome, with explicit device metrics at 1440×1000 and 390×844. It records viewport/document widths, heading count, and the table scrollers' client/content widths.
- `desktop.png`, `mobile.png`: the rewritten hero at those two viewport sizes.
- `mobile-body.png`: opening paragraph and findings on a phone viewport.
- `desktop-table.png`, `mobile-table.png`: the first numerical comparison and adjoining explanation. Tables fit the desktop article width and scroll inside their wrappers on mobile; the page itself has no horizontal overflow.

All five images were visually inspected. The final generated 1200×630 social image was also inspected in `dist/og/oss-radar-07-promptfoo.png`; that build output is reproducible and remains uncommitted. The native UI connection was unavailable, so the preview used a fresh temporary headless Chrome profile and its debugging protocol, without using a signed-in browser session.

The production checks were `pnpm -C packages/blog typecheck`, `pnpm -C packages/blog build`, and `git diff --check`. The preview used a local Python static server rooted at `packages/blog/dist`, then set explicit browser viewport dimensions, awaited loaded fonts, captured screenshots, and read document/table dimensions. Browser profiles were temporary; they contain no research or release source and are not part of this evidence set. Source methods, real answers, and code audits live in their separate artifacts.
