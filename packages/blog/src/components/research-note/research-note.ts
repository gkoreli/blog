import { html } from '@nisli/core';
import type { TemplateResult } from '@nisli/core';

export function ResearchNote({ summary, body }: { summary: string; body: TemplateResult }) {
  return html`<details class="research-note">
    <summary>${summary}</summary>
    <div class="details-body">${body}</div>
  </details>`;
}
