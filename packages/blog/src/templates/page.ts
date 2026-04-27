import { staticHtml as html, raw } from '@nisli/core/static';
import type { Section } from '../lib/frontmatter.js';
import { DispatchSlip } from './artifacts.js';

function turnstileSiteKey(): string {
  return process.env['TURNSTILE_SITE_KEY'] ?? '';
}

export function pageShell({ title, description, content, currentSlug, currentSection, ogImage, head, gutter, preamble, layout, scripts, ogType = 'website', noindex = false, seoTitle }: {
  title: string;
  description: string;
  content: string;
  currentSlug?: string;
  currentSection?: Section;
  ogImage?: string;
  head?: string;
  gutter?: string;
  preamble?: string;
  layout?: string;
  scripts?: string[];
  ogType?: 'website' | 'article';
  noindex?: boolean;
  seoTitle?: string;
}) {
  const TURNSTILE_SITE_KEY = turnstileSiteKey();
  const canonical = currentSlug ? `https://gkoreli.com/${currentSlug}` : 'https://gkoreli.com/';
  const layoutClass = layout && layout !== 'default' ? ` layout-${layout}` : '';
  const subscribe = DispatchSlip({ turnstileSiteKey: TURNSTILE_SITE_KEY });

  const isHome = !currentSlug && !currentSection;
  const pageTitle = seoTitle ?? `${title} — Goga Koreli`;

  return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${description}">
  ${noindex ? html`<meta name="robots" content="noindex">` : ''}
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:url" content="${canonical}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  ${ogImage ? html`<meta property="og:image" content="https://gkoreli.com${ogImage}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="600">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://gkoreli.com${ogImage}">
  <meta name="twitter:image:alt" content="${title}">` : ''}
  <meta name="author" content="Goga Koreli">
  <link rel="icon" href="/icons/logo.svg" type="image/svg+xml">
  <link rel="alternate" type="application/rss+xml" title="Goga Koreli" href="/feed.xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&display=swap">
  <link rel="stylesheet" href="/main.css">
  <script>document.documentElement.setAttribute('data-theme',localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'))</script>
  ${TURNSTILE_SITE_KEY ? html`<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" defer></script>` : ''}
  ${head ? raw(head) : ''}
</head>
<body>
  ${preamble ? raw(preamble) : ''}
  <div class="layout${layoutClass}"${currentSection ? raw(` data-section="${currentSection}"`) : ''}>
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

      <div class="sidebar-nav">
        <div class="sb-cat">Contents</div>
        <nav class="sidebar-section">
          <a href="/" class="${isHome ? 'active' : ''}"><span class="sb-dot"></span>Home</a>
          <a href="/essays" class="${currentSection === 'essays' ? 'active' : ''}"><span class="sb-dot"></span>Essays</a>
          <a href="/engineering" class="${currentSection === 'engineering' ? 'active' : ''}"><span class="sb-dot"></span>Engineering</a>
          <a href="/oss-radar" class="${currentSection === 'oss-radar' ? 'active' : ''}"><span class="sb-dot"></span>OSS Radar</a>
          <a href="/frames" class="${currentSection === 'frames' ? 'active' : ''}"><span class="sb-dot"></span>Frames</a>
          <a href="/about" class="${currentSlug === 'about' ? 'active' : ''}"><span class="sb-dot"></span>About</a>
          <a href="/stats" class="${currentSlug === 'stats' ? 'active' : ''}"><span class="sb-dot"></span>Stats</a>
        </nav>

        <div class="sidebar-section-sep"></div>

        <div class="sb-cat">Studio</div>
        <div class="sb-proj">
          <a href="https://github.com/gkoreli/backlog-mcp" class="sb-proj-link" target="_blank" rel="noopener">backlog-mcp<span class="sb-proj-arrow">↗</span></a>
          <a href="https://www.npmjs.com/package/@nisli/core" class="sb-proj-link" target="_blank" rel="noopener">@nisli/core<span class="sb-proj-arrow">↗</span></a>
          <a href="https://github.com/gkoreli/blog" class="sb-proj-link" target="_blank" rel="noopener">gkoreli.com<span class="sb-proj-arrow">↗</span></a>
          <a href="/design-language" class="sb-proj-link ${currentSlug === 'design-language' ? 'active' : ''}">Design Language</a>
          <a href="/animations-lab" class="sb-proj-link ${currentSlug === 'animations-lab' ? 'active' : ''}">Animations Lab</a>
        </div>
      </div>

      <div class="sidebar-spacer"></div>

      <div class="sidebar-social">
        <a href="https://github.com/gkoreli" title="GitHub" target="_blank" rel="noopener"><img src="/icons/github.svg" width="16" height="16" alt="GitHub"></a>
        <a href="https://x.com/GogaKoreli" title="X" target="_blank" rel="noopener"><img src="/icons/x.svg" width="16" height="16" alt="X"></a>
        <a href="https://www.linkedin.com/in/goga-koreli/" title="LinkedIn" target="_blank" rel="noopener"><img src="/icons/linkedin.svg" width="16" height="16" alt="LinkedIn"></a>
        <nisli-theme-toggle></nisli-theme-toggle>
      </div>
    </aside>
    </div>

    <main class="content">
      ${raw(content)}

      ${subscribe}

      <footer>
        <p>Built with <a href="https://www.npmjs.com/package/@nisli/core">@nisli/core</a> · <a href="/privacy">Privacy</a></p>
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
