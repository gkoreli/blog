import { staticHtml as html } from '@nisli/core/static';
import type { StaticResult } from '@nisli/core/static';

export function Prognosis({ tag, title, body }: { tag: 'watch' | 'signal' | 'risk'; title: string; body: StaticResult }) {
  return html`<div class="prognosis">
    <div class="prognosis-header">
      <span class="prognosis-tag prognosis-${tag}">${tag}</span>
      <span class="prognosis-title">${title}</span>
    </div>
    <div class="prognosis-body">${body}</div>
  </div>`;
}
