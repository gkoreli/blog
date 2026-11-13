export interface MetricTile {
  label: string;
  value: string | null;
  detail: string;
}
export interface RankedItem {
  label: string;
  views: number;
  href?: string;
  openHref?: string;
  openAriaLabel?: string;
  detail?: string;
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
  const label = href ? `<a class="data-row-label stats-label" href="${href}">${escape(item.label)}</a>` : `<span class="data-row-label stats-label">${escape(item.label)}</span>`;
  return `<div class="data-row stats-row"><span class="data-row-bar stats-bar" aria-hidden="true" style="width:${width}%"></span>${label}<span class="data-row-actions stats-row-actions"><span class="data-row-value stats-value">${item.views.toLocaleString('en-US')}<span class="data-row-unit"> ${item.views === 1 ? 'view' : 'views'}</span>${item.detail ? `<small>${escape(item.detail)}</small>` : ''}</span>${open ? `<a class="data-row-open stats-open" href="${open}" aria-label="${escape(item.openAriaLabel ?? `Open ${item.label}`)}">Open</a>` : ''}</span></div>`;
}
