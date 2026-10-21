import { html } from '@nisli/core';
import type { TemplateResult } from '@nisli/core';

export function PullQuote({ content, cite }: { content: TemplateResult; cite?: string }) {
  return html`<blockquote class="pull-quote">
    ${content}
    ${cite ? html`<cite>${cite}</cite>` : ''}
  </blockquote>`;
}
