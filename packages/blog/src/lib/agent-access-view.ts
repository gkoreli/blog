import {
  accessDayCount, AGENT_ROLE_LABELS,
  type AgentAccessClient, type AgentAccessFormat, type AgentAccessMetrics,
} from '@gkoreli/analytics/agent-access-contract';
import type { AgentAccessExploration } from '@gkoreli/analytics/agent-access-explorer';
import { SIGNATURE_BASIS_LABELS } from '@gkoreli/analytics/signature-basis';
import { dataFactsHtml, groupedEvidenceTableHtml, metricTileHtml } from './data-display.js';
import { addCalendarDays, timePresentation } from '@gkoreli/time';
import { localTimeHtml } from './local-time.js';
import { tableRegionHtml } from './reading-display.js';

const number = (value: number) => value.toLocaleString('en-US');
const signed = (value: number) => value === 0 ? '0' : `${value > 0 ? '+' : '−'}${number(Math.abs(value))}`;
const ENTITIES: Readonly<Record<string, string>> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escape = (value: string) => value.replace(/[&<>"']/g, character => ENTITIES[character] ?? character);
export function agentClientLabel(client: AgentAccessClient): string {
  return client === 'not-recorded' ? 'No selected client name' : client === 'unrecognized' ? 'Unrecognized stored name' : client;
}
const FORMAT_LABELS: Record<AgentAccessFormat, string> = { html: 'HTML', markdown: 'Markdown', 'not-recorded': 'Format not recorded', unrecognized: 'Unrecognized format' };
function table(label: string, headings: string[], rows: string): string {
  return `<div class="agent-access-table">${tableRegionHtml(label, `<table><caption>${escape(label)}</caption><thead><tr>${headings.map(heading => `<th scope="col">${escape(heading)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`, !rows.includes('colspan='))}</div>`;
}
function metricsRow(label: string, metrics: AgentAccessMetrics, control = escape(label)): string {
  return `<tr><th scope="row">${control}</th><td>${number(metrics.views)}</td><td>${number(accessDayCount(metrics.dayMask))}</td></tr>`;
}
export function agentAccessSelectionLabel(view: AgentAccessExploration): string {
  return [view.article?.title ?? 'All articles and site resources', view.selection.client === null ? 'All client declarations' : agentClientLabel(view.selection.client), view.selection.kind === null ? 'All roles' : AGENT_ROLE_LABELS[view.selection.kind]].join(' · ');
}

type AccessComparison = AgentAccessExploration['comparison'];
type ChangeRow = AccessComparison['clients'][number] | AccessComparison['resources'][number];
const MEASUREMENT_LABELS: Record<AccessComparison['measurement']['status'], string> = {
  'one-profile': 'One recorded measurement profile across both weeks',
  'multiple-profiles': 'Multiple measurement profiles across these weeks',
  incomplete: 'Some measurement stamps are missing or unrecognized',
  'empty-week': 'One week has no retained events for profile comparison',
};

function changeLabel(row: ChangeRow): string {
  if (row.kind === 'other') return `Other ${row.direction}s (${number(row.count)})`;
  if (typeof row.key === 'string') return `<button type="button" data-agent-client="${escape(row.key)}">${escape(agentClientLabel(row.key))}</button>`;
  if (row.key === null) return 'Unregistered resources';
  const { role, title, id } = row.key;
  const label = escape(title);
  return role === 'article' ? `<button type="button" data-agent-article="${escape(id)}">${label}</button>` : label;
}

function changeTable(label: string, heading: string, entries: readonly ChangeRow[]): string {
  if (entries.length === 0) return `<h4>${escape(label)}</h4><p class="agent-access-note">Each ${escape(heading.toLowerCase())} has the same count in both weeks.</p>`;
  return table(label, [heading, 'Previous', 'Latest', 'Change'], entries.map(row =>
    `<tr><th scope="row">${changeLabel(row)}</th><td>${number(row.previous)}</td><td>${number(row.latest)}</td><td>${signed(row.change)}</td></tr>`
  ).join(''));
}

function weeklyComparisonHtml(comparison: AccessComparison, time: ReturnType<typeof timePresentation>): string {
  const dates = (week: AccessComparison['latest']) => escape(`${time.calendarDate(week.start)} – ${time.calendarDate(addCalendarDays(week.endExclusive, -1))}`);
  const { previous, latest, change, clients, resources, measurement } = comparison;
  const weeks = `<dl class="agent-comparison-totals">
    <div><dt>Previous</dt><dd>${number(previous.views)}<small>${dates(previous)}</small></dd></div>
    <div><dt>Latest</dt><dd>${number(latest.views)}<small>${dates(latest)}</small></dd></div>
    <div><dt>Change</dt><dd>${signed(change)}<small>Recorded page events</small></dd></div>
  </dl>`;
  const profileRows = measurement.profiles.map(row => `<tr><th scope="row" class="agent-comparison-stamps">
    <span>Collection <code>${escape(row.collection ?? 'Not recorded')}</code></span>
    <span>Classifier <code>${escape(row.classifier ?? 'Not recorded')}</code></span>
    <span>Source ${escape(row.source)}</span>
  </th><td>${number(row.previous)}</td><td>${number(row.latest)}</td></tr>`).join('');
  const profiles = profileRows ? `<details class="agent-comparison-profiles"><summary>${MEASUREMENT_LABELS[measurement.status]}</summary>
    ${table('Recorded profile counts', ['Profile', 'Previous', 'Latest'], profileRows)}
    <p class="agent-access-note">Stamp counts describe the rules recorded on these events. Collection coverage and detector accuracy require separate checks.</p></details>` : '';
  const breakdowns = previous.views === 0 && latest.views === 0
    ? '<p class="agent-access-note">No retained dated events in these two weeks.</p>'
    : `${profiles}<div class="stats-panel-grid agent-comparison-breakdowns">
      <div>${changeTable('By client declaration', 'Client', clients)}</div>
      <div>${changeTable('By resource', 'Resource', resources)}</div>
    </div><p class="agent-access-note">The tables show the three largest increases and decreases for each breakdown. Other changes are grouped by direction. Each table accounts for the same overall change.</p>`;

  return `<section class="stats-section agent-access-comparison" aria-labelledby="agent-access-change-heading"><h3 id="agent-access-change-heading">Weekly change</h3>
    <p class="agent-access-note">Latest seven completed UTC days compared with the preceding seven, for this selection.</p>${weeks}${breakdowns}
  </section>`;
}

/** The package owns the read model; this boundary only labels and escapes it. */
export function agentAccessViewHtml(view: AgentAccessExploration, time = timePresentation()) {
  const { scope, accounting } = view.window;
  const period = `${time.calendarDate(scope.start)} – ${time.calendarDate(addCalendarDays(scope.endExclusive, -1))} · UTC reporting days`;
  const tiles = [
    { label: 'Page events', value: number(view.metrics.views), detail: 'In the selected article, client and role scope' },
    { label: 'Articles accessed', value: number(view.articlesAccessed), detail: 'Registered articles with retained events' },
    { label: 'Active UTC days', value: number(accessDayCount(view.metrics.dayMask)), detail: 'Union of recorded days, out of 28' },
    { label: 'Markdown events', value: number(view.markdownEvents), detail: 'Served format; preference not established' },
  ].map(metricTileHtml).join('');
  const overview = `<p class="agent-access-period">${escape(period)}<br><span>Calculated ${localTimeHtml(scope.calculatedAt, time)}</span></p><div class="agent-access-metrics">${tiles}</div>`;
  const roleRows = view.roles.map(row => metricsRow(AGENT_ROLE_LABELS[row.kind], row.metrics)).join('');
  const formatRows = view.formats.map(row => metricsRow(FORMAT_LABELS[row.format], row.metrics)).join('');
  const articleRows = view.articles.map(row => `<tr><th scope="row"><button type="button" class="agent-resource-choice" data-agent-article="${escape(row.resource.id)}"><span>${escape(row.resource.title)}</span><small>${escape(row.resource.path)}</small></button></th><td>${number(row.metrics.views)}</td><td>${number(accessDayCount(row.metrics.dayMask))}</td><td><a class="agent-access-visit" href="${escape(row.resource.path)}" aria-label="Visit ${escape(row.resource.title)}"><span class="ui-icon" aria-hidden="true" style="--ui-icon-image:url('/icons/posts.svg')"></span><span>Visit</span></a></td></tr>`).join('');
  const clientRows = view.clients.map(row => metricsRow(agentClientLabel(row.client), row.metrics,
    `<button type="button" data-agent-client="${escape(row.client)}">${escape(agentClientLabel(row.client))}</button>`)).join('');
  const maximumWeek = Math.max(...view.metrics.weeks);
  const weeks = view.metrics.weeks.map((views, index) => {
    const start = addCalendarDays(scope.start, index * 7), end = addCalendarDays(start, 6), previous = view.metrics.weeks[index - 1];
    const difference = previous === undefined ? '—' : signed(views - previous);
    return `<tr><th scope="row">${escape(time.calendarDate(start))} – ${escape(time.calendarDate(end))}</th><td>${number(views)}<span class="agent-week-meter" aria-hidden="true"><span style="width:${maximumWeek === 0 ? 0 : views / maximumWeek * 100}%"></span></span></td><td>${difference}</td></tr>`;
  }).join('');
  const proofRows = view.attribution.map(row => {
    const network = row.network === 'not-recorded' ? 'Not recorded' : row.network === 'unrecognized' ? 'Unrecognized record' : row.networkListed ? 'Recorded membership match' : 'Recognized record; no membership match recorded';
    return { group: SIGNATURE_BASIS_LABELS[row.basis], cells: [row.profile, row.publisher === 'not-recorded' ? 'Not recorded' : row.publisher, network], views: row.views };
  });
  const proofTable = proofRows.length === 0 ? '<p>No proof records in this selection.</p>' : `<div class="data-table-region" role="region" aria-label="Stored proof and network evidence; each selected event appears once; scroll horizontally if needed" tabindex="0">${groupedEvidenceTableHtml('Stored proof and network evidence; each selected event appears once', ['Verifier profile', 'Stored signing publisher', 'Network evidence'], proofRows)}</div>`;
  const historyRows = view.measurements.map(row => `<tr><td class="agent-access-version">${escape(row.collection ?? 'not-recorded')}</td><td class="agent-access-version">${escape(row.classifier ?? 'not-recorded')}</td><td>${escape(row.source)}</td><td>${escape(FORMAT_LABELS[row.format])}</td><td>${number(row.views)}</td></tr>`).join('');
  const evidenceRows = view.coverage.evidence.map(row => `<tr><th scope="row"><a href="${escape(row.resource.path)}">${escape(row.resource.title)}</a></th><td>${row.resource.collection === 'not-collected' && row.metrics.views === 0 ? 'Not collected by the page counter' : number(row.metrics.views)}</td><td>${row.resource.collection === 'page' ? 'Page access' : 'Outside current page collection'}</td></tr>`).join('');
  const details = `${view.metrics.views === 0 ? '<p class="agent-access-empty">No retained events match this selection. This does not establish zero demand or complete collection.</p>' : ''}
    ${weeklyComparisonHtml(view.comparison, time)}
    <section class="stats-section" id="agent-access-weeks"><h3>Four completed weeks</h3>${table('Selected page events by completed UTC week', ['UTC dates', 'Page events', 'Change from preceding week'], weeks)}
      <p class="agent-access-note">Changes describe recorded access. Check measurement profiles before interpreting a trend.${view.metrics.unrecognizedTimeViews > 0 ? ` ${number(view.metrics.unrecognizedTimeViews)} ${view.metrics.unrecognizedTimeViews === 1 ? 'event has an unrecognized time' : 'events have unrecognized times'} and ${view.metrics.unrecognizedTimeViews === 1 ? 'is' : 'are'} retained outside these weekly rows.` : ''}</p></section>
    <div class="stats-panel-grid"><section class="stats-section"><h3>Declared roles</h3>${table('Disjoint roles in this selection', ['Stored role', 'Page events', 'Active UTC days'], roleRows)}</section>
      <section class="stats-section"><h3>Served formats</h3>${table('Disjoint served representations', ['Format', 'Page events', 'Active UTC days'], formatRows)}</section></div>
    <p class="agent-access-note">Names and roles are declarations. Active-day counts overlap across rows; a served format does not establish a preference.</p>
    <section class="stats-section" id="agent-access-articles"><h3>Articles</h3>${table('Article page access; select a title to include its registered evidence', ['Article', 'Page events', 'Active UTC days', 'Visit'], articleRows)}<p class="agent-access-note">Article rows count the article itself. Selecting a title includes its registered evidence. Zero retained events does not establish historical availability or zero interest.</p></section>
      <section class="stats-section" id="agent-access-clients"><h3>Client declarations</h3>${table('Client names in the selected roles', ['Declared name', 'Page events', 'Active UTC days'], clientRows || '<tr><td colspan="3">No selected client declarations in this scope.</td></tr>')}<p class="agent-access-note">Stored selected names do not authenticate operators or identify unique agents. Missing names include ambiguous declarations and earlier missing evidence.</p></section>
    <section class="stats-section" id="agent-access-coverage"><h3>Resource coverage</h3><dl class="data-facts">${dataFactsHtml([
      { label: 'Registered article events', value: view.coverage.articleEvents }, { label: 'Registered evidence events', value: view.coverage.evidenceEvents },
      { label: 'Registered site-page events', value: view.coverage.siteEvents }, { label: 'Unregistered resource events — paths withheld', value: view.coverage.unregisteredEvents },
      { label: 'Registered evidence resources', value: view.coverage.evidence.length },
    ])}</dl>${evidenceRows ? table('Explicitly registered evidence resources', ['Resource', 'Retained page events', 'Current coverage'], evidenceRows) : '<p>No evidence resources are registered in this selection.</p>'}
      <p class="agent-access-note">Event counts partition this selection; resource counts use a different unit. Files, failed requests, HEAD checks and 304 revalidations have different coverage. Retired or unmatched paths are not linked.</p></section>
    <section class="stats-section" id="agent-access-evidence"><h3>Attribution evidence</h3>${proofTable}
      <p class="agent-access-note">Stored signing publishers are separate from client declarations. Signatures and network membership do not establish a human trigger, training, citation or use. Historical requests are not reverified.</p></section>
    <section class="stats-section" id="agent-access-history"><h3>Recorded measurement profiles</h3>${table('Collection history for this selection', ['Collection', 'Classifier', 'Source', 'Format', 'Page events'], historyRows || '<tr><td colspan="5">No measurement history in this selection.</td></tr>')}
      <p class="agent-access-note">Missing stamps do not establish stable historical rules. Matching stamps do not prove unchanged feeds or detector accuracy. No cross-day client identity or complete journey is inferred.</p></section>
    <details class="agent-access-accounting"><summary>Whole-window accounting and boundaries</summary><dl class="data-facts">${dataFactsHtml([
      { label: 'Retained events inside the closed window', value: accounting.windowViews }, { label: 'Outside owner/client policy', value: accounting.ownerExcludedViews },
      { label: 'Referral-policy exclusions after owner filtering', value: accounting.referralExcludedViews }, { label: 'Included events in all roles', value: accounting.includedViews },
      { label: 'AI and signed-fallback cohort before these selections', value: view.window.metrics.views }, { label: 'Other included roles', value: accounting.otherViews },
    ])}</dl><p>These are independently reconciled stored-event counts. Collection is best effort and covers successful eligible HTML/Markdown GETs. The current catalogue does not reconstruct historical availability. This report does not observe upstream blocks, internal model retrieval, comprehension or answer citations. Selections reuse the same calculated report.</p><p>A missing network membership match includes unavailable or unassessed checks. A match does not establish that the range belongs to the declared client. AI search and AI crawling are included alongside on-demand fetchers; signed fallback records retain their historical or unknown role.</p></details>`;
  return { overview, details };
}
