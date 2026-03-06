import { html, raw } from 'nisli-static';
import type { PostMeta, PromptsData } from '../lib/frontmatter.js';

export function promptsTemplate(meta: PostMeta, prompts: PromptsData) {
  return html`<article>
  <header class="post-header">
    <a href="/${meta.slug}" class="prompts-back">← Back to article</a>
    <h1>Prompts behind this post</h1>
    <p class="prompts-subtitle">${prompts.count} prompt${prompts.count === 1 ? '' : 's'} that shaped
      <a href="/${meta.slug}">"${meta.title}"</a></p>
  </header>
  <div class="post-content">
    <p class="prompts-intro">These are the raw, unedited prompts I wrote to shape this article.
    What you see below is exactly what I fed the agent — stream-of-consciousness thinking,
    corrections, and direction. The article is the output; this is the input.</p>
    ${prompts.prompts.map((p, i) => html`
    <div class="prompt-block">
      <div class="prompt-label">Prompt ${i + 1}</div>
      <div class="prompt-text">${raw(escapeHtml(p))}</div>
    </div>`)}
  </div>
</article>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}
