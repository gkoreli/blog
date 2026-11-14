import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareArticle } from '../dist/html.js';

const prepare = html => prepareArticle({ id: 'article', url: '/article', title: 'Article', html });

test('article passages preserve inline text, table boundaries, code and heading context once', () => {
  const result = prepare('<h1>Article</h1><h2 id="topic">Topic</h2><p>Read <code>this()</code> and <em>that</em>.</p><ul><li>Outer<p>Nested prose</p>Tail</li></ul><table><tr><td>First</td><td>Second</td></tr></table><pre><code>first\n  second</code></pre>');
  assert.deepEqual(result.article.passages.map(p=>p.text), ['Read this() and that.', 'Outer', 'Nested prose', 'Tail', 'First Second', 'first\n  second']);
  assert.deepEqual(result.article.passages[0].headings, ['Article','Topic']);
  assert.equal(new Set(result.article.passages.map(p=>p.anchor)).size,6);
  for (const passage of result.article.passages) assert(result.html.includes('id="'+passage.anchor+'"'));
  assert.equal(prepare(result.html).html,result.html);
});

test('owned anchors remain stable through inline-format changes and preserve unique authored IDs', () => {
  const one=prepare('<h2>Before</h2><p>The same <em>words</em>.</p><p id="owned">Other words.</p>');
  const two=prepare('<h2>Before</h2><p>The same words.</p><p id="owned">Other words.</p>');
  assert.equal(one.article.passages[0].anchor,two.article.passages[0].anchor);
  assert.equal(one.article.passages[1].anchor,'owned');
  assert.equal(prepare(one.html).html,one.html);
});

test('duplicate source text and duplicate pre-existing IDs receive unambiguous passage targets', () => {
  const result=prepare('<p id="duplicate">Repeated.</p><p id="duplicate">Repeated.</p><p>Repeated.</p>');
  assert.equal(new Set(result.article.passages.map(p=>p.anchor)).size,3);
  assert(result.article.passages.every(p=>p.anchor!=='duplicate'));
});

test('unpublished/source-note directives, hidden controls and visual-only content do not enter the index', () => {
  const result=prepare('<p>Public prose.</p><div data-search-ignore><p>Excluded note.</p></div><aside hidden>Hidden.</aside><p aria-hidden="true">Decoration.</p><script>bad()</script><svg><text>Picture</text></svg>');
  assert.deepEqual(result.article.passages.map(p=>p.text),['Public prose.']);
  assert(result.coverage.ignoredCharacters>0);
  assert(result.html.includes('Excluded note.'));
});

test('unsafe document URLs cannot become result links', () => {
  for(const url of ['javascript:alert(1)','//other.example','/article?q=secret','https://user:password@example.com/article']) assert.throws(()=>prepareArticle({id:'a',url,title:'A',html:'<p>Text</p>'}));
});

test('bare body text is searchable without requiring a framework-specific wrapper', () => {
  const result=prepare('Visible <em>inline</em> text.');
  assert.deepEqual(result.article.passages.map(p=>p.text),['Visible inline text.']);
  assert.equal(prepare(result.html).html,result.html);
});
