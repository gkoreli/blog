import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectHtml } from '../.test-dist/html.js';
const base = new URL('https://public-site.com/article');
test('extracts source metadata without treating scripts or comments as markup', () => {
  const source = `<!doctype html><html lang="en"><head><title>Learn &amp; build</title><meta name='description' content='A > B'>
    <link rel="canonical" href="/article"><link rel='alternate' type='text/markdown' href='/article.md'>
    <meta name='robots' content='noindex, follow'><script>let fake = '<meta name="description" content="wrong"><h1>No</h1>';</script>
    <script type="application/ld+json">{"@graph":[{"@type":["Article","WebPage"]}]}</script></head>
    <body><h1>Hello</h1><p>Useful body &lt; here</p><a href='/a'>More</a><!-- <h1>Hidden</h1> --><style>.hidden {}</style></body></html>`;
  const result = inspectHtml(source, base);
  assert.equal(result.title, 'Learn & build');
  assert.equal(result.description, 'A > B');
  assert.equal(result.canonical, base.href);
  assert.equal(result.language, 'en');
  assert.equal(result.headings, 1);
  assert.equal(result.links, 1);
  assert.equal(result.scriptElements, 2);
  assert.deepEqual(result.structuredDataTypes, ['Article', 'WebPage']);
  assert.deepEqual(result.alternateLinks, [{ type: 'text/markdown', href: 'https://public-site.com/article.md' }]);
  assert.equal(result.textCharacters, 'Hello Useful body < here More'.length);
});
test('malformed JSON-LD remains explicit and template/noscript text is excluded', () => {
  const result = inspectHtml('<script type="application/ld+json">{bad}</script><template><h1>X</h1></template><noscript>More</noscript><p>Only this</p>', base);
  assert.equal(result.invalidStructuredDataBlocks, 1);
  assert.equal(result.structuredDataBlocks, 1);
  assert.equal(result.textCharacters, 9);
  assert.equal(result.headings, 0);
});
test('unsafe link schemes and credentials never become canonical links', () => {
  assert.equal(inspectHtml('<link rel=canonical href="javascript:alert(1)">', base).canonical, null);
  assert.equal(inspectHtml('<link rel=canonical href="https://user:pass@public-site.com/">', base).canonical, null);
});
test('bounded HTML with more than 50,000 tags is inspected through the final metadata', () => {
  const source = `<html><body>${'<h1>x</h1>'.repeat(50_001)}<meta name="description" content="Last metadata"><a href="/last">Last</a></body></html>`;
  assert.ok(new TextEncoder().encode(source).byteLength < 524_288);
  const result = inspectHtml(source, base);
  assert.equal(result.parseState, 'parsed');
  assert.equal(result.headings, 50_001);
  assert.equal(result.description, 'Last metadata');
  assert.equal(result.links, 1);
});
test('bounded source preview and heading outline remain text observations', () => {
  const source=`<html><body><nav>Navigation</nav><h1>A &amp; B <em>heading</em></h1><p>&lt;script&gt;Text only&lt;/script&gt; ${'body '.repeat(400)}</p>${'<h2>More</h2>'.repeat(20)}</body></html>`;
  const result=inspectHtml(source,base);
  assert.equal(result.textPreview.length,1200);
  assert.match(result.textPreview,/Navigation/);
  assert.match(result.textPreview,/<script>Text only<\/script>/);
  assert.deepEqual(result.headingOutline[0],{level:1,text:'A & B heading'});
  assert.equal(result.headingOutline.length,12);
});
