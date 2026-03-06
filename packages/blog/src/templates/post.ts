import { html, raw } from 'nisli-static';
import type { PostMeta, PromptsData } from '../lib/frontmatter.js';

export function postTemplate(meta: PostMeta, htmlContent: string, prompts?: PromptsData | null) {
  const dateStr = meta.date ? new Date(meta.date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  return html`<article>
  <header class="post-header">
    <time datetime="${meta.date}">${dateStr}</time>
    ${meta.tags.length > 0
      ? html`<div class="tags">${meta.tags.map(t => html`<span class="tag">${t}</span>`)}</div>`
      : ''}
  </header>
  <div class="post-content">
    ${raw(htmlContent)}
  </div>
  ${prompts ? html`
  <aside class="prompts-teaser">
    <div class="prompts-teaser-header">
      <span class="prompts-teaser-icon">✦</span>
      <strong>${prompts.count} prompt${prompts.count === 1 ? '' : 's'} behind this post</strong>
    </div>
    <p class="prompts-teaser-preview">"${prompts.preview}"</p>
    <a href="/${meta.slug}/prompts" class="prompts-teaser-link">Read all prompts →</a>
  </aside>` : ''}
</article>`;
}
