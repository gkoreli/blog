import type { PostMeta } from '../lib/frontmatter.js';
import { SECTION_LABELS, SECTION_DESCRIPTIONS } from '../lib/frontmatter.js';

const SITE = 'https://gkoreli.com';

/** llms.txt — index for AI agents (llmstxt.org spec) */
export function llmsTxt(posts: PostMeta[]): string {
  const postLinks = posts
    .flatMap(p => {
      const links = [`- [${p.title}](${SITE}/${p.slug}.md): [${SECTION_LABELS[p.section]}] ${p.description}`];
      if (p.promptCount) links.push(`- [Prompts: ${p.title}](${SITE}/${p.slug}/prompts): The ${p.promptCount} prompts that shaped this post`);
      return links;
    })
    .join('\n');

  const sectionLinks = (Object.keys(SECTION_LABELS) as (keyof typeof SECTION_LABELS)[])
    .map(s => `- [${SECTION_LABELS[s]}](${SITE}/${s}): ${SECTION_DESCRIPTIONS[s]}`)
    .join('\n');

  return `# gkoreli.com

> A personal publication by Goga Koreli — essays, engineering notes, and OSS Radar.

This is a personal publication with three sections: Essays (personal reflections), Engineering (building with agents and systems), and OSS Radar (open source ecosystem analysis). Posts are written with AI assistance but are human-directed. The source code, analytics, and architecture decisions are all public.

## Sections

${sectionLinks}

## Posts

${postLinks}

## API

- [Public Analytics](${SITE}/api/stats): Real-time analytics data (JSON, no auth required)
- [Post Index](${SITE}/posts.json): All posts with metadata (JSON)
- [RSS Feed](${SITE}/feed.xml): Subscribe to new posts

## Source

- [GitHub Repository](https://github.com/gkoreli/blog): Full source code, ADRs, and build pipeline
`;
}

/** llms-full.txt — full content for RAG / large-context models */
export function llmsFullTxt(posts: PostMeta[], contents: string[]): string {
  const sections = posts.map((p, i) => `---

## ${p.title}
Section: ${SECTION_LABELS[p.section]}
Published: ${p.date}
URL: ${SITE}/${p.slug}

${contents[i]}`).join('\n\n');

  return `# gkoreli.com — Full Content

> Complete publication content for AI consumption. Individual posts available as .md files.

${sections}
`;
}

/** posts.json — structured post index */
export function postsJson(posts: PostMeta[]): string {
  return JSON.stringify(posts.map(p => ({
    slug: p.slug,
    title: p.title,
    date: p.date,
    section: p.section,
    description: p.description,
    tags: p.tags,
    featured: p.featured,
    ...(p.alternativeHeadline && { alternativeHeadline: p.alternativeHeadline }),
    ...(p.lastModified && { lastModified: p.lastModified }),
    ...(p.series && { series: p.series }),
    url: `/${p.slug}`,
    markdown: `/${p.slug}.md`,
    ...(p.promptCount && { prompts: `/${p.slug}/prompts`, promptCount: p.promptCount }),
  })), null, 2);
}

/** Strip YAML frontmatter from markdown source */
export function stripFrontmatter(raw: string): string {
  return raw.replace(/^---[\s\S]*?---\n/, '');
}
