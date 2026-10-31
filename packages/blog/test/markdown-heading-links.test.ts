import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { initMarkdown, renderMarkdown } from '../src/lib/markdown.js';
import { parsePost } from '../src/lib/frontmatter.js';

await initMarkdown();

test('the measured fetcher answer has real server-rendered section destinations', async () => {
  const post = parsePost(fileURLToPath(new URL('../posts/023-which-ai-fetchers-send-which-headers.md', import.meta.url)));
  const html = await renderMarkdown(post.content);
  for (const id of ['duckassistbot-what-its-signature-actually-covers', 'how-a-site-owner-can-classify-ai-fetches', 'ai-fetcher-probe-method-and-limits']) {
    assert.equal(html.split(`id="${id}"`).length - 1, 1, id);
  }
  assert.ok(html.includes('Changing the path, query, method or User-Agent leaves verification successful.'));
});

test('heading collisions are resolved within each document without leaking across renders', async () => {
  const source = '# Repeat\n\n## Repeat\n\n## Repeat-1\n\n## Repeat';
  const [a, b] = await Promise.all([renderMarkdown(source), renderMarkdown(source)]);
  assert.equal(a, b);
  const ids = [...a.matchAll(/<h[1-6] id="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(ids, ['repeat', 'repeat-1', 'repeat-1-1', 'repeat-2']);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok((await renderMarkdown('# Repeat')).includes('id="repeat"'));
});

test('heading IDs preserve inline markup, Unicode and existing link behavior', async () => {
  const html = await renderMarkdown('## `User-Agent`: **covered** or [declared](/about)?\n\n## გამარჯობა მსოფლიო\n\n[External](https://example.test/)');
  assert.ok(html.includes('id="user-agent-covered-or-declared"'));
  assert.ok(html.includes('<code>User-Agent</code>'));
  assert.ok(html.includes('<strong>covered</strong>'));
  assert.ok(html.includes('<a href="/about">declared</a>'));
  assert.ok(html.includes('id="გამარჯობა-მსოფლიო"'));
  assert.ok(html.includes('target="_blank" rel="noopener"'));
});
