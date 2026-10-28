# A verified total needs its verifier history

October 27 Pacific / October 28 UTC. Continues [the signed-parameter repair](51-signed-parameter-types-and-freshness.md). Human trials remain deferred at the owner's request.

## What changed in our understanding

A successful verification result belongs to the implementation and policy that produced it. Research 51 found twelve synthetic malformed-nonce cases that the previous verifier accepted. That does not establish twelve affected production events, or make every older result wrong. It makes the missing public version denominator consequential.

The report previously separated request classification and signature basis, but combined all verifier versions in each row. It now groups **classification × stored signature basis × reviewed verifier profile**. Current means the stored identifier matches the verifier compiled into the report. It does not mean report generation verified the request again. Historical results remain historical; missing profiles, inconsistent records and injected verdicts have explicit labels.

This borrows the provenance principle in [OpenTelemetry instrumentation scopes](https://opentelemetry.io/docs/concepts/instrumentation-scope/): associate telemetry with its producing module and version. The [stable telemetry-schema specification](https://opentelemetry.io/docs/specs/otel/schemas/) explains why consumers need explicit version semantics. Neither document says a version identifier can recreate missing inputs. We adopted the reporting idea, not an OpenTelemetry dependency or its schema protocol. [Source ledger](verifier-profile-sources.json) ties each of fourteen reviewed literals to an inspected immutable repository source; those commits are not asserted introduction or deployment times.

## Preserve the distinction in code

[The closed projector](../../../../analytics/src/verifier-profile.ts) returns reviewed constants, never arbitrary stored profile text. [Signature-basis assessment](../../../../analytics/src/signature-basis.ts) also rejects a missing or contradictory required outcome in the current evidence envelope. Earlier recognized envelopes retain their historical rules. This is a bounded consistency check, not full schema validation or cryptographic authentication of stored JSON.

The [joint report](../../../../analytics/src/stats.ts), [contract](../../../../analytics/src/contracts.ts), and [accessible table](../../../src/client/stats.ts) retain the selected population and require the new rows to sum to its total. The public decoder rejects absent or unknown profile dimensions. Only reviewed algorithm identifiers become public; raw User-Agent, headers, nonces, keys, IDs and arbitrary diagnostic strings remain outside this projection. The privacy disclosure now describes these aggregates. No new collection field, migration, verifier policy or classifier change is involved. Report/cache semantics advance to **`2026-10-28.4`**.

[Native D1 acceptance](verifier-profile-native.json) compares baseline `aa937d5` with the new report on 512 supplied stored records. A single old row splits into two profile rows. Collapsing that dimension restores the original basis; all other common output is identical for these valid fixtures. **Reads increase from 25,753 to 27,820: 2,067 more, about 8%.** This is an interpretation improvement with a measured cost, not a query optimization or measured detection-accuracy gain.

Mixed fixtures cover current, historical, absent, unknown, contradictory and injected records, plus owner/referral exclusion and interval endpoints. Tests also reject private and missing profile values at the report boundary. An initial local helper used unsupported `24h`; it was corrected to the supported `7d` selection before acceptance or any production query. The committed [helper](../../../scripts/check-verifier-profile-report.mjs) pins the old stats and signature-basis implementations rather than accidentally comparing against the new basis twice.

## The fixed post-census interval

[Research 31](31-retained-history-completeness-and-delta.md) ended at October 27 **21:49 UTC**. This refresh selects stored `observed_at` from that instant inclusive to October 28 **04:40 UTC** exclusive. Native D1 verifies the time-index plan, exclusions, bounds and a 2,048-row/distinct-referrer scale fixture. Production uses exactly one count and one grouped SELECT through Wrangler `--command`, with no writes or retry. A 50,000-read post-execution review threshold is not an enforced database cap.

[The closed aggregate receipt](verifier-profile-delta.json) contains **87 stored events**:

| Assessment | Events |
|---|---:|
| Included | 73 |
| Owner-excluded | 7 |
| Referral-excluded | 7 |

The 73 included events are all edge observations with canonical timestamps. Their stored classes include 24 AI-search, 20 hosting-list matches, 8 Browser, 8 AI-crawler and 13 across the remaining categories. These are rule results, not independently labelled people or operators.

**Twenty included outcomes say verified; all twenty carry historical verifier profiles.** Eighteen are classified AI-search and two SEO-crawler. The other 53 have no signature headers recorded. Only two included events carry the current verifier and collection identifiers; both are unsigned. Native verification booleans are unavailable for all 73, which does not mean false. This cohort provides neither genuine signed persistence under the current collector nor managed-provider cryptographic agreement.

The count costs **87 reads**; the 43-group assessment costs **8,076**. Total acknowledged direct diagnostic work is **8,163 reads / zero writes**. Report fills, ordinary collection and other provider work are additional. Raw responses and prepared SQL remain in the private archive, with hashes in the receipts.

This is an event-time interval, not insertion history or a fresh entire-table census. Older rows and inclusion decisions could have changed, and lexical bounds do not census malformed dates outside them. Adding 87 to the old census would manufacture an exact current total we did not measure. Nothing here identifies the R1 operator, proves human triggers, counts unique actions or shows that the twenty historical results are erroneous.

## Acceptance and next action

[Checks](verifier-profile-checks.json) accept 234 analytics tests, 106 site tests, workspace types, post/policy validation and the isolated 32-post build. The synthetic API fixture renders current, historical, missing, inconsistent and injected profiles in the actual browser. At 390px, the page stays 390px wide and its keyboard-focusable table scrolls within a 354px region; at normal width the table fits. This is viewport QA, not real-device or human calibration. The main retrospective remains 1,200 body whitespace words with its thirty-one shaping prompts unchanged.

Private captures live outside Git in `2026-10-28-verifier-profile-local`, with 23 files, 0700/0600 modes and a hash manifest. October 31 is a review date, not automatic erasure. Source publication, deployment activation and live API/cache acceptance remain separate gates; their final receipts will be linked here.

Next: accept the report release without generating labelled visits, then choose a bounded missing-evidence investigation from [the goal audit](45-goal-and-method-coverage-audit.md). Human/device calibration, managed-native agreement, historical stage attribution, R1 operator attribution and privacy/retention decisions remain open. This iteration improves what readers can infer from a number; it does not finish the broader analytics goal.


[Release acceptance](verifier-profile-release.json) closes source `281dcdd`, exact-build log/version `1d5ffb99`, and the native Ready/100% deployment row. No retry was needed. The first copy attempt returned an older clipboard log; it was rejected and preserved separately. Direct download from the exact source build supplies the accepted version join.

One scoped seven-day `/privacy` report has twelve included events and five joint rows. Both its classification and profile/signature projections sum to twelve. Two requests on the same connection return MISS then HIT with identical bytes and calculation time. This is a separate selection from the 87-event delta. The first cold public fill has no row-read meter exposed by this endpoint; it is additional to the acknowledged 8,163 diagnostic reads, not zero-cost work.

The served article Markdown, stats JavaScript and main CSS match the isolated build byte for byte; the static stats methodology is present. Six GETs are all collection-ineligible. No production browser rendering or eligible visit is inferred from these asset/API checks. Local synthetic browser review supplies the UI evidence. The owned fixture server is stopped, its QA tab closed and viewport reset; no new tail was started. The report-only release does not recheck optional bindings or change their activation. Fifty acceptance files remain in the second private archive with a separate hash manifest and the same October 31 review boundary.

Next bounded action: audit the other signature-summary panels for status/outcome/coverage contradictions using the joint table's explicit denominator. The synthetic fixture demonstrates why a stored status marginal and a detailed consistency assessment can differ; they should not be silently treated as interchangeable. Human trials remain deferred. The broader goal remains active.
