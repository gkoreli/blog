# Cloudflare Static-Request Observability for Agent-Readable Files

**Date:** 2026-08-24  
**Status:** Research artifact; no implementation performed  
**Scope:** Determine how this Cloudflare Workers Static Assets deployment can accurately observe requests to `/llms.txt`, `/llms-full.txt`, and `/*.md`, including Free-plan constraints, routing implications, durability, sampling, risks, and costs.

## Current routing finding

The blog's `wrangler.jsonc` currently has:

```jsonc
"assets": {
  "binding": "ASSETS",
  "run_worker_first": ["/api/*"]
}
```

Cloudflare serves a matching static asset before invoking the Worker unless its path matches `run_worker_first`. Therefore `/llms.txt`, `/llms-full.txt`, and the root-level `/*.md` endpoints currently bypass `packages/blog/src/worker/index.ts` entirely.

This has two consequences:

1. The current browser beacon and D1 `page_views` data cannot observe direct requests to these static files.
2. Workers Logs cannot observe them either, because no Worker invocation occurs.

This is Cloudflare's documented asset-first behavior:

- [Worker script routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)
- [Static Assets binding configuration](https://developers.cloudflare.com/workers/static-assets/binding/)

There is one critical implementation trap. Merely adding these paths to `run_worker_first` would break them. The current Worker ends with a `404` and has no `env.ASSETS.fetch(request)` fallback. Any selected static path must be explicitly fetched through the `ASSETS` binding and returned.

## Recommended measurement design

Use two layers:

1. Cloudflare AI Crawl Control immediately, without a deployment change, for a baseline.
2. Selective Worker routing plus D1 for exact, durable first-party counts during a fixed experiment window.

### Layer 1: no-code edge baseline

AI Crawl Control is available on all plans and observes edge requests, including requests served directly as static assets. It can filter by crawler, operator, hostname, path, and status, and it can export CSV.

On the Free plan:

- Detection is based on self-declared user-agent strings, not verified bot identity.
- The analytics window is limited to the previous 24 hours.
- It distinguishes current crawler names including `OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`, and `Perplexity-User`.
- User-agent strings can be spoofed. The accurate claim is "requests presenting as X," not "verified X requests."
- GraphQL exposes the same underlying analytics and supports `clientRequestPath_like` and `userAgent_like` on all plans.
- The underlying `httpRequestsAdaptiveGroups` dataset is adaptively sampled. Rare events can be missed, although smaller datasets are often unsampled.

Official sources:

- [AI Crawl Control overview](https://developers.cloudflare.com/ai-crawl-control/)
- [Free-plan limits and detection quality](https://developers.cloudflare.com/ai-crawl-control/get-started/)
- [Path-level metrics and CSV export](https://developers.cloudflare.com/ai-crawl-control/features/analyze-ai-traffic/)
- [GraphQL filters and examples](https://developers.cloudflare.com/ai-crawl-control/reference/graphql-api/)
- [Current crawler and user-agent reference](https://developers.cloudflare.com/ai-crawl-control/reference/bots/)
- [Adaptive sampling limitations](https://developers.cloudflare.com/analytics/graphql-api/sampling/)

For a zero-code baseline, export filtered CSV every day for `/llms.txt`, `/llms-full.txt`, and paths ending in `.md`. The exports make each 24-hour snapshot durable, but the underlying data remains aggregate and potentially sampled.

### Layer 2: exact, durable targeted measurement

The selective routing configuration would become:

```jsonc
"run_worker_first": [
  "/api/*",
  "/llms.txt",
  "/llms-full.txt",
  "/*.md"
]
```

Cloudflare documents `*` as a deep glob. The current generated Markdown endpoints are root-level files, so `/*.md` covers them.

The Worker would then need a branch that:

1. Recognizes `GET` and `HEAD` for those paths.
2. Fetches and returns `env.ASSETS.fetch(request)`.
3. Records a separate fetch event asynchronously, preferably after the asset response status is known.
4. Does not reuse the current browser `page_views` table or the misleading `ai_fetches` metric.
5. Stores no IP address or fingerprint.

Suggested fields:

- UTC timestamp
- method
- exact path
- response status
- truncated user-agent string
- normalized crawler name and category
- referrer host, when present
- optional content type and response bytes
- experiment or classifier version

Use D1 when every event matters. D1 is unsampled and retains data until it is explicitly deleted. On Workers Free, D1 includes 100,000 rows written per day, 5 million rows read per day, and 5 GB of total storage. Indexes add write consumption, so one insert can count as more than one written row.

Official sources:

- [Selective `run_worker_first` routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)
- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [D1 pricing and row accounting](https://developers.cloudflare.com/d1/platform/pricing/)

Only the selected agent-readable paths would become Worker invocations. All other blog pages and assets would remain asset-first. Workers Free allows 100,000 Worker invocations per day; requests that remain pure static-asset requests are free and unlimited.

## Options matrix

| Option | Sees current static requests? | Exact? | Retention | Free-plan usefulness |
|---|---:|---:|---:|---|
| AI Crawl Control | Yes | Aggregate; UA-based and sampled | 24-hour window | Best immediate baseline |
| Security Analytics | Yes | Sampled | 7 days; maximum 24-hour query window | Useful broad cross-check |
| Workers real-time logs / `wrangler tail` | Only after `run_worker_first` | May drop events under load | None | Live debugging only |
| Workers Logs | Only after `run_worker_first` | 100% by default unless configured otherwise | 3 days Free; 7 days Paid | Short validation window |
| Selective Worker plus D1 | Only after `run_worker_first` | Yes, for routed requests | Until deletion or storage exhaustion | Best durable experiment record |
| Selective Worker plus Analytics Engine | Only after `run_worker_first` | Adaptively sampled | 3 months | Better for trends than rare exact events |
| Zone HTTP Request Logpush | Yes | Raw export | Controlled by destination | Enterprise only |

Supporting sources:

- [Security Analytics availability, sampling, and retention](https://developers.cloudflare.com/waf/analytics/security-analytics/)
- [Real-time logs are not stored and may drop messages](https://developers.cloudflare.com/workers/observability/logs/real-time-logs/)
- [Workers Logs sampling, retention, and pricing](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)
- [Analytics Engine sampling](https://developers.cloudflare.com/analytics/analytics-engine/sampling/)
- [Analytics Engine three-month retention](https://developers.cloudflare.com/analytics/analytics-engine/limits/)
- [Analytics Engine limits and current pricing status](https://developers.cloudflare.com/analytics/analytics-engine/pricing/)
- [HTTP Logpush availability](https://developers.cloudflare.com/logs/logpush/)

## Durable logs versus live or sampled evidence

### Real-time logs

Dashboard Live Logs and `wrangler tail` are ephemeral. Cloudflare explicitly states that real-time logs do not store Workers Logs, and high-volume streams may enter sampling mode and drop messages. They are suitable for verifying a deployment, not for running a multi-week experiment.

### Workers Logs

Workers Logs are stored, but briefly. The current configuration has logs and invocation logs enabled. If `head_sampling_rate` is unspecified, Cloudflare documents a default of `1`, or 100 percent. Free retention is three days and includes 200,000 log events per day. Paid retention is seven days.

Because the agent-readable files currently bypass the Worker, this storage only becomes relevant after selective `run_worker_first` routing is added.

### AI Crawl Control and Security Analytics

These are edge-level aggregate evidence and can already see matching static requests. They are useful for a baseline and cross-check, but they are not a raw durable request ledger. On Free, AI Crawl Control also identifies crawlers from user-agent strings, which are claims made by requesters rather than independently verified identities.

### D1

D1 is the cleanest option for a durable, exact experiment dataset. It can preserve one first-party row per routed request, with explicit data minimization and retention policy. It should be treated as experiment instrumentation, not mixed into browser page-view semantics.

### Workers Analytics Engine

Analytics Engine retains data for three months and is designed for aggregate analysis at scale. It adaptively samples, so it is less appropriate when the event of interest may occur only a handful of times and each request matters.

### Zone HTTP Request Logpush

Raw zone HTTP Logpush could observe static requests without routing through the Worker, but Cloudflare documents general Logpush availability as Enterprise-only. Workers Trace Events Logpush has different plan rules, but it still cannot contain requests that never invoked the Worker.

## Risks and limits

- Every selected request consumes a Worker invocation, even though the response body is still a static asset.
- Workers Free has a 100,000-invocation daily limit. Cloudflare documents Error 1027 after the limit unless the route is configured to fail open.
- The existing Worker must return the static asset for selected paths; otherwise the measurement change produces 404 responses.
- Calling `env.ASSETS.fetch(request)` preserves the static asset source, but the request now passes through Worker code first and may add latency.
- A user-agent string is not verified identity. Even an exact D1 ledger can only prove which headers reached the Worker unless a paid verification signal is available.
- A request proves retrieval attempt, not successful reading, answer use, citation, ranking, or model influence.
- D1 writes should be best-effort so an analytics failure never blocks the requested document.
- Store no IP address or fingerprint. Truncate user agents and add an explicit cleanup policy.
- D1 indexes consume additional row writes.
- Do not change discovery signals during the fixed observation window; otherwise the causal story becomes ambiguous.
- Do not merge these records into `page_views`. Browser page views and direct crawler fetches are different events with different denominators.

## Exact recommended staged experiment

1. **Capture the untouched baseline.** Open AI Crawl Control and export the previous 24 hours for `/llms.txt`, `/llms-full.txt`, and `*.md` before changing the deployment.
2. **Run a seven-day no-code baseline.** Export the same path-filtered CSV once per day. Record whether the dashboard reports sampling and preserve that context with each export.
3. **Freeze the classifier.** Define the crawler-name and category map before the instrumented phase. Include current search, training, and user-directed fetchers as separate categories.
4. **Add only targeted Worker routing.** Extend `run_worker_first` with `/llms.txt`, `/llms-full.txt`, and `/*.md`. Leave all normal HTML, image, CSS, JavaScript, sitemap, and feed requests asset-first.
5. **Serve through the binding.** For matching `GET` and `HEAD` requests, fetch `env.ASSETS.fetch(request)` and return that response unchanged.
6. **Write a separate D1 event.** Record the minimized fields listed above in a dedicated table. Use an asynchronous, best-effort write that cannot change the asset response.
7. **Cross-check the first three days.** Keep Workers Logs at the default 100-percent head sampling and compare invocation counts with D1 rows. Investigate discrepancies before trusting the longer window.
8. **Run a 30-day frozen observation window.** Do not change `llms.txt`, link discovery, robots directives, classifier rules, or routing during this phase except to fix a serving failure.
9. **Report separate populations.** Publish counts for all requests, self-identified AI requests, AI-search crawlers, training crawlers, user-directed fetchers, known agentic tools, ordinary clients, and unknown clients.
10. **Audit response success.** Separate `2xx`, `3xx`, `4xx`, and `5xx` responses, and distinguish `GET` from `HEAD`.
11. **Preserve the epistemic boundary.** Describe the outcome as retrieval attempts to the agent-readable layer. Never rename the result to citations, visibility, ranking, or answer influence.
12. **Retain or delete deliberately.** Keep aggregate results and experiment notes. Remove raw user-agent rows after the declared retention period if they no longer serve the analysis.

## What the experiment can support

If implemented correctly, it can answer:

- Whether any client directly requests `/llms.txt`, `/llms-full.txt`, or a Markdown endpoint.
- Which requested path and response status were involved.
- Which requests presented known AI crawler, AI-search, or user-directed-fetcher user agents.
- Whether traffic changes after a separately defined intervention, provided the baseline and intervention windows remain controlled.

It cannot answer by itself:

- Whether the requester truly was the named provider.
- Whether the fetched content entered a model context.
- Whether it affected an answer.
- Whether it produced a citation.
- Whether `llms.txt` improved discovery, rankings, or referral traffic.

That last boundary belongs in the article. Accurate request instrumentation can resolve whether the files are fetched. It cannot collapse retrieval, use, citation, and discovery into one metric.
