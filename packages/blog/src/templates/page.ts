import { html, type TemplateResult } from '@nisli/core';
import type { PageDocument } from '../lib/ssg.js';
import type { Section } from '../lib/frontmatter.js';
import { typedLinkElements } from '../lib/typed-links.js';
import { DispatchSlip } from './artifacts.js';

function turnstileSiteKey(): string {
  return process.env['TURNSTILE_SITE_KEY'] ?? '';
}

const SITE_URL = 'https://gkoreli.com';

function canonicalUrl(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('?') || path.includes('#')) {
    throw new Error(`Canonical path must be a root-relative path without a query or fragment: ${path}`);
  }

  return new URL(path, SITE_URL).toString();
}

interface PageShellBaseProps {
  title: string;
  description: string;
  content: TemplateResult;
  canonicalPath: string;
  currentSlug?: string;
  currentSection?: Section;
  head?: string;
  gutter?: TemplateResult;
  preamble?: TemplateResult;
  layout?: string;
  scripts?: string[];
  ogType?: 'website' | 'article';
  noindex?: boolean;
  seoTitle?: string;
  postSlug?: string;
}

type PageShellProps = PageShellBaseProps & (
  | { ogImage: string; ogImageAlt: string }
  | { ogImage?: undefined; ogImageAlt?: undefined }
);

export function pageShell({ title, description, content, canonicalPath, currentSlug, currentSection, ogImage, ogImageAlt, head, gutter, preamble, layout, scripts, ogType = 'website', noindex = false, seoTitle, postSlug }: PageShellProps): PageDocument {
  const TURNSTILE_SITE_KEY = turnstileSiteKey();
  const canonical = canonicalUrl(canonicalPath);
  const layoutClass = layout && layout !== 'default' ? ` layout-${layout}` : '';
  const subscribe = DispatchSlip({ turnstileSiteKey: TURNSTILE_SITE_KEY });

  const isHome = !currentSlug && !currentSection;
  const pageTitle = seoTitle ?? `${title} — Goga Koreli`;
  const typedLinks = typedLinkElements({
    ...(postSlug ? { markdownPath: `/${postSlug}.md`, postSlug } : {}),
  });

  const documentHead = `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  ${noindex ? `<meta name="robots" content="noindex">` : ''}
  <link rel="canonical" href="${escapeHtml(canonical)}">
  ${typedLinks}
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:site_name" content="gkoreli.com">
  <meta property="og:type" content="${escapeHtml(ogType)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:creator" content="@GogaKoreli">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  ${ogImage ? `<meta property="og:image" content="https://gkoreli.com${escapeHtml(ogImage)}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="600">
  <meta property="og:image:alt" content="${escapeHtml(ogImageAlt)}">
  <meta name="twitter:image" content="https://gkoreli.com${escapeHtml(ogImage)}">
  <meta name="twitter:image:alt" content="${escapeHtml(ogImageAlt)}">` : ''}
  <meta name="author" content="Goga Koreli">
  <link rel="icon" href="/icons/logo.svg" type="image/svg+xml">
  <link rel="alternate" type="application/rss+xml" title="Goga Koreli" href="/feed.xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&display=swap">
  <link rel="stylesheet" href="/main.css">
  <script>document.documentElement.setAttribute('data-theme',localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'))</script>
  ${TURNSTILE_SITE_KEY ? `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" defer></script>` : ''}
  ${head ?? ''}
`;

  const body = html`
  ${preamble ?? ''}
  <div class="layout${layoutClass}" data-section=${currentSection}>
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
          <a href="/about" class="${currentSlug === 'about' ? 'active' : ''}"><span class="sb-dot"></span>About</a>
          <a href="/stats" class="${currentSlug === 'stats' ? 'active' : ''}"><span class="sb-dot"></span>Stats</a>
        </nav>

      </div>

      <div class="sidebar-spacer"></div>

      <nav class="sidebar-follow" aria-label="Follow this publication">
        <a href="#dispatch">Subscribe</a>
        <span aria-hidden="true">·</span>
        <a href="/feed.xml">RSS</a>
      </nav>

      <div class="sidebar-social">
        <a href="https://github.com/gkoreli" title="GitHub" target="_blank" rel="noopener"><img src="/icons/github.svg" width="16" height="16" alt="GitHub"></a>
        <a href="https://x.com/GogaKoreli" title="X" target="_blank" rel="noopener"><img src="/icons/x.svg" width="16" height="16" alt="X"></a>
        <a href="https://www.linkedin.com/in/goga-koreli/" title="LinkedIn" target="_blank" rel="noopener"><img src="/icons/linkedin.svg" width="16" height="16" alt="LinkedIn"></a>
        <nisli-theme-toggle></nisli-theme-toggle>
      </div>
    </aside>
    </div>

    <main class="content">
      ${content}

      ${subscribe}

      <footer>
        <p>Built with <a href="https://www.npmjs.com/package/@nisli/core">@nisli/core</a> · <a href="/privacy">Privacy</a></p>
      </footer>
    </main>
    <div class="gutter">${gutter ?? ''}</div>
  </div>

  <script type="module" src="/main.js"></script>
  ${scripts?.map(s => html`<script type="module" src="${s}"></script>`) ?? ''}
`;
  return { head: documentHead, body };
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
