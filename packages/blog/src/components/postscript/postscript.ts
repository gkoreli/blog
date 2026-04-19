import { staticHtml as html } from '@nisli/core/static';
import type { StaticResult } from '@nisli/core/static';

export function Postscript({ content }: { content: StaticResult }) {
  return html`<div class="proc-ps">${content}</div>`;
}
