# A fresh installation without the blog's history

October 31, 2026 UTC. The owner asks for alternative ways to continue building while away from the Mac. Following [ADR-0019's product path](../../../../../docs/adr/0019-agentic-engineering-publication-and-analytics-ambition.md#analytics-product-path), test one concrete prerequisite for another operator: can the library collect and report without the blog application or its existing database?

## The gap and repair

The historical chain fails on an empty database: migration 0002 selects from the old `page_views` table. Migration 0007 also assigns network evidence to this blog's historical row IDs. Those are legitimate site upgrade operations, but unsuitable instructions for another site's installation.

The new [minimal Worker](../../../../analytics/examples/minimal-worker/README.md) uses a separate fresh schema through migration 0016. Its five tables and eight explicit indexes match the historical chain replayed against an empty legacy fixture. Tests compare the full stored SQL definitions, so columns, checks, foreign keys and indexes cannot silently drift. The baseline contains no legacy table, historical rows or data backfills. Existing database upgrades remain a separate migration responsibility; do not replace an applied baseline to upgrade a site.

The example imports the real analytics collector, owner endpoint and report. It needs no blog router, generated catalogue, static assets, newsletter or browser JavaScript. No new dependency, production entry change, historical migration edit or tracking expansion is involved. The package remains private workspace source; this is not an independently installed npm product.

## Accepted local result

The [receipt](fresh-install-portability-checks.json) records the source hashes, command and checks. Wrangler 4.71.0 applies `0001_fresh_analytics.sql` to a new **local** D1 database successfully, reporting 14 commands. The documented portability command passes in native local workerd/D1 with external Worker requests blocked:

- 22 controlled requests produce six stored events; three remain public after matching owner marks exclude three events, including earlier observations.
- HTML and negotiated Markdown collect; HEAD, prefetch, direct `.md`, errors and API requests do not add observations.
- ExaSearchBot is retained as an unsigned `ai-search` declaration; the headless control remains `headless-browser`.
- Hostnames produce distinct daily IDs. **Separate databases are still required per site:** the observations table has no tenant column and shared reports would mix sites.
- Missing hash configuration produces rejected background work while the page responds. An uninitialized report returns 503 with `no-store`, preserving failure rather than displaying a plausible zero.
- Diagnostics and calibration tables stay empty; zero production requests and zero human labels are added.

The test wrapper awaits scheduled work before reading D1; the example itself uses `ctx.waitUntil` and returns promptly. The normal-UA controls are stored as `http-client` under the local transport, which can alter Fetch Metadata. They are not human/browser calibration evidence. The first sandbox invocation fails at a denied loopback listener; approved local runtime execution passes. This does not repair or retry the production query authorization failure.

All **387 analytics tests** and workspace typechecks pass. The final smoke command loads the actual fresh snapshot, not the historical migration helper. Raw local logs remain in the ignored evidence archive; the receipt hashes its four-file manifest. The retrospective article remains concise and unchanged; this result adds an installation lesson rather than a new readership claim.

## Native contracts and next decision

Cloudflare's [D1 migration contract](https://developers.cloudflare.com/d1/reference/migrations/) supports ordered SQL files and a distinct `migrations_dir`; its [local-development guide](https://developers.cloudflare.com/d1/best-practices/local-development/) describes a local database environment. The [context API](https://developers.cloudflare.com/workers/runtime-apis/context/) explains extending work with `waitUntil`. These documents support the setup and lifecycle choices. Our evidence establishes compatibility with the installed local tools, not current production parity or guaranteed write completion.

This bounded implementation is complete; independent adoption is unmeasured. Next, have a separate operator try the example in a disposable project and record setup failures, metric comprehension, query cost and a real decision it supports. Public deployment needs its own database/secrets, deliberate upgrade path, report caching/budgets and unresolved privacy/retention decisions. The six outstanding native/search/human/privacy/source-purpose/query inputs remain under their existing gates; no sign-in, protection bypass or human-trial retry follows from this repair.
