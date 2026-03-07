import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import '../styles/stats.css';

// --- Types ---

interface StatsResponse {
  period: { start: string; end: string };
  totals: { views: number; visitors: number; ai_fetches: number };
  by_path: { path: string; views: number; visitors: number }[];
  by_country: { country: string; views: number }[];
  by_day: { date: string; views: number; visitors: number }[];
  by_referrer: { referrer: string; views: number }[];
}

// --- Constants ---

const SPECIAL_COUNTRIES: Record<string, string> = {
  T1: '🔒 Tor', XX: '🌐 Unknown', A1: '🔒 Proxy', A2: '📡 Satellite', AP: '🌏 Asia-Pacific',
};

const MAX_ITEMS = 10;
const CHART_HEIGHT = 300;

// --- Helpers ---

function $(id: string) { return document.getElementById(id)!; }

function getColors() {
  const s = getComputedStyle(document.documentElement);
  const v = (p: string) => s.getPropertyValue(p).trim();
  return { link: v('--color-link'), border: v('--color-border'), muted: v('--color-text-muted'), bg: v('--color-bg') };
}

function countryLabel(code: string): string {
  if (SPECIAL_COUNTRIES[code]) return SPECIAL_COUNTRIES[code];
  if (code === 'EU') return '🇪🇺 EU';
  try {
    const flag = String.fromCodePoint(...[...code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
    return `${flag} ${code}`;
  } catch { return `🌐 ${code}`; }
}

function getDays(): number {
  return Number(new URLSearchParams(location.search).get('days')) || 30;
}

// --- Data ---

async function fetchStats(days: number): Promise<StatsResponse> {
  const r = await fetch(`/api/stats?days=${days}`);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

function toUPlotData(byDay: StatsResponse['by_day']): uPlot.AlignedData {
  // uPlot needs length ≥ 2 — pad with zero if single entry
  let rows = byDay;
  if (rows.length === 0) {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
    rows = [{ date: yesterday, views: 0, visitors: 0 }, { date: today, views: 0, visitors: 0 }];
  } else if (rows.length === 1) {
    const prev = new Date(new Date(rows[0].date).getTime() - 86400_000).toISOString().slice(0, 10);
    rows = [{ date: prev, views: 0, visitors: 0 }, ...rows];
  }
  return [
    rows.map(r => new Date(r.date + 'T00:00:00').getTime() / 1000),
    rows.map(r => r.views),
    rows.map(r => r.visitors),
  ];
}

// --- Renderers ---

function renderTotals(totals: StatsResponse['totals']) {
  const el = $('stats-totals');
  const cards = el.querySelectorAll('.stats-card');
  const values = [totals.views, totals.visitors, totals.ai_fetches];
  cards.forEach((card, i) => {
    const val = card.querySelector('.skeleton, .stats-card-value');
    if (val) { val.className = 'stats-card-value'; val.textContent = values[i].toLocaleString(); }
  });
}

let chart: uPlot | null = null;

function renderChart(byDay: StatsResponse['by_day'], totals: StatsResponse['totals'], days: number) {
  const el = $('stats-chart');
  el.innerHTML = '';
  el.setAttribute('aria-label', `Daily views: ${totals.views} views, ${totals.visitors} visitors over the last ${days} days`);

  const c = getColors();
  const data = toUPlotData(byDay);

  const opts: uPlot.Options = {
    width: el.clientWidth,
    height: CHART_HEIGHT,
    scales: { x: { time: true }, y: { range: (u, min, max) => [0, Math.max(max, 1)] } },
    axes: [
      { stroke: c.muted, grid: { stroke: c.border, width: 1 } },
      { stroke: c.muted, grid: { stroke: c.border, width: 1 }, size: 50 },
    ],
    series: [
      {},
      { label: 'Views', stroke: c.link, fill: c.link + '26', width: 2 },
      { label: 'Visitors', stroke: c.muted, width: 2 },
    ],
    cursor: {
      points: { fill: (u, sidx) => u.series[sidx].stroke as string, size: 8 },
    },
    legend: { live: true },
  };

  if (chart) chart.destroy();
  chart = new uPlot(opts, data, el);
}

function renderList(items: { label: string; value: number }[], containerId: string) {
  const el = $(containerId);
  const h2 = el.querySelector('h2')!;
  el.innerHTML = '';
  el.appendChild(h2);

  if (!items.length) {
    el.insertAdjacentHTML('beforeend', '<div class="stats-empty">No data for this period</div>');
    return;
  }

  const max = items[0].value;
  for (const item of items.slice(0, MAX_ITEMS)) {
    const pct = max > 0 ? (item.value / max) * 100 : 0;
    const row = document.createElement('div');
    row.className = 'stats-row';
    row.innerHTML = `<div class="stats-bar" style="width:${pct}%"></div><span class="stats-label">${item.label}</span><span class="stats-value">${item.value.toLocaleString()}</span>`;
    el.appendChild(row);
  }
}

function renderAll(data: StatsResponse, days: number) {
  renderTotals(data.totals);
  renderChart(data.by_day, data.totals, days);
  renderList(data.by_path.map(p => ({ label: p.path, value: p.views })), 'stats-pages');
  renderList(data.by_referrer.map(r => ({ label: r.referrer, value: r.views })), 'stats-referrers');
  renderList(data.by_country.map(c => ({ label: countryLabel(c.country), value: c.views })), 'stats-countries');
}

function showError() {
  for (const id of ['stats-totals', 'stats-chart', 'stats-pages', 'stats-referrers', 'stats-countries']) {
    $(id).innerHTML = '';
  }
  $('stats-chart').innerHTML = '<div class="stats-error">Unable to load stats. Try refreshing.</div>';
}

// --- Init ---

let currentData: StatsResponse | null = null;

function highlightPill(days: number) {
  document.querySelectorAll('.stats-pills button').forEach(b => {
    b.classList.toggle('active', Number((b as HTMLElement).dataset.days) === days);
  });
}

async function load(days: number) {
  highlightPill(days);
  try {
    currentData = await fetchStats(days);
    renderAll(currentData, days);
  } catch { showError(); }
}

// Period pill clicks — pushState + re-fetch
document.querySelector('.stats-pills')!.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('button');
  if (!btn) return;
  const days = Number(btn.dataset.days);
  history.pushState({}, '', `?days=${days}`);
  load(days);
});

// Back button
window.addEventListener('popstate', () => load(getDays()));

// Theme change — recreate chart
new MutationObserver(() => {
  if (currentData) renderChart(currentData.by_day, currentData.totals, getDays());
}).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

// Responsive chart
new ResizeObserver(() => {
  if (chart) chart.setSize({ width: $('stats-chart').clientWidth, height: CHART_HEIGHT });
}).observe($('stats-chart'));

// Go
load(getDays());
