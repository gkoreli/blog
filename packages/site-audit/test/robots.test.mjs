import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRobots, evaluateRobots } from '../.test-dist/robots.js';

const decision = (text, token, path) => evaluateRobots(parseRobots(text), token, path);
test('case insensitive agent matching merges equally specific groups', () => {
  const text = 'User-agent: GPTBot\nDisallow: /private\nUser-agent: gptbot\nAllow: /private/public\nUser-agent: *\nDisallow: /';
  assert.equal(decision(text, 'GPTBot', '/private/x').decision, 'disallowed');
  assert.equal(decision(text, 'gptbot', '/private/public/x').decision, 'allowed');
  assert.equal(decision(text, 'Other', '/').decision, 'disallowed');
});
test('consecutive user-agent lines share rules and empty disallow permits all', () => {
  assert.equal(decision('User-agent: A\nUser-agent: B\nDisallow: /x', 'B', '/x').decision, 'disallowed');
  assert.equal(decision('User-agent: *\nDisallow:', 'A', '/x').decision, 'allowed');
});
test('longest rule, wildcard, terminal dollar and Allow tie', () => {
  const text = 'User-agent: *\nDisallow: /\nAllow: /docs\nDisallow: /*.pdf$\nAllow: /docs/a.pdf';
  assert.equal(decision(text, 'A', '/docs/a').decision, 'allowed');
  assert.equal(decision(text, 'A', '/x.pdf').decision, 'disallowed');
  assert.equal(decision(text, 'A', '/docs/a.pdf').decision, 'allowed');
  assert.equal(decision('User-agent: *\nDisallow: /a\nAllow: /a', 'A', '/a').decision, 'allowed');
  assert.equal(decision('User-agent: *\nDisallow: /a$', 'A', '/ab').decision, 'allowed');
});
test('UTF-8 octets and unreserved escapes normalize while encoded slash stays distinct', () => {
  const text = 'User-agent: *\nDisallow: /café\nDisallow: /~private\nDisallow: /a%2Fb';
  assert.equal(decision(text, 'A', '/caf%C3%A9').decision, 'disallowed');
  assert.equal(decision(text, 'A', '/%7eprivate').decision, 'disallowed');
  assert.equal(decision(text, 'A', '/a%2fb').decision, 'disallowed');
  assert.equal(decision(text, 'A', '/a/b').decision, 'allowed');
});
test('path matching is case sensitive, comments removed, BOM and CR accepted', () => {
  const document = parseRobots('\uFEFFUser-agent: *\rDisallow: /Private # note\rSitemap: https://foo.com/s.xml');
  assert.equal(evaluateRobots(document, 'A', '/private').decision, 'allowed');
  assert.equal(evaluateRobots(document, 'A', '/Private').decision, 'disallowed');
  assert.deepEqual(document.sitemaps, ['https://foo.com/s.xml']);
});
test('regexp punctuation is literal and overlapping agent names prefer longest', () => {
  const text = 'User-agent: Foo\nDisallow: /\nUser-agent: FooBot\nDisallow: /a.b';
  assert.equal(decision(text, 'FooBot', '/axb').decision, 'allowed');
  assert.equal(decision(text, 'FooBot', '/a.b').decision, 'disallowed');
});
test('parser and wildcard complexity limits return unknown instead of partial verdicts', () => {
  const tooManyRules = `User-agent: *\n${'Allow: /a\n'.repeat(5001)}Disallow: /`;
  assert.equal(decision(tooManyRules, 'A', '/').decision, 'unknown');
  const hostile = `User-agent: *\n${`Disallow: /*${'a'.repeat(1500)}b$\n`.repeat(300)}`;
  assert.equal(decision(hostile, 'A', `/${'a'.repeat(2000)}`).decision, 'unknown');
});
test('literal URI wildcard/end markers match their percent-encoded patterns', () => {
  assert.equal(decision('User-agent: *\nDisallow: /file-%2A.html', 'A', '/file-*.html').decision, 'disallowed');
  assert.equal(decision('User-agent: *\nDisallow: /foo-%24', 'A', '/foo-$').decision, 'disallowed');
});
test('leading wildcard rule and implicitly allowed robots path', () => {
  assert.equal(decision('User-agent: *\nDisallow: *.gif$', 'A', '/image.gif').decision, 'disallowed');
  assert.equal(decision('User-agent: *\nDisallow: /', 'A', '/robots.txt').decision, 'allowed');
});
