import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/worker/index.ts';

const HTML = '<!doctype html><title>Post</title>';
const MARKDOWN = '# Post\n\nMarkdown body.';
const CSL = '{"type":"post-weblog"}\n';
const BIBTEX = '@misc{koreli2026post}\n';

function contentType(pathname: string): string {
  if (pathname.endsWith('.md')) return 'text/markdown; charset=utf-8';
  if (pathname.endsWith('.csl.json')) return 'application/vnd.citationstyles.csl+json';
  if (pathname.endsWith('.bib')) return 'application/x-bibtex; charset=utf-8';
  return 'text/html; charset=utf-8';
}

function harness() {
  const files = new Map([
    ['/post', HTML],
    ['/post.md', MARKDOWN],
    ['/post.csl.json', CSL],
    ['/post.bib', BIBTEX],
  ]);
  const writes: unknown[][] = [];
  const pending: Promise<unknown>[] = [];
  const env = {
    ANALYTICS_HASH_KEY: 'worker-test-key',
    ASSETS: {
      async fetch(request: Request) {
        const pathname = new URL(request.url).pathname.replace(/\/$/, '');
        const content = files.get(pathname);
        if (content === undefined) return new Response('Not found', { status: 404 });
        return new Response(request.method === 'HEAD' ? null : content, {
          headers: { 'Content-Type': contentType(pathname) },
        });
      },
    },
    DB: {
      prepare() {
        return {
          bind(...values: unknown[]) {
            return {
              async run() {
                writes.push(values);
              },
            };
          },
        };
      },
    },
  };
  const ctx = { waitUntil(promise: Promise<unknown>) { pending.push(promise); } };
  return { ctx, env, pending, writes };
}

function postRequest(path = '/post', init: RequestInit = {}): Request {
  return new Request(`https://gkoreli.com${path}`, init);
}

test('Worker negotiates Markdown and records the page-path representation', async () => {
  const { ctx, env, pending, writes } = harness();
  const response = await worker.fetch(postRequest('/post', {
    headers: { Accept: 'text/markdown, text/html;q=0.9' },
  }), env, ctx);

  assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
  assert.equal(response.headers.get('Content-Location'), '/post.md');
  assert.equal(response.headers.get('Vary'), 'Accept');
  assert.match(response.headers.get('Link') ?? '', /<\/post\.md>; rel="alternate"; type="text\/markdown"/);
  assert.equal(await response.text(), MARKDOWN);
  assert.equal(pending.length, 1);
  await Promise.all(pending);
  assert.equal(writes.length, 1);
  assert.equal(writes[0]?.[0], '/post');
  assert.ok(writes[0]?.includes('markdown'), 'representation column receives markdown');
});

test('Worker keeps HTML on ties and advertises every typed post link', async () => {
  const { ctx, env } = harness();
  const response = await worker.fetch(postRequest('/post', {
    headers: { Accept: 'text/markdown, text/html' },
  }), env, ctx);
  const link = response.headers.get('Link') ?? '';

  assert.equal(response.headers.get('Content-Type'), 'text/html; charset=utf-8');
  assert.equal(response.headers.get('Vary'), 'Accept');
  assert.match(link, /<\/posts\.json>; rel="describedby"; type="application\/json"/);
  assert.match(link, /<\/about>; rel="author"/);
  assert.match(link, /rel="license"/);
  assert.match(link, /<\/post\.csl\.json>; rel="alternate"; type="application\/vnd\.citationstyles\.csl\+json"/);
});

test('Worker negotiates CSL-JSON and does not observe direct Markdown assets', async () => {
  const cslHarness = harness();
  const cslResponse = await worker.fetch(postRequest('/post', {
    headers: { Accept: 'application/vnd.citationstyles.csl+json' },
  }), cslHarness.env, cslHarness.ctx);
  assert.equal(cslResponse.headers.get('Content-Type'), 'application/vnd.citationstyles.csl+json');
  assert.equal(await cslResponse.text(), CSL);
  assert.equal(cslHarness.pending.length, 0);

  const markdownHarness = harness();
  const directMarkdown = await worker.fetch(
    postRequest('/post.md'),
    markdownHarness.env,
    markdownHarness.ctx,
  );
  assert.equal(directMarkdown.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
  assert.match(directMarkdown.headers.get('Link') ?? '', /<\/post\.md>; rel="alternate"/);
  assert.equal(markdownHarness.pending.length, 0);
});
