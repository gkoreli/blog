import { cpSync, rmSync, existsSync, mkdirSync } from 'node:fs';
import { build as esbuild } from 'esbuild';
import { DIST, STYLES_SRC, CLIENT_ENTRY } from '../lib/paths.js';
import { discoverPosts, writeOutput, writeRoot, copyAssets } from '../lib/fs.js';
import { initMarkdown, renderMarkdown } from '../lib/markdown.js';
import { parsePost } from '../lib/frontmatter.js';
import { pageShell } from '../templates/page.js';
import { postTemplate } from '../templates/post.js';
import { indexTemplate } from '../templates/index.js';

export { DIST } from '../lib/paths.js';

export async function buildSite(): Promise<void> {
  const start = performance.now();

  if (existsSync(DIST)) rmSync(DIST, { recursive: true });
  mkdirSync(DIST, { recursive: true });

  await initMarkdown();

  const files = discoverPosts();
  const posts = files.map(parsePost);
  const allPosts = posts.map(p => p.meta);
  const sortedPosts = [...allPosts].reverse();

  for (const post of posts) {
    const htmlContent = await renderMarkdown(post.content);
    const body = postTemplate(post.meta, htmlContent);
    const page = pageShell({ title: post.meta.title, description: post.meta.description, content: body.toString(), posts: sortedPosts, currentSlug: post.meta.slug });
    writeOutput(post.meta.slug, page.toString());
  }

  const indexBody = indexTemplate(sortedPosts);
  const indexPage = pageShell({ title: 'Blog', description: 'Engineering blog by Goga Koreli', content: indexBody.toString(), posts: sortedPosts });
  writeRoot('index.html', indexPage.toString());

  cpSync(STYLES_SRC, `${DIST}/styles.css`);
  copyAssets();

  const elapsed = (performance.now() - start).toFixed(0);
  console.log(`Built ${posts.length} post(s) in ${elapsed}ms → dist/`);
}

export async function bundleClient(minify = true): Promise<void> {
  await esbuild({
    entryPoints: [CLIENT_ENTRY],
    bundle: true,
    outfile: `${DIST}/main.js`,
    format: 'esm',
    minify,
    target: 'es2024',
  });
}
