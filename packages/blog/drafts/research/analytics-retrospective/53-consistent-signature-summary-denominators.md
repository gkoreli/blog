# A coverage count must agree with its verification denominator

October 27 Pacific / October 28 UTC. Continues [stored verifier provenance](52-stored-verifier-provenance-and-retained-delta.md). Human trials remain deferred.

## The remaining summary gap

The joint classification/signature table rejected some contradictions, but other panels independently summed raw JSON fields. An injected or contradictory record could therefore support a coverage count. Numeric `1` could also become a positive native boolean: SQLite's `json_extract` returns SQL integers for JSON booleans as well as JSON integers. Syntactically valid JSON does not establish the required field types or relationships.

[SQLite's JSON documentation](https://www.sqlite.org/json1.html#the_json_type_function), [pinned implementation and test-source commitments](signature-summary-sources.json), and an executed native D1 probe establish the distinction: `true` and `1` both extract as SQL `1`, while `json_type` returns different types. The inspected `jsonReturnFromBlob` and `jsonTypeFunc` implementations explain that behavior. The inspected upstream revision is not asserted to be Cloudflare's engine version; actual workerd/D1 execution supplies compatibility evidence. No dependency or upstream source execution was added.

## One assessment, explicit denominators

[The local-state projector](../../../../analytics/src/signature-basis.ts) now supplies both the joint table and summary's coherence rules. A required outcome missing from the current envelope, an explicitly contradictory historical outcome, or disagreement with the top-level status becomes unrecognized. Outcome-only history and injected verdicts remain separate. These are stored-record checks, not cryptographic replay.

[Coverage assessment](../../../../analytics/src/signature-coverage-report.ts) requires a recognized version, wire form, replay-policy marker, seven actual booleans and safe integer metadata. Absent flags cannot silently become false and manufacture host-only binding. Missing coverage and malformed coverage partition the consistent verified denominator alongside recognized detail. A valid coverage record can remain useful when the separately recorded candidate-selection assessment is unrecognized.

[Summary assessment](../../../../analytics/src/signature-summary.ts) keeps native booleans independent: available, unavailable, not recorded and unrecognized sum to the selected total. A contradictory local result does not erase recognized native evidence; integers and missing required fields cannot become native verdicts. Explicit false remains an available result.

Known vendor profiles retain their historical fields. Positive origin/coverage claims require coherent local results and consistent typed method facts; conflict counts preserve selected-proof scope. Unknown method records stay explicit. [Publisher-match projection](../../../../analytics/src/directory-publication.ts) applies the same local-result condition. The signer-name marginal still follows the top-level stored verified flag, including outcome-only or inconsistent history; its visible description now says so.

The [report decoder](../../../../analytics/src/stats.ts) and [browser](../../../src/client/stats.ts) reconcile disjoint local, coverage, selection and native families, plus vendor availability, against their declared denominators and the joint table. Individual overlapping fields are bounded rather than added together. Missing, mistyped, negative, inflated or contradictory summary values fail the report instead of becoming plausible zeros. These are the fields used by this report, not full stored-schema authentication.

## Reproduce the difference without inventing population rates

[Twenty-eight native D1 controls](signature-summary-native.json) cover valid current/historical records, contradictory outcomes/statuses, injected/copied proof detail, partial/future coverage, number-for-boolean values, unsupported vendor shapes, and malformed candidate counts. Valid conflicting declarations are exercised with verified, unsigned and injected results. Known native negative/unavailable states remain distinct. Owner, referral and time exclusions still apply; an empty selection remains zero.

| Mixed synthetic cohort: 28 included records | Before | After |
|---|---:|---:|
| Stored local results counted verified | 21 | 17 |
| Coverage records supporting claims | 23 | 12 |
| Native verified-bot true | 24 | 21 |
| Matching documented signing origin | 21 | 8 |

These are deliberately malformed supplied stored records, not observed attackers, requests with independently verified proofs, or estimates of production prevalence. Lower counts alone are not an accuracy result. The accepted rows have explicit expected states in the [shared fixture](../../../../analytics/test/fixtures/signature-summary.mjs); the [native helper](../../../scripts/check-signature-summary-report.mjs) pins the entire old analytics source graph at `8b35baa`.

On a separate **512 valid-record fixture**, every common report field stays unchanged. Reads increase **27,306 → 35,510**, about **30%**. The alternative inlining the final summary costs **50,358 reads**, so it is rejected. [All query-cost variants](signature-summary-query-cost.json) are preserved. Single local durations are recorded as fixture observations, not production performance benchmarks. The accepted query materializes assessed facts and the final summary once.

Legacy test scaffolding had omitted top-level status flags or supplied partial coverage while claiming a valid record. Its positive fixtures now represent valid stored rows; explicit malformed counterexamples remain in the new negative controls. An old `[{}]` summary stub is now correctly rejected instead of accepted as zero. Tests cover both semantic contradictions and malformed decoder outputs.

## Release boundary

Analytics **236**, site **106**, and workspace types pass. The report/cache version advances to **`2026-10-28.5`**. No migration, historical rewrite, collector/verifier/classifier change, optional-capture activation or labelled visit occurs. No new direct production SELECT has been run for this iteration.

The retrospective links this finding while remaining below 1,200 body whitespace words. Build, browser review, source publication, deployment activation and live API/cache acceptance remain separate gates. [Checks](signature-summary-checks.json) accept the isolated 32-post build and actual bundled browser UI. The 390px page stays within its viewport, invalid data hides the dashboard despite an HTTP 200 API response, and the retry recovers after restoring valid data. The first QA assertion incorrectly expected the internal exception in public copy; the generic error and captured console reason establish the actual behavior. Private pre-release captures have restrictive 0700/0600 modes and hash manifests; October 31 is a review date, not automatic erasure. Source/deployment/live acceptance remains pending. Human/device accuracy, R1 operator attribution, native cryptographic agreement and privacy/retention decisions remain open under [the goal audit](45-goal-and-method-coverage-audit.md).

Next: accept the release, then plan a bounded retained-data applicability check using these closed assessments. A synthetic counterexample proves a query weakness; it cannot count affected historical rows.


[Release acceptance](signature-summary-release.json) closes source `ea0bc20`, exact downloaded-build-log Worker `1b72510c`, and the source-linked Ready/100% deployment row. No retry was needed. The first live seven-day `/privacy` selection has twelve records without detailed evidence; it accepts missing-history behavior, not positive verification claims.

[The separate declared AhrefsBot selection](signature-summary-live-detail.json) has **nine included events**: six outcome-only historical results and three consistent detailed verified results, with three recognized coverage records. Two detailed records carry verifier `.28.6` and one `.27.6`; none is current-profile re-verification. All three leave User-Agent unsigned. No inconsistent local or coverage record appears in this narrow selection. Native booleans are unavailable for the three detailed records and unrecorded for six older ones; neither means false. Two have a recorded reviewed-publisher match, which is separate from a per-client promise to sign. These named-event counts do not authenticate the declaration, identify a person, or estimate affected rows across the whole table.

Both API selections return MISS then HIT, identical bytes/calculation time, and confirmed reuse of the same actual socket per pair. Their summary families and joint denominators reconcile. Served article Markdown, stats JavaScript and CSS match the isolated build; the updated static methodology is present. Eight GETs include four API calls and four ineligible publication/static checks, with zero collection-eligible visits or direct diagnostic SELECTs. The two public cold fills have additional unmetered read cost; the endpoint does not expose that meter.

The owned fixture server and QA tab are stopped/closed, viewport restored, and no new tail started. Optional capture was neither changed nor re-inspected for this report-only release. The private acceptance archive retains the exact captures with its hash manifest and restrictive permissions. The broader goal remains active; human trials stay deferred. Next bounded action remains the native-planned retained-data applicability check, with an explicit cost review before a diagnostic query.
