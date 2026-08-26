import { staticHtml as html, raw } from '@nisli/core/static';

export const statsHead = `<link rel="stylesheet" href="/stats.css">
  <script type="module" src="/stats.js"></script>`;

function listSkeleton(rows: number): string {
  return Array.from({ length: rows }, () => '<div class="skeleton skeleton-row"></div>').join('');
}

export function statsPage() {
  return html`<article>
  <div class="stats-header">
    <div>
      <h1>Stats</h1>
      <p class="stats-intro">A public view of pages served by this site.</p>
    </div>
    <div class="stats-controls" aria-label="Stats filters">
      <fieldset class="stats-filter" data-filter-group="traffic">
        <legend>Traffic</legend>
        <div class="stats-pills">
          <button type="button" data-traffic="browser" aria-pressed="true">Browsers</button>
          <button type="button" data-traffic="bot" aria-pressed="false">Bots</button>
          <button type="button" data-traffic="ai" aria-pressed="false">AI UAs</button>
          <button type="button" data-traffic="all" aria-pressed="false">All</button>
        </div>
      </fieldset>
      <fieldset class="stats-filter" data-filter-group="period">
        <legend>Period</legend>
        <div class="stats-pills">
          <button type="button" data-days="7" aria-pressed="false">7d</button>
          <button type="button" data-days="30" aria-pressed="true">30d</button>
          <button type="button" data-days="90" aria-pressed="false">90d</button>
          <button type="button" data-days="0" aria-pressed="false">All</button>
        </div>
      </fieldset>
    </div>
  </div>

  <p class="stats-status" id="stats-status" role="status" aria-atomic="true">Loading stats…</p>

  <div id="stats-dashboard" aria-busy="true">
    <div class="stats-period" id="stats-period"><span class="skeleton skeleton-text"></span></div>

    <div class="stats-totals" id="stats-totals">
      <div class="stats-card"><div class="skeleton skeleton-value"></div><div class="stats-card-label">Page views</div></div>
      <div class="stats-card"><div class="skeleton skeleton-value"></div><div class="stats-card-label">Daily clients</div></div>
    </div>

    <section class="stats-device-section" id="stats-device-section" aria-labelledby="stats-device-heading">
      <h2 id="stats-device-heading">Device mix <span>Browser requests only</span></h2>
      <div class="stats-devices" id="stats-devices">
        <div class="stats-device"><img src="/icons/desktop.svg" width="20" height="20" alt=""><span class="stats-device-label">Desktop</span><span class="skeleton skeleton-device-val"></span></div>
        <div class="stats-device"><img src="/icons/phone.svg" width="20" height="20" alt=""><span class="stats-device-label">Mobile</span><span class="skeleton skeleton-device-val"></span></div>
        <div class="stats-device"><img src="/icons/tablet.svg" width="20" height="20" alt=""><span class="stats-device-label">Tablet</span><span class="skeleton skeleton-device-val"></span></div>
      </div>
    </section>

    <section class="stats-chart-section" aria-labelledby="stats-chart-heading">
      <h2 id="stats-chart-heading">Page views over time</h2>
      <div class="stats-chart" id="stats-chart" role="img" aria-label="Loading page views chart">
        <div class="skeleton skeleton-chart"></div>
      </div>
      <details class="stats-chart-data">
        <summary>View chart as a table</summary>
        <div id="stats-chart-table"><div class="skeleton skeleton-row"></div></div>
      </details>
    </section>

    <section class="stats-section" id="stats-pages">
      <h2>Top pages <span>by views</span></h2>
      ${raw(listSkeleton(3))}
    </section>

    <section class="stats-section" id="stats-referrers">
      <h2>Referrer hosts <span>by views</span></h2>
      ${raw(listSkeleton(2))}
    </section>

    <section class="stats-section" id="stats-countries">
      <h2>Countries <span>by views</span></h2>
      ${raw(listSkeleton(2))}
    </section>

    <section class="stats-section" id="stats-agents">
      <h2>Matched User-Agent rules <span>by views</span></h2>
      ${raw(listSkeleton(2))}
    </section>
  </div>

  <aside class="stats-methodology" aria-labelledby="stats-methodology-heading">
    <h2 id="stats-methodology-heading">What these numbers mean</h2>
    <p>A page view is one recorded page event. Since the August 26, 2026 cutover, that means a successful, non-prefetch GET that served HTML at the edge. API requests, assets, redirects, errors, feeds, and non-HTML responses do not count. Recording is best effort and my own requests are excluded.</p>
    <p>The history before the cutover remains included because it is useful. Those rows came from the former browser JavaScript beacon, so they represent browser-rendered page events and beacon-capable automation rather than every served page. Treat the cutover as a measurement-method change, not a claim that the two eras are identical.</p>
    <p>Browsers, Bots, and AI UAs are heuristic classes based on sender-provided User-Agent strings; they are not verified identities. An AI-UA match does not prove that a model read, indexed, cited, or used a page.</p>
    <p>A daily client is a per-day pseudonymous identifier, not a person. Edge observations use a secret HMAC over the site, UTC date, IP address, and User-Agent; historical beacon rows use their original daily identifiers. Neither method establishes the same client across dates, devices, or networks. Hourly daily-client values are not additive.</p>
    <p><a href="/privacy">Privacy details</a> · <a href="https://github.com/gkoreli/blog/blob/main/docs/adr/0016-analytics-observation-semantics.md">Engineering decision</a></p>
  </aside>
</article>`;
}
