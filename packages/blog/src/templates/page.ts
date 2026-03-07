import { html, raw } from 'nisli-static';
import type { PostMeta } from '../lib/frontmatter.js';

export function pageShell({ title, description, content, posts, currentSlug, ogImage, head }: {
  title: string;
  description: string;
  content: string;
  posts: PostMeta[];
  currentSlug?: string;
  ogImage?: string;
  head?: string;
}) {
  const canonical = currentSlug ? `https://gkoreli.com/${currentSlug}/` : 'https://gkoreli.com/';
  return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Goga Koreli</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonical}">
  ${ogImage ? html`<meta property="og:image" content="https://gkoreli.com${ogImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://gkoreli.com${ogImage}">` : ''}
  <meta name="author" content="Goga Koreli">
  <link rel="icon" href="/icons/logo.svg" type="image/svg+xml">
  <link rel="alternate" type="application/rss+xml" title="Goga Koreli" href="/feed.xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&display=swap">
  <link rel="stylesheet" href="/main.css">
  <script>document.documentElement.setAttribute('data-theme',localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'))</script>
  ${head ? raw(head) : ''}
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <a href="/" class="sidebar-logo">
          <img src="/icons/logo.svg" width="24" height="24" alt="">
          <span>gkoreli.com</span>
        </a>
        <p>Where excitement ends, depth begins.</p>
      </div>
      <div class="sidebar-links">
        <a href="https://github.com/gkoreli" class="sidebar-btn" title="GitHub" target="_blank" rel="noopener"><img src="/icons/github.svg" width="18" height="18" alt="GitHub"></a>
        <a href="https://www.npmjs.com/~gkoreli" class="sidebar-btn" title="npm" target="_blank" rel="noopener"><img src="/icons/npm.svg" width="18" height="18" alt="npm"></a>
        <a href="https://www.linkedin.com/in/goga-koreli/" class="sidebar-btn" title="LinkedIn" target="_blank" rel="noopener"><img src="/icons/linkedin.svg" width="18" height="18" alt="LinkedIn"></a>
        <nisli-theme-toggle></nisli-theme-toggle>
      </div>
      <div class="separator"><img src="/icons/sparkle.svg" class="separator-icon" width="14" height="14" alt=""></div>
      <nav class="sidebar-nav">
        <a href="/about" class="${currentSlug === 'about' ? 'active' : ''}">About</a>
        <a href="/stats" class="${currentSlug === 'stats' ? 'active' : ''}">Stats</a>
        ${posts.map(p => html`<a href="/${p.slug}" class="${currentSlug === p.slug ? 'active' : ''}">${p.title}</a>`)}
      </nav>
    </aside>

    <main class="content">
      ${raw(content)}

      <footer>
        <p>Built with <a href="https://www.npmjs.com/package/@nisli/core">@nisli/core</a></p>
      </footer>
    </main>
    <div class="gutter"></div>
  </div>

  <script type="module" src="/main.js"></script>
  <script>try{if(localStorage.analytics_ignore!=='true')fetch('/api/event',{method:'POST',keepalive:true,headers:{'Content-Type':'text/plain'},body:JSON.stringify({path:location.pathname})})}catch(e){}</script>
</body>
</html>`;
}
