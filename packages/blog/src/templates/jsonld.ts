import type { PostMeta } from '../lib/frontmatter.js';

const SITE = 'https://gkoreli.com';

/** JSON-LD BlogPosting structured data for search engines */
export function blogPostingJsonLd(meta: PostMeta, ogImage?: string): string {
  const url = `${SITE}/${meta.slug}`;
  const altHeadline = meta.alternativeHeadline;
  const keywords = meta.tags?.length ? meta.tags : undefined;
  const image = ogImage
    ? { '@type': 'ImageObject', url: `${SITE}${ogImage}`, width: 1200, height: 600 }
    : undefined;

  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: meta.title,
    description: meta.description,
    url,
    mainEntityOfPage: url,
    datePublished: meta.date,
    dateModified: meta.date,
    author: { '@type': 'Person', name: 'Goga Koreli', url: `${SITE}/about` },
  };

  if (altHeadline) ld.alternativeHeadline = altHeadline;
  if (keywords) ld.keywords = keywords;
  if (image) ld.image = image;

  return `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}
