import { staticHtml as html } from '@nisli/core/static';
import type { StaticResult } from '@nisli/core/static';

export function ScrollReveal({ content }: { content: StaticResult }) {
  return html`<nisli-scroll-reveal>${content}</nisli-scroll-reveal>`;
}
