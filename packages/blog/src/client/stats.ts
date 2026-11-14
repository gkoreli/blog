import { consistentVendorCacheSummary } from '@gkoreli/analytics/vendor-cache-summary';
import { consistentFetchMetadataSummary } from '@gkoreli/analytics/fetch-metadata-summary';
import { consistentVendorNetworkSummary } from '@gkoreli/analytics/vendor-network-summary';
import { consistentSignatureSummary } from '@gkoreli/analytics/signature-summary';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { READER_GROUPS, isReaderKind, readerGroupOf, type ReaderKind, type ReportedReferrerState, type StatsResponse, type TrafficFilter } from '@gkoreli/analytics/contracts';
import { CLIENT_FORM_LABELS } from '@gkoreli/analytics/client-form';
import { SIGNATURE_BASIS_LABELS } from '@gkoreli/analytics/signature-basis';
import { REVIEWED_VERIFIER_PROFILES, isReportedVerifierProfile, verifierProfileLabel } from '@gkoreli/analytics/verifier-profile';
import { nativeCategoryLabel } from '@gkoreli/analytics/native-bot-evidence';
import { DIRECTORY_PUBLICATION_LABELS } from '@gkoreli/analytics/directory-publication';
import { CLIENT_NAME_SELECTION_LABELS, consistentClientEvidence } from '@gkoreli/analytics/client-evidence';
import { dataFactsHtml, groupedEvidenceTableHtml, rankedRowHtml, type RankedItem } from '../lib/data-display.js';
import { classificationReasonLabel, requestContextRows, trafficMix } from '../lib/stats-presentation.js';
import '../styles/stats.css';

type RangeFilter = '7d' | '30d' | '90d' | 'all';
type ViewState = {
  range: RangeFilter;
  traffic: TrafficFilter;
  path: string | null;
  agent: string | null;
  kind: ReaderKind | null;
};

const MAX_ITEMS = 10;
const CHART_HEIGHT = 260;
const DEFAULT_STATE: ViewState = { range: '30d', traffic: 'all', path: null, agent: null, kind: null };

/** Public names describe stored rule matches and declared roles. */
const KIND_LABELS: Record<ReaderKind, string> = {
  browser: 'Browser signals',
  'signed-agent': 'Signed clients — historical or unknown role',
  'ai-assistant': 'AI assistants',
  'ai-search': 'AI search',
  'ai-crawler': 'AI crawlers',
  'search-crawler': 'Search engines',
  'seo-crawler': 'SEO and site-audit crawlers',
  'preview-or-feed': 'Previews & service fetches',
  'cloud-browser': 'Hosting-list matches',
  'headless-browser': 'Headless browsers',
  'http-client': 'HTTP clients',
  'other-bot': 'Other bots',
  'legacy-browser': 'Older browser claims — earlier rule',
  unresolved: 'Unresolved request evidence',
};

const SPECIAL_COUNTRIES: Record<string, string> = {
  T1: 'Tor network',
  XX: 'Unknown location',
  A1: 'Proxy network',
  A2: 'Satellite network',
  AP: 'Asia-Pacific',
};

function element(id: string): HTMLElement {
  const value = document.getElementById(id);
  if (!value) throw new Error(`Missing #${id}`);
  return value;
}

function parseRange(value: string | null): RangeFilter {
  switch (value) {
    case '7d':
    case '30d':
    case '90d':
    case 'all':
      return value;
    default:
      return DEFAULT_STATE.range;
  }
}

function parseTraffic(value: string | null, fallback: TrafficFilter): TrafficFilter {
  switch (value) {
    case 'browser':
    case 'agents':
    case 'crawlers':
    case 'automation':
    case 'unresolved':
    case 'all':
      return value;
    default:
      return fallback;
  }
}

function optionalFilter(value: string | null): string | null {
  return value === null || value.length === 0 ? null : value;
}

function parseKind(value: string | null): ReaderKind | null {
  return value !== null && isReaderKind(value) ? value : null;
}

function getState(): ViewState {
  const params = new URLSearchParams(location.search);
  const path = optionalFilter(params.get('path'));
  const agent = optionalFilter(params.get('agent'));
  const kind = parseKind(params.get('kind'));
  return {
    range: parseRange(params.get('range')),
    traffic: parseTraffic(params.get('traffic'), DEFAULT_STATE.traffic),
    path,
    agent,
    kind,
  };
}

function paramsForState(state: ViewState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.range !== DEFAULT_STATE.range) params.set('range', state.range);
  const defaultTraffic = state.agent === null && state.kind === null ? DEFAULT_STATE.traffic : 'all';
  if (state.traffic !== defaultTraffic) params.set('traffic', state.traffic);
  if (state.path !== null) params.set('path', state.path);
  if (state.agent !== null) params.set('agent', state.agent);
  if (state.kind !== null) params.set('kind', state.kind);
  return params;
}

function stateHref(state: ViewState): string {
  const query = paramsForState(state).toString();
  return query ? `${location.pathname}?${query}` : location.pathname;
}

function pushState(state: ViewState): void {
  const params = paramsForState(state);
  const query = params.toString();
  history.pushState({}, '', query ? `?${query}` : location.pathname);
}

function updateControls(state: ViewState): void {
  const traffic = document.getElementById('stats-traffic');
  if (traffic instanceof HTMLSelectElement) traffic.value = state.traffic;
  const json = document.getElementById('stats-json-link');
  if (json instanceof HTMLAnchorElement) json.href = statsApiHref(state);
  const selectedDays = state.range === 'all' ? '0' : state.range.replace('d', '');
  document.querySelectorAll<HTMLButtonElement>('[data-days]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.days === selectedDays));
  });
}

function statsApiHref(state: ViewState): string {
  const params = new URLSearchParams({ range: state.range, traffic: state.traffic });
  if (state.path !== null) params.set('path', state.path);
  if (state.agent !== null) params.set('agent', state.agent);
  if (state.kind !== null) params.set('kind', state.kind);
  return `/api/stats?${params}`;
}

async function fetchStats(state: ViewState, signal: AbortSignal): Promise<StatsResponse> {
  const response = await fetch(statsApiHref(state), { signal });
  if (!response.ok) throw new Error(`Stats request failed with ${response.status}`);
  const data: StatsResponse = await response.json();
  // An old cached API response must not restore arbitrary hostname display.
  if (data.referralPolicy === undefined) throw new Error('Stats referral policy is unavailable');
  if (data.byReferrerState === undefined || data.internalTransitions === undefined || data.internalReferrerDetails === undefined) {
    throw new Error('Updated referral details are unavailable. Please reload.');
  }
  if (data.bySigner === undefined) throw new Error('Updated signer evidence is unavailable. Please reload.');
  if (data.verification === undefined || data.vendorNetwork === undefined || data.byClientForm === undefined || data.clientFormEvidence === undefined || data.byKindSignature === undefined || data.byDirectoryPublication === undefined) throw new Error('Updated verification evidence is unavailable. Please reload.');
  if (data.verifierProfile?.assessment !== 'stored-profile-not-reverified'
    || !REVIEWED_VERIFIER_PROFILES.some(profile => profile === data.verifierProfile.current)
    || !data.byKindSignature.every(row => isReportedVerifierProfile(row.profile))) throw new Error('Updated verifier profile provenance is unavailable. Please reload.');
  if (!consistentFetchMetadataSummary(data.fetchMetadata, data.totals.views)) throw new Error('Request-context evidence is incomplete or inconsistent. Please reload.');
  if (!consistentVendorCacheSummary(data.vendorCache, data.totals.views)) throw new Error('Vendor cache diagnostics are missing or inconsistent. Please reload.');
  if (!consistentVendorNetworkSummary(data.vendorNetwork, data.totals.views)) throw new Error('Inconsistent vendor network summary. Please reload.');
  if (!consistentSignatureSummary(data.verification, data.totals.views, data.byKindSignature)) throw new Error('Inconsistent signature summary. Please reload.');
  if (data.byKindClientEvidence === undefined || data.clientNameCoverage === undefined
    || !consistentClientEvidence(data.byKindClientEvidence, data.clientNameCoverage, data.totals.views,
      data.byKindSignature, data.byKindNativeCategory, data.byAgent)) throw new Error('Client-name and verification evidence is incomplete or inconsistent. Please reload.');
  if (!Number.isSafeInteger(data.verification.vendorOriginConflictViews) || data.verification.vendorOriginConflictViews < 0
    || !Number.isSafeInteger(data.verification.vendorConflictWithMatchingOriginViews) || data.verification.vendorConflictWithMatchingOriginViews < 0) {
    throw new Error('Updated signing-origin conflicts are unavailable. Please reload.');
  }
  return data;
}

function getColors(): { link: string; border: string; muted: string; secondary: string } {
  const styles = getComputedStyle(document.documentElement);
  return {
    link: styles.getPropertyValue('--color-link').trim(),
    secondary: styles.getPropertyValue('--color-accent-blue').trim(),
    border: styles.getPropertyValue('--color-border').trim(),
    muted: styles.getPropertyValue('--color-text-muted').trim(),
  };
}

function translucent(hex: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const red = parseInt(hex.slice(1, 3), 16);
  const green = parseInt(hex.slice(3, 5), 16);
  const blue = parseInt(hex.slice(5, 7), 16);
  return `rgba(${red},${green},${blue},0.15)`;
}

const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });
function countryLabel(code: string): string {
  const special = SPECIAL_COUNTRIES[code];
  if (special) return special;
  if (!/^[A-Z]{2}$/.test(code)) return code;
  return `${code} · ${countryNames.of(code) ?? code}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

function formatViewCount(value: number, page = false): string {
  const unit = value === 1 ? 'view' : 'views';
  return `${formatNumber(value)} ${page ? 'page ' : ''}${unit}`;
}

function formatUpdatedAt(value: string): string {
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
  return `${formatted} UTC`;
}

function formatBucket(bucket: string, granularity: StatsResponse['period']['granularity']): string {
  if (granularity === 'hour') {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZoneName: 'short',
    }).format(new Date(bucket));
  }
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${bucket}T00:00:00Z`));
}

function bucketTimestamp(bucket: string, granularity: StatsResponse['period']['granularity']): number {
  const instant = granularity === 'hour' ? bucket : `${bucket}T00:00:00Z`;
  return Date.parse(instant) / 1000;
}

function setStatus(message: string, kind: 'loading' | 'ready' | 'empty' | 'error'): void {
  const status = element('stats-status');
  status.className = `stats-status stats-status-${kind}`;
  status.textContent = message;
  element('stats-loading').hidden = kind !== 'loading';
}

function setDashboardVisible(visible: boolean): void {
  const dashboard = element('stats-dashboard');
  dashboard.hidden = !visible;
  dashboard.setAttribute('aria-busy', String(!visible));
}

function renderPeriod(period: StatsResponse['period'], series: StatsResponse['timeSeries']): void {
  const granularity = period.granularity === 'hour' ? 'Hourly buckets' : 'Daily buckets';
  const partial = period.granularity === 'hour' ? 'current UTC hour is partial' : 'current UTC day is partial';
  const laterBuckets = series.some(row => bucketTimestamp(row.bucket,period.granularity)*1000 > Date.parse(period.updatedAt));
  const clockNote = laterBuckets ? ' · Some returned bucket timestamps are later than the calculation clock' : '';
  const dates = document.createElement('span');
  const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' });
  dates.textContent = `${dateFormat.formatRange(new Date(`${period.start}T00:00:00Z`), new Date(`${period.end}T00:00:00Z`))} · UTC`;
  const detail = document.createElement('span'); detail.textContent = `Updated ${formatUpdatedAt(period.updatedAt)}${clockNote}`;
  element('stats-chart-context').textContent = `${granularity} · UTC · ${partial.replace(' UTC', '')}`;
  element('stats-period').replaceChildren(dates, detail);
  element('stats-period').hidden = false;
}

function renderTotals(totals: StatsResponse['totals']): void {
  const values = [totals.views, totals.dailyClients];
  element('stats-totals').querySelectorAll<HTMLElement>('.data-metric').forEach((card, index) => {
    const value = card.querySelector<HTMLElement>('.data-metric-value');
    const total = values[index];
    if (!value || total === undefined) return;
    value.className = 'data-metric-value';
    value.textContent = formatNumber(total);
  });
}

function renderScope(filters: StatsResponse['filters']): void {
  const scope = element('stats-scope');
  scope.replaceChildren();
  const active = [
    filters.path === null ? null : {
      label: 'Page',
      value: filters.path,
      filter: 'path',
      ariaLabel: 'Clear page filter',
    },
    filters.agent === null ? null : {
      label: 'Agent',
      value: filters.agent,
      filter: 'agent',
      ariaLabel: 'Clear agent filter',
    },
    filters.kind === null ? null : {
      label: 'Kind',
      value: KIND_LABELS[filters.kind],
      filter: 'kind',
      ariaLabel: 'Clear kind filter',
    },
  ].filter((item) => item !== null);

  scope.hidden = active.length === 0;
  active.forEach((item, index) => {
    if (index > 0) scope.append(' · ');
    scope.append(`${item.label} `);
    const value = document.createElement('span');
    value.className = 'stats-scope-value';
    value.textContent = item.value;
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'stats-scope-clear';
    clear.dataset.clearFilter = item.filter;
    clear.setAttribute('aria-label', item.ariaLabel);
    clear.textContent = 'Clear';
    scope.append(value, ' ', clear);
  });
}

function replaceSectionRows(containerId: string, items: RankedItem[], limit: number | null = MAX_ITEMS): void {
  const section = element(containerId).querySelector('.stats-section-results');
  if (!section) throw new Error(`Missing results container: ${containerId}`);
  section.replaceChildren();

  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'stats-empty';
    empty.textContent = 'No data for this selection.';
    section.appendChild(empty);
    return;
  }

  const factsOnly = ['stats-verification', 'stats-vendor-network', 'stats-vendor-signatures', 'stats-vendor-cache', 'stats-vendor-cache-access', 'stats-vendor-cache-policy', 'stats-verification-outcomes'].includes(containerId);
  if (factsOnly) {
    const facts = document.createElement('dl'); facts.className = 'data-facts';
    facts.innerHTML = dataFactsHtml(items.map(item => ({ label: item.label, value: item.views })));
    section.appendChild(facts); return;
  }
  const visibleItems = limit === null ? items : items.slice(0, limit);
  const max = visibleItems.reduce((highest, item) => Math.max(highest, item.views), 0);
  const rows = document.createElement('div');
  rows.innerHTML = visibleItems.map(item => rankedRowHtml(item, max)).join('');
  section.append(...Array.from(rows.childNodes));
}

function pageHref(path: string): string | undefined {
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('?') && !path.includes('#')
    ? path
    : undefined;
}

const pageTitles = new Map<string, string>();
const catalogue = document.getElementById('stats-page-catalogue');
if (catalogue) {
  for (const link of catalogue.querySelectorAll('a')) {
    const path = link.getAttribute('href');
    if (path && link.textContent) pageTitles.set(path, link.textContent);
  }
}

function pageItem(row: StatsResponse['byPath'][number], state: ViewState): RankedItem {
  const openHref = pageHref(row.path);
  const title = pageTitles.get(row.path);
  const identity = title ? { label: title, description: row.path } : { label: row.path };
  const item: RankedItem = state.path === null
    ? { ...identity, views: row.views, href: stateHref({ ...state, path: row.path }) }
    : { ...identity, views: row.views };
  if (openHref === undefined) return item;
  return { ...item, openHref, openAriaLabel: `Open ${row.path}` };
}

function renderClientForms(rows: StatsResponse['byClientForm'], evidence: StatsResponse['clientFormEvidence']): void {
  const section = element('stats-client-form-section');
  section.hidden = false;
  element('stats-client-form-coverage').innerHTML = dataFactsHtml([
    { label: 'Recognized form records', value: evidence.recordedViews },
    { label: 'Earlier heuristic records', value: evidence.historicalViews },
    { label: 'Unrecognized records', value: evidence.unrecognizedRecordViews },
    { label: 'Unsupported hints', value: evidence.unsupportedHintViews },
    { label: 'Differing indicators', value: evidence.differingSignalsViews },
  ]);
  replaceSectionRows('stats-client-form-section', rows.map(row => ({ label: CLIENT_FORM_LABELS[row.form], views: row.views })), null);
}

let chart: uPlot | null = null;

function destroyChart(): void {
  chart?.destroy();
  chart = null;
}

function renderChartTable(data: StatsResponse): void {
  const container = element('stats-chart-table');
  if (data.timeSeries.length === 0) {
    container.textContent = 'No chart data for this selection.';
    return;
  }

  const table = document.createElement('table');
  const caption = document.createElement('caption');
  caption.textContent = data.period.granularity === 'hour'
    ? 'Hourly values in UTC. Daily IDs can repeat across hours and are not additive.'
    : 'Daily values in UTC.';
  const head = document.createElement('thead');
  const headRow = document.createElement('tr');
  const clientLabel = data.period.granularity === 'hour' ? 'Daily IDs seen in hour' : 'Daily clients';
  for (const text of ['UTC bucket', 'Page views', clientLabel]) {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = text;
    headRow.appendChild(cell);
  }
  head.appendChild(headRow);

  const body = document.createElement('tbody');
  for (const row of data.timeSeries) {
    const tableRow = document.createElement('tr');
    for (const text of [formatBucket(row.bucket, data.period.granularity), formatNumber(row.views), formatNumber(row.dailyClients)]) {
      const cell = document.createElement('td');
      cell.textContent = text;
      tableRow.appendChild(cell);
    }
    body.appendChild(tableRow);
  }
  table.append(caption, head, body);
  container.replaceChildren(table);
}

function renderChart(data: StatsResponse): void {
  destroyChart();
  const container = element('stats-chart');
  container.replaceChildren();
  const hourly = data.period.granularity === 'hour';
  const unit = hourly ? 'Hourly' : 'Daily';
  const clientUnit = hourly ? 'daily IDs seen in each hour' : 'daily clients';
  const nonAdditive = hourly ? ' Daily IDs can repeat across hours and are not additive.' : '';
  container.setAttribute('aria-label', `${unit} page views and ${clientUnit} in UTC from ${data.period.start} through ${data.period.end}.${nonAdditive} ${formatViewCount(data.totals.views, true)} total.`);
  renderChartTable(data);

  if (data.timeSeries.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'stats-empty';
    empty.textContent = 'No chart data for this selection.';
    container.appendChild(empty);
    return;
  }

  const colors = getColors();
  const timestamps = data.timeSeries.map(row => bucketTimestamp(row.bucket, data.period.granularity));
  const views = data.timeSeries.map(row => row.views);
  const dailyClients = data.timeSeries.map(row => row.dailyClients);
  const alignedData: uPlot.AlignedData = [timestamps, views, dailyClients];
  const options: uPlot.Options = {
    width: Math.max(container.clientWidth, 1),
    height: CHART_HEIGHT,
    tzDate: timestamp => uPlot.tzDate(new Date(timestamp * 1000), 'Etc/UTC'),
    scales: { x: { time: true }, y: { range: (_plot, _minimum, maximum) => [0, Math.max(maximum, 1)] } },
    axes: [
      { stroke: colors.muted, grid: { show: false }, font: '11px monospace' },
      { stroke: colors.muted, grid: { stroke: colors.border, width: 1 }, size: 44, font: '11px monospace' },
    ],
    series: [
      {},
      { label: 'Page views', stroke: colors.link, fill: translucent(colors.link), width: 2, points: { show: false } },
      { label: hourly ? 'Daily IDs seen in hour' : 'Daily clients', stroke: colors.secondary, width: 1.5, dash: [6, 4], points: { show: false } },
    ],
    legend: { live: true },
    hooks: {
      ready: [plot => plot.setLegend({ idx: timestamps.length - 1 })],
      setCursor: [plot => { if (plot.cursor.idx === null || plot.cursor.idx === undefined) plot.setLegend({ idx: timestamps.length - 1 }); }],
    },
  };
  chart = new uPlot(options, alignedData, container);
}

/** Only a named User-Agent rule scopes the page further; other reasons are facts, not filters. */
function reasonHref(kind: ReaderKind, reason: string, state: ViewState): string | undefined {
  if (state.kind !== null || state.agent !== null) return undefined;
  const namedAgentKinds: ReaderKind[] = ['ai-assistant', 'ai-search', 'ai-crawler', 'search-crawler', 'seo-crawler', 'preview-or-feed', 'headless-browser', 'other-bot'];
  if (!namedAgentKinds.includes(kind) || reason === 'generic-bot' || reason.includes(':')) return undefined;
  return stateHref({ ...state, agent: reason, traffic: 'all' });
}

function renderComposition(data: StatsResponse, state: ViewState): void {
  const section = element('stats-composition').querySelector('.stats-section-results');
  if (!section) throw new Error('Missing classification results container');
  section.replaceChildren();
  if (data.byKind.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'stats-empty';
    empty.textContent = 'No data for this selection.';
    section.appendChild(empty);
    return;
  }

  const byKind = new Map<ReaderKind, StatsResponse['byKind']>();
  for (const row of data.byKind) {
    const rows = byKind.get(row.kind) ?? [];
    rows.push(row);
    byKind.set(row.kind, rows);
  }
  const kinds = [...byKind.entries()]
    .map(([kind, rows]) => ({ kind, rows, views: rows.reduce((sum, row) => sum + row.views, 0) }))
    .sort((a, b) => b.views - a.views);
  const max = kinds[0]?.views ?? 0;

  const groups = document.createElement('div'); groups.className = 'stats-composition-groups'; section.append(groups);
  for (const group of kinds) {
    const groupElement = document.createElement('section'); groupElement.className = 'stats-kind-group'; groups.append(groupElement);
    const row = document.createElement('h4');
    row.className = 'stats-row stats-row-kind';
    const bar = document.createElement('span');
    bar.className = 'stats-bar';
    bar.style.width = `${max > 0 ? (group.views / max) * 100 : 0}%`;
    bar.setAttribute('aria-hidden', 'true');
    const label = state.kind === null && state.agent === null ? document.createElement('a') : document.createElement('span');
    label.className = 'stats-label';
    label.textContent = KIND_LABELS[group.kind];
    if (label instanceof HTMLAnchorElement) label.href = stateHref({ ...state, kind: group.kind, traffic: 'all' });
    const value = document.createElement('span');
    value.className = 'stats-value';
    value.textContent = formatViewCount(group.views);
    row.append(bar, label, value);
    groupElement.appendChild(row);

    const reasonList = document.createElement('div');
    reasonList.className = 'stats-kind-reasons';
    groupElement.appendChild(reasonList);
    const reasons = group.rows;
    for (const reason of reasons) {
      const sub = document.createElement('div');
      sub.className = 'stats-row stats-row-reason';
      const href = reasonHref(group.kind, reason.reason, state);
      const subLabel = href === undefined ? document.createElement('span') : document.createElement('a');
      subLabel.className = 'stats-label';
      subLabel.title = reason.reason;
      subLabel.textContent = classificationReasonLabel(group.kind, reason.reason);
      if (subLabel instanceof HTMLAnchorElement && href !== undefined) subLabel.href = href;
      const subValue = document.createElement('span');
      subValue.className = 'stats-value';
      subValue.textContent = formatNumber(reason.views);
      sub.append(subLabel, subValue);
      reasonList.appendChild(sub);
    }
  }
}

function classificationGroup(kind: ReaderKind | null, state: ViewState) {
  const group = kind === null ? 'Kind unrecorded or unrecognized' : KIND_LABELS[kind];
  return kind !== null && state.kind === null && state.agent === null
    ? { group, groupHref: stateHref({ ...state, kind, traffic: 'all' }) }
    : { group };
}

function renderClassificationEvidenceTable(containerId: string, evidenceLabel: string, rows: Array<{ kind: ReaderKind | null; label: string; views: number; profileLabel?: string }>, state: ViewState, includeProfile = false): void {
  element(containerId).innerHTML = groupedEvidenceTableHtml('Grouped by classification. Each request appears once; rows add up to the selected total.',
    [evidenceLabel, ...(includeProfile ? ['Stored verifier'] : [])],
    rows.map(row => ({ ...classificationGroup(row.kind, state), cells: [row.label, ...(includeProfile ? [row.profileLabel ?? 'Profile unavailable'] : [])], views: row.views })));
}

function renderKindSignatures(data: StatsResponse, state: ViewState): void {
  renderClassificationEvidenceTable('stats-kind-signature-rows', 'Stored local signature evidence', data.byKindSignature.map(row => ({ ...row, label: SIGNATURE_BASIS_LABELS[row.basis], profileLabel: verifierProfileLabel(row.profile, data.verifierProfile.current) })), state, true);
  renderClassificationEvidenceTable('stats-native-category-rows', 'Cloudflare category evidence', data.byKindNativeCategory.map(row => ({ ...row, label: nativeCategoryLabel(row.basis) })), state);
  const coverage = data.clientNameCoverage;
  element('stats-client-name-coverage').innerHTML = dataFactsHtml([
    { label: 'One selected catalogue name', value: coverage.selectedNameViews },
    { label: 'No single selected name', value: coverage.noSelectedNameViews },
  ]);
  const container = element('stats-client-evidence-rows');
  if (data.byKindClientEvidence.length === 0) { container.textContent = 'No requests for this selection.'; return; }
  container.innerHTML = groupedEvidenceTableHtml('Names, provider categories and local signature checks on the same requests, grouped by classification. Each request appears once.',
    ['Catalogue name', 'Cloudflare category', 'Signature check', 'Verifier profile'],
    data.byKindClientEvidence.map(row => ({ ...classificationGroup(row.kind, state),
      cells: [CLIENT_NAME_SELECTION_LABELS[row.nameSelection], nativeCategoryLabel(row.nativeCategory), SIGNATURE_BASIS_LABELS[row.signatureBasis], verifierProfileLabel(row.verifierProfile, data.verifierProfile.current)], views: row.views })));

}

function renderTransitions(data: StatsResponse, state: ViewState): void {
  element('stats-transitions').hidden = state.path !== null;
  element('stats-previous-pages').hidden = state.path === null;
  element('stats-next-pages').hidden = state.path === null;
  if (state.path === null) {
    replaceSectionRows('stats-transitions', data.internalTransitions.map(row => ({
      label: `${row.fromPath === '/' ? '/ (homepage or origin-only)' : row.fromPath} → ${row.toPath}`, views: row.views,
      href: stateHref({ ...state, path: row.fromPath }),
    })));
  } else {
    replaceSectionRows('stats-previous-pages', data.internalTransitions.filter(row => row.toPath === state.path).map(row => ({
      label: row.fromPath === '/' ? '/ (homepage or origin-only)' : row.fromPath, views: row.views, href: stateHref({ ...state, path: row.fromPath }),
    })));
    replaceSectionRows('stats-next-pages', data.internalTransitions.filter(row => row.fromPath === state.path).map(row => ({
      label: row.toPath, views: row.views, href: stateHref({ ...state, path: row.toPath }),
    })));
  }
  const details = data.internalReferrerDetails;
  element('stats-transition-details').textContent = details.firstCapturedAt === null
    ? 'No detailed referrer records in this selection. Earlier internal page paths were not saved.'
    : `Recorded page transitions, with repeated requests counted separately. ${formatNumber(details.selfReferrals)} same-page referrals are separate; ${formatNumber(details.unrecognizedPathViews)} internal referrals have no recognized source path. A missing next request does not establish that someone left.`;
}

function renderFetchMetadata(data: StatsResponse): void {
  const summary = data.fetchMetadata, records = summary.records;
  element('stats-fetch-metadata-records').innerHTML = dataFactsHtml([
    { label: 'Recognized, consistent parsing records', value: records.recognizedViews },
    { label: 'No parsing record', value: records.notRecordedViews },
    { label: 'Unsupported records or profiles', value: records.unrecognizedViews },
    { label: 'Inconsistent parsing facts', value: records.inconsistentViews },
  ]);
  const container = element('stats-fetch-metadata-rows');
  container.replaceChildren();
  const table = document.createElement('table');
  const caption = table.createCaption();
  const captionText = document.createElement('span'); captionText.className = 'data-table-caption-text';
  captionText.textContent = 'Header parsing states across four request fields. Parameters overlap the other state counts.'; caption.appendChild(captionText);
  const header = table.createTHead().insertRow();
  for (const label of ['Parsing state', 'Mode', 'Destination', 'Site context', 'Activation']) {
    const cell = document.createElement('th'); cell.scope = 'col'; cell.textContent = label; header.appendChild(cell);
  }
  const body = table.createTBody();
  for (const { label, values } of requestContextRows(summary.fields)) {
    const row = body.insertRow(), heading = document.createElement('th');
    heading.scope = 'row'; heading.textContent = label; row.appendChild(heading);
    for (const value of values) {
      const cell = row.insertCell(); cell.textContent = formatNumber(value);
    }
  }
  container.appendChild(table);
  element('stats-fetch-metadata-activation').innerHTML = dataFactsHtml([
    { label: 'Parsed activation: true claims', value: summary.activation.trueClaimViews },
    { label: 'Parsed activation: false values', value: summary.activation.falseValueViews },
  ]);
}

function renderDashboard(data: StatsResponse, state: ViewState): void {
  renderPeriod(data.period,data.timeSeries);
  renderScope(data.filters);
  const excluded = data.referralPolicy.excludedViews;
  const exclusionNotice = excluded > 0
    ? ` ${formatNumber(excluded)} ${excluded === 1 ? 'observation excluded' : 'observations excluded'} by the referral-abuse policy for this selection.`
    : '';
  if (data.totals.views === 0 && data.internalTransitions.length === 0) {
    setDashboardVisible(false);
    setStatus(`No page views to show for this selection.${exclusionNotice}`, 'empty');
    return;
  }
  setDashboardVisible(true);
  renderTotals(data.totals);
  replaceSectionRows('stats-traffic-mix', trafficMix(data.byKind).map(row => ({
    label: row.label, views: row.views,
    href: stateHref({ ...state, traffic: row.group, agent: null, kind: null }),
    detail: `${data.totals.views > 0 ? (row.views / data.totals.views * 100).toFixed(1) : '0.0'}%`,
  })), null);
  const distribution = element('stats-distribution'); distribution.replaceChildren();
  const mix = trafficMix(data.byKind);
  element('stats-traffic-mix').querySelectorAll<HTMLElement>('.data-row').forEach((row, index) => {
    const group = mix[index]; if (group) row.dataset.group = group.group;
  });
  for (const row of mix) {
    if (row.views === 0) continue;
    const segment = document.createElement('span'); segment.dataset.group = row.group;
    segment.style.flexGrow = String(row.views);
    distribution.appendChild(segment);
  }
  element('stats-policy-note').textContent = excluded > 0
    ? `${formatNumber(excluded)} requests excluded by the referral-abuse policy. Reports can be up to one hour old.`
    : 'Reports can be up to one hour old. Updated time is the report calculation time.';
  renderClientForms(data.byClientForm, data.clientFormEvidence);
  renderChart(data);
  replaceSectionRows('stats-pages', data.byPath.map((row) => pageItem(row, state)));
  const referrers: RankedItem[] = data.byReferrer.map(row => ({ label: row.referrerHost, views: row.views }));
  if (data.otherReferrerViews > 0) {
    referrers.push({ label: 'Other reported referrers', views: data.otherReferrerViews });
  }
  const referrerLabels: Record<ReportedReferrerState, string> = {
    external: 'Outside websites', internal: 'Within this blog', absent: 'No referrer sent',
    unusable: 'Unusable referrer', 'legacy-unknown': 'Unknown — earlier collection',
  };
  for (const row of data.byReferrerState) {
    if (row.state !== 'external') referrers.push({ label: referrerLabels[row.state], views: row.views });
  }
  replaceSectionRows('stats-referrers', referrers, null);
  renderTransitions(data, state);
  replaceSectionRows('stats-countries', data.byCountry.map(row => ({ label: countryLabel(row.country), views: row.views })));
  replaceSectionRows('stats-declarations', data.byAgent.map(row => ({
    label: row.agentName, views: row.views,
    href: stateHref({ ...state, agent: row.agentName, kind: null, traffic: 'all' }),
  })), null);
  replaceSectionRows('stats-signers', data.bySigner.map(row => ({ label: row.signatureAgent, views: row.views })), null);
  const verification = data.verification;
  const groups = [
    { label: 'Record coverage', facts: [
      { label: 'Stored verification record present', views: verification.recordedViews },
      { label: 'Verification record not recorded', views: verification.notRecordedViews },
      { label: 'Injected test verdict — not local verification', views: verification.testVerdictViews },
    ] },
    { label: 'Local verification outcomes', facts: [
      { label: 'Consistent stored local result: verified', views: verification.localVerifiedViews },
      { label: 'Local verification unsuccessful', views: verification.localUnverifiedViews },
      { label: 'No signature headers', views: verification.localAbsentViews },
      { label: 'Unrecognized or inconsistent local record', views: verification.unrecognizedLocalViews },
    ] },
    { label: 'Signature coverage', facts: [
      { label: 'Verified coverage recorded', views: verification.coverageRecordedViews },
      { label: 'Verified result; coverage not recorded', views: verification.coverageNotRecordedVerifiedViews },
      { label: 'Verified result; coverage unrecognized', views: verification.coverageUnrecognizedVerifiedViews },
      { label: 'User-Agent covered', views: verification.userAgentBoundViews },
      { label: 'Path or full URL covered', views: verification.resourceBoundViews },
      { label: 'Method covered', views: verification.methodBoundViews },
      { label: 'Host-only request binding', views: verification.authorityOnlyViews },
    ] },
    { label: 'Candidate selection', facts: [
      { label: 'Selected-signature assessment recorded', views: verification.selectionRecordedViews },
      { label: 'Verified; candidate assessment not recorded', views: verification.selectionNotRecordedVerifiedViews },
      { label: 'Verified; candidate assessment unrecognized', views: verification.selectionUnrecognizedVerifiedViews },
      { label: 'Events with several tagged signature candidates', views: verification.multipleTaggedCandidateViews },
      { label: 'Events with other candidates left unassessed', views: verification.unassessedCandidateViews },
    ] },
    { label: 'Cloudflare boolean availability', facts: [
      { label: 'Native boolean fields unavailable', views: verification.nativeUnavailableViews },
      { label: 'Native boolean record not recorded', views: verification.nativeNotRecordedViews },
      { label: 'Native boolean record unrecognized', views: verification.nativeUnrecognizedViews },
      { label: 'At least one stored native boolean available', views: verification.nativeAvailableViews },
    ] },
    { label: 'Cloudflare verified-bot', facts: [
      { label: 'Stored native verified-bot boolean available', views: verification.nativeVerifiedBotAvailableViews },
      { label: 'Native verified-bot result true', views: verification.nativeVerifiedBotViews },
      { label: 'Native verified-bot result false', views: verification.nativeVerifiedBotAvailableViews - verification.nativeVerifiedBotViews },
      { label: 'Local verified; native verified-bot false', views: verification.localVerifiedNativeNotVerifiedViews },
    ] },
    { label: 'Cloudflare signed-agent', facts: [
      { label: 'Stored native signed-agent boolean available', views: verification.nativeSignedAgentAvailableViews },
      { label: 'Native signed-agent result true', views: verification.nativeSignedAgentViews },
      { label: 'Native signed-agent result false', views: verification.nativeSignedAgentAvailableViews - verification.nativeSignedAgentViews },
    ] },
  ];
  const factsContainer = element('stats-verification').querySelector('.stats-section-results');
  if (!factsContainer) throw new Error('Missing verification facts container');
  factsContainer.replaceChildren();
  for (const group of groups) {
    const section = document.createElement('section'); section.className = 'stats-fact-group';
    const heading = document.createElement('h4'); heading.textContent = group.label;
    const facts = document.createElement('dl'); facts.className = 'data-facts';
    facts.innerHTML = dataFactsHtml(group.facts.map(item => ({ label: item.label, value: item.views })));
    section.append(heading, facts); factsContainer.appendChild(section);
  }
  replaceSectionRows('stats-verification-outcomes', [
    { label: 'Invalid input or cryptographic mismatch', views: verification.localInvalidViews },
    { label: 'Unsupported format or algorithm', views: verification.localUnsupportedViews },
    { label: 'Directory, key or verifier unavailable', views: verification.localUnavailableViews },
    { label: 'Rejected by local verifier policy', views: verification.localPolicyRejectedViews },
    { label: 'Signature outside Web Bot Auth', views: verification.localNotApplicableViews },
    { label: 'Indeterminate, mixed or internal error', views: verification.localIndeterminateViews },
    { label: 'Earlier unsuccessful result — detail unrecorded', views: verification.unverifiedOutcomeNotRecordedViews },
  ], null);
  replaceSectionRows('stats-vendor-network', [
    { label: 'Stored method record present', views: data.vendorNetwork.recordedViews },
    { label: 'Structurally recognized stored network record', views: data.vendorNetwork.recognizedViews },
    { label: 'Unrecognized or structurally inconsistent record', views: data.vendorNetwork.unrecognizedViews },
    { label: 'Method not recorded — historical or unreported', views: data.vendorNetwork.notRecordedViews },
    { label: 'Record reports a configured declaration', views: data.vendorNetwork.configuredDeclarationViews },
    { label: 'Stored result: listed in a checked feed', views: data.vendorNetwork.listedViews },
    { label: 'Stored result: absent from a checked feed', views: data.vendorNetwork.notListedViews },
    { label: 'Check unavailable — address, feed, validation or deadline', views: data.vendorNetwork.unavailableViews },
    { label: 'Not assessed — refresh cooldown or request budget', views: data.vendorNetwork.notAssessedViews },
    { label: 'Stored configured declarations; address unavailable', views: data.vendorNetwork.addressUnavailableViews },
    { label: 'Record reports an unmapped declaration', views: data.vendorNetwork.unmappedDeclarationViews },
    { label: 'Stored declaration count: zero', views: data.vendorNetwork.noDeclarationViews },
  ], null);
  const cache = data.vendorCache, records = cache.records;
  replaceSectionRows('stats-vendor-cache', [
    { label: 'Recognized record for cache diagnostics', views: records.recognizedViews },
    { label: 'Cache facts not recorded — historical or unreported', views: records.notRecordedViews },
    { label: 'Unsupported or inconsistent stored record', views: records.unrecognizedViews },
    { label: 'No applicable published-range method', views: records.noApplicableViews },
    { label: 'Only address or fanout guards; no cache access', views: records.guardedOnlyViews },
    { label: 'At least one recorded cache access path', views: records.withAccessViews },
    { label: 'Accepted policy context available', views: records.policyKnownViews },
    { label: 'At least one access with no accepted policy context', views: records.policyUnknownViews },
    { label: 'Both known and unknown policy contexts', views: records.partialPolicyViews },
  ], null);
  replaceSectionRows('stats-vendor-cache-access', [
    { label: 'Fetched and accepted a feed response', views: cache.byAccess.fetched },
    { label: 'Revalidated a stored feed', views: cache.byAccess.revalidated },
    { label: 'Reused a fresh in-memory feed', views: cache.byAccess.memory },
    { label: 'Shared an in-flight fetch — success or failure', views: cache.byAccess.coalesced },
    { label: 'Skipped under the refresh cooldown', views: cache.byAccess.cooldown },
    { label: 'Fetch or validation failed', views: cache.byAccess.failed },
  ], null);
  replaceSectionRows('stats-vendor-cache-policy', [
    { label: 'Positive reuse interval at accepted validation', views: cache.byPolicy.positiveViews },
    { label: 'Reuse blocked at accepted validation', views: cache.byPolicy.blockedViews },
    { label: 'Both positive and blocked contexts', views: cache.byPolicy.mixedViews },
    { label: 'no-store — no feed body retained', views: cache.byBlocker.noStore },
    { label: 'private — no shared feed body retained', views: cache.byBlocker.private },
    { label: 'no-cache — validate before reuse', views: cache.byBlocker.noCache },
    { label: 'Invalid or duplicate lifetime information', views: cache.byBlocker.invalidLifetime },
    { label: 'Zero lifetime, including expired Expires', views: cache.byBlocker.zeroLifetime },
    { label: 'Invalid or overflowing Age value', views: cache.byBlocker.invalidAge },
    { label: 'Age exhausted the allowed lifetime', views: cache.byBlocker.ageExhausted },
  ], null);
  replaceSectionRows('stats-vendor-signatures', [
    { label: 'Declaration with a documented signing method', views: verification.vendorDocumentedViews },
    { label: 'Verified key from the documented origin', views: verification.vendorMatchingOriginViews },
    { label: 'Verified key from a different origin', views: verification.vendorDifferentOriginViews },
    { label: 'Declarations name conflicting signing origins', views: verification.vendorOriginConflictViews },
    { label: 'Selected proof matches one conflicting origin', views: verification.vendorConflictWithMatchingOriginViews },
    { label: 'Documented declaration; key not verified', views: verification.vendorNotVerifiedViews },
    { label: 'Matching origin and User-Agent covered', views: verification.vendorUserAgentBoundViews },
    { label: 'Has declarations without a configured method', views: verification.vendorUnmappedDeclarationViews },
    { label: 'Recognized stored method assessment', views: verification.vendorCheckRecognizedViews },
    { label: 'Unrecognized or inconsistent method assessment', views: verification.vendorCheckUnrecognizedViews },
    { label: 'Vendor check not recorded', views: verification.vendorCheckNotRecordedViews },
  ], null);
  replaceSectionRows('stats-directory-publication', data.byDirectoryPublication.map(row => ({ label: DIRECTORY_PUBLICATION_LABELS[row.basis], views: row.views })), null);
  renderComposition(data, state);
  renderKindSignatures(data, state);
  renderFetchMetadata(data);

  setStatus(excluded > 0 ? `${formatNumber(excluded)} excluded by the referral-abuse policy.` : 'Report loaded.', 'ready');
  const announcement = document.createElement('span'); announcement.className = 'sr-only';
  announcement.textContent = `Showing ${formatViewCount(data.totals.views, true)}. `;
  element('stats-status').prepend(announcement);
}

let currentData: StatsResponse | null = null;
let currentState = getState();
let activeRequest: AbortController | null = null;

async function load(state: ViewState): Promise<void> {
  activeRequest?.abort();
  const request = new AbortController();
  activeRequest = request;
  currentState = state;
  currentData = null;
  destroyChart();
  updateControls(state);
  renderScope(state);
  element('stats-period').hidden = true;
  setDashboardVisible(false);
  setStatus('Loading stats…', 'loading');

  try {
    const data = await fetchStats(state, request.signal);
    if (request !== activeRequest) return;
    currentData = data;
    renderDashboard(data, state);
    if (location.hash.startsWith('#stats-')) document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start' });
  } catch (error) {
    if (request.signal.aborted || request !== activeRequest) return;
    setDashboardVisible(false);
    setStatus('Unable to load stats.', 'error');
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'stats-retry';
    retry.textContent = 'Try again';
    retry.addEventListener('click', () => void load(currentState));
    element('stats-status').append(' ', retry);
    console.error(error);
  }
}

function changeSelection(nextTraffic: TrafficFilter, range: RangeFilter): void {
  let agent = currentState.agent, kind = currentState.kind;
  if (nextTraffic !== currentState.traffic && nextTraffic !== 'all') {
    const agentFits = currentData?.byKind.some(row => readerGroupOf(row.kind) === nextTraffic) ?? false;
    if (agent !== null && !agentFits) agent = null;
    if (kind !== null && !READER_GROUPS[nextTraffic].includes(kind)) kind = null;
  }
  const state: ViewState = { traffic: nextTraffic, range, path: currentState.path, agent, kind };
  if (state.traffic === currentState.traffic && state.range === currentState.range
    && state.path === currentState.path && state.agent === currentState.agent && state.kind === currentState.kind) return;
  pushState(state);
  void load(state);
}

document.getElementById('stats-traffic')?.addEventListener('change', event => {
  if (event.target instanceof HTMLSelectElement) changeSelection(parseTraffic(event.target.value, currentState.traffic), currentState.range);
});
document.querySelector('.stats-controls')?.addEventListener('click', event => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest('button');
  if (!(button instanceof HTMLButtonElement) || button.dataset.days === undefined) return;
  changeSelection(currentState.traffic, parseRange(button.dataset.days === '0' ? 'all' : `${button.dataset.days}d`));
});

element('stats-scope').addEventListener('click', event => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest('button');
  if (!(button instanceof HTMLButtonElement)) return;
  const filter = button.dataset.clearFilter;
  const state: ViewState = filter === 'path'
    ? { ...currentState, path: null }
    : filter === 'agent'
      ? { ...currentState, agent: null }
      : filter === 'kind'
        ? { ...currentState, kind: null }
        : currentState;
  if (state === currentState) return;
  pushState(state);
  void load(state);
});

window.addEventListener('popstate', () => {
  const state = getState();
  // Fragment navigation also emits popstate. Keep native section jumps in the page.
  if (state.range === currentState.range && state.traffic === currentState.traffic
    && state.path === currentState.path && state.agent === currentState.agent && state.kind === currentState.kind) return;
  void load(state);
});

new MutationObserver(() => {
  if (currentData) renderChart(currentData);
}).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

new ResizeObserver(() => {
  if (chart) chart.setSize({ width: Math.max(element('stats-chart').clientWidth, 1), height: CHART_HEIGHT });
}).observe(element('stats-chart'));

void load(currentState);

const chapterLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.stats-navigation a'));
const chapters = chapterLinks.flatMap(link => {
  const target = document.getElementById(link.hash.slice(1)); return target ? [{ link, target }] : [];
});
let chapterFrame = 0;
function updateChapter(): void {
  chapterFrame = 0;
  const boundary = (document.querySelector('.stats-navigation')?.getBoundingClientRect().height ?? 60) + 48;
  let active = chapters[0];
  for (const chapter of chapters) if (chapter.target.getClientRects().length > 0 && chapter.target.getBoundingClientRect().top <= boundary) active = chapter;
  for (const chapter of chapters) {
    if (chapter === active) chapter.link.setAttribute('aria-current', 'location');
    else chapter.link.removeAttribute('aria-current');
  }
}
window.addEventListener('scroll', () => { if (!chapterFrame) chapterFrame = requestAnimationFrame(updateChapter); }, { passive: true });
updateChapter();
