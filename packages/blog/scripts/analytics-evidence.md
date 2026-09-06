# Extract analytics evidence

`analytics-evidence.ts` captures aggregate production evidence for the [iteration plan](../drafts/research/readers-vs-bots/14-evidence-backed-implementation-plan.md). It extends the SQL investigation in artifact 12 into a repeatable command. It does not modify production rows, run migrations, deploy, request article pages, or change classification.

**Referral-policy boundary (September 6):** these baseline queries preserve their original population, with owner exclusions and no referral-abuse exclusion. After ADR-0016.5 is deployed, public `/api/stats` additionally excludes reviewed referral abuse. Do not expect this extractor's totals to equal that API. Preserve the raw baseline; capture the API's `referralPolicy.version` and `excludedViews` separately when comparing it with the dashboard. A lower post-policy count is a reporting-method change, not an independently measured accuracy improvement.

Run from the repository root:

```bash
pnpm -C packages/blog exec tsx scripts/analytics-evidence.ts \
  --start 2026-09-04 --end 2026-09-06 \
  --account-id 7e0dc86ef69b4572a63162a52cddd269 \
  --out /tmp/blog-analytics-evidence-20260906
```

The account ID identifies the existing blog account; it is not a credential. RUM uses `CLOUDFLARE_API_TOKEN` if set, otherwise the existing default Wrangler OAuth configuration. D1 and deployment reads use the installed Wrangler CLI. Credentials are neither printed nor included in artifacts. Authentication failures leave incomplete evidence and a nonzero exit status; they are not zero traffic.

The start is inclusive and the end is exclusive. Both are UTC dates. The command rejects partial current days, invalid dates, ranges longer than 31 days, and existing output directories. The output parent directory must exist. Use `--d1-only` if RUM is deliberately outside the capture scope; it never produces a cross-source ratio. No account ID is needed in that mode.

## Files and interpretation

- `queries.sql`: exact fixed SELECT statements, named for their result blocks. Includes migrations, revisions, owner marks, daily totals, paths, source provenance, signatures, browser/referrer clusters, predicate ablation, and aggregate same-second bursts.
- `d1.json`: validated results with capture times and zero-write metadata for every statement. The query uses the existing owner read-model exclusion consistently. Cluster queries aggregate daily IDs inside D1 without exporting them.
- `rum-<day>-bots-excluded.json` and `rum-<day>-all.json`: exact GraphQL query and validated group fields, separate bot-filter populations, timing, and sample intervals. A failed capture records a bounded error instead of counts. Results at the 10,000-group limit are rejected rather than presented as complete.
- `deployments.json`: observed deployment history, separately from the local Git revision.
- `comparison.json` and `report.md`: daily comparisons, excluded dashboard/API loads, unmatched-path warnings, and ratios where checks permit them.
- `manifest.json`: window, completion state, limitations expressed through failures, script hashes, Git revision, and SHA-256 commitments to the other artifacts. It does not hash itself. These hashes detect changed files; they do not independently authenticate Cloudflare data.

Private directory/file permissions are requested at creation. This is research evidence, not an automatically publishable export. Although raw IPs, raw UAs, and daily identifiers are absent, small aggregates, request paths, referrer/signer names, and deployment metadata still need review before sharing. The output remains outside the repository in the example.

D1 Browser **HTML** events are compared with RUM page loads, never visits. `/stats`, its descendants, and API routes are excluded from RUM. Other RUM paths absent from all D1 HTML paths in the window cause a warning and withhold the ratio; they are not dropped. This conservative check still needs interpretation: path overlap cannot establish identical request eligibility, and owner filters differ between sources. The D1 database is assumed dedicated to gkoreli.com because observations do not store a hostname.

Sampled groups are retained with their sample intervals; counts are never manually multiplied by that interval. Ratios are withheld when sampled, when the denominator is zero, when paths need review, or when D1 panels fail reconciliation. A missing source cannot produce a whole-window ratio. Check the manifest and report even when the process exits successfully: sampled but successfully captured data can require review.

Queries are sequential and not a cross-source transaction. Late ingestion, data aggregation, and historical reclassification can change a later capture of the same dates. Save a new directory each time. Whole-window ratios divide summed views by summed loads; they do not average daily ratios or add daily-client counts.

Cloudflare documents seven days of unsampled RUM storage before longer-term aggregation, along with query-time sampling and possible beacon loss. Preserve complete-day snapshots within that window; exporting them does not make them a human-audience ground truth. [Cloudflare RUM FAQ](https://developers.cloudflare.com/web-analytics/faq/), [GraphQL sampling](https://developers.cloudflare.com/analytics/graphql-api/sampling/).

## Validation

```bash
pnpm -C packages/blog exec tsx --test test/analytics-evidence.test.ts
pnpm -C packages/blog exec tsc --noEmit --strict --skipLibCheck \
  --target ES2023 --module NodeNext --allowImportingTsExtensions \
  scripts/analytics-evidence.ts scripts/analytics-evidence.models.ts
```

Tests exercise real SQLite SELECTs against the analytics schema, owner exclusion, date validation, sensitive-ID omission, sampling, GraphQL partial/truncated results, path mismatches, zero denominators, and filter semantics. This script is extraction only. Raw Worker-log collection, new telemetry, ongoing scheduling, and the controlled-client experiment are separate work.
