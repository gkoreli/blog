import { staticHtml as html } from '@nisli/core/static';
import type { StaticResult } from '@nisli/core/static';

export function ProcrastinationHero({ kicker, title, subtitle, author, note }: { kicker: string; title: StaticResult; subtitle: StaticResult; author: string; note: string }) {
  return html`<div class="topo-hero topo-hero--long-title">
    <nisli-neural-canvas mode="threshold"></nisli-neural-canvas>
    <div class="topo-hero-inner">
      <span class="topo-kicker">${kicker}</span>
      ${title}
      <p class="topo-byline">${subtitle}</p>
      <div class="proc-byline">
        <span class="proc-byline-name"><strong>${author}</strong></span>
        <span class="proc-byline-sep">·</span>
        <span class="proc-byline-name">${note}</span>
      </div>
    </div>
    <span class="topo-scroll">↓ scroll to read</span>
  </div>`;
}
