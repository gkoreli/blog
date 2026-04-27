import { staticHtml as html, raw } from '@nisli/core/static';
import type { PostMeta } from '../../lib/frontmatter.js';
import { formatDateShort } from '../../lib/dates.js';

export function LitItem({ post, accentColor }: { post: PostMeta; accentColor?: string }) {
  const metaStyle = accentColor ? raw(`style="color:${accentColor}"`) : '';
  return html`<a href="/${post.slug}" class="lit">
  <div class="lit-meta" ${metaStyle}>
    <span>${formatDateShort(post.date)}</span>
    ${post.promptCount ? html`<span>·</span><span>${post.promptCount} prompts</span>` : ''}
  </div>
  <div class="lit-title">${post.title}</div>
  <p class="lit-desc">${post.description}</p>
  ${post.tags.length > 0 ? html`<div class="lit-tags">${post.tags.map(t => html`<span class="lit-tag">${t}</span>`)}</div>` : ''}
</a>`;
}
