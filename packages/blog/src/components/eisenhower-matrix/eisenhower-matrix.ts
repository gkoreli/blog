import { html } from '@nisli/core';
import type { TemplateResult } from '@nisli/core';

export function EisenhowerMatrix({ quads }: { quads: { num: string; tag: string; title: string; body: TemplateResult; cls: string }[] }) {
  return html`<div class="matrix-wrap">
    <div class="matrix-label">The Eisenhower / Urgency-Importance Matrix</div>
    <div class="matrix-grid">
      <div class="mx-corner"></div>
      <div class="mx-col-head">Urgent</div>
      <div class="mx-col-head">Not Urgent</div>
      <div class="mx-row-head"><span>Important</span></div>
      ${quads.slice(0, 2).map(q => html`<div class="mx-quad ${q.cls}">
        <div class="mx-quad-n">${q.num}</div>
        <span class="mx-tag">${q.tag}</span>
        <div class="mx-title">${q.title}</div>
        <div class="mx-body">${q.body}</div>
      </div>`)}
      <div class="mx-row-head"><span>Not Important</span></div>
      ${quads.slice(2, 4).map(q => html`<div class="mx-quad ${q.cls}">
        <div class="mx-quad-n">${q.num}</div>
        <span class="mx-tag">${q.tag}</span>
        <div class="mx-title">${q.title}</div>
        <div class="mx-body">${q.body}</div>
      </div>`)}
    </div>
  </div>`;
}
