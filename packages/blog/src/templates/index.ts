import { html } from 'nisli-static';
import type { PostMeta } from '../lib/frontmatter.js';

export function indexTemplate(posts: PostMeta[]) {
  const dateStr = (date: string) => date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  return html`<div class="post-list">
  <h1>Posts</h1>
  ${posts.map(p => html`<article class="post-preview">
    <a href="/${p.slug}">
      <h2>${p.title}</h2>
    </a>
    <time datetime="${p.date}">${dateStr(p.date)}</time>
    <p>${p.description}</p>
  </article>`)}
</div>`;
}
