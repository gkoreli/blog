import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { focusQuery as originalFocus } from './query.mjs';
import { focusQuery } from './query-v2.mjs';
import { renderPage } from './page.mjs';

test('topic focus retains category qualifiers and constraints rather than reducing a project query to one noun', () => {
  assert.equal(focusQuery('Find the post about the open source library for animated symbols without tracking').focused, 'the open source library for animated symbols without tracking');
  assert.equal(focusQuery('Which article talked about a tool for editing PDFs locally?').focused, 'a tool for editing PDFs locally?');
});

test('the post-validation repair does not change any measured query text in the 114-case pack', () => {
  const cases = JSON.parse(readFileSync(new URL('./cases.json', import.meta.url), 'utf8')).cases;
  assert.equal(cases.length, 114);
  for (const row of cases) assert.deepEqual(focusQuery(row.query), originalFocus(row.query), row.id);
});

test('server-rendered results expose links and source text without scripts and escape hostile query/source characters', () => {
  const catalog = { articles: 46, passages: 866, paragraphs: 3980, sourceCommit: '12345678', liveCapturedAt: '2026-11-14T00:00:00Z' };
  const result = { elapsedMs: 1, missingLiteralTerms: [], changed: false, articles: [{ article: 'example', title: 'Example', matches: [{ heading: 'Heading', kind: 'p', text: '<img src=x onerror=alert(1)>', navigation: { url: 'https://gkoreli.com/example#:~:text=example', label: 'Open paragraph' } }], contexts: [] }] };
  const html = renderPage({ catalog, query: '</textarea><script>alert(1)</script>', result });
  assert.ok(html.includes('Open paragraph')); assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(!html.includes('<script')); assert.ok(!html.includes('<img src=x'));
});
