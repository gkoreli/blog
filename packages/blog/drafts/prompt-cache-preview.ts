/** Isolated preview only: never writes the blog's dist/ or publishes a route. */
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { article, meta } from './prompt-cache-context-edits.js';
import { pageShell } from '../src/templates/page.js';
import { PUBLIC_DIR, STYLES_SRC } from '../src/lib/paths.js';

const output = resolve(process.argv[2] ?? '/tmp/prompt-cache-article-preview');
if (!output.startsWith('/tmp/') && !output.startsWith('/private/tmp/')) {
  throw new Error('Draft preview must use its own /tmp directory');
}
mkdirSync(output, { recursive: true });
await build({ entryPoints: [STYLES_SRC], bundle: true, outfile: resolve(output, 'main.css'), loader: { '.woff2': 'file', '.ttf': 'file', '.svg': 'file' } });
cpSync(resolve(PUBLIC_DIR, 'icons'), resolve(output, 'icons'), { recursive: true });
cpSync(resolve(PUBLIC_DIR, 'fonts'), resolve(output, 'fonts'), { recursive: true });
const page = pageShell({ title: meta.title, description: meta.description, content: article().toString(), canonicalPath: `/${meta.slug}`, currentSlug: meta.slug, currentSection: meta.section, layout: meta.layout, noindex: true });
// The visual uses native details elements; no client bundle is needed to inspect it.
const standalone = page.toString()
  .replace(/<script[^>]+src="[^"]+"[^>]*><\/script>/g, '')
  .replace('href="/main.css"', 'href="./main.css"')
  .replaceAll('src="/icons/', 'src="./icons/')
  .replaceAll('href="/icons/', 'href="./icons/');
writeFileSync(resolve(output, 'index.html'), standalone);
console.log(`Draft rendered to ${output}/index.html`);
