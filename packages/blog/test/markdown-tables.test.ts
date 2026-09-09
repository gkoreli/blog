import assert from 'node:assert/strict';
import { test } from 'node:test';
import TurndownService from 'turndown';
import { preserveMarkdownTables } from '../src/lib/markdown-tables.js';

test('article tables preserve measurement headings, code, links, and empty cells', () => {
  const renderer = new TurndownService();
  preserveMarkdownTables(renderer);
  const result = renderer.turndown(`<div class="compare-table-scroll"><table>
    <thead><tr><th>Path</th><th>Attempts</th><th>Evidence</th></tr></thead>
    <tbody><tr><td>HTTP 429 → success</td><td>2</td><td><a href="https://example.com/record">Both attempts</a></td></tr>
    <tr><td><code>absent | empty</code></td><td>1</td><td></td></tr></tbody>
  </table></div>`);
  assert.equal(result, '| Path | Attempts | Evidence |\n| --- | --- | --- |\n| HTTP 429 → success | 2 | [Both attempts](https://example.com/record) |\n| `absent \\| empty` | 1 |  |');
});

test('merged cells retain HTML instead of silently changing column relationships', () => {
  const renderer = new TurndownService();
  preserveMarkdownTables(renderer);
  const result = renderer.turndown('<table><tr><th colspan="2">Combined</th></tr><tr><td>A</td><td>B</td></tr></table>');
  assert.match(result, /<th colspan="2">Combined<\/th>/);
  assert.match(result, /<td>A<\/td><td>B<\/td>/);
});
