import type { PostMeta } from '../lib/frontmatter.js';
import { parseLocalDate } from '../lib/dates.js';

const SITE = 'https://gkoreli.com';

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function rssFeed(posts: PostMeta[]): string {
  const items = posts.map(p => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${SITE}/${p.slug}</link>
      <guid>${SITE}/${p.slug}</guid>
      <pubDate>${parseLocalDate(p.date).toUTCString()}</pubDate>
      <description>${escapeXml(p.description)}</description>
    </item>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Goga Koreli</title>
    <link>${SITE}</link>
    <description>Agentic engineering, open source developer tools, and building in public.</description>
    <language>en</language>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}
