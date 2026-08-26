# ADR-0016: Analytics Observation and Metric Semantics

## Status

Accepted — 2026-08-25. Amended — 2026-08-26 to retain the legacy browser-beacon history in the public read model with an explicit source marker. Supersedes the collection and metric semantics in ADR-0004 and the dashboard semantics in ADR-0005. Worker + D1 remains the chosen infrastructure.

## Context

The deployed dashboard counts browser beacon rows but labels them as views, visitors, bots, and AI reads. Those labels promise more than the system observes.

Four independent audits found the same boundary failures:

- Static pages bypass the Worker. A bot or AI crawler that fetches an article without running JavaScript never reaches D1.
- `AI Reads` counts User-Agent matches on `/api/event`, not article fetches or reading.
- `Visitors` counts distinct 64-bit hashes of UTC date + IP + User-Agent. It does not count people or range-unique visitors.
- The viewer's current UTC offset controls historical buckets while identity rotates at UTC midnight. DST and local-midnight boundaries split and merge counts.
- `7d`, `30d`, and `90d` include 8, 31, and 91 calendar dates.
- The public privacy page says path and referrer only, but D1 also stores geography, a pseudonymous identifier, traffic class, device class, owner status, and time.
- Cloudflare Web Analytics runs beside the first-party beacon but is absent from the analytics disclosure.

The problem is the domain model. Query patches or new labels cannot make a client beacon observe requests that never execute it.

Research is preserved in the Analytics Worklist:

- TASK-0010 — live surface and API audit
- TASK-0011 — public information-design diagnostic
- TASK-0012 — end-to-end data semantics
- TASK-0013 — primary-source metric integrity research
- TASK-0014 — engineering decision synthesis

## Decision

Record successful HTML responses at the Worker edge. Remove the browser analytics beacon and `/api/event`.

Use one model from ingestion through presentation:

| Domain term | Definition |
|---|---|
| `PageObservation` | One successful, non-prefetch `GET` whose served response has an HTML content type. It proves a served page, not attention or reading. |
| `TrafficClass` | `browser`, `bot`, or `ai`, derived from the request User-Agent. The class is heuristic and sender-asserted, not verified identity. |
| `AgentName` | The matched named automation rule, or `null`. Raw User-Agent is not stored. |
| `DailyClientId` | A site- and UTC-day-scoped HMAC of IP and User-Agent using a required Worker secret. It estimates a daily client, not a person. |
| `StatsWindow` | A UTC reporting window with one declared granularity and complete zero-filled buckets. |
| `StatsSnapshot` | One aggregate response whose cards, chart, and dimensions share the same time and traffic predicates. |

### Public words

Use these labels:

- **Page views** — recorded `PageObservation` rows.
- **Daily clients** — distinct `DailyClientId` values in the selected window. One client on two UTC dates counts twice.
- **Browsers** — requests whose User-Agent did not match a bot or AI rule. This is not a verified-human claim.
- **Bots** — requests whose User-Agent matched a general automation rule.
- **AI UAs** — requests whose User-Agent matched a named AI rule. This is not proof that a model read, indexed, cited, or used the page.

Do not use `Visitors`, `Humans`, `AI Reads`, or `AI fetches` for these facts.

## Domain boundaries

The package keeps independent policies independent:

```text
Worker composition root
  ├─ route API requests
  └─ fetch static asset
       └─ observe served response
            ├─ eligibility policy
            ├─ request metadata policy
            ├─ traffic classifier
            ├─ daily identity policy
            └─ observation repository

Stats API
  ├─ query parser
  ├─ UTC window policy
  ├─ aggregate query service
  └─ bucket completion policy

Stats client
  ├─ shared response types
  ├─ URL state
  └─ render cards, chart, dimensions, and methodology
```

Use function composition and explicit dependencies. No class hierarchy is warranted: eligibility, classification, identity, persistence, aggregation, and presentation vary independently. Inheritance would bind unrelated policies to a transport or storage subtype.

The Worker is the composition root. The analytics package owns analytics semantics. The blog package owns HTTP routing and presentation.

## Observation contract

An eligible observation satisfies every rule:

1. Request method is `GET`.
2. Asset response is successful.
3. Response `Content-Type` is HTML.
4. Request is not a prefetch according to `Purpose`, `Sec-Purpose`, or `Sec-Fetch-Purpose`.
5. Path is not `/stats`; public dashboard inspection must not change the public numbers.
6. Owner requests remain recordable for diagnostics but every public query excludes them.

API requests, assets, `HEAD`, failed responses, redirects, Markdown endpoints, feeds, and non-HTML resources are outside this metric.

The Worker returns the asset response immediately and schedules the D1 write with `waitUntil`. Counts remain best effort. A served response can be absent from D1 after a write failure; the methodology must state this.

## Identity and privacy

Compute the identifier with HMAC-SHA-256:

```text
dailyKey = HMAC(masterKey, UTC date)
DailyClientId = first 128 bits of HMAC(
  dailyKey,
  structured(site host, UTC date, IP, User-Agent)
)
```

Requirements:

- `ANALYTICS_HASH_KEY` is a required Worker secret.
- Encode fields structurally; do not concatenate ambiguous delimiters.
- Scope by host and UTC date.
- Store 128 bits as 32 lowercase hexadecimal characters.
- Never store raw IP or raw User-Agent.
- Do not call the result anonymous. It is a cookieless, daily pseudonymous client estimate.
- Do not claim cross-day, cross-device, or cross-network uniqueness.

A secret HMAC prevents an outsider with leaked rows from enumerating public-date/IP/User-Agent candidates without the key. It does not remove transient personal-data processing or within-day linkage.

## Persistence model

Create a new source-aware read model. Edge observations and copied legacy beacon events share the public timeline, but `observation_source` preserves the measurement boundary.

```sql
CREATE TABLE page_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  referrer_host TEXT,
  country TEXT,
  daily_client_id TEXT NOT NULL,
  traffic_class TEXT NOT NULL CHECK (traffic_class IN ('browser', 'bot', 'ai')),
  agent_name TEXT,
  device_type TEXT NOT NULL CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  is_owner INTEGER NOT NULL CHECK (is_owner IN (0, 1)),
  observation_source TEXT NOT NULL CHECK (observation_source IN ('beacon', 'edge')),
  source_event_id INTEGER,
  observed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

For new edge observations, persist only fields used by the product. Stop collecting city, continent, full referrer paths, raw IP, and raw User-Agent.

Keep the old `page_views` table intact as the source archive. Backfill a minimized copy into `page_observations`: map the traffic class, reduce referrers to hostnames, preserve daily-identifier equality, set `observation_source = 'beacon'`, and retain the old row ID as `source_event_id` for idempotency. New rows use `observation_source = 'edge'`. The public series includes both eras for continuity and explains the August 26 measurement change.

Index the raw UTC timestamp and common predicates. Queries must compare `observed_at` against raw half-open timestamp bounds so the time index remains usable.

## Time contract

UTC is the only reporting zone. The same URL returns the same period for every viewer.

- `7d` means today and the six preceding UTC calendar dates. Group by hour.
- `30d` means today and the 29 preceding UTC calendar dates. Group by day.
- `90d` means today and the 89 preceding UTC calendar dates. Group by day.
- `All` starts at the first edge observation and groups by day.
- The current date is partial. Return `updatedAt` and render it.
- Query with a half-open range: `observed_at >= start AND observed_at < tomorrow_utc`.
- Return every bucket from the start through the current hour/date. Missing rows are zeros.

The API no longer accepts a viewer timezone offset.

## Aggregate contract

Every aggregate in one response uses the same window, path, owner, and traffic-class predicates.

Public filters are `browser`, `bot`, `ai`, and `all`. Owner exclusion applies to all four. For one database snapshot:

```text
All views = Browser views + Bot views + AI UA views
Daily clients <= Page views
sum(time-series views) = total views
sum(path views) = total views when the API returns the complete path set
```

Daily-client values are not additive across buckets because the same daily identifier can appear in several hourly buckets. The UI must not imply that they are.

Remove the separate `ai_fetches` total. The AI filter's page-view count is the scoped AI-UA count.

Return named-agent aggregates when present. `agentName` explains which rule matched; it does not upgrade a heuristic match to verified identity.

## Dashboard contract

The public page is a reader-first transparency surface, not a private operator console.

- Show Page views and Daily clients as the primary cards.
- Group and label traffic and period controls. Expose selected state with `aria-pressed`.
- Show explicit UTC dates, granularity, partial-current-period status, and update time.
- Label rows by unit: pages by views, referrer hosts by views, countries by views.
- Link eligible page paths.
- Show device mix only for the Browser segment; bot device strings are not audience hardware evidence.
- Provide a non-pointer representation of chart values.
- Treat loading, empty, and failure as whole-dashboard states. Never pair new active controls with stale values.
- Place the observation boundary and metric definitions beside the dashboard. The engineering ADR remains supporting detail, not the only explanation.

## Cloudflare Web Analytics

Cloudflare Web Analytics is separate from the first-party D1 dataset and does not feed `/stats`. Until it is disabled in Cloudflare, the privacy page must disclose its JavaScript beacon and purpose. Do not claim that analytics uses no third-party script while it is enabled.

Disabling it is an operational choice outside this repository. The first-party system must remain correct without it.

## Migration and deployment

1. Apply the migration that creates `page_observations` and its indexes.
2. Add `ANALYTICS_HASH_KEY` as a production Worker secret.
3. Deploy the Worker with asset-first observation and the new stats query.
4. Verify edge observations with browser, bot-UA, AI-UA, prefetch, failed, and non-HTML requests.
5. Verify the public dashboard and privacy page.
6. Disable Cloudflare Web Analytics separately if the performance dashboard is no longer wanted; then remove its disclosure in a later served-page change.

The new table permits migration before deployment without breaking the old beacon path. The code deployment is a clean semantic cutover: it removes `/api/event`, removes the browser beacon, and stops querying `page_views`.

## Alternatives rejected

### Keep the client beacon and relabel it

Rejected. Narrower labels would still leave non-JavaScript automation structurally invisible and would not support the intended bot/AI traffic analysis.

### Hide legacy browser data from the public series

Rejected after production review. The old browser events remain meaningful for broad trends, page interest, referrers, countries, and devices. Exact comparability matters less here than preserving the blog's history. A source marker and adjacent disclosure make the method change explicit without discarding the data.

### Keep viewer-local time

Rejected. A numeric current offset cannot reconstruct historical DST boundaries, and identical public URLs should be reproducible.

### Use an unkeyed public-date hash

Rejected. A public date does not prevent offline candidate enumeration. SHA-256 one-wayness does not make low-entropy inputs anonymous.

### Remove client estimates entirely

Rejected. A daily client estimate remains useful if the name, inputs, scope, and limits are explicit. The HMAC and UTC boundary make the contract deterministic and safer.

### Add a framework or analytics vendor

Rejected. The domain is small, D1 is already deployed, and the required policies are easier to test as dependency-free functions.

## Consequences

### Positive

- Non-JavaScript crawlers become observable.
- One request path supplies the path, referrer, User-Agent, IP-derived country, and response status; clients can no longer forge analytics with `/api/event`.
- Public labels match the stored facts.
- UTC windows are reproducible and indexable.
- The package gains a stable domain vocabulary and reusable policy boundaries.
- The source marker keeps the measurement change inspectable while the public timeline preserves the blog's history.

### Negative

- Every static request invokes the Worker before asset delivery. D1 writes remain limited to eligible HTML responses, but Worker invocation volume increases.
- Counts are still best effort and classifiers remain heuristic.
- One public series spans two collection methods: browser beacons before cutover and edge HTML responses after it. Broad trends remain useful, but the eras are not perfectly comparable.
- A required secret adds one deployment prerequisite.
- The original `page_views` table remains as the lossless source archive; the backfill is a minimized read-model copy.

## Verification

Tests must defend these observable contracts:

- eligibility accepts successful HTML `GET` and rejects API, `/stats`, prefetch, `HEAD`, failed, and non-HTML responses;
- classifier priority and named-agent results;
- HMAC stability and separation by key, host, date, IP, and User-Agent;
- exact 7/30/90 UTC date counts and hourly/daily granularity;
- zero-filled time domains;
- owner exclusion and traffic partition reconciliation;
- shared API types compile in both packages;
- built HTML contains no `/api/event` beacon;
- dashboard labels, range text, loading/error states, and methodology match this ADR.

Primary platform references:

- [Cloudflare Workers static asset routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)
- [Cloudflare D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
- [Cloudflare Web Analytics metrics](https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/)
- [Cloudflare verified bots](https://developers.cloudflare.com/bots/concepts/bot/verified-bots/)
- [SQLite date and time functions](https://www.sqlite.org/lang_datefunc.html)
- [RFC 2104: HMAC](https://www.rfc-editor.org/rfc/rfc2104)
- [EDPB: anonymisation and pseudonymisation](https://www.edpb.europa.eu/topics/ai-and-technology/anonymisation-pseudonymisation_en)
