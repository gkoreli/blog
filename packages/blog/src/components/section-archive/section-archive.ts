import { staticHtml as html } from '@nisli/core/static';
import type { PostMeta, Section } from '../../lib/frontmatter.js';
import { SECTION_LABELS, SECTION_DESCRIPTIONS } from '../../lib/frontmatter.js';
import { formatDateLong } from '../../lib/dates.js';

export function SectionArchive({ section, posts }: { section: Section; posts: PostMeta[] }) {
  return html`<div class="section-archive">
    <header class="section-archive-header">
      <div class="section-archive-kicker">Publication</div>
      <h1 class="section-archive-title">${SECTION_LABELS[section]}</h1>
      <p class="section-archive-desc">${SECTION_DESCRIPTIONS[section]}</p>
    </header>
    <div class="section-archive-list">
      ${posts.length === 0
        ? html`<p class="section-archive-empty">Nothing published yet — check back soon.</p>`
        : posts.map(p => html`<a href="/${p.slug}" class="archive-post-item">
          <div class="archive-post-title">${p.title}</div>
          <div class="archive-post-meta">${formatDateLong(p.date)}${p.promptCount ? ` · ${p.promptCount} prompts` : ''}</div>
          <div class="archive-post-desc">${p.description}</div>
          ${p.tags.length > 0
            ? html`<div class="archive-post-tags">${p.tags.map(t => html`<span class="tag">${t}</span>`)}</div>`
            : ''}
        </a>`)}
    </div>
  </div>`;
}
