import { CONTENT_LICENSE } from './license.js';

interface TypedLink {
  href: string;
  rel: 'alternate' | 'author' | 'cite-as' | 'describedby' | 'license';
  type?: string;
}

interface PageTypedLinksOptions {
  markdownPath?: string;
  postSlug?: string;
}

/** Hook for adding rel="cite-as" after posts receive persistent identifiers. */
export function persistentIdentifierCiteAsUrl(_postSlug: string): string | null {
  return null;
}

export function pageTypedLinks({ markdownPath, postSlug }: PageTypedLinksOptions = {}): TypedLink[] {
  const links: TypedLink[] = [];

  if (markdownPath) {
    links.push({ href: markdownPath, rel: 'alternate', type: 'text/markdown' });
  }
  if (postSlug) {
    links.push({ href: '/posts.json', rel: 'describedby', type: 'application/json' });
  }

  links.push(
    { href: '/about', rel: 'author' },
    { href: CONTENT_LICENSE.url, rel: 'license' },
  );

  if (postSlug) {
    links.push({
      href: `/${postSlug}.csl.json`,
      rel: 'alternate',
      type: 'application/vnd.citationstyles.csl+json',
    });
    const citeAsUrl = persistentIdentifierCiteAsUrl(postSlug);
    if (citeAsUrl) links.push({ href: citeAsUrl, rel: 'cite-as' });
  }

  return links;
}

export function typedLinkHeaderValue(options: PageTypedLinksOptions = {}): string {
  return pageTypedLinks(options)
    .map(link => `<${link.href}>; rel="${link.rel}"${link.type ? `; type="${link.type}"` : ''}`)
    .join(', ');
}

export function typedLinkElements(options: PageTypedLinksOptions = {}): string {
  return pageTypedLinks(options)
    .map(link => `<link href="${link.href}" rel="${link.rel}"${link.type ? ` type="${link.type}"` : ''}>`)
    .join('\n  ');
}
