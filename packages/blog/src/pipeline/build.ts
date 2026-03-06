import { rmSync, existsSync, mkdirSync } from 'node:fs';
import { build as esbuild } from 'esbuild';
import { DIST, CLIENT_ENTRY, STYLES_SRC } from '../lib/paths.js';
import { discoverPosts, writeOutput, writeRoot, copyAssets } from '../lib/fs.js';
import { initMarkdown, renderMarkdown } from '../lib/markdown.js';
import { parsePost, validatePosts, parsePrompts } from '../lib/frontmatter.js';
import { pageShell } from '../templates/page.js';
import { postTemplate } from '../templates/post.js';
import { indexTemplate } from '../templates/index.js';
import { aboutTemplate } from '../templates/about.js';
import { rssFeed } from '../templates/rss.js';
import { promptsTemplate } from '../templates/prompts.js';
import { generateOgImage } from '../lib/og.js';

export { DIST } from '../lib/paths.js';

/** Step 1: Clean and prepare dist */
export function cleanDist(): void {
  if (existsSync(DIST)) rmSync(DIST, { recursive: true });
  mkdirSync(DIST, { recursive: true });
}

/** Step 2: Copy static assets from public/ */
export function copyStaticAssets(): void {
  copyAssets();
}

/** Step 3: Generate all HTML pages + feed */
export async function buildHTML(): Promise<void> {
  const start = performance.now();
  mkdirSync(DIST, { recursive: true });

  await initMarkdown();

  const files = discoverPosts();

  // Validate all posts upfront — skip invalid ones with clear feedback
  const validation = validatePosts(files);
  const invalid = validation.filter(r => !r.valid);
  for (const r of invalid) console.warn(`⚠ Skipping: ${r.errors}`);

  const posts = validation
    .filter(r => r.valid)
    .map(r => parsePost(r.file));
  const allPosts = posts.map(p => p.meta);
  const sortedPosts = [...allPosts].reverse();

  for (const post of posts) {
    const htmlContent = await renderMarkdown(post.content);
    const ogImage = await generateOgImage(post.meta.title, post.meta.slug);
    const prompts = parsePrompts(post.meta.slug);
    if (prompts) post.meta.promptCount = prompts.count;
    const body = postTemplate(post.meta, htmlContent, prompts);
    const page = pageShell({ title: post.meta.title, description: post.meta.description, content: body.toString(), posts: sortedPosts, currentSlug: post.meta.slug, ogImage });
    writeOutput(post.meta.slug, page.toString());

    if (prompts) {
      const promptsBody = promptsTemplate(post.meta, prompts);
      const promptsPage = pageShell({ title: `Prompts — ${post.meta.title}`, description: `The ${prompts.count} prompts that shaped "${post.meta.title}"`, content: promptsBody.toString(), posts: sortedPosts, currentSlug: post.meta.slug });
      writeOutput(`${post.meta.slug}/prompts`, promptsPage.toString());
    }
  }

  const indexBody = indexTemplate(sortedPosts);
  const indexPage = pageShell({ title: 'Blog', description: 'Engineering blog by Goga Koreli', content: indexBody.toString(), posts: sortedPosts });
  writeRoot('index.html', indexPage.toString());

  const aboutBody = aboutTemplate();
  const aboutPage = pageShell({ title: 'About', description: 'About Goga Koreli — agentic product engineer', content: aboutBody.toString(), posts: sortedPosts, currentSlug: 'about' });
  writeOutput('about', aboutPage.toString());

  writeRoot('feed.xml', rssFeed(sortedPosts));

  const elapsed = (performance.now() - start).toFixed(0);
  console.log(`Built ${posts.length} post(s) in ${elapsed}ms → dist/`);
}

/** Step 4: Bundle client JS + CSS */
export async function bundleClient(minify = true): Promise<void> {
  await esbuild({
    entryPoints: [CLIENT_ENTRY, STYLES_SRC],
    bundle: true,
    outdir: DIST,
    entryNames: '[name]',
    format: 'esm',
    minify,
    target: 'es2024',
  });
}
