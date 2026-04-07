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
  return html`<div class="footnotes" id="footnotes">
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

/* ── Procrastination article components ── */

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

export function Callout({ label, body }: { label: string; body: StaticResult }) {
  return html`<nisli-callout>
    <span class="callout-label">${label}</span>
    ${body}
  </nisli-callout>`;
}

export function ResearchNote({ summary, body }: { summary: string; body: StaticResult }) {
  return html`<details class="research-note">
    <summary>${summary}</summary>
    <div class="details-body">${body}</div>
  </details>`;
}

export function EisenhowerMatrix({ quads }: { quads: { num: string; tag: string; title: string; body: StaticResult; cls: string }[] }) {
  return html`<div class="matrix-wrap">
    <div class="matrix-label">The Eisenhower / Urgency-Importance Matrix</div>
    <div class="matrix-grid">
      <div class="mx-corner"></div>
      <div class="mx-col-head">Urgent</div>
      <div class="mx-col-head">Not Urgent</div>
      <div class="mx-row-head"><span>Important</span></div>
      ${quads.slice(0, 2).map(q => html`<div class="mx-quad ${q.cls}">
        <div class="mx-quad-n">${q.num}</div>
        <span class="mx-tag">${q.tag}</span>
        <div class="mx-title">${q.title}</div>
        <div class="mx-body">${q.body}</div>
      </div>`)}
      <div class="mx-row-head"><span>Not Important</span></div>
      ${quads.slice(2, 4).map(q => html`<div class="mx-quad ${q.cls}">
        <div class="mx-quad-n">${q.num}</div>
        <span class="mx-tag">${q.tag}</span>
        <div class="mx-title">${q.title}</div>
        <div class="mx-body">${q.body}</div>
      </div>`)}
    </div>
  </div>`;
}

export function Steps({ items }: { items: { title: string; body: StaticResult }[] }) {
  return html`<div class="proc-steps">
    ${items.map((s, i) => html`<div class="proc-step">
      <div class="proc-step-n">${String(i + 1)}</div>
      <div class="proc-step-body">
        <h4>${s.title}</h4>
        <p>${s.body}</p>
      </div>
    </div>`)}
  </div>`;
}

export function Closing({ title, body }: { title: StaticResult; body: StaticResult }) {
  return html`<div class="proc-closing">
    <h3>${title}</h3>
    <p>${body}</p>
  </div>`;
}

export function Postscript({ content }: { content: StaticResult }) {
  return html`<div class="proc-ps">${content}</div>`;
}
