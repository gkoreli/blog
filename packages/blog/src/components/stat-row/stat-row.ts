import { staticHtml as html } from '@nisli/core/static';
import type { StaticResult } from '@nisli/core/static';

export function StatRow({ items }: { items: { value: string; label: StaticResult }[] }) {
  const columns = Math.max(1, Math.min(items.length, 4));

  return html`<div class="stat-row" style="--stat-columns: ${columns}">
    ${items.map(s => html`<div class="stat-block">
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>`)}
  </div>`;
}
