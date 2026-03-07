import type { PostMeta } from '../lib/frontmatter.js';

const SITE = 'https://gkoreli.com';

/** llms.txt — index for AI agents (llmstxt.org spec) */
export function llmsTxt(posts: PostMeta[]): string {
  const postLinks = posts
    .flatMap(p => {
      const links = [`- [${p.title}](${SITE}/${p.slug}.md): ${p.description}`];
      if (p.promptCount) links.push(`- [Prompts: ${p.title}](${SITE}/${p.slug}/prompts/): The ${p.promptCount} prompts that shaped this post`);
      return links;
    })
    .join('\n');

  return `# gkoreli.com

> Engineering blog by Goga Koreli — agentic product engineering, AI agents, and building in public.

This blog explores what it means to build software with AI agents. Posts are written with AI assistance but are not AI slop — every idea is human-directed. The source code, analytics, and architecture decisions are all public.

## Blog Posts

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
Published: ${p.date}
URL: ${SITE}/${p.slug}/

${contents[i]}`).join('\n\n');

  return `# gkoreli.com — Full Content

> Complete blog content for AI consumption. Individual posts available as .md files.

${sections}
`;
}

/** posts.json — structured post index */
export function postsJson(posts: PostMeta[]): string {
  return JSON.stringify(posts.map(p => ({
    slug: p.slug,
    title: p.title,
    date: p.date,
    description: p.description,
    tags: p.tags,
    url: `/${p.slug}/`,
    markdown: `/${p.slug}.md`,
    ...(p.promptCount && { prompts: `/${p.slug}/prompts/`, promptCount: p.promptCount }),
  })), null, 2);
}

/** Strip YAML frontmatter from markdown source */
export function stripFrontmatter(raw: string): string {
  return raw.replace(/^---[\s\S]*?---\n/, '');
}
