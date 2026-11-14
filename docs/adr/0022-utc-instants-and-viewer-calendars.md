# ADR-0022: UTC instants and viewer calendars

Accepted November 14, 2026. Extends the reporting calendar in [Article reach](0016.18-article-reach-and-source-concentration.md) and [report caching](0016.7-budget-d1-reads-and-cache-public-reports.md), preserving collection, identity, exclusion and admission policies.

## Decision

Store and transport instants in UTC. Select and display analytics periods using the viewer's named IANA timezone. A daily chart groups observations between actual local day boundaries; converting labels on UTC aggregates is insufficient. Hourly buckets follow local hours and distinguish repeated hours by their UTC instants. Daily and hourly labels, date ranges, table values and calculation times use the same presentation policy.

Use [the shared time kernel](../../packages/time/README.md) as a small supporting module. Its browser entry point owns explicit instant parsing, UTC serialization, civil-date operations, timezone validation and locale formatting. Its server calendar owns day boundaries and UTC offset intervals through the pinned official Temporal polyfill. The browser does not import that calendar dependency.

Analytics owns range and partial-period semantics. Article reach owns four completed seven-day periods, catalogue membership and source concentration. Both use the shared calendar. Their repository adapters translate UTC intervals to storage queries; SQL, cache, database bindings and publication labels do not enter the time kernel. The report application and existing admission/cost ports remain the composition boundary.

Existing SQLite observation stamps are fixed-width UTC seconds. New observation writes normalize through the shared storage function; APIs emit canonical UTC ISO instants with milliseconds and `Z`. Existing rows, indexes, schemas, projection fingerprints and daily HMAC inputs are preserved. The viewer's timezone is reporting context rather than another retained visitor attribute. A database rewrite is unnecessary.

## Reporting contract

`timeZone` optionally selects a supported named zone on Stats and Article reach APIs; omission retains UTC for API callers. Browsers supply their own zone. Validation and alias canonicalization happen before cache or database work. Article reach continues to ignore arbitrary source, path, period and bypass selectors.

Stats `period.start`/`end` are civil dates in `period.timeZone`; `startInclusive`/`endExclusive` are exact UTC instants. Every `timeSeries.bucket` is now a canonical UTC bucket-start instant, for both grains. This pre-1.0 contract refinement accompanies analytics 0.3.0 and report cache-version changes. Consumers must format the instant in `period.timeZone` rather than append UTC midnight to a date string.

The query adapter computes zoned grouping from the calendar's offset segments while retaining indexed UTC range predicates. Source and projected reports share this expression. It adds no per-bucket SQL requests. Calendar-derived stamps and integer offsets are the only compiled literals; caller zone text never enters SQL. Verify native D1 parity, complete reconciliation and query bounds, including the all-time case. D1's [statement and parameter limits](https://developers.cloudflare.com/d1/platform/limits/) still apply.

Cache keys include the canonical zone, selection, policy and report version. Expiry is capped at one hour and at both selected-calendar and UTC midnight. The original calculation instant survives reuse. Equivalent timezone aliases share a key; different calendars never share a report. Existing UTC admission-day accounting is independent of presentation. More calendar selections can create more cold fills; local cache/coalescing still does not impose a global cost limit.

## Identity and evidence boundary

Daily client identifiers retain their UTC rotation and existing privacy boundary. A local day can span two rotations, and one identifier can occur in adjacent local dates. The UI calls these client identifiers rather than distinct people, sessions or local-day unique visitors. Their counts across hourly or daily buckets are not additive; the headline retains its distinct-ID calculation over the selected window. No stable identity or cross-day link is introduced.

Authored publication dates and recorded version identifiers remain calendar metadata and provenance tokens. Do not shift a publication date as though it were a midnight event, or localize a verifier version's date prefix. Historical evidence and acceptance receipts retain their original conditions.

## Site-wide application

Access-report observations, saved-report comparisons, quota reset feedback and article research-footprint instants use the same presentation policy as Stats. Server-rendered HTML retains complete UTC fallback text in marked native time elements; the browser enhances those instants using the shared core. Dynamic renderers use the same adapter. The UTC instant remains in `datetime`, and raw JSON/evidence is preserved. Keep structured instants in feedback models rather than passing a timezone into domain feedback functions.

Publication-date formatting and RSS generation also use the shared core. Authored calendar dates are invariant across build and viewer timezones; RSS's required wire date uses a deterministic UTC representation. The editorial schedule retains its Monday 08:00 Pacific rule, resolved by the shared calendar rather than another Intl parts parser. Viewer preferences do not alter release policy, UTC privacy rotation, quota admission days or report-budget accounting.

Client-error ingestion, diagnostics, calibration, capture receipts, feed-assessment timestamps, newsletter receipts and report metadata share UTC normalization/serialization. Do not rewrite existing records or replace database-owned UTC defaults with an application clock. Preserve integer epoch expiry formats and existing indexes. Stats exposes legacy referrer-capture stamps as canonical UTC ISO instants and changes its cache version accordingly.

Native HTTP Date/Expires parsing, signature epoch clocks, elapsed durations and received publisher-version tokens retain their distinct protocol semantics. The pre-module bootstrap failure reporter intentionally uses native UTC ISO serialization so it can report a missing main bundle; shared ingestion validates the result. Historical articles, frozen receipts, source reporting calendars and raw protocol evidence are not relabeled or rewritten.

## Acceptance

The existing [Stats worklist](../../packages/blog/drafts/research/ai-site-audit/02-tools-product-exploration.md) owns implementation, native D1/SQLite parity, storage/identity preservation, cache isolation, portable-package checks, responsive visual QA, delivery and fresh hosted acceptance. Check code, deployment activation and live behavior separately.
