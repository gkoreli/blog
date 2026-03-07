# ADR-0005: Public Analytics Dashboard — `/stats` Page

## Status

Accepted — 2026-03-07. Deployed to production.

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

1. **Header + period pills** — 7d | 30d | 90d | All. `pushState` + re-fetch on click (no page reload). Back button works via `popstate`. Default: 30d. "All" = `days=3650`.
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

API accepts `?days=N` with no "all" option. `days=3650` (10 years) effectively returns all data for a blog that's days old. No API change needed.

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

The same 10-line renderer handles pages, referrers, and countries:
```typescript
function renderList(items: { label: string; value: number }[], containerId: string) {
  const max = items[0].value;
  for (const item of items.slice(0, 10)) {
    const pct = max > 0 ? (item.value / max) * 100 : 0;
    row.innerHTML = `<div class="stats-bar" style="width:${pct}%"></div>
      <span class="stats-label">${item.label}</span>
      <span class="stats-value">${item.value.toLocaleString()}</span>`;
  }
}
```
CSS: `.stats-bar` is `position: absolute; inset: 0; background: var(--color-surface)`. Label and value are `position: relative; z-index: 1` — overlaid on top of the bar. `font-variant-numeric: tabular-nums` aligns numbers.

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
// ✅ Fixed: explicit null check
params.has('days') ? Number(params.get('days')) : 30
// ✅ Also fixed (server): null check + clamp
raw !== null ? Math.max(0, Math.min(3650, Number(raw) || 0)) : 30
```

**Lesson**: `||` for default values is a JS footgun when `0`, `""`, or `false` are valid inputs. Use `??` for nullish coalescing, or explicit null checks. This is a well-known pattern but easy to miss in the flow of writing code.

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

## References

- [ADR-0004: Analytics](./0004-analytics.md) — the data collection layer this dashboard consumes
- [uPlot](https://github.com/leeoniya/uPlot) — 9.9K⭐, 24.6KB gz, MIT, v1.6.32
- [uPlot area-fill demo](https://github.com/leeoniya/uPlot/blob/master/demos/area-fill.html) — our chart pattern
- [uPlot issue #780](https://github.com/leeoniya/uPlot/issues/780) — dark mode cursor point fill fix
- [uPlot issue #1075](https://github.com/leeoniya/uPlot/issues/1075) — responsive resize gotchas with flexbox/grid
- [Plausible bar.js](https://github.com/plausible/analytics/blob/master/assets/js/dashboard/stats/bar.js) — percentage-width bar pattern we adopted
- [Counterscale dashboard](https://github.com/benvinegar/counterscale/blob/main/packages/server/app/routes/dashboard.tsx) — React + Recharts reference (what we avoided)
- Live: [gkoreli.com/stats](https://gkoreli.com/stats/)
