import { html } from '@nisli/core';
import type { PostMeta } from '../lib/frontmatter.js';
import { SECTION_LABELS, SECTION_DESCRIPTIONS } from '../lib/frontmatter.js';
import { PageHero, OSSRadarCard } from '../components/index.js';
import { archiveTopicIndex } from '../templates/archive-topics.js';

export function ossRadarPage(posts: PostMeta[]) {
  const latestIssueNum = posts[0]?.slug.match(/oss-radar-(\d+)/)?.[1];
  const stats = [
    { value: String(posts.length), label: 'Issues' },
    ...(latestIssueNum ? [{ value: `#${latestIssueNum}`, label: 'Latest' }] : []),
  ];

  const [latest, ...archive] = posts;

  return html`<div class="section-archive" data-section="oss-radar">
  ${PageHero({
    title: SECTION_LABELS['oss-radar'],
    description: SECTION_DESCRIPTIONS['oss-radar'],
    accentColor: 'var(--section-oss-radar)',
    stats,
  })}
  ${archiveTopicIndex('oss-radar', posts)}
  <div class="section-archive-list">
    ${posts.length === 0
      ? html`<p class="section-archive-empty">Nothing published yet — check back soon.</p>`
      : html`<div class="rdr-group-label">Latest issue</div>
        ${latest ? OSSRadarCard({ post: latest }) : ''}
        ${archive.length > 0 ? html`<div class="rdr-group-label rdr-group-label--archive">Archive</div>
        ${archive.map(p => OSSRadarCard({ post: p }))}` : ''}`}
  </div>
</div>`;
}
