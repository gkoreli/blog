import { html } from '@nisli/core';
import type { TemplateResult } from '@nisli/core';

export function StatRow({ items }: { items: { value: string; label: TemplateResult }[] }) {
  const columns = Math.max(1, Math.min(items.length, 4));

  return html`<div class="stat-row" style="--stat-columns: ${columns}">
    ${items.map(s => html`<div class="stat-block">
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>`)}
  </div>`;
}
