# ADR-0006: Discoverability — Making the Blog Findable by Search Engines, AI Agents, and Humans

## Status

Proposed — 2026-03-07

## Problem Statement

The blog is invisible. 11 views, 4 visitors, 0 referrers, 0 AI fetches. Nobody links to us. No search engine has indexed us efficiently. No AI agent knows we exist.

The root cause is a missing discoverability layer. We have content and analytics, but no structured way for anything — search engines, AI agents, or aggregators — to discover, understand, or consume our content.

### What We Have

```
✅ Content:        1 blog post, about page, stats page
✅ Analytics:      Cookieless tracking, public dashboard (ADR-0004, ADR-0005)
✅ RSS feed:       /feed.xml (for RSS readers)
✅ robots.txt:     Minimal ("User-agent: * / Allow: /")
✅ Open Graph:     og:title, og:description, og:type, og:image (social previews)
```

### What We're Missing

```
❌ sitemap.xml:    Search engines can't efficiently discover our pages
❌ llms.txt:       AI agents have no structured way to discover content
❌ .md endpoints:  AI agents must parse HTML to read posts
❌ JSON-LD:        Search engines don't understand our content structure
❌ Content API:    No programmatic access to post index
❌ AI agent names: We classify AI visitors but don't record WHICH agent
❌ Sitemap ref:    robots.txt doesn't reference sitemap.xml
```

### Pain Points (Evidence-Based)

**Pain 1: Search engines can't find us efficiently.** Without `sitemap.xml`, Google relies on link-following to discover pages. With 0 inbound links, our pages may never be crawled. Simon Willison's blog has `sitemap.xml` referenced in `robots.txt` — standard practice. We don't.

**Pain 2: AI agents have no entry point.** When a user asks ChatGPT or Claude "what does gkoreli.com write about?", the agent has no structured way to answer. No `llms.txt`, no `.md` endpoints, no content API. The agent would have to fetch HTML and parse it — most won't bother. Stripe, Vercel, and Cloudflare all serve `llms.txt`. Personal blogs don't yet — we'd be early.

**Pain 3: We can't distinguish AI agents.** Our `AI_CRAWLERS` regex has 15 agents. The definitive `ai-robots-txt/ai.robots.txt` list (3,712⭐) tracks 137. We store `visitor_type=2` but not which agent. When AI traffic arrives, we'll see "AI Reads: 5" but not "3 from GPTBot, 2 from ClaudeBot." We're missing 12 Tier-1 agents from major AI products (OpenAI, Anthropic, Google, Amazon, Meta).

**Pain 4: Search results are generic.** Without JSON-LD `BlogPosting` markup, Google shows our pages with auto-extracted snippets instead of rich results (author, date, image). Trivial to fix — ~10 lines of template code from existing `PostMeta`.

### Landscape (Verified March 2026)

**llms.txt adoption:**
- Docs sites: Stripe (`docs.stripe.com/llms.txt`), Vercel (`vercel.com/llms.txt`), Cloudflare (`developers.cloudflare.com/llms.txt`) — verified, all serve clean markdown index files
- Personal blogs: **none found**. Checked simonwillison.net, kentcdodds.com, joshwcomeau.com, jvns.ca — all return 404
- Framework plugins: `@4hse/astro-llms-txt` (17⭐), `astro-llms-generate` (15⭐), `sphinx-llms-txt` (27⭐)
- Spec: Jeremy Howard (fast.ai), Sep 2024, llmstxt.org

**Markdown endpoints:**
- Stripe: `docs.stripe.com/testing.md` returns pure markdown (verified)
- Vercel: `vercel.com/docs/getting-started-with-vercel.md` returns markdown with frontmatter (verified)
- Pattern is real and implemented by major sites

**AI crawler landscape:**
- `ai-robots-txt/ai.robots.txt` (3,712⭐): 137 agents in structured `robots.json`. Categories: AI Data Scrapers (50), AI Assistants (20), AI Search Crawlers (22), AI Agents (17), Other (28)
- Our regex: 15 agents (11% coverage). Missing 12 Tier-1 agents from OpenAI, Anthropic, Google
- `knownagents.com` (formerly darkvisitors.com): authority on AI crawlers, provides API

**AI traffic analytics:**
- Nobody does this as a dashboard feature. Searched GitHub extensively — zero results. Checked Plausible and Counterscale source code — no AI classification. Our "AI Reads" metric is already unique.

**Agent-first sites:**
- `foragents.dev`: UA-based agent detection → redirect to `/llms.txt`, `/.well-known/agent.json` identity card, dual-format API (`.md` + `.json`). Validates direction but overengineered for a personal blog.

## Decision

Build the complete discoverability stack in one pass. Four complementary layers:

| Layer | For | Format | Effort |
|-------|-----|--------|--------|
| `sitemap.xml` | Search engines | XML | Trivial (same pattern as feed.xml) |
| `llms.txt` + `.md` endpoints | AI agents | Markdown | Low (build-time, static files) |
| JSON-LD structured data | Search engines | JSON in `<head>` | Trivial (~10 lines template) |
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

Add sitemap reference:
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

Generated at build time. Follows the llmstxt.org spec format:

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

`/{slug}.md` — clean markdown per post, frontmatter stripped. Generated at build time by copying post source and removing YAML frontmatter.

### Content API

`/api/posts.json` — static JSON file:
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

Change `classifyVisitor` to return `{ type: VisitorType, agent: string | null }`. Use named capture group in regex: `/(?<agent>GPTBot|ClaudeBot|...)/i`. Store in new `agent_name TEXT` column.

### Dashboard section

New `by_agent` field in stats response. New "AI Agents" section on `/stats` — same ranked list pattern as pages/referrers/countries.

## Anti-Patterns

1. **❌ Dynamic llms.txt**: Content metadata — generate at build time, serve as static file. Stripe and Vercel do this. Don't route through a Worker.

2. **❌ Maintaining our own AI crawler list**: `ai-robots-txt/ai.robots.txt` (3.7K⭐) maintains 137 agents with structured metadata. Don't maintain a parallel list. Source from theirs, curate to ~35 agents.

3. **❌ Storing full UA string**: Extract just the agent name ("GPTBot", "ClaudeBot"). UA strings are 100+ chars of redundant browser engine info.

4. **❌ Separate AI analytics table**: Add `agent_name` column to existing `page_views`. A page view is a page view.

5. **❌ Blocking AI agents then tracking them**: We welcome agents, serve them optimized content, and transparently track usage.

6. **❌ llms-full.txt with HTML**: Must be clean markdown. We have the source — don't convert HTML back.

7. **❌ Worker endpoint for static data**: `posts.json`, `llms.txt`, `sitemap.xml` — all static files. CDN-cached, zero cost, never fail.

8. **❌ Overengineering agent detection**: foragents.dev redirects agents to `/llms.txt` via UA sniffing. Unnecessary for a personal blog. Agents that know about llms.txt request it directly.

9. **❌ Importing all 137 agents**: Many are defunct or regional. Start with ~35 (Tier 1 + 2). The `robots.json` `function` field helps categorize — prioritize "AI Assistants" and "AI Search Crawlers" over "AI Data Scrapers".

10. **❌ JSON-LD on non-article pages**: Only blog posts get `BlogPosting` markup. The homepage, about page, and stats page don't need it — they're not articles.

## Gotchas

1. **llms.txt must be at root path**: `/llms.txt`, not `/api/llms.txt`. Spec requires root. `dist/llms.txt` → `gkoreli.com/llms.txt` via Cloudflare assets binding.

2. **Markdown endpoints and trailing slashes**: Blog uses `/{slug}/` (trailing slash). The `.md` endpoint is `/{slug}.md` (no trailing slash). Both coexist as separate files in `dist/`.

3. **Agent name extraction needs capture group**: Current regex uses `|` alternation without capture. Change to named group: `/(?<agent>GPTBot|ClaudeBot|...)/i` → `match.groups.agent`.

4. **D1 ALTER TABLE is safe for nullable columns**: `ALTER TABLE page_views ADD COLUMN agent_name TEXT` — existing rows get NULL. No data migration.

5. **Frontmatter stripping**: Post source has YAML frontmatter. `.md` endpoint serves content without it. Strip with: `content.replace(/^---[\s\S]*?---\n/, '')`.

6. **llms-full.txt grows with every post**: Fine for 1-5 posts (<50KB). At 100+, use the spec's "Optional" section or truncate to recent posts.

7. **AI agent UAs evolve constantly**: New agents appear weekly. Options: (a) periodic manual sync from `robots.json`, (b) log unclassified UAs for review, (c) auto-generate regex from `robots.json` at build time. Start with (a).

8. **sitemap.xml lastmod accuracy**: `lastmod` should reflect actual content changes, not build time. Use the post's `date` field from frontmatter. For non-post pages (about, stats), omit `lastmod`.

9. **JSON-LD must be valid JSON**: Template interpolation with special characters (quotes, ampersands in descriptions) can produce invalid JSON. Use `JSON.stringify()` to generate the entire block, not string concatenation.

10. **robots.txt is in `public/` not generated**: Currently `public/robots.txt` is copied as-is to `dist/`. To add the Sitemap reference, either modify the static file or generate it in the build pipeline. Modifying the static file is simpler.

## Best Practices

1. **✅ Build-time generation for all metadata**: sitemap.xml, llms.txt, llms-full.txt, posts.json, .md files, JSON-LD — all from the existing build pipeline. Zero runtime cost.

2. **✅ One pipeline, multiple output formats**: Don't create separate build steps. Extend `buildHTML()` to generate all formats. The pipeline already has all post metadata.

3. **✅ Agent name as a derived field**: Extract from UA at write time, not query time. Store once, query cheaply.

4. **✅ Source crawler list from community project**: `ai-robots-txt/ai.robots.txt` (3.7K⭐). Curate to ~35 agents. Periodically sync.

5. **✅ Three-tier content for different context budgets**: `llms.txt` (~1KB index), `llms-full.txt` (~50KB all content), individual `.md` files (~5KB each). Agents choose based on context window.

6. **✅ llms.txt links to .md endpoints**: AI agents follow links to clean markdown. HTML versions are for humans. This is Stripe's pattern.

7. **✅ Transparency footer links to llms.txt**: Stats page footer: "AI agents: see our [llms.txt](/llms.txt)". Meta-transparency.

8. **✅ JSON-LD from JSON.stringify**: Generate the entire `<script type="application/ld+json">` block via `JSON.stringify()`, not template literals. Guarantees valid JSON regardless of content.

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
- `packages/analytics/src/classify.ts` — expand regex, return agent name
- `packages/analytics/src/db.ts` — add agent_name to PageView + INSERT
- `packages/analytics/src/stats.ts` — add `by_agent` to response
- `packages/blog/src/client/stats.ts` — add "AI Agents" dashboard section
- `packages/blog/src/templates/stats.ts` — add skeleton
- D1 migration: `ALTER TABLE page_views ADD COLUMN agent_name TEXT`

## Adjacent Ideas (Future)

- **`/.well-known/agent.json`**: Agent identity card (emerging, from foragents.dev). Premature for a personal blog.
- **AI crawler list auto-sync**: Fetch `robots.json` at build time, auto-generate regex. Keeps list current.
- **Reading engagement**: Scroll depth + time on page. Answers "do people read or skim?"
- **Data lifecycle**: Retention policy, data export.
- **Period comparison**: "This week vs last week" on dashboard.

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
- [foragents.dev](https://foragents.dev) — agent-first site, validates direction
- [Simon Willison's robots.txt](https://simonwillison.net/robots.txt) — reference for blog robots.txt with sitemap + ChatGPT-User allow
- Live: [gkoreli.com/stats](https://gkoreli.com/stats/)
