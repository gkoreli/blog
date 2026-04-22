import { staticHtml as html, raw } from '@nisli/core/static';
import type { PostMeta, PromptsData } from '../lib/frontmatter.js';

export function promptsPage(meta: PostMeta, prompts: PromptsData) {
  return html`<article>
  <header class="post-header">
    <a href="/${meta.slug}" class="prompts-back">← Back to article</a>
    <h1>Thoughts by human, co-written by AI</h1>
    <p class="prompts-subtitle">${prompts.count} prompt${prompts.count === 1 ? '' : 's'} that shaped
      <a href="/${meta.slug}">"${meta.title}"</a></p>
  </header>
  <div class="post-content">
    <p class="prompts-intro">These are the raw, unedited notes I wrote while shaping this article.
    They are closer to a brain dump than a prompt library: my thinking, philosophy, corrections,
    and direction. The ideas are mine. AI helped turn them into a smoother, more readable essay.</p>
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
