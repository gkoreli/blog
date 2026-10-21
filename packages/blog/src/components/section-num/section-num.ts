import { html } from '@nisli/core';

export function SectionNum({ label }: { label: string }) {
  return html`<nisli-section-num><span class="section-num">${label}</span></nisli-section-num>`;
}
