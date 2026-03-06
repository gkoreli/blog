# ADR-0004: Analytics — Custom Lightweight Analytics on Cloudflare Workers

## Status

Proposed — 2026-03-06

## Context

The blog needs analytics to answer basic questions: did anyone visit? Which posts get read? Where did they come from? Bots or humans?

GitHub Pages provided zero website analytics ([community discussion #31474](https://github.com/orgs/community/discussions/31474) — 441 upvotes, 3+ years unanswered). This was a key driver for migrating to Cloudflare Workers (ADR-0001 updated).

Now on Cloudflare Workers, we have access to the full Cloudflare developer platform:
- **Workers** — serverless functions that run on every request or specific routes
- **D1** — SQLite database on the edge (free: 5M reads/day, 100K writes/day, 5GB storage)
- **Analytics Engine** — purpose-built write-only analytics datastore with SQL API (free: 100K events/day)
- **KV** — key-value store (free: 100K reads/day, 1K writes/day)
- **`run_worker_first`** — config option to run a Worker script before serving static assets for specific routes

The blog's philosophy: build it yourself, understand how it works, own your data. A $9/mo SaaS for page view counts on a personal blog is overkill.

### What We Need

- Page views per post (which posts get read?)
- Unique visitors (how many humans, roughly?)
- Referrer (where did they come from?)
- Bot filtering (don't count crawlers)
- Public dashboard (transparency — "here are my real stats")

### What We Don't Need

- Funnels, conversion tracking, ecommerce attribution
- Session replay, heatmaps
- Team management, multi-site
- Real-time dashboards (daily aggregates are fine)

## Proposals

### Proposal A: Worker Script + D1

Add a `main` entry point to the Worker that intercepts requests before serving static assets. Log page views to D1. Build a `/stats` page that queries D1 at build time or client-side.

**Architecture:**
```
wrangler.jsonc:
  main: "src/worker/index.ts"
  assets.run_worker_first: ["*"]
  d1_databases: [{ binding: "DB", database_name: "analytics" }]

Request flow:
  Browser → Cloudflare Edge → Worker script (logs to D1) → serves static asset
```

**What the Worker does:**
1. Check if request is a navigation request (HTML page, not CSS/JS/images)
2. Extract: URL path, referrer, user-agent, country (from `cf` object), timestamp
3. Filter bots by user-agent patterns
4. Hash IP + user-agent + daily salt for unique visitor counting (no PII stored)
5. Write to D1
6. Pass through to static asset serving

**Pros:**
- Full control over what's captured and how
- D1 is SQL — flexible querying for the `/stats` page
- Free tier is generous (5M reads/day, 100K writes/day)
- Data lives on Cloudflare, exportable
- Can build any dashboard UI we want

**Cons:**
- D1 writes on every page view add latency (though D1 is fast)
- Need to build bot filtering ourselves
- Need to build the dashboard UI
- D1 is still in open beta (though widely used)

### Proposal B: Worker Script + Analytics Engine

Same Worker script approach, but write to Cloudflare Analytics Engine instead of D1. Analytics Engine is purpose-built for high-volume event ingestion with a SQL API for querying.

**Architecture:**
```
wrangler.jsonc:
  main: "src/worker/index.ts"
  assets.run_worker_first: ["*"]
  analytics_engine_datasets: [{ binding: "ANALYTICS" }]

Worker writes:
  env.ANALYTICS.writeDataPoint({
    blobs: [pathname, referrer, country, userAgent],
    doubles: [isUnique ? 1 : 0],
    indexes: [pathname]
  })
```

**Pros:**
- Purpose-built for analytics — optimized for write-heavy, read-occasional
- No schema management (schemaless blobs/doubles/indexes)
- Free: 100K events/day (more than enough for a personal blog)
- SQL API for querying — can build dashboard from it
- Zero latency impact — `writeDataPoint` is fire-and-forget, doesn't block response

**Cons:**
- Less flexible querying than D1 (limited SQL subset)
- Data retention: 90 days on free plan
- Can't do complex joins or aggregations easily
- Newer product, less community examples

### Proposal C: Cloudflare Web Analytics (Built-in)

Just enable Cloudflare Web Analytics in the dashboard. Zero code changes.

**Pros:**
- Literally 2 clicks to enable
- Privacy-first, no cookies
- Basic metrics: page views, visitors, referrers, countries
- Free

**Cons:**
- No public dashboard option
- No API access — can't build custom `/stats` page
- Limited filtering and querying
- Black box — don't own the data
- Can't customize what's tracked

## Decision

**Proposal A (Worker + D1) as the foundation**, with **Proposal C (Web Analytics) enabled immediately** for instant signal.

### Why D1 over Analytics Engine

- D1 gives us SQL with full flexibility — we can build any query, any dashboard
- Data retention is unlimited (not 90 days)
- Schema is explicit — easier to reason about and evolve
- For a personal blog's traffic volume, D1's write limits are more than sufficient
- We can always add Analytics Engine later for high-frequency events if needed

### Why not just Web Analytics

- No public dashboard — the whole point is transparency
- No API — can't build a `/stats` page on the blog
- No customization — can't filter, can't add custom dimensions

### Implementation Plan

1. **Immediate**: Enable Cloudflare Web Analytics in dashboard (2 clicks, instant basic data)
2. **Phase 1**: Add Worker script with D1 binding — log page views, referrers, unique visitors
3. **Phase 2**: Build `/stats` page on the blog — public dashboard showing real traffic data
4. **Phase 3**: Iterate — add bot filtering improvements, top referrers, reading patterns

### Data Schema (D1)

```sql
CREATE TABLE page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  referrer TEXT,
  country TEXT,
  visitor_hash TEXT,  -- hash(IP + UA + daily_salt), no PII
  is_bot INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_path ON page_views(path);
CREATE INDEX idx_created ON page_views(created_at);
```

### Worker Config

```jsonc
// wrangler.jsonc additions
{
  "main": "src/worker/index.ts",
  "assets": {
    "directory": "packages/blog/dist",
    "not_found_handling": "404-page",
    "html_handling": "auto-trailing-slash",
    "run_worker_first": ["/api/*"]
  },
  "d1_databases": [
    { "binding": "DB", "database_name": "blog-analytics", "database_id": "TBD" }
  ]
}
```

### Public Dashboard

The `/stats` page will show:
- Total visitors and page views (all time + last 30 days)
- Top posts by views
- Referrer sources
- Country distribution
- Daily trend chart

Built as a static page that fetches from `/api/stats` — a Worker function that queries D1.

## References

- [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/) — static hosting + Worker scripts
- [Cloudflare D1](https://developers.cloudflare.com/d1/) — serverless SQLite
- [Cloudflare Analytics Engine](https://developers.cloudflare.com/analytics/analytics-engine/) — event ingestion
- [Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/) — built-in basic analytics
- [Workers `run_worker_first`](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/#run_worker_first) — run Worker before serving assets
- [GitHub Pages analytics discussion #31474](https://github.com/orgs/community/discussions/31474) — 441 upvotes, unanswered since 2022
- TASK-0480: Analytics backlog task with full research
