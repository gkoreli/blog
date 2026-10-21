import { html } from '@nisli/core';
import type { TemplateResult } from '@nisli/core';

export function Postscript({ content }: { content: TemplateResult }) {
  return html`<div class="proc-ps">${content}</div>`;
}
