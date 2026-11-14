import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

if (process.argv.length !== 6) throw new Error('Usage: node verify-live.mjs /repo /corpus /live-capture /new-local-report');
const [repo, corpusFile, capture, output] = process.argv.slice(2).map(value => resolve(value));
const requireBlog = createRequire(join(repo, 'packages/blog/package.json'));
const requireTurndown = createRequire(requireBlog.resolve('turndown'));
const { createDocument } = requireTurndown('@mixmark-io/domino');
const corpus = JSON.parse(readFileSync(corpusFile, 'utf8'));
const receipt = JSON.parse(readFileSync(join(capture, 'capture-receipt.json'), 'utf8'));
const sha = input => createHash('sha256').update(input).digest('hex');
assert.deepEqual(receipt.results.map(row => row.slug).sort(), corpus.articles.map(row => row.slug).sort());
const excluded = new Set(['SCRIPT', 'STYLE', 'SVG', 'CANVAS', 'NAV', 'NOSCRIPT', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']);
const normalize = text => text.replace(/\s+/g, ' ').trim();
const compact = text => text.replace(/\s/g, '');
const articles = [];
for (const article of corpus.articles) {
  const entry = receipt.results.find(row => row.slug === article.slug);
  assert.equal(entry.status, 200, article.slug);
  const bytes = readFileSync(join(capture, 'html', article.slug + '.html'));
  assert.equal(sha(bytes), entry.sha256);
  assert.equal(sha(readFileSync(join(repo, 'packages/blog/posts', article.sourceFile))), article.sourceSha256, 'Source changed since corpus capture');
  const document = createDocument(bytes.toString('utf8'));
  const content = document.querySelector('.post-content'); assert(content, article.slug);
  const walker = document.createTreeWalker(content, 4); const text = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    let omit = false;
    for (let parent = node.parentElement; parent && parent !== content; parent = parent.parentElement) {
      if (excluded.has(parent.tagName) || parent.getAttribute('aria-hidden') === 'true') { omit = true; break; }
    }
    if (!omit) text.push(node.nodeValue);
  }
  const visibleText = normalize(text.join('')); const compactText = compact(visibleText);
  const blocks = article.blocks.map(block => ({ id: block.id, kind: block.kind, textSha256: sha(block.text), contained: compactText.includes(compact(block.text)), headingAnchorExists: !block.anchor || !!document.getElementById(block.anchor) }));
  const missing = blocks.filter(row => !row.contained);
  articles.push({ slug: article.slug, url: article.url, sourceSha256: article.sourceSha256, responseSha256: entry.sha256, visibleTextSha256: sha(visibleText), visibleText, blocks, missingBlocks: missing.length, missingHeadingAnchors: blocks.filter(row => !row.headingAnchorExists).length, literalTopicMatches: (visibleText.match(/\b(?:emojis?|emoticons?|openmoji|twemoji)\b/gi) ?? []).length });
}
const report = { capturedAt: new Date().toISOString(), sourceCommit: corpus.sourceCommit, articles: articles.length, sourceBlocks: articles.reduce((sum, row) => sum + row.blocks.length, 0), containedBlocks: articles.reduce((sum, row) => sum + row.blocks.filter(block => block.contained).length, 0), articlesWithMissingBlocks: articles.filter(row => row.missingBlocks).map(row => ({ slug: row.slug, missing: row.blocks.filter(block => !block.contained).map(block => block.id) })), missingHeadingAnchors: articles.reduce((sum, row) => sum + row.missingHeadingAnchors, 0), literalTopicMatches: articles.reduce((sum, row) => sum + row.literalTopicMatches, 0), pages: articles };
writeFileSync(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ...report, pages: undefined }));
