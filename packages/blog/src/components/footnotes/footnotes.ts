import { staticHtml as html } from '@nisli/core/static';
import type { StaticResult } from '@nisli/core/static';

export function Footnotes({ items }: { items: StaticResult[] }) {
  return html`<div class="footnotes" id="footnotes">
    ${items.map(item => html`<div class="footnote-item">${item}</div>`)}
  </div>`;
}
