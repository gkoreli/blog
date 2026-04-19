import { staticHtml as html } from '@nisli/core/static';
import type { StaticResult } from '@nisli/core/static';

export function Callout({ label, body }: { label: string; body: StaticResult }) {
  return html`<nisli-callout>
    <span class="callout-label">${label}</span>
    ${body}
  </nisli-callout>`;
}
