import { html, raw } from '@nisli/core';
import { metricTileHtml } from '../lib/data-display.js';
import { TRAFFIC_LABELS, TRAFFIC_GROUPS } from '../lib/stats-presentation.js';

export const statsHead = `<link rel="stylesheet" href="/stats.css">
  <script type="module" src="/stats.js"></script>`;

function listSkeleton(rows: number) {
  return Array.from({ length: rows }, () => html`<div class="skeleton skeleton-row"></div>`);
}

export function statsPage() {
  return html`<article class="stats-page">
  <header class="stats-header">
    <div><p class="stats-kicker">Public analytics</p><h1>Stats</h1><p class="stats-intro">Page requests from people, agents and crawlers.</p></div>
    <nav class="stats-header-links" aria-label="Related reports"><a href="/stats/readership">Article reach</a><a id="stats-json-link" href="/api/stats?range=30d&amp;traffic=all">Report JSON</a></nav>
  </header>
  <nav class="stats-navigation" aria-label="Stats sections"><a href="#stats-activity">Activity</a><a href="#stats-content">Pages &amp; sources</a><a href="#stats-audience">Request signals</a><a href="#stats-evidence">Evidence</a><a href="#stats-methodology">Method</a></nav>
  <div class="stats-controls" aria-label="Stats filters">
    <div class="stats-traffic-control"><label for="stats-traffic">Traffic</label><select id="stats-traffic" name="traffic" aria-describedby="stats-traffic-help"><option value="all">${TRAFFIC_LABELS.all}</option>${TRAFFIC_GROUPS.map(group => html`<option value=${group}>${TRAFFIC_LABELS[group]}</option>`)}</select><p id="stats-traffic-help">Categories describe request signals, not verified people.</p></div>
    <fieldset class="stats-filter" data-filter-group="period"><legend>Period</legend><div class="stats-pills"><button type="button" data-days="7" aria-pressed="false">7 days</button><button type="button" data-days="30" aria-pressed="true">30 days</button><button type="button" data-days="90" aria-pressed="false">90 days</button><button type="button" data-days="0" aria-pressed="false">All time</button></div></fieldset>
  </div>
  <p class="stats-status" id="stats-status" role="status" aria-atomic="true">Loading stats…</p>
  <noscript><p>JavaScript loads this interactive report. <a href="/api/stats?range=30d&amp;traffic=all">Read the 30-day report as JSON</a>, or use the measurement notes below.</p></noscript>
  <div class="stats-period" id="stats-period" hidden></div>
  <p class="stats-scope" id="stats-scope" hidden></p>
  <div id="stats-dashboard" aria-busy="true">
    <div class="data-metrics stats-totals" id="stats-totals" html:inner=${raw([
      metricTileHtml({label:'Page views',value:null,detail:'Recorded page requests'}),
      metricTileHtml({label:'Daily clients',value:null,detail:'Per-day identifiers, not people'}),
    ].join(''))}></div>
    <section class="stats-chart-section" id="stats-activity" aria-labelledby="stats-chart-heading">
      <div class="stats-chart-heading"><h2 id="stats-chart-heading">Page views over time</h2><span id="stats-chart-context">UTC · recorded page requests</span></div>
      <div class="stats-chart" id="stats-chart" role="img" aria-label="Loading page views chart">
        <div class="skeleton skeleton-chart"></div>
      </div>
      <details class="stats-chart-data">
        <summary>View chart as a table</summary>
        <div id="stats-chart-table"><div class="skeleton skeleton-row"></div></div>
      </details>
    </section>
    <section class="stats-chapter" id="stats-content" aria-labelledby="stats-content-heading"><header class="data-section-heading"><span class="data-section-number" aria-hidden="true">01</span><div><h2 id="stats-content-heading">Pages &amp; sources</h2><p>Where recorded requests went, and the referrers they reported.</p></div></header>
<div class="stats-grid">
    <section class="stats-section" id="stats-pages">
      <h3>Top pages <span>by views</span></h3>
      ${listSkeleton(3)}
    </section>
    <section class="stats-section" id="stats-referrers">
      <h3>Reported referrers <span>by views</span></h3>
      ${listSkeleton(2)}
    </section>
</div>
    <section class="stats-section" id="stats-transitions">
      <h3>Between blog pages <span>reported transitions</span></h3>
      ${listSkeleton(2)}
    </section>
    <section class="stats-section" id="stats-previous-pages" hidden>
      <h3>Previous blog pages <span>reported transitions</span></h3>
      ${listSkeleton(2)}
    </section>
    <section class="stats-section" id="stats-next-pages" hidden>
      <h3>Next blog pages <span>reported transitions</span></h3>
      ${listSkeleton(2)}
    </section>
<p class="stats-transition-details" id="stats-transition-details"></p>
    </section>
    <section class="stats-chapter" id="stats-audience" aria-labelledby="stats-audience-heading"><header class="data-section-heading"><span class="data-section-number" aria-hidden="true">02</span><div><h2 id="stats-audience-heading">Request signals</h2><p>Traffic categories, software claims and network locations. None identifies a person or physical device.</p></div></header>
    <section class="stats-section" id="stats-traffic-mix"><h3>Traffic mix <span>selected requests</span></h3><p class="stats-section-note">These five groups add up to the selected total. They describe request signals and declared roles, including agent access.</p>${listSkeleton(5)}</section>
<div class="stats-grid">
    <section class="stats-client-form-section" id="stats-client-form-section" aria-labelledby="stats-client-form-heading">
      <h3 id="stats-client-form-heading">Client form claims <span>selected traffic</span></h3>
      <p class="stats-section-note">These are User-Agent markers and mobile-experience preferences, not authenticated hardware. Non-mobile does not establish desktop; Android without Mobile does not establish tablet. Missing/conflicting evidence and earlier heuristics remain explicit.</p>
      ${listSkeleton(3)}
    </section>
    <section class="stats-section" id="stats-countries">
      <h3>Countries <span>by views</span></h3>
      ${listSkeleton(2)}
    </section>
</div>
    <section class="stats-section" id="stats-declarations">
      <h3>Named crawlers, tools and services</h3>
      <p class="stats-section-note" id="stats-client-name-coverage">Names come from this site's catalogue of client claims. Browser-family signals are reported separately and do not identify the operator.</p>
      ${listSkeleton(2)}
    </section>
    </section>
    <section class="stats-chapter" id="stats-evidence" aria-labelledby="stats-evidence-heading"><header class="data-section-heading"><span class="data-section-number" aria-hidden="true">03</span><div><h2 id="stats-evidence-heading">Evidence behind the categories</h2><p>Stored classifications, signatures and network checks, with missing and historical evidence kept explicit.</p></div></header>
    <section class="stats-section" id="stats-composition">
      <h3>Request classifications <span>by kind and reason</span></h3>
      ${listSkeleton(3)}
    </section>
    <section class="stats-section stats-fetch-metadata" id="stats-fetch-metadata">
      <h3>Request context <span>stored Fetch Metadata parsing</span></h3>
      <p class="stats-section-note">Every field uses the headline’s included observations; do not add rows together. Absent means a recognized record observed no header. Unassessed includes earlier collection or records this report cannot interpret. Valid describes parsing; it does not authenticate a browser or human. Parameters overlap the state counts.</p>
      <p class="stats-section-note" id="stats-fetch-metadata-records"></p>
      <div id="stats-fetch-metadata-rows" role="region" aria-label="Request context table; scroll horizontally if needed" tabindex="0">${listSkeleton(4)}</div>
      <p class="stats-section-note" id="stats-fetch-metadata-activation"></p>
    </section>
    <section class="stats-section stats-signature-basis" id="stats-kind-signature">
      <h3>Signature evidence by classification</h3>
      <p class="stats-section-note">Each included observation appears once. Classifications describe declared roles or request rules. A signature covering User-Agent protects the declaration; it does not establish the operator, human involvement or purpose. Select a kind to inspect its vendor and network checks.</p>
      <div id="stats-kind-signature-rows" role="region" aria-label="Signature evidence table; scroll horizontally if needed" tabindex="0">${listSkeleton(3)}</div>
      <p class="stats-section-note">The stored verifier profile shows which implementation produced each result. Current means its identifier matches today's verifier; it does not mean this report reverified the request. Historical profiles can have different checks. Missing profiles, inconsistent records and injected verdicts remain explicit. Each included event appears once across this table.</p>
    </section>
    <section class="stats-section stats-signature-basis" id="stats-client-evidence">
        <h3>What we know about the same requests</h3>
        <p class="stats-section-note">A crawler category can be available while its software name is missing. An unsigned request can match a vendor's published network ranges elsewhere in this report. A selected name is a claim from the request, and a signature authenticates only its covered components. Neither establishes human reading or the initiating party.</p>
        <div id="stats-client-evidence-rows" role="region" aria-label="Client names and verification table; scroll horizontally if needed" tabindex="0">${listSkeleton(3)}</div>
      </section>
    <section class="stats-section" id="stats-signers">
      <h3>Stored verified signing outcomes <span>reviewed names</span></h3>
      <p class="stats-section-note">These counts follow the top-level stored verified flag, including earlier records without proof detail or with inconsistent detailed records. The classification table separates those cases and stored verifier profiles. Reports do not reverify historical requests. A reviewed display name does not establish a request’s role or purpose.</p>
      ${listSkeleton(2)}
    </section>
    <section class="stats-section" id="stats-verification-outcomes">
      <h3>Unsuccessful verification <span>local profile outcomes</span></h3>
      <p class="stats-section-note">Consistent stored unsuccessful outcomes distinguish invalid input, unsupported features, unavailable keys and policy rejection. Inconsistent local records appear in the verification panel. Mixed candidate outcomes remain indeterminate. None establishes impersonation or intent.</p>
      ${listSkeleton(3)}
    </section>
    <section class="stats-section" id="stats-vendor-network">
      <h3>Published network checks <span>vendor IP feeds</span></h3>
      <p class="stats-section-note">Stored checks compare an edge-supplied address with documented vendor ranges. Membership supports network attribution; a nonmatch does not prove impersonation. Outcome counts require a structurally recognized record. This report does not cross-check declared names against feed assignments; the offline analyzer does. Declaration counts come from the stored network record. Missing addresses, Worker relay addresses, unavailable feeds, failed revalidation and budget skips stay explicit. Historical outcomes are retained, without fresh address verification. Several checked feeds can produce overlapping outcomes. Earlier records remain unknown. <a href="https://github.com/gkoreli/blog/blob/main/packages/analytics/src/vendor-ip-sources.ts" target="_blank" rel="noopener">Configured methods and sources</a>.</p>
      ${listSkeleton(3)}
    </section>
    <details class="stats-cache-details">
      <summary>Why vendor checks were skipped or reused</summary>
      <section class="stats-section" id="stats-vendor-cache">
        <h3>Cache diagnostic coverage</h3>
        <p class="stats-section-note">Each included event appears once as recognized, unrecorded or inconsistent. Recognized records separate no applicable method, guards only and recorded cache access. Old records remain unknown. Known and unknown policy contexts can overlap when several sources apply.</p>
        ${listSkeleton(3)}
      </section>
      <section class="stats-section" id="stats-vendor-cache-access">
        <h3>Recorded access paths</h3>
        <p class="stats-section-note">Counts are events with at least one matching source check. Paths can overlap and are not upstream-request totals. A cooldown stays unassessed; a shared fetch may fail. These facts do not identify a vendor, operator or reader.</p>
        ${listSkeleton(3)}
      </section>
      <section class="stats-section" id="stats-vendor-cache-policy">
        <h3>Last accepted cache policy</h3>
        <p class="stats-section-note">A cooldown can carry the last accepted policy context without a membership snapshot. Positive and blocked intervals refer to that validation, not freshness now. Sources and blockers overlap; do not add these counts. Failure without accepted context remains unknown. <a href="https://www.rfc-editor.org/rfc/rfc9111.html#section-5.2.2" target="_blank" rel="noopener">HTTP cache directives</a>.</p>
        ${listSkeleton(3)}
      </section>
    </details>

    <section class="stats-section" id="stats-vendor-signatures">
      <h3>Declared vendor checks <span>documented signing origins</span></h3>
      <p class="stats-section-note">Stored method assessments use their recorded declaration map. The current map covers ExaSearchBot, ExaUser, Google-Agent, ShapBot and Shap-User using documented signing origins; the two Parallel declarations name distinct origins. Inconsistent method records remain separate. Google’s rollout is experimental; unsigned does not mean impersonation. Conflicting declared origins stay visible even when the selected proof matches one. A matching key does not bind an unsigned User-Agent, identify the initiating user or prevent replay. Counts overlap; declarations outside the recorded map remain unmapped. IP checks are separate; no DNS verification is performed here.</p>
      ${listSkeleton(3)}
    </section>
    <section class="stats-section" id="stats-verification">
      <h3>Signature verification <span>coverage and availability</span></h3>
      <p class="stats-section-note">Consistent stored local results and Cloudflare assessments are separate. Missing and inconsistent records remain explicit. Coverage facts require typed detail consistent with the verifier’s output invariants; their counts overlap. Native availability means at least one stored boolean is usable; each field has its own available, true and false counts. A missing signed-agent value is not false. Native booleans are assessed in a recognized envelope independently of the local result; an unrecognized envelope contributes neither field. Known-bot recognition is broader than signed-agent recognition, so local verification with native verified-bot false is not cryptographic disagreement. None establishes a human trigger. Selection counts describe detailed locally verified events, not signer totals. Outcome-only signing history remains in the classification table above. Verification stops at the first valid paired candidate tagged Web Bot Auth; other candidates can remain unassessed. Historical absence and unrecognized assessments stay separate.</p>
      ${listSkeleton(3)}
    </section>
    <section class="stats-section" id="stats-directory-publication">
      <h3>Published key directories <span>reviewed publisher origins</span></h3>
      <p class="stats-section-note">The reviewed key-directory map includes first-party endpoints for Exa, Ahrefs, Google and Parallel. This assessment compares the locally verified key publisher with the declared client's reviewed endpoint; it does not establish a per-client signing promise or authenticate an unsigned User-Agent. Conflicting publishers, partial mappings and missing history stay separate. Historical assessments keep their recorded profile. Each included event appears once. <a href="https://github.com/gkoreli/blog/blob/main/packages/analytics/src/directory-publication.ts" target="_blank" rel="noopener">Reviewed endpoints and sources</a>.</p>
      ${listSkeleton(3)}
    </section>
    <section class="stats-section stats-signature-basis" id="stats-native-category">
      <h3>Cloudflare categories by classification</h3>
      <p class="stats-section-note">Categories can be available without native verification booleans. They are Cloudflare’s classification, not our signature verdict or proof of a human trigger. Empty, unavailable and earlier unrecorded values stay distinct. Each included event appears once.</p>
      <div id="stats-native-category-rows">${listSkeleton(3)}</div>
    </section>
    </section>
  </div>

  <aside class="stats-methodology" id="stats-methodology" aria-labelledby="stats-methodology-heading">
    <h2 id="stats-methodology-heading">What these numbers mean</h2>
    <p>People and agents are part of this publication’s audience. All includes every recorded request category. Browser signals can come from browsers, automated clients or relays; they do not identify people.</p>
    <p>From October 27, 2026 UTC, new observations retain derived local signature coverage and any available native verified-bot/signed-agent booleans. Earlier rows have no such record. Unavailable native fields remain unknown, not false. A verified signature authenticates only covered components against a key. Host-only request binding means authority is covered without method, path, full URL or query coverage; other headers may still be covered. We enforce expiry and a maximum one-day signature lifetime, but do not keep a nonce replay database. A changed unsigned User-Agent can change a declared role without invalidating the signature. Neither local/native differences nor a successful signature establish authorization, benign intent, indexing, citation or human readership.</p>
    <p>Later October 27 observations also retain Cloudflare’s category using a reviewed vocabulary. Empty, unavailable, unrecognized and earlier unrecorded values stay distinct. A category does not establish which native verification method ran. The <a href="https://developers.cloudflare.com/ruleset-engine/rules-language/fields/reference/cf.bot_management.signed_agent/">native signed-agent boolean requires Enterprise Bot Management</a>; Workers Paid does not establish that entitlement.</p>
    <p>Reports can be up to one hour old. The updated time shows when a report was calculated; changing a filter may select a report calculated at a different time.</p>
    <p>Reported referrers describe each page request. Within this blog means an internal referrer was sent; No referrer sent means the header was absent or empty; Unusable referrer means a value was received but could not supply a supported hostname. Unknown — earlier collection covers historical records where those cases were merged. These categories are not a count of first-time arrivals.</p>
    <p>Internal means this publication’s normalized hostname grouping, including its www alias; it is broader than browser same-origin. New origin-only/root referrers have no recorded source path. Historical / sources may mean the homepage or a path removed by referrer policy. Unusable includes unsupported legitimate HTTP forms as well as malformed values.</p>
    <p>Page transitions use recognized public internal paths, with query strings and fragments removed. Select a page to see both previous and next blog pages. Time and traffic filters apply to the request for the destination page. Repeated requests count again; same-page referrals are separate. These observations do not establish complete journeys, exits, or a conversion rate. <a href="https://matomo.org/faq/reports/transitions-analyze-the-previous-and-following-actions-of-your-visitors-for-each-page/">Page-transition prior art</a>.</p>
    <p>Referrers are claims supplied with requests and can be fabricated. Only reviewed hostnames are named here; other names are grouped as Other reported referrers, without treating unfamiliar sources as bots. A pinned Matomo spam list and reviewed local rules exclude matching observations from every public metric, including All; the excluded count is shown for your selection. Referral evidence is retained. These rules also apply to past dates, so reported history can change when the policy changes. An approved name does not prove a genuine referral. <a href="https://github.com/gkoreli/blog/blob/main/docs/adr/0016.6-versioned-referral-policy-and-matomo-source.md">Referral-abuse policy</a>.</p>
    <p>A page view is one recorded page event. Since the August 26, 2026 cutover, that means a successful, non-prefetch GET that served HTML or the Markdown twin of a page at the edge. API requests, assets, redirects, errors, feeds, and other non-page responses do not count. Recording is best effort. Rows marked as mine are excluded from public queries, but that marking depends on server-side configuration and is not currently proven for all of my requests.</p>
    <p>Reports use stored classifications and their reasons. Browser signals match this site's stored browser rules; controlled curl requests have matched them too. Assistants &amp; signed clients contains declared on-demand fetchers and the historical or unknown-role signed-client fallback. Crawlers contains declared search, AI-related crawling (including application indexing and training), SEO/site-audit and link-preview clients. Automation contains hosting-network browsers, headless browsers, HTTP clients, generic bot tokens and older browser claims. Unresolved also includes missing or unrecognized stored classifications, with that provenance shown explicitly. A known classification with a missing or empty reason stays in its kind and is labelled accordingly. These five groups are disjoint and add up to All; none is a verified-human partition. The composition must reconcile with the headline. Client declarations and verified-key outcomes are separate evidence; neither proves human reading or purpose.</p>
    <p>From October 26, 2026 UTC, a known declared client role is retained even when a signature verifies. ExaUser is an on-demand-fetcher declaration; ExaSearchBot is an AI-search declaration; AhrefsBot and AhrefsSiteAudit are SEO/site-audit crawler declarations. Signing outcomes are reported separately and can overlap these kinds. Reviewed signing origins have public service names; all other origins are grouped as Other and stay private. Assistants &amp; signed clients includes declared on-demand fetchers and signed clients whose role is unknown. Stored historical values remain unchanged; missing and unrecognized kinds are projected into Unresolved for reporting. The signature/provider tables keep their separate missing-kind marker. Neither a declared role nor key verification authenticates a request's purpose or human trigger.</p>
    <p>From October 27, 2026 classifier version 2026-10-27.2, new rows labelled Browser signals require a recognized browser-family product claim, navigation/document Fetch Metadata, an Accept that admits HTML, an Accept-Language, and available network evidence outside the hosting list. This rule describes matched signals and does not authenticate an engine or operator. From October 29, parsing preserves case and distinguishes absent, invalid, unrecognized and over-budget fields; valid Item parameters are accepted. Earlier records remain unassessed in the parsing table. Missing network evidence, an unrecognized browser claim, missing or unrecognized Fetch Metadata, and a same-origin claim with an external referrer can yield Unresolved. A network-list nonmatch establishes neither a residential source nor a known operator.</p>
    <p>New named declarations use exact lexical product boundaries and reviewed aliases. All matching names/products and their category agreement are retained separately. Multiple names with one common category retain that declared category without selecting an identity; different categories yield Unresolved. A signature does not resolve an ambiguous declaration. Slackbot-LinkExpanding and Slack-ImgProxy are distinct from general-purpose Slackbot. Earlier Slackbot preview-group rows remain filterable without rewriting them.</p>
    <p>Historical categories retain their original rules: before August 26, 2026, browser beacons; August 26–September 3, User-Agent-only edge classification; September 3 until the new classifier, navigation headers and a hosting-list nonmatch that could include missing network data. Earlier missing Fetch Metadata and old-browser classifications remain in Automation & legacy rules. These version boundaries can change series without traffic changing. The old navigation reason now explicitly describes unlisted or unavailable networks.</p>
    <p>Hosting-list membership remains a local grouping rule, independent of request shape. It does not prove automated operation, and absence from the list does not prove human operation. We deliberately keep known consumer relay/VPN networks outside that list. Fetch Metadata describes request context; its absence is not a universal automation verdict. A client declaration, native assessment or crawler match establishes neither indexing, citation nor human attention.</p>
    <p>A daily client is a per-day pseudonymous identifier, not a person. Edge observations use a secret HMAC over the site, UTC date, IP address, and User-Agent; historical beacon rows use their original daily identifiers. Neither method establishes the same client across dates, devices, or networks. Hourly daily-client values are not additive.</p>
    <p><a href="/privacy">Privacy details</a> · <a href="https://github.com/gkoreli/blog/blob/main/docs/adr/0016-analytics-observation-semantics.md">Engineering decision</a> · <a href="https://github.com/gkoreli/blog/blob/main/docs/adr/0016.2-browser-evidence-and-reader-tier.md">Browser evidence</a> · <a href="https://github.com/gkoreli/blog/blob/main/docs/adr/0016.3-audience-composition-and-citable-articles.md">Audience composition</a></p>
  </aside>
  </article>`;
}
