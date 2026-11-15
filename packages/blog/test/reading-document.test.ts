import assert from 'node:assert/strict';
import test from 'node:test';
import { html } from '@nisli/core';
import { renderContent } from '../src/lib/ssg.js';
import { assertUniqueElementIds, prepareReadingDocument } from '../src/lib/reading-document.js';

await renderContent([html`<p>Reading fixture</p>`]);
function dom(source: string): HTMLElement { const root = document.createElement('section'); root.innerHTML = source; return root; }
const text = (value: string | null) => value?.replace(/\s+/gu, ' ').trim();

test('reading preparation preserves authored IDs, escapes contents and is repeatable', () => {
  const source = '<h1>Article</h1><p>Original introduction.</p><h2 id="kept">One &amp; two</h2><p>Evidence <a href="/reference#fact">reference</a>.</p><h2>Repeated</h2><h2>Repeated</h2><h2 id="">Fourth</h2>';
  const prepared = prepareReadingDocument(source), root = dom(prepared.html);
  assert.deepEqual(prepared.outline.map(section => section.id), ['kept', 'repeated', 'repeated-2', 'fourth']);
  assert.equal(root.querySelector('h2')?.id, 'kept');
  assert.equal(root.querySelector('p')?.textContent, 'Original introduction.');
  assert.equal(root.querySelector('p a')?.getAttribute('href'), '/reference#fact');
  assert.equal(root.querySelectorAll('[data-reading-outline]').length, 1);
  for (const link of root.querySelectorAll<HTMLAnchorElement>('[data-reading-contents] a')) assert.ok(root.querySelector(`[id="${decodeURIComponent(link.hash.slice(1))}"]`));
  assert.deepEqual(prepareReadingDocument(prepared.html), prepared);
  assert.throws(() => prepareReadingDocument('<h2 id="same">A</h2><p id="same">B</p>'), /Repeated element ID/);
  assert.throws(() => assertUniqueElementIds('<!doctype html><html><body><header id="same"></header><main id="same"></main></body></html>'), /Repeated element ID/);
});

test('table framing retains every cell, link and merged-cell relationship', () => {
  const source = '<h2>Measurements</h2><table><caption>Full comparison</caption><thead><tr><th>Case</th><th>Before</th><th>After</th></tr></thead><tbody><tr><th><h3>Identity</h3></th><td>0</td><td><a href="/evidence">Unknown</a></td></tr></tbody></table><table><tr><th colspan="2">Group</th></tr><tr><td>A</td><td rowspan="2">Preserved</td></tr><tr><td>B</td></tr></table>';
  const before = dom(source), prepared = prepareReadingDocument(source), after = dom(prepared.html);
  assert.deepEqual([...after.querySelectorAll('table')].map(table => text(table.textContent)), [...before.querySelectorAll('table')].map(table => text(table.textContent)));
  assert.equal(after.querySelectorAll('table').length, 2);
  assert.equal(after.querySelectorAll('[data-reading-table]').length, 2);
  assert.equal(after.querySelectorAll('.reading-table--identified').length, 1);
  assert.equal(after.querySelector('table h3')?.id, 'identity');
  assert.equal(after.querySelector('td a')?.getAttribute('href'), '/evidence');
  assert.equal(after.querySelector('[colspan]')?.getAttribute('colspan'), '2');
  assert.equal(after.querySelector('[rowspan]')?.getAttribute('rowspan'), '2');
  for (const region of after.querySelectorAll('.reading-table-scroll')) assert.equal(region.getAttribute('tabindex'), '0');
  assert.deepEqual(prepareReadingDocument(prepared.html), prepared);
});
