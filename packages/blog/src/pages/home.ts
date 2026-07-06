import { staticHtml as html } from '@nisli/core/static';
import type { PostMeta } from '../lib/frontmatter.js';
import { SECTION_LABELS } from '../lib/frontmatter.js';
import { formatDateShort } from '../lib/dates.js';

function CoverStory({ post }: { post: PostMeta }) {
  return html`<a href="/${post.slug}" class="cover">
  <div class="cover-meta">
    <span class="cover-sec" style="color:var(--section-${post.section})">${SECTION_LABELS[post.section]}</span>
    <span class="cover-date">${formatDateShort(post.date)}</span>
  </div>
  <h2 class="cover-title">${post.title}</h2>
  <p class="cover-desc">${post.description}</p>
</a>`;
}

function StreamItem({ post }: { post: PostMeta }) {
  return html`<a href="/${post.slug}" class="stream-item">
  <div class="stream-meta">
    <span class="stream-sec" style="color:var(--section-${post.section})">${SECTION_LABELS[post.section]}</span>
    <span class="stream-date">${formatDateShort(post.date)}</span>
    ${post.promptCount ? html`<span class="stream-badge">${post.promptCount} prompt${post.promptCount === 1 ? '' : 's'}</span>` : ''}
  </div>
  <div class="stream-title">${post.title}</div>
  <p class="stream-desc">${post.description}</p>
</a>`;
}

export function homePage(posts: PostMeta[]) {
  const featured = posts.find(p => p.featured) ?? posts[0];
  const latest = posts.filter(p => p.slug !== featured?.slug);

  return html`<div class="home">
  ${featured ? CoverStory({ post: featured }) : ''}

  <div class="separator"><img src="/icons/sparkle.svg" class="separator-icon" width="14" height="14" alt=""></div>

  <div class="stream">
    ${latest.map(p => StreamItem({ post: p }))}
  </div>
</div>`;
}
