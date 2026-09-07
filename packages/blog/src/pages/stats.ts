import { staticHtml as html, raw } from '@nisli/core/static';
import { ANALYTICS_EVIDENCE_SINCE } from '@gkoreli/analytics/contracts';

export const statsHead = `<link rel="stylesheet" href="/stats.css">
  <script type="module" src="/stats.js"></script>`;

function listSkeleton(rows: number): string {
  return Array.from({ length: rows }, () => '<div class="skeleton skeleton-row"></div>').join('');
}

const evidenceDate = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}).format(new Date(`${ANALYTICS_EVIDENCE_SINCE}T00:00:00Z`));

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
          <button type="button" data-traffic="agents" aria-pressed="false">AI agents</button>
          <button type="button" data-traffic="crawlers" aria-pressed="false">Crawlers</button>
          <button type="button" data-traffic="automation" aria-pressed="false">Automation</button>
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

    <p class="stats-scope" id="stats-scope" hidden></p>

    <div class="stats-totals" id="stats-totals">
      <div class="stats-card"><div class="skeleton skeleton-value"></div><div class="stats-card-label">Page views</div></div>
      <div class="stats-card"><div class="skeleton skeleton-value"></div><div class="stats-card-label">Daily clients</div></div>
    </div>

    <section class="stats-device-section" id="stats-device-section" aria-labelledby="stats-device-heading">
      <h2 id="stats-device-heading">Device mix <span>Browsers only</span></h2>
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
      <h2>Reported referrers <span>by views</span></h2>
      ${raw(listSkeleton(2))}
    </section>

    <section class="stats-section" id="stats-countries">
      <h2>Countries <span>by views</span></h2>
      ${raw(listSkeleton(2))}
    </section>

    <section class="stats-section" id="stats-composition">
      <h2>Who fetched these pages <span>by kind and reason</span></h2>
      ${raw(listSkeleton(3))}
    </section>
  </div>

  <aside class="stats-methodology" aria-labelledby="stats-methodology-heading">
    <h2 id="stats-methodology-heading">What these numbers mean</h2>
    <p>Referrers are claims supplied with requests and can be fabricated. Only reviewed hostnames are named here; other names are grouped as Other reported referrers, without treating unfamiliar sources as bots. A pinned Matomo spam list and reviewed local rules exclude matching observations from every public metric, including All; the excluded count is shown for your selection. Referral evidence is retained. These rules also apply to past dates, so reported history can change when the policy changes. An approved name does not prove a genuine referral. <a href="https://github.com/gkoreli/blog/blob/main/docs/adr/0016.6-versioned-referral-policy-and-matomo-source.md">Referral-abuse policy</a>.</p>
    <p>A page view is one recorded page event. Since the August 26, 2026 cutover, that means a successful, non-prefetch GET that served HTML or the Markdown twin of a page at the edge. API requests, assets, redirects, errors, feeds, and other non-page responses do not count. Recording is best effort. Rows marked as mine are excluded from public queries, but that marking depends on server-side configuration and is not currently proven for all of my requests.</p>
    <p>Every row carries one reader kind and one reason, both facts about the request. The four filters group those kinds by what the client was doing. Browsers: a browser fetching a page for itself. AI agents: software fetching a page right now on a person's behalf, either a named on-demand fetcher such as ChatGPT-User or a client that signed its request with Web Bot Auth. Crawlers: search engines, AI search indexers, AI training crawlers, and link-preview fetchers, all matched on the User-Agent they declare. Automation: browsers running on hosting networks, headless browsers, HTTP clients, generic bot tokens, and browsers too old to send the headers this site checks. The four groups are disjoint and add up to All.</p>
    <p>Browsers is not a verified-human count. It holds three kinds of evidence, listed by name in the composition table. Since ${evidenceDate}: a navigation-shaped request, meaning a Sec-Fetch-Mode of navigate, a Sec-Fetch-Dest of document, an Accept that admits HTML, and an Accept-Language, from a network that is not on this site's list of hosting providers. Between August 26 and ${evidenceDate}: the User-Agent alone, because the site did not record headers yet; for most of those rows the network was reconstructed afterwards from Cloudflare's zone analytics, and rows that turned out to sit on hosting networks moved to Automation. Before August 26: rows from the former browser beacon, which ran this site's script inside a page. Expect the Browsers series to drop across those two dates. That is the method changing, not readers leaving.</p>
    <p>A hosting network is a verdict on its own. A browser on a cloud host that sends every header a person's browser sends is still counted as Automation, because that is where the bulk of the inflation came from. A missing Fetch Metadata header is a verdict only when the User-Agent claims a browser version that always sends it: Chromium 76, Firefox 90, Safari 16.4 and later, including their WebViews. Older claims are listed as Old browsers, neither readers nor automation. A crawler match does not prove that a model read, indexed, cited, or used a page. Filtering by a page, a kind, or a named agent applies the same window and group to every panel on this page.</p>
    <p>A daily client is a per-day pseudonymous identifier, not a person. Edge observations use a secret HMAC over the site, UTC date, IP address, and User-Agent; historical beacon rows use their original daily identifiers. Neither method establishes the same client across dates, devices, or networks. Hourly daily-client values are not additive.</p>
    <p><a href="/privacy">Privacy details</a> · <a href="https://github.com/gkoreli/blog/blob/main/docs/adr/0016-analytics-observation-semantics.md">Engineering decision</a> · <a href="https://github.com/gkoreli/blog/blob/main/docs/adr/0016.2-browser-evidence-and-reader-tier.md">Browser evidence</a> · <a href="https://github.com/gkoreli/blog/blob/main/docs/adr/0016.3-audience-composition-and-citable-articles.md">Audience composition</a></p>
  </aside>
</article>`;
}
