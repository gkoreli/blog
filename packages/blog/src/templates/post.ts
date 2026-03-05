import { html, raw } from 'nisli-static';
import type { PostMeta } from '../lib/frontmatter.js';

export function postTemplate(meta: PostMeta, htmlContent: string) {
  const dateStr = meta.date ? new Date(meta.date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  return html`<article>
  <header class="post-header">
    <h1>${meta.title}</h1>
    <time datetime="${meta.date}">${dateStr}</time>
    ${meta.tags.length > 0
      ? html`<div class="tags">${meta.tags.map(t => html`<span class="tag">${t}</span>`)}</div>`
      : ''}
  </header>
  <div class="post-content">
    ${raw(htmlContent)}
  </div>
</article>`;
}
