import { html, raw } from 'nisli-static';
import type { PostMeta } from '../lib/frontmatter.js';

/**
 * Cloudflare Turnstile site key (public — safe to embed in HTML).
 * Set TURNSTILE_SITE_KEY in your build environment before running `pnpm build`.
 * Leave unset in local dev: the form falls back to button-always-enabled mode.
 * Get your site key: https://dash.cloudflare.com/ → Turnstile
 * Read at render time so build entrypoints can load env vars before page rendering.
 */
function turnstileSiteKey(): string {
  return process.env['TURNSTILE_SITE_KEY'] ?? '';
}

export function pageShell({ title, description, content, posts, currentSlug, ogImage, head, gutter, preamble, layout, scripts, ogType = 'website', noindex = false }: {
  title: string;
  description: string;
  content: string;
  posts: PostMeta[];
  currentSlug?: string;
  ogImage?: string;
  head?: string;
  gutter?: string;
  preamble?: string;
  layout?: string;
  /** Additional per-page script bundles (e.g. '/immersive.js', '/stats.js') */
  scripts?: string[];
  ogType?: 'website' | 'article';
  /** Prevent search engines from indexing this page */
  noindex?: boolean;
}) {
  const TURNSTILE_SITE_KEY = turnstileSiteKey();
  const canonical = currentSlug ? `https://gkoreli.com/${currentSlug}` : 'https://gkoreli.com/';
  const layoutClass = layout && layout !== 'default' ? ` layout-${layout}` : '';
  return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Goga Koreli</title>
  <meta name="description" content="${description}">
  ${noindex ? html`<meta name="robots" content="noindex">` : ''}
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="${ogType}">
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
  <script>document.documentElement.setAttribute('data-theme',localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'));${TURNSTILE_SITE_KEY ? 'window.__tsInit=function(){};' : ''}</script>
  ${TURNSTILE_SITE_KEY ? html`<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__tsInit&render=explicit" async defer></script>` : ''}
  ${head ? raw(head) : ''}
</head>
<body>
  ${preamble ? raw(preamble) : ''}
  <div class="layout${layoutClass}">
    <div class="sidebar-wrapper">
    <aside class="sidebar">
      <div class="sidebar-bar">
        <div class="sidebar-header">
          <a href="/" class="sidebar-logo">
            <img src="/icons/logo.svg" width="24" height="24" alt="">
            <span>gkoreli.com</span>
          </a>
          <p>Where excitement ends, depth begins.</p>
        </div>
        <nisli-burger-menu></nisli-burger-menu>
      </div>
      <div class="sidebar-social">
        <a href="https://github.com/gkoreli" title="GitHub" target="_blank" rel="noopener"><img src="/icons/github.svg" width="18" height="18" alt="GitHub"></a>
        <a href="https://x.com/GogaKoreli" title="X" target="_blank" rel="noopener"><img src="/icons/x.svg" width="18" height="18" alt="X"></a>
        <a href="https://www.linkedin.com/in/goga-koreli/" title="LinkedIn" target="_blank" rel="noopener"><img src="/icons/linkedin.svg" width="18" height="18" alt="LinkedIn"></a>
        <nisli-theme-toggle></nisli-theme-toggle>
      </div>
      <div class="sidebar-nav">
        <nav class="sidebar-section">
          <a href="/about" class="${currentSlug === 'about' ? 'active' : ''}">About</a>
          <a href="/stats" class="${currentSlug === 'stats' ? 'active' : ''}">Stats</a>
        </nav>
        <div class="separator"><img src="/icons/sparkle.svg" class="separator-icon" width="14" height="14" alt=""></div>
        <nav class="sidebar-section">
          ${posts.map(p => html`<a href="/${p.slug}" class="${currentSlug === p.slug ? 'active' : ''}">${p.title}</a>`)}
        </nav>
      </div>
    </aside>
    </div>

    <main class="content">
      ${raw(content)}

      <section class="subscribe">
        <p class="subscribe-kicker">Stay in the loop</p>
        <p class="subscribe-desc">No noise. The next thing I write, straight to your inbox.</p>
        <form id="sub-form" class="subscribe-form" novalidate${TURNSTILE_SITE_KEY ? html` data-turnstile-sitekey="${TURNSTILE_SITE_KEY}"` : ''}>
          <div class="subscribe-row">
            <input type="email" name="email" class="subscribe-input" placeholder="your@email.com" required autocomplete="email">
            <button type="submit" class="subscribe-btn">Subscribe</button>
          </div>
          <p class="subscribe-msg" aria-live="polite" role="status"></p>
          ${TURNSTILE_SITE_KEY ? html`<div class="turnstile-slot" hidden></div>` : ''}
        </form>
      </section>

      <footer>
        <p>Built with <a href="https://www.npmjs.com/package/@nisli/core">@nisli/core</a></p>
      </footer>
    </main>
    <div class="gutter">${gutter ? raw(gutter) : ''}</div>
  </div>

  <script type="module" src="/main.js"></script>
  ${scripts?.map(s => html`<script type="module" src="${s}"></script>`) ?? ''}
  <script>try{if(localStorage.analytics_ignore!=='true')fetch('/api/event',{method:'POST',keepalive:true,headers:{'Content-Type':'text/plain'},body:JSON.stringify({path:location.pathname,referrer:document.referrer||undefined})})}catch(e){}</script>
</body>
</html>`;
}
