import { html } from '@nisli/core';
import type { TemplateResult } from '@nisli/core';

export function TopoHero({ kicker, title, byline }: { kicker: string; title: TemplateResult; byline: TemplateResult }) {
  return html`<div class="topo-hero">
    <canvas></canvas>
    <nisli-topo-hero></nisli-topo-hero>
    <div class="topo-hero-inner">
      <span class="topo-kicker">${kicker}</span>
      ${title}
      ${byline}
    </div>
    <span class="topo-scroll">↓ scroll to read</span>
  </div>`;
}
