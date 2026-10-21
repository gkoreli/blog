import { html } from '@nisli/core';
import type { TemplateResult } from '@nisli/core';

export function Prognosis({ tag, title, body }: { tag: 'watch' | 'signal' | 'risk'; title: string; body: TemplateResult }) {
  return html`<div class="prognosis">
    <div class="prognosis-header">
      <span class="prognosis-tag prognosis-${tag}">${tag}</span>
      <span class="prognosis-title">${title}</span>
    </div>
    <div class="prognosis-body">${body}</div>
  </div>`;
}
