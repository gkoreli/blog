import { staticHtml as html } from '@nisli/core/static';
import type { PostMeta } from '../lib/frontmatter.js';
import { SECTION_LABELS } from '../lib/frontmatter.js';
import { formatDateLong } from '../lib/dates.js';
import { HomeSectionBlock } from '../components/index.js';

export function indexTemplate(posts: PostMeta[]) {
  const featured = posts.find(p => p.featured) ?? posts[0];
  const rest = (section: Parameters<typeof HomeSectionBlock>[0]['section']) =>
    posts.filter(p => p.section === section && p.slug !== featured?.slug);

  return html`<div class="home">
  <section class="masthead">
    <h1 class="masthead-name">Goga Koreli</h1>
    <p class="masthead-statement">A personal publication — essays, engineering notes, <a href="/oss-radar">OSS Radar</a>, and <a href="/frames">Frames</a>. A studio for software, attention, images, and ideas.</p>
    <p class="masthead-projects">
      <a href="https://github.com/gkoreli/backlog-mcp" target="_blank" rel="noopener">backlog-mcp</a> ·
      <a href="https://www.npmjs.com/package/@nisli/core" target="_blank" rel="noopener">@nisli/core</a> ·
      <a href="https://github.com/gkoreli/blog" target="_blank" rel="noopener">gkoreli.com</a>
    </p>
  </section>

  ${featured ? html`<section class="home-featured">
    <div class="home-featured-kicker">Featured</div>
    <a href="/${featured.slug}" class="home-featured-post">
      <h2 class="home-featured-title">${featured.title}</h2>
      <p class="home-featured-desc">${featured.description}</p>
      <div class="home-featured-meta">
        <span class="section-label section-label--${featured.section}">${SECTION_LABELS[featured.section]}</span>
        <time datetime="${featured.date}">${formatDateLong(featured.date)}</time>
      </div>
    </a>
  </section>` : ''}

  <div class="home-sections">
    ${HomeSectionBlock({ section: 'essays', posts: rest('essays') })}
    ${HomeSectionBlock({ section: 'engineering', posts: rest('engineering') })}
    ${HomeSectionBlock({ section: 'oss-radar', posts: rest('oss-radar') })}
    ${HomeSectionBlock({ section: 'frames', posts: rest('frames') })}
  </div>
</div>`;
}
