import { staticHtml as html } from '@nisli/core/static';
import type { StaticResult } from '@nisli/core/static';

export function HarnessHero({ kicker, title, subtitle, author }: { kicker: string; title: StaticResult; subtitle: StaticResult; author: string }) {
  return html`<div class="topo-hero">
    <nisli-neural-canvas mode="flow"></nisli-neural-canvas>
    <div class="topo-hero-inner">
      <span class="topo-kicker">${kicker}</span>
      ${title}
      <p class="topo-byline">${subtitle}</p>
      <div class="proc-byline">
        <span class="proc-byline-name"><strong>${author}</strong></span>
      </div>
    </div>
    <span class="topo-scroll">↓ scroll to read</span>
  </div>`;
}
