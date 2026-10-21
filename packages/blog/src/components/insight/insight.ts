import { html } from '@nisli/core';
import type { TemplateResult } from '@nisli/core';

export function Insight({ label, content }: { label: string; content: TemplateResult }) {
  return html`<nisli-insight>
    <div class="insight-label">${label}</div>
    ${content}
  </nisli-insight>`;
}
