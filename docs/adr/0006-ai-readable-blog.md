# ADR-0006: Discoverability — Search Engines, AI Agents, and Transparent Content

## Status

Phase 1 deployed — 2026-03-07. Phase 2 (AI traffic intelligence) proposed.

## Problem Statement

The blog is invisible. 11 views, 4 visitors, 0 referrers, 0 AI fetches. Nobody links to us. No search engine has indexed us efficiently. No AI agent knows we exist.

The root cause is a missing discoverability layer. We have content and analytics, but no structured way for anything — search engines, AI agents, or aggregators — to discover, understand, or consume our content.

## The Vision

```
Phase 1 (ADR-0004): Collect data transparently      — cookieless, open-source
Phase 2 (ADR-0005): Show data transparently          — public /stats dashboard
Phase 3 (ADR-0006): Serve content transparently       — llms.txt, sitemap, structured data, AI tracking
```

Humans get the stats page. Search engines get sitemap.xml + JSON-LD. AI agents get `llms.txt` + `.md` endpoints. All are first-class citizens.

## Context

### What We Have

```
✅ Content:        1 blog post, about page, stats page
✅ Analytics:      Cookieless tracking, public dashboard (ADR-0004, ADR-0005)
✅ RSS feed:       /feed.xml (for RSS readers)
✅ robots.txt:     Sitemap reference, Allow: / (updated Phase 1)
✅ Open Graph:     og:title, og:description, og:type, og:image, og:url
✅ Canonical URLs: rel="canonical" on every page (self-referencing, absolute)
✅ sitemap.xml:    Auto-generated from post metadata at build time
✅ llms.txt:       AI agent index (llmstxt.org spec), auto-generated
✅ llms-full.txt:  Full content for RAG/large-context models, auto-generated
✅ .md endpoints:  /{slug}.md — clean markdown per post, frontmatter stripped
✅ posts.json:     Structured post index (JSON), auto-generated
✅ JSON-LD:        BlogPosting structured data on blog posts only
```

**AI classification** (`packages/analytics/src/classify.ts`):
- 15 named AI crawlers in regex: GPTBot, ClaudeBot, Claude-Web, CCBot, ChatGPT, Amazonbot, Applebot-Extended, Bytespider, TikTokSpider, GoogleOther, Google-CloudVertexBot, Meta-ExternalAgent, DuckAssistBot, PetalBot, PerplexityBot, Cohere-AI
- Source: Cloudflare's "Block AI Bots" list
- Stored as `visitor_type = 2` — we don't store WHICH agent

**Content metadata** (`packages/blog/src/lib/frontmatter.ts`):
- PostMeta: `{ title, date, description, tags, slug, promptCount }`
- Markdown source files in `packages/blog/posts/`
- Build pipeline has full metadata at build time

### What We're Missing

```
❌ AI agent names: We classify AI visitors but don't record WHICH agent
❌ Google Search Console: Sitemap not yet submitted to GSC
```

### Pain Points (Evidence-Based)

**Pain 1: Search engines can't find us efficiently.** Without `sitemap.xml`, Google relies on link-following to discover pages. With 0 inbound links, our pages may never be crawled. Simon Willison's blog has `sitemap.xml` referenced in `robots.txt` — standard practice. We don't.

**Pain 2: AI agents have no entry point.** When a user asks ChatGPT or Claude "what does gkoreli.com write about?", the agent has no structured way to answer. No `llms.txt`, no `.md` endpoints, no content API. The agent would have to fetch HTML and parse it — most won't bother.

**Pain 3: We can't distinguish AI agents.** Our `AI_CRAWLERS` regex has 15 agents. The definitive list tracks 137. We store `visitor_type=2` but not which agent. When AI traffic arrives, we'll see "AI Reads: 5" but not "3 from GPTBot, 2 from ClaudeBot." We're missing 12 Tier-1 agents from major AI products.

**Pain 4: Search results are generic.** Without JSON-LD `BlogPosting` markup, Google shows our pages with auto-extracted snippets instead of rich results (author, date, image). Trivial to fix — ~10 lines of template code from existing `PostMeta`.

## Landscape Research (Verified March 2026)

### llms.txt Adoption

- Docs sites with llms.txt: Stripe (`docs.stripe.com/llms.txt`), Vercel (`vercel.com/llms.txt`), Cloudflare (`developers.cloudflare.com/llms.txt`) — verified, all serve clean markdown index files. Mainstream for documentation.
- Personal blogs with llms.txt: **none found**. Checked simonwillison.net, kentcdodds.com, joshwcomeau.com, jvns.ca — all return 404. We'd be among the first personal blogs.
- Framework plugins: `@4hse/astro-llms-txt` (17⭐), `astro-llms-generate` (15⭐), `sphinx-llms-txt` (27⭐). Small but growing ecosystem.
- Spec author: Jeremy Howard (fast.ai), published Sep 2024. Spec at llmstxt.org.

### Markdown Endpoints

- Stripe serves clean markdown at `.md` URLs: `docs.stripe.com/testing.md` returns pure markdown, no HTML (verified)
- Vercel serves markdown with frontmatter at `.md` URLs: `vercel.com/docs/getting-started-with-vercel.md` (verified)
- This is the pattern the llms.txt spec proposes. Real sites implement it.

### Three-Tier llms.txt Pattern (from `@4hse/astro-llms-txt`)

- `llms.txt` — index with links to content (~1KB). For agents that need to understand what the site offers.
- `llms-small.txt` — structure only (headings + lists, ultra-compact). For agents with limited context windows.
- `llms-full.txt` — full content concatenation (~50KB). For large-context models, RAG pipelines, and offline indexing.

Different agents have different context budgets. The three-tier pattern lets each choose the right level of detail.

### AI Crawler Landscape

- `ai-robots-txt/ai.robots.txt` (3,712⭐): The definitive list. **137 AI agents** in structured `robots.json` with metadata (operator, function, description). Categories: AI Data Scrapers (50), AI Assistants (20), AI Search Crawlers (22), AI Agents (17), Other (28).
- Our `AI_CRAWLERS` regex has **15 agents** — covering only 11% of the known landscape. Major gap.
- `knownagents.com` (formerly darkvisitors.com): The authority on AI crawler tracking. Provides API for robots.txt generation. Recently rebranded.

### AI Traffic Analytics

- **Nobody does this as a dashboard feature.** Searched GitHub for "ai crawler analytics dashboard", "ai traffic analytics", "ai_fetches", "ai_reads". Zero results. Checked Plausible source for AI/bot/crawler classification — none. Counterscale — none.
- Our "AI Reads" metric on `/stats` is already unique. Breaking it down by agent name would be genuinely novel.

### foragents.dev (The Most Advanced Agent-First Site)

- UA-based agent detection → redirect to `/llms.txt` automatically
- `/.well-known/agent.json` — agent identity card (emerging standard)
- Dual format: `.md` and `.json` for every endpoint
- Agent inbox, registration, comments, ratings
- Built by Reflectt AI, Next.js 15, Supabase
- This is a full agent platform — far beyond what we need, but validates the direction that treating AI agents as first-class consumers is a real and growing pattern.

## Decision

Build the complete discoverability stack in one pass. Four complementary layers:

| Layer | For | Format | Effort |
|-------|-----|--------|--------|
| `sitemap.xml` + `robots.txt` | Search engines | XML | Trivial (same pattern as feed.xml) |
| `llms.txt` + `.md` endpoints + `posts.json` | AI agents | Markdown + JSON | Low (build-time, static files) |
| JSON-LD structured data | Search engines + AI | JSON in `<head>` | Trivial (~10 lines template) |
| AI agent name tracking | Our analytics | D1 column + regex | Medium (schema migration) |

### Why All Four Together

They form a discovery → consumption → measurement loop:
1. `sitemap.xml` + JSON-LD → search engines index us → humans find us via search
2. `llms.txt` + `.md` endpoints → AI agents discover and consume our content
3. AI agent tracking → we measure which agents read what

Building the tracking before the traffic arrives is intentional. Schema migrations are easier on a small table (11 rows). Every future AI visit captures the agent name from day 1. Can't retroactively add agent names to old rows.

### Why This Order

`sitemap.xml` first — it's the most impactful for a blog with 0 referrers. Search is our primary discovery channel. Then `llms.txt` + `.md` + JSON-LD (all build-time, no runtime cost). Then AI tracking (requires schema migration and code changes).

## Proposal A: Search Engine Discoverability

### sitemap.xml

Generate at build time from post metadata. Same pattern as `feed.xml` (already generated).

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://gkoreli.com/</loc></url>
  <url><loc>https://gkoreli.com/the-agentic-product-engineer/</loc><lastmod>2026-02-05</lastmod></url>
  <url><loc>https://gkoreli.com/about/</loc></url>
  <url><loc>https://gkoreli.com/stats/</loc></url>
</urlset>
```

### robots.txt update

Add sitemap reference (Simon Willison's pattern — also explicitly allows ChatGPT-User):
```
User-agent: *
Allow: /

Sitemap: https://gkoreli.com/sitemap.xml
```

### JSON-LD BlogPosting

Add to each blog post via `pageShell` head param (already exists from ADR-0005):
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "The Agentic Product Engineer",
  "datePublished": "2026-02-05",
  "author": { "@type": "Person", "name": "Goga Koreli", "url": "https://gkoreli.com/about" },
  "description": "...",
  "url": "https://gkoreli.com/the-agentic-product-engineer/",
  "image": "https://gkoreli.com/og/the-agentic-product-engineer.png"
}
```

Generated from `PostMeta` at build time. Goes in `<head>` as `<script type="application/ld+json">`.

## Proposal B: AI Agent Discoverability

### llms.txt

Generated at build time. Follows the llmstxt.org spec format (H1, blockquote, H2 sections with file lists):

```markdown
# gkoreli.com

> Engineering blog by Goga Koreli — agentic product engineering, AI agents, and building in public.

This blog explores what it means to build software with AI agents. Posts are written with AI assistance but are not AI slop — every idea is human-directed. The source code, analytics, and architecture decisions are all public.

## Blog Posts

- [The Agentic Product Engineer](https://gkoreli.com/the-agentic-product-engineer.md): Software engineering isn't going away — writing code without agents is.

## API

- [Public Analytics](https://gkoreli.com/api/stats): Real-time analytics data (JSON, no auth required)
- [Post Index](https://gkoreli.com/api/posts.json): All posts with metadata (JSON)
- [RSS Feed](https://gkoreli.com/feed.xml): Subscribe to new posts

## Source

- [GitHub Repository](https://github.com/gkoreli/blog): Full source code, ADRs, and build pipeline
- [Analytics ADR](https://github.com/gkoreli/blog/blob/main/docs/adr/0004-analytics.md): How the cookieless analytics work
- [Dashboard ADR](https://github.com/gkoreli/blog/blob/main/docs/adr/0005-stats-dashboard.md): How the /stats page was built
```

**What this enables**: AI agents can `curl gkoreli.com/llms.txt` to discover content, then `curl gkoreli.com/the-agentic-product-engineer.md` to read it as clean markdown. No HTML parsing. No scraping. No CAPTCHA.

### llms-full.txt

Full content of all posts concatenated. For large-context models and RAG:

```markdown
# gkoreli.com — Full Content

> Complete blog content for AI consumption. Individual posts available as .md files.

---

## The Agentic Product Engineer
Published: 2026-02-05
URL: https://gkoreli.com/the-agentic-product-engineer/

[full markdown content here]
```

### Markdown endpoints

`/{slug}.md` — clean markdown per post, frontmatter stripped. Generated at build time by copying post source and removing YAML frontmatter. Stripe and Vercel already serve this pattern.

### Content API

`/api/posts.json` — static JSON file, not a Worker route:
```json
[{
  "slug": "the-agentic-product-engineer",
  "title": "The Agentic Product Engineer",
  "date": "2026-02-05",
  "description": "Software engineering isn't going away...",
  "tags": ["ai", "engineering"],
  "url": "/the-agentic-product-engineer/",
  "markdown": "/the-agentic-product-engineer.md"
}]
```

## Proposal C: AI Traffic Intelligence

### Expand AI crawler regex

Current: 15 agents. Proposed: ~35 agents covering Tier 1 + Tier 2.

**Tier 1 — Major AI products** (users actively ask these to fetch content):
- OpenAI: `GPTBot`, `ChatGPT-User`, `OAI-SearchBot`
- Anthropic: `ClaudeBot`, `Claude-Web`, `Claude-User`, `Claude-SearchBot`
- Google: `Gemini-Deep-Research`, `Google-NotebookLM`, `GoogleOther`, `Google-CloudVertexBot`
- Perplexity: `PerplexityBot`
- Amazon: `Amazonbot`, `Amzn-SearchBot`
- Meta: `Meta-ExternalAgent`, `Meta-ExternalFetcher`
- Apple: `Applebot-Extended`

**Tier 2 — Notable AI search/assistants:**
- `Bravebot`, `DuckAssistBot`, `MistralAI-User`, `Devin`, `Manus-User`, `kagi-fetcher`, `TavilyBot`, `PhindBot`, `YouBot`, `ExaBot`

**Tier 3 — Training crawlers** (classify as AI but lower analytics priority):
- `CCBot`, `Bytespider`, `TikTokSpider`, `Cohere-AI`, `PetalBot`

Source: `ai-robots-txt/ai.robots.txt` `robots.json` (3,712⭐, 137 agents).

### Extract and store agent name

Change `classifyVisitor` to return `{ type: VisitorType, agent: string | null }`. Use named capture group in regex: `/(?<agent>GPTBot|ClaudeBot|...)/i` → `match.groups.agent`. Store in new `agent_name TEXT` column (NULL for humans/bots).

### Dashboard section

New `by_agent` field in stats response. New "AI Agents" section on `/stats` — same ranked list pattern as pages/referrers/countries.

**Schema migration**: `ALTER TABLE page_views ADD COLUMN agent_name TEXT` — safe for D1, existing rows get NULL.

## Anti-Patterns

1. **❌ Dynamic llms.txt**: Content metadata — generate at build time, serve as static file. Stripe and Vercel do this. Don't route through a Worker. Same reason we don't generate HTML at runtime.

2. **❌ Maintaining our own AI crawler list**: `ai-robots-txt/ai.robots.txt` (3.7K⭐) maintains 137 agents with structured metadata, updated via PRs. Don't maintain a parallel list — source from theirs, curate to ~35 agents. Our regex is already 9x incomplete.

3. **❌ Storing full UA string**: Extract just the agent name ("GPTBot", "ClaudeBot"). UA strings are 100+ chars of redundant browser engine info. The classification regex already identifies them — capture the match, discard the rest.

4. **❌ Separate AI analytics table**: Add `agent_name` column to existing `page_views`. A page view is a page view — the `visitor_type` + `agent_name` columns together give full classification.

5. **❌ Blocking AI agents then tracking them**: Some sites block AI crawlers via robots.txt then complain about AI traffic. We do the opposite — welcome agents, serve them optimized content, and transparently track usage. Consistency with the transparency-first ethos.

6. **❌ llms-full.txt with HTML**: The full content file must be clean markdown. AI agents parse markdown better than HTML. We already have the markdown source — don't convert HTML back to markdown.

7. **❌ Worker endpoint for static data**: `posts.json`, `llms.txt`, `sitemap.xml` — all static files. CDN-cached, zero cost, never fail.

8. **❌ Overengineering agent detection**: foragents.dev redirects agents to `/llms.txt` via UA sniffing. Unnecessary for a personal blog. Agents that know about llms.txt will request it directly. Agents that don't won't benefit from a redirect.

9. **❌ Importing all 137 agents**: Many are defunct, regional, or extremely rare. Start with ~35 (Tier 1 + 2). The `robots.json` `function` field helps categorize — prioritize "AI Assistants" and "AI Search Crawlers" over "AI Data Scrapers".

10. **❌ JSON-LD on non-article pages**: Only blog posts get `BlogPosting` markup. The homepage, about page, and stats page don't need it — they're not articles.

## Gotchas

1. **llms.txt must be at root path**: `/llms.txt`, not `/api/llms.txt`. Spec requires root. `dist/llms.txt` → `gkoreli.com/llms.txt` via Cloudflare assets binding. Verified: this is how Stripe and Vercel serve theirs.

2. **Markdown endpoints and trailing slashes**: Blog uses `/{slug}/` (trailing slash, `index.html`). The `.md` endpoint is `/{slug}.md` (no trailing slash, direct file). Both coexist as separate files in `dist/`.

3. **Agent name extraction needs capture group**: Current regex uses `|` alternation without capture. Change to named group: `/(?<agent>GPTBot|ClaudeBot|...)/i` → `match.groups.agent`.

4. **D1 ALTER TABLE is safe for nullable columns**: `ALTER TABLE page_views ADD COLUMN agent_name TEXT` — existing rows get NULL. No data migration. But there's no transactional DDL in D1 — if migration fails, manual cleanup needed.

5. **Frontmatter stripping**: Post source has YAML frontmatter between `---` delimiters. `.md` endpoint serves content without it. Strip with: `content.replace(/^---[\s\S]*?---\n/, '')`.

6. **llms-full.txt grows with every post**: Fine for 1-5 posts (<50KB). At 100+, use the spec's "Optional" section or truncate to recent posts. The `@4hse/astro-llms-txt` plugin handles this with `include` glob patterns.

7. **AI agent UAs evolve constantly**: New agents appear weekly. The `ai-robots-txt/ai.robots.txt` project gets PRs weekly. Options: (a) periodic manual sync from `robots.json`, (b) log unclassified UAs for review, (c) auto-generate regex from `robots.json` at build time. Start with (a).

8. **Cache invalidation for llms.txt**: Generated at build time, deployed as static file. Cloudflare CDN caches it. After deploy, old version may be served for up to the TTL. For a blog that deploys infrequently, this is fine.

9. **sitemap.xml lastmod accuracy**: `lastmod` should reflect actual content changes, not build time. Use the post's `date` field from frontmatter. For non-post pages (about, stats), omit `lastmod`.

10. **JSON-LD must be valid JSON**: Template interpolation with special characters (quotes, ampersands in descriptions) can produce invalid JSON. Use `JSON.stringify()` to generate the entire block, not string concatenation.

11. **robots.txt is in `public/` not generated**: Currently `public/robots.txt` is copied as-is to `dist/`. To add the Sitemap reference, either modify the static file or generate it in the build pipeline. Modifying the static file is simpler.

12. **robots.json has 137 agents but many are obscure**: Don't blindly import all 137 into our regex. Many are defunct, regional, or extremely rare. The `robots.json` includes a `function` field — prioritize "AI Assistants" and "AI Search Crawlers" over "AI Data Scrapers".

13. **Canonical URL must use absolute path with correct trailing slash**: Our blog uses trailing slashes (`/slug/`). Cloudflare 307-redirects `/slug` → `/slug/`. The canonical must be the final URL (`https://gkoreli.com/slug/`), not the redirected one. Mismatched canonicals are the #1 cause of "Google chose a different canonical" warnings in Search Console.

14. **Prompts sub-pages need their own canonical**: The prompts page at `/{slug}/prompts/` must not inherit the parent post's canonical. Each page gets its own self-referencing canonical. We caught this during implementation — `currentSlug` was set to the parent post slug, producing a wrong canonical.

## Best Practices

1. **✅ Build-time generation for all metadata**: sitemap.xml, llms.txt, llms-full.txt, posts.json, .md files, JSON-LD — all from the existing build pipeline. Zero runtime cost. The pipeline already has all post metadata and markdown source.

2. **✅ One pipeline, multiple output formats**: Don't create separate build steps. Extend `buildHTML()` to generate all formats. The pipeline already has all post metadata.

3. **✅ Agent name as a derived field**: Extract from UA at write time (in `handleEvent`), not at query time. Store once, query cheaply. Avoids regex matching on every stats query.

4. **✅ Source crawler list from community project**: `ai-robots-txt/ai.robots.txt` (3.7K⭐). Curate to ~35 agents. Periodically sync.

5. **✅ Three-tier content for different context budgets**: `llms.txt` (~1KB index), `llms-full.txt` (~50KB all content), individual `.md` files (~5KB each). Agents choose based on their context window. Pattern from `@4hse/astro-llms-txt`.

6. **✅ llms.txt links to .md endpoints, not HTML**: AI agents follow links to get clean markdown. HTML versions are for humans. This is the pattern Stripe uses — `llms.txt` links to `testing.md`, not `testing`.

7. **✅ Nullable column for agent_name**: Only AI visitors (visitor_type=2) have an agent_name. Humans and bots get NULL. Clean data model.

8. **✅ Transparency footer links to llms.txt**: Stats page footer: "AI agents: see our [llms.txt](/llms.txt)". Meta-transparency.

9. **✅ JSON-LD from JSON.stringify**: Generate the entire `<script type="application/ld+json">` block via `JSON.stringify()`, not template literals. Guarantees valid JSON regardless of content.

10. **✅ Self-referencing canonical URLs on every page**: `<link rel="canonical" href="...">` with absolute URL and trailing slash matching the actual URL. Without this, Google may index both `/slug` and `/slug/` as separate pages, diluting signals. Canonical is P0 in every SEO checklist — stronger signal than sitemap for deduplication.

11. **✅ og:url matches canonical**: Social platforms use `og:url` to determine the canonical URL for sharing. Must match `rel="canonical"` exactly. Without it, shares may point to wrong URL variants.

12. **✅ Sitemap only includes indexable canonical URLs**: Every URL in `sitemap.xml` must be the canonical version (trailing slash, HTTPS). Don't include redirected variants, noindex pages, or parameter URLs. Google treats sitemap inclusion as a weak canonical signal — keep it consistent with `rel="canonical"`.

13. **✅ Validate JSON-LD with Google Rich Results Test**: Schema errors are silent — they don't break the page, they just prevent rich results. Always validate at `search.google.com/test/rich-results` after any schema change. Common errors: wrong date format, missing required properties, conflicting `@type`.

## Implementation Sketch

### Phase 1: Search Engine + AI Discoverability (build-time only)

**Files to create/modify:**
- `packages/blog/src/templates/llms.ts` — generate llms.txt, llms-full.txt content
- `packages/blog/src/templates/sitemap.ts` — generate sitemap.xml
- `packages/blog/src/templates/post.ts` — add JSON-LD to blog post head
- `packages/blog/src/pipeline/build.ts` — generate all new output files
- `packages/blog/public/robots.txt` — add Sitemap reference

**Build output additions:**
```
dist/llms.txt                              — AI agent index
dist/llms-full.txt                         — full content for RAG
dist/sitemap.xml                           — search engine index
dist/api/posts.json                        — JSON post index
dist/the-agentic-product-engineer.md       — clean markdown per post
```

No new dependencies. No Worker changes. No client JS. No schema migration.

### Phase 2: AI Traffic Intelligence

**Files to modify:**
- `packages/analytics/src/classify.ts` — expand regex (15 → ~35 agents), return agent name alongside type
- `packages/analytics/src/db.ts` — add agent_name to PageView interface and INSERT
- `packages/analytics/src/stats.ts` — add `by_agent` to StatsResponse and query
- `packages/analytics/schema.sql` — add agent_name column
- `packages/blog/src/client/stats.ts` — add "AI Agents" dashboard section
- `packages/blog/src/templates/stats.ts` — add skeleton for AI Agents section
- D1 migration: `ALTER TABLE page_views ADD COLUMN agent_name TEXT`

## Adjacent Ideas (Future)

Ideas that emerged during exploration but are out of scope for this ADR:

- **`/.well-known/agent.json`**: Agent identity card (emerging standard from foragents.dev). Describes the site to AI agents in structured JSON. More formal than llms.txt. Worth watching but premature for a personal blog.
- **Agent-aware routing**: foragents.dev redirects agents to `/llms.txt` based on UA. Interesting pattern but overengineered for our use case. Agents that know about llms.txt will request it directly.
- **AI crawler list auto-sync**: Fetch `robots.json` from `ai-robots-txt/ai.robots.txt` at build time and generate the classification regex automatically. Keeps the list current without manual updates.
- **Reading engagement**: Scroll depth + time on page via beacon events. Answers "do people actually read the posts or just skim?"
- **Data lifecycle**: Retention policy (archive old rows to R2), data export (CSV download from /stats).
- **Period comparison**: "This week vs last week" on the dashboard.

## References

- [ADR-0004: Analytics](./0004-analytics.md) — data collection layer
- [ADR-0005: Stats Dashboard](./0005-stats-dashboard.md) — public dashboard
- [llms.txt specification](https://llmstxt.org/) — Jeremy Howard, Sep 2024
- [Stripe llms.txt](https://docs.stripe.com/llms.txt) — verified, serves clean markdown index
- [Stripe .md endpoints](https://docs.stripe.com/testing.md) — verified, serves pure markdown
- [Vercel llms.txt](https://vercel.com/llms.txt) — verified
- [Cloudflare llms.txt](https://developers.cloudflare.com/llms.txt) — verified, per-product structure
- [ai-robots-txt/ai.robots.txt](https://github.com/ai-robots-txt/ai.robots.txt) — 3.7K⭐, 137 AI agents, structured robots.json
- [knownagents.com](https://knownagents.com) — AI crawler authority (formerly darkvisitors.com)
- [@4hse/astro-llms-txt](https://github.com/4hse/astro-llms-txt) — three-tier pattern (index, small, full)
- [foragents.dev](https://foragents.dev) — agent-first site with llms.txt, agent.json, dual-format API
- [Cloudflare "Block AI Bots" list](https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/) — source of our current AI_CRAWLERS regex
- [Simon Willison's robots.txt](https://simonwillison.net/robots.txt) — reference for blog robots.txt with sitemap + ChatGPT-User allow
- Live: [gkoreli.com/stats](https://gkoreli.com/stats/)
