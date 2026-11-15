import { html } from '@nisli/core';
import type { PostMeta } from '../../lib/frontmatter.js';
import { formatDateShort } from '../../lib/dates.js';
import { topicLinks } from '../../templates/archive-discovery.js';

export function LitItem({ post, accentColor }: { post: PostMeta; accentColor?: string }) {
  return html`<article class="lit"><a href="/${post.slug}" class="lit-main">
  <div class="lit-meta" style=${accentColor ? `color:${accentColor}` : undefined}>
    <span>${formatDateShort(post.date)}</span>
  </div>
  <h2 class="lit-title">${post.title}</h2>
  <p class="lit-desc">${post.description}</p>
  </a>${post.tags.length > 0 ? topicLinks(post.tags, post.section, 'lit-tags') : ''}
</article>`;
}
