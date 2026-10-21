import { html } from '@nisli/core';
import type { TemplateResult } from '@nisli/core';

export function Footnotes({ items }: { items: TemplateResult[] }) {
  return html`<div class="footnotes" id="footnotes">
    ${items.map(item => html`<div class="footnote-item">${item}</div>`)}
  </div>`;
}
