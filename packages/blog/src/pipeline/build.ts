import { rmSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { build as esbuild } from 'esbuild';
import { DIST, SRC, ESBUILD_ENTRIES } from '../lib/paths.js';
import { discoverPosts, writeOutput, writeRoot, copyAssets } from '../lib/fs.js';
import { initMarkdown, renderMarkdown } from '../lib/markdown.js';
import { parsePost, validatePosts, parsePrompts } from '../lib/frontmatter.js';
import type { Post, Section } from '../lib/frontmatter.js';
import { pageShell } from '../templates/page.js';
import { postTemplate } from '../templates/post.js';
import { indexTemplate } from '../templates/index.js';
import { aboutTemplate } from '../templates/about.js';
import { privacyTemplate } from '../templates/privacy.js';
import { statsTemplate, statsHead } from '../templates/stats.js';
import { rssFeed } from '../templates/rss.js';
import { promptsTemplate } from '../templates/prompts.js';
import { generateOgImage } from '../lib/og.js';
import { sitemapXml } from '../templates/sitemap.js';
import TurndownService from 'turndown';
import { llmsTxt, llmsFullTxt, postsJson, stripFrontmatter } from '../templates/llms.js';
import { blogPostingJsonLd } from '../templates/jsonld.js';
import { sectionArchiveTemplate, SECTION_LABELS, SECTION_DESCRIPTIONS } from '../templates/section.js';
import { designLanguageTemplate } from '../templates/design-language.js';

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
    const body = postTemplate(post.meta, htmlContent, prompts);
    const jsonLd = blogPostingJsonLd(post.meta, ogImage);
    const page = pageShell({ title: post.meta.title, description: post.meta.description, content: body.toString(), currentSlug: post.meta.slug, currentSection: post.meta.section, ogImage, head: jsonLd, layout: 'post', ogType: 'article' });
    writeOutput(post.meta.slug, page.toString());
    writeRoot(`${post.meta.slug}.md`, mdRawContents[i]!);

    if (prompts) {
      const promptsBody = promptsTemplate(post.meta, prompts);
      const promptsPage = pageShell({ title: `Prompts — ${post.meta.title}`, description: `The ${prompts.count} prompts that shaped "${post.meta.title}"`, content: promptsBody.toString(), currentSlug: `${post.meta.slug}/prompts`, currentSection: post.meta.section, ogType: 'website' });
      writeOutput(`${post.meta.slug}/prompts`, promptsPage.toString());
    }
  }

  // Build TypeScript posts — content controls its own structure
  for (const { post, htmlContent, preamble } of tsPosts) {
    const ogImage = await generateOgImage(post.meta.title, post.meta.slug);
    const prompts = parsePrompts(post.meta.slug);
    if (prompts) post.meta.promptCount = prompts.count;
    const jsonLd = blogPostingJsonLd(post.meta, ogImage);
    const scripts = post.meta.layout === 'immersive' ? ['/immersive.js'] : [];
    const page = pageShell({ title: post.meta.title, description: post.meta.description, content: htmlContent, currentSlug: post.meta.slug, currentSection: post.meta.section, ogImage, head: jsonLd, layout: post.meta.layout, scripts, ...(preamble && { preamble }), ogType: 'article' });
    writeOutput(post.meta.slug, page.toString());
    writeRoot(`${post.meta.slug}.md`, htmlToMarkdown(htmlContent, post.meta));

    if (prompts) {
      const promptsBody = promptsTemplate(post.meta, prompts);
      const promptsPage = pageShell({ title: `Prompts — ${post.meta.title}`, description: `The ${prompts.count} prompts that shaped "${post.meta.title}"`, content: promptsBody.toString(), currentSlug: `${post.meta.slug}/prompts`, currentSection: post.meta.section, ogType: 'website' });
      writeOutput(`${post.meta.slug}/prompts`, promptsPage.toString());
    }
  }

  // Collect all raw content for llms-full.txt
  const allRawContents = [
    ...mdRawContents,
    ...tsPosts.map(t => htmlToMarkdown(t.htmlContent, t.post.meta)),
  ];

  const indexBody = indexTemplate(sortedPosts);
  const indexPage = pageShell({ title: 'Blog', description: 'Engineering blog by Goga Koreli', content: indexBody.toString() });
  writeRoot('index.html', indexPage.toString());

  const sections: Section[] = ['essays', 'engineering', 'oss-radar', 'frames'];
  for (const section of sections) {
    const sectionPosts = sortedPosts.filter(p => p.section === section);
    const sectionBody = sectionArchiveTemplate(section, sectionPosts);
    const sectionPage = pageShell({ title: SECTION_LABELS[section], description: SECTION_DESCRIPTIONS[section], content: sectionBody.toString(), currentSection: section });
    writeOutput(section, sectionPage.toString());
  }

  const aboutBody = aboutTemplate();
  const aboutPage = pageShell({ title: 'About', description: 'About Goga Koreli — agentic product engineer', content: aboutBody.toString(), currentSlug: 'about' });
  writeOutput('about', aboutPage.toString());

  const statsBody = statsTemplate();
  const statsPage = pageShell({ title: 'Stats', description: 'Public analytics for gkoreli.com — transparent, cookieless', content: statsBody.toString(), currentSlug: 'stats', head: statsHead, noindex: true });
  writeOutput('stats', statsPage.toString());

  const privacyBody = privacyTemplate();
  const privacyPage = pageShell({ title: 'Privacy', description: 'Privacy policy for gkoreli.com — analytics, newsletter, and bot protection disclosure', content: privacyBody.toString(), currentSlug: 'privacy' });
  writeOutput('privacy', privacyPage.toString());

  const dlBody = designLanguageTemplate();
  const dlPage = pageShell({ title: 'Design Language', description: 'The design substrate of gkoreli.com — palette, typography, glass surfaces, canvas moods, section identities, and philosophy.', content: dlBody.toString(), currentSlug: 'design-language', noindex: true });
  writeOutput('design-language', dlPage.toString());

  writeRoot('feed.xml', rssFeed(sortedPosts));
  writeRoot('sitemap.xml', sitemapXml(sortedPosts));
  writeRoot('llms.txt', llmsTxt(sortedPosts));
  writeRoot('llms-full.txt', llmsFullTxt(sortedPosts, allRawContents));
  writeRoot('posts.json', postsJson(sortedPosts));

  const elapsed = (performance.now() - start).toFixed(0);
  console.log(`Built ${mdPosts.length + tsPosts.length} post(s) in ${elapsed}ms → dist/`);
}

/** Step 4: Bundle client JS + CSS */
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
