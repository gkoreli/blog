import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { html } from '@nisli/core';
import { buildDocuments, renderContent } from '../src/lib/ssg.js';
import { parsePostModule } from '../src/lib/post-module.js';
import { pageShell } from '../src/templates/page.js';
import { postPage } from '../src/pages/post.js';
import { promptsPage } from '../src/pages/prompts.js';

const meta = {
  title: 'Quotes " & <markup>',
  description: 'A description with "quotes" & <markup>',
  date: '2026-10-20',
  slug: 'ssg-fixture',
  section: 'engineering',
  tags: ['ssg'],
  layout: 'default',
  featured: false,
  images: [],
} as const;

function postModule() {
  return parsePostModule({ meta, article: () => html`<p>Custom & complete.</p>` }, 'fixture.ts');
}

test('SSG retains the complete document, escaped metadata, and client islands', async () => {
  const outDir = mkdtempSync(join(tmpdir(), 'blog-document-test-'));
  try {
    const document = pageShell({
      title: meta.title,
      description: meta.description,
      canonicalPath: '/ssg-fixture',
      currentSection: 'engineering',
      content: postModule().article(),
      preamble: html`<section class="fixture-preamble">Preamble</section>`,
      head: '<script type="application/ld+json">{"name":"fixture"}</script>',
      scripts: ['/immersive.js'],
    });
    const result = await buildDocuments(outDir, [{ path: '/ssg-fixture', document }]);
    const output = readFileSync(join(outDir, 'ssg-fixture/index.html'), 'utf8');
    assert.equal(result.pages[0]?.html, output);
    assert.match(output, /^<!DOCTYPE html>\s*<html lang="en">\s*<head>/);
    assert.match(output, /<title>Quotes &quot; &amp; &lt;markup&gt; — Goga Koreli<\/title>/);
    assert.match(output, /<link rel="canonical" href="https:\/\/gkoreli.com\/ssg-fixture">/);
    assert.match(output, /<script type="application\/ld\+json">{"name":"fixture"}<\/script>/);
    assert.match(output, /<body>\s*<section class="fixture-preamble">Preamble<\/section>/);
    assert.match(output, /<p>Custom &amp; complete\.<\/p>/);
    assert.match(output, /<nisli-burger-menu><\/nisli-burger-menu>/);
    assert.match(output, /<script type="module" src="\/immersive.js"><\/script>/);
    assert.match(output, /<\/body>\s*<\/html>$/);
    assert.doesNotMatch(output, /\[object Object\]|<!--(?:slot|tpl|list|each)-(?:start|end)-->/);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test('Markdown content keeps code markup, while prompt text remains escaped and exact', async () => {
  const post = postModule().meta;
  const prompt = 'Preserve <literal> & "quoted" text.\n  Keep this indentation.';
  const [article, prompts] = await renderContent([
    postPage(post, '<h1>Article</h1><pre><code>&lt;unsafe&gt; &amp; safe</code></pre>'),
    promptsPage(post, { count: 1, prompts: [prompt], preview: prompt }),
  ]);
  assert.match(article ?? '', /<pre><code>&lt;unsafe&gt; &amp; safe<\/code><\/pre>/);
  assert.match(prompts ?? '', /Preserve &lt;literal&gt; &amp; "quoted" text\.\n  Keep this indentation\./);
  assert.doesNotMatch(prompts ?? '', /<literal>/);
});

test('TypeScript posts reject invalid metadata, missing exports, and non-template results', () => {
  assert.throws(() => parsePostModule({}, 'missing.ts'), /Invalid TypeScript post module/);
  assert.throws(() => parsePostModule({ meta: { ...meta, section: 'unknown' }, article: () => html`` }, 'bad-meta.ts'));
  assert.throws(() => parsePostModule({ meta, article: 'not callable' }, 'bad-export.ts'), /template function/);
  const invalid = parsePostModule({ meta, article: () => '<p>Wrong type</p>' }, 'bad-result.ts');
  assert.throws(() => invalid.article(), /must return a Nisli template/);
});
