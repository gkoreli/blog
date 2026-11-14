// Compare a local isolated build with the unchanged extracted source corpus.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

if (process.argv.length !== 6) throw new Error('Usage: node inspect-rendered.mjs /repo /source-corpus /isolated-dist /new-public-receipt');
const [repo, corpusFile, dist, output] = process.argv.slice(2).map(value => resolve(value));
const requireBlog = createRequire(join(repo, 'packages/blog/package.json'));
const { createDocument } = createRequire(requireBlog.resolve('turndown'))('@mixmark-io/domino');
const corpus = JSON.parse(readFileSync(corpusFile, 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const compact = text => text.replace(/\s/g, '');
const excluded = new Set(['SCRIPT', 'STYLE', 'SVG', 'CANVAS', 'NAV', 'NOSCRIPT', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']);
const pages = corpus.articles.map(article => {
  assert.equal(sha(readFileSync(join(repo, 'packages/blog/posts', article.sourceFile))), article.sourceSha256);
  const bytes = readFileSync(join(dist, article.slug, 'index.html'));
  const content = createDocument(bytes.toString('utf8')).querySelector('.post-content'); assert(content);
  const walker = content.ownerDocument.createTreeWalker(content, 4); const text = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    let omit = false;
    for (let parent = node.parentElement; parent && parent !== content; parent = parent.parentElement) if (excluded.has(parent.tagName) || parent.getAttribute('aria-hidden') === 'true') { omit = true; break; }
    if (!omit) text.push(node.nodeValue);
  }
  const rendered = compact(text.join(''));
  return { slug: article.slug, htmlSha256: sha(bytes), blocks: article.blocks.length, missing: article.blocks.filter(block => !rendered.includes(compact(block.text))).map(block => block.id) };
});
const report = { checkedAt: new Date().toISOString(), method: 'Filesystem reads of an isolated production build, no copied environment files. This is not deployment acceptance.', sourceCommit: corpus.sourceCommit, pages: pages.length, blocks: pages.reduce((n, page) => n + page.blocks, 0), missing: pages.reduce((n, page) => n + page.missing.length, 0), results: pages };
writeFileSync(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ...report, results: undefined }));
