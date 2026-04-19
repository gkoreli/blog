import { staticHtml as html } from '@nisli/core/static';
import type { StaticResult } from '@nisli/core/static';

export function ResearchNote({ summary, body }: { summary: string; body: StaticResult }) {
  return html`<details class="research-note">
    <summary>${summary}</summary>
    <div class="details-body">${body}</div>
  </details>`;
}
