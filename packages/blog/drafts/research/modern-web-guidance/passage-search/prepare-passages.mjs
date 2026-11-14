import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { loadEncoder, modelConfig } from './model.mjs';

if (process.argv.length !== 6) throw new Error('Usage: node prepare-passages.mjs /corpus.json /runtime /model /new/passages.json');
const [corpusPath, runtime, modelPath, output] = process.argv.slice(2).map(value => resolve(value));
const corpus = JSON.parse(readFileSync(corpusPath, 'utf8'));
const encoder = await loadEncoder(runtime, modelPath);
const sha = text => createHash('sha256').update(text).digest('hex');
const passages = []; let splitBlocks = 0; let bodyCharacters = 0;

for (const article of corpus.articles) {
  let pending = null;
  const headerFor = block => [article.title, block.heading.split(' > ').filter(text => text !== article.title).join(' > ')].filter(Boolean).join('\n');
  function flush() {
    if (!pending) return;
    const searchText = pending.header + '\n\n' + pending.text;
    const embeddingText = modelConfig.documentPrefix + searchText;
    const tokenCount = encoder.countTokens(embeddingText);
    assert(tokenCount <= modelConfig.maximumTokens);
    passages.push({ id: `${article.slug}/p${sha(searchText).slice(0, 16)}`, article: article.slug, title: article.title, heading: pending.heading, url: article.url + (pending.anchor ? '#' + encodeURIComponent(pending.anchor) : ''), text: pending.text, searchText, embeddingText, tokenCount, sourceBlocks: pending.sourceBlocks });
    pending = null;
  }
  function split(block, text) {
    const input = modelConfig.documentPrefix + headerFor(block) + '\n\n' + text;
    if (encoder.countTokens(input) <= modelConfig.packingTargetTokens) return [text];
    const middle = Math.floor(text.length / 2);
    let cut = text.lastIndexOf(' ', middle);
    if (cut < text.length / 4) cut = text.indexOf(' ', middle);
    if (cut <= 0 || cut >= text.length - 1) cut = middle;
    if (text.length < 2) throw new Error('Metadata alone exceeds token budget');
    return [...split(block, text.slice(0, cut)), ...split(block, text.slice(cut))];
  }
  for (const block of article.blocks) {
    if (/^h[1-6]$/.test(block.kind)) { flush(); continue; }
    bodyCharacters += block.text.replace(/\s/g, '').length;
    const header = headerFor(block);
    const wholeTokens = encoder.countTokens(modelConfig.documentPrefix + header + '\n\n' + block.text);
    const pieces = wholeTokens > modelConfig.maximumTokens ? split(block, block.text) : [block.text];
    if (pieces.length > 1) { splitBlocks++; flush(); }
    assert.equal(pieces.join(''), block.text, 'Splitting dropped source characters');
    for (const piece of pieces) {
      const text = piece.trim();
      const combined = pending && pending.header === header ? pending.text + '\n\n' + text : null;
      if (combined && encoder.countTokens(modelConfig.documentPrefix + header + '\n\n' + combined) <= modelConfig.packingTargetTokens) {
        pending.text = combined;
        if (!pending.sourceBlocks.includes(block.id)) pending.sourceBlocks.push(block.id);
      } else {
        flush();
        pending = { header, heading: block.heading, anchor: block.anchor, text, sourceBlocks: [block.id] };
      }
      if (pieces.length > 1) flush();
    }
  }
  flush();
}
assert.equal(passages.reduce((sum, passage) => sum + passage.text.replace(/\s/g, '').length, 0), bodyCharacters, 'Passage coverage mismatch');
assert.equal(new Set(passages.map(passage => passage.id)).size, passages.length, 'Duplicate passage IDs');
const result = { capturedAt: new Date().toISOString(), corpusSha256: sha(readFileSync(corpusPath)), sourceCommit: corpus.sourceCommit, model: modelConfig, method: 'Heading-local paragraph packing to 360 input tokens; individual blocks allowed up to 480; oversized blocks split without loss or overlap. The complete prefixed input was tokenized with truncation disabled before every embedding.', splitBlocks, coveredBodyNonWhitespaceCharacters: bodyCharacters, passages };
writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
await encoder.dispose();
console.log(JSON.stringify({ passages: passages.length, splitBlocks, maxTokens: Math.max(...passages.map(row => row.tokenCount)), coveredBodyCharacters: bodyCharacters, output }));
