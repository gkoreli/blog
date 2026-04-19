import { staticHtml as html } from '@nisli/core/static';
import type { StaticResult } from '@nisli/core/static';

export function StatRow({ items }: { items: { value: string; label: StaticResult }[] }) {
  return html`<div class="stat-row">
    ${items.map(s => html`<div class="stat-block">
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>`)}
  </div>`;
}
