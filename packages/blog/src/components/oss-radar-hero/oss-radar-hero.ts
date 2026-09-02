import { staticHtml as html } from '@nisli/core/static';
import type { StaticResult } from '@nisli/core/static';

export function OssRadarHero({ issueNum, date, tags, title, subtitle, author, readTime, footprint, canvasMode = 'flow', canvasSeed }: {
  issueNum: string;
  date: string;
  tags: string;
  title: StaticResult;
  subtitle: string;
  author: string;
  readTime: string;
  footprint?: { label: string; url: string };
  canvasMode?: string;
  canvasSeed?: number;
}) {
  const canvas = canvasSeed === undefined
    ? html`<nisli-neural-canvas mode="${canvasMode}"></nisli-neural-canvas>`
    : html`<nisli-neural-canvas mode="${canvasMode}" data-seed="${canvasSeed}"></nisli-neural-canvas>`;

  return html`<div class="topo-hero topo-hero--long-title">
    ${canvas}
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
      ${footprint ? html`<a class="radar-footprint" href="${footprint.url}">
        ${footprint.label} <span aria-hidden="true">↗</span>
      </a>` : ''}
    </div>
    <span class="topo-scroll">↓ scroll to read</span>
  </div>`;
}
