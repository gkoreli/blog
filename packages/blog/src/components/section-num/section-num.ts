import { staticHtml as html } from '@nisli/core/static';

export function SectionNum({ label }: { label: string }) {
  return html`<nisli-section-num><span class="section-num">${label}</span></nisli-section-num>`;
}
