import { staticHtml as html } from '@nisli/core/static';
import type { PostMeta } from '../lib/frontmatter.js';
import { SECTION_LABELS } from '../lib/frontmatter.js';
import { formatDateShort } from '../lib/dates.js';
import {
  Masthead,
  SectionHeader,
  ArticleGrid,
  OSSRadarCard,
} from '../components/index.js';

function FeaturedCard({ post }: { post: PostMeta }) {
  return html`<a href="/${post.slug}" class="feat">
  <div class="feat-wash"></div>
  <div class="feat-inner">
    <div class="feat-meta">
      <span class="feat-badge">Featured</span>
      <span class="feat-sec">${SECTION_LABELS[post.section]}</span>
      <span class="feat-date">${formatDateShort(post.date)}</span>
    </div>
    <h2 class="feat-title">${post.title}</h2>
    <p class="feat-desc">${post.description}</p>
    <span class="feat-cta">Read article <span class="feat-arr">→</span></span>
  </div>
</a>`;
}

export function homePage(posts: PostMeta[]) {
  const featured = posts.find(p => p.featured) ?? posts[0];
  const essays = posts.filter(p => p.section === 'essays' && p.slug !== featured?.slug);
  const engineering = posts.filter(p => p.section === 'engineering');
  const ossRadar = posts.filter(p => p.section === 'oss-radar');

  return html`<div class="home">
  ${Masthead()}

  ${SectionHeader({ label: 'Featured' })}
  ${featured ? FeaturedCard({ post: featured }) : ''}

  ${essays.length > 0 ? html`${SectionHeader({ label: 'Essays', href: '/essays', dotColor: 'var(--section-essays)' })}
  ${ArticleGrid({ posts: essays.slice(0, 4), columns: 1, showKicker: false })}` : ''}

  ${engineering.length > 0 ? html`${SectionHeader({ label: 'Engineering', href: '/engineering', dotColor: 'var(--section-engineering)' })}
  ${ArticleGrid({ posts: engineering.slice(0, 4) })}` : ''}

  ${ossRadar.length > 0 ? html`${SectionHeader({ label: 'OSS Radar', href: '/oss-radar', dotColor: 'var(--section-oss-radar)' })}
  ${ossRadar.slice(0, 1).map(p => OSSRadarCard({ post: p }))}` : ''}
</div>`;
}
