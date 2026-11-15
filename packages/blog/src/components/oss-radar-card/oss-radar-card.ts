import { html } from '@nisli/core';
import type { PostMeta } from '../../lib/frontmatter.js';
import { formatDateShort } from '../../lib/dates.js';
import { topicLinks } from '../../templates/archive-discovery.js';

function extractIssueNumber(slug: string): string {
  const m = slug.match(/oss-radar-(\d+)/);
  return m ? `#${m[1]}` : '';
}

export function OSSRadarCard({ post }: { post: PostMeta }) {
  const issueNum = extractIssueNumber(post.slug);
  return html`<article class="rdr"><a href="/${post.slug}" class="rdr-main">
  <div class="rdr-head">
    ${issueNum ? html`<span class="rdr-num">Issue ${issueNum}</span>` : ''}
  </div>
  <div class="rdr-body">
    <h2 class="rdr-title">${post.title.replace(/^OSS Radar \S+\s*[—–-]\s*/i, '')}</h2>
    <p class="rdr-desc">${post.description}</p>
    <div class="rdr-footer">
      <span class="rdr-date">${formatDateShort(post.date)}</span>
    </div>
  </div>
</a>${post.tags.length > 0 ? topicLinks(post.tags, post.section, 'rdr-tags') : ''}</article>`;
}
