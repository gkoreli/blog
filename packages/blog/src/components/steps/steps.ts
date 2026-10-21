import { html } from '@nisli/core';
import type { TemplateResult } from '@nisli/core';

export function Steps({ items }: { items: { title: string; body: TemplateResult }[] }) {
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
