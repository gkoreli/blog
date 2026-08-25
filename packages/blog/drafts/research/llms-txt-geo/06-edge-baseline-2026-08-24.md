# Cloudflare Edge Snapshot — 2026-08-24

**Status:** Historical observation plus contaminated measurement-path validation  
**Local research date:** 2026-08-24, America/Los_Angeles  
**UTC query window:** 2026-08-24 06:53:59 → 2026-08-25 06:53:59  
**Deployment changes:** None

## Why this snapshot exists

The code audit showed that the public analytics cannot see direct requests for `/llms.txt`, `/llms-full.txt`, or root-level `.md` files. The Cloudflare observability report identified `httpRequestsAdaptiveGroups` as a no-deployment way to inspect path-level edge aggregates.

This artifact does two things:

1. reconstructs the roughly seven days before this investigation as one-day query slices;
2. validates the measurement path during a current window that our own live checks contaminated.

Neither is a clean external-traffic baseline. Historical command-line requests may belong to earlier authoring work, and current command-line requests align with this research process.

## Method

The repository's authenticated Wrangler session supplied an OAuth credential in memory. No credential was printed or written to an artifact. A read-only Cloudflare GraphQL query grouped `httpRequestsAdaptiveGroups` by:

- request path;
- user-agent string;
- edge response status.

Two path filters were queried:

- paths containing `llms`;
- paths ending in `.md`.

The response is aggregate data. It contains no request body, IP address, visitor fingerprint, or full referrer.

Query shape, with credentials and zone identifier omitted:

```graphql
query TargetPaths($zone: String!, $start: Time!, $end: Time!) {
  viewer {
    zones(filter: { zoneTag: $zone }) {
      llms: httpRequestsAdaptiveGroups(
        limit: 1000
        filter: {
          datetime_geq: $start
          datetime_lt: $end
          clientRequestPath_like: "%llms%"
        }
        orderBy: [count_DESC]
      ) {
        count
        avg { sampleInterval }
        dimensions {
          clientRequestPath
          userAgent
          edgeResponseStatus
        }
      }
      markdown: httpRequestsAdaptiveGroups(
        limit: 1000
        filter: {
          datetime_geq: $start
          datetime_lt: $end
          clientRequestPath_like: "%.md"
        }
        orderBy: [count_DESC]
      ) {
        count
        avg { sampleInterval }
        dimensions {
          clientRequestPath
          userAgent
          edgeResponseStatus
        }
      }
    }
  }
}
```

The first validation query omitted the sample interval. We reran every retained UTC-day slice and the current partial day with `avg { sampleInterval }`. Every nonempty group returned `sampleInterval: 1`, meaning Cloudflare did not scale these observed group counts through adaptive sampling. They remain aggregate, user-agent-based evidence rather than raw authenticated request records.

## Result A — Reconstructed historical window

Cloudflare rejects a single range wider than one day for this zone, but it accepted one-day slices within its retained history. We queried:

- 2026-08-17 07:00 UTC → 2026-08-18 00:00 UTC; then
- each complete UTC day from 2026-08-18 through 2026-08-24.

Observed target-path rows:

| UTC day | Path | Presented user agent | Status | Count |
|---|---|---|---:|---:|
| 2026-08-18 | `/llms.txt` | Chrome 126 on macOS | 200 | 1 |
| 2026-08-21 | `/bring-your-own-ai-agent.md` | `curl/8.7.1` | 200 | 2 |
| 2026-08-22 | `/llms.txt` | Chrome 122 on Windows | 301 | 1 |
| 2026-08-22 | `/llms.txt` | Chrome 122 on Windows | 200 | 1 |
| 2026-08-22 | `/you-dont-need-codemap.md` | `curl/8.7.1` | 200 | 1 |

All other queried daily slices returned no matching rows.

Every nonempty historical group reported a sample interval of 1.

Historical totals:

- three requests to `/llms.txt`, likely representing two browser request sequences because one pair shares a user agent and returns 301 then 200;
- three requests to page-level Markdown;
- zero requests to `/llms-full.txt`;
- zero rows presenting a known OpenAI, Anthropic, Perplexity, Google agent, or other named AI-provider user agent.

### Historical attribution boundary

The aggregate data does not identify a person, request ID, or exact timestamp. The Chrome rows may be ordinary human navigation, a browser-based tool, or author activity. The `curl/8.7.1` rows may be external tools, or they may come from Goga or an agent working on the newly published articles. We have no contemporaneous intervention log for that week.

The honest statement is: **the agent-readable endpoints received a handful of unattributed browser and command-line requests. None presented a named AI-provider user agent.**

That does not mean no AI was involved. User-directed coding agents often fetch with generic tool user agents such as `curl`, and ordinary user agents can be spoofed. It also does not mean the requests were external.

## Result B — Current contaminated validation window

| Path | Presented user agent | Status | Count |
|---|---|---:|---:|
| `/llms.txt` | `curl/8.7.1` | 200 | 3 |
| `/llms-full.txt` | `curl/8.7.1` | 200 | 2 |
| `/llms.txt` | Chrome 151 on macOS | 200 | 1 |
| `/the-agentic-product-engineer.md` | `curl/8.7.1` | 200 | 1 |

Current-window totals:

- six requests to `llms` paths;
- one request to a Markdown endpoint;
- seven successful responses;
- zero rows presenting a known OpenAI, Anthropic, Perplexity, Google agent, or other named AI-provider user agent.

Every nonempty current group reported a sample interval of 1.

## Current-window contamination analysis

During this research window, we reproduced the live deployment with command-line requests to:

- `/llms.txt`;
- `/llms-full.txt`;
- `/the-agentic-product-engineer.md`.

Those checks used the same `curl/8.7.1` identifier shown in six of the seven aggregate rows. The counts and paths are consistent with the audit activity.

Because the aggregate response does not include request IDs or precise timestamps, we cannot prove that every `curl/8.7.1` row was ours. We also cannot honestly treat any of them as external agent use. The correct label is **known-contaminated research traffic**.

The single Chrome request is unattributed. It may be a human opening the file, a browser-based research action, or another visitor. An ordinary browser user agent is not evidence of an AI crawler or user-directed agent.

## What this establishes

- Cloudflare edge analytics can observe the static file requests that bypass the Worker and browser beacon.
- The path filters and grouping dimensions return the evidence needed for a no-code daily baseline.
- All observed target-path responses in the current validation window succeeded with status 200; the historical window also contained one 301 followed by a 200 for the same path and user agent.
- The current public `ai_fetches` metric and the edge request count are different datasets about different events.

## What it does not establish

- That no AI system fetched the files. The observed groups were unsampled, but user agents may be generic or spoofed, and the reconstructed history is only about seven days.
- That the Chrome request came from a human, an agent, or Goga.
- That any fetched body entered a model context, changed an answer, produced a citation, or sent a reader.
- An organic external request rate. Our own research contaminated the observed paths.

## Query-window and retention constraints reproduced

A query requested seven days in one range: 2026-08-18 06:54:16 → 2026-08-25 06:54:16 UTC. Cloudflare rejected it with a quota error stating that the zone cannot request a range wider than one day.

Daily slices inside the retention boundary succeeded. A slice starting at 2026-08-17 00:00 UTC was rejected because it extended more than one week and one day into the past at query time. Starting at 07:00 UTC succeeded.

That reproduces two practical constraints: at most one day per request, and roughly eight days of accessible history at query time. A seven-day window can be reconstructed only as daily slices while the slices remain inside retention. It cannot be recovered later with one broad request.

## Revised baseline protocol

1. Declare the research-fetch cutoff time.
2. Do not manually request `/llms.txt`, `/llms-full.txt`, or a root `.md` endpoint during the clean window unless the request is logged as an intervention.
3. Query a non-overlapping UTC day after it closes.
4. Save the summarized result and whether Cloudflare reported sampling.
5. Repeat for seven days.
6. Keep ordinary browsers, command-line tools, named search crawlers, training crawlers, and user-directed fetchers in separate rows.
7. Do not describe the total as reads, citations, or readership.

## Immediate verdict

The edge measurement path works. The historical week shows a few unattributed requests and no named AI-provider user agent. The current result mostly measured our attempt to measure it.

That sentence belongs in the research story because it demonstrates the reason to pre-register observation windows: measurement activity can alter a low-traffic system enough to dominate the signal.
