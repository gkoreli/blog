// A new paragraph-oriented index; the frozen 866-passage experiment is untouched.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { loadEncoder, modelConfig } from '../passage-search/model.mjs';

if (process.argv.length !== 6) throw new Error('Usage: node prepare-units.mjs /corpus /runtime /model /fresh-output');
const [corpusFile, runtime, model, output] = process.argv.slice(2).map(value => resolve(value));
const corpus = JSON.parse(readFileSync(corpusFile, 'utf8'));
const encoder = await loadEncoder(runtime, model); const sha = text => createHash('sha256').update(text).digest('hex');
const passages = []; let covered = 0; let splitBlocks = 0;
for (const article of corpus.articles) {
  for (const block of article.blocks) {
    if (/^h[1-6]$/.test(block.kind)) continue;
    covered += block.text.replace(/\s/g, '').length;
    const header = [article.title, block.heading.split(' > ').filter(text => text !== article.title).join(' > ')].filter(Boolean).join('\n');
    const input = text => modelConfig.documentPrefix + header + '\n\n' + text;
    function divide(text) {
      if (encoder.countTokens(input(text)) <= modelConfig.maximumTokens) return [text];
      const middle = Math.floor(text.length / 2); let cut = text.lastIndexOf(' ', middle);
      if (cut < text.length / 4) cut = text.indexOf(' ', middle);
      if (cut <= 0 || cut >= text.length - 1) cut = middle;
      if (text.length < 2) throw new Error('Context exceeds token budget');
      return [...divide(text.slice(0, cut)), ...divide(text.slice(cut))];
    }
    const pieces = divide(block.text); assert.equal(pieces.join(''), block.text);
    if (pieces.length > 1) splitBlocks++;
    for (const [part, piece] of pieces.entries()) {
      const text = piece.trim(); const searchText = header + '\n\n' + text;
      passages.push({ id: block.id + '/u' + part + '-' + sha(searchText).slice(0, 10), article: article.slug, title: article.title, heading: block.heading, anchor: block.anchor, kind: block.kind, sourceBlocks: [block.id], text, searchText, embeddingText: input(text), tokenCount: encoder.countTokens(input(text)), url: article.url + (block.anchor ? '#' + encodeURIComponent(block.anchor) : '') });
    }
  }
}
assert.equal(passages.reduce((sum, row) => sum + row.text.replace(/\s/g, '').length, 0), covered);
assert.equal(new Set(passages.map(row => row.id)).size, passages.length);
writeFileSync(output, JSON.stringify({ capturedAt: new Date().toISOString(), sourceCommit: corpus.sourceCommit, corpusSha256: sha(readFileSync(corpusFile)), method: 'One source block per unit with title/heading context; headings supply context, oversized source blocks split without loss or overlap below 480 complete input tokens.', model: modelConfig, splitBlocks, coveredBodyNonWhitespaceCharacters: covered, passages }, null, 2) + '\n', { flag: 'wx' });
await encoder.dispose(); console.log(JSON.stringify({ units: passages.length, splitBlocks, coveredBodyCharacters: covered, maxTokens: Math.max(...passages.map(row => row.tokenCount)) }));
