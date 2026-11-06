import assert from 'node:assert/strict';
import test from 'node:test';
import { readAcceptedResponse } from '../src/client/subscription-response.js';

const encoder = new TextEncoder();
function response(bytes: Uint8Array[], headers: Record<string, string> = {}) {
  return new Response(new ReadableStream<Uint8Array>({ start(controller) {
    for (const chunk of bytes) controller.enqueue(chunk);
    controller.close();
  } }), { status: 202, headers: { 'content-type': 'application/json', ...headers } });
}
function read(value: Response) { return readAcceptedResponse(value, new AbortController().signal); }

test('acceptance requires the public envelope, including a chunked response with JSON parameters', async () => {
  assert.deepEqual(await read(response([encoder.encode('{"o'), encoder.encode('k":true}')], {
    'content-type': 'Application/JSON; charset=utf-8',
  })), { confirmed: true });
});

for (const text of ['', ' ', 'null', 'true', '[]', '{}', '{"ok":false}', '{"ok":"true"}',
  '{"ok":true,"detail":"private@example.invalid"}', '{"ok":true', '<html>private</html>']) {
  test(`an invalid acceptance envelope is unconfirmed (${JSON.stringify(text)})`, async () => {
    assert.deepEqual(await read(response([encoder.encode(text)])), {
      confirmed: false, reason: text ? 'invalid' : 'empty',
    });
  });
}

test('JSON bytes are capped at 4096 despite a missing or false content-length', async () => {
  const maximum = encoder.encode('{"ok":true}' + ' '.repeat(4085));
  assert.equal(maximum.byteLength, 4096);
  assert.deepEqual(await read(response([maximum])), { confirmed: true });
  for (const headers of [undefined, { 'content-length': '1' }]) {
    assert.deepEqual(await read(response([maximum, encoder.encode(' ')], headers ?? {})), { confirmed: false, reason: 'too-large' });
  }
  // The limit counts wire bytes, rather than UTF-16 string length.
  const unicode = encoder.encode('é'.repeat(2049));
  assert.deepEqual(await read(response([unicode])), { confirmed: false, reason: 'too-large' });
});

test('an oversized declared response is cancelled without reading', async () => {
  let cancelled = 0;
  const value = new Response(new ReadableStream({ cancel() { cancelled++; } }), {
    headers: { 'content-type': 'application/json', 'content-length': '4097' },
  });
  assert.deepEqual(await read(value), { confirmed: false, reason: 'too-large' });
  assert.equal(cancelled, 1);
});

test('a missing or HTML media type cannot confirm a signup even with the expected text', async () => {
  for (const media of ['', 'text/html', 'application/jsonp']) {
    assert.deepEqual(await read(new Response('{"ok":true}', { headers: { 'content-type': media } })), {
      confirmed: false, reason: 'media-type',
    });
  }
});

test('invalid UTF-8 and a stream read error produce closed failure reasons', async () => {
  assert.deepEqual(await read(response([new Uint8Array([0xff])])), { confirmed: false, reason: 'invalid' });
  const broken = new Response(new ReadableStream({ start(controller) { controller.error(new Error('private response detail')); } }), {
    headers: { 'content-type': 'application/json' },
  });
  assert.deepEqual(await read(broken), { confirmed: false, reason: 'unreadable' });
});

test('a locked response is unconfirmed, rather than throwing through the transport adapter', async () => {
  const value = Response.json({ ok: true });
  const reader = value.body?.getReader();
  assert.ok(reader);
  assert.deepEqual(await read(value), { confirmed: false, reason: 'unreadable' });
  await reader.cancel();
  reader.releaseLock();
});

test('aborting a stalled body settles even when the source never finishes cancelling', async () => {
  let cancelled = 0;
  const value = new Response(new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(encoder.encode('{"ok":')); },
    cancel() { cancelled++; return new Promise<void>(() => {}); },
  }), { headers: { 'content-type': 'application/json' } });
  const abort = new AbortController();
  const result = readAcceptedResponse(value, abort.signal);
  await Promise.resolve();
  abort.abort();
  assert.deepEqual(await result, { confirmed: false, reason: 'aborted' });
  assert.equal(cancelled, 1);
});

test('an already aborted read releases the response without accepting its valid envelope', async () => {
  let cancelled = 0;
  const abort = new AbortController(); abort.abort();
  const value = new Response(new ReadableStream({ cancel() { cancelled++; } }), {
    headers: { 'content-type': 'application/json' },
  });
  assert.deepEqual(await readAcceptedResponse(value, abort.signal), { confirmed: false, reason: 'aborted' });
  assert.equal(cancelled, 1);
});
