import { html } from 'nisli-static';

/** Head tags for the stats page — stats.css + stats.js loaded only here */
export const statsHead = `<link rel="stylesheet" href="/stats.css">
  <script type="module" src="/stats.js"></script>`;

export function statsTemplate() {
  return html`<article>
  <div class="stats-header">
    <h1>Stats</h1>
    <div class="stats-controls">
      <div class="stats-visitor-pills">
        <button data-visitor="human" class="active">Humans</button>
        <button data-visitor="bot">Bots</button>
        <button data-visitor="ai">AI</button>
        <button data-visitor="all">All</button>
      </div>
      <div class="stats-pills">
        <button data-days="7">7d</button>
        <button data-days="30">30d</button>
        <button data-days="90">90d</button>
        <button data-days="0">All</button>
      </div>
    </div>
  </div>

  <div class="stats-totals" id="stats-totals">
    <div class="stats-card"><div class="skeleton skeleton-value"></div><div class="stats-card-label">Views</div></div>
    <div class="stats-card"><div class="skeleton skeleton-value"></div><div class="stats-card-label">Visitors</div></div>
    <div class="stats-card"><div class="skeleton skeleton-value"></div><div class="stats-card-label">AI Reads</div></div>
  </div>

  <div class="stats-chart" id="stats-chart" role="img" aria-label="Daily views chart">
    <div class="skeleton skeleton-chart"></div>
  </div>

  <div class="stats-section" id="stats-pages">
    <h2>Top Pages</h2>
    <div class="skeleton skeleton-row"></div>
    <div class="skeleton skeleton-row"></div>
    <div class="skeleton skeleton-row"></div>
  </div>

  <div class="stats-section" id="stats-referrers">
    <h2>Referrers</h2>
    <div class="skeleton skeleton-row"></div>
    <div class="skeleton skeleton-row"></div>
  </div>

  <div class="stats-section" id="stats-countries">
    <h2>Countries</h2>
    <div class="skeleton skeleton-row"></div>
    <div class="skeleton skeleton-row"></div>
  </div>

  <div class="stats-footer">
    Analytics collected without cookies, tracking, or fingerprinting.
    <a href="https://github.com/gkoreli/blog/blob/main/docs/adr/0004-analytics.md">How it works →</a>
  </div>
</article>`;
}
