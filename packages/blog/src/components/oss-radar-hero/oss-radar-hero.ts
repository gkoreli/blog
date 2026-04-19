import { staticHtml as html } from '@nisli/core/static';
import type { StaticResult } from '@nisli/core/static';

export function OssRadarHero({ issueNum, date, tags, title, subtitle, author, readTime, canvasMode = 'flow' }: {
  issueNum: string; date: string; tags: string; title: StaticResult; subtitle: string; author: string; readTime: string;
  canvasMode?: string;
}) {
  return html`<div class="topo-hero topo-hero--long-title">
    <nisli-neural-canvas mode="${canvasMode}"></nisli-neural-canvas>
    <div class="radar-pills">
      <span class="radar-pill radar-pill--accent">${issueNum}</span>
      <span class="radar-pill">${date}</span>
    </div>
    <div class="topo-hero-inner">
      <span class="topo-kicker">${tags}</span>
      ${title}
      <p class="topo-byline">${subtitle}</p>
      <div class="proc-byline">
        <span class="proc-byline-name"><strong>${author}</strong></span>
        <span class="proc-byline-sep">·</span>
        <span class="proc-byline-name">${readTime}</span>
      </div>
    </div>
    <span class="topo-scroll">↓ scroll to read</span>
  </div>`;
}
