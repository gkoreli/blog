# ADR-0005: Public Analytics Dashboard — `/stats` Page

## Status

Proposed — 2026-03-07

## Context

Phase 1 of ADR-0004 is deployed. The blog now collects page views in D1 and serves aggregate data via `GET /api/stats`. The next step is a public `/stats` page that renders this data — transparent analytics, visible to anyone.

### What We Have

**API response** (`/api/stats?days=30`):
```json
{
  "period": { "start": "2026-02-05", "end": "2026-03-07" },
  "totals": { "views": 2, "visitors": 1, "ai_fetches": 0 },
  "by_path": [{ "path": "/the-agentic-product-engineer/", "views": 1, "visitors": 1 }],
  "by_country": [{ "country": "US", "views": 2 }],
  "by_day": [{ "date": "2026-03-07", "views": 2, "visitors": 1 }],
  "by_referrer": [{ "referrer": "github.com/gkoreli", "views": 1 }]
}
```

**Blog tech stack** (constraints for the dashboard):
- Static HTML generated at build time by `@nisli/core` pipeline (`packages/blog/src/pipeline/build.ts`)
- Templates are TypeScript functions returning `html` tagged template literals (not React, not JSX)
- CSS custom properties for theming: `--color-bg`, `--color-surface`, `--color-text`, `--color-link`, `--color-border`, `--color-text-muted`
- Dark/light mode via `data-theme` attribute on `<html>`
- Layout: sidebar + main content area, max-width 800px
- Client JS: esbuild-bundled ES modules, currently ~1.2KB (theme toggle only)
- Font: Lora (serif) — the blog has a literary, editorial feel
- Zero framework dependencies — vanilla JS, web components for interactivity

### What the Open Source Projects Use (Verified in Source)

**Plausible** (21K⭐) — `assets/js/dashboard/`:
- React + Chart.js + D3 (for world map) + Tailwind CSS
- Dashboard sections: top stats bar, line graph (views/visitors over time), sources, pages, locations (world map), devices, behaviours
- Chart.js for line/bar charts, D3 for the choropleth world map
- Bundle: heavy — Chart.js alone is ~65KB gzipped, D3 ~80KB
- Public shared dashboards via `/share/:slug` — same dashboard, read-only, no auth

**Counterscale** (2K⭐) — `packages/server/app/routes/dashboard.tsx`:
- React + Recharts + React Router (Remix)
- Dashboard sections: StatsCard (totals), TimeSeriesCard (line chart), PathsCard, ReferrerCard, CountryCard, BrowserCard, DeviceCard, UTM cards
- Recharts `ComposedChart` with `Area` + `Line` for views/visitors overlay
- Bundle: very heavy — Recharts ~90KB gzipped, React ~45KB
- No public dashboard feature — admin-only behind auth

**Key insight**: Both projects use React + heavy charting libraries because they're full-featured SaaS dashboards. We're building a single transparent page on a personal blog. Different requirements entirely.

### Chart Library Evaluation

| Library | Min | Gzip | Framework | Rendering | Notes |
|---------|-----|------|-----------|-----------|-------|
| Chart.js (Plausible) | 200KB+ | ~65KB | Any | Canvas | Full featured, heavy |
| Recharts (Counterscale) | 300KB+ | ~90KB | React-only | SVG | React dependency |
| D3 (Plausible maps) | 250KB+ | ~80KB | Any | SVG | Full viz toolkit, overkill |
| uPlot | 52KB | 23KB | Any | Canvas | Fast, lightweight, no deps |
| frappe-charts | 1MB | ~40KB | Any | SVG | Simple API but large |
| Hand-rolled SVG | ~1KB | ~0.5KB | None | SVG | Zero deps, full control |

**Our current client JS is 1.2KB.** Adding Chart.js would make it 55x larger. Even uPlot (23KB) would be 19x larger.

### What We Actually Need to Visualize

Looking at the API response, we need to render:

1. **Totals bar** — 3 numbers: views, visitors, AI fetches. Pure HTML/CSS, no chart needed.
2. **Daily trend** — `by_day` array, ~30 data points. A simple line or area chart. This is the only thing that arguably needs a chart library.
3. **Top pages** — `by_path` array. A ranked list with bar widths. Pure HTML/CSS.
4. **Countries** — `by_country` array. A ranked list with bar widths. Pure HTML/CSS. (A world map would be cool but adds D3 + topojson — ~80KB for a cosmetic feature.)
5. **Referrers** — `by_referrer` array. A ranked list. Pure HTML/CSS.
6. **AI fetches** — single number, possibly with a note like "This blog was also read by N AI agents". Pure HTML.

Of these 6 sections, only the daily trend chart benefits from a charting library. The rest are numbers and ranked lists — pure HTML/CSS with percentage-width bars.

## Proposals

### Proposal A: Hand-Rolled SVG ⭐

Build the daily trend as an inline SVG generated from JavaScript. The `by_day` array has ~30 points — trivial to map to SVG `<polyline>` or `<path>` coordinates.

```javascript
// ~30 lines of JS to render a sparkline SVG
function sparkline(data, width, height) {
  const max = Math.max(...data.map(d => d.views), 1);
  const points = data.map((d, i) =>
    `${(i / (data.length - 1)) * width},${height - (d.views / max) * height}`
  ).join(' ');
  return `<svg viewBox="0 0 ${width} ${height}"><polyline points="${points}" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;
}
```

Everything else (totals, ranked lists, country bars) is pure HTML/CSS with percentage-width `<div>` bars — the same pattern Plausible uses for its tables.

**Pros:**
- Zero dependencies — consistent with the blog's philosophy
- ~1-2KB total JS for the entire dashboard
- Full control over styling, dark mode, responsive behavior
- SVG respects `currentColor` — automatically adapts to theme
- No Canvas — works in RSS readers, print, accessibility tools

**Cons:**
- No tooltips, zoom, or interactive features on the chart
- No animation
- Have to handle edge cases (empty data, single data point) ourselves

### Proposal B: uPlot

Use uPlot (23KB gzipped) for the daily trend chart. Everything else stays as HTML/CSS.

**Pros:**
- Battle-tested rendering, handles edge cases
- Interactive tooltips, cursor tracking
- Canvas-based — fast for large datasets

**Cons:**
- 23KB for one chart on a page with ~30 data points
- Canvas doesn't respect CSS `currentColor` — need to manually sync theme colors
- Canvas doesn't work in RSS readers or print stylesheets
- Requires a CSS file import alongside the JS
- Overkill for our data volume

### Proposal C: Chart.js (Plausible's choice)

Use Chart.js (~65KB gzipped) for the daily trend chart.

**Pros:**
- Most popular, best documented
- Plausible uses it — proven for analytics dashboards

**Cons:**
- 65KB for one chart — 54x our current JS bundle
- Canvas-based — same theme/print/RSS issues as uPlot
- Designed for complex multi-dataset charts — we have one line

## Decision

**Proposal A (Hand-Rolled SVG)** for the daily trend. Everything else is HTML/CSS.

### Why

The blog's identity is zero-dependency, hand-crafted, transparent. Adding a 23-65KB chart library for 30 data points contradicts that. The SVG approach:
- Keeps total page JS under 3KB (currently 1.2KB + ~1KB for stats fetch + render)
- Works with dark/light themes via CSS `currentColor`
- Is accessible — SVG is part of the DOM, screen readers can traverse it
- Is printable — unlike Canvas
- Matches the editorial, minimal aesthetic of the blog

If we ever need interactive charts (zoom, tooltips, drill-down), uPlot is the upgrade path at 23KB — the smallest viable option.

## Implementation Plan

### Page Architecture

The `/stats` page is a **static HTML shell** that fetches data client-side from `/api/stats`:

```
/stats (static HTML, generated at build time)
  └── <script> fetches /api/stats?days=30
      └── Renders totals, chart, tables into DOM
```

This is the same pattern Counterscale uses (loader fetches data, client renders). The difference is we don't need React — vanilla JS DOM manipulation is sufficient for 6 sections of static data.

### Page Sections (in order)

1. **Header**: "Stats" title + period selector (7d / 30d / 90d / all)
2. **Totals bar**: Views | Visitors | AI Fetches — 3 cards in a row
3. **Daily trend**: SVG area/line chart — views and visitors over time
4. **Top pages**: Ranked list with horizontal bar widths (% of max)
5. **Referrers**: Ranked list with horizontal bar widths
6. **Countries**: Ranked list with country flag emoji + bar widths
7. **Footer note**: "Analytics are collected without cookies. See how it works." → link to ADR-0004 or a blog post

### Styling Approach

- Reuse existing CSS variables (`--color-bg`, `--color-surface`, `--color-text`, `--color-link`, `--color-border`)
- Ranked lists: each row has a background `<div>` with `width: ${percentage}%` and `background: var(--color-surface)` — the same visual pattern Plausible uses for its page/source/country tables
- Totals cards: simple flexbox row with large numbers
- SVG chart: `stroke: var(--color-link)`, `fill: var(--color-link)` with low opacity for area fill
- Responsive: stack cards vertically on mobile, chart goes full-width
- Country flags: use country code → flag emoji conversion (`US` → 🇺🇸) — zero-dep, works everywhere

### Build Integration

The `/stats` page needs to be added to the build pipeline:
- New template: `packages/blog/src/templates/stats.ts` — returns the HTML shell with empty containers
- Build step in `build.ts`: generate `/stats/index.html` using `pageShell()` wrapper (gets sidebar, nav, theme toggle for free)
- Client JS: new module `packages/blog/src/client/stats.ts` — fetches `/api/stats`, renders into DOM
- esbuild bundles it alongside `main.js`, or as a separate `stats.js` entry point (loaded only on `/stats`)

### Open Questions

1. **Separate JS bundle or inline?** A separate `stats.js` loaded only on `/stats` avoids bloating every page. But it's one more HTTP request. At ~1KB, inlining might be simpler.
2. **Period selector**: Should it be URL-based (`/stats?days=7`) or client-side toggle? URL-based is shareable but requires the Worker to handle `/stats` routing. Client-side is simpler.
3. **Country flag emoji**: Works on all modern browsers and OSes. But some country codes from Cloudflare might be non-standard (e.g., `T1` for Tor). Need a fallback.
4. **Empty state**: What to show when there's no data yet? "No visitors yet. Share your blog!" or similar.
5. **Cache**: `/api/stats` already returns `cache-control: public, max-age=300` (5 min). Is that the right TTL for a public dashboard?

## References

- ADR-0004: Analytics — the data collection layer this dashboard consumes
- [Plausible shared dashboard](https://plausible.io/plausible.io) — public example of their dashboard
- [Counterscale dashboard](https://github.com/benvinegar/counterscale) — admin-only, React + Recharts
- [SVG `<polyline>` MDN](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/polyline) — the core element for our sparkline
- [Country code to flag emoji](https://dev.to/jorik/country-code-to-flag-emoji-3ol9) — `String.fromCodePoint(...[...code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))`
