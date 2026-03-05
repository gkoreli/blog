import { html, raw } from 'nisli-static';
import type { PostMeta } from '../lib/frontmatter.js';

export function pageShell({ title, description, content, posts, currentSlug }: {
  title: string;
  description: string;
  content: string;
  posts: PostMeta[];
  currentSlug?: string;
}) {
  return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Goga Koreli</title>
  <meta name="description" content="${description}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="article">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <aside class="sidebar">
    <div class="sidebar-header">
      <a href="/">gkoreli.com</a>
      <p>Builder, not thought leader.</p>
    </div>
    <nav class="sidebar-nav">
      <h3>Posts</h3>
      ${posts.map(p => html`<a href="/${p.slug}" class="${currentSlug === p.slug ? 'active' : ''}">${p.title}</a>`)}
    </nav>
    <div class="sidebar-links">
      <a href="https://github.com/gkoreli">GitHub</a>
      <a href="https://www.npmjs.com/~gkoreli">npm</a>
    </div>
  </aside>

  <main class="content">
    ${raw(content)}

    <footer>
      <p>Built with <a href="https://www.npmjs.com/package/@nisli/core">@nisli/core</a></p>
    </footer>
  </main>

  <script type="module" src="/main.js"></script>
</body>
</html>`;
}
