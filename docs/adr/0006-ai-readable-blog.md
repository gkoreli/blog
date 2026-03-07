# ADR-0006: AI-Readable Blog — llms.txt, Content API, AI Traffic Intelligence

## Status

Proposed — 2026-03-07

## Context

ADR-0004 deployed cookieless analytics with AI agent classification. ADR-0005 deployed a public `/stats` dashboard. The blog already distinguishes human, bot, and AI visitors — but only stores a type flag (0/1/2), not which agent. And while the blog is transparent to humans (public stats), it's opaque to AI agents — no structured way to discover or consume content.

### The Vision

```
Phase 1 (ADR-0004): Collect data transparently     — cookieless, open-source
Phase 2 (ADR-0005): Show data transparently         — public /stats dashboard
Phase 3 (ADR-0006): Serve content transparently      — llms.txt, content API, AI traffic intelligence
```

Humans get the stats page. AI agents get `llms.txt` + structured API. Both are first-class citizens.

### What We Have Today

**AI classification** (`packages/analytics/src/classify.ts`):
- 15 named AI crawlers in regex: GPTBot, ClaudeBot, Claude-Web, CCBot, ChatGPT, Amazonbot, Applebot-Extended, Bytespider, TikTokSpider, GoogleOther, Google-CloudVertexBot, Meta-ExternalAgent, DuckAssistBot, PetalBot, PerplexityBot, Cohere-AI
- Source: Cloudflare's "Block AI Bots" list
- Stored as `visitor_type = 2` — we don't store WHICH agent

**Content metadata** (`packages/blog/src/lib/frontmatter.ts`):
- PostMeta: `{ title, date, description, tags, slug, promptCount }`
- Markdown source files in `packages/blog/posts/`
- Build pipeline has full metadata at build time

### Landscape Research (Verified)

**llms.txt adoption** (checked March 2026):
- Docs sites with llms.txt: Stripe (`docs.stripe.com/llms.txt`), Vercel (`vercel.com/llms.txt`), Cloudflare (`developers.cloudflare.com/llms.txt`) — mainstream for documentation
- Personal blogs with llms.txt: **none found**. Checked simonwillison.net, kentcdodds.com, joshwcomeau.com, jvns.ca — all return 404. We'd be among the first personal blogs.
- Framework plugins: `@4hse/astro-llms-txt` (17⭐), `astro-llms-generate` (15⭐), `sphinx-llms-txt` (27⭐). Small but growing ecosystem.
- Spec author: Jeremy Howard (fast.ai), published Sep 2024. Spec at llmstxt.org.

**Markdown endpoints** (verified):
- Stripe serves clean markdown at `.md` URLs: `docs.stripe.com/testing.md` returns pure markdown, no HTML
- Vercel serves markdown with frontmatter at `.md` URLs: `vercel.com/docs/getting-started-with-vercel.md`
- This is the pattern the llms.txt spec proposes. Real sites implement it.

**AI crawler landscape** (verified):
- `ai-robots-txt/ai.robots.txt` (3,712⭐): The definitive list. **137 AI agents** in `robots.json` with structured metadata (operator, function, description). Categories: AI Data Scrapers (18), AI Assistants (16), AI Search Crawlers (9), AI Agents (8), Undocumented (7).
- Our `AI_CRAWLERS` regex has **15 agents** — covering only 11% of the known landscape. Major gap.
- `knownagents.com` (formerly darkvisitors.com): The authority on AI crawler tracking. Provides API for robots.txt generation.

**AI traffic analytics** (verified):
- **Nobody does this as a dashboard feature.** Searched GitHub for "ai crawler analytics dashboard", "ai traffic analytics", "ai_fetches", "ai_reads". Zero results. Checked Plausible source for AI/bot/crawler classification — none. Counterscale — none.
- Our "AI Reads" metric on `/stats` is already unique. Breaking it down by agent name would be genuinely novel.

**foragents.dev** (verified — the most advanced "agent-first" site):
- UA-based agent detection → redirect to `/llms.txt` automatically
- `/.well-known/agent.json` — agent identity card (emerging standard)
- Dual format: `.md` and `.json` for every endpoint
- Agent inbox, registration, comments, ratings
- Built by Reflectt AI, Next.js 15, Supabase
- This is a full agent platform — far beyond what we need, but validates the direction

**Three-tier llms.txt pattern** (from `@4hse/astro-llms-txt`):
- `llms.txt` — index with links to content
- `llms-small.txt` — structure only (headings + lists, ultra-compact for limited context)
- `llms-full.txt` — full content concatenation (for large-context models or RAG)

## Proposals

### Proposal A: llms.txt + Markdown Endpoints (Content Layer)

Generate at build time — zero runtime cost, static files served by Cloudflare CDN:

1. **`/llms.txt`** — site description, post index with titles/dates/descriptions, links to `.md` versions, API endpoints, source code link. Follows the llmstxt.org spec format (H1, blockquote, H2 sections with file lists).

2. **`/llms-full.txt`** — full content of all posts concatenated with `---` separators. For large-context models and RAG pipelines. Includes post metadata (title, date, tags) as headers before each post's content.

3. **`/{slug}.md`** — clean markdown version of each post. Raw source content without frontmatter. Stripe and Vercel already serve this pattern. For our blog: copy post markdown (strip YAML frontmatter) to `dist/{slug}.md` at build time.

4. **`/api/posts.json`** — JSON index of all posts. Static file, not a Worker route. Schema:
```json
[{ "slug": "...", "title": "...", "date": "...", "description": "...", "tags": [...], "url": "/slug/", "markdown": "/slug.md" }]
```

**What this enables**: AI agents can `curl gkoreli.com/llms.txt` to discover content, then `curl gkoreli.com/the-agentic-product-engineer.md` to read it as clean markdown. No HTML parsing. No scraping.

### Proposal B: AI Traffic Intelligence (Analytics Layer)

1. **Extract agent name from UA** at classification time. The `AI_CRAWLERS` regex already identifies agents — just capture the match group. Store in new `agent_name TEXT` column on `page_views` (NULL for humans/bots).

2. **Expand the AI crawler list**. Our regex has 15 agents. The `ai-robots-txt/ai.robots.txt` project tracks 137. We don't need all 137 — many are obscure. But we should cover the top ~30-40 that are commonly encountered. Source the list from `robots.json` (structured, maintained, 3.7K⭐).

3. **New stats response field**: `by_agent` in the `/api/stats` response:
```json
"by_agent": [{ "agent": "GPTBot", "views": 12 }, { "agent": "ClaudeBot", "views": 8 }]
```

4. **New dashboard section**: "AI Agents" — ranked list showing which agents read what. Same percentage-width bar pattern as pages/referrers/countries.

**Schema migration**: `ALTER TABLE page_views ADD COLUMN agent_name TEXT` — safe for D1, existing rows get NULL.

### Proposal C: Content API (Programmatic Access)

Already covered by Proposal A — `dist/api/posts.json` is generated at build time. No separate implementation needed.

## Decision

**All three proposals, in order: A → B → C.**

A makes content discoverable. B makes AI consumption measurable. C is a byproduct of A.

A first because: lowest effort (build-time generation, no Worker changes, no schema migration), highest novelty (first personal blog with llms.txt), and it's the foundation — without discoverability, there's nothing to measure.

## Anti-Patterns

1. **❌ Dynamic llms.txt generation**: llms.txt is content metadata — generate at build time, serve as static file. Don't route through a Worker. Same reason we don't generate HTML at runtime. Stripe and Vercel serve theirs as static files.

2. **❌ Storing full UA string for AI agents**: UA strings are 100+ chars of redundant browser engine info. Extract and store just the agent name ("GPTBot", "ClaudeBot"). The classification regex already identifies them — capture the match, discard the rest.

3. **❌ Maintaining our own AI crawler list**: The `ai-robots-txt/ai.robots.txt` project (3.7K⭐) maintains a structured `robots.json` with 137 agents, updated via PRs. Don't maintain a parallel list — source from theirs. Our regex is already 9x incomplete.

4. **❌ Separate AI analytics table**: Don't create a new table for AI traffic. Add `agent_name` column to existing `page_views`. A page view is a page view — the `visitor_type` + `agent_name` columns together give full classification.

5. **❌ Blocking AI agents then tracking them**: Some sites block AI crawlers via robots.txt then complain about AI traffic. We do the opposite — welcome agents, serve them optimized content, and transparently track usage. Consistency with the transparency-first ethos.

6. **❌ llms-full.txt with HTML**: The full content file must be clean markdown. AI agents parse markdown better than HTML. We already have the markdown source — don't convert HTML back to markdown.

7. **❌ Worker endpoint for static data**: `GET /api/posts.json` should be a static file (`dist/api/posts.json`), not a Worker route. Static files are cached by Cloudflare CDN, cost nothing, and never fail.

8. **❌ Overengineering agent detection**: foragents.dev redirects agents to `/llms.txt` based on UA sniffing. For a personal blog, this is unnecessary complexity. Agents that know about llms.txt will request it directly. Agents that don't won't benefit from a redirect. Keep it simple — just serve the file.

## Gotchas

1. **llms.txt must be at root path**: `/llms.txt`, not `/api/llms.txt`. The spec requires root path. Our Cloudflare Workers `assets` binding serves static files from `dist/` — so `dist/llms.txt` → `gkoreli.com/llms.txt`. Verified: this is how Stripe and Vercel serve theirs.

2. **Markdown endpoints and trailing slashes**: Blog uses `/{slug}/` (trailing slash, `index.html`). The `.md` endpoint should be `/{slug}.md` (no trailing slash, direct file). Both coexist in Cloudflare's asset serving. `dist/the-agentic-product-engineer/index.html` and `dist/the-agentic-product-engineer.md` are separate files.

3. **Agent name extraction from regex**: Current `AI_CRAWLERS` regex uses `|` alternation without capture groups. To extract the agent name, use a named capture group: `/(?<agent>GPTBot|ClaudeBot|...)/i` then `match.groups.agent`. Or match against individual patterns. Named group is cleaner.

4. **D1 ALTER TABLE is safe for nullable columns**: `ALTER TABLE page_views ADD COLUMN agent_name TEXT` — existing rows get NULL. No data migration needed. D1 supports this. But there's no transactional DDL — if migration fails, manual cleanup needed.

5. **Frontmatter stripping for .md endpoints**: Post source files have YAML frontmatter between `---` delimiters. The `.md` endpoint should serve clean markdown without frontmatter. Strip at build time with a simple regex: `content.replace(/^---[\s\S]*?---\n/, '')`.

6. **llms-full.txt size growth**: Concatenating all posts produces a file that grows with every post. For 1-5 posts: fine (<50KB). At 100+ posts: consider the llms.txt spec's "Optional" section for secondary content, or truncate to recent posts. The `@4hse/astro-llms-txt` plugin handles this with `include` glob patterns.

7. **AI agent UA strings evolve constantly**: New agents appear regularly. The `ai-robots-txt/ai.robots.txt` project gets PRs weekly. Our regex will go stale. Options: (a) periodic manual updates from `robots.json`, (b) log unclassified UAs that lack standard browser engine strings for manual review, (c) fetch `robots.json` at build time and generate the regex. Option (a) is simplest for now.

8. **Cache invalidation for llms.txt**: Generated at build time, deployed as static file. Cloudflare CDN caches it. After deploy, old version may be served for up to the TTL. For a blog that deploys infrequently, this is fine. The `cache-control` header on static assets controls this.

9. **robots.json has 137 agents but many are obscure**: Don't blindly import all 137 into our regex. Many are defunct, regional, or extremely rare. Start with the top ~30-40 that are commonly encountered. The `robots.json` includes a `function` field that helps categorize — prioritize "AI Assistants" and "AI Search Crawlers" over "AI Data Scrapers".

## Best Practices

1. **✅ Build-time generation for all content metadata**: llms.txt, llms-full.txt, posts.json, .md files — all generated by the existing build pipeline. Zero runtime cost. The pipeline already has all post metadata and markdown source.

2. **✅ Agent name as a derived field**: Extract agent name from UA at write time (in `handleEvent`), not at query time. Store once, query cheaply. Avoids regex matching on every stats query.

3. **✅ Source AI crawler list from community-maintained project**: `ai-robots-txt/ai.robots.txt` (3.7K⭐) maintains `robots.json` with structured metadata. Don't maintain a parallel list. Periodically sync the top agents.

4. **✅ llms.txt links to .md endpoints, not HTML**: AI agents follow links to get clean markdown. HTML versions are for humans. This is the pattern Stripe uses — `llms.txt` links to `testing.md`, not `testing`.

5. **✅ Same build pipeline, more outputs**: Don't create a separate build step. Extend `buildHTML()` to also generate llms.txt, .md files, and posts.json. One pipeline, multiple output formats.

6. **✅ Three-tier content for different context budgets**: `llms.txt` (index, ~1KB), `llms-full.txt` (all content, ~50KB), individual `.md` files (~5KB each). Agents choose based on their context window. Pattern from `@4hse/astro-llms-txt`.

7. **✅ Nullable column for agent_name**: Only AI visitors (visitor_type=2) have an agent_name. Humans and bots get NULL. Clean data model.

8. **✅ Transparency footer links to llms.txt**: The stats page already has "Analytics collected without cookies..." footer. Add: "AI agents: see our [llms.txt](/llms.txt)". Meta-transparency.

## Implementation Sketch

### Phase A: llms.txt + Markdown Endpoints

**Files to create/modify:**
- `packages/blog/src/templates/llms.ts` — generate llms.txt and llms-full.txt content from post metadata
- `packages/blog/src/pipeline/build.ts` — add llms.txt, llms-full.txt, .md files, posts.json to build output
- No new dependencies. No Worker changes. No client JS. No schema migration.

**Build output additions:**
```
dist/llms.txt                              — site index (~1KB)
dist/llms-full.txt                         — full content (~50KB)
dist/api/posts.json                        — JSON post index
dist/the-agentic-product-engineer.md       — clean markdown per post
```

### Phase B: AI Traffic Intelligence

**Files to modify:**
- `packages/analytics/src/classify.ts` — return agent name alongside type, expand regex from 15 to ~30-40 agents
- `packages/analytics/src/db.ts` — add agent_name to PageView interface and INSERT
- `packages/analytics/src/stats.ts` — add `by_agent` to StatsResponse and query
- `packages/analytics/schema.sql` — add agent_name column
- `packages/blog/src/client/stats.ts` — add "AI Agents" section to dashboard
- `packages/blog/src/templates/stats.ts` — add skeleton for AI Agents section
- D1 migration: `ALTER TABLE page_views ADD COLUMN agent_name TEXT`

## Adjacent Ideas (Future)

Ideas that emerged during exploration but are out of scope for this ADR:

- **`/.well-known/agent.json`**: Agent identity card (emerging standard from foragents.dev). Describes the site to AI agents in structured JSON. More formal than llms.txt. Worth watching but premature for a personal blog.
- **Agent-aware routing**: foragents.dev redirects agents to `/llms.txt` based on UA. Interesting but overengineered for our use case. Agents that know about llms.txt will request it directly.
- **Reading engagement**: Scroll depth + time on page via beacon events. Answers "do people actually read the posts or just skim?"
- **Data lifecycle**: Retention policy (archive old rows to R2), data export (CSV download from /stats).
- **Period comparison**: "This week vs last week" on the dashboard.
- **Structured data (JSON-LD)**: schema.org Article markup on blog posts. Build-time generation.
- **AI crawler list auto-sync**: Fetch `robots.json` from `ai-robots-txt/ai.robots.txt` at build time and generate the classification regex automatically. Keeps the list current without manual updates.

## References

- [ADR-0004: Analytics](./0004-analytics.md) — data collection layer
- [ADR-0005: Stats Dashboard](./0005-stats-dashboard.md) — public dashboard
- [llms.txt specification](https://llmstxt.org/) — Jeremy Howard, Sep 2024
- [Stripe llms.txt](https://docs.stripe.com/llms.txt) — reference implementation (docs site)
- [Vercel llms.txt](https://vercel.com/llms.txt) — reference implementation (docs site)
- [Cloudflare llms.txt](https://developers.cloudflare.com/llms.txt) — reference implementation (per-product)
- [ai-robots-txt/ai.robots.txt](https://github.com/ai-robots-txt/ai.robots.txt) — 3.7K⭐, 137 AI agents, structured robots.json
- [knownagents.com](https://knownagents.com) (formerly darkvisitors.com) — AI crawler authority
- [@4hse/astro-llms-txt](https://github.com/4hse/astro-llms-txt) — three-tier llms.txt pattern (index, small, full)
- [foragents.dev](https://foragents.dev) — agent-first site with llms.txt, agent.json, dual-format API
- [Cloudflare "Block AI Bots" list](https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/) — source of our current AI_CRAWLERS regex
- Live: [gkoreli.com/stats](https://gkoreli.com/stats/)
