import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import type { StatsResponse, TrafficFilter } from '@gkoreli/analytics/contracts';
import '../styles/stats.css';

type RangeFilter = '7d' | '30d' | '90d' | 'all';
type ViewState = { range: RangeFilter; traffic: TrafficFilter };
type RankedItem = { label: string; views: number; href?: string };

const MAX_ITEMS = 10;
const CHART_HEIGHT = 300;
const DEFAULT_STATE: ViewState = { range: '30d', traffic: 'browser' };
const SPECIAL_COUNTRIES: Record<string, string> = {
  T1: '🔒 Tor',
  XX: '🌐 Unknown',
  A1: '🔒 Proxy',
  A2: '📡 Satellite',
  AP: '🌏 Asia-Pacific',
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

function parseTraffic(value: string | null): TrafficFilter {
  switch (value) {
    case 'browser':
    case 'bot':
    case 'ai':
    case 'all':
      return value;
    default:
      return DEFAULT_STATE.traffic;
  }
}

function getState(): ViewState {
  const params = new URLSearchParams(location.search);
  return {
    range: parseRange(params.get('range')),
    traffic: parseTraffic(params.get('traffic')),
  };
}

function pushState(state: ViewState): void {
  const params = new URLSearchParams();
  if (state.range !== DEFAULT_STATE.range) params.set('range', state.range);
  if (state.traffic !== DEFAULT_STATE.traffic) params.set('traffic', state.traffic);
  const query = params.toString();
  history.pushState({}, '', query ? `?${query}` : location.pathname);
}

function updateControls(state: ViewState): void {
  document.querySelectorAll<HTMLButtonElement>('[data-traffic]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.traffic === state.traffic));
  });
  const selectedDays = state.range === 'all' ? '0' : state.range.replace('d', '');
  document.querySelectorAll<HTMLButtonElement>('[data-days]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.days === selectedDays));
  });
}

async function fetchStats(state: ViewState, signal: AbortSignal): Promise<StatsResponse> {
  const params = new URLSearchParams({ range: state.range, traffic: state.traffic });
  const response = await fetch(`/api/stats?${params}`, { signal });
  if (!response.ok) throw new Error(`Stats request failed with ${response.status}`);
  const data: StatsResponse = await response.json();
  return data;
}

function getColors(): { link: string; border: string; muted: string } {
  const styles = getComputedStyle(document.documentElement);
  return {
    link: styles.getPropertyValue('--color-link').trim(),
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

function countryLabel(code: string): string {
  const special = SPECIAL_COUNTRIES[code];
  if (special) return special;
  if (code === 'EU') return '🇪🇺 EU';
  if (!/^[A-Z]{2}$/.test(code)) return `🌐 ${code}`;
  const points = [...code].map(character => 0x1F1E6 + character.charCodeAt(0) - 65);
  return `${String.fromCodePoint(...points)} ${code}`;
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
}

function setDashboardVisible(visible: boolean): void {
  const dashboard = element('stats-dashboard');
  dashboard.hidden = !visible;
  dashboard.setAttribute('aria-busy', String(!visible));
}

function renderPeriod(period: StatsResponse['period']): void {
  const granularity = period.granularity === 'hour' ? 'Hourly buckets' : 'Daily buckets';
  const partial = period.granularity === 'hour' ? 'current UTC hour is partial' : 'current UTC day is partial';
  element('stats-period').textContent = `${period.start} through ${period.end} UTC · ${granularity} · ${partial} · Updated ${formatUpdatedAt(period.updatedAt)}`;
}

function renderTotals(totals: StatsResponse['totals']): void {
  const values = [totals.views, totals.dailyClients];
  element('stats-totals').querySelectorAll<HTMLElement>('.stats-card').forEach((card, index) => {
    const value = card.querySelector<HTMLElement>('.skeleton, .stats-card-value');
    const total = values[index];
    if (!value || total === undefined) return;
    value.className = 'stats-card-value';
    value.textContent = formatNumber(total);
  });
}

function replaceSectionRows(containerId: string, items: RankedItem[]): void {
  const section = element(containerId);
  const heading = section.querySelector('h2');
  section.replaceChildren();
  if (heading) section.appendChild(heading);

  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'stats-empty';
    empty.textContent = 'No data for this selection.';
    section.appendChild(empty);
    return;
  }

  const max = items[0]?.views ?? 0;
  for (const item of items.slice(0, MAX_ITEMS)) {
    const row = document.createElement('div');
    row.className = 'stats-row';

    const bar = document.createElement('span');
    bar.className = 'stats-bar';
    bar.style.width = `${max > 0 ? (item.views / max) * 100 : 0}%`;
    bar.setAttribute('aria-hidden', 'true');

    const label = item.href ? document.createElement('a') : document.createElement('span');
    label.className = 'stats-label';
    label.textContent = item.label;
    if (label instanceof HTMLAnchorElement && item.href) label.href = item.href;

    const value = document.createElement('span');
    value.className = 'stats-value';
    value.textContent = formatViewCount(item.views);

    row.append(bar, label, value);
    section.appendChild(row);
  }
}

function pageHref(path: string): string | undefined {
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('?') && !path.includes('#')
    ? path
    : undefined;
}

function pageItem(row: StatsResponse['byPath'][number]): RankedItem {
  const item = { label: row.path, views: row.views };
  const href = pageHref(row.path);
  return href === undefined ? item : { ...item, href };
}

function renderDevices(rows: StatsResponse['byDevice'], totalViews: number, traffic: TrafficFilter): void {
  const section = element('stats-device-section');
  section.hidden = traffic !== 'browser';
  if (traffic !== 'browser') return;

  const viewsByType = new Map(rows.map(row => [row.deviceType, row.views]));
  const order = ['desktop', 'mobile', 'tablet'] as const;
  element('stats-devices').querySelectorAll<HTMLElement>('.stats-device').forEach((item, index) => {
    const device = order[index];
    if (!device) return;
    const views = viewsByType.get(device) ?? 0;
    const percentage = totalViews > 0 ? Math.round((views / totalViews) * 100) : 0;
    const value = item.querySelector<HTMLElement>('.skeleton, .stats-device-value');
    if (!value) return;
    value.className = 'stats-device-value';
    value.textContent = `${percentage}%`;
    value.title = formatViewCount(views, true);
  });
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
      { stroke: colors.muted, grid: { stroke: colors.border, width: 1 } },
      { stroke: colors.muted, grid: { stroke: colors.border, width: 1 }, size: 50 },
    ],
    series: [
      {},
      { label: 'Page views', stroke: colors.link, fill: translucent(colors.link), width: 2 },
      { label: hourly ? 'Daily IDs seen in hour' : 'Daily clients', stroke: colors.muted, width: 2 },
    ],
    legend: { live: true },
  };
  chart = new uPlot(options, alignedData, container);
}

function renderDashboard(data: StatsResponse, state: ViewState): void {
  if (data.totals.views === 0) {
    setDashboardVisible(false);
    setStatus('No page views were recorded for this selection.', 'empty');
    return;
  }
  setDashboardVisible(true);
  renderPeriod(data.period);
  renderTotals(data.totals);
  renderDevices(data.byDevice, data.totals.views, state.traffic);
  renderChart(data);
  replaceSectionRows('stats-pages', data.byPath.map(pageItem));
  replaceSectionRows('stats-referrers', data.byReferrer.map(row => ({ label: row.referrerHost, views: row.views })));
  replaceSectionRows('stats-countries', data.byCountry.map(row => ({ label: countryLabel(row.country), views: row.views })));
  const agentSection = element('stats-agents');
  agentSection.hidden = data.byAgent.length === 0;
  if (data.byAgent.length > 0) {
    const agents = data.byAgent.map(row => ({
      label: `${row.agentName} UA rule · ${row.trafficClass === 'ai' ? 'AI' : 'Bot'}`,
      views: row.views,
    }));
    replaceSectionRows('stats-agents', agents);
  }

  setStatus(`Showing ${formatViewCount(data.totals.views, true)}.`, 'ready');
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
  setDashboardVisible(false);
  setStatus('Loading stats…', 'loading');

  try {
    const data = await fetchStats(state, request.signal);
    if (request !== activeRequest) return;
    currentData = data;
    renderDashboard(data, state);
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

document.querySelector('.stats-controls')?.addEventListener('click', event => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest('button');
  if (!(button instanceof HTMLButtonElement)) return;

  const traffic = button.dataset.traffic;
  const days = button.dataset.days;
  const state: ViewState = {
    traffic: traffic ? parseTraffic(traffic) : currentState.traffic,
    range: days ? parseRange(days === '0' ? 'all' : `${days}d`) : currentState.range,
  };
  if (state.traffic === currentState.traffic && state.range === currentState.range) return;
  pushState(state);
  void load(state);
});

window.addEventListener('popstate', () => void load(getState()));

new MutationObserver(() => {
  if (currentData) renderChart(currentData);
}).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

new ResizeObserver(() => {
  if (chart) chart.setSize({ width: Math.max(element('stats-chart').clientWidth, 1), height: CHART_HEIGHT });
}).observe(element('stats-chart'));

void load(currentState);
