import { resolve, join } from 'node:path';
import { cpSync, rmSync, existsSync, watch } from 'node:fs';
import { build as esbuild } from 'esbuild';
import { discoverPosts, writeOutput, writeRoot, copyAssets } from './lib/fs.js';
import { initMarkdown, renderMarkdown } from './lib/markdown.js';
import { parsePost } from './lib/frontmatter.js';
import { pageShell } from './templates/page.js';
import { postTemplate } from './templates/post.js';
import { indexTemplate } from './templates/index.js';
import type { PostMeta } from './lib/frontmatter.js';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');

async function build(): Promise<void> {
  const start = performance.now();

  // Clean
  if (existsSync(DIST)) rmSync(DIST, { recursive: true });

  // Init markdown + shiki
  await initMarkdown();

  // Discover and parse posts
  const files = discoverPosts();
  const posts = files.map(parsePost);

  // Render each post
  const metas: PostMeta[] = [];
  for (const post of posts) {
    const htmlContent = await renderMarkdown(post.content);
    const body = postTemplate(post.meta, htmlContent);
    const page = pageShell({ title: post.meta.title, description: post.meta.description, content: body.toString() });
    writeOutput(post.meta.slug, page.toString());
    metas.push(post.meta);
  }

  // Render index page
  const indexBody = indexTemplate(metas.reverse()); // newest first
  const indexPage = pageShell({ title: 'Blog', description: 'Engineering blog by Goga Koreli', content: indexBody.toString() });
  writeRoot('index.html', indexPage.toString());

  // Bundle client JS
  await esbuild({
    entryPoints: [join(ROOT, 'src/client/main.ts')],
    bundle: true,
    outfile: join(DIST, 'main.js'),
    format: 'esm',
    minify: true,
    target: 'es2024',
  });

  // Copy CSS
  cpSync(join(ROOT, 'src/styles/main.css'), join(DIST, 'styles.css'));

  // Copy static assets
  copyAssets();

  const elapsed = (performance.now() - start).toFixed(0);
  console.log(`Built ${posts.length} post(s) in ${elapsed}ms → dist/`);
}

// Watch mode
if (process.argv.includes('--watch')) {
  await build();

  const dirs = [join(ROOT, 'posts'), join(ROOT, 'src')];
  for (const dir of dirs) {
    watch(dir, { recursive: true }, async () => {
      console.log('\nRebuilding...');
      await build();
    });
  }
  console.log('Watching for changes...');
} else {
  await build();
}
