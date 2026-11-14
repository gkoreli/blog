export interface MetricTile {
  label: string;
  value: string | null;
  detail: string;
}
export interface RankedItem {
  label: string;
  description?: string;
  views: number;
  href?: string;
  openHref?: string;
  openAriaLabel?: string;
  detail?: string;
}

export interface DataFact {
  label: string;
  value: number;
}

/** Coverage counts remain independent facts; adjacency does not imply additivity. */
export function dataFactsHtml(facts: readonly DataFact[]): string {
  return facts.map(fact => `<div><dt>${escape(fact.label)}</dt><dd>${fact.value.toLocaleString('en-US')}</dd></div>`).join('');
}

function escape(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);
}
function internalHref(value: string | undefined): string | undefined {
  return value?.startsWith('/') && !value.startsWith('//') && !/[\\\u0000-\u0020]/.test(value) ? escape(value) : undefined;
}

/** Fixed markup shared by Stats and Design Language; captured strings are escaped. */
export function metricTileHtml({ label, value, detail }: MetricTile): string {
  return `<div class="data-metric"><span class="data-metric-label">${escape(label)}</span><strong class="data-metric-value${value === null ? ' skeleton skeleton-value' : ''}">${value === null ? '' : escape(value)}</strong><span class="data-metric-detail">${escape(detail)}</span></div>`;
}

/** Bars compare rows with the largest value; the printed number remains authoritative. */
export function rankedRowHtml(item: RankedItem, maximum: number): string {
  const width = Number.isFinite(item.views) && maximum > 0 ? Math.min(100, Math.max(0, item.views / maximum * 100)) : 0;
  const href = internalHref(item.href), open = internalHref(item.openHref);
  const text = `<span class="data-row-text"><span class="data-row-title">${escape(item.label)}</span>${item.description ? `<small class="data-row-description">${escape(item.description)}</small>` : ''}</span>`;
  const label = href ? `<a class="data-row-label stats-label" href="${href}">${text}</a>` : `<span class="data-row-label stats-label">${text}</span>`;
  return `<div class="data-row stats-row"><span class="data-row-bar stats-bar" aria-hidden="true" style="width:${width}%"></span><div class="data-row-identity">${label}</div><span class="data-row-actions stats-row-actions"><span class="data-row-value stats-value">${item.views.toLocaleString('en-US')}<span class="data-row-unit"> ${item.views === 1 ? 'view' : 'views'}</span>${item.detail ? `<small>${escape(item.detail)}</small>` : ''}</span>${open ? `<a class="data-row-open stats-open" href="${open}" aria-label="${escape(item.openAriaLabel ?? `Open ${item.label}`)}">Open</a>` : ''}</span></div>`;
}

export interface EvidenceTableRow {
  group: string;
  groupHref?: string;
  cells: readonly string[];
  views: number;
}

/** Every input row is retained. Group context replaces a repeated column, never evidence cells. */
export function groupedEvidenceTableHtml(caption: string, headings: readonly string[], rows: readonly EvidenceTableRow[]): string {
  const groups = new Map<string, { href: string | undefined; rows: EvidenceTableRow[]; total: number }>();
  for (const row of rows) {
    const group = groups.get(row.group) ?? { href: row.groupHref, rows: [], total: 0 };
    group.rows.push(row); group.total += row.views; groups.set(row.group, group);
  }
  const bodies = [...groups.entries()].sort((a, b) => b[1].total - a[1].total).map(([label, group]) => {
    const href = internalHref(group.href);
    const title = href ? `<a href="${href}">${escape(label)}</a>` : escape(label);
    return `<tbody><tr class="data-table-group"><th scope="rowgroup" colspan="${headings.length + 1}"><span class="data-table-group-name">${title}</span><span class="data-table-group-total">${group.total.toLocaleString('en-US')} ${group.total === 1 ? 'request' : 'requests'}</span></th></tr>${group.rows.map(row => `<tr class="data-table-record">${row.cells.map((cell, index) => index === 0 ? `<th scope="row">${escape(cell)}</th>` : `<td>${escape(cell)}</td>`).join('')}<td class="data-table-number">${row.views.toLocaleString('en-US')}</td></tr>`).join('')}</tbody>`;
  }).join('');
  return `<table class="data-evidence-table"><caption><span class="data-table-caption-text">${escape(caption)}</span></caption><thead><tr>${headings.map(heading => `<th scope="col">${escape(heading)}</th>`).join('')}<th scope="col" class="data-table-number">Requests</th></tr></thead>${bodies}</table>`;
}
