import { html } from '@nisli/core';

export const statsHead = `<link rel="stylesheet" href="/stats.css">
  <script type="module" src="/stats.js"></script>`;

function listSkeleton(rows: number) {
  return Array.from({ length: rows }, () => html`<div class="skeleton skeleton-row"></div>`);
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
          <button type="button" data-traffic="agents" aria-pressed="false">Assistants &amp; signed clients</button>
          <button type="button" data-traffic="crawlers" aria-pressed="false">Crawlers</button>
          <button type="button" data-traffic="automation" aria-pressed="false">Automation & legacy rules</button>
          <button type="button" data-traffic="unresolved" aria-pressed="false">Unresolved</button>
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
      ${listSkeleton(3)}
    </section>

    <section class="stats-section" id="stats-referrers">
      <h2>Reported referrers <span>by views</span></h2>
      ${listSkeleton(2)}
    </section>

    <section class="stats-section" id="stats-transitions">
      <h2>Between blog pages <span>reported transitions</span></h2>
      ${listSkeleton(2)}
    </section>
    <section class="stats-section" id="stats-previous-pages" hidden>
      <h2>Previous blog pages <span>reported transitions</span></h2>
      ${listSkeleton(2)}
    </section>
    <section class="stats-section" id="stats-next-pages" hidden>
      <h2>Next blog pages <span>reported transitions</span></h2>
      ${listSkeleton(2)}
    </section>
    <p class="stats-transition-details" id="stats-transition-details"></p>

    <section class="stats-section" id="stats-countries">
      <h2>Countries <span>by views</span></h2>
      ${listSkeleton(2)}
    </section>

    <section class="stats-section" id="stats-composition">
      <h2>Who fetched these pages <span>by kind and reason</span></h2>
      ${listSkeleton(3)}
    </section>
    <section class="stats-section" id="stats-declarations">
      <h2>Selected client declarations <span>single stored name</span></h2>
      ${listSkeleton(2)}
    </section>
    <section class="stats-section" id="stats-signers">
      <h2>Verified signing outcomes <span>reviewed names</span></h2>
      ${listSkeleton(2)}
    </section>
    <section class="stats-section" id="stats-verification">
      <h2>Signature verification <span>coverage and availability</span></h2>
      <p class="stats-section-note">Local key verification and Cloudflare assessments are separate. Coverage counts overlap; none establishes a human trigger.</p>
      ${listSkeleton(3)}
    </section>
  </div>

  <aside class="stats-methodology" aria-labelledby="stats-methodology-heading">
    <h2 id="stats-methodology-heading">What these numbers mean</h2>
    <p>From October 27, 2026 UTC, new observations retain derived local signature coverage and any available native verified-bot/signed-agent booleans. Earlier rows have no such record. Unavailable native fields remain unknown, not false. A verified signature authenticates only covered components against a key. Host-only request binding means authority is covered without method, path, full URL or query coverage; other headers may still be covered. We enforce expiry and a maximum one-day signature lifetime, but do not keep a nonce replay database. A changed unsigned User-Agent can change a declared role without invalidating the signature. Neither local/native differences nor a successful signature establish authorization, benign intent, indexing, citation or human readership.</p>
    <p>Reports can be up to one hour old. The updated time shows when a report was calculated; changing a filter may select a report calculated at a different time.</p>
    <p>Reported referrers describe each page request. Within this blog means an internal referrer was sent; No referrer sent means the header was absent or empty; Unusable referrer means a value was received but could not supply a supported hostname. Unknown — earlier collection covers historical records where those cases were merged. These categories are not a count of first-time arrivals.</p>
    <p>Internal means this publication’s normalized hostname grouping, including its www alias; it is broader than browser same-origin. New origin-only/root referrers have no recorded source path. Historical / sources may mean the homepage or a path removed by referrer policy. Unusable includes unsupported legitimate HTTP forms as well as malformed values.</p>
    <p>Page transitions use recognized public internal paths, with query strings and fragments removed. Select a page to see both previous and next blog pages. Time and traffic filters apply to the request for the destination page. Repeated requests count again; same-page referrals are separate. These observations do not establish complete journeys, exits, or a conversion rate. <a href="https://matomo.org/faq/reports/transitions-analyze-the-previous-and-following-actions-of-your-visitors-for-each-page/">Page-transition prior art</a>.</p>
    <p>Referrers are claims supplied with requests and can be fabricated. Only reviewed hostnames are named here; other names are grouped as Other reported referrers, without treating unfamiliar sources as bots. A pinned Matomo spam list and reviewed local rules exclude matching observations from every public metric, including All; the excluded count is shown for your selection. Referral evidence is retained. These rules also apply to past dates, so reported history can change when the policy changes. An approved name does not prove a genuine referral. <a href="https://github.com/gkoreli/blog/blob/main/docs/adr/0016.6-versioned-referral-policy-and-matomo-source.md">Referral-abuse policy</a>.</p>
    <p>A page view is one recorded page event. Since the August 26, 2026 cutover, that means a successful, non-prefetch GET that served HTML or the Markdown twin of a page at the edge. API requests, assets, redirects, errors, feeds, and other non-page responses do not count. Recording is best effort. Rows marked as mine are excluded from public queries, but that marking depends on server-side configuration and is not currently proven for all of my requests.</p>
    <p>Every row carries a classification and the rule that produced it. Browsers match this site's browser rules. Assistants &amp; signed clients contains declared on-demand fetchers and the historical or unknown-role signed-client fallback. Crawlers contains declared search, AI search/training, SEO/site-audit and link-preview clients. Automation contains hosting-network browsers, headless browsers, HTTP clients, generic bot tokens and older browser claims. Unresolved holds insufficient or conflicting evidence. These five groups are disjoint and add up to All; none is a verified-human partition. Client declarations and verified-key outcomes are separate evidence; neither proves human reading or purpose.</p>
    <p>From October 26, 2026 UTC, a known declared client role is retained even when a signature verifies. ExaUser is an on-demand-fetcher declaration; ExaSearchBot is an AI-search declaration; AhrefsBot and AhrefsSiteAudit are SEO/site-audit crawler declarations. Signing outcomes are reported separately and can overlap these kinds. Reviewed signing origins have public service names; all other origins are grouped as Other and stay private. Assistants &amp; signed clients includes declared on-demand fetchers and signed clients whose role is unknown. Historical classifications remain unchanged. Neither a declared role nor key verification authenticates a request's purpose or human trigger.</p>
    <p>From October 27, 2026 classifier version 2026-10-27.2, new Browser rows require a recognized browser-family product claim, navigation/document Fetch Metadata, an Accept that admits HTML, an Accept-Language, and available network evidence outside the hosting list. This is a descriptive rule, not a human test. Missing network evidence, an unrecognized browser claim, missing or unrecognized Fetch Metadata, and a same-origin claim with an external referrer can yield Unresolved. A network-list nonmatch establishes neither a residential source nor a known operator.</p>
    <p>New named declarations use exact lexical product boundaries and reviewed aliases. All matching names/products and their category agreement are retained separately. Multiple names with one common category retain that declared category without selecting an identity; different categories yield Unresolved. A signature does not resolve an ambiguous declaration. Slackbot-LinkExpanding and Slack-ImgProxy are distinct from general-purpose Slackbot. Earlier Slackbot preview-group rows remain filterable without rewriting them.</p>
    <p>Historical categories retain their original rules: before August 26, 2026, browser beacons; August 26–September 3, User-Agent-only edge classification; September 3 until the new classifier, navigation headers and a hosting-list nonmatch that could include missing network data. Earlier missing Fetch Metadata and old-browser classifications remain in Automation & legacy rules. These version boundaries can change series without traffic changing. The old navigation reason now explicitly describes unlisted or unavailable networks.</p>
    <p>Hosting-list membership remains a local grouping rule, independent of request shape. It does not prove automated operation, and absence from the list does not prove human operation. We deliberately keep known consumer relay/VPN networks outside that list. Fetch Metadata describes request context; its absence is not a universal automation verdict. A client declaration, native assessment or crawler match establishes neither indexing, citation nor human attention.</p>
    <p>A daily client is a per-day pseudonymous identifier, not a person. Edge observations use a secret HMAC over the site, UTC date, IP address, and User-Agent; historical beacon rows use their original daily identifiers. Neither method establishes the same client across dates, devices, or networks. Hourly daily-client values are not additive.</p>
    <p><a href="/privacy">Privacy details</a> · <a href="https://github.com/gkoreli/blog/blob/main/docs/adr/0016-analytics-observation-semantics.md">Engineering decision</a> · <a href="https://github.com/gkoreli/blog/blob/main/docs/adr/0016.2-browser-evidence-and-reader-tier.md">Browser evidence</a> · <a href="https://github.com/gkoreli/blog/blob/main/docs/adr/0016.3-audience-composition-and-citable-articles.md">Audience composition</a></p>
  </aside>
</article>`;
}
