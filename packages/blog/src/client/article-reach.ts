import { consistentArticleReach, type ArticleReachReport } from '@gkoreli/analytics/article-reach-contract';
import { addCalendarDays, calendarDaysBetween, timePresentation } from '@gkoreli/time';
import { metricTileHtml } from '../lib/data-display.js';
import { tableRegionHtml } from '../lib/reading-display.js';
import { enhanceReadingTables } from './reading.js';
import '../styles/article-reach.css';

function element(id: string): HTMLElement {
  const found = document.getElementById(id);
  if (!found) throw new Error('Missing report element');
  return found;
}
const number = (value: number) => value.toLocaleString();
const reportTime = timePresentation();
let disposeTables: () => void = () => {};
function refreshTables(): void { disposeTables(); disposeTables = enhanceReadingTables(element('reach-report')); }
function showTable(id: string, table: HTMLTableElement): void {
  element(id).innerHTML = tableRegionHtml(table.caption?.textContent ?? 'Report comparison', table.outerHTML);
}
const percent = (part: number, whole: number) => whole === 0 ? '0%' : (part / whole * 100).toFixed(1) + '%';
function table(headers: string[], caption: string): { table: HTMLTableElement; body: HTMLTableSectionElement } {
  const table = document.createElement('table'), title = table.createCaption(), head = table.createTHead().insertRow(), body = table.createTBody();
  title.textContent = caption;
  for (const text of headers) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = text; head.append(th); }
  return { table, body };
}
function cell(row: HTMLTableRowElement, value: number | string): HTMLTableCellElement {
  const td = row.insertCell(); td.textContent = typeof value === 'number' ? number(value) : value; return td;
}
function overview(data: ArticleReachReport): void {
  const metrics = data.articleTotals;
  element('reach-overview').innerHTML = [
    { label: 'Article events', value: metrics.views, detail: 'All recorded article requests in this category' },
    { label: 'Reported external', value: metrics.externalViews, detail: 'A referring site was reported' },
    { label: 'Within this blog', value: metrics.internalViews, detail: 'A recognized internal page was reported' },
    { label: 'No referrer', value: metrics.unattributedViews, detail: 'Origin was not supplied' },
    { label: 'Unknown source evidence', value: metrics.unknownSourceViews, detail: 'Unusable, inconsistent or earlier merged evidence' },
  ].map(metric => metricTileHtml({ ...metric, value: number(metric.value) })).join('');
}
function articles(data: ArticleReachReport): void {
  const sort = element('reach-sort');
  const outside = sort instanceof HTMLSelectElement && sort.value === 'outside';
  const outsideArticle = sort instanceof HTMLSelectElement && sort.value === 'outside-article';
  const rank = (post: ArticleReachReport['articles'][number]) => post.totals.views - (outside ? post.totals.largestSourceViews : outsideArticle ? post.largestExternalSource.views : 0);
  const posts = [...data.articles].sort((a, b) => rank(b) - rank(a) || a.path.localeCompare(b.path));
  const { table: result, body } = table(['Article / date / source concentration', 'Total', 'Outside site’s top source', 'External', 'Internal', 'No referrer', 'Unknown'], 'Browser-signal page events by article and reported source');
  for (const post of posts) {
    const row = body.insertRow(), title = document.createElement('th'), link = document.createElement('a'), date = document.createElement('span'); title.scope = 'row';
    link.href = post.path; link.textContent = post.title; date.className = 'reach-published';
    const first = post.publishedOn > data.period.startInclusive ? post.publishedOn : data.period.startInclusive;
    const days = Math.max(0, calendarDaysBetween(first, data.period.endExclusive));
    date.textContent = `${reportTime.calendarDate(post.publishedOn)} · ${days} ${days === 1 ? 'day' : 'days'} in this window`;
    title.append(link, date); row.append(title);
    const m = post.totals, source = post.largestExternalSource;
    cell(row, m.views); cell(row, m.views - m.largestSourceViews);
    const concentration = document.createElement('span'); concentration.className = 'reach-published reach-source';
    concentration.textContent = source.views === 0 ? 'No external referrer recorded' : `Top external source: ${number(source.views)} of ${number(m.externalViews)} (${percent(source.views, m.externalViews)}) · ${source.name ?? 'name withheld'}. ${number(m.views - source.views)} total events outside this source.`;
    title.append(concentration);
    for (const value of [m.externalViews, m.internalViews, m.unattributedViews, m.unknownSourceViews]) cell(row, value);
  }
  showTable('reach-articles', result);
}
function history(data: ArticleReachReport): void {
  const select = element('reach-history-scope');
  const scope = select instanceof HTMLSelectElement ? select.value : 'site';
  const grouped = new Map<string, { collection: string | null; classifier: string | null; observationSource: string; representation: string; views: number; weeks: number[]; unrecognizedTimeViews: number }>();
  for (const row of data.measurementHistory) {
    if (scope === 'articles' ? row.path === null : scope !== 'site' && row.path !== scope) continue;
    const key = JSON.stringify([row.collection, row.classifier, row.observationSource, row.representation]);
    const combined = grouped.get(key) ?? { ...row, views: 0, weeks: [0, 0, 0, 0], unrecognizedTimeViews: 0 };
    combined.views += row.views; combined.unrecognizedTimeViews += row.unrecognizedTimeViews;
    for (const [i, count] of row.weeks.entries()) combined.weeks[i] = (combined.weeks[i] ?? 0) + count;
    grouped.set(key, combined);
  }
  if (grouped.size === 0) { element('reach-history').textContent = 'No events in this selection.'; return; }
  const { table: result, body } = table(['Measurement method', ...data.weeks.map(w => reportTime.calendarDate(w.startInclusive)), 'Total', 'Unknown time'], `Weekly Browser-signal events by stored collection, classifier, source and representation; week starts in ${reportTime.timeZone}`);
  const stamp = (value: string | null) => value === null ? 'not recorded' : value === 'unrecognized' ? 'unrecognized stamp' : value;
  for (const [, profile] of [...grouped].sort(([a], [b]) => a.localeCompare(b))) {
    const row = body.insertRow(), label = document.createElement('th'); label.scope = 'row';
    label.textContent = `Collector ${stamp(profile.collection)} · classifier ${stamp(profile.classifier)}`;
    const delivery = document.createElement('span'); delivery.className = 'reach-published';
    delivery.textContent = `Source: ${profile.observationSource} · representation: ${profile.representation}`;
    label.append(delivery); row.append(label);
    for (const count of [...profile.weeks, profile.views, profile.unrecognizedTimeViews]) cell(row, count);
  }
  showTable('reach-history', result);
}
function render(data: ArticleReachReport): void {
  element('reach-period').textContent = `${reportTime.dateRange(data.period.startInclusive, addCalendarDays(data.period.endExclusive, -1))} · ${reportTime.timeZone} · Updated ${reportTime.instant(data.period.updatedAt)}`;
  overview(data);
  const leader = data.largestExternalSource;
  element('reach-concentration').textContent = leader.views === 0
    ? 'No reported external source in this selection.'
    : `${leader.name ?? 'One external source (name not public)'} accounts for ${number(leader.views)} of ${number(data.site.views)} site events (${percent(leader.views, data.site.views)}), including ${number(data.articleTotals.largestSourceViews)} article events. It contributes ${percent(leader.views, data.site.externalViews)} of reported external site events.`;
  const { table: weekly, body } = table(['Local dates', 'Site events', 'Site outside largest', 'Article events', 'Articles outside largest'], `Four completed seven-day periods in ${reportTime.timeZone}; today omitted`);
  for (const week of data.weeks) {
    const row = body.insertRow(), label = document.createElement('th'); label.scope = 'row'; label.textContent = reportTime.dateRange(week.startInclusive, addCalendarDays(week.endExclusive, -1)); row.append(label);
    for (const value of [week.site.views, week.site.views - week.site.largestSourceViews, week.articles.views, week.articles.views - week.articles.largestSourceViews]) cell(row, value);
  }
  showTable('reach-weeks', weekly);
  element('reach-profiles').textContent = `${number(data.classification.recordedProfiles)} distinct stored classifier identifiers; ${number(data.classification.unversionedViews)} site events lack a classifier stamp. ${number(data.site.unrecognizedTimeViews)} events have unrecognized timestamps and are outside the weekly rows, while remaining in the totals.`;
  const scope = element('reach-history-scope');
  if (!(scope instanceof HTMLSelectElement)) throw new Error('Missing history selection');
  scope.replaceChildren();
  for (const [value, label] of [['site', 'All site events'], ['articles', 'All article events'], ...data.articles.map(a => [a.path, a.title])]) {
    const option = document.createElement('option'); option.value = value ?? ''; option.textContent = label ?? ''; scope.append(option);
  }
  history(data);
  articles(data);
  element('reach-policy').textContent = `Owner-marked observations are excluded. Referral policy ${data.referralPolicy.version} excludes ${number(data.referralPolicy.excludedViews)} additional Browser-signal observations in this window. The largest-source comparison does not change that policy or stored records.`;
  element('reach-status').textContent = data.site.views === 0 ? 'No stored Browser signals in this completed window.' : 'Report ready.';
  element('reach-report').hidden = false; element('reach-report').setAttribute('aria-busy', 'false');
  refreshTables();
}
let current: ArticleReachReport | null = null;
element('reach-sort').addEventListener('change', () => { if (current) { articles(current); refreshTables(); } });
element('reach-history-scope').addEventListener('change', () => { if (current) { history(current); refreshTables(); } });
async function load(): Promise<void> {
  element('reach-status').textContent = 'Loading the report…'; element('reach-report').hidden = true;
  try {
    const query = new URLSearchParams({ timeZone: reportTime.timeZone });
    const api = `/api/readership?${query}`;
    const json = document.getElementById('reach-json-link'); if (json instanceof HTMLAnchorElement) json.href = api;
    const response = await fetch(api); if (!response.ok) throw new Error('Report unavailable');
    const data: unknown = await response.json(); if (!consistentArticleReach(data)) throw new Error('Report incomplete');
    const calendarSamples = Array.from({ length: 29 }, (_, day) => addCalendarDays(data.period.startInclusive, day) + 'T12:00:00Z');
    if (!reportTime.matchesCalendar(data.period.timeZone, [data.period.updatedAt, ...calendarSamples])) throw new Error('Localized report unavailable');
    current = data; render(data);
  } catch {
    current = null; element('reach-report').setAttribute('aria-busy', 'false');
    const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'stats-retry'; retry.textContent = 'Try again'; retry.addEventListener('click', () => void load());
    element('reach-status').replaceChildren('The report is unavailable or incomplete. ', retry);
  }
}
void load();
