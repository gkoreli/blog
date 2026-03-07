import type { PostMeta } from '../lib/frontmatter.js';

const SITE = 'https://gkoreli.com';

/** JSON-LD BlogPosting structured data for search engines */
export function blogPostingJsonLd(meta: PostMeta, ogImage?: string): string {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: meta.title,
    datePublished: meta.date,
    description: meta.description,
    url: `${SITE}/${meta.slug}/`,
    author: { '@type': 'Person', name: 'Goga Koreli', url: `${SITE}/about/` },
    ...(ogImage && { image: `${SITE}${ogImage}` }),
  };
  return `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}
