import assert from 'node:assert/strict';
import test from 'node:test';
import { sendNewsletterBatch } from '../../newsletter/src/email.ts';

const audience = [
  { email: 'first@example.invalid', unsubscribeToken: 'synthetic-first-token' },
  { email: 'second@example.invalid', unsubscribeToken: 'synthetic-second-token' },
];
const key = 'newsletter-campaign/12345678-1234-4234-8234-123456789abc/0';
const send = (recipients = audience, identity = key) => sendNewsletterBatch(
  'synthetic-key', recipients, 'Synthetic subject', '<p>Synthetic content</p>', 'Synthetic content', identity,
);

test('batch acceptance uses complete ordered IDs and the durable caller identity', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url, ...init });
    return Response.json({ data: [{ id: 'synthetic-first-id' }, { id: 'synthetic-second-id' }] });
  });
  assert.deepEqual(await send(), audience.map((recipient, index) => ({
    email: recipient.email, resend_id: index === 0 ? 'synthetic-first-id' : 'synthetic-second-id',
    error: null, outcome: 'accepted',
  })));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.resend.com/emails/batch');
  assert.equal(calls[0].redirect, 'manual');
  assert.ok(calls[0].signal instanceof AbortSignal);
  assert.equal(new Headers(calls[0].headers).get('Idempotency-Key'), key);
  const body = JSON.parse(calls[0].body);
  assert.deepEqual(body.map(message => message.to), audience.map(recipient => recipient.email));
  assert.ok(body.every(message => message.headers['List-Unsubscribe-Post'] === 'List-Unsubscribe=One-Click'));
});

test('the optional identity preserves older direct-call shape without inventing a key', async t => {
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    assert.equal(new Headers(init.headers).has('Idempotency-Key'), false);
    return Response.json({ data: [{ id: 'synthetic-id' }] });
  });
  const results = await sendNewsletterBatch('synthetic-key', audience.slice(0, 1), 'subject', 'html', 'text');
  assert.equal(results[0].outcome, 'accepted');
});

for (const [label, reply] of [
  ['missing data', {}], ['non-array data', { data: {} }], ['empty data', { data: [] }],
  ['short data', { data: [{ id: 'first' }] }],
  ['extra data', { data: [{ id: 'first' }, { id: 'second' }, { id: 'extra' }] }],
  ['missing ID', { data: [{ id: 'first' }, {}] }],
  ['non-string ID', { data: [{ id: 'first' }, { id: 123 }] }],
  ['empty ID', { data: [{ id: 'first' }, { id: '' }] }],
  ['whitespace ID', { data: [{ id: 'first' }, { id: ' second ' }] }],
  ['control-character ID', { data: [{ id: 'first' }, { id: 'second\n' }] }],
  ['duplicate IDs', { data: [{ id: 'same' }, { id: 'same' }] }],
]) {
  test(`batch ${label} stays unknown and is never automatically replayed`, async t => {
    let calls = 0;
    t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json(reply); });
    const result = await send();
    assert.ok(result.every(receipt => receipt.outcome === 'unknown'
      && receipt.resend_id === null && receipt.error === 'provider_response_invalid'));
    assert.equal(calls, 1);
  });
}

for (const status of [400, 401, 403, 422, 429]) {
  test(`batch HTTP ${status} is a definite rejection with no raw error text`, async t => {
    let calls = 0;
    t.mock.method(globalThis, 'fetch', async () => {
      calls++; return new Response('private-provider-address@example.invalid', { status });
    });
    const result = await send();
    assert.ok(result.every(receipt => receipt.outcome === 'failed' && receipt.error === 'provider_rejected'));
    assert.equal(calls, 1);
    assert.doesNotMatch(JSON.stringify(result), /private-provider-address/);
  });
}

for (const status of [408, 409, 500, 503]) {
  test(`batch HTTP ${status} leaves acceptance unknown without replay`, async t => {
    let calls = 0;
    t.mock.method(globalThis, 'fetch', async () => { calls++; return new Response(null, { status }); });
    const result = await send();
    assert.ok(result.every(receipt => receipt.outcome === 'unknown' && receipt.error === 'provider_unavailable'));
    assert.equal(calls, 1);
  });
}

test('batch redirects cannot forward or replay campaign content', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    calls++; assert.equal(init.redirect, 'manual');
    return new Response(null, { status: 307, headers: { location: 'https://private-redirect.invalid/capture' } });
  });
  const result = await send();
  assert.ok(result.every(receipt => receipt.outcome === 'unknown' && receipt.error === 'provider_redirect'));
  assert.equal(calls, 1);
  assert.doesNotMatch(JSON.stringify(result), /private-redirect/);
});

for (const [name, error, expected] of [
  ['network loss', new TypeError('private-provider-detail'), 'provider_network'],
  ['timeout', new DOMException('private-provider-detail', 'TimeoutError'), 'provider_timeout'],
]) {
  test(`batch ${name} remains unknown with closed facts`, async t => {
    let calls = 0;
    t.mock.method(globalThis, 'fetch', async () => { calls++; throw error; });
    const result = await send();
    assert.ok(result.every(receipt => receipt.outcome === 'unknown' && receipt.error === expected));
    assert.equal(calls, 1);
    assert.doesNotMatch(JSON.stringify(result), /private-provider-detail/);
  });
}

test('actual response bytes are capped even without Content-Length', async t => {
  let cancelled = false;
  t.mock.method(globalThis, 'fetch', async () => new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(40_000)); controller.enqueue(new Uint8Array(30_000));
    },
    cancel() { cancelled = true; return new Promise(() => {}); },
  })));
  const result = await send();
  assert.ok(result.every(receipt => receipt.error === 'provider_response_too_large' && receipt.outcome === 'unknown'));
  assert.equal(cancelled, true);
});

test('a stalled response stops at the native signal budget without waiting for cancellation', async t => {
  const abort = new AbortController();
  let cancelled = false;
  let response;
  t.mock.method(AbortSignal, 'timeout', () => abort.signal);
  t.mock.method(globalThis, 'fetch', async () => {
    response = new Response(new ReadableStream({
      start(controller) { controller.enqueue(new TextEncoder().encode('{"data":[')); },
      cancel() { cancelled = true; return new Promise(() => {}); },
    }));
    return response;
  });
  const pending = send();
  await new Promise(resolve => setTimeout(resolve, 0));
  abort.abort();
  const result = await Promise.race([pending, new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Response budget did not settle')), 100))]);
  assert.ok(result.every(receipt => receipt.outcome === 'unknown' && receipt.error === 'provider_timeout'));
  assert.equal(cancelled, true);
  assert.equal(response.body.locked, false);
});

for (const [label, bytes] of [
  ['unparseable JSON', new TextEncoder().encode('{')],
  ['invalid UTF-8', new Uint8Array([123, 34, 120, 34, 58, 34, 255, 34, 125])],
]) {
  test(`batch ${label} is an unknown response`, async t => {
    t.mock.method(globalThis, 'fetch', async () => new Response(bytes));
    const result = await send();
    assert.ok(result.every(receipt => receipt.outcome === 'unknown' && receipt.error === 'provider_response_invalid'));
  });
}

test('batch receipts refer to the frozen request audience even if its caller mutates input', async t => {
  const entered = Promise.withResolvers();
  const release = Promise.withResolvers();
  const recipients = [{ ...audience[0] }];
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    entered.resolve(JSON.parse(init.body)); return release.promise;
  });
  const pending = send(recipients);
  const request = await entered.promise;
  recipients[0].email = 'changed@example.invalid';
  release.resolve(Response.json({ data: [{ id: 'synthetic-id' }] }));
  const result = await pending;
  assert.equal(request[0].to, audience[0].email);
  assert.equal(result[0].email, audience[0].email);
});

test('empty, oversized or invalidly identified batches never reach the provider', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; throw new Error('Unexpected provider call'); });
  assert.deepEqual(await send([]), []);
  const oversized = await send(Array.from({ length: 101 }, () => audience[0]));
  assert.ok(oversized.every(receipt => receipt.outcome === 'failed' && receipt.error === 'invalid_batch_size'));
  for (const invalid of ['', 'x'.repeat(257), 'header\r\ninjection']) {
    const result = await send(audience, invalid);
    assert.ok(result.every(receipt => receipt.outcome === 'failed' && receipt.error === 'invalid_idempotency_key'));
  }
  assert.equal(calls, 0);
});
