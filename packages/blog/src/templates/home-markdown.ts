import type { PostMeta } from '../lib/frontmatter.js';

function inline(value: string): string {
  return value.replace(/[\\`*_\[\]<>]/g, character => `\\${character}`).replace(/\r?\n/g, ' ');
}

/** The same featured selection and post ordering as the HTML publication home. */
export function homeMarkdown(posts: readonly PostMeta[]): string {
  const featured = posts.find(post => post.featured) ?? posts[0];
  const latest = posts.filter(post => post.slug !== featured?.slug);
  const entry = (post: PostMeta) => `- [${inline(post.title)}](/${post.slug}) — ${inline(post.description)}`;
  return `# Agentic Engineering Field Notes

Field notes from building and evaluating AI agents, developer tools, and agentic systems — including experiments that fail.

${featured ? `## Featured\n\n${entry(featured)}\n\n` : ''}## Latest

${latest.map(entry).join('\n')}

## Tools

[Free engineering tools](/tools): check a public page, test robots rules and compare saved reports.

## Explore

- [Essays](/essays)
- [Engineering](/engineering)
- [OSS Radar](/oss-radar)
- [About Goga Koreli](/about)
- [RSS feed](/feed.xml)
`;
}
