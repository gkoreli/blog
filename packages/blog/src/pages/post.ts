import { staticHtml as html, raw } from '@nisli/core/static';
import type { PostMeta, PromptsData } from '../lib/frontmatter.js';
import { formatDateLong } from '../lib/dates.js';
import { SectionLabel, FramesGallery } from '../components/index.js';

export function seriesTrailBlock(meta: PostMeta, allPosts: PostMeta[]): string {
  if (!meta.series) return '';

  const seriesPosts = allPosts
    .filter(p => p.series?.name === meta.series!.name)
    .sort((a, b) => a.series!.order - b.series!.order);

  if (seriesPosts.length < 2) return '';

  const items = seriesPosts.map(p =>
    p.slug === meta.slug
      ? html`<li class="series-trail-current">${p.title}</li>`
      : html`<li><a href="/${p.slug}">${p.title}</a></li>`
  );

  return html`<nav class="series-trail" aria-label="More in this series">
  <p class="series-trail-label">More in <em>${meta.series.name}</em></p>
  <ol class="series-trail-list">${items}</ol>
</nav>`.toString();
}

export function postPage(meta: PostMeta, htmlContent: string, prompts?: PromptsData | null, allPosts?: PostMeta[]) {
  const dateStr = formatDateLong(meta.date);

  return html`<article>
  <header class="post-header">
    ${SectionLabel({ section: meta.section })}
    <time datetime="${meta.date}">${dateStr}</time>${prompts ? html`<span class="post-header-sep"> · </span><a href="/${meta.slug}/prompts" class="post-header-prompts"><img src="/icons/transparency.svg" width="14" height="14" alt="" class="post-header-prompts-icon">Thoughts by human, co-written by AI<span class="post-header-prompts-count"> — ${prompts.count} prompt${prompts.count === 1 ? '' : 's'}</span></a>` : ''}
    ${meta.tags.length > 0
      ? html`<div class="tags">${meta.tags.map(t => html`<span class="tag">${t}</span>`)}</div>`
      : ''}
  </header>
  ${meta.layout === 'frames' ? FramesGallery({ images: meta.images }) : ''}
  <div class="post-content">
    ${raw(htmlContent)}
  </div>
  ${allPosts ? raw(seriesTrailBlock(meta, allPosts)) : ''}
  ${prompts ? html`
  <section class="prompts-teaser">
    <div class="prompts-teaser-header">
      <img src="/icons/transparency.svg" width="16" height="16" alt="">
      <strong>Thoughts by human, co-written by AI</strong>
      <span class="prompts-teaser-count">${prompts.count} prompt${prompts.count === 1 ? '' : 's'}</span>
    </div>
    <p class="prompts-teaser-preview">"${prompts.preview}"</p>
    <a href="/${meta.slug}/prompts" class="prompts-teaser-link">See behind the scenes →</a>
  </section>` : ''}
</article>`;
}
