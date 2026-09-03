import { rmSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { build as esbuild } from 'esbuild';
import { DIST, SRC, ESBUILD_ENTRIES, REPO_ROOT } from '../lib/paths.js';
import { discoverPosts, writeOutput, writeRoot, copyAssets } from '../lib/fs.js';
import { initMarkdown, renderMarkdown } from '../lib/markdown.js';
import { parsePost, validatePosts, parsePrompts } from '../lib/frontmatter.js';
import type { Post } from '../lib/frontmatter.js';
import { pageShell } from '../templates/page.js';
import { rssFeed } from '../templates/rss.js';
import { generateOgImage } from '../lib/og.js';
import { sitemapXml } from '../templates/sitemap.js';
import TurndownService from 'turndown';
import { llmsTxt, llmsFullTxt, postsJson, stripFrontmatter } from '../templates/llms.js';
import { blogPostingJsonLd, profilePageJsonLd, websiteJsonLd } from '../templates/jsonld.js';
import { SECTION_LABELS, SECTION_DESCRIPTIONS } from '../lib/frontmatter.js';
import { homePage } from '../pages/home.js';
import { aboutPage } from '../pages/about.js';
import { postAfterword, postPage, seriesTrailBlock, seriesTrailMarkdown } from '../pages/post.js';
import { promptsPage } from '../pages/prompts.js';
import { privacyPage } from '../pages/privacy.js';
import { statsPage, statsHead } from '../pages/stats.js';
import { designLanguagePage } from '../pages/design-language.js';
import { animationsLabPage } from '../pages/animations-lab.js';
import { essaysPage } from '../pages/essays.js';
import { engineeringPage } from '../pages/engineering.js';
import { ossRadarPage } from '../pages/oss-radar.js';
import { licensePage } from '../pages/license.js';
import { cslJson, bibtex, citationMarkdown } from '../templates/citation.js';
import { robotsTxt } from '../templates/robots.js';
import { CONTENT_LICENSE } from '../lib/license.js';

export { DIST } from '../lib/paths.js';

const PUBLICATION_OG_IMAGE_ALT = 'gkoreli.com social card reading “Agentic Engineering Field Notes” and “Where excitement ends, depth begins.”';

function postOgImageAlt(title: string): string {
  return `gkoreli.com social card reading “${title}” and “Where excitement ends, depth begins.”`;
}

function contentLicenseMarkdown(): string {
  const repositoryLicense = readFileSync(join(REPO_ROOT, 'LICENSE'), 'utf-8');
  const heading = `## Content (${CONTENT_LICENSE.name})`;
  const start = repositoryLicense.indexOf(heading);
  if (start < 0) throw new Error(`Repository LICENSE is missing the ${heading} section`);

  // This section becomes a standalone page, so promote its heading without changing its text.
  return repositoryLicense.slice(start).trim().replace(/^## /, '# ');
}

/** Step 1: Clean and prepare dist */
export function cleanDist(): void {
  if (existsSync(DIST)) rmSync(DIST, { recursive: true });
  mkdirSync(DIST, { recursive: true });
}

/** Step 2: Scan src/components/ and regenerate src/styles/components.css import manifest */
export function buildComponentStyles(): void {
  const componentsDir = join(SRC, 'components');
  const stylesDir = join(SRC, 'styles');

  const cssFiles = readdirSync(componentsDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => join(componentsDir, e.name, `${e.name}.css`))
    .filter(f => existsSync(f))
    .sort();

  const imports = cssFiles
    .map(f => `@import '${relative(stylesDir, f).replace(/\\/g, '/')}';`)
    .join('\n');

  const manifestPath = join(stylesDir, 'components.css');
  const content = `/* AUTO-GENERATED — run build to regenerate */\n${imports}\n`;

  if (!existsSync(manifestPath) || readFileSync(manifestPath, 'utf-8') !== content) {
    writeFileSync(manifestPath, content);
  }
}

/** Step 3: Copy static assets from public/ */
export function copyStaticAssets(): void {
  copyAssets();
}

/** Step 3: Generate all HTML pages + feed */

function htmlToMarkdown(articleHtml: string, meta: { title: string; description: string }): string {
  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });

  td.remove(['canvas']);

  td.addRule('removeVisual', {
    filter: (node) => ['nisli-topo-hero', 'nisli-topo-diagram'].includes(node.nodeName.toLowerCase()),
    replacement: () => '',
  });

  td.addRule('scrollReveal', {
    filter: (node) => node.nodeName.toLowerCase() === 'nisli-scroll-reveal',
    replacement: (content) => content,
  });

  td.addRule('insight', {
    filter: (node) => node.nodeName.toLowerCase() === 'nisli-insight',
    replacement: (content, node) => {
      const label = (node as HTMLElement).querySelector?.('.insight-label')?.textContent ?? '';
      const body = content.replace(/^\*\*[^*]+\*\*\s*/, '').trim();
      return `\n> **${label}:** ${body}\n\n`;
    },
  });

  td.addRule('sectionNum', {
    filter: (node) => node.nodeName.toLowerCase() === 'nisli-section-num',
    replacement: (content) => `\n**${content.trim()}**\n\n`,
  });

  td.addRule('codeBlock', {
    filter: (node) => (node as HTMLElement).classList?.contains?.('code-block') ?? false,
    replacement: (content) => `\n\`\`\`\n${content.trim()}\n\`\`\`\n\n`,
  });

  return `# ${meta.title}\n\n${meta.description}\n\n${td.turndown(articleHtml)}`;
}
export async function buildHTML(): Promise<void> {
  const start = performance.now();
  mkdirSync(DIST, { recursive: true });

  await initMarkdown();

  const files = discoverPosts();
  const mdFiles = files.filter(f => f.endsWith('.md'));
  const tsFiles = files.filter(f => f.endsWith('.ts'));

  // Validate markdown posts upfront — skip invalid ones with clear feedback
  const validation = validatePosts(mdFiles);
  const invalid = validation.filter(r => !r.valid);
  for (const r of invalid) console.warn(`⚠ Skipping: ${r.errors}`);

  const mdPosts = validation
    .filter(r => r.valid)
    .map(r => parsePost(r.file));

  // Load TypeScript posts via dynamic import
  const tsPosts: { post: Post; htmlContent: string; preamble?: string }[] = [];
  for (const f of tsFiles) {
    const mod = await import(f) as { meta: Post['meta']; article: () => { toString(): string }; preamble?: () => { toString(): string } };
    const htmlContent = mod.article().toString();
    const preamble = mod.preamble?.().toString();
    tsPosts.push({
      post: { meta: mod.meta, content: '' },
      htmlContent,
      ...(preamble && { preamble }),
    });
  }

  // Combine all posts for nav, SEO, feeds
  const allPosts = [
    ...mdPosts.map(p => p.meta),
    ...tsPosts.map(t => t.post.meta),
  ];
  const discoveryIndex = new Map(files.map((file, index) => [
    basename(file).replace(/^\d+-/, '').replace(/\.(md|ts|html)$/, ''),
    index,
  ]));
  const sortedPosts = [...allPosts].sort((a, b) => {
    const dateOrder = b.date.localeCompare(a.date);
    if (dateOrder !== 0) return dateOrder;
    return (discoveryIndex.get(b.slug) ?? -1) - (discoveryIndex.get(a.slug) ?? -1);
  });
  const publicationOgImage = await generateOgImage('Agentic Engineering Field Notes', 'gkoreli-com');

  // Validate series: no duplicate order values within the same series id
  const seriesGroups = new Map<string, { slug: string; order: number }[]>();
  for (const p of allPosts) {
    if (!p.series) continue;
    const group = seriesGroups.get(p.series.id) ?? [];
    group.push({ slug: p.slug, order: p.series.order });
    seriesGroups.set(p.series.id, group);
  }
  for (const [id, entries] of seriesGroups) {
    const orders = entries.map(e => e.order);
    const dupes = orders.filter((o, i) => orders.indexOf(o) !== i);
    if (dupes.length > 0) {
      const slugs = entries.filter(e => dupes.includes(e.order)).map(e => e.slug).join(', ');
      throw new Error(`Series "${id}" has duplicate order ${dupes[0]} on: ${slugs}`);
    }
  }

  // Read raw markdown for .md endpoints and llms-full.txt
  const mdRawContents = validation
    .filter(r => r.valid)
    .map(r => stripFrontmatter(readFileSync(r.file, 'utf-8')));

  // Build markdown posts
  for (let i = 0; i < mdPosts.length; i++) {
    const post = mdPosts[i]!;
    const htmlContent = await renderMarkdown(post.content);
    const ogImage = await generateOgImage(post.meta.title, post.meta.slug);
    const prompts = parsePrompts(post.meta.slug);
    if (prompts) post.meta.promptCount = prompts.count;
    const body = postPage(post.meta, htmlContent, prompts, allPosts);
    const jsonLd = blogPostingJsonLd(post.meta, ogImage);
    const ogImageAlt = postOgImageAlt(post.meta.title);
    const page = pageShell({ title: post.meta.title, description: post.meta.description, content: body.toString(), canonicalPath: `/${post.meta.slug}`, currentSlug: post.meta.slug, currentSection: post.meta.section, ogImage, ogImageAlt, head: jsonLd, layout: 'post', ogType: 'article', postSlug: post.meta.slug, ...(post.meta.seoTitle !== undefined && { seoTitle: post.meta.seoTitle }) });
    writeOutput(post.meta.slug, page.toString());
    writeRoot(`${post.meta.slug}.md`, mdRawContents[i]! + seriesTrailMarkdown(post.meta, allPosts) + citationMarkdown(post.meta));
    writeRoot(`${post.meta.slug}.csl.json`, cslJson(post.meta));
    writeRoot(`${post.meta.slug}.bib`, `${bibtex(post.meta)}\n`);

    if (prompts) {
      const promptsBody = promptsPage(post.meta, prompts);
      const promptsShell = pageShell({ title: `Thoughts by human, co-written by AI — ${post.meta.title}`, description: `${prompts.count} raw notes that shaped "${post.meta.title}"`, content: promptsBody.toString(), canonicalPath: `/${post.meta.slug}/prompts`, currentSlug: `${post.meta.slug}/prompts`, currentSection: post.meta.section, ogImage, ogImageAlt, ogType: 'website' });
      writeOutput(`${post.meta.slug}/prompts`, promptsShell.toString());
    }
  }

  // Build TypeScript posts — content controls its own structure
  for (const { post, htmlContent, preamble } of tsPosts) {
    const ogImage = await generateOgImage(post.meta.title, post.meta.slug);
    const prompts = parsePrompts(post.meta.slug);
    if (prompts) post.meta.promptCount = prompts.count;
    const jsonLd = blogPostingJsonLd(post.meta, ogImage);
    const scripts = post.meta.layout === 'immersive' ? ['/immersive.js'] : [];
    const trail = seriesTrailBlock(post.meta, allPosts);
    const afterword = postAfterword(post.meta, allPosts);
    const content = `${htmlContent}${trail}${afterword}`;
    const ogImageAlt = postOgImageAlt(post.meta.title);
    const page = pageShell({ title: post.meta.title, description: post.meta.description, content, canonicalPath: `/${post.meta.slug}`, currentSlug: post.meta.slug, currentSection: post.meta.section, ogImage, ogImageAlt, head: jsonLd, layout: post.meta.layout, scripts, ...(preamble && { preamble }), ogType: 'article', postSlug: post.meta.slug, ...(post.meta.seoTitle !== undefined && { seoTitle: post.meta.seoTitle }) });
    writeOutput(post.meta.slug, page.toString());
    writeRoot(`${post.meta.slug}.md`, htmlToMarkdown(htmlContent, post.meta) + seriesTrailMarkdown(post.meta, allPosts) + citationMarkdown(post.meta));
    writeRoot(`${post.meta.slug}.csl.json`, cslJson(post.meta));
    writeRoot(`${post.meta.slug}.bib`, `${bibtex(post.meta)}\n`);

    if (prompts) {
      const promptsBody = promptsPage(post.meta, prompts);
      const promptsShell = pageShell({ title: `Thoughts by human, co-written by AI — ${post.meta.title}`, description: `${prompts.count} raw notes that shaped "${post.meta.title}"`, content: promptsBody.toString(), canonicalPath: `/${post.meta.slug}/prompts`, currentSlug: `${post.meta.slug}/prompts`, currentSection: post.meta.section, ogImage, ogImageAlt, ogType: 'website' });
      writeOutput(`${post.meta.slug}/prompts`, promptsShell.toString());
    }
  }

  // Collect all raw content for llms-full.txt
  const allRawContents = [
    ...mdRawContents,
    ...tsPosts.map(t => htmlToMarkdown(t.htmlContent, t.post.meta)),
  ];

  const indexBody = homePage(sortedPosts);
  const indexShell = pageShell({
    title: 'Agentic Engineering Field Notes',
    seoTitle: 'Goga Koreli — Agentic Engineering Field Notes',
    description: 'Field notes from building and evaluating AI agents, developer tools, and agentic systems — including experiments that fail.',
    content: indexBody.toString(),
    canonicalPath: '/',
    ogImage: publicationOgImage,
    ogImageAlt: PUBLICATION_OG_IMAGE_ALT,
    head: websiteJsonLd(),
  });
  writeRoot('index.html', indexShell.toString());

  const essaysBody = essaysPage(sortedPosts.filter(p => p.section === 'essays'));
  writeOutput('essays', pageShell({ title: SECTION_LABELS['essays'], description: SECTION_DESCRIPTIONS['essays'], content: essaysBody.toString(), canonicalPath: '/essays', currentSection: 'essays', ogImage: publicationOgImage, ogImageAlt: PUBLICATION_OG_IMAGE_ALT }).toString());

  const engineeringBody = engineeringPage(sortedPosts.filter(p => p.section === 'engineering'));
  writeOutput('engineering', pageShell({ title: SECTION_LABELS['engineering'], description: SECTION_DESCRIPTIONS['engineering'], content: engineeringBody.toString(), canonicalPath: '/engineering', currentSection: 'engineering', ogImage: publicationOgImage, ogImageAlt: PUBLICATION_OG_IMAGE_ALT }).toString());

  const ossRadarBody = ossRadarPage(sortedPosts.filter(p => p.section === 'oss-radar'));
  writeOutput('oss-radar', pageShell({ title: SECTION_LABELS['oss-radar'], description: SECTION_DESCRIPTIONS['oss-radar'], content: ossRadarBody.toString(), canonicalPath: '/oss-radar', currentSection: 'oss-radar', ogImage: publicationOgImage, ogImageAlt: PUBLICATION_OG_IMAGE_ALT }).toString());

  const aboutBody = aboutPage();
  const aboutShell = pageShell({ title: 'About', description: 'About Goga Koreli — agentic product engineer', content: aboutBody.toString(), canonicalPath: '/about', currentSlug: 'about', ogImage: publicationOgImage, ogImageAlt: PUBLICATION_OG_IMAGE_ALT, head: profilePageJsonLd() });
  writeOutput('about', aboutShell.toString());

  const statsBody = statsPage();
  const statsShell = pageShell({ title: 'Stats', description: 'Public analytics for gkoreli.com — transparent, cookieless', content: statsBody.toString(), canonicalPath: '/stats', currentSlug: 'stats', ogImage: publicationOgImage, ogImageAlt: PUBLICATION_OG_IMAGE_ALT, head: statsHead, noindex: true });
  writeOutput('stats', statsShell.toString());

  const privacyBody = privacyPage();
  const privacyShell = pageShell({ title: 'Privacy', description: 'Privacy policy for gkoreli.com — analytics, newsletter, and bot protection disclosure', content: privacyBody.toString(), canonicalPath: '/privacy', currentSlug: 'privacy', ogImage: publicationOgImage, ogImageAlt: PUBLICATION_OG_IMAGE_ALT });
  writeOutput('privacy', privacyShell.toString());

  const licenseBody = licensePage(await renderMarkdown(contentLicenseMarkdown()));
  const licenseShell = pageShell({ title: 'Content License', description: 'The license for articles, essays, images, and prompts published on gkoreli.com.', content: licenseBody.toString(), canonicalPath: '/license', currentSlug: 'license', ogImage: publicationOgImage, ogImageAlt: PUBLICATION_OG_IMAGE_ALT });
  writeOutput('license', licenseShell.toString());

  const dlBody = designLanguagePage();
  const dlShell = pageShell({ title: 'Design Language', description: 'The design substrate of gkoreli.com — palette, typography, glass surfaces, canvas moods, section identities, and philosophy.', content: dlBody.toString(), canonicalPath: '/design-language', currentSlug: 'design-language', ogImage: publicationOgImage, ogImageAlt: PUBLICATION_OG_IMAGE_ALT, noindex: true, scripts: ['/canvas.js'] });
  writeOutput('design-language', dlShell.toString());

  const animationsLabBody = animationsLabPage();
  const animationsLabShell = pageShell({
    title: 'Animations Lab',
    description: 'Live motion experiments for the gkoreli.com animation runtime.',
    content: animationsLabBody.toString(),
    canonicalPath: '/animations-lab',
    currentSlug: 'animations-lab',
    ogImage: publicationOgImage,
    ogImageAlt: PUBLICATION_OG_IMAGE_ALT,
    scripts: ['/animations-lab.js'],
    noindex: true,
  });
  writeOutput('animations-lab', animationsLabShell.toString());

  writeRoot('feed.xml', rssFeed(sortedPosts));
  writeRoot('sitemap.xml', sitemapXml(sortedPosts));
  writeRoot('llms.txt', llmsTxt(sortedPosts));
  writeRoot('llms-full.txt', llmsFullTxt(sortedPosts, allRawContents));
  writeRoot('posts.json', postsJson(sortedPosts));
  writeRoot('robots.txt', robotsTxt());

  const elapsed = (performance.now() - start).toFixed(0);
  console.log(`Built ${mdPosts.length + tsPosts.length} post(s) in ${elapsed}ms → dist/`);
}

/** Step 4: Sanity-check built HTML for encoding, canonical, and internal-link regressions */
export function validateHtmlOutput(): void {
  // Text-content attributes that legitimately hold encoded values
  const textValueAttrs = /(?:content|href|src|alt|title|name|type|value|rel|property|media|charset|crossorigin)=&quot;/;
  const siteUrl = 'https://gkoreli.com';

  interface BuiltHtmlPage {
    file: string;
    html: string;
    route?: string;
  }

  function scanDir(dir: string): BuiltHtmlPage[] {
    const pages: BuiltHtmlPage[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        pages.push(...scanDir(fullPath));
      } else if (entry.name.endsWith('.html')) {
        const file = relative(DIST, fullPath).replace(/\\/g, '/');
        const route = file === 'index.html'
          ? '/'
          : file.endsWith('/index.html')
            ? `/${file.slice(0, -'/index.html'.length)}`
            : undefined;
        pages.push({ file, html: readFileSync(fullPath, 'utf-8'), ...(route && { route }) });
      }
    }
    return pages;
  }

  function tags(html: string, tagName: string): string[] {
    return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'g'))].map(match => match[0]);
  }

  function attribute(tag: string, name: string): string | undefined {
    return tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
  }

  function metadata(html: string, key: 'name' | 'property', value: string): string | undefined {
    const tag = tags(html, 'meta').find(candidate => attribute(candidate, key) === value);
    return tag ? attribute(tag, 'content') : undefined;
  }

  function hasNoindex(html: string): boolean {
    const robots = metadata(html, 'name', 'robots');
    return robots?.split(',').some(value => value.trim().toLowerCase() === 'noindex') ?? false;
  }

  function headerBlock(headers: string, path: string): string[] | undefined {
    const lines = headers.split('\n');
    const start = lines.findIndex(line => line.trim() === path);
    if (start < 0) return undefined;

    const block: string[] = [];
    for (let i = start + 1; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.trim() === '') break;
      if (!/^\s/.test(line)) break;
      block.push(line.trim());
    }
    return block;
  }

  const pages = scanDir(DIST);
  const routes = new Set(pages.flatMap(page => page.route ? [page.route] : []));
  const indexableRoutes = new Set<string>();
  const socialImageAlts = new Map<string, { alt: string; file: string }>();
  const problems: string[] = [];

  for (const page of pages) {
    const lines = page.html.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.includes('=&quot;') && !textValueAttrs.test(line)) {
        problems.push(`${page.file}:${i + 1}: encoded attribute delimiter: ${line.trim()}`);
      }
    }

    if (page.route) {
      const expectedUrl = new URL(page.route, siteUrl).toString();
      const canonical = page.html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
      const ogUrl = metadata(page.html, 'property', 'og:url');
      if (canonical !== expectedUrl) {
        problems.push(`${page.file}: canonical is ${canonical ?? 'missing'}; expected ${expectedUrl}`);
      }
      if (ogUrl !== expectedUrl) {
        problems.push(`${page.file}: og:url is ${ogUrl ?? 'missing'}; expected ${expectedUrl}`);
      }

      const indexable = !hasNoindex(page.html);
      if (indexable) {
        indexableRoutes.add(page.route);
        const h1Count = [...page.html.matchAll(/<h1(?:\s|>)/g)].length;
        if (h1Count !== 1) {
          problems.push(`${page.file}: indexable page has ${h1Count} h1 elements; expected exactly 1`);
        }
      }

      const ogImage = metadata(page.html, 'property', 'og:image');
      const ogImageAlt = metadata(page.html, 'property', 'og:image:alt');
      const twitterCard = metadata(page.html, 'name', 'twitter:card');
      const twitterImage = metadata(page.html, 'name', 'twitter:image');
      const twitterImageAlt = metadata(page.html, 'name', 'twitter:image:alt');
      const ogSiteName = metadata(page.html, 'property', 'og:site_name');
      if (!ogImage) problems.push(`${page.file}: missing og:image`);
      if (!ogImageAlt) problems.push(`${page.file}: missing og:image:alt`);
      if (ogSiteName !== 'gkoreli.com') problems.push(`${page.file}: missing or invalid og:site_name`);
      if (twitterCard !== 'summary_large_image') problems.push(`${page.file}: twitter:card must be summary_large_image`);
      if (!twitterImage) problems.push(`${page.file}: missing twitter:image`);
      if (!twitterImageAlt) problems.push(`${page.file}: missing twitter:image:alt`);
      if (ogImage && twitterImage && ogImage !== twitterImage) {
        problems.push(`${page.file}: og:image and twitter:image do not match`);
      }
      if (ogImageAlt && twitterImageAlt && ogImageAlt !== twitterImageAlt) {
        problems.push(`${page.file}: Open Graph and Twitter image alt text do not match`);
      }
      if (ogImage && ogImageAlt) {
        const existing = socialImageAlts.get(ogImage);
        if (existing && existing.alt !== ogImageAlt) {
          problems.push(`${page.file}: reuses ${ogImage} with alt text that differs from ${existing.file}`);
        } else {
          socialImageAlts.set(ogImage, { alt: ogImageAlt, file: page.file });
        }
      }
      if (ogImage) {
        try {
          const imageUrl = new URL(ogImage);
          const imageFile = join(DIST, imageUrl.pathname.replace(/^\//, ''));
          if (imageUrl.origin !== siteUrl || !imageUrl.pathname.endsWith('.png')) {
            problems.push(`${page.file}: og:image must be a generated PNG on ${siteUrl}`);
          } else if (!existsSync(imageFile)) {
            problems.push(`${page.file}: og:image file does not exist at ${relative(DIST, imageFile)}`);
          }
        } catch {
          problems.push(`${page.file}: og:image is not a valid absolute URL`);
        }
      }

      const headEnd = page.html.indexOf('</head>');
      const head = headEnd >= 0 ? page.html.slice(0, headEnd) : '';
      const body = headEnd >= 0 ? page.html.slice(headEnd + '</head>'.length) : page.html;
      const rssAlternates = tags(head, 'link').filter(tag =>
        attribute(tag, 'rel') === 'alternate'
        && attribute(tag, 'type') === 'application/rss+xml'
        && attribute(tag, 'href') === '/feed.xml');
      if (rssAlternates.length !== 1) {
        problems.push(`${page.file}: expected exactly one RSS alternate link in <head>`);
      }
      if (!/<a\b[^>]*href="#dispatch"[^>]*>\s*Subscribe\s*<\/a>/.test(body)) {
        problems.push(`${page.file}: missing visible Subscribe link to #dispatch`);
      }
      if (!/<a\b[^>]*href="\/feed\.xml"[^>]*>\s*RSS\s*<\/a>/.test(body)) {
        problems.push(`${page.file}: missing visible RSS link`);
      }
      if ([...body.matchAll(/\sid="dispatch"/g)].length !== 1) {
        problems.push(`${page.file}: expected one #dispatch target`);
      }
      const emailLabels = [...body.matchAll(/<label\b([^>]*)>([\s\S]*?)<\/label>/g)]
        .filter(match => attribute(`<label${match[1]}>`, 'for') === 'subscribe-email' && match[2]?.trim() === 'Email address');
      if (emailLabels.length !== 1) {
        problems.push(`${page.file}: subscribe-email needs exactly one "Email address" label`);
      }
      const emailInputs = tags(body, 'input').filter(tag => attribute(tag, 'id') === 'subscribe-email');
      if (emailInputs.length !== 1) {
        problems.push(`${page.file}: expected exactly one #subscribe-email input`);
      }
      const liveStatuses = tags(body, 'p').filter(tag =>
        attribute(tag, 'role') === 'status' && attribute(tag, 'aria-live') === 'polite');
      if (liveStatuses.length !== 1) {
        problems.push(`${page.file}: subscription status must be one polite live region`);
      }
    }

    for (const match of page.html.matchAll(/\shref="([^"]+)"/g)) {
      const href = match[1];
      if (!href?.startsWith('/') || href.startsWith('//')) continue;
      const path = href.split(/[?#]/, 1)[0];
      if (!path) continue;
      const lastSegment = path.split('/').at(-1) ?? '';
      if (lastSegment.includes('.') || path.startsWith('/api/')) continue;
      const route = path.length > 1 ? path.replace(/\/+$/, '') : path;
      if (!routes.has(route)) {
        problems.push(`${page.file}: internal link points to missing route ${href}`);
      }
    }
  }

  const sitemapFile = join(DIST, 'sitemap.xml');
  const sitemapUrls = new Set<string>();
  if (!existsSync(sitemapFile)) {
    problems.push('sitemap.xml: missing');
  } else {
    const sitemap = readFileSync(sitemapFile, 'utf-8');
    const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].flatMap(match => match[1] ? [match[1]] : []);
    for (const location of locations) {
      if (sitemapUrls.has(location)) problems.push(`sitemap.xml: duplicate URL ${location}`);
      sitemapUrls.add(location);
    }

    const expectedUrls = new Set([...indexableRoutes].map(route => new URL(route, siteUrl).toString()));
    for (const expected of expectedUrls) {
      if (!sitemapUrls.has(expected)) problems.push(`sitemap.xml: missing indexable page ${expected}`);
    }
    for (const location of sitemapUrls) {
      if (!expectedUrls.has(location)) problems.push(`sitemap.xml: includes non-indexable or missing page ${location}`);
    }
  }

  const feedFile = join(DIST, 'feed.xml');
  const postsFile = join(DIST, 'posts.json');
  if (!existsSync(feedFile)) {
    problems.push('feed.xml: missing');
  } else if (!existsSync(postsFile)) {
    problems.push('posts.json: missing');
  } else {
    const feed = readFileSync(feedFile, 'utf-8');
    const parsedPosts: unknown = JSON.parse(readFileSync(postsFile, 'utf-8'));
    const expectedItemCount = Array.isArray(parsedPosts) ? parsedPosts.length : -1;
    if (expectedItemCount < 0) problems.push('posts.json: expected an array');

    const itemBlocks = [...feed.matchAll(/<item>([\s\S]*?)<\/item>/g)].flatMap(match => match[1] ? [match[1]] : []);
    if (itemBlocks.length !== expectedItemCount) {
      problems.push(`feed.xml: has ${itemBlocks.length} items; expected ${expectedItemCount}`);
    }

    const itemUrls = new Set<string>();
    for (const item of itemBlocks) {
      const link = item.match(/<link>([^<]+)<\/link>/)?.[1];
      const guid = item.match(/<guid>([^<]+)<\/guid>/)?.[1];
      if (!link || link !== guid) {
        problems.push('feed.xml: each item link and guid must be the same non-empty URL');
        continue;
      }
      if (itemUrls.has(link)) problems.push(`feed.xml: duplicate item URL ${link}`);
      itemUrls.add(link);
      try {
        const route = new URL(link).pathname.replace(/\/+$/, '') || '/';
        if (!indexableRoutes.has(route) || !sitemapUrls.has(link)) {
          problems.push(`feed.xml: item does not resolve to an indexed page ${link}`);
        }
      } catch {
        problems.push(`feed.xml: invalid item URL ${link}`);
      }
    }

    const atomSelfLinks = tags(feed, 'atom:link').filter(tag => attribute(tag, 'rel') === 'self');
    if (atomSelfLinks.length !== 1
      || attribute(atomSelfLinks[0] ?? '', 'href') !== `${siteUrl}/feed.xml`
      || attribute(atomSelfLinks[0] ?? '', 'type') !== 'application/rss+xml') {
      problems.push(`feed.xml: expected one valid ${siteUrl}/feed.xml atom self link`);
    }
  }

  const notFoundFile = join(DIST, '404.html');
  if (!existsSync(notFoundFile)) {
    problems.push('404.html: missing');
  } else {
    const notFound = readFileSync(notFoundFile, 'utf-8');
    const refresh = tags(notFound, 'meta').some(tag => attribute(tag, 'http-equiv')?.toLowerCase() === 'refresh');
    if (refresh) problems.push('404.html: must not use a meta refresh');
    if (!hasNoindex(notFound)) problems.push('404.html: must be noindex');
  }

  const headersFile = join(DIST, '_headers');
  if (!existsSync(headersFile)) {
    problems.push('_headers: missing');
  } else {
    const headers = readFileSync(headersFile, 'utf-8');
    for (const path of ['/*.md', '/llms-full.txt', '/posts.json']) {
      const block = headerBlock(headers, path);
      const noindex = block?.some(header => header.toLowerCase() === 'x-robots-tag: noindex') ?? false;
      if (!noindex) problems.push(`_headers: ${path} must set X-Robots-Tag: noindex`);
    }
  }

  if (problems.length > 0) {
    console.error('⚠ Built HTML validation failed:');
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
}

/** Step 5: Bundle client JS + CSS */
export async function bundleClient(minify = true): Promise<void> {
  await esbuild({
    entryPoints: ESBUILD_ENTRIES,
    bundle: true,
    outdir: DIST,
    entryNames: '[name]',
    format: 'esm',
    minify,
    target: 'es2024',
  });
}
