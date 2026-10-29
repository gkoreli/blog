import { consistentArticleReach, type ArticleReachReport } from '@gkoreli/analytics/article-reach-contract';
import '../styles/article-reach.css';

function element(id: string): HTMLElement {
  const found = document.getElementById(id);
  if (!found) throw new Error('Missing report element');
  return found;
}
const number = (value: number) => value.toLocaleString();
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
  const cards = element('reach-overview'); cards.replaceChildren();
  const metrics = data.articleTotals;
  for (const [label, value] of [['Article events', metrics.views], ['Reported external', metrics.externalViews], ['Within this blog', metrics.internalViews], ['No referrer', metrics.unattributedViews], ['Unknown source evidence', metrics.unknownSourceViews]]) {
    const card = document.createElement('div'), count = document.createElement('div'), name = document.createElement('div');
    card.className = 'stats-card'; count.className = 'stats-card-value'; name.className = 'stats-card-label';
    count.textContent = typeof value === 'number' ? number(value) : String(value); name.textContent = String(label); card.append(count, name); cards.append(card);
  }
}
function articles(data: ArticleReachReport): void {
  const sort = element('reach-sort');
  const outside = sort instanceof HTMLSelectElement && sort.value === 'outside';
  const rank = (post: ArticleReachReport['articles'][number]) => post.totals.views - (outside ? post.totals.largestSourceViews : 0);
  const posts = [...data.articles].sort((a, b) => rank(b) - rank(a) || a.path.localeCompare(b.path));
  const { table: result, body } = table(['Article / publication date', 'Total', 'Outside largest', 'External', 'Internal', 'No referrer', 'Unknown'], 'Browser-signal page events by article and reported source');
  for (const post of posts) {
    const row = body.insertRow(), title = document.createElement('th'), link = document.createElement('a'), date = document.createElement('span'); title.scope = 'row';
    link.href = post.path; link.textContent = post.title; date.className = 'reach-published';
    const first = Math.max(Date.parse(post.publishedOn + 'T00:00:00Z'), Date.parse(data.period.startInclusive + 'T00:00:00Z'));
    const days = Math.max(0, Math.round((Date.parse(data.period.endExclusive + 'T00:00:00Z') - first) / 86_400_000));
    date.textContent = `${post.publishedOn} · ${days} ${days === 1 ? 'day' : 'days'} in this window`;
    title.append(link, date); row.append(title);
    const m = post.totals; for (const value of [m.views, m.views - m.largestSourceViews, m.externalViews, m.internalViews, m.unattributedViews, m.unknownSourceViews]) cell(row, value);
  }
  element('reach-articles').replaceChildren(result);
}
function render(data: ArticleReachReport): void {
  element('reach-period').textContent = `${data.period.startInclusive} 00:00 inclusive → ${data.period.endExclusive} 00:00 exclusive, UTC. Calculated ${data.period.updatedAt}.`;
  overview(data);
  const leader = data.largestExternalSource;
  element('reach-concentration').textContent = leader.views === 0
    ? 'No reported external source in this selection.'
    : `${leader.name ?? 'One external source (name not public)'} accounts for ${number(leader.views)} of ${number(data.site.views)} site events (${percent(leader.views, data.site.views)}), including ${number(data.articleTotals.largestSourceViews)} article events. It contributes ${percent(leader.views, data.site.externalViews)} of reported external site events.`;
  const { table: weekly, body } = table(['UTC interval [start, end)', 'Site events', 'Site outside largest', 'Article events', 'Articles outside largest'], 'Four consecutive seven-day intervals; today omitted');
  for (const week of data.weeks) {
    const row = body.insertRow(), label = document.createElement('th'); label.scope = 'row'; label.textContent = `${week.startInclusive} → ${week.endExclusive}`; row.append(label);
    for (const value of [week.site.views, week.site.views - week.site.largestSourceViews, week.articles.views, week.articles.views - week.articles.largestSourceViews]) cell(row, value);
  }
  element('reach-weeks').replaceChildren(weekly);
  element('reach-profiles').textContent = `${number(data.classification.recordedProfiles)} distinct stored classifier identifiers; ${number(data.classification.unversionedViews)} site events lack a classifier stamp. ${number(data.site.unrecognizedTimeViews)} events have unrecognized timestamps and are outside the weekly rows, while remaining in the totals.`;
  articles(data);
  element('reach-policy').textContent = `Owner-marked observations are excluded. Referral policy ${data.referralPolicy.version} excludes ${number(data.referralPolicy.excludedViews)} additional Browser-signal observations in this window. The largest-source comparison does not change that policy or stored records.`;
  element('reach-status').textContent = data.site.views === 0 ? 'No stored Browser signals in this completed window.' : 'Report ready.';
  element('reach-report').hidden = false; element('reach-report').setAttribute('aria-busy', 'false');
}
let current: ArticleReachReport | null = null;
element('reach-sort').addEventListener('change', () => { if (current) articles(current); });
async function load(): Promise<void> {
  element('reach-status').textContent = 'Loading the report…'; element('reach-report').hidden = true;
  try {
    const response = await fetch('/api/readership'); if (!response.ok) throw new Error('Report unavailable');
    const data: unknown = await response.json(); if (!consistentArticleReach(data)) throw new Error('Report incomplete');
    current = data; render(data);
  } catch {
    current = null; element('reach-report').setAttribute('aria-busy', 'false');
    const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'stats-retry'; retry.textContent = 'Try again'; retry.addEventListener('click', () => void load());
    element('reach-status').replaceChildren('The report is unavailable or incomplete. ', retry);
  }
}
void load();
