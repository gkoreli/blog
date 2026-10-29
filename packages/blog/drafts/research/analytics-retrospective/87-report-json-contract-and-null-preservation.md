# A green local test can exceed the documented database contract

October 29, 2026 UTC. Continues the contract lead from [Research 85](85-post-census-delta-and-diagnostic-contracts.md) after [Research 86](86-linked-failures-and-directory-fetch-traces.md) completed exact failure recovery. The previous goal turn made progress. Human-operated trials remain deferred.

## The mismatch is real; a production outage is unproven

Our verification report builds a JSON object with **44 fields and 88 arguments**. [D1 documents a maximum of 32 arguments per SQL function](https://developers.cloudflare.com/d1/platform/limits/). The old report nevertheless passes our native local tests. Historical production reports have also been accepted; neither source review nor today's experiment establishes a current production failure.

The installed workerd `1.20260301.1` tag resolves to source commit `cce9f17db76f4c853585d3e0df096af3b8094ee4`. Its [SQLite setup](https://github.com/cloudflare/workerd/blob/cce9f17db76f4c853585d3e0df096af3b8094ee4/src/workerd/util/sqlite.c%2B%2B#L1232) explicitly sets the function-argument limit to **127**, explaining the choice in terms of large argument lists such as JSON objects. Fresh local D1 controls accept 32, 88 and 127 `coalesce` arguments and reject 128. This supports the local mechanism; the public source and local boundary do not establish which binary/configuration serves production D1.

[SQLite's limits guide](https://www.sqlite.org/limits.html) describes per-connection runtime limits. Its default was raised to 1,000 in version 3.48.0; the Python-linked build here reports 3.53.4 and an initial limit of 1,000. A passing test under either larger limit is insufficient evidence of compliance with 32.

## Keep nulls while bounding the calls

The new internal [builder](../../../../analytics/src/sql-json.ts) creates at most sixteen initial field/value pairs, then adds at most fifteen pairs per `json_set`. The report's 44 fields therefore use calls with **32, 31 and 27 arguments**. It accepts trusted SQL expressions and restricts keys to flat identifiers. Request values continue through the existing bindings; no dependency, schema or collection change is introduced.

[SQLite's JSON guide](https://www.sqlite.org/json1.html#jins) explains the distinction between SQL text and JSON values. The tests retain strings, booleans, arrays, objects, explicit SQL nulls and key order across chunk boundaries. `json_patch` would be a poor replacement: Merge Patch uses nulls to remove members. An empty report's 44 `SUM` fields are explicitly null in its raw JSON, and those keys must survive before the existing decoder converts empty aggregate results to public zero counts. The change preserves that behavior rather than weakening missing-field validation.

The [report change](../../../../analytics/src/stats.ts) moves the existing expressions into the builder. No classification, signature coverage rule, unknown/conflict treatment, exclusion, report selection or public response field changes. Report/cache version `.29.4` remains appropriate because its semantics, selection and storage binding are unchanged; collection stays `.29.5`.

## Test the contract itself

The [native comparison](../../../scripts/check-report-json-contract.mjs) pins every baseline analytics module to `b408fcf` and runs the real before/after report SQL. Seventeen comparisons cover empty seven-day/all-time reports, six traffic groups, four ranges, two fixture paths and a missing path. The 512 supplied observations mix 28 stored-signature conditions, owner/referral exclusions and dates inside/outside the window. These are synthetic stored facts, not independently signed requests or human labels.

Every **raw JSON section and decoded report matches**, including all 44 explicit nulls on empty selections. Every paired native read count matches; writes are zero for report calculations. The all-time `/privacy` selection costs 32,624 reads before and after; the seven-day selection costs 30,854. Those fixture costs do not establish production equivalence or latency improvement. The largest candidate template is 62,149 bytes, below the documented 100,000-byte statement limit.

The [separate SQLite test](../../../scripts/check-report-json-limit.py) uses Python's documented [connection limit API](https://docs.python.org/3/library/sqlite3.html#sqlite3.Connection.setlimit). It sets the limit to 32 and disables statement caching so a previously prepared query cannot bypass the test. All seventeen old statements reject at `json_object`; all seventeen candidates execute and match native output. Restoring the original limit makes the old statements execute and match too. This is an explicit contract model, not evidence of a live D1 outage or enforcement change.

Two permanent analytics tests cover null/type preservation across 0/16/17/31/32/44/46/47/91 fields and reject keys that could change path or SQL grammar. The full **294 analytics tests**, **117 site tests**, type checks and isolated 33-post build pass. The shared `dist` is untouched. [Native results](report-json-native.json), [strict-limit results](report-json-sqlite-limit.json), [sources](report-json-sources.json) and [checks](report-json-checks.json) preserve the different runtimes and scopes.

An optional inline helper intended to add an exact-path query plan remains live without output and is explicitly stopped after inspecting its owned processes. Its cause is unestablished, and no result or indexed-plan claim is accepted from it. The separate seventeen native report comparisons remain the measured evidence; the stopped helper is not restarted. A sandbox denial while Wrangler tries to write its version-command log is also preserved as distinct from query authorization.

The article remains 1,375 words/31 prompts. No new readership claim follows from this change. At this checkpoint, production source activation and a bounded empty-path API calculation remain separate acceptance work; no own-site request, production diagnostic SELECT or human label has been introduced.

Next: accept the exact checked source/build, then one guarded empty-path API MISS and its calculation receipt. Keep the full goal open: human/device errors and abstentions, native managed agreement, original signing-context discrepancies, historical proof recovery, R1 attribution and privacy decisions remain unresolved. Human trials stay deferred.
