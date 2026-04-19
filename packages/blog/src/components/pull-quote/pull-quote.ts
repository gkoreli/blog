import { staticHtml as html } from '@nisli/core/static';
import type { StaticResult } from '@nisli/core/static';

export function PullQuote({ content, cite }: { content: StaticResult; cite?: string }) {
  return html`<blockquote class="pull-quote">
    ${content}
    ${cite ? html`<cite>${cite}</cite>` : ''}
  </blockquote>`;
}
