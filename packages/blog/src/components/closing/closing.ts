import { staticHtml as html } from '@nisli/core/static';
import type { StaticResult } from '@nisli/core/static';

export function Closing({ title, body }: { title: StaticResult; body: StaticResult }) {
  return html`<div class="proc-closing">
    <h3>${title}</h3>
    <p>${body}</p>
  </div>`;
}
