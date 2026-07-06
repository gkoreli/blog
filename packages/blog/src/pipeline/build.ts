import { rmSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { build as esbuild } from 'esbuild';
import { DIST, SRC, ESBUILD_ENTRIES } from '../lib/paths.js';
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
import { blogPostingJsonLd } from '../templates/jsonld.js';
import { SECTION_LABELS, SECTION_DESCRIPTIONS } from '../lib/frontmatter.js';
import { homePage } from '../pages/home.js';
import { aboutPage } from '../pages/about.js';
import { postPage, seriesTrailBlock, seriesTrailMarkdown } from '../pages/post.js';
import { promptsPage } from '../pages/prompts.js';
import { privacyPage } from '../pages/privacy.js';
import { statsPage, statsHead } from '../pages/stats.js';
import { designLanguagePage } from '../pages/design-language.js';
import { animationsLabPage } from '../pages/animations-lab.js';
import { essaysPage } from '../pages/essays.js';
import { engineeringPage } from '../pages/engineering.js';
import { ossRadarPage } from '../pages/oss-radar.js';

export { DIST } from '../lib/paths.js';

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
  const sortedPosts = [...allPosts].sort((a, b) => b.date.localeCompare(a.date));

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
    const page = pageShell({ title: post.meta.title, description: post.meta.description, content: body.toString(), currentSlug: post.meta.slug, currentSection: post.meta.section, ogImage, head: jsonLd, layout: 'post', ogType: 'article', ...(post.meta.seoTitle !== undefined && { seoTitle: post.meta.seoTitle }) });
    writeOutput(post.meta.slug, page.toString());
    writeRoot(`${post.meta.slug}.md`, mdRawContents[i]! + seriesTrailMarkdown(post.meta, allPosts));

    if (prompts) {
      const promptsBody = promptsPage(post.meta, prompts);
      const promptsShell = pageShell({ title: `Thoughts by human, co-written by AI — ${post.meta.title}`, description: `${prompts.count} raw notes that shaped "${post.meta.title}"`, content: promptsBody.toString(), currentSlug: `${post.meta.slug}/prompts`, currentSection: post.meta.section, ogType: 'website' });
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
    const content = trail ? `${htmlContent}${trail}` : htmlContent;
    const page = pageShell({ title: post.meta.title, description: post.meta.description, content, currentSlug: post.meta.slug, currentSection: post.meta.section, ogImage, head: jsonLd, layout: post.meta.layout, scripts, ...(preamble && { preamble }), ogType: 'article', ...(post.meta.seoTitle !== undefined && { seoTitle: post.meta.seoTitle }) });
    writeOutput(post.meta.slug, page.toString());
    writeRoot(`${post.meta.slug}.md`, htmlToMarkdown(htmlContent, post.meta) + seriesTrailMarkdown(post.meta, allPosts));

    if (prompts) {
      const promptsBody = promptsPage(post.meta, prompts);
      const promptsShell = pageShell({ title: `Thoughts by human, co-written by AI — ${post.meta.title}`, description: `${prompts.count} raw notes that shaped "${post.meta.title}"`, content: promptsBody.toString(), currentSlug: `${post.meta.slug}/prompts`, currentSection: post.meta.section, ogType: 'website' });
      writeOutput(`${post.meta.slug}/prompts`, promptsShell.toString());
    }
  }

  // Collect all raw content for llms-full.txt
  const allRawContents = [
    ...mdRawContents,
    ...tsPosts.map(t => htmlToMarkdown(t.htmlContent, t.post.meta)),
  ];

  const indexBody = homePage(sortedPosts);
  const indexShell = pageShell({ title: 'Blog', description: 'Engineering blog by Goga Koreli', content: indexBody.toString() });
  writeRoot('index.html', indexShell.toString());

  const essaysBody = essaysPage(sortedPosts.filter(p => p.section === 'essays'));
  writeOutput('essays', pageShell({ title: SECTION_LABELS['essays'], description: SECTION_DESCRIPTIONS['essays'], content: essaysBody.toString(), currentSection: 'essays' }).toString());

  const engineeringBody = engineeringPage(sortedPosts.filter(p => p.section === 'engineering'));
  writeOutput('engineering', pageShell({ title: SECTION_LABELS['engineering'], description: SECTION_DESCRIPTIONS['engineering'], content: engineeringBody.toString(), currentSection: 'engineering', scripts: ['/canvas.js'] }).toString());

  const ossRadarBody = ossRadarPage(sortedPosts.filter(p => p.section === 'oss-radar'));
  writeOutput('oss-radar', pageShell({ title: SECTION_LABELS['oss-radar'], description: SECTION_DESCRIPTIONS['oss-radar'], content: ossRadarBody.toString(), currentSection: 'oss-radar', scripts: ['/canvas.js'] }).toString());

  const aboutBody = aboutPage();
  const aboutShell = pageShell({ title: 'About', description: 'About Goga Koreli — agentic product engineer', content: aboutBody.toString(), currentSlug: 'about' });
  writeOutput('about', aboutShell.toString());

  const statsBody = statsPage();
  const statsShell = pageShell({ title: 'Stats', description: 'Public analytics for gkoreli.com — transparent, cookieless', content: statsBody.toString(), currentSlug: 'stats', head: statsHead, noindex: true });
  writeOutput('stats', statsShell.toString());

  const privacyBody = privacyPage();
  const privacyShell = pageShell({ title: 'Privacy', description: 'Privacy policy for gkoreli.com — analytics, newsletter, and bot protection disclosure', content: privacyBody.toString(), currentSlug: 'privacy' });
  writeOutput('privacy', privacyShell.toString());

  const dlBody = designLanguagePage();
  const dlShell = pageShell({ title: 'Design Language', description: 'The design substrate of gkoreli.com — palette, typography, glass surfaces, canvas moods, section identities, and philosophy.', content: dlBody.toString(), currentSlug: 'design-language', noindex: true });
  writeOutput('design-language', dlShell.toString());

  const animationsLabBody = animationsLabPage();
  const animationsLabShell = pageShell({
    title: 'Animations Lab',
    description: 'Live motion experiments for the gkoreli.com animation runtime.',
    content: animationsLabBody.toString(),
    currentSlug: 'animations-lab',
    scripts: ['/animations-lab.js'],
    noindex: true,
  });
  writeOutput('animations-lab', animationsLabShell.toString());

  writeRoot('feed.xml', rssFeed(sortedPosts));
  writeRoot('sitemap.xml', sitemapXml(sortedPosts));
  writeRoot('llms.txt', llmsTxt(sortedPosts));
  writeRoot('llms-full.txt', llmsFullTxt(sortedPosts, allRawContents));
  writeRoot('posts.json', postsJson(sortedPosts));

  const elapsed = (performance.now() - start).toFixed(0);
  console.log(`Built ${mdPosts.length + tsPosts.length} post(s) in ${elapsed}ms → dist/`);
}

/** Step 4: Sanity-check built HTML for attribute encoding bugs */
export function validateHtmlOutput(): void {
  // Text-content attributes that legitimately hold encoded values
  const textValueAttrs = /(?:content|href|src|alt|title|name|type|value|rel|property|media|charset|crossorigin)=&quot;/;

  function scanDir(dir: string): string[] {
    const hits: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        hits.push(...scanDir(fullPath));
      } else if (entry.name.endsWith('.html')) {
        const content = readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]!;
          if (line.includes('=&quot;') && !textValueAttrs.test(line)) {
            hits.push(`${relative(DIST, fullPath)}:${i + 1}: ${line.trim()}`);
          }
        }
      }
    }
    return hits;
  }

  const hits = scanDir(DIST);
  if (hits.length > 0) {
    console.error('⚠ Attribute encoding bugs found in built HTML:');
    for (const h of hits) console.error(`  ${h}`);
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
