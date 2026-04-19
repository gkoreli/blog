import { staticHtml as html } from '@nisli/core/static';
import type { PostMeta } from '../lib/frontmatter.js';
import { SECTION_LABELS, SECTION_DESCRIPTIONS } from '../lib/frontmatter.js';
import { PageHero, LitItem } from '../components/index.js';

export function essaysPage(posts: PostMeta[]) {
  return html`<div class="section-archive" data-section="essays">
  ${PageHero({
    kicker: 'Personal Publication',
    title: SECTION_LABELS['essays'],
    description: SECTION_DESCRIPTIONS['essays'],
    accentColor: 'var(--section-essays)',
    stats: [{ value: String(posts.length), label: 'Published' }],
  })}
  <div class="separator"><img src="/icons/sparkle.svg" class="separator-icon" width="14" height="14" alt=""></div>
  <div class="section-archive-list">
    ${posts.length === 0
      ? html`<p class="section-archive-empty">Nothing published yet — check back soon.</p>`
      : posts.map(p => LitItem({ post: p, accentColor: 'var(--section-essays)' }))}
  </div>
</div>`;
}
