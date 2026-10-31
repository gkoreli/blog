# Run analytics without the blog

This local example serves two pages, records eligible responses in D1, marks an owner and returns the real analytics report. It imports the analytics package directly; it uses no blog router, static assets, article catalogue, newsletter or browser JavaScript. The package is private workspace source, not a published npm install.

## Create a separate local project

From the repository root:

```sh
node packages/analytics/scripts/create-local-project.mjs /tmp/my-analytics-evaluation
cd /tmp/my-analytics-evaluation
node --version
pnpm --version
pnpm install
pnpm db:local
pnpm dev
```

The destination must be new. The generator copies the library source, fresh schema and code licence; it creates a private local dependency, a Worker using the package export and separate local D1 configuration. It includes the repository's Node 24.14.1 and pnpm 9.15.4 pins and generates two distinct local keys in an ignored, mode-0600 `.dev.vars`. Confirm those tool versions before installing; a directory outside this repository may otherwise select different defaults. No cloud resources or deployments are created. Retain the generated lockfile for repeat installations.

Installation requires registry access or a populated package cache. The package is still private workspace source, not a published npm release. The generated project has its own Wrangler 4.71.0 dependency; it uses no blog application or blog-installed tooling. Its compatibility date is March 1, 2026, within that pinned local runtime's support. The previous March 6 example silently fell back to March 1 in an actual standalone run; production compatibility remains separate. [Cloudflare's compatibility-date contract](https://developers.cloudflare.com/workers/configuration/compatibility-dates/) explains why a requested date is a behavioral choice rather than a runtime version.

## Run inside this repository

From the repository root with the pinned Node and pnpm versions:

```sh
pnpm install --frozen-lockfile
pnpm -C packages/analytics test:portability
cp packages/analytics/examples/minimal-worker/dev.vars.example packages/analytics/examples/minimal-worker/.dev.vars
```

Replace both example values in `.dev.vars` with different random values. Generate each with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. This ignored file is for local secrets; keep its contents out of Git and shared logs.

```sh
pnpm exec wrangler d1 migrations apply analytics-local-example --local --config packages/analytics/examples/minimal-worker/wrangler.jsonc
pnpm exec wrangler dev --config packages/analytics/examples/minimal-worker/wrangler.jsonc
```

Open the local URL Wrangler prints, visit `/notes`, then inspect `/api/stats?traffic=all`. Try `/notes` with `Accept: text/markdown` for the negotiated twin. `/notes.md`, prefetch, HEAD, errors and API requests do not add observations. This example uses an exact Accept match to illustrate the integration; applications own their actual content negotiation.

`observePageResponse` schedules work with `ctx.waitUntil`; an HTML response does not acknowledge a stored observation. Inspect `analytics.observation_stored` or `analytics.observation_write_failed` in the local console. The automated check waits for scheduled work in its test wrapper before inspecting D1. It uses generated local keys, blocks external Worker requests and disposes its ephemeral instances.

Reports log `analytics.example_report_calculation` with the existing closed calculation receipt. `reportedRowsRead` describes provider-returned query work for that local last attempt; missing counters stay unavailable. This example does not cache calculations. Use those observations to decide whether repeated public report reads need a cache and budget before deploying.

For interpretation, inspect `totals.views`, `totals.dailyClients`, `byKind` and `byAgent` together. A controlled six-event run split into three headless events, two declared ExaSearchBot events and one unresolved event also had three daily IDs. It supports neither “six readers” nor “three people.” All six arrived without referrers; their acquisition source remained unknown. Those are local fixture results, not this blog's readership. A useful operator decision is to require composition and evidence boundaries alongside a total before using that total to select content.

Owner marking uses `POST /api/owner` with `Authorization: Bearer <your local ADMIN_SECRET>`. Keep the same site host, IP and User-Agent for the visit being marked. Marks cover a UTC day and also exclude matching earlier observations. No owner form is included. A changed profile or day needs a new mark.

## What this demonstrates

- The fresh schema installs without a `page_views` table or any historical blog rows.
- The real collector, classifier, owner endpoint and report execute together in local workerd/D1.
- Missing collection configuration exposes failed background work; an unavailable report returns 503 with `no-store` rather than zero traffic.
- A declared ExaSearchBot stays an unsigned search-crawler claim. An unsigned declaration does not authenticate Exa or establish a human task.
- Optional diagnostics, calibration and native capture remain off.

Local requests are automation controls. Miniflare can change Fetch Metadata in transit; the test does not assert human/browser accuracy or native bot-service agreement. Daily ID separation across hosts is tested, but **use a separate D1 database per site**: stored observations have no tenant column and a shared database would mix reports.

## Schema ownership and deployment boundary

The existing [`migrations/`](../../migrations/) chain is the blog's upgrade history. It expects a legacy table and contains site-specific data backfills, including row-ID assignments. Do not run that chain against another site's data. The separate [`schema/`](../../schema/) directory contains an empty-install baseline through migration 0016, including dormant optional tables. It creates no historical rows and deliberately fails on an existing schema.

`node packages/analytics/scripts/fresh-schema.mjs --check` and the normal analytics tests compare all table/index definitions with the historical chain replayed against an empty legacy fixture. Schema changes must update the baseline and provide a deliberate upgrade migration for installations already using it. Replacing an applied baseline is not an upgrade. The example has a distinct local migration history; never point the blog's existing database at it.

The config has a dummy database ID and no deployment routes. This is a local integration example. Before a separate deployment, select an actual database, set independent secrets, decide retention and privacy obligations, and add report caching/rate budgets appropriate to that operator. The example report calls `handleStats` directly; it does not include the blog's one-hour calculation cache or a global query budget. Vendor verification may make documented directory/feed subrequests on real eligible requests. Review those boundaries before enabling public traffic.

Cloudflare documents the [`migrations_dir` and ordered migration contract](https://developers.cloudflare.com/d1/reference/migrations/), [local D1 development](https://developers.cloudflare.com/d1/best-practices/local-development/) and [`ctx.waitUntil`](https://developers.cloudflare.com/workers/runtime-apis/context/). Our accepted result is local compatibility under the installed tool versions, not production parity, independent adoption or EU/US compliance.
