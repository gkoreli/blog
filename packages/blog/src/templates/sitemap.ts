import type { PostMeta } from '../lib/frontmatter.js';

const SITE = 'https://gkoreli.com';

function url(loc: string, lastmod?: string): string {
  const mod = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
  return `  <url><loc>${SITE}${loc}</loc>${mod}</url>`;
}

export function sitemapXml(posts: PostMeta[]): string {
  const postUrls = posts.flatMap(p => {
    const urls = [url(`/${p.slug}/`, p.date)];
    if (p.promptCount) urls.push(url(`/${p.slug}/prompts/`, p.date));
    return urls;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${url('/')}
${postUrls.join('\n')}
${url('/about/')}
${url('/stats/')}
</urlset>`;
}
