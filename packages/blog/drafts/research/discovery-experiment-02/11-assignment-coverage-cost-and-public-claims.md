# Structural validation needs a narrower public claim

October 31, 2026 UTC. Continues the [retained assignment check](10-retained-network-assignment-consistency.md), [TASK-0119](../../../../../docs/tasks/TASK-0119.md) and [read-budget decision](../../../../../docs/adr/0016.7-budget-d1-reads-and-cache-public-reports.md). Previous turn: progress through `d9a19a9`/`60725b8`. Full goal remains active and incomplete.

## The decision

Should the new declaration-to-network assignment check run in public reports? First apply it to an existing real capture, measure the local input-query work, and correct claims that exceed the current public query. The frozen plan permits neither a fresh production query nor changes to classifications, retained evidence or account protections.

The public network panel called its records “consistent” and its feeds “applicable.” Its [SQL](../../../../analytics/src/vendor-network-summary.ts) validates the network record's structure and profile bounds without comparing retained declaration names with configured sources. The previous synthetic GPTBot/Google-network counterexample passes that structural gate. The old labels therefore promised a relationship the report did not check, independently of whether any real event contains that contradiction.

## Real coverage, with the denominator intact

All 70 files in Research 102's original manifest verify before reuse. The selected 397 events span **October 29 20:39:23–October 30 09:38:03 UTC**. Original exported owner flags and linked-owner facts are preserved; all current inclusion results agree with the saved assessments. This is a dated partial-day selection, not today's traffic or the entire history.

Node and local D1/workerd agree on every assignment assessment: **397 consistent, zero contradictory, zero unassessed**. All share classifier `.29.3` and network `.29.2`. A second reconstruction uses Python duplicate-key rejection and the exact historical Git name/source catalogues, without invoking the new assessor; it finds no count, source-set or source-order mismatch. The validated export also equals the original saved transport rows.

| Record-level coverage | Events |
| --- | ---: |
| No canonical declaration | 327 |
| Named declaration without a configured network method | 45 |
| Named declaration with a configured network method | 25 |
| Total | 397 |

All 70 named records have one declaration. The 25 configured records retain 25 checks. Thus, 397 consistent assignments include 327 empty assignments and 45 correctly unmapped assignments. That result does not mean 397 authenticated clients, 25 successful network matches, original-header correctness, human operation, reading or a known task. Stored vendor outcomes are not replayed, and current feed contents are never fetched.

## Measure the extra input query

The comparison selects the same bounded rows and raw fields twice: once alone, then with the shipped bounded JSON/duplicate-key guards. Guarded output must preserve every raw input exactly; all writes are zero. The synthetic expanded relation adds uninterpreted JSON nodes while preserving all 1,024 assignment results.

| Local relation | Events | Bare input reads | Guarded input reads |
| --- | ---: | ---: | ---: |
| Retained capture | 397 | 397 | 27,405 |
| Synthetic, small JSON | 1,024 | 1,024 | 70,656 |
| Synthetic, expanded JSON | 1,024 | 1,024 | 603,136 |

These are local incremental input-query meters, **not full public-report costs, a production bill, CPU measurements or distinct clients**. Both synthetic relations fit the existing two-million-source-byte export bound. The guarded result's serialized sizes are 405,746 / 934,830 / 1,532,846 bytes respectively; they contain private input and are not suitable public payloads. An all-time raw-row report would also need its own bound and response-size design.

[Cloudflare's D1 metrics](https://developers.cloudflare.com/d1/observability/metrics-analytics/) distinguish query count from scanned rows; its [pricing explanation](https://developers.cloudflare.com/d1/platform/pricing/) describes per-query read/write metadata. The inspected installed Miniflare `4.20260301.1` adapter consumes the cursor and returns `cursor.rowsRead` in `meta.rows_read`; its digest is retained. The [official source](https://github.com/cloudflare/workers-sdk/blob/main/packages/miniflare/src/workers/d1/database.worker.ts) is a separate current reference, not proof that local and hosted engines match. [Cursor documentation](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/) explains why consumption matters. [SQLite's materialization guidance](https://www.sqlite.org/lang_with.html) also prevents treating a CTE hint as a guaranteed cost reduction. No new engine-version query was attempted after the prior native rejection.

**Decision:** retain this implementation offline. The checked historical selection reveals no contradiction, while putting its raw-row pass into public reports needs a bounded design and cost validation. This does not reject a future aggregate or collection-time design. It preserves the closed directory-response advisory decision, which concerns a different capability.

## Repair the public explanation now

Eight client labels now describe structural recognition, recorded declaration counts and stored outcomes in checked feeds. The static panel note explicitly states that the public report does not cross-check names against feed assignments. Existing attribution, nonmatch, unavailable-address/feed, overlapping-outcome and historical limits remain visible.

Analytics aggregation, report versions, API fields, counters, collector and classifications are byte-identical to baseline. Presentation changes require no report-cache version bump. The retrospective and its 33 human prompts remain byte-identical; this finding belongs in the linked research rather than another article paragraph.

[Acceptance receipt](assignment-report-scope-checks.json) preserves source hashes, native meters, historical coverage and the private manifest. Workspace types, 169 site tests, 27 Markdown validations and the isolated 38-post build pass. The first build failed at its sandbox-denied tsx IPC socket; the accepted build is separate. Built HTML contains the scope note and the client bundle contains the corrected labels. No new low-impact copy tests were added.

No production site/stats request, SQL, feed fetch, sign-in retry, managed bot verdict, human label or model trial occurs. Source delivery/activation and served behavior remain separate. All six existing input gates remain unresolved. A future public assignment feature must supply its bounded representation, historical coverage, privacy boundary and native parity/cost evidence before adoption; the current implementation remains a private diagnostic.

## Source activation

The [native release receipt](assignment-report-scope-release.json) joins exact accepted source `a908cfb` to build `261859ab` and Worker `e722677f`, Ready at 100%. Both changed presentation files match accepted hashes. The existing job spends 55s initializing and finishes without retry; native build/deployments displays show 88s/35s respectively, preserved as different timing scopes. Hosted Node 24.22.1 differs from local 24.14.1. The log confirms 38 posts. No production site/stats request or SQL was made; source activation does not establish served presentation, current traffic, restored D1 authorization or a managed bot verdict.
