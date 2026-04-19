import { staticHtml as html } from '@nisli/core/static';
import type { PostMeta } from '../lib/frontmatter.js';
import { SECTION_LABELS, SECTION_DESCRIPTIONS } from '../lib/frontmatter.js';
import { PageHero, LitItem } from '../components/index.js';

export function engineeringPage(posts: PostMeta[]) {
  const totalPrompts = posts.reduce((s, p) => s + (p.promptCount ?? 0), 0);
  const stats = [
    { value: String(posts.length), label: 'Articles' },
    ...(totalPrompts > 0 ? [{ value: `${totalPrompts}+`, label: 'Prompts logged' }] : []),
  ];

  return html`<div class="section-archive" data-section="engineering">
  <div class="sec-canvas-banner" style="--sec-accent:var(--section-engineering)">
    <nisli-neural-canvas mode="flow"></nisli-neural-canvas>
  </div>
  ${PageHero({
    kicker: 'Personal Publication',
    title: SECTION_LABELS['engineering'],
    description: SECTION_DESCRIPTIONS['engineering'],
    accentColor: 'var(--section-engineering)',
    stats,
  })}
  <div class="separator"><img src="/icons/sparkle.svg" class="separator-icon" width="14" height="14" alt=""></div>
  <div class="section-archive-list">
    ${posts.length === 0
      ? html`<p class="section-archive-empty">Nothing published yet — check back soon.</p>`
      : posts.map(p => LitItem({ post: p, accentColor: 'var(--section-engineering)' }))}
  </div>
</div>`;
}
