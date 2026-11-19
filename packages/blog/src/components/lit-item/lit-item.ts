import { html } from '@nisli/core';
import type { PostMeta } from '../../lib/frontmatter.js';
import { formatDateShort } from '../../lib/dates.js';

export function LitItem({ post, accentColor }: { post: PostMeta; accentColor?: string }) {
  return html`<article class="lit">
  <div class="lit-meta" style=${accentColor ? `color:${accentColor}` : undefined}>
    <span>${formatDateShort(post.date)}</span>
  </div>
  <h2 class="lit-title"><a href="/${post.slug}">${post.title}</a></h2>
  <p class="lit-desc">${post.description}</p>
</article>`;
}
