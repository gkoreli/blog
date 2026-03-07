import type { PostMeta } from '../lib/frontmatter.js';

const SITE = 'https://gkoreli.com';

function url(loc: string, lastmod?: string): string {
  const mod = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
  return `  <url><loc>${SITE}${loc}</loc>${mod}</url>`;
}

export function sitemapXml(posts: PostMeta[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${url('/')}
${posts.map(p => url(`/${p.slug}/`, p.date)).join('\n')}
${url('/about/')}
${url('/stats/')}
</urlset>`;
}
