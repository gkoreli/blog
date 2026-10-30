# The new projection recognizes the two excluded controls

October 30, 2026 UTC. Follows [Research 106's remaining positive-branch check](106-public-cache-explanations-production-acceptance.md#next-bounded-action), using only [Research 104's two known controlled rows](104-vendor-cache-production-acceptance.md). No new visit or observation is created.

## Result and what it closes

The [acceptance receipt](controlled-cache-projection-release.json) records one constant capability SELECT and one indexed data SELECT through the existing signed-in Cloudflare D1 console. The frozen data query uses the current [network validator](../../../../analytics/src/vendor-network-summary.ts), [cache projection](../../../../analytics/src/vendor-cache-report.ts) and [metadata projection](../../../../analytics/src/fetch-metadata-report.ts). Current decoders independently accept the rendered result; exact selected references and expected native summaries reconcile privately.

| Two controlled events | Production result |
|---|---:|
| Selected / referral-excluded | 2 / 2 |
| Cache records recognized | 2 |
| Fetched / cooldown paths | 1 / 1 |
| Accepted blocked policy contexts | 2 |
| No-cache / zero-lifetime blockers | 2 / 2 |
| Current-format metadata recognized | 2 |
| Absent mode, destination, site, activation fields | 2 each |

The two blockers overlap on both events; they do not represent four requests. The cooldown carries the prior policy context without a membership snapshot. Its metadata record is **recognized with absent headers**, rather than an unknown historical record. That closes a controlled nonzero production SQL check for both report changes. It does not turn missing coverage in Research 106's separate 47-event public cohort into zeros.

This is direct SQL against production data, **not execution of the deployed public API's positive branch**. The diagnostic deliberately selects the two excluded controls; public filtering and counts are unchanged. It supplies no organic-cache coverage, genuine Google identity, human label, population error rate or readership growth. Owner-profile marks are not queried; the saved referral policy establishes exclusion.

## Bounds, native controls and cost

The single-line statement is 24,115 bytes, below the [documented 100,000-byte D1 limit](https://developers.cloudflare.com/d1/platform/limits/). Its only base-table selection is two exact primary keys. Local native EXPLAIN shows primary-key search, with no base-table scan. [SQLite documents EXPLAIN as a description of query strategy](https://www.sqlite.org/eqp.html); it is not a production billing meter or a stable application interface.

The native fixture preserves JSON-validity constraints from the real schema. Unsupported collection profiles, an unsupported vendor record and a missing selected row remain detectable. The actual CLI validator passes its positive rendered-table transport and rejects four altered transports. Local query meters report **139 reads / zero writes**. Production console timings are 0.21 ms capability and 4.88 ms data; row meters and provider attempts are unavailable, so the 1,000-read review threshold remains unassessed. [D1Result documentation](https://developers.cloudflare.com/d1/worker-api/return-object/) distinguishes results, execution metadata and attempts; a rendered row or latency cannot substitute for missing counters. No repeated query attempts seek a meter, and CLI D1 authorization is not retried.

Two initial harness failures remain preserved: an assertion uses the wrong metadata field, then a fixture without the production JSON constraint admits malformed JSON and fails execution. The corrected fixture restores that constraint. This does not demonstrate a runtime defect or a malformed row admitted by the real schema. The immutable pre-execution plan contains the exact successful native program, generated SQL and validator; their bytes reconcile afterward.

The private 42-file archive has manifest SHA-256 `4a8c0948abd657daa4a8d3299a3146c43ded0a552156304a65feff83427ce078`; October 31 is review, not deletion. The temporary console tab is closed. Runtime, schema, collection settings, article and prompts remain unchanged; no build or site probe is needed for this research record.

## Next: audit the remaining decisions

The goal stays active and human trials remain deferred. Before another implementation or production query, reconcile the owner's questions with existing evidence: readership growth, article usefulness, discovery intent, identity/purpose, diagnostic coverage and error calibration. [Research 108](108-decision-evidence-and-measurement-history-audit.md) subsequently performs that audit and measures a weekly profile-history visibility gap. The new controlled projection check is accepted; do not silently reopen it or repeat public cache fills. Search Console origin approval, native-provider access and privacy/retention boundaries remain as recorded.
