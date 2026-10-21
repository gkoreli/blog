import { html } from '@nisli/core';
import type { TemplateResult } from '@nisli/core';

export function Closing({ title, body }: { title: TemplateResult; body: TemplateResult }) {
  return html`<div class="proc-closing">
    <h3>${title}</h3>
    <p>${body}</p>
  </div>`;
}
