---
title: "How I Built First-Party Analytics for a Personal Blog"
seoTitle: "Blog Analytics with Cloudflare Workers and D1"
alternativeHeadline: "A Cloudflare Workers and D1 architecture for public, source-aware personal blog analytics"
date: "2026-08-26"
description: "A code-backed guide to first-party blog analytics with Cloudflare Workers and D1: edge events, privacy, migrations, and public stats."
section: engineering
tags: [analytics, cloudflare-workers, d1, privacy, observability]
series:
  id: "measurement-boundaries"
  title: "Measurement boundaries"
  order: 2
researchFootprint:
  sessions: 27
  artifacts: 37
  totalTokens: 365815028
  inputTokens: 365082271
  cachedInputTokens: 359472896
  outputTokens: 732757
  reasoningOutputTokens: 284481
  wallClockMinutes: 898
  startedAt: "2026-08-26T04:53:10.248Z"
  measuredAt: "2026-08-26T19:51:10.023Z"
  provenanceUrl: "https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/analytics-wrong-event"
---

# How I Built First-Party Analytics for a Personal Blog

<p class="post-orient">A code-backed guide to first-party analytics for a personal blog—Cloudflare Workers, D1, public stats, privacy tradeoffs, and the wrong event that forced a rebuild.</p>

The rebuild is deployed. The dashboard is live. The old data is still there.

I still do not know if this was the right thing to spend my time on.

A few hours into the rebuild, I stopped and asked:

> "do you know why are we doing any of this at all? whats the goal"

That question is still open.

I want readers. I built a public analytics dashboard because I wanted to know whether anyone was arriving, which work found a path out of my own browser, and whether machines were requesting the agent-readable layer I had published.

Then [the `llms.txt` investigation](/does-llms-txt-work) reached the number labeled **AI Reads**.

The number was 97. The query was correct. The claim was not.

The implementation is a first-party, cookieless system on Cloudflare Workers and D1. The underlying choice—client-side versus server-side analytics—starts with a smaller question: what exact event do you want one row to mean?

## Why my JavaScript analytics beacon measured the wrong event

The old system began after a page loaded in a browser.

```text
GET /article
  -> static HTML bypasses application Worker
  -> browser executes JavaScript
  -> POST /api/event
  -> classify the POST User-Agent
  -> write one page_views row
  -> count visitor_type = 2 as ai_fetches
```

A row meant: a client ran the page script, delivered a later analytics request, and D1 accepted the write.

That event was useful. It could count browser-rendered page events, derive a cleaned referrer hostname/path from `document.referrer`, estimate daily clients, and stay cheap because ordinary static requests never invoked my Worker.

But I used that row to support stronger nouns:

- **Page view** sounded like the original page request.
- **Visitor** sounded like a person.
- **Human** sounded verified.
- **AI Read** sounded like an AI system fetched and used the page.

None of those facts existed in the row.

A normal crawler could request the HTML without executing JavaScript. A client could request `/llms.txt` or a page's Markdown representation directly. Those requests bypassed both the application Worker and the browser beacon.

> "A correct counter can make the wrong claim more convincing."

## Why copy and SQL could not fix client-side analytics

The tempting repair was smaller:

- rename AI Reads;
- add more crawler patterns;
- fix the date window;
- explain Visitors in a tooltip;
- keep the architecture.

Those changes would have improved the public language. They would not have made a non-JavaScript request observable.

The claim I wanted lived at the HTTP response boundary. Collection had to move there.

The Worker now handles application routes first, then serves the static asset once and gives the actual request and response to analytics:

```text
GET /article
  -> Worker routes known APIs or fetches the static asset
  -> inspect the actual response
  -> require successful, non-prefetch HTML
  -> minimize metadata, classify the UA, derive the daily HMAC ID
  -> waitUntil INSERT page_observations(source = edge)
  -> aggregate one source-aware UTC contract for /api/stats
```

```typescript
const response = await env.ASSETS.fetch(request)
observePageResponse(request, response, env, ctx)
return response
```

The eligibility policy is deliberately narrow:

```typescript
export function isEligiblePageResponse(
  request: Request,
  response: Response,
): boolean {
  if (request.method !== 'GET' || !response.ok) return false

  const path = new URL(request.url).pathname
  if (path === '/stats' || path.startsWith('/stats/') || path === '/api' || path.startsWith('/api/')) return false
  if (isPrefetch(request)) return false

  const contentType = response.headers.get('Content-Type')
  return contentType !== null && /^text\/html(?:\s*;|$)/i.test(contentType)
}
```

One new `PageObservation` means one recorded successful, non-prefetch HTML `GET`.

It does not mean the page rendered. It does not mean anyone read it. It does not mean the requester was a person. The D1 write is scheduled with `waitUntil`, so it remains best effort.

The event is smaller than the story I wanted. That is the point.

## What changed across the analytics stack

I expected to replace the beacon and adjust one query.

Instead, the event definition reached through the whole system.

| Layer | Before | Now | Why I chose it |
|---|---|---|---|
| Routing | Static pages bypassed application code; only `/api/*` ran Worker-first. | Every request reaches the Worker, which serves the asset once and observes the actual response. | The original HTML request has to cross the instrument if Page view is going to mean a served page. |
| Event | A row began with a later browser `POST /api/event`. | A row begins with an eligible successful HTML `GET`; persistence remains best effort. | Copy and SQL cannot recover a request the sensor never saw. |
| Vocabulary | Human, Visitor, and AI Read implied identity or cognition. | Browser, Daily client, Bot, AI UA, and Page view name observable or explicitly heuristic facts. | Public nouns should be the epistemic ceiling of the row. |
| Referrer | JavaScript sent `document.referrer`; ingestion stored a cleaned hostname + path. | The original HTML request supplies its `Referer` header; the read model keeps the external hostname only. | Attribution now belongs to the event being counted. Host-level data answers channel decisions while reducing sensitive detail and fragmented rows. |
| Identity | A public UTC date acted as the salt for a 64-bit SHA-256 prefix. | A Worker secret derives a daily HMAC key; D1 stores a 128-bit site/day client ID. | Keep within-day estimation while making offline candidate testing require the secret. It remains pseudonymous, not anonymous. |
| Storage | `page_views` mixed old product words with nullable/defaulted fields. | `page_observations` constrains class, device, identity, owner, source, and timestamp; `page_views` stays the lossless archive. | Preserve history and provenance without pretending both collection methods mean the same thing. |
| Time | The viewer's current offset shifted historical rows, and `30d` included 31 dates. | UTC half-open windows produce exactly 7/30/90 dates and zero-filled hourly/daily buckets. | The same public URL should return the same reproducible period for every reader. |
| Aggregates | AI Reads ignored the active filter; owner predicates differed; chart fields changed granularity without changing language. | Every aggregate shares owner, traffic-class, path, and time predicates; both source eras remain visible. | One response should describe one population. `observation_source` preserves provenance rather than becoming a hidden filter. |
| Presentation | New filter pills could temporarily sit above stale cards; failures left partial skeletons; units were implicit. | Loading, empty, failure, selected state, units, UTC range, accessible chart data, and methodology move together. | A mathematically correct response can still become a misleading interface. |
| Privacy | Public copy said path/referrer only and fingerprint-free while more fields and a daily IP + UA identifier were stored. | The privacy page names transient inputs, stored fields, linkage, indefinite retention, legacy history, and separate Cloudflare Web Analytics. | Privacy is a threat model and disclosure contract, not the word cookieless. |

The public label was not decoration. It was the top of a data contract.

Changing the noun without carrying the meaning through storage, queries, privacy, and presentation would have left another version of the same bug.

## The Cloudflare Workers and D1 architecture

The Blog Worker owns HTTP routing and static delivery. The analytics package owns the meaning of a page observation. D1 stores source-aware facts. The stats service aggregates them but cannot reinterpret them into people, reads, or verified agents.

```text
Blog Worker
  -> eligibility policy
  -> metadata minimization
  -> traffic classification
  -> daily client identity
  -> observation repository

Stats request
  -> query parser
  -> UTC window policy
  -> aggregate query service
  -> zero-filled time series
  -> shared public response contract
```

I used composition because those policies vary independently. Eligibility can change without changing HMAC construction. A new User-Agent rule does not need a new repository subtype. The Worker remains the composition root instead of becoming a superclass for analytics behavior.

The boundary also prevented a concrete dependency leak. My first shared `StatsResponse` export pulled Worker-only D1 types into the browser's TypeScript program. Moving the public contract to a browser-safe `contracts` entry point restored the direction: the blog consumes analytics vocabulary without importing analytics infrastructure.

This is the useful part of domain-driven design here: split meanings and reasons to change, not files for their own sake. `PageObservation` owns served HTML. A future non-HTML `ResourceObservation` would be a different context because its unit, privacy needs, retention, and product question are different.

## How referrer attribution works now

The old beacon could not use the `Referer` header on `POST /api/event`: that request came from the article to the same site, so its HTTP referrer described the current blog page. The browser had to send the navigation source explicitly:

```text
document.referrer
  -> beacon JSON body
  -> parse URL
  -> remove self-referrals and query/fragment
  -> store hostname + pathname
```

That path-level detail was useful. It could distinguish `reddit.com` from a specific Reddit thread or `github.com` from one repository page.

The edge model observes the original HTML request, so the request already carries the relevant `Referer` header. The current policy reads it at the event boundary:

```typescript
function referrerHost(request: Request, siteHostname: string): string | null {
  const raw = request.headers.get('Referer')
  if (raw === null) return null

  try {
    const host = new URL(raw).hostname.toLowerCase().replace(/^www\./, '')
    const selfHost = siteHostname.replace(/^www\./, '')
    return host === selfHost ? null : host
  } catch {
    return null
  }
}
```

The read model keeps only the external hostname.

I chose host-level attribution because the decisions I currently make are channel-level: did a reader arrive from Reddit, Google, Hacker News, X, GitHub, or ChatGPT? Host aggregation avoids splitting one channel into many path rows, stores less potentially sensitive detail on a low-traffic personal site, and removes a client-supplied field from the event body.

The tradeoff is real. I can no longer tell which exact Reddit thread, short link, or repository page sent a new edge observation. The untouched legacy archive still retains its cleaned hostname + path values; the public continuity copy normalizes them to hosts so the combined referrer list has one meaning.

Browser referrer policy, `noreferrer`, redirects, and privacy tools can still suppress or reduce the header. `null` means unattributed, not necessarily direct.

The tenet I am carrying forward is field-level: when an event moves, explain where every important field comes from now, why its granularity changed, and what decision justified the loss.

## Cookieless analytics does not mean anonymous

The old identifier was the first 64 bits of:

```text
SHA-256(UTC date + IP address + User-Agent)
```

The date changed every day, but it was public and deterministic. Calling the result one-way did not make low-entropy inputs anonymous. A candidate IP and common User-Agent could still be tested offline.

The new edge identifier derives a daily key from a required secret, then signs a structured site/date/IP/User-Agent payload with HMAC-SHA-256. D1 stores the first 128 bits.

```text
daily key = HMAC(master key, UTC date)
client ID = HMAC(daily key, site + date + IP + User-Agent)[0..128]
```

Raw IP and raw User-Agent are not stored in the edge table. The identifier still links requests within one UTC day. It is still pseudonymous. It is not a person, and it is not anonymous.

Cloudflare's Worker temporarily sees the raw inputs. D1 retains the minimized observations without automatic expiration. The master key lives as a Worker secret, and I have not claimed a rotation schedule. Compromise of that boundary changes the enumeration threat; “no cookies” does not remove it.

That wording is less comfortable than “cookieless and fingerprint-free.” It is also closer to the system I built.

## How I migrated five months of blog analytics without losing history

My first cutover plan was architecturally neat:

1. leave `page_views` as a legacy archive;
2. create `page_observations`;
3. start the public chart again from zero;
4. never mix the two event meanings.

Then I inspected production.

The old table contained **2,564 rows** from March 7 through August 26:

- 2,120 Browser-class beacon events;
- 347 Bot-class beacon events;
- 97 AI-UA-class beacon events;
- 39 paths;
- 32 referrer values;
- 69 countries.

The data was not perfect. It was still meaningful.

When I kept calling the two eras incomparable, I was solving the architecture more aggressively than the actual problem. This is my blog. I wanted its history.

So I changed the decision again.

The original table remains intact as the lossless source archive. A migration copies a minimized representation into the public read model and marks every copied row:

```text
observation_source <- beacon
source_event_id <- page_views.id
```

New rows use `observation_source = 'edge'`.

The migration duplicates each legacy 16-hex daily ID to 32 hex characters. That preserves equality and distinct-count behavior; it does not add entropy or invent a stronger historical identity. It maps the old classes without inventing agent names, and a partial unique index makes the copy idempotent.

Production verification found:

- source rows: **2,564**;
- copied rows: **2,564**;
- missing rows: **0**;
- mismatched copied fields: **0**.

The public timeline now contains both eras. They are not perfectly comparable. The source marker and methodology say so.

I chose useful continuity over single-era purity. That is not permission to combine arbitrary metrics. It is a judgment call whose provenance remains inspectable.

## What client-side analytics was still better at

Moving to the edge solved the event I cared about. It did not make the old design foolish.

The browser beacon had real advantages:

- Static page delivery did not invoke application code.
- Blocked JavaScript naturally stayed outside a browser-rendered metric.
- `document.referrer` described browser navigation.
- A `localStorage` flag could suppress my own beacon before it spent a Worker request or D1 write.
- Browser timing and experience belong closer to Real User Monitoring than edge request analytics.

The edge system pays for broader visibility. Every static request now enters the Worker before the asset binding, even though only eligible HTML responses create D1 rows. Bot and AI classes still rely on sender-provided User-Agent strings. Writes remain best effort.

Server-side is not universally better than client-side. It is better for the event this metric claims to represent.

## Edge analytics versus Real User Monitoring

The two instruments answer different questions.

| Edge PageObservation | Real User Monitoring |
|---|---|
| Was an eligible HTML response served? | What happened inside a real browser? |
| Can observe non-JavaScript clients | Requires browser execution |
| Sees HTTP method, path, status, media type, referrer, and request metadata | Sees rendering, Core Web Vitals, resources, interactions, and browser failures |
| Cannot prove rendering or reading | Cannot see many direct crawler requests |

Cloudflare Web Analytics remains enabled as the separate RUM-like performance surface. My first-party D1 dashboard does not ingest it.

I do not need to choose one instrument and pretend it answers both questions.

## Why page analytics should not count llms.txt or Markdown

`run_worker_first: true` means the Worker now sees requests for:

- `/llms.txt`;
- `/llms-full.txt`;
- page-level Markdown;
- `/posts.json`;
- RSS;
- HTML and ordinary assets.

D1 intentionally records only eligible HTML as Page observations.

That means the rebuild still does not answer the exact non-HTML retrieval question that helped trigger it. This is not another forgotten branch. It is a bounded-context decision: a Markdown request is not a page view.

[Cloudflare request analytics](https://developers.cloudflare.com/ai-crawl-control/reference/graphql-api/) can estimate successful requests to those paths, while AI Crawl Control provides a narrower crawler view. Sampling and sender-identity limits still apply. The exact gate remains in [the predecessor's measurement protocol](/does-llms-txt-work#how-to-test-llmstxt-by-stage). A separate `ResourceObservation` model earns engineering only if repeated requests cross that gate and the result changes a decision.

I fixed one observation boundary. I did not create a universal traffic event.

## Owner exclusion still needs server-side configuration

The query consistently excludes rows where `is_owner = 1`.

But implementation capability is not production evidence. During the article audit, the active Worker did not expose an `OWNER_IPS` binding, and neither era contained rows marked as owner.

So I cannot currently prove that my own requests are excluded.

The public methodology used to say they were. I corrected that wording while writing this article: only rows marked as mine are excluded, and that marking depends on server-side configuration. The remaining limit is operational, not hidden behind the predicate.

## What I am building toward

I am not trying to reproduce Google Analytics on a smaller budget.

I want a public decision instrument for one personal publication:

- enough reach data to know whether work leaves my own browser;
- page and referrer evidence that can change content, discoverability, or distribution;
- automation classes without calling a User-Agent match a read;
- visible collection-method changes instead of a magically continuous chart;
- a privacy model that names transient inputs, retained fields, linkage, and deletion honestly;
- separate instruments for served HTML, browser performance, non-HTML resources, referrals, and actual reader contact;
- a stop condition: if a metric cannot change a named decision, I do not need to build it.

That vision explains why I spent the effort. The dashboard is public, the implementation is open, the historical source remains intact, and the method is inspectable. If I ask readers to trust a number, I want them to be able to see what became a row and where the claim stops.

It also limits the future work. The next steps are not “collect everything.” They are:

1. configure and verify server-side owner marking;
2. finish the declared 30-day comparison without changing the event mid-window;
3. keep using Cloudflare Web Analytics for RUM rather than duplicating it;
4. observe non-HTML resource demand through existing Cloudflare evidence before deciding whether `ResourceObservation` deserves its own schema;
5. prefer replies, corrections, subscriptions, citations, and reports of use over adding another dashboard card.

The architecture is a bet that a smaller, explicit model will teach me more than a large system with convenient nouns.

## An event-first checklist for trustworthy analytics

### Name the event and its strongest noun

Write the event as a sentence:

```text
actor
  -> action
  -> eligibility boundary
  -> observation point
  -> persistence point
  -> strongest supportable public claim
```

If the claim needs an event the instrument cannot observe, weaken the claim or move collection.

“Human,” “visitor,” “read,” and “AI” add identity or intent. If the row does not contain evidence for that addition, the word is a data bug with good typography.

### Split meanings, not files

Create a bounded context when two questions use different nouns, retention, privacy, or reasons to change. Page observations, non-HTML resource requests, RUM, referrals, and reader contact are related. They are not one analytics event with optional columns.

### Preserve method changes as data

A migration between measurement systems changes row meaning. Keep the source archive. Mark the read model with the collection method. Make the copy idempotent. Preserve unknowns instead of backfilling confidence.

### Privacy is a threat model

“No cookies” is not enough. Name the input, linkage window, stored fields, secret boundary, retention, and attacker. Call pseudonymisation what it is.

### Every metric needs a decision

The allowed outcomes for this blog are small:

- correct content;
- improve discoverability;
- change distribution;
- run a bounded experiment;
- do nothing.

If a metric cannot change one of those decisions, I do not need it.

The remaining question is allocation.

I still do not know whether rebuilding this instrument was the right use of attention. I repaired a public trust problem. I also spent hours on analytics for a publication whose product is writing and contact with readers.

A frozen 30-day continuation will compare a clean edge window with the historical beacon era, track cost and failures, and keep HTML observation separate from RUM and non-HTML requests.

Right now I have a more honest event, 2,564 preserved rows, an owner-marking mechanism I still need to configure, and a question no dashboard can answer:

Was repairing this instrument the right thing to do for a publication whose product is writing?

If you have built a precise counter for the wrong event, tell me where you found the mismatch. I am [@GogaKoreli](https://x.com/GogaKoreli).

---

## Evidence ledger

**Implementation and live evidence checked:** August 26, 2026. Provider behavior and production totals are volatile; event boundaries, source lineage, and decision rules are the durable layer.

| Term / claim | Source | Evidence date |
|---|---|---|
| Original beacon could not observe direct static-resource requests | [Does llms.txt Work?](/does-llms-txt-work) and [pinned old implementation](https://github.com/gkoreli/blog/tree/c85a629d1074db54d5f9e5c171abbd798be85945/packages/analytics) | Aug 2026 audit |
| Edge PageObservation contract | [ADR-0016](https://github.com/gkoreli/blog/blob/f9d65ae9618c00c464c4ed274fc52534f352513b/docs/adr/0016-analytics-observation-semantics.md), [eligibility](https://github.com/gkoreli/blog/blob/f9d65ae9618c00c464c4ed274fc52534f352513b/packages/analytics/src/eligibility.ts), and [Worker composition root](https://github.com/gkoreli/blog/blob/f9d65ae9618c00c464c4ed274fc52534f352513b/packages/blog/src/worker/index.ts) | Aug 26, 2026 |
| Referrer before/after policy | [Old client-referrer cleaning](https://github.com/gkoreli/blog/blob/c85a629d1074db54d5f9e5c171abbd798be85945/packages/analytics/src/index.ts#L11-L23), [current request-header policy](https://github.com/gkoreli/blog/blob/f9d65ae9618c00c464c4ed274fc52534f352513b/packages/analytics/src/metadata.ts#L11-L39), and [legacy hostname normalization](https://github.com/gkoreli/blog/blob/f9d65ae9618c00c464c4ed274fc52534f352513b/packages/analytics/migrations/0002_backfill_legacy_page_views.sql#L25-L31) | Aug 26, 2026 |
| Daily HMAC identity and minimization | [HMAC implementation](https://github.com/gkoreli/blog/blob/f9d65ae9618c00c464c4ed274fc52534f352513b/packages/analytics/src/hash.ts), [metadata policy](https://github.com/gkoreli/blog/blob/f9d65ae9618c00c464c4ed274fc52534f352513b/packages/analytics/src/metadata.ts), [RFC 2104](https://www.rfc-editor.org/rfc/rfc2104) | Aug 26, 2026 |
| 2,564 source rows preserved with source-aware continuity | [Migration](https://github.com/gkoreli/blog/blob/f9d65ae9618c00c464c4ed274fc52534f352513b/packages/analytics/migrations/0002_backfill_legacy_page_views.sql), [production cutover evidence](https://github.com/gkoreli/blog/blob/f9d65ae9618c00c464c4ed274fc52534f352513b/docs/tasks/TASK-0020.md), and [article claim audit](https://github.com/gkoreli/blog/blob/main/docs/tasks/TASK-0035.md) | Aug 26, 2026 |
| Analytics purpose and stop condition | [ADR-0016.1](https://github.com/gkoreli/blog/blob/0df8c5936b2cfa6a1d9f77218262aacbd489100c/docs/adr/0016.1-analytics-purpose-and-decision-loop.md) | Aug 26, 2026 |
| Worker-first static asset routing | [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/) | Accessed Aug 26, 2026 |
| Cloudflare Web Analytics is browser-side RUM | [Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/) and [JavaScript setup](https://developers.cloudflare.com/web-analytics/get-started/) | Updated Apr 16, 2026; accessed Aug 26 |
| Pseudonymisation is not anonymisation | [EDPB: anonymisation and pseudonymisation](https://www.edpb.europa.eu/topics/ai-and-technology/anonymisation-pseudonymisation_en) | Accessed Aug 26, 2026 |
