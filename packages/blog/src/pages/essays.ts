import { html } from '@nisli/core';
import type { PostMeta } from '../lib/frontmatter.js';
import { SECTION_LABELS, SECTION_DESCRIPTIONS } from '../lib/frontmatter.js';
import { PageHero, LitItem } from '../components/index.js';
import { archiveTopicIndex } from '../templates/archive-topics.js';

export function essaysPage(posts: PostMeta[]) {
  return html`<div class="section-archive" data-section="essays">
  ${PageHero({
    title: SECTION_LABELS['essays'],
    description: SECTION_DESCRIPTIONS['essays'],
    accentColor: 'var(--section-essays)',
    stats: [{ value: String(posts.length), label: 'Published' }],
  })}
  ${archiveTopicIndex('essays', posts)}
  <div class="section-archive-list">
    ${posts.length === 0
      ? html`<p class="section-archive-empty">Nothing published yet — check back soon.</p>`
      : posts.map(p => LitItem({ post: p, accentColor: 'var(--section-essays)' }))}
  </div>
</div>`;
}
