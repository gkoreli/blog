# Analyze saved Search Console evidence privately

This offline tool answers: **which supplied query/page rows point to an article worth inspecting or improving?** It requires no Google sign-in, API token, database or site visit. It makes no claim about our current search traffic until real evidence is supplied.

Run the clearly labelled synthetic demonstration:

```sh
node packages/blog/scripts/search-evidence.mjs --demo /tmp/search-evidence-demo
```

Input must be a regular UTF-8 JSON file without a BOM; malformed encoding, devices and FIFOs are rejected. Reads are capped on the opened descriptor, including a growing file. The destination must be new. Open `brief.md` for the article/query tables or `report.json` for the full analysis and source-byte hash. Demo output also includes `evidence.json`, showing the exact input structure. The private directory uses mode `0700`; files use `0600`. An existing destination is never overwritten. The command logs only status, provenance, row count and output path.

For a real saved API response, create a private evidence pack with the same structure as [the synthetic example](examples/search-evidence.demo.json). Keep its request context with the response:

- Set `provenance` to `provided-api-response` and record the UTC capture timestamp.
- Set the Search Console property and catalogue origin explicitly. Supply canonical article paths/titles in `articles`.
- Copy the actual API request and response. Ordered dimensions must be exactly `page` and `query`, in either order. The returned aggregation must be `byPage`.
- Preserve inclusive PT dates, type, filters, `dataState`, row limit and offset. Native defaults are recorded when omitted. Finalized and potentially preliminary inputs remain distinct.

Then run:

```sh
node packages/blog/scripts/search-evidence.mjs /private/path/evidence.json /private/path/new-search-brief
```

Use authorized exports obtained separately. This command never accesses Google, reconstructs credentials or bypasses the pending account-access decision. Real query text and derived files stay private, outside Git. A supplied file is not authenticated merely because it has the API's shape.

Supported input is **one saved Search Analytics API query/page slice**, within the eight-MiB input budget, native 25,000-row request limit and a 1,024-entry local catalogue cap. Dates remain `America/Los_Angeles` calendar dates with both endpoints included. The tool does not convert them to D1 UTC windows, combine slices, fetch pagination or compare periods. Missing response aggregation or unsupported dimensions fail explicitly. CSV, Sheets, XLSX, dashboard comparisons and bulk BigQuery exports need separate adapters; they are not silently interpreted as this API profile.

The brief contains selected-row article counts, queries with clicks, and queries with impressions but no clicks. These are inspection leads, not a diagnosis of poor titles or proof of unmet total demand. A page absent from the returned rows is listed as unavailable, never assigned zero demand. URL variants, unknown pages and other origins remain separate. CTR is recomputed from selected counts; API position stays per row.

Google documents [the request/response contract](https://developers.google.com/webmaster-tools/v1/searchanalytics/query) and [detail loss and retrieval limits](https://developers.google.com/webmaster-tools/v1/how-tos/all-your-data). Request filters are retained, not re-executed with JavaScript regex. Neither a short result nor exhausted pagination proves complete search activity. Google also warns that [dashboard exports can convert unavailable displayed metrics to zero](https://support.google.com/webmasters/answer/7576553#exporting-report-data); this tool therefore does not accept UI CSV zeros as authenticated API measurements.

The CLI runs directly on the repository's pinned Node 24.14.1 through its native erasable-TypeScript support; workspace type checking remains separate. [Node's documentation](https://nodejs.org/docs/latest-v24.x/api/typescript.html) describes that boundary.

Library users can import `analyzeSearchEvidence` and `renderSearchEvidence` from `@gkoreli/analytics/search-evidence`. They have no transport or storage dependency and do not enter the collector bundle. The native-local tests use synthetic data; an actual authorized export and operator-use check remain pending.
