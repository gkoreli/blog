import { staticHtml as html } from '@nisli/core/static';
import type { PostMeta } from '../../lib/frontmatter.js';
import { formatDateShort } from '../../lib/dates.js';

export function ArticleGrid({
  posts,
  columns = 2,
  showKicker = true,
}: {
  posts: PostMeta[];
  columns?: 1 | 2;
  showKicker?: boolean;
}) {
  if (posts.length === 0) return html``;
  return html`<div class="ag ag--cols-${columns}">
  ${posts.map((p, i) => html`<a href="/${p.slug}" class="ag-item" style="--rv-d:${i * 80}ms">
    ${showKicker && p.tags.length > 0 ? html`<span class="ag-kicker">${p.tags[0]}</span>` : ''}
    <div class="ag-title">${p.title}</div>
    <div class="ag-meta">
      <span>${formatDateShort(p.date)}</span>
      ${p.promptCount ? html`<span class="ag-badge">${p.promptCount} prompt${p.promptCount === 1 ? '' : 's'}</span>` : ''}
    </div>
    <p class="ag-desc">${p.description}</p>
  </a>`)}
</div>`;
}
