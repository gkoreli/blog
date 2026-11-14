// Reads publication-source articles and renders TypeScript article bodies into isolated SSG temp directories.
// Usage from packages/blog: node --import tsx .../prepare-corpus.mjs /repo /new/corpus.json
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

if (process.argv.length !== 4) throw new Error('Repository and fresh output file required');
const [repo, output] = process.argv.slice(2).map(value => resolve(value));
const requireBlog = createRequire(join(repo, 'packages/blog/package.json'));
const requireTurndown = createRequire(requireBlog.resolve('turndown'));
const domino = requireTurndown('@mixmark-io/domino');
const { Marked } = await import(pathToFileURL(requireBlog.resolve('marked')));
const { gfmHeadingId } = await import(pathToFileURL(requireBlog.resolve('marked-gfm-heading-id')));
const parser = new Marked(gfmHeadingId());
const { parsePost } = await import(pathToFileURL(join(repo, 'packages/blog/src/lib/frontmatter.ts')));
const { parsePostModule } = await import(pathToFileURL(join(repo, 'packages/blog/src/lib/post-module.ts')));
const { renderContent } = await import(pathToFileURL(join(repo, 'packages/blog/src/lib/ssg.ts')));
const hash = value => createHash('sha256').update(value).digest('hex');
const excluded = new Set(['SCRIPT', 'STYLE', 'SVG', 'CANVAS', 'NAV', 'NOSCRIPT', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']);
const blocks = new Set(['P', 'PRE', 'TABLE', 'LI', 'BLOCKQUOTE', 'FIGCAPTION', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6']);
const containers = new Set(['DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'ASIDE', 'BODY']);

function extract(html, slug) {
  const document = domino.createDocument(html);
  const walker = document.createTreeWalker(document.body, 4);
  const groups = []; let eligibleCharacters = 0;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    let omitted = false;
    for (let parent = node.parentElement; parent; parent = parent.parentElement) {
      if (excluded.has(parent.tagName) || parent.getAttribute('aria-hidden') === 'true') { omitted = true; break; }
    }
    if (omitted) continue;
    eligibleCharacters += node.nodeValue.replace(/\s/g, '').length;
    let owner = null;
    for (let parent = node.parentElement; parent; parent = parent.parentElement) {
      if (blocks.has(parent.tagName)) { owner = parent; break; }
    }
    if (!owner) for (let parent = node.parentElement; parent; parent = parent.parentElement) {
      if (containers.has(parent.tagName)) { owner = parent; break; }
    }
    owner ??= node.parentElement;
    const last = groups.at(-1);
    if (last?.owner === owner) {
      const boundary = !['P', 'PRE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(owner.tagName) && last.parent !== node.parentElement ? ' ' : '';
      last.text += boundary + node.nodeValue; last.parent = node.parentElement;
    } else groups.push({ owner, parent: node.parentElement, text: node.nodeValue });
  }
  const headingStack = []; const output = [];
  for (const group of groups) {
    const text = group.text.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const tag = group.owner.tagName;
    if (/^H[1-6]$/.test(tag)) {
      let anchor = group.owner.id;
      for (let parent = group.owner.parentElement; !anchor && parent && parent !== document.body; parent = parent.parentElement) anchor = parent.id;
      const level = Number(tag[1]);
      headingStack.length = level;
      headingStack[level - 1] = { text, anchor: anchor || '' };
    }
    const headings = headingStack.filter(Boolean);
    const anchor = [...headings].reverse().find(item => item.anchor)?.anchor || '';
    output.push({ id: `${slug}/b${String(output.length + 1).padStart(4, '0')}-${hash(text).slice(0, 8)}`, kind: tag.toLowerCase(), text, heading: headings.map(item => item.text).join(' > '), anchor });
  }
  assert.equal(output.reduce((sum, block) => sum + block.text.replace(/\s/g, '').length, 0), eligibleCharacters, `Text coverage mismatch: ${slug}`);
  return { blocks: output, eligibleNonWhitespaceCharacters: eligibleCharacters };
}

const directory = join(repo, 'packages/blog/posts'); const articles = [];
for (const file of readdirSync(directory).filter(file => /\.(md|ts)$/.test(file)).sort()) {
  const path = join(directory, file); const source = readFileSync(path);
  let meta; let html;
  if (file.endsWith('.md')) { const parsed = parsePost(path); meta = parsed.meta; html = await parser.parse(parsed.content); }
  else {
    const mod = parsePostModule(await import(pathToFileURL(path)), path); meta = mod.meta;
    [html] = await renderContent([mod.article()]);
    assert.equal(typeof html, 'string', `Missing rendered article: ${file}`);
  }
  const extracted = extract(html, meta.slug);
  assert(extracted.blocks.length > 1, `No body text: ${file}`);
  articles.push({ slug: meta.slug, title: meta.title, description: meta.description, tags: meta.tags, date: meta.date, section: meta.section, url: new URL('/' + meta.slug, 'https://gkoreli.com').href, sourceFile: file, sourceSha256: hash(source), renderedHtmlSha256: hash(html), ...extracted });
}
const corpus = { capturedAt: new Date().toISOString(), sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(), source: 'Current local posts/ publication sources; all Markdown bodies and rendered TypeScript article bodies. No draft directory or current-production capture.', extraction: 'DOM text nodes grouped by semantic blocks; whitespace normalized; headings retained as context. Scripts, styles, navigation, hidden decoration, controls, canvas/SVG and image-only content excluded. Every eligible non-whitespace text character accounted for once.', articles };
writeFileSync(output, JSON.stringify(corpus, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, articles: articles.length, blocks: articles.reduce((sum, article) => sum + article.blocks.length, 0), characters: articles.reduce((sum, article) => sum + article.eligibleNonWhitespaceCharacters, 0), sourceCommit: corpus.sourceCommit }));
