# Analytics wrong-event article — research index

**Working article:** `How I Built First-Party Analytics for a Personal Blog`

**Doorway decision:** the H1 and slug lead with the broad reader job—building first-party personal-blog analytics—while the wrong-event failure remains the article's living center and technical thesis. SEO title: `Blog Analytics with Cloudflare Workers and D1`.

**Cutoff:** 2026-08-26

**Governing decision:** publish the current before/after article now from grounded implementation evidence, earned lessons, present uncertainty, and future intent. The 30-day result is a separate continuation.

## Worklists

- Analytics implementation and production evidence: `FLDR-0001`
- Immediate article research: `FLDR-0002`
- Future publication-philosophy article: `FLDR-0003`

## Immediate article artifacts

| Artifact | Role |
|---|---|
| `TASK-0034` | Living center, form, overlap with `does-llms-txt-work`, protected material |
| `TASK-0035` | Claim, number, schema, deployment, privacy, contradiction, and recheck ledger |
| `TASK-0036` | Primary-source novelty and timing landscape |
| `TASK-0037` | Reader value, title packages, share triggers, and distribution |
| `TASK-0038` | Engineering principles, mental model, anti-patterns, and counterexamples |
| `TASK-0039` | HTML versus non-HTML observation boundary and gated ResourceObservation context |
| `TASK-0040` | Frozen 30-day continuation protocol |
| `TASK-0041` | Code-backed architecture before/after, migrations, invariants, and excerpts |
| `TASK-0044` | Frozen HTML-versus-Markdown representation benchmark; no model runs |
| `TASK-0045` | Integrated immediate-publication decision |

## Author directives

- `PROMPT 0001` — write the analytics rebuild article now
- `PROMPT 0002` — protect active pain and unresolved tension
- `PROMPT 0003` — do not turn that protection into a rigid style
- `PROMPT 0004` — writing as growth in public across past, present, and future
- `PROMPT 0005` — preserve the future article about what, how, and why we write

## Pinned implementation evidence

### Old browser-beacon system

Audited baseline: `c85a629d1074db54d5f9e5c171abbd798be85945`

- `packages/blog/src/templates/page.ts` — inline `/api/event` beacon
- `packages/blog/src/worker/index.ts` — API-only Worker routing
- `packages/analytics/src/index.ts` — beacon ingestion
- `packages/analytics/src/stats.ts` — `ai_fetches` and rotating-hash aggregates

### Edge/source-aware system

Implementation commit: `f9d65ae9618c00c464c4ed274fc52534f352513b`

- `packages/blog/src/worker/index.ts` — Worker composition root and asset fallback
- `packages/analytics/src/eligibility.ts` — eligible successful HTML response
- `packages/analytics/src/index.ts` — `observePageResponse`
- `packages/analytics/src/hash.ts` — daily 128-bit HMAC client ID
- `packages/analytics/src/stats.ts` — UTC aggregate contract
- `packages/analytics/migrations/0002_backfill_legacy_page_views.sql` — source-aware continuity
- `docs/adr/0016-analytics-observation-semantics.md`
- `docs/adr/0016.1-analytics-purpose-and-decision-loop.md`

## Stable article claims

1. The old counter correctly counted a later browser beacon, not the original page request.
2. Non-JavaScript HTML clients and direct non-HTML resource requests could not create old D1 rows.
3. Copy changes could not make the missing event observable; collection had to move.
4. The current event is one recorded successful, non-prefetch HTML `GET`, excluding `/stats`, API, failures, redirects, `HEAD`, and non-HTML resources.
5. The event move forced changes in vocabulary, identity, time windows, schema, Worker routing, API contract, dashboard, privacy, tests, and deployment.
6. The original `page_views` table retains 2,564 source rows. The read model contains 2,564 idempotent source-marked copies and zero missing rows.
7. Historical beacon and new edge rows are useful but not perfectly comparable; `observation_source` preserves the method boundary.
8. Edge analytics is not RUM. Cloudflare Web Analytics remains the separate browser-performance surface.
9. The current PageObservation boundary still excludes `llms.txt`, page Markdown, `llms-full.txt`, feeds, and other non-HTML resources.
10. A correct counter can still support a wrong product claim when the public noun exceeds the recorded event.

## Current contradictions to preserve or resolve

- The query excludes rows marked `is_owner=1`, but no active `OWNER_IPS` binding was observed and no production rows were marked owner. Public copy must not claim that all author traffic is currently excluded.
- The rebuild improves event provenance but does not prove that the effort changes a publishing decision.
- The Worker sees non-HTML requests but D1 intentionally refuses to call them page views.
- Correctness work repaired a public trust problem and may also be another instrument built instead of direct reader contact.

## Publication recheck

Use `TASK-0035` as the exact pre-publication checklist. Re-run current tests/build, verify pinned links and live copy, freeze every volatile number with a timestamp, and search the draft for prohibited identity/use claims.
