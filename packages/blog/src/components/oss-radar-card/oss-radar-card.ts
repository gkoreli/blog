import { staticHtml as html } from '@nisli/core/static';
import type { PostMeta } from '../../lib/frontmatter.js';
import { formatDateShort } from '../../lib/dates.js';

function extractIssueNumber(slug: string): string {
  const m = slug.match(/oss-radar-(\d+)/);
  return m ? `#${m[1]}` : '';
}

export function OSSRadarCard({ post }: { post: PostMeta }) {
  const issueNum = extractIssueNumber(post.slug);
  return html`<a href="/${post.slug}" class="rdr">
  <div class="rdr-head">
    <span class="rdr-pub">◆ OSS Radar</span>
    ${issueNum ? html`<span class="rdr-num">${issueNum}</span>` : ''}
  </div>
  <div class="rdr-body">
    <div class="rdr-title">${post.title.replace(/^OSS Radar \S+\s*[—–-]\s*/i, '')}</div>
    <p class="rdr-desc">${post.description}</p>
    <div class="rdr-footer">
      <span class="rdr-date">${formatDateShort(post.date)}</span>
      <span class="rdr-link">Read issue →</span>
    </div>
    ${post.tags.length > 0 ? html`<div class="rdr-tags">${post.tags.map(t => html`<span class="rdr-tag">${t}</span>`)}</div>` : ''}
  </div>
</a>`;
}
