import { staticHtml as html } from '@nisli/core/static';
import type { StaticResult } from '@nisli/core/static';

export function TopoHero({ kicker, title, byline }: { kicker: string; title: StaticResult; byline: StaticResult }) {
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
