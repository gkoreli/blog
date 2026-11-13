import { html, type TemplateResult } from '@nisli/core';

/** Visible interpretation guidance, kept together after the data it explains. */
export function dataNote(body: TemplateResult, label = 'Reading this data') {
  return html`<div class="data-note"><h4 class="data-note-label">${label}</h4><div class="data-note-body">${body}</div></div>`;
}
