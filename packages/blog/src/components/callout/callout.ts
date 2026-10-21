import { html } from '@nisli/core';
import type { TemplateResult } from '@nisli/core';

export function Callout({ label, body }: { label: string; body: TemplateResult }) {
  return html`<nisli-callout>
    <span class="callout-label">${label}</span>
    ${body}
  </nisli-callout>`;
}
