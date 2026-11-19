import { html } from '@nisli/core';
import { dataNote } from '../templates/data-note.js';
import { reportFilters } from '../templates/report-filters.js';
import type { RequestView } from '../lib/stats-views.js';
import { statsHeader } from '../templates/stats-header.js';

export const statsHead = `<link rel="stylesheet" href="/stats.css">
  <script type="module" src="/stats.js"></script>`;

function listSkeleton(rows: number) {
  return Array.from({ length: rows }, () => html`<div class="skeleton skeleton-row"></div>`);
}

function listHeading(label: string) {
  return html`<div class="data-row-head" aria-hidden="true"><span>${label}</span><span>Views</span></div>`;
}

function requestsPanel() {
  return html`<section class="stats-overview" id="stats-activity" aria-label="Traffic overview">
    <div class="stats-totals">
      <div class="stats-primary-total"><span>Page requests</span><strong id="stats-request-count">—</strong></div>
      <div class="stats-average" id="stats-average" hidden></div>
    </div>
    <section class="stats-chart-section" aria-labelledby="stats-chart-heading">
      <div class="stats-chart-heading"><h2 id="stats-chart-heading">Page requests over time</h2><span id="stats-chart-context">Local time · recorded page requests</span></div>
      <div class="stats-chart" id="stats-chart" role="img" aria-label="Loading page views chart">
        <div class="skeleton skeleton-chart"></div>
      </div>
      <p class="stats-client-total"><strong id="stats-client-count">—</strong> client identifiers during this period. Identifiers rotate and can repeat across buckets.</p>
      <details class="stats-chart-data">
        <summary>View chart as a table</summary>
        <div id="stats-chart-table" role="region" aria-label="Chart values; scroll horizontally if needed" tabindex="0"><div class="skeleton skeleton-row"></div></div>
      </details>
      <footer class="stats-report-note"><span id="stats-policy-note"></span> <span id="stats-updated"></span></footer>
    </section>
    </section>`;
}

function pagesPanel() {
  return html`<section class="stats-chapter" id="stats-content" aria-labelledby="stats-content-heading"><header class="data-section-heading"><div><h2 id="stats-content-heading">Pages &amp; sources</h2><p>Where recorded requests went, and the referrers they reported.</p></div></header>
    <section class="stats-section" id="stats-pages">
      <h3>Top pages</h3><div class="data-row-head data-row-head--visitable" aria-hidden="true"><span>Page</span><span>Views</span><span>Visit</span></div>
      <div class="stats-section-results">${listSkeleton(3)}</div>
    </section>
    <div class="stats-panel-grid stats-source-grid"><section class="stats-section" id="stats-referrers">
      <h3>Reported referrers</h3><div class="data-row-head" aria-hidden="true"><span>Reported source</span><span>Views</span></div>
      <div class="stats-section-results">${listSkeleton(2)}</div>
    </section>
    <section class="stats-section" id="stats-transitions">
      <h3>Frequent page transitions</h3>
      ${listHeading('Page transition')}
      <div class="stats-section-results">${listSkeleton(2)}</div>
    </section>
    </div><div class="stats-panel-grid stats-path-grid"><section class="stats-section" id="stats-previous-pages" hidden>
      <h3>Previous blog pages</h3>
      ${listHeading('Previous page')}
      <div class="stats-section-results">${listSkeleton(2)}</div>
    </section>
    <section class="stats-section" id="stats-next-pages" hidden>
      <h3>Next blog pages</h3>
      ${listHeading('Next page')}
      <div class="stats-section-results">${listSkeleton(2)}</div>
    </section>
    </div><p class="stats-transition-details" id="stats-transition-details"></p>
    </section>`;
}

function trafficPanel() {
  return html`<section class="stats-chapter" id="stats-audience" aria-labelledby="stats-audience-heading"><header class="data-section-heading"><div><h2 id="stats-audience-heading">Request signals</h2><p>Traffic categories, software claims and network locations. None identifies a person or physical device.</p></div></header>
    <section class="stats-section" id="stats-traffic-mix"><h3>Traffic mix</h3><div class="stats-distribution" id="stats-distribution" aria-hidden="true"></div><div class="data-row-head" aria-hidden="true"><span>Request category</span><span>Views · share</span></div><div class="stats-section-results">${listSkeleton(5)}</div>
      ${dataNote(html`<p>These five groups add up to the selected total. They describe request signals and declared roles, including agent access.</p>`, 'Five groups, one total')}
    </section>
    <div class="stats-panel-grid stats-device-grid"><section class="stats-client-form-section" id="stats-client-form-section" aria-labelledby="stats-client-form-heading" aria-describedby="stats-claims-note">
      <h3 id="stats-client-form-heading">Device-type claims</h3>
      ${listHeading('Recorded claim')}
      <div class="stats-section-results">${listSkeleton(3)}</div>
      <h4 class="data-facts-label">Record coverage · some facts overlap</h4><dl class="data-facts" id="stats-client-form-coverage" aria-label="Client form record coverage"></dl>
    </section>
    <div class="stats-panel-note" id="stats-claims-note">
      ${dataNote(html`<p>Request headers describe software claims and mobile-experience preferences, not authenticated hardware. Non-mobile does not establish desktop; Android without Mobile does not establish tablet. Missing and conflicting evidence remain explicit.</p><p>Recognized records can span parser profiles. Earlier desktop includes default guesses. Differing indicators can reflect preferences; unsupported hints and earlier heuristics stay separate.</p>`, 'Claims, not hardware')}
    </div>
    <section class="stats-section" id="stats-countries">
      <h3>Top network countries</h3>
      ${listHeading('Network country')}
      <div class="stats-section-results">${listSkeleton(2)}</div>
    </section>
    </div><section class="stats-section" id="stats-declarations">
      <h3>Named crawlers, tools and services</h3>
      <div class="stats-list-heads" aria-hidden="true">${listHeading('Client')}${listHeading('Client')}</div>
      <div class="stats-section-results">${listSkeleton(2)}</div>
      <h4 class="data-facts-label">Name coverage · adds up to the selected total</h4><dl class="data-facts" id="stats-client-name-coverage" aria-label="Catalogue name coverage"></dl>
      ${dataNote(html`<p>Names come from this site’s catalogue of crawlers, tools and services. Browser-family signals are reported separately and do not identify the operator.</p><p>A missing selected name can mean no catalogue match, several competing names, or earlier missing data. It does not identify a person or tell us whether a signer is known. The two coverage counts add up to the selected total.</p>`, 'Names and missing evidence')}
    </section>
    </section>`;
}

function evidencePanel() {
  return html`<section class="stats-chapter" id="stats-evidence" aria-labelledby="stats-evidence-heading"><header class="data-section-heading"><div><h2 id="stats-evidence-heading">Evidence behind the categories</h2><p>Stored classifications, signatures and network checks, with missing and historical evidence kept explicit.</p></div></header>
    <nav class="stats-evidence-index" aria-label="Evidence sections"><a href="#stats-composition">Classification rules</a><a href="#stats-fetch-metadata">Request context</a><a href="#stats-kind-signature">Signatures &amp; names</a><a href="#stats-vendor-network">Network checks</a><a href="#stats-vendor-cache">Cache diagnostics</a><a href="#stats-verification">Verification coverage</a><a href="#stats-native-category">Provider categories</a></nav>
    <section class="stats-section" id="stats-composition">
      <h3>Request classifications</h3>
      <div class="stats-section-results">${listSkeleton(3)}</div>
    </section>
    <section class="stats-section stats-fetch-metadata" id="stats-fetch-metadata">
      <h3>Request context</h3>
      <p class="stats-table-hint">Scroll to compare all columns</p><div class="data-table-region" id="stats-fetch-metadata-rows" role="region" aria-label="Request context table; scroll horizontally if needed" tabindex="0">${listSkeleton(4)}</div>
      <h4 class="data-facts-label">Parsing record coverage</h4><dl class="data-facts" id="stats-fetch-metadata-records" aria-label="Fetch Metadata record coverage"></dl><h4 class="data-facts-label">Activation values</h4><dl class="data-facts" id="stats-fetch-metadata-activation" aria-label="Parsed activation values"></dl>
      ${dataNote(html`<p>Each field uses the same included observations as the headline. Do not add rows together; parameters overlap the state counts.</p><p><strong>Absent:</strong> a recognized record observed no header. <strong>Unassessed:</strong> earlier collection or records this report cannot interpret. <strong>Valid:</strong> parsing succeeded; it does not authenticate a browser or human.</p><p>The browser generation algorithm omits the activation header when false. A true claim does not authenticate a human action.</p>`, 'How to read these fields')}
    </section>
    <section class="stats-section stats-signature-basis" id="stats-kind-signature">
      <h3>Signature evidence by classification</h3>
      <p class="stats-table-hint">Scroll to compare all columns</p><div class="data-table-region" id="stats-kind-signature-rows" role="region" aria-label="Signature evidence table; scroll horizontally if needed" tabindex="0">${listSkeleton(3)}</div>
      ${dataNote(html`<p>Each included observation appears once. Classifications describe declared roles or request rules. A signature covering User-Agent protects the declaration; it does not establish the operator, human involvement or purpose. Select a kind to inspect its vendor and network checks.</p><p>The stored verifier profile shows which implementation produced each result. Current means its identifier matches today's verifier; it does not mean this report reverified the request. Historical profiles can have different checks. Missing profiles, inconsistent records and injected verdicts remain explicit. Each included event appears once across this table.</p>`, 'What a signature establishes')}
    </section>
    <section class="stats-section stats-signature-basis" id="stats-client-evidence">
        <h3>Names, categories &amp; signatures</h3>
        <p class="stats-table-hint">Scroll to compare all columns</p><div class="data-table-region" id="stats-client-evidence-rows" role="region" aria-label="Client names and verification table; scroll horizontally if needed" tabindex="0">${listSkeleton(3)}</div>
      ${dataNote(html`<p>A crawler category can be available while its software name is missing. An unsigned request can match a vendor's published network ranges elsewhere in this report. A selected name is a claim from the request, and a signature authenticates only its covered components. Neither establishes human reading or the initiating party.</p>`, 'Reading the combined evidence')}
    </section>
    <section class="stats-section" id="stats-signers">
      <h3>Stored verified signing outcomes</h3>
      ${listHeading('Stored signer')}
      <div class="stats-section-results">${listSkeleton(2)}</div>
      ${dataNote(html`<p>These counts follow the top-level stored verified flag, including earlier records without proof detail or with inconsistent detailed records. The classification table separates those cases and stored verifier profiles. Reports do not reverify historical requests. A reviewed display name does not establish a request’s role or purpose.</p>`, 'Stored signing history')}
    </section>
    <section class="stats-section" id="stats-verification-outcomes">
      <h3>Unsuccessful verification</h3>
      <div class="stats-section-results">${listSkeleton(3)}</div>
      ${dataNote(html`<p>Consistent stored unsuccessful outcomes distinguish invalid input, unsupported features, unavailable keys and policy rejection. Inconsistent local records appear in the verification panel. Mixed candidate outcomes remain indeterminate. None establishes impersonation or intent.</p>`, 'Unsuccessful does not mean impersonation')}
    </section>
    <section class="stats-section" id="stats-vendor-network">
      <h3>Published network checks</h3>
      <div class="stats-section-results">${listSkeleton(3)}</div>
      ${dataNote(html`<p>Stored checks compare an edge-supplied address with documented vendor ranges. Membership supports network attribution; a nonmatch does not prove impersonation. Outcome counts require a structurally recognized record. </p><p>This report does not cross-check declared names against feed assignments; the offline analyzer does. Declaration counts come from the stored network record. Missing addresses, Worker relay addresses, unavailable feeds, failed revalidation and budget skips stay explicit. Historical outcomes are retained, without fresh address verification. </p><p>Several checked feeds can produce overlapping outcomes. Earlier records remain unknown. <a href="https://github.com/gkoreli/blog/blob/main/packages/analytics/src/vendor-ip-sources.ts" target="_blank" rel="noopener">Configured methods and sources</a>.</p>`, 'Network attribution limits')}
    </section>
    <section class="stats-diagnostics" aria-label="Vendor check diagnostics">
      <p class="stats-diagnostics-title">Why vendor checks were skipped or reused</p>
      <section class="stats-section" id="stats-vendor-cache">
        <h3>Cache diagnostic coverage</h3>
        <div class="stats-section-results">${listSkeleton(3)}</div>
      ${dataNote(html`<p>Each included event appears once as recognized, unrecorded or inconsistent. Recognized records separate no applicable method, guards only and recorded cache access. Old records remain unknown. Known and unknown policy contexts can overlap when several sources apply.</p>`, 'Cache record coverage')}
    </section>
      <section class="stats-section" id="stats-vendor-cache-access">
        <h3>Recorded access paths</h3>
        <div class="stats-section-results">${listSkeleton(3)}</div>
      ${dataNote(html`<p>Counts are events with at least one matching source check. Paths can overlap and are not upstream-request totals. A cooldown stays unassessed; a shared fetch may fail. These facts do not identify a vendor, operator or reader.</p>`, 'Overlapping access paths')}
    </section>
      <section class="stats-section" id="stats-vendor-cache-policy">
        <h3>Last accepted cache policy</h3>
        <div class="stats-section-results">${listSkeleton(3)}</div>
      ${dataNote(html`<p>A cooldown can carry the last accepted policy context without a membership snapshot. Positive and blocked intervals refer to that validation, not freshness now. Sources and blockers overlap; do not add these counts. Failure without accepted context remains unknown. <a href="https://www.rfc-editor.org/rfc/rfc9111.html#section-5.2.2" target="_blank" rel="noopener">HTTP cache directives</a>.</p>`, 'Policy context, not current freshness')}
    </section>
    </section>

    <section class="stats-section" id="stats-vendor-signatures">
      <h3>Declared vendor checks</h3>
      <div class="stats-section-results">${listSkeleton(3)}</div>
      ${dataNote(html`<p>Stored method assessments use their recorded declaration map. The current map covers ExaSearchBot, ExaUser, Google-Agent, ShapBot and Shap-User using documented signing origins; the two Parallel declarations name distinct origins. Inconsistent method records remain separate. </p><p>Google’s rollout is experimental; unsigned does not mean impersonation. Conflicting declared origins stay visible even when the selected proof matches one. A matching key does not bind an unsigned User-Agent, identify the initiating user or prevent replay. Counts overlap; declarations outside the recorded map remain unmapped. IP checks are separate; no DNS verification is performed here.</p>`, 'Declared signing methods')}
    </section>
    <section class="stats-section" id="stats-verification">
      <h3>Signature verification</h3>
      <div class="stats-section-results">${listSkeleton(3)}</div>
      ${dataNote(html`<p>Consistent stored local results and Cloudflare assessments are separate. Missing and inconsistent records remain explicit. Coverage facts require typed detail consistent with the verifier’s output invariants; their counts overlap. </p><p>Native availability means at least one stored boolean is usable; each field has its own available, true and false counts. A missing signed-agent value is not false. Native booleans are assessed in a recognized envelope independently of the local result; an unrecognized envelope contributes neither field. Known-bot recognition is broader than signed-agent recognition, so local verification with native verified-bot false is not cryptographic disagreement. None establishes a human trigger. </p><p>Selection counts describe detailed locally verified events, not signer totals. Outcome-only signing history remains in the classification table above. Verification stops at the first valid paired candidate tagged Web Bot Auth; other candidates can remain unassessed. Historical absence and unrecognized assessments stay separate.</p>`, 'Coverage and unknowns')}
    </section>
    <section class="stats-section" id="stats-directory-publication">
      <h3>Published key directories</h3>
      ${listHeading('Directory assessment')}
      <div class="stats-section-results">${listSkeleton(3)}</div>
      ${dataNote(html`<p>The reviewed key-directory map includes first-party endpoints for Exa, Ahrefs, Google and Parallel. This assessment compares the locally verified key publisher with the declared client's reviewed endpoint; it does not establish a per-client signing promise or authenticate an unsigned User-Agent. Conflicting publishers, partial mappings and missing history stay separate. Historical assessments keep their recorded profile. Each included event appears once. <a href="https://github.com/gkoreli/blog/blob/main/packages/analytics/src/directory-publication.ts" target="_blank" rel="noopener">Reviewed endpoints and sources</a>.</p>`, 'What the directory check means')}
    </section>
    <section class="stats-section stats-signature-basis" id="stats-native-category">
      <h3>Cloudflare categories by classification</h3>
      <div class="data-table-region" id="stats-native-category-rows" role="region" aria-label="Provider category evidence; scroll horizontally if needed" tabindex="0">${listSkeleton(3)}</div>
      ${dataNote(html`<p>Categories can be available without native verification booleans. They are Cloudflare’s classification, not our signature verdict or proof of a human trigger. Empty, unavailable and earlier unrecorded values stay distinct. Each included event appears once.</p>`, 'Provider categories are separate evidence')}
    </section>
    </section>`;
}

const panels = { requests: requestsPanel, pages: pagesPanel, traffic: trafficPanel, evidence: evidencePanel };

export function statsPage(pages: readonly { path: string; title: string }[] = [], view: RequestView = 'requests') {
  const catalogue = [{ path: '/', title: 'Homepage' }, { path: '/about', title: 'About' }, { path: '/tools', title: 'Engineering tools' }, { path: '/engineering', title: 'Engineering' }, { path: '/essays', title: 'Essays' }, { path: '/stats', title: 'Stats' }, ...pages];
  return html`<article class="stats-page" data-request-view=${view}>
  ${statsHeader(view)}
  <section id="stats-page-requests" aria-label="Page requests">
  ${reportFilters('stats')}
  <p class="stats-status" id="stats-status" role="status" aria-atomic="true">Loading stats…</p>
  <div class="stats-loading" id="stats-loading" aria-hidden="true"><div class="stats-loading-metrics"><div class="skeleton"></div><div class="skeleton"></div></div><div class="skeleton stats-loading-chart"></div></div>
  <noscript><style>.stats-loading,.stats-status,#stats-dashboard{display:none}</style><p>JavaScript loads this interactive report. <a href="/api/stats?range=30d&amp;traffic=all">Read the 30-day report as JSON</a>, or read <a href="/stats/method">how requests are counted</a>.</p></noscript>
  <p class="stats-scope" id="stats-scope" hidden></p>
  <div id="stats-page-catalogue" hidden>${(view === 'pages' ? catalogue : []).map(page => html`<a href=${page.path}>${page.title}</a>`)}</div>
  <div class="stats-period" id="stats-period" hidden></div>
  <div id="stats-dashboard" aria-busy="true">
    ${panels[view]()}
  </div>
  </section></article>`;
}
