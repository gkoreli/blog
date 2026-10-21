import { html } from '@nisli/core';
import type { TemplateResult } from '@nisli/core';

export function ScrollReveal({ content }: { content: TemplateResult }) {
  return html`<nisli-scroll-reveal>${content}</nisli-scroll-reveal>`;
}
