# ADR-0005: Public Analytics Dashboard — `/stats` Page

## Status

Accepted — 2026-03-07. Deployed to production. Updated 2026-03-07: timezone-aware dates, visitor type filter.

## Context

Phase 1 of ADR-0004 is deployed. The blog collects page views in D1 and serves aggregate data via `GET /api/stats`. This ADR covers the public `/stats` page — transparent analytics, visible to anyone, embodying the blog's editorial ethos.

### Constraints

- Static HTML generated at build time by `@nisli/core` pipeline (TypeScript → `html` tagged template literals)
- CSS custom properties for theming: `--color-bg`, `--color-surface`, `--color-text`, `--color-link`, `--color-border`, `--color-text-muted`
- Dark/light mode via `data-theme` attribute on `<html>`, toggled by `<nisli-theme-toggle>` web component
- Layout: sidebar + main content, `--content-max: 800px`, mobile breakpoint at 768px
- Client JS: esbuild-bundled ES modules. Before this change: `main.js` = 1.2KB (theme toggle only)
- Per-page bundle isolation is non-negotiable: chart library must load ONLY on `/stats`

### API Shape

`GET /api/stats?days=30` returns pre-aggregated data from D1:
```json
{
  "period": { "start": "2026-02-05", "end": "2026-03-07" },
  "totals": { "views": 4, "visitors": 1, "ai_fetches": 0 },
  "by_path": [{ "path": "/the-agentic-product-engineer/", "views": 2, "visitors": 1 }],
  "by_country": [{ "country": "US", "views": 4 }],
  "by_day": [{ "date": "2026-03-07", "views": 4, "visitors": 1 }],
  "by_referrer": [{ "referrer": "github.com/gkoreli", "views": 1 }]
}
```

All aggregation happens server-side in D1 SQL. The client receives final numbers and renders — no sorting, filtering, or grouping in the browser.

## Decision

**uPlot** (9.9K⭐, MIT, v1.6.32) for the daily trend chart. Everything else is plain HTML/CSS.

### Why a Chart Library at All

Only the daily trend chart benefits from a library. The cursor crosshair, snap-to-nearest-point, live legend, and drag-to-zoom are real UX features that would take 200+ lines of hand-rolled SVG to approximate worse. Totals, ranked lists, and country tables are just numbers and percentage-width bars — no library needed.

Zero-dependency where it makes sense — not as dogma. We chose `crypto.subtle` over `@noble/hashes` because the platform provides a better native. We chose raw D1 over Drizzle because we have 2 queries. For interactive time series, the platform provides nothing.

### Why uPlot Over Chart.js

| | uPlot | Chart.js |
|---|---|---|
| Gzip | 24.6KB | ~65KB |
| Philosophy | "No animations — they're always pure distractions" | Full-featured, animation-first |
| Config surface | Minimal — we use ~20 options | Massive — we'd disable most features |
| Dark mode | Same pattern (Canvas, destroy+recreate) | Same pattern |

Plausible uses Chart.js. Counterscale uses Recharts (React). Both are multi-site SaaS dashboards with React frontends. We're building one transparent page on a personal blog with zero framework dependencies.

### Architectural Guarantee

uPlot loads ONLY on `/stats`. Separate esbuild entry point, separate `<script>` tag, separate CSS file. Blog posts never load it. Navigate away → browser GCs the entire module.

## Implementation

### What Was Built

366 lines added across 9 files (3 new, 4 modified, 2 incidental):

| File | Lines | Purpose |
|------|-------|---------|
| `src/client/stats.ts` | 196 | Fetch API, uPlot chart, ranked lists, period/theme/resize handling |
| `src/templates/stats.ts` | 53 | HTML shell with skeleton placeholders, period pill buttons |
| `src/styles/stats.css` | 92 | Totals grid, ranked list bars, skeleton shimmer, pills, print/mobile |
| `src/templates/page.ts` | +3 | Optional `head` param, Stats nav link after About |
| `src/pipeline/build.ts` | +6 | Generate `/stats` page, add `STATS_ENTRY` to esbuild |
| `src/lib/paths.ts` | +3 | `STATS_ENTRY` constant |
| `package.json` | +1 | `uplot` devDependency |

### Bundle Sizes (Production)

```
Every page:      main.js  13.1KB / 4.6KB gz    main.css  10.0KB / 2.4KB gz
/stats only:     stats.js 55.8KB / 24.6KB gz   stats.css  4.3KB / 1.4KB gz
```

- `main.js` size unchanged — zero impact on blog pages
- `stats.js` = uPlot (52KB) + our code (3.8KB)
- `stats.css` = uPlot CSS (1.6KB) + our CSS (2.7KB), merged by esbuild from JS imports
- Other pages: 0 references to stats bundles (verified)

### Dashboard Sections

1. **Header + period pills** — 7d | 30d | 90d | All. `pushState` + re-fetch on click (no page reload). Back button works via `popstate`. Default: 30d. "All" = `days=0` (server queries all data, derives period start from earliest record).
2. **Totals bar** — 3 cards: Views, Visitors, AI Reads. Skeleton → number on load.
3. **Daily trend chart** — uPlot area (views, filled) + line (visitors). Cursor crosshair, live legend, drag-to-zoom.
4. **Top Pages** — ranked list with percentage-width bars, max 10 items.
5. **Referrers** — same pattern.
6. **Countries** — same pattern, with flag emoji + Cloudflare edge case fallbacks.
7. **Transparency footer** — "Analytics collected without cookies, tracking, or fingerprinting" + link to ADR-0004.

### Key Architecture Decisions Made During Build

**`pageShell` head param** — Added `head?: string` to inject per-page `<link>` and `<script>` tags in `<head>`. This is how `/stats` loads its own CSS and JS without modifying the shared template for other pages. Reusable for any future page that needs custom assets.

**CSS imported from JS, not as entry point** — `stats.ts` imports both `uplot/dist/uPlot.min.css` and `../styles/stats.css`. esbuild merges them into a single `dist/stats.css`. We do NOT add `stats.css` as a separate esbuild entry point — that would conflict with the CSS extracted from JS imports. This was a real bug caught during plan review.

**Stats module is framework-independent** — `stats.ts` does not import `@nisli/core` or any signals. Theme changes are detected via `MutationObserver` on `data-theme` attribute. This keeps the stats module decoupled from the framework — it's just vanilla TypeScript + uPlot.

**Period selector uses `pushState`** — Not full page navigation. Click a pill → `history.pushState` → re-fetch → re-render. URL is shareable and bookmarkable. Back button works via `popstate` listener. No router needed.

**Skeleton loading with correct CSS timing** — Template renders skeleton HTML at build time. `stats.css` loads in `<head>` (render-blocking), so skeleton styles are ready before first paint. `stats.js` loads as `type="module"` (deferred), fetches API, replaces skeletons. No FOUC, no layout shift.

**Fixed chart height (300px), responsive width** — uPlot requires explicit dimensions. `ResizeObserver` on the chart container handles width. Height is fixed to avoid CSS layout calculation bugs documented in uPlot issue #1075 (flexbox/grid height interactions).

## Anti-Patterns (Verified Against Open Source)

1. **❌ Chart library in shared bundle** — Must be in separate entry point. We verified: `main.js` size unchanged after adding stats.
2. **❌ React for one page** — Counterscale uses React + Recharts (135KB+ gz). Adding React for a single page is architectural pollution.
3. **❌ World map for <30 countries** — Plausible uses D3 + topojson (~80KB) for a choropleth. A ranked list with flag emoji is better UX for small datasets and costs 0 bytes.
4. **❌ Animations on data charts** — uPlot README: "No transitions or animations — they're always pure distractions." Also: "Smooth spline interpolation... strongly discouraged: Your data is misrepresented!"
5. **❌ Client-side aggregation** — All aggregation in D1 SQL. Client renders pre-aggregated JSON.
6. **❌ CSS entry point for stats styles** — Conflicts with CSS extracted from JS imports. Import all CSS from `stats.ts` and let esbuild merge. Caught during plan self-review.
7. **❌ `<link>` in `<body>`** — While HTML5-valid, risks FOUC. Use `pageShell`'s `head` param for correct `<head>` placement.
8. **❌ Dynamic `import()` for code splitting** — SSG pages control their own `<script>` tags — that IS the code splitting. No router or framework needed.
9. **❌ Framework coupling in stats module** — `stats.ts` uses `MutationObserver`, not `@nisli/core` signals. Decoupled.

## Gotchas (Encountered and Resolved)

### Canvas + Dark Mode (uPlot-specific)

uPlot uses Canvas API colors (strings), not CSS variables. The bridge pattern:
```typescript
function getColors() {
  const s = getComputedStyle(document.documentElement);
  const v = (p: string) => s.getPropertyValue(p).trim();
  return { link: v('--color-link'), border: v('--color-border'), muted: v('--color-text-muted'), bg: v('--color-bg') };
}
```
On theme toggle: `MutationObserver` on `data-theme` → `getColors()` → `chart.destroy()` → `new uPlot(opts, data, el)`. No API to update colors in-place — confirmed by reading uPlot TypeScript defs (no `setColor`/`setStyle` method).

### Canvas Cursor Points on Dark Backgrounds

uPlot issue #780 — cursor point fill defaults to white, invisible on dark backgrounds. Fix:
```typescript
cursor: { points: { fill: (u, sidx) => u.series[sidx].stroke as string, size: 8 } }
```

### uPlot Data Format

Expects columnar arrays, not row objects. X-axis must be unix timestamps in **seconds** (not milliseconds — JavaScript uses ms). Arrays must have length ≥ 2. Our transform:
```typescript
// Pad to length ≥ 2 if needed
if (rows.length === 1) {
  const prev = new Date(new Date(rows[0].date).getTime() - 86400_000).toISOString().slice(0, 10);
  rows = [{ date: prev, views: 0, visitors: 0 }, ...rows];
}
return [
  rows.map(r => new Date(r.date + 'T00:00:00').getTime() / 1000),  // seconds, not ms
  rows.map(r => r.views),
  rows.map(r => r.visitors),
];
```

### uPlot Responsive Resize

uPlot requires explicit `width`/`height` — no auto-resize. Issue #1075 documents bugs with flexbox/grid height calculation. Safe pattern: fixed height + `ResizeObserver` for width only:
```typescript
new ResizeObserver(() => {
  if (chart) chart.setSize({ width: container.clientWidth, height: 300 });
}).observe(container);
```

### uPlot Y-Axis Scale with Zero Data

Default y-axis range auto-scales to data. With all-zero data, the axis shows `0` to `0`. Fix: force minimum max of 1:
```typescript
scales: { y: { range: (u, min, max) => [0, Math.max(max, 1)] } }
```

### Country Flag Emoji Edge Cases

Cloudflare returns non-ISO 2-letter codes. Lookup table with fallback:
```typescript
const SPECIAL_COUNTRIES: Record<string, string> = {
  T1: '🔒 Tor', XX: '🌐 Unknown', A1: '🔒 Proxy', A2: '📡 Satellite', AP: '🌏 Asia-Pacific',
};
```
Standard ISO codes: `String.fromCodePoint(...[...code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))`. EU gets its real flag emoji `🇪🇺`. Wrapped in try/catch for any unexpected codes.

### "All Time" Period

`days=0` means "all time". The server uses `since = '1970-01-01'` (catches everything), then derives `period.start` from the earliest actual `by_day` entry. The client sends `?days=0` and the URL shows `?days=0` — clean and intentional.

Earlier design used `days=3650` (10 years) as a hack. This produced a misleading period display ("2016 → 2026" for a blog that's days old) and a meaningless URL. The `days=0` approach is semantically correct — 0 means "no lookback limit".

Server clamps input to `0..365` via `MAX_DAYS` constant. Any value outside this range (negative, huge, NaN) is clamped. `days=0` bypasses the lookback entirely.

### esbuild CSS Merge Behavior

When `stats.ts` imports both `uplot/dist/uPlot.min.css` and `../styles/stats.css`, esbuild merges them into a single `stats.css` output. Verified with isolated test: 3 entry points (`main.ts`, `main.css`, `stats.ts`) → 4 output files with zero cross-contamination. Do NOT also add `stats.css` as a separate esbuild entry point — it would conflict.

### Canvas + Print / Accessibility

- Print: Canvas renders blank. `@media print { .stats-chart { display: none; } }` — totals and ranked lists still print fine.
- Accessibility: `role="img"` + dynamic `aria-label` on chart container with summary text. All other sections are semantic HTML.

## Best Practices (Distilled)

1. **Per-page bundles via SSG template control** — Templates decide which `<script>` and `<link>` tags load. This IS code splitting for static sites — no framework, router, or dynamic `import()` needed.
2. **CSS variables as the Canvas theme bridge** — `getComputedStyle()` reads CSS vars, passes to Canvas API config. On theme change, re-read and recreate. Works with any Canvas library.
3. **Percentage-width bars for ranked lists** — Same pattern as Plausible's `bar.js`: absolute-positioned `<div>` with `width: ${(value / maxValue) * 100}%`. Pure CSS, no chart library. 10 lines of JS to render.
4. **URL-based state for dashboards** — `?days=30` is shareable, bookmarkable, and works with back button via `pushState` + `popstate`. No client-side router needed.
5. **Skeleton loading with render-blocking CSS** — Template renders skeleton HTML at build time. CSS in `<head>` ensures skeletons are styled before first paint. JS (deferred) replaces with data. Zero layout shift.
6. **`MutationObserver` for cross-module communication** — Stats module watches `data-theme` attribute instead of importing framework signals. Framework-independent, zero coupling.
7. **Fixed chart height, responsive width** — Avoids CSS layout calculation bugs with Canvas libraries. `ResizeObserver` for width, fixed px for height.
8. **devDependency for bundled libraries** — uPlot is bundled by esbuild at build time. It's a devDependency, not a runtime dependency.

## Ranked List Pattern (Reusable)

The same renderer handles pages, referrers, and countries:
```typescript
function renderList(items: { label: string; value: number }[], containerId: string) {
  const max = items[0].value;
  for (const item of items.slice(0, 10)) {
    const pct = max > 0 ? (item.value / max) * 100 : 0;
    row.innerHTML = `<div class="stats-bar" style="width:${pct}%"></div>
      <span class="stats-label">${esc(item.label)}</span>
      <span class="stats-value">${item.value.toLocaleString()}</span>`;
  }
}
```
All labels are HTML-escaped via `esc()` — defense in depth against stored XSS (see Post-Deploy Hardening). CSS: `.stats-bar` is `position: absolute; inset: 0; background: var(--color-surface)`. Label and value are `position: relative; z-index: 1` — overlaid on top of the bar. `font-variant-numeric: tabular-nums` aligns numbers.

## What the Plan Got Wrong

1. **CSS bundle size prediction** — ADR predicted `stats.css` at 768B gzip (uPlot CSS only). Actual: 1.4KB gzip (uPlot CSS + our 92-line stats.css). The prediction measured only uPlot's CSS in isolation, not the merged output.
2. **JS bundle size prediction** — ADR predicted 52KB min / 23KB gzip. Actual: 55.8KB min / 24.6KB gzip. Delta is our 196 lines of client code (~3.8KB minified).
3. **Stats CSS in main.css** — Early plan draft said "add stats CSS to main.css." This contradicted our own anti-pattern about bundle isolation. Caught during self-review, fixed before implementation.

## Post-Deploy Hardening

Issues found during deep audit after initial deployment. All fixed.

### The `|| 30` Falsy Pattern (found in 2 places)

`Number("0") || 30` evaluates to `30` because `0` is falsy in JavaScript. This pattern appeared in both the client (`getDays()`) and the server (`handleStats`). The `days=0` "all time" feature was completely broken — the server silently treated it as `days=30`.

The fix is the same in both places: check for parameter presence explicitly, don't use `||` with a numeric fallback when `0` is a valid value.
```typescript
// ❌ Broken: 0 is falsy
Number(params.get('days')) || 30
// ✅ Fixed (client): explicit presence check
params.has('days') ? Number(params.get('days')) : 30
// ✅ Fixed (server): null check + clamp + || 0 (not || 30)
raw !== null ? Math.max(0, Math.min(MAX_DAYS, Number(raw) || 0)) : 30
```

**Lesson**: `||` for default values is a JS footgun when `0`, `""`, or `false` are valid inputs. Use `??` for nullish coalescing, or explicit null checks. The `|| 0` in the server fix is safe because `NaN || 0 = 0` (all-time), which is a reasonable fallback for garbage input.

### XSS via `innerHTML` (stored XSS)

`renderList` used `innerHTML` with unescaped data from the API. The `by_path.path` field comes from the client beacon which accepts any string via `POST /api/event`. An attacker could store `<img src=x onerror=alert(1)>` as a path, and it would execute in every visitor's browser on the `/stats` page.

Two-layer fix:
1. **Server**: `handleEvent` now validates paths — must start with `/`, query/hash stripped, capped at 500 chars. Rejects non-paths with 400.
2. **Client**: `renderList` now escapes all labels with `esc()` (escapes `&`, `<`, `>`, `"`). Defense in depth — even if the server validation is bypassed, the client won't execute it.

**Lesson**: Any data that flows through a database and back into `innerHTML` is a stored XSS vector. Use `textContent` for plain text, or escape HTML entities. The referrer was safe (URL parsing rejects invalid URLs), but the path had no validation at all.

### Race Condition in Period Switching

Rapid clicks on period pills (7d → 90d) fired parallel fetches. If responses arrived out of order, the UI showed stale data (7d data with 90d pill highlighted). Fixed with a monotonic counter — each `load()` call increments `loadId`, and the response handler discards results if `loadId` has advanced.

```typescript
let loadId = 0;
async function load(days: number) {
  const id = ++loadId;
  const data = await fetchStats(days);
  if (id !== loadId) return; // superseded
  renderAll(data, days);
}
```

**Lesson**: Any UI that fires async requests from user input needs a staleness check. `AbortController` is the heavier solution; a monotonic counter is sufficient when you just need to discard stale responses.

### Fragile Hex Color Assumption

`c.link + '26'` appended a hex alpha to the CSS variable value, assuming it's always `#rrggbb`. This produces valid 8-digit hex (`#1a6b4e26`). But if the CSS variable ever changed to `rgb()` format, the fill would silently break. Fixed with an explicit `hexToFill()` that converts hex to `rgba()`.

**Lesson**: Don't assume the format of CSS custom property values. Parse explicitly.

### Error Recovery

`showError()` cleared `stats-totals` innerHTML, destroying the card structure. After an error, switching to a different period couldn't render totals because `querySelector('.stats-card')` found nothing. Fixed by only clearing chart and list sections, preserving the totals card skeleton.

**Lesson**: Error states should be recoverable. Don't destroy DOM structure that other code depends on for re-rendering.

## Intentional Design Decisions

Decisions that look like issues but are deliberate.

### `StatsResponse` Type Duplicated (Server + Client)

The `StatsResponse` interface exists in both `packages/analytics/src/stats.ts` (server, canonical) and `packages/blog/src/client/stats.ts` (client, copy). The client can't import from the analytics package — it's a browser module, analytics is a server package. The type is a contract between the API and the client. If the API shape changes, the client copy must be updated manually. This is acceptable for a single-consumer API. A shared types package would be overengineering.

### Timestamps Use Local Time, Not UTC

`toUPlotData` creates timestamps via `new Date(date + 'T00:00:00')` — no timezone suffix, so JavaScript interprets it as local time. This means the timestamp is shifted by the user's timezone offset (up to ±12 hours from UTC). For daily-granularity charts, this is invisible — uPlot formats dates in local time, so the labels are correct. For hourly data, this would be a bug. If we ever add hourly granularity, append `Z` for UTC.

### Client `getDays()` Doesn't Clamp

The client reads `?days=` from the URL without clamping. `?days=-5` sends `-5` to the server, which clamps it to `0` (all-time). The UI shows no pill highlighted (no button matches `-5`), which is slightly confusing but only happens when users manually edit the URL. The server is the authority on input validation — the client trusts it.

### Server `MAX_DAYS = 365` Clamp

The server clamps `days` to `0..365`. This prevents absurd lookback windows (`days=999999` → year -717) that would produce meaningless date math. `days=0` bypasses the lookback entirely (all-time). The `365` limit is arbitrary but reasonable — no analytics question requires "exactly 547 days of data." The valid client options are 0, 7, 30, 90.

### Area Fill Uses `hexToFill()`, Not Hex Append

The area fill color is `rgba(r,g,b,0.15)` computed from the CSS variable's hex value. The earlier approach (`c.link + '26'` for 8-digit hex) was fragile — it assumed CSS variables are always `#rrggbb` format. `getComputedStyle` returns the raw value as written in the stylesheet. If the stylesheet ever changed to `rgb()` notation, the hex append would silently produce an invalid color string. `hexToFill()` explicitly parses the hex and constructs `rgba()`. The `getColors()` helper already calls `.trim()` on the raw value, so leading whitespace from `getComputedStyle` is handled.

## Timezone-Aware Date Grouping (2026-03-07)

### Problem

D1 stores `created_at` via SQLite's `datetime('now')` — always UTC. The original `DATE(created_at)` grouped by UTC day. A visit at 5pm PST on March 6 stored as `2026-03-07T01:00Z` grouped under March 7. The dashboard showed all activity as "today" when some was actually yesterday in the viewer's timezone.

### Root Cause Chain

1. `schema.sql`: `created_at TEXT DEFAULT (datetime('now'))` — UTC, correct
2. `stats.ts`: `DATE(created_at)` — groups by UTC day, incorrect for non-UTC viewers
3. `stats.ts`: `new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10)` — lookback computed in UTC
4. Client `toUPlotData`: `new Date(r.date + 'T00:00:00')` — interprets UTC date as local midnight (noted as intentional in ADR, but the date itself was wrong)

The entire pipeline was consistently UTC, but the dashboard displayed UTC dates as if they were local dates.

### Solution

Client sends `tz` param (from `new Date().getTimezoneOffset()`) — the number of minutes behind UTC (e.g., PST = 480). Server converts to SQLite time modifier via `tzModifier()`:

```
480 → '-08:00'   (PST: subtract 8 hours from UTC)
-60 → '+01:00'   (CET: add 1 hour to UTC)
0   → '+00:00'   (UTC: no shift)
```

SQL uses `DATE(datetime(created_at, '±HH:MM'))` to shift UTC timestamps to the viewer's local time before grouping. Storage stays UTC — only the grouping changes per request.

### Why Client Offset, Not IANA Timezone

SQLite's `datetime()` accepts `±HH:MM` modifiers, not IANA timezone names. Converting IANA → offset on the server would require a timezone database (moment-timezone: 200KB+). `getTimezoneOffset()` gives us exactly what SQLite needs, handles DST automatically (the browser knows the current offset), and costs zero bytes.

### Validation

Server clamps `tz` to `[-720, 840]` — the full range of real UTC offsets (UTC-12 to UTC+14). `Math.round()` handles fractional offsets (India: UTC+5:30 = -330 minutes). Invalid/missing defaults to 0 (UTC).

### Verified Result

Before: all 22 views on `2026-03-07` (UTC day).
After with `tz=480` (PST): 14 views on `2026-03-06`, 8 views on `2026-03-07` — correctly reflects Thursday evening PST activity.

## Visitor Type Filter (2026-03-07)

### Problem

Dashboard was hardcoded to `WHERE visitor_type = 0 AND is_owner = 0` — humans only. No way to see bot or AI agent traffic, which is data the blog explicitly collects and wants to expose transparently (see ADR-0004 §Bot Detection Strategy: "we log bots instead of dropping them").

### Solution

New `visitor` query param on `/api/stats`: `human` (default), `bot`, `ai`, `all`. Maps to SQL via `visitorWhere()`:

| Filter | SQL WHERE |
|--------|-----------|
| `human` | `AND visitor_type = 0 AND is_owner = 0` |
| `bot` | `AND visitor_type = 1` |
| `ai` | `AND visitor_type = 2` |
| `all` | `AND is_owner = 0` |

The `ai_fetches` count in totals is always computed independently (`WHERE visitor_type = 2`) regardless of the active filter — it's a standalone metric.

### Dashboard UI

Visitor toggle pills (Humans | Bots | AI | All) sit next to the period pills. Same interaction pattern: `pushState` + re-fetch. URL state: `?days=30&visitor=bot`. Default omits `visitor` param (= human). Both pill groups share CSS via `.stats-pills` and `.stats-visitor-pills` selectors.

### Architecture Consistency

Both features follow the established patterns:
- URL-driven state via `pushState` + `popstate` (same as period pills)
- Server validates and clamps all inputs (same as `days` param)
- Pure functions for SQL generation (`tzModifier()`, `visitorWhere()`)
- `StatsQuery` interface extended, not replaced — backward compatible
- Client `getParams()` reads both `days` and `visitor` from URL — single source of truth
- Monotonic `loadId` counter handles race conditions for both params (same pattern)

### Post-Implementation Audit (2026-03-07)

Five issues found during code review. Two bugs fixed, three documented as intentional/gotchas.

#### ✅ Fixed: Lookback cutoff computed in UTC, not viewer-local

`since` was `new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10)` — UTC. But the WHERE clause compared it against `localDate` (viewer's timezone). A PST viewer asking for `days=1` at 11pm PST (= March 8 07:00 UTC) got `since = '2026-03-07'`, but events from `2026-03-07T06:00Z` had `localDate = '2026-03-06'` (PST), so `'2026-03-06' >= '2026-03-07'` was false — events from the viewer's "today" were excluded.

Fix: `new Date(Date.now() - (q.tz ?? 0) * 60_000)` shifts `Date.now()` to the viewer's local time before computing the cutoff date. Verified: PST `days=1` now correctly includes both March 6 and March 7 local days.

**Lesson**: When you shift one side of a comparison to local time (`localDate`), you must shift the other side too (`since`). Half-local comparisons are a class of timezone bugs.

#### ✅ Fixed: Print CSS didn't hide visitor pills

`.stats-pills` was hidden in `@media print`, but `.stats-visitor-pills` wasn't. One-line fix.

#### Documented: SQL interpolation of `tz` modifier

`DATE(datetime(created_at, '${tz}'))` interpolates a string into SQL. This is safe because:
1. `index.ts` clamps input to `[-720, 840]` integers
2. `tzModifier()` constructs from those integers with fixed `±HH:MM` format
3. SQLite `datetime()` modifiers can't be parameterized via `?` bind — they're syntax, not values

The safety invariant is: no user string ever reaches the SQL. If `tzModifier()` is refactored, this invariant must be preserved. The function is pure and has no external inputs beyond the clamped integer.

#### Documented: `VisitorFilter` validation duplicated (client + server)

`VALID_VISITORS` Set exists in both `index.ts` (server) and `stats.ts` (client). Same rationale as `StatsResponse` type duplication (ADR-0005 §Intentional Design Decisions): the client can't import from the analytics package. The type is a 4-value union — the duplication cost is trivial and the contract is stable.

#### Documented: `bot` and `ai` filters don't exclude owner

`visitorWhere('human')` and `visitorWhere('all')` include `AND is_owner = 0`. `visitorWhere('bot')` and `visitorWhere('ai')` don't. This is intentional: when viewing bot/AI traffic, you want to see everything including your own `curl` test requests (which match `TRADITIONAL_BOTS`). Owner exclusion only matters for human traffic where it inflates real visitor counts.

### Date Handling Audit (2026-03-07)

Full end-to-end trace of every date operation in the system. The invariant: UTC for storage and salt, viewer-local for display and grouping. All date operations consolidated into two utility modules — zero date logic outside them.

**`packages/analytics/src/dates.ts`** (server — Cloudflare Workers):
- `utcToday()` — for daily salt rotation. Name says UTC.
- `localToday(tz)` — for period.end. Name says local.
- `daysAgo(ms, n)` — lookback cutoff from a pre-shifted timestamp.
- `shiftToLocal(utcMs, tz)` — the UTC→local number-line trick, JSDoc explains semantics.

**`packages/blog/src/lib/dates.ts`** (build templates + browser client):
- `parseLocalDate(str)` — handles both `YYYY-MM-DD` (daily) and `YYYY-MM-DDTHH:00:00` (hourly). Appends `T00:00:00` only for daily format. No `Z` suffix = local time.
- `formatDateLong(str)` — "March 5, 2026". Single implementation, used by index + post templates.
- `localDateStr(d)` — YYYY-MM-DD in local time. Used by frontmatter parser + chart padding.
- `localToday()`, `localYesterday()`, `prevDay(str)` — chart padding helpers.
- `toUnixLocal(str)` — uPlot x-axis timestamps.

| Layer | Code | Timezone | Status |
|-------|------|----------|--------|
| D1 storage | `datetime('now')` | UTC | ✅ Correct — canonical timestamp |
| Daily salt | `utcToday()` | UTC | ✅ Correct — rotates at UTC midnight |
| SQL grouping | `DATE(datetime(created_at, '±HH:MM'))` or `strftime('%Y-%m-%dT%H:00:00', ...)` | Viewer-local | ✅ Correct — shifts before grouping |
| Lookback cutoff | `daysAgo(shiftToLocal(...), days)` | Viewer-local | ✅ Fixed — was UTC, caused off-by-one |
| `period.end` | `localToday(tz)` | Viewer-local | ✅ Fixed — was UTC, mixed timezones |
| Chart timestamps | `toUnixLocal(date)` → `parseLocalDate()` | Local | ✅ Correct — uPlot formats in local time |
| Chart padding | `localToday()`, `localYesterday()` | Local | ✅ Fixed — was `toISOString()` (UTC) |
| `TZ_OFFSET` | `new Date().getTimezoneOffset()` | Computed once at load | ✅ Acceptable — stale across DST, refreshes on interaction |

**Rule**: `toISOString()` = UTC. Use it for storage and salt only. For viewer-facing dates, use the named utility functions. Every function name declares its timezone intent — you can't accidentally use a UTC function where local is needed.

### Adaptive Chart Granularity (2026-03-07)

D1 stores second-precision timestamps (`2026-03-07 23:47:55`). The original implementation discarded all sub-day precision with `DATE(created_at)`, grouping everything by day. With only 2 days of data, uPlot interpolated between the 2 points and showed hour ticks on the x-axis — but those hours were meaningless (no data behind them).

**Solution**: Adaptive granularity based on the lookback window:
- `days <= 7` → hourly buckets via `strftime('%Y-%m-%dT%H:00:00', datetime(created_at, tz))`
- `days > 7` or all-time → daily buckets via `DATE(datetime(created_at, tz))`

**Threshold rationale**: 7 days × 24 hours = 168 max buckets (reasonable for uPlot). 30 days × 24 = 720 (too dense). The threshold is a constant `HOURLY_THRESHOLD = 7` in `stats.ts`.

**Format design**: Hourly buckets use `YYYY-MM-DDTHH:00:00` (ISO-ish, no `Z`). JS parses this as local time. Daily buckets use `YYYY-MM-DD`. `parseLocalDate()` handles both: if the string contains `T`, parse directly; otherwise append `T00:00:00`. The `by_day` field name is unchanged for backward compatibility — it's really "by time bucket".

**Verified**: 7d PST view now shows 9 hourly data points (5pm, 6pm, 7pm March 6, etc.) instead of 2 daily points with meaningless interpolated hours.

## References

- [ADR-0004: Analytics](./0004-analytics.md) — the data collection layer this dashboard consumes
- [uPlot](https://github.com/leeoniya/uPlot) — 9.9K⭐, 24.6KB gz, MIT, v1.6.32
- [uPlot area-fill demo](https://github.com/leeoniya/uPlot/blob/master/demos/area-fill.html) — our chart pattern
- [uPlot issue #780](https://github.com/leeoniya/uPlot/issues/780) — dark mode cursor point fill fix
- [uPlot issue #1075](https://github.com/leeoniya/uPlot/issues/1075) — responsive resize gotchas with flexbox/grid
- [Plausible bar.js](https://github.com/plausible/analytics/blob/master/assets/js/dashboard/stats/bar.js) — percentage-width bar pattern we adopted
- [Counterscale dashboard](https://github.com/benvinegar/counterscale/blob/main/packages/server/app/routes/dashboard.tsx) — React + Recharts reference (what we avoided)
- Live: [gkoreli.com/stats](https://gkoreli.com/stats/)
