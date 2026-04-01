/**
 * Rich content component factories (build-time).
 *
 * These mirror the props-as-templates pattern from @nisli/core:
 * content is passed as StaticResult props, not as HTML children.
 * Output is semantic <nisli-*> tags styled by components.css.
 *
 * When @nisli/core SSR lands, these become actual component() factories
 * with the same API — the .ts posts don't change.
 */
import { html } from 'nisli-static';
import type { StaticResult } from 'nisli-static';

export function Insight({ label, content }: { label: string; content: StaticResult }) {
  return html`<nisli-insight>
    <div class="insight-label">${label}</div>
    ${content}
  </nisli-insight>`;
}

export function SectionNum({ label }: { label: string }) {
  return html`<nisli-section-num><span class="section-num">${label}</span></nisli-section-num>`;
}

export function ScrollReveal({ content }: { content: StaticResult }) {
  return html`<nisli-scroll-reveal>${content}</nisli-scroll-reveal>`;
}

export function PullQuote({ content, cite }: { content: StaticResult; cite?: string }) {
  return html`<blockquote class="pull-quote">
    ${content}
    ${cite ? html`<cite>${cite}</cite>` : ''}
  </blockquote>`;
}

export function SectionBreak() {
  return html`<hr class="section-break">`;
}

export function Footnotes({ items }: { items: StaticResult[] }) {
  return html`<div class="footnotes">
    ${items.map(item => html`<div class="footnote-item">${item}</div>`)}
  </div>`;
}

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

export function TopoDiagram({ mode }: { mode: 'centralized' | 'decentralized' | 'distributed' }) {
  return html`<nisli-topo-diagram mode="${mode}"></nisli-topo-diagram>`;
}
