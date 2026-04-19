import { staticHtml as html } from '@nisli/core/static';
import type { PostMeta, Section } from '../../lib/frontmatter.js';
import { SECTION_LABELS } from '../../lib/frontmatter.js';
import { formatDateLong } from '../../lib/dates.js';

export function HomeSectionBlock({ section, posts, maxPosts = 2 }: {
  section: Section;
  posts: PostMeta[];
  maxPosts?: number;
}) {
  if (posts.length === 0) return html``;

  const preview = posts.slice(0, maxPosts);
  const viewAllLabel = section === 'oss-radar' ? 'View all issues →' : `View all ${SECTION_LABELS[section]} →`;

  return html`<section class="home-section-block home-section-block--${section}">
  <header class="home-section-block-header">
    <h2 class="home-section-block-title">
      <a href="/${section}">${SECTION_LABELS[section]}</a>
    </h2>
  </header>
  <div class="home-section-block-posts">
    ${preview.map(p => html`<a href="/${p.slug}" class="home-section-post">
      <div class="home-section-post-title">${p.title}</div>
      <div class="home-section-post-meta">
        <time datetime="${p.date}">${formatDateLong(p.date)}</time>
        ${p.promptCount ? html`<span> · ${p.promptCount} prompts</span>` : ''}
      </div>
      ${p.description ? html`<div class="home-section-post-desc">${p.description}</div>` : ''}
    </a>`)}
  </div>
  <a href="/${section}" class="home-section-block-viewall">${viewAllLabel}</a>
</section>`;
}
