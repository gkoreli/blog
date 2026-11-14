import {
  accessDayCount, AGENT_ROLE_LABELS, selectAgentAccess,
  type AgentAccessClient, type AgentAccessFormat, type AgentAccessMetrics, type AgentAccessReport, type AgentAccessSelection,
} from '@gkoreli/analytics/agent-access-contract';
import { SIGNATURE_BASIS_LABELS } from '@gkoreli/analytics/signature-basis';
import { dataFactsHtml, metricTileHtml } from './data-display.js';
import { statsTimePresentation } from './stats-time.js';

const number = (value: number) => value.toLocaleString('en-US');
const ENTITIES: Readonly<Record<string, string>> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escape = (value: string) => value.replace(/[&<>"']/g, character => ENTITIES[character] ?? character);
export function agentClientLabel(client: AgentAccessClient): string {
  return client === 'not-recorded' ? 'No selected client name' : client === 'unrecognized' ? 'Unrecognized stored name' : client;
}
const FORMAT_LABELS: Record<AgentAccessFormat, string> = { html: 'HTML', markdown: 'Markdown', 'not-recorded': 'Format not recorded', unrecognized: 'Unrecognized format' };
const formatLabel = (format: AgentAccessFormat) => FORMAT_LABELS[format];
function table(label: string, headings: string[], rows: string): string {
  return `<div class="agent-access-table" role="region" aria-label="${escape(label)}; scroll horizontally if needed" tabindex="0"><table><caption>${escape(label)}</caption><thead><tr>${headings.map(heading => `<th scope="col">${escape(heading)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
}
function metricsRow(label: string, metrics: AgentAccessMetrics, control = label): string {
  return `<tr><th scope="row">${control}</th><td>${number(metrics.views)}</td><td>${number(accessDayCount(metrics.dayMask))}</td></tr>`;
}

/** Presentation consumes the package's selection service. It does not infer
 * identities, reinterpret evidence, fetch per-row reports or join trajectories.
 */
export function agentAccessViewHtml(report: AgentAccessReport, selection: AgentAccessSelection, time = statsTimePresentation()): string {
  const selected = selectAgentAccess(report, selection);
  const articles = selected.byResource.filter(row => row.resource.role === 'article');
  const evidence = selected.byResource.filter(row => row.resource.role === 'evidence');
  const siteViews = selected.byResource.filter(row => row.resource.role === 'site').reduce((sum, row) => sum + row.metrics.views, 0);
  const evidenceViews = evidence.reduce((sum, row) => sum + row.metrics.views, 0);
  const articleViews = articles.reduce((sum, row) => sum + row.metrics.views, 0);
  const markdown = selected.byFormat.find(row => row.format === 'markdown')?.metrics.views ?? 0;
  const end = new Date(Date.parse(report.scope.endExclusive) - 86_400_000).toISOString().slice(0, 10);
  const period = `${time.formatBucket(report.scope.start, 'day')} – ${time.formatBucket(end, 'day')} · UTC reporting days`;
  const roleRows = selected.byRole.map(row => metricsRow(AGENT_ROLE_LABELS[row.kind], row.metrics,
    `<button type="button" data-agent-kind="${row.kind}" aria-pressed="${selection.kind === row.kind}">${escape(AGENT_ROLE_LABELS[row.kind])}</button>`)).join('');
  const formatRows = selected.byFormat.map(row => metricsRow(formatLabel(row.format), row.metrics)).join('');
  const articleRows = articles.map(row => metricsRow(row.resource.title, row.metrics,
    `<button type="button" class="agent-resource-choice" data-agent-article="${escape(row.resource.id)}"><span>${escape(row.resource.title)}</span><small>${escape(row.resource.path)}</small></button>`)).join('');
  const clientRows = selected.byClient.map(row => metricsRow(agentClientLabel(row.client), row.metrics,
    `<button type="button" data-agent-client="${escape(row.client)}">${escape(agentClientLabel(row.client))}</button>`)).join('');
  const weeks = selected.total.weeks.map((views, index) => {
    const start = new Date(Date.parse(report.scope.start) + index * 7 * 86_400_000).toISOString().slice(0, 10);
    const end = new Date(Date.parse(start) + 6 * 86_400_000).toISOString().slice(0, 10);
    const previous = selected.total.weeks[index - 1];
    const difference = previous === undefined ? '—' : `${views >= previous ? '+' : '−'}${number(Math.abs(views - previous))}`;
    return `<tr><th scope="row">${escape(time.formatBucket(start, 'day'))} – ${escape(time.formatBucket(end, 'day'))}</th><td>${number(views)}</td><td>${difference}</td></tr>`;
  }).join('');
  const proofGroups = new Map<string, { label: string; profile: string; publisher: string; network: string; views: number }>();
  for (const proof of selected.proofs) {
    const network = proof.network === 'not-recorded' ? 'Not recorded' : proof.network === 'unrecognized' ? 'Unrecognized record' : proof.networkListed ? 'Recorded membership match' : 'Recognized record; no membership match recorded';
    const key = JSON.stringify([proof.basis, proof.profile, proof.publisher, network]);
    const group = proofGroups.get(key) ?? { label: SIGNATURE_BASIS_LABELS[proof.basis], profile: proof.profile, publisher: proof.publisher, network, views: 0 };
    group.views += proof.views; proofGroups.set(key, group);
  }
  const proofRows = [...proofGroups.values()].sort((a, b) => b.views - a.views || a.label.localeCompare(b.label)).map(row =>
    `<tr><th scope="row">${escape(row.label)}</th><td class="agent-access-version">${escape(row.profile)}</td><td>${escape(row.publisher === 'not-recorded' ? 'Not recorded' : row.publisher)}</td><td>${escape(row.network)}</td><td>${number(row.views)}</td></tr>`).join('');
  const historyGroups = new Map<string, { collection: string; classifier: string; source: string; format: AgentAccessFormat; views: number }>();
  for (const row of selected.history) {
    const key = JSON.stringify([row.collection, row.classifier, row.source, row.format]);
    const group = historyGroups.get(key) ?? { collection: row.collection ?? 'not-recorded', classifier: row.classifier ?? 'not-recorded', source: row.source, format: row.format, views: 0 };
    group.views += row.metrics.views; historyGroups.set(key, group);
  }
  const historyRows = [...historyGroups.values()].sort((a, b) => b.views - a.views || a.collection.localeCompare(b.collection)).map(row =>
    `<tr><td class="agent-access-version">${escape(row.collection)}</td><td class="agent-access-version">${escape(row.classifier)}</td><td>${escape(row.source)}</td><td>${escape(formatLabel(row.format))}</td><td>${number(row.views)}</td></tr>`).join('');
  const evidenceRows = evidence.map(row => `<tr><th scope="row"><a href="${escape(row.resource.path)}">${escape(row.resource.title)}</a></th><td>${row.resource.collection === 'not-collected' && row.metrics.views === 0 ? 'Not collected by the page counter' : number(row.metrics.views)}</td><td>${row.resource.collection === 'page' ? 'Page access' : 'Outside current page collection'}</td></tr>`).join('');
  const tiles = [
    { label: 'Page events', value: number(selected.total.views), detail: 'Selected AI roles and signed fallback' },
    { label: 'Articles accessed', value: number(articles.filter(row => row.metrics.views > 0).length), detail: 'Registered articles with retained events' },
    { label: 'Active UTC days', value: number(accessDayCount(selected.total.dayMask)), detail: 'Union of recorded days, out of 28' },
    { label: 'Markdown events', value: number(markdown), detail: 'Served format; preference not established' },
  ].map(metricTileHtml).join('');
  return `<p class="agent-access-period">${escape(period)}<br><span>Calculated ${escape(time.formatInstant(report.scope.calculatedAt))}</span></p>
    ${selection.kind !== null ? `<p class="agent-access-selection">Role: ${escape(AGENT_ROLE_LABELS[selection.kind])} <button type="button" data-agent-reset="kind">Show all roles</button></p>` : ''}
    <div class="agent-access-metrics">${tiles}</div>
    ${selected.total.views === 0 ? '<p class="agent-access-empty">No retained events match this selection. This does not establish zero demand or complete collection.</p>' : ''}
    <div class="stats-panel-grid"><section class="stats-section"><h3>Declared roles</h3>${table('Disjoint roles in this selection', ['Stored role', 'Page events', 'Active UTC days'], roleRows)}</section>
      <section class="stats-section"><h3>Served formats</h3>${table('Disjoint served representations', ['Format', 'Page events', 'Active UTC days'], formatRows)}</section></div>
    <p class="agent-access-note">AI search and AI crawling are included alongside on-demand fetchers. Signed fallback records retain their historical or unknown role. Names and roles are declarations; neither a signature nor a network match establishes a human trigger, training, citation or use. Active-day counts overlap across rows.</p>
    <section class="stats-section"><h3>Four completed weeks</h3>${table('Selected page events by completed UTC week', ['UTC dates', 'Page events', 'Change from preceding week'], weeks)}
      <p class="agent-access-note">Changes describe recorded access. Check collection profiles below before interpreting a trend. ${number(selected.total.unrecognizedTimeViews)} events have unrecognized times and are retained outside these weekly rows.</p></section>
    <div class="stats-panel-grid"><section class="stats-section"><h3>Articles</h3>${table('Registered article access; select an article and its evidence', ['Article', 'Page events', 'Active UTC days'], articleRows)}<p class="agent-access-note">Article rows count the article itself. Selecting one includes its registered evidence resources. Zero retained events does not establish publication availability or zero interest.</p></section>
      <section class="stats-section"><h3>Client declarations</h3>${table('Client names in the selected roles', ['Declared name', 'Page events', 'Active UTC days'], clientRows || '<tr><td colspan="3">No selected client declarations in this scope.</td></tr>')}<p class="agent-access-note">These are stored selected names, not authenticated operators or unique agents. A missing name can include ambiguous declarations or earlier missing evidence.</p></section></div>
    <section class="stats-section"><h3>Resource coverage</h3><dl class="data-facts">${dataFactsHtml([
      { label: 'Registered article events', value: articleViews }, { label: 'Registered evidence events', value: evidenceViews },
      { label: 'Registered site-page events', value: siteViews }, { label: 'Unregistered resource events — paths withheld', value: selected.unregistered.views },
      { label: 'Registered evidence resources', value: evidence.length },
    ])}</dl>${evidenceRows ? table('Explicitly registered evidence resources', ['Resource', 'Retained page events', 'Current coverage'], evidenceRows) : '<p>No evidence resources are registered in this selection.</p>'}
      <p class="agent-access-note">Event counts above partition the selected total; resource counts use a different unit. The current page counter covers successful eligible HTML/Markdown GETs. Files, failed requests, HEAD checks and 304 revalidations have different coverage. Retired or unmatched paths are aggregated without public links. Registry membership does not reconstruct historical availability.</p></section>
    <section class="stats-section"><h3>Attribution evidence</h3>${table('Stored proof and network evidence; each selected event appears once', ['Signature basis', 'Verifier profile', 'Stored signing publisher', 'Network evidence', 'Page events'], proofRows || '<tr><td colspan="5">No proof records in this selection.</td></tr>')}
      <p class="agent-access-note">Publisher names follow the stored signing outcome and are separate from the declared client. Network membership does not establish that the range belongs to the declared name. A recognized record without a membership match can include unavailable or unassessed checks. These reports interpret retained results; they do not reverify old requests.</p></section>
    <section class="stats-section"><h3>Recorded measurement profiles</h3>${table('Collection history for this selection', ['Collection', 'Classifier', 'Source', 'Format', 'Page events'], historyRows || '<tr><td colspan="5">No measurement history in this selection.</td></tr>')}
      <p class="agent-access-note">Profiles record provenance. Missing stamps do not establish stable historical rules; matching stamps do not prove unchanged feeds or detector accuracy. No cross-day client identity or complete journey is inferred.</p></section>
    <details class="agent-access-accounting"><summary>Whole-window accounting and boundaries</summary><dl class="data-facts">${dataFactsHtml([
      { label: 'Retained events inside the closed window', value: report.accounting.windowViews }, { label: 'Outside owner/client policy', value: report.accounting.ownerExcludedViews },
      { label: 'Referral-policy exclusions after owner filtering', value: report.accounting.referralExcludedViews }, { label: 'Included events in all roles', value: report.accounting.includedViews },
      { label: 'AI and signed-fallback cohort before these selections', value: report.total.views }, { label: 'Other included roles', value: report.accounting.otherViews },
    ])}</dl><p>These are independently reconciled stored-event counts. Collection is best effort. The report does not observe upstream blocks, internal model retrieval, comprehension or answer citations. Article, client and role selections reuse this same calculated report.</p></details>`;
}
