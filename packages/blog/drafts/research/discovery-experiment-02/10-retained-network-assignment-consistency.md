# Valid fields can contradict each other

October 31, 2026 UTC. Continues [CloudVertex's method-boundary review](09-cloudvertex-indexing-and-method-boundaries.md) and [TASK-0119](../../../../../docs/tasks/TASK-0119.md). The previous turn made progress; the full goal remains unfinished.

## The gap

A synthetic row combines actual current `classificationEvidence` output declaring GPTBot with actual `verifyVendorIp` output produced for Googlebot using a local fixture feed. The current report accepts one structurally recognized, listed network record beside the GPTBot declaration. The JSON is internally plausible, but `google-common` is not the configured source for that declaration. This is a controlled assignment contradiction, not an observed production record or evidence of impersonation.

Receipt/storage agreement cannot resolve it: two copies can faithfully preserve the same contradictory facts. The existing [offline delta analyzer](../../../scripts/evidence-delta.mjs) already exports and reads both fields. We can compare their assignments without another production field or data query.

## Compare the recorded configuration

The new [assignment assessor](../../../../analytics/src/vendor-declaration-assessment.ts) compares retained canonical declaration names with the sources applicable under the recorded network profile. It checks declaration/configured/unmapped counts, unique source membership and source order. Aliases remain one canonical declaration; several declarations can legitimately share a feed. Source order matters to the four-fetch budget, but this assessment does not infer outcomes from order: an unavailable address can prevent every fetch first.

Its [frozen historical projections](../../../../analytics/src/vendor-declaration-profiles.ts) cover seven classifier profiles across three retained formats, eight network profiles and eleven source-reviewed profile pairs. An independent audit and the saved generator inspect all 45 Git commits touching the five relevant source files. Each recorded profile has one distinct canonical-name/schema or ordered source-map projection. The [source-history receipt](network-assignment-history.json) preserves selected commits and hashes. The two earlier classifier profiles lack retained declaration evidence and remain unassessed. Unknown profiles, unreviewed pairs, malformed declarations and missing inputs never become empty declaration lists. Current feed contents are not fetched or replayed onto old rows.

Results distinguish assignment-consistent, contradictory and not-assessed. Contradictions have closed count/source/order reasons; not-assessed records carry the first blocking reason. Reason counts can overlap and are not another population partition. Structural network validity and receipt agreement remain separate. A record can have consistent assignments and invalid cache evidence, or recognized structure and contradictory assignments. None establishes vendor ownership, original header correctness, IP membership, a particular task, human operation or reading.

## Decoder and provenance controls

[RFC 8259 §4](https://www.rfc-editor.org/rfc/rfc8259.html#section-4) explains why duplicate object names undermine interoperable interpretation. The companion native SQL guard uses [SQLite's JSON tree](https://www.sqlite.org/json1.html) parent/key relationships to reject duplicate keys before JavaScript decoding can discard one. Invalid JSON and fields above 16 KiB remain explicit. These guard checks are not a claim of general JSON conformance.

Review caught a defect in the first integration: guards came from database strings while parsing used caller strings joined only by ID. A same-ID changed JSON fixture flipped a contradiction to consistent. That failed prototype is preserved. The repaired local query returns guards with their raw JSON and classifier fields, requires exact equality to the supplied snapshot and parses those guarded fields. Three independent mismatch controls now reject with fixed messages that do not echo input values.

Native testing also exposed an older offline-census failure: malformed network JSON aborted analysis before this new assessment ran. A private analyzer wrapper now returns structural unrecognized for that input, relying on SQLite's documented [lazy CASE evaluation](https://www.sqlite.org/lang_expr.html#the_case_expression). Public report/collector code is unchanged. The malformed record remains in the accepted output as unassessed, rather than disappearing.

## Accepted controls

All 62 final frozen assignment fixtures agree exactly between Node and local workerd/D1. Cases include historical maps, explicit no-declaration records, missing/future evidence, aliases, shared sources, reordered/duplicated sources, count conflicts, nested/escaped duplicate keys, byte limits and closed output values.

The original 48-case prototype grouped some missing or unsupported bases with conflicts. Fourteen added controls and the revised reasons keep missing, invalid and unsupported evidence separate from conflicting supported values; two mixed reviewed/unsupported identifiers were also reproduced as conflicts and repaired to unsupported. These are successive fixture versions, not population samples.

The existing analyzer is exercised on ten synthetic exported rows: raw results are 3 consistent, 4 contradictory and 3 not-assessed; the two owner exclusions and one referral exclusion leave 7 included rows, partitioned 3/1/3. All pre-existing output fields match the baseline on the same nine parseable rows. The tenth malformed row is then added and retained in the full ten-row result; the baseline could not analyze it. This is not population error-rate evidence.

The production export fields, SQL and capture plan remain byte-identical. The added guard/assessment query runs only on the local analysis relation. The analytics collection entry bundle is byte-identical to baseline under the fixed local compiler conditions, and the new module is absent from its graph. Local D1 rejects the optional `sqlite_version()` metadata lookup; its engine version remains unavailable, not guessed. Node reports SQLite 3.51.2. The failed lookup and subsequent analyzer failure are preserved alongside final outputs.

[Acceptance receipt](network-assignment-checks.json) records the final suites, native checks, source commitments and private manifest. The retrospective replaces its existing integrity paragraph, adding eight words: 1,437 words and the unchanged 33 human prompts. Its title, URL, original date and qualification about production corruption are preserved. This automatic continuation adds no human prompt. Source delivery, activation and served content remain separate.

No new production observation, SQL query, feed request, account/security change, human label, task-answer/model trial or optional diagnostic collection occurs. No real cohort is assessed for assignment incidence. The six existing measurement/input gates stay intact. Next: assess whether this check should enter public reports, using coverage and query-cost evidence before changing report semantics or historical classifications.

## Source activation

The [release receipt](network-assignment-release.json) joins exact accepted source `d9a19a9` to native build `329a8374` and Worker `b5c26b46`, Ready at 100%. The native log confirms 38 posts; hosted Node 24.22.1 differs from local 24.14.1. The build and deployments pages show 46s and 41s respectively; both are preserved as separate display observations. No site/stats request or SQL was made, and served prose and real assignment incidence remain unmeasured. This acceptance does not restore D1 CLI authorization or provide a managed bot verdict.
