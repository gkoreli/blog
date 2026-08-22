import type { PostMeta } from '../lib/frontmatter.js';

const SITE = 'https://gkoreli.com';
const AUTHOR_ID = `${SITE}/about#goga-koreli`;
const AUTHOR_SAME_AS = [
  'https://github.com/gkoreli',
  'https://x.com/GogaKoreli',
  'https://www.linkedin.com/in/goga-koreli/',
];

function script(value: Record<string, unknown>): string {
  return `<script type="application/ld+json">${JSON.stringify(value)}</script>`;
}

function authorJsonLd(): Record<string, unknown> {
  return {
    '@id': AUTHOR_ID,
    '@type': 'Person',
    name: 'Goga Koreli',
    url: `${SITE}/about`,
    sameAs: AUTHOR_SAME_AS,
  };
}

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
    dateModified: meta.lastModified ?? meta.date,
    author: authorJsonLd(),
  };

  if (altHeadline) ld.alternativeHeadline = altHeadline;
  if (keywords) ld.keywords = keywords;
  if (image) ld.image = image;

  return script(ld);
}

/** WebSite identity for the publication home page. */
export function websiteJsonLd(): string {
  return script({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'gkoreli.com',
    url: SITE,
    author: authorJsonLd(),
  });
}

/** ProfilePage identity tying the publication author to public profiles. */
export function profilePageJsonLd(): string {
  return script({
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: `${SITE}/about`,
    mainEntity: authorJsonLd(),
  });
}
