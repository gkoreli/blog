# Build the evidence adapter while account access waits

October 31, 2026 UTC. The owner asked for alternative ways to keep building. Missing account access and human trials constrain particular measurements; they do not prevent useful tools, agent-audience work or analysis of independently available evidence.

This iteration delivers a private offline Search Console evidence analyzer. It reads a saved API request/response with a local article catalogue and produces a machine-readable report plus a concise article/query brief. It performs **no account access, production query or new tracking**. A [runnable synthetic example](../../../scripts/examples/search-evidence.demo.json) and [usage guide](../../../scripts/search-evidence.md) make the capability usable before real search evidence arrives.

## The decision it supports

Given supplied query/page rows, identify which existing article and search result deserve inspection: queries with reported clicks, and queries with impressions but no clicks. These are candidates for checking query fit and presentation. The tool does not invent search intent from article titles, diagnose a bad title, promise improved rankings or determine whether someone read an article.

The [module](../../../../analytics/src/search-evidence.ts) accepts one saved Search Analytics API query/page slice. It requires the property, capture time, ordered dimensions, date bounds, filters, pagination, data-state context and actual page aggregation. It preserves native defaults explicitly. A supplied API-shaped file remains unauthenticated; the example remains synthetic. CSV, Sheets, XLSX and bulk exports are separate formats, rather than assumed aliases of the API response.

[Google's API contract](https://developers.google.com/webmaster-tools/v1/searchanalytics/query) defines ordered keys and inclusive Pacific-time dates. Its [retrieval guide](https://developers.google.com/webmaster-tools/v1/how-tos/all-your-data) explains detail loss and retrieval limits. We retain those boundaries: no missing row becomes zero demand, no short result establishes completeness, and no automatic D1/UTC reconciliation occurs. Declared filters remain visible without substituting JavaScript regex for native matching. Potentially preliminary data stays flagged even when metadata is absent.

## Every selected click has a visible place

The synthetic example contains fifteen clicks across eight saved rows. Exact article URLs account for seven; variants, an unknown page and another origin account for the other eight. The JSON and human brief both reconcile those partitions. An earlier brief showed only the count of unmatched rows, which left its larger headline unexplained. Review caught that reader-comprehension gap before delivery.

Only exact catalogue URLs enter article rankings. Normalized dot segments, hostname/port spelling changes, query variants and fragments cannot silently turn into exact matches. Unknown and other-origin rows remain present. An article with no returned rows has unavailable demand. Query tables show at most twenty nonempty-query rows per category, while article totals retain all their selected rows.

CTR is recalculated from selected clicks/impressions. The example article's 5/300 is 1.67%, not the 2.5% produced by averaging its row CTRs. Average positions stay on their source rows; the tool does not reconstruct property position from page/query data.

## A private, bounded command

From the repository root, using pinned Node 24.14.1:

```sh
node packages/blog/scripts/search-evidence.mjs --demo /tmp/new-search-evidence-demo
```

The command writes `brief.md`, `report.json` and demo input into a new `0700` directory, with `0600` files. Existing destinations and destination symlinks are refused. For supplied evidence, logs contain status and row counts, not queries or credentials. The report hashes the exact input bytes. No collector, API route, database or automatic upload is added.

Review also found that checking a file's saved size before an unrestricted read would not bound a growing file. The final command opens nonblocking, validates the descriptor as a regular file, and reads at most eight MiB plus one overflow byte. FIFOs/devices are refused. Fatal UTF-8 decoding and explicit BOM rejection prevent silent evidence repair. [Node's native type-stripping documentation](https://nodejs.org/docs/latest-v24.x/api/typescript.html) explains the direct TypeScript execution used here; type checking remains a separate check.

## Acceptance and scope

- Five focused test groups cover selected-count reconciliation, dimension order, missing data, native-filter preservation, dates across DST, exact URL mapping, malformed context, overflow, escaping and snapshots.
- Sixteen frozen synthetic contexts run in Node and local workerd in three rounds: **48 exact result-and-brief comparisons**, with eight accepted and eight rejected contexts per round. These are not Google API executions or native export acceptance.
- Actual CLI controls verify private modes, exact byte hashes, no overwrite, destination symlink refusal, absent query/credential canaries in logs, invalid UTF-8/BOM rejection, FIFO rejection without blocking, and oversized-file refusal.
- Isolated baseline acceptance passes **336 analytics tests** and workspace types. Integration with the concurrently committed audience-default changes passes **337 tests** and workspace types. No shared `dist` or test output is used for final acceptance.

The initial shared-tree bundle comparison differed while another session changed stats defaults. We did not attribute that difference to this module. Own changes preserve the collector entry in both controlled baselines: 223,052 bytes on `25b74f9`, and 223,019 bytes on integration baseline `10c90fb`. The latter has identical before/after SHA-256 `7418d0b0c7f5af1b668c039956be7f2b70469cc4ea5745d3b99336ab83335777`. This is local bundle evidence, not a current production-byte assertion. Concurrent audience/discovery publication is owned by [its separate record](../discovery-experiment-02/00-worklist.md).

[Receipt](offline-search-evidence-checks.json) records source hashes, comparisons, controls and the verified private archive. Raw controls and intermediate logs remain outside Git. The retrospective article, collector, existing report contract/cache and collection policies are unchanged by this work. No real Search Console rows, human labels or managed-provider verdicts were obtained. Source delivery does not establish independent operator adoption or a successful real-data import.

## Continue through independent evidence channels

The offline analyzer is one route; it does not make Google data the sole definition of growth. Agent access, captured citations, external references and agent-mediated use count at the stages actually observed. Human identification is needed for a human-accuracy claim, not as a prerequisite for recognizing those outcomes. The concurrent audience direction is recorded in [ADR-0016.19](../../../../../docs/adr/0016.19-agent-mediated-audience-growth.md).

Next, reuse the saved agent-discovery/distribution observations for a decision brief with separate access, citation and use outcomes. A supplied authorized API response can independently close this analyzer's real-data acceptance. Neither path requires reopening human trials or the directory-advisory no-adoption decision. Privacy and native-provider claims keep their own gates; the broader work continues through available evidence and useful capabilities.
