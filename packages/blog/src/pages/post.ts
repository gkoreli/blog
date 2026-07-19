import { staticHtml as html, raw } from '@nisli/core/static';
import type { PostMeta, PromptsData, Section } from '../lib/frontmatter.js';
import { formatDateLong } from '../lib/dates.js';
import { SectionLabel } from '../components/index.js';

function resolveSeriesPosts(meta: PostMeta, allPosts: PostMeta[]) {
  if (!meta.series) return null;
  const posts = allPosts
    .filter(p => p.series?.id === meta.series!.id)
    .sort((a, b) => a.series!.order - b.series!.order);
  return posts.length >= 2 ? posts : null;
}

const CURATED_READS: Record<Section, string[]> = {
  essays: [
    'procrastination-is-a-craft-youve-been-mastering-your-entire-life',
    'i-thought-building-was-enough',
  ],
  engineering: [
    'one-hundred-pull-requests',
    'what-if-the-agent-was-better-before-we-helped',
  ],
  'oss-radar': [
    'oss-radar-02-the-toolchain-is-the-moat',
    'oss-radar-01-vercel-winter-2026-cohort',
  ],
};

interface NextRead {
  post: PostMeta;
  label: string;
}

function resolveNextRead(meta: PostMeta, allPosts: PostMeta[]): NextRead | null {
  const series = meta.series;
  if (series) {
    const nextInSeries = resolveSeriesPosts(meta, allPosts)
      ?.find(post => post.series && post.series.order > series.order);
    if (nextInSeries) return { post: nextInSeries, label: `Next in ${series.title}` };
  }

  for (const slug of CURATED_READS[meta.section]) {
    if (slug === meta.slug) continue;
    const post = allPosts.find(candidate => candidate.slug === slug);
    if (post) return { post, label: 'Continue reading' };
  }

  return null;
}

function feedbackRepository(meta: PostMeta): string {
  if (meta.tags.includes('ghx')) return 'https://github.com/gkoreli/ghx';
  if (meta.tags.includes('backlog-mcp')) return 'https://github.com/gkoreli/backlog-mcp';
  if (meta.tags.includes('nisli')) return 'https://github.com/gkoreli/nisli';
  return 'https://github.com/gkoreli/blog';
}

function feedbackUrl(meta: PostMeta): string {
  const params = new URLSearchParams({
    title: `Feedback: ${meta.title}`,
    body: `Article: https://gkoreli.com/${meta.slug}\n\nWhat I think is wrong or missing:\n`,
  });
  return `${feedbackRepository(meta)}/issues/new?${params.toString()}`;
}

export function seriesTrailBlock(meta: PostMeta, allPosts: PostMeta[]): string {
  const posts = resolveSeriesPosts(meta, allPosts);
  if (!posts) return '';

  const items = posts.map(p =>
    p.slug === meta.slug
      ? html`<li class="series-trail-current">${p.title}</li>`
      : html`<li><a href="/${p.slug}">${p.title}</a></li>`
  );

  return html`<nav class="series-trail" aria-label="More in this series">
  <p class="series-trail-label">More in <em>${meta.series!.title}</em></p>
  <ol class="series-trail-list">${items}</ol>
</nav>`.toString();
}

export function seriesTrailMarkdown(meta: PostMeta, allPosts: PostMeta[]): string {
  const posts = resolveSeriesPosts(meta, allPosts);
  if (!posts) return '';

  const items = posts.map((p, i) => `${i + 1}. ${p.title}`).join('\n');
  return `\n\n## More in ${meta.series!.title}\n\n${items}\n`;
}

export function postAfterword(meta: PostMeta, allPosts: PostMeta[]): string {
  const nextRead = resolveNextRead(meta, allPosts);
  const acceptsTechnicalFeedback = meta.section !== 'essays';
  if (!nextRead && !acceptsTechnicalFeedback) return '';

  return html`<section class="post-afterword" aria-label="After reading">
  ${nextRead ? html`<div class="post-next-read">
    <p class="post-afterword-label">${nextRead.label}</p>
    <a href="/${nextRead.post.slug}">
      <span>${nextRead.post.title}</span>
      <span class="post-afterword-arrow" aria-hidden="true">→</span>
    </a>
  </div>` : ''}
  ${acceptsTechnicalFeedback ? html`<div class="post-feedback">
    <h2>What did I get wrong?</h2>
    <p>Found a weak assumption, broken baseline, or technical mistake?</p>
    <a href="${feedbackUrl(meta)}" target="_blank" rel="noopener">Open a critique on GitHub <span aria-hidden="true">↗</span></a>
  </div>` : ''}
</section>`.toString();
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
  ${allPosts ? raw(postAfterword(meta, allPosts)) : ''}
</article>`;
}
