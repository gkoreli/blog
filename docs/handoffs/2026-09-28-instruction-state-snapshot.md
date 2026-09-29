# Historical State Moved Out of AGENTS.md

Preserved on 2026-09-28 from the accumulated root instructions. The sections below retain their old wording, including stale “Current State” and “Next” labels; they are history, not a newly verified status report or authorization to repeat operations.

For current work, inspect the relevant task and latest dated receipt. The old blanket MIT statement is superseded by [LICENSE](../../LICENSE); “first post published” is an early milestone; `TASK-0477` is an unresolved legacy identifier, not a task present in this repository. Series support already exists in the [series contract](../../.agents/skills/article-discovery-positioning/references/series-and-cross-references.md), so the future list is not a fresh implementation request.

Resume links: [newsletter worklist](../../packages/blog/drafts/research/newsletter-reliability/00-worklist-index.md), [newsletter handoff](../../packages/blog/drafts/research/newsletter-reliability/14-handoff.md), [analytics handoff](../../packages/blog/drafts/research/d1-read-budget/03-handoff.md).

## Current State

- **Repo**: https://github.com/gkoreli/blog
- **Structure**: pnpm monorepo — `packages/blog` is the site
- **Domain**: `gkoreli.com` (bought on Cloudflare)
- **Domain (reserved)**: `gogakoreli.com` (separate project later)
- **License**: MIT
- **Branch**: `main`
- **Status**: Live at gkoreli.com — design system complete, first post published, CI/CD active
- **Done**: SSG pipeline, shiki dual themes, theme toggle, sidebar nav, SVG icon set, Georgian გკ logo/favicon, Zod frontmatter validation, warm cream/dark palette, Lora serif typography, Cloudflare Workers deploy, Cloudflare DNS, RSS feed, llms.txt, OG image generation (satori + resvg), about page, 404 redirect, blog-writing agent skill, prompt transparency feature, deployed edge-observed cookieless analytics with source-marked legacy continuity and reader-first `/stats` (ADR-0016), SEO discoverability layer (ADR-0006 Phase 1: sitemap.xml, llms.txt, llms-full.txt, posts.json, .md endpoints, JSON-LD, canonical URLs, og:url), `_headers` UTF-8 charset fix for .txt/.md files, responsive layout with burger menu (ADR-0007: intrinsic grid, one media query, `<nisli-burger-menu>` web component)
- **Next**: Write more content; @nisli/core SSR (TASK-0477)

## Tech Stack

- **Framework**: `@nisli/core` (npm dependency)
- **Package manager**: pnpm (enforced via `packageManager` field)
- **Content**: Markdown + YAML frontmatter in `posts/`
- **Hosting**: Cloudflare Workers (static assets)
- **DNS/CDN/SSL**: Cloudflare
- **CI/CD**: Cloudflare Git integration (auto-deploy on push)
- **Analytics**: Edge-observed cookieless analytics — `@gkoreli/analytics` on Cloudflare Workers + D1, with source-marked legacy browser-beacon continuity, a public uPlot `/stats` dashboard, and a UTC reporting contract (ADR-0016). Date/window utilities: `packages/analytics/src/dates.ts`. Cloudflare Web Analytics remains a separate disclosed performance feed. Observability logs enabled in `wrangler.jsonc`.

## Newsletter State and Future Vision

The newsletter uses D1, Resend, and Turnstile. Goga chose to keep his platform; the earlier managed-service recommendation was not a selected migration. The [subscription worklist index](../../packages/blog/drafts/research/newsletter-reliability/00-worklist-index.md) holds the protection design, code/test receipts, article and research Markdown. Both public confirmation routes must share transactional admission, and retries must preserve the provider key/body and valid email links. Newsletter migration 0005 is applied; inspect the receipt before any repeat; migration 0002 is an old-install patch, not a sequential fresh migration. Read [the verification receipt](../../packages/blog/drafts/research/newsletter-reliability/10-verification.md) before claiming deployment or complete signup acceptance. A fresh September 9 invalid-secret failure was repaired by installing the existing recognized secret in the Worker; the [authorized live flow](../../packages/blog/drafts/research/newsletter-reliability/15-live-signup-acceptance.md) then completed and left the address active. This supersedes the earlier acceptance-pending checkpoint, not every historical availability question. Do not repeat a key change from old captures alone. Gmail Spam placement, provider webhook connection, general diagnostic-ingestion protection and historical recovery remain separate unfinished tasks. The article draft is outside `posts/` and unpublished.

- Reliable newsletter signup, confirmation delivery, and recoverable failure handling
- Series/tags for organizing content by topic
- The blog becomes the public face of the `gkoreli` builder identity — connecting GitHub, npm, and writing into one coherent presence
