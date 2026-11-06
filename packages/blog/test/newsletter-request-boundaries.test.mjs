import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import { handleResendWebhook } from '../../newsletter/src/webhook.ts';
import { handleConfirmationRequest } from '../../newsletter/src/confirmation-request.ts';

const encoder = new TextEncoder();
const key = Buffer.from('synthetic raw-byte webhook key');
const secret = `whsec_${key.toString('base64')}`;
const payload = encoder.encode('{"type":"email.delivered","data":{"note":"fixture"}}');
const realSetTimeout = globalThis.setTimeout;
const realClearTimeout = globalThis.clearTimeout;

test.beforeEach(t => {
  t.mock.method(console, 'log', () => {});
  t.mock.method(console, 'warn', () => {});
});

function headers(bytes) {
  const id = 'synthetic-raw-byte-event';
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac('sha256', key)
    .update(`${id}.${timestamp}.`).update(bytes).digest('base64');
  return { 'content-type': 'application/json', 'svix-id': id,
    'svix-timestamp': timestamp, 'svix-signature': `v1,${signature}` };
}

function input(body, extra = {}, signatureBody = payload) {
  return new Request('https://gkoreli.com/api/webhooks/resend', {
    method: 'POST', headers: headers(signatureBody), body, duplex: 'half', ...extra,
  });
}

function environment() {
  return { RESEND_WEBHOOK_SECRET: secret,
    RESEND_API_KEY: 'synthetic-mail-key', TURNSTILE_SECRET_KEY: 'synthetic-proof-key',
    SUBSCRIBE_RATE_LIMITER: { async limit() { return { success: true }; } },
    DB: { prepare() { throw new Error('Rejected input must not reach persistence'); } },
  };
}

async function promptly(promise) {
  let timer;
  try {
    const response = await Promise.race([promise,
      new Promise(resolve => { timer = realSetTimeout(() => resolve(null), 250); })]);
    assert.notEqual(response, null, 'request remained pending at a terminal transport boundary');
    return response;
  } finally { realClearTimeout(timer); }
}

test('webhook accepts the exact signed bytes and rejects a changed ASCII body', async () => {
  assert.equal((await handleResendWebhook(input(payload), environment())).status, 200);
  const changed = encoder.encode('{"type":"email.delivered","data":{"note":"changed"}}');
  assert.equal((await handleResendWebhook(input(changed), environment())).status, 401);
});

test('adding an unsigned UTF-8 BOM cannot preserve a canonical-body signature', async () => {
  const changed = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), payload]);
  assert.equal((await handleResendWebhook(input(changed), environment())).status, 401);
});

test('an authentic BOM-prefixed JSON body is authenticated before decoding', async () => {
  const bytes = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), payload]);
  assert.equal((await handleResendWebhook(input(bytes, {}, bytes), environment())).status, 200);
});

test('authenticated malformed UTF-8 is a payload error, not normalized JSON', async () => {
  const bytes = Buffer.concat([Buffer.from('{"type":"email.delivered","data":{"note":"'),
    Buffer.from([0x80]), Buffer.from('"}}')]);
  assert.equal((await handleResendWebhook(input(bytes, {}, bytes), environment())).status, 400);
});

test('missing webhook authentication does not wait for an unfinished body', async () => {
  let reads = 0;
  const stream = new ReadableStream({ pull() { reads++; } }, { highWaterMark: 0 });
  const request = input(stream, { headers: { 'content-type': 'application/json' } });
  assert.equal((await promptly(handleResendWebhook(request, environment()))).status, 401);
  assert.equal(reads, 0);
});

test('webhook overflow returns without waiting for underlying cancellation', async () => {
  let cancelled = 0;
  const stream = new ReadableStream({
    pull(controller) { controller.enqueue(new Uint8Array(65_537)); },
    cancel() { cancelled++; return new Promise(() => {}); },
  }, { highWaterMark: 0 });
  assert.equal((await promptly(handleResendWebhook(input(stream), environment()))).status, 413);
  assert.equal(cancelled, 1);
});

test('confirmation overflow never waits for cancellation or reaches verification', async t => {
  t.mock.method(console, 'log', () => {});
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('No provider call before body admission'); });
  for (const mode of ['subscribe', 'resend']) {
    let cancelled = 0;
    const stream = new ReadableStream({
      pull(controller) { controller.enqueue(new Uint8Array(4097)); },
      cancel() { cancelled++; return new Promise(() => {}); },
    }, { highWaterMark: 0 });
    const request = new Request(`https://gkoreli.com/api/${mode}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: stream, duplex: 'half',
    });
    assert.equal((await promptly(handleConfirmationRequest(request, environment(), mode))).status, 413);
    assert.equal(cancelled, 1);
  }
});

test('already aborted webhook requests do not wait for body bytes', async () => {
  const abort = new AbortController(); abort.abort();
  const stream = new ReadableStream({ pull() {} }, { highWaterMark: 0 });
  assert.equal((await promptly(handleResendWebhook(input(stream, { signal: abort.signal }), environment()))).status, 408);
});

test('malformed webhook configuration is a closed service failure', async t => {
  t.mock.method(console, 'warn', () => {});
  assert.equal((await handleResendWebhook(input(payload), { ...environment(), RESEND_WEBHOOK_SECRET: 'whsec_' })).status, 503);
});

test('a slow confirmation body reaches its own deadline before any provider effect', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let cancelled = 0;
  let providerCalls = 0;
  t.mock.method(globalThis, 'fetch', async () => { providerCalls++; throw new Error('No provider call'); });
  const stream = new ReadableStream({ pull() {}, cancel() { cancelled++; } }, { highWaterMark: 0 });
  const request = new Request('https://gkoreli.com/api/subscribe', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: stream, duplex: 'half',
  });
  const pending = handleConfirmationRequest(request, environment(), 'subscribe');
  for (let i = 0; i < 6; i++) await Promise.resolve();
  t.mock.timers.tick(5000);
  assert.equal((await promptly(pending)).status, 408);
  assert.equal(cancelled, 1);
  assert.equal(providerCalls, 0);
});

test('request cancellation after body reading starts terminates a confirmation attempt', async t => {
  const abort = new AbortController();
  let cancelled = 0;
  const stream = new ReadableStream({ pull() {}, cancel() { cancelled++; } }, { highWaterMark: 0 });
  const request = new Request('https://gkoreli.com/api/subscribe', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: stream,
    signal: abort.signal, duplex: 'half',
  });
  const pending = handleConfirmationRequest(request, environment(), 'subscribe');
  for (let i = 0; i < 6; i++) await Promise.resolve();
  abort.abort();
  assert.equal((await promptly(pending)).status, 408);
  assert.equal(cancelled, 1);
});
