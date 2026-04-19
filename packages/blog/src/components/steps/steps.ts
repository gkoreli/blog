import { staticHtml as html } from '@nisli/core/static';
import type { StaticResult } from '@nisli/core/static';

export function Steps({ items }: { items: { title: string; body: StaticResult }[] }) {
  return html`<div class="proc-steps">
    ${items.map((s, i) => html`<div class="proc-step">
      <div class="proc-step-n">${String(i + 1)}</div>
      <div class="proc-step-body">
        <h4>${s.title}</h4>
        <p>${s.body}</p>
      </div>
    </div>`)}
  </div>`;
}
