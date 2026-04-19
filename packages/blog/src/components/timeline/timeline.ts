import { staticHtml as html } from '@nisli/core/static';
import type { StaticResult } from '@nisli/core/static';

export function Timeline({ items }: { items: { date: string; event: StaticResult; note?: string }[] }) {
  return html`<div class="radar-timeline">
    ${items.map(t => html`<div class="tl-item">
      <div class="tl-date">${t.date}</div>
      <div class="tl-event">${t.event}</div>
      ${t.note ? html`<div class="tl-note">${t.note}</div>` : ''}
    </div>`)}
  </div>`;
}
