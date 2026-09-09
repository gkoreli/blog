import assert from 'node:assert/strict';
import test from 'node:test';
import { publicPagePaths, publicPathsFromIndex } from '../src/worker/referrer-pages.js';

test('public route recognition uses the published index and rejects arbitrary or token-bearing paths', () => {
  const paths = publicPathsFromIndex([{ url: '/article', prompts: '/article/prompts' }]);
  assert.equal(paths.has('/'), true);
  assert.equal(paths.has('/engineering'), true);
  assert.equal(paths.has('/article'), true);
  assert.equal(paths.has('/article/prompts'), true);
  assert.equal(paths.has('/unpublished'), false);
  for (const url of ['/api/confirm/secret', '/article?token=secret', '//evil.example', 'https://evil.example']) {
    assert.throws(() => publicPathsFromIndex([{ url }]));
  }
});

test('route index loads coalesce, remain local to the binding, and tolerate unavailable assets', async () => {
  let calls = 0;
  const assets = { async fetch(request: Request) {
    calls++;
    assert.equal(new URL(request.url).pathname, '/posts.json');
    assert.equal(request.headers.has('Referer'), false);
    return Response.json([{ url: '/article' }]);
  } };
  const [first, second] = await Promise.all([publicPagePaths(assets), publicPagePaths(assets)]);
  assert.equal(first.has('/article'), true);
  assert.equal(second.has('/article'), true);
  assert.equal(calls, 1);
  await publicPagePaths(assets);
  assert.equal(calls, 1);
  const unavailable = { async fetch() { return new Response(null, { status: 503 }); } };
  const fallback = await publicPagePaths(unavailable);
  assert.equal(fallback.has('/engineering'), true);
  assert.equal(fallback.has('/article'), false);
});
