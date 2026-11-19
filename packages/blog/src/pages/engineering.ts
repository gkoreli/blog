import { html } from '@nisli/core';
import type { PostMeta } from '../lib/frontmatter.js';
import { SECTION_LABELS, SECTION_DESCRIPTIONS } from '../lib/frontmatter.js';
import { PageHero, LitItem } from '../components/index.js';
import { archiveTopicIndex } from '../templates/archive-topics.js';

export function engineeringPage(posts: PostMeta[]) {
  const stats = [
    { value: String(posts.length), label: 'Articles' },
  ];

  return html`<div class="section-archive" data-section="engineering">
  ${PageHero({
    title: SECTION_LABELS['engineering'],
    description: SECTION_DESCRIPTIONS['engineering'],
    accentColor: 'var(--section-engineering)',
    stats,
  })}
  ${archiveTopicIndex('engineering', posts)}
  <div class="section-archive-list">
    ${posts.length === 0
      ? html`<p class="section-archive-empty">Nothing published yet — check back soon.</p>`
      : posts.map(p => LitItem({ post: p, accentColor: 'var(--section-engineering)' }))}
  </div>
</div>`;
}
