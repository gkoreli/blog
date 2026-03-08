import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import '../styles/stats.css';
import { localToday, localYesterday, prevDay, toUnixLocal } from '../lib/dates.js';

// --- Types ---

type VisitorFilter = 'human' | 'bot' | 'ai' | 'all';

interface StatsResponse {
  period: { start: string; end: string };
  totals: { views: number; visitors: number; ai_fetches: number };
  by_path: { path: string; views: number; visitors: number }[];
  by_country: { country: string; views: number }[];
  by_day: { date: string; views: number; visitors: number }[];
  by_referrer: { referrer: string; views: number }[];
  by_device: { device_type: string; views: number }[];
}

// --- Constants ---

const SPECIAL_COUNTRIES: Record<string, string> = {
  T1: '🔒 Tor', XX: '🌐 Unknown', A1: '🔒 Proxy', A2: '📡 Satellite', AP: '🌏 Asia-Pacific',
};

const VALID_VISITORS = new Set<VisitorFilter>(['human', 'bot', 'ai', 'all']);
const MAX_ITEMS = 10;
const CHART_HEIGHT = 300;
const TZ_OFFSET = new Date().getTimezoneOffset();

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

function hexToFill(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// --- URL State ---

function getParams(): { days: number; visitor: VisitorFilter } {
  const p = new URLSearchParams(location.search);
  const days = p.has('days') ? Number(p.get('days')) : 30;
  const v = p.get('visitor') as VisitorFilter | null;
  return { days, visitor: v && VALID_VISITORS.has(v) ? v : 'human' };
}

function pushParams(days: number, visitor: VisitorFilter) {
  const p = new URLSearchParams();
  p.set('days', String(days));
  if (visitor !== 'human') p.set('visitor', visitor);
  history.pushState({}, '', `?${p}`);
}

// --- Data ---

async function fetchStats(days: number, visitor: VisitorFilter): Promise<StatsResponse> {
  const r = await fetch(`/api/stats?days=${days}&tz=${TZ_OFFSET}&visitor=${visitor}`);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

function toUPlotData(byDay: StatsResponse['by_day']): uPlot.AlignedData {
  let rows = byDay;
  if (rows.length === 0) {
    rows = [{ date: localYesterday(), views: 0, visitors: 0 }, { date: localToday(), views: 0, visitors: 0 }];
  } else if (rows.length === 1) {
    rows = [{ date: prevDay(rows[0].date), views: 0, visitors: 0 }, ...rows];
  }
  return [
    rows.map(r => toUnixLocal(r.date)),
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
  el.setAttribute('aria-label', `Daily views: ${totals.views} views, ${totals.visitors} visitors${days > 0 ? ` over the last ${days} days` : ''}`);

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
      { label: 'Views', stroke: c.link, fill: hexToFill(c.link, 0.15), width: 2 },
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
    row.innerHTML = `<div class="stats-bar" style="width:${pct}%"></div><span class="stats-label">${esc(item.label)}</span><span class="stats-value">${item.value.toLocaleString()}</span>`;
    el.appendChild(row);
  }
}

function renderDevices(byDevice: StatsResponse['by_device'], totalViews: number) {
  const el = $('stats-devices');
  const lookup: Record<string, number> = {};
  for (const d of byDevice) lookup[d.device_type] = d.views;
  const order = ['desktop', 'mobile', 'tablet'] as const;
  const items = el.querySelectorAll('.stats-device');
  items.forEach((item, i) => {
    const type = order[i];
    const views = lookup[type] ?? 0;
    const pct = totalViews > 0 ? Math.round((views / totalViews) * 100) : 0;
    const span = item.querySelector('.skeleton, .stats-device-value');
    if (span) { span.className = 'stats-device-value'; span.textContent = `${pct}%`; }
  });
}

function renderAll(data: StatsResponse, days: number) {
  renderTotals(data.totals);
  renderDevices(data.by_device, data.totals.views);
  renderChart(data.by_day, data.totals, days);
  renderList(data.by_path.map(p => ({ label: p.path, value: p.views })), 'stats-pages');
  renderList(data.by_referrer.map(r => ({ label: r.referrer, value: r.views })), 'stats-referrers');
  renderList(data.by_country.map(c => ({ label: countryLabel(c.country), value: c.views })), 'stats-countries');
}

function showError() {
  $('stats-chart').innerHTML = '<div class="stats-error">Unable to load stats. Try refreshing.</div>';
  for (const id of ['stats-pages', 'stats-referrers', 'stats-countries']) {
    const el = $(id);
    const h2 = el.querySelector('h2')!;
    el.innerHTML = '';
    el.appendChild(h2);
  }
}

// --- Init ---

let currentData: StatsResponse | null = null;
let loadId = 0;

function highlightPills(days: number, visitor: VisitorFilter) {
  document.querySelectorAll('.stats-pills button').forEach(b => {
    b.classList.toggle('active', Number((b as HTMLElement).dataset.days) === days);
  });
  document.querySelectorAll('.stats-visitor-pills button').forEach(b => {
    b.classList.toggle('active', (b as HTMLElement).dataset.visitor === visitor);
  });
}

async function load(days: number, visitor: VisitorFilter) {
  highlightPills(days, visitor);
  const id = ++loadId;
  try {
    const data = await fetchStats(days, visitor);
    if (id !== loadId) return;
    currentData = data;
    renderAll(currentData, days);
  } catch {
    if (id !== loadId) return;
    showError();
  }
}

// Period pill clicks
document.querySelector('.stats-pills')!.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('button');
  if (!btn) return;
  const days = Number(btn.dataset.days);
  const { visitor } = getParams();
  pushParams(days, visitor);
  load(days, visitor);
});

// Visitor type pill clicks
document.querySelector('.stats-visitor-pills')!.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('button');
  if (!btn) return;
  const visitor = btn.dataset.visitor as VisitorFilter;
  const { days } = getParams();
  pushParams(days, visitor);
  load(days, visitor);
});

// Back button
window.addEventListener('popstate', () => { const p = getParams(); load(p.days, p.visitor); });

// Theme change — recreate chart
new MutationObserver(() => {
  if (currentData) renderChart(currentData.by_day, currentData.totals, getParams().days);
}).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

// Responsive chart
new ResizeObserver(() => {
  if (chart) chart.setSize({ width: $('stats-chart').clientWidth, height: CHART_HEIGHT });
}).observe($('stats-chart'));

// Go
const init = getParams();
load(init.days, init.visitor);
