import { staticHtml as html } from '@nisli/core/static';
import type { StaticResult } from '@nisli/core/static';

export function Insight({ label, content }: { label: string; content: StaticResult }) {
  return html`<nisli-insight>
    <div class="insight-label">${label}</div>
    ${content}
  </nisli-insight>`;
}
