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
      <span class="feat-badge">Latest</span>
      <span class="feat-sec">${SECTION_LABELS[post.section]}</span>
      <span class="feat-date">${formatDateShort(post.date)}</span>
    </div>
    <h2 class="feat-title">${post.title}</h2>
    <p class="feat-desc">${post.description}</p>
    <span class="feat-cta">Read article <span class="feat-arr">→</span></span>
  </div>
</a>`;
}

function FramesPlaceholder() {
  const slots = ['walk · city', 'light · shadow', 'detail · texture', 'moment · still'];
  return html`<div class="frames-grid">
  ${slots.map(l => html`<div class="frame-slot">
    <div class="frame-slot-bg"></div>
    <span class="frame-slot-txt">${l}</span>
  </div>`)}
</div>
<p class="frames-caption"><span class="frames-dot"></span>Photo journals — first frame coming soon</p>`;
}

export function homePage(posts: PostMeta[]) {
  const featured = posts.find(p => p.featured) ?? posts[0];
  const essays = posts.filter(p => p.section === 'essays' && p.slug !== featured?.slug);
  const engineering = posts.filter(p => p.section === 'engineering' && p.slug !== featured?.slug);
  const ossRadar = posts.filter(p => p.section === 'oss-radar' && p.slug !== featured?.slug);

  return html`<div class="home">
  ${Masthead()}

  ${SectionHeader({ label: 'Featured' })}
  ${featured ? FeaturedCard({ post: featured }) : ''}

  ${essays.length > 0 ? html`${SectionHeader({ label: 'Essays', href: '/essays', dotColor: 'var(--section-essays)' })}
  ${ArticleGrid({ posts: essays.slice(0, 4) })}` : ''}

  ${engineering.length > 0 ? html`${SectionHeader({ label: 'Engineering', href: '/engineering', dotColor: 'var(--section-engineering)' })}
  ${ArticleGrid({ posts: engineering.slice(0, 4) })}` : ''}

  ${ossRadar.length > 0 ? html`${SectionHeader({ label: 'OSS Radar', href: '/oss-radar', dotColor: 'var(--section-oss-radar)' })}
  ${ossRadar.slice(0, 1).map(p => OSSRadarCard({ post: p }))}` : ''}

  ${SectionHeader({ label: 'Frames', href: '/frames', dotColor: 'var(--section-frames)' })}
  ${FramesPlaceholder()}
</div>`;
}
