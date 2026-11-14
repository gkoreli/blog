# @gkoreli/time

The shared time kernel distinguishes UTC instants, civil dates and named-zone calendars. Domain modules choose a reporting period; database adapters store and compare UTC; UI adapters format the selected calendar. No visitor timezone is added to observation storage.

`@gkoreli/time` is browser safe. It exports `utcInstant`, `databaseTimestamp`, UTC/civil-date guards, HTTP-date representation, named-zone validation, civil-date operations and `timePresentation`. Instants require an explicit offset, except the existing fixed-width SQLite UTC grammar. APIs use UTC ISO strings with milliseconds and `Z`; SQLite observations keep `YYYY-MM-DD HH:mm:ss` in UTC so existing indexes and historical records remain valid. Civil dates are separate `YYYY-MM-DD` values, never implicitly parsed as viewer-local instants.

`@gkoreli/time/calendar` exports `ZonedCalendar`. It owns actual day starts, offset transitions and contiguous hourly/daily UTC intervals. Analytics and Article reach use those intervals for their own report semantics. The pinned official [Temporal polyfill](https://github.com/js-temporal/temporal-polyfill) handles calendar boundaries; it is isolated from the browser entry point. [Temporal's timezone model](https://tc39.es/proposal-temporal/docs/zoneddatetime.html) accounts for repeated or missing hours, variable day lengths and skipped dates.

```ts
import { ZonedCalendar } from '@gkoreli/time/calendar';

const calendar = new ZonedCalendar('America/Los_Angeles');
const start = calendar.startOfDay('2026-11-01'); // 2026-11-01T07:00:00.000Z
const end = calendar.startOfDay('2026-11-02');   // 2026-11-02T08:00:00.000Z
const hours = calendar.buckets(start, end, 'hour'); // 25 distinct UTC intervals
```

Build before consuming the package with `pnpm -C packages/time build`. Workspace type checks and the blog/analytics lifecycle commands do this automatically. `pnpm -C packages/time test` covers storage parsing, aliases, locale formatting, local dates, US daylight saving, fractional offsets, Lord Howe's half-hour transitions and Apia's skipped date. [ADR-0022](../../docs/adr/0022-utc-instants-and-viewer-calendars.md) records the domain boundaries and reporting contract.


The site uses the same boundary for access checks, quota reset feedback, saved-report comparisons, research-footprint instants, client-error ingestion, diagnostic retention, feed-assessment timestamps and newsletter receipts. `timePresentation().calendarDate(value, 'long')` formats an authored date without shifting it. RSS uses a fixed UTC wire representation rather than the build host's midnight. `ZonedCalendar.atTime()` resolves scheduled publication wall times and rejects repeated or nonexistent clock times.

The blog's [SSR adapter](../blog/src/lib/local-time.ts) produces readable UTC fallback text and canonical `<time datetime>` instants marked `data-local-time`. Its [browser adapter](../blog/src/client/local-time.ts) enhances marked times with the viewer's timezone and locale. Dynamic renderers use the same adapter; authored dates, raw JSON and received protocol evidence are not marked. Native Nisli templates use native time elements, while string renderers use the validated, core-produced markup helper.

Database-owned `CURRENT_TIMESTAMP`/`datetime('now')` values remain UTC; epoch expiry values remain UTC instants. HTTP signature clocks, received Date/Expires headers, durations, provider-specific reporting calendars and version identifiers keep their protocol/domain meanings. The small pre-module failure reporter uses native UTC ISO serialization so it can report a missing client bundle; ingestion still validates its timestamp through this core. Historical articles, frozen evidence and test captures retain their recorded conditions.
