import assert from 'node:assert/strict';
import test from 'node:test';
import { providerAttempt, readProviderJson } from '../../newsletter/src/provider-response.ts';
import { sendConfirmationEmail } from '../../newsletter/src/email.ts';
import { verifyTurnstile } from '../../newsletter/src/turnstile.ts';

const confirmation = ['synthetic-key', 'reader@example.invalid', 'https://example.invalid/c',
  'https://example.invalid/o', '12345678-1234-4234-8234-123456789abc'];

for (const id of [' ', '\n', ' id', 'id ', 'id\u0000bad']) {
  test(`confirmation rejects structurally invalid ID ${JSON.stringify(id)}`, async t => {
    let calls = 0;
    t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ id }); });
    const result = await sendConfirmationEmail(...confirmation);
    assert.equal(result.outcome, 'unknown');
    assert.equal(result.providerId, null);
    assert.equal(result.diagnostics.retryReason, 'invalid-response');
    assert.equal(calls, 2);
  });
}

test('first HTTP408 is unknown and does not imply a rejected email', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return new Response(null, { status: 408 }); });
  const result = await sendConfirmationEmail(...confirmation);
  assert.equal(result.outcome, 'unknown');
  assert.equal(result.providerStatus, 408);
  assert.equal(result.diagnostics.stopReason, 'http-rejected');
  assert.equal(calls, 1);
});

for (const [name, invoke] of [
  ['confirmation', () => sendConfirmationEmail(...confirmation)],
  ['Siteverify', () => verifyTurnstile('synthetic-token', 'synthetic-secret', '192.0.2.1', 'gkoreli.com')],
]) {
  for (const declared of [false, true]) {
    test(`${name} caps ${declared ? 'declared' : 'actual'} response bytes`, async t => {
      let calls = 0;
      t.mock.method(globalThis, 'fetch', async () => {
        calls++;
        return new Response('x'.repeat(17_000), { headers: declared ? { 'content-length': '17000' } : {} });
      });
      const result = await invoke();
      assert.equal(name === 'confirmation' ? result.outcome : result.kind, name === 'confirmation' ? 'unknown' : 'unavailable');
      assert.equal(calls, 2);
    });
  }
  test(`${name} preserves original per-attempt deadline after delayed headers`, async t => {
    const budgets = [];
    // Keep provider policy durations visible while simulating all but20ms of each
    // elapsed budget before headers; the returned stream ignores fetch's signal.
    const realNow = performance.now.bind(performance);
    let offset = 0;
    t.mock.method(performance, 'now', () => realNow() + offset);
    let calls = 0;
    t.mock.method(globalThis, 'fetch', async (_url, init) => {
      calls++;
      assert.equal(init.signal.aborted, false);
      offset += name === 'confirmation' ? 7_980 : 4_980;
      return new Response(new ReadableStream({
        start(controller) { controller.enqueue(new TextEncoder().encode('{')); },
        cancel() { return new Promise(() => {}); },
      }));
    });
    const realSetTimeout = globalThis.setTimeout;
    t.mock.method(globalThis, 'setTimeout', (callback, ms, ...args) => {
      budgets.push(ms); return realSetTimeout(callback, ms, ...args);
    });
    const result = await invoke();
    assert.equal(name === 'confirmation' ? result.outcome : result.kind, name === 'confirmation' ? 'unknown' : 'unavailable');
    assert.equal(calls, 2);
    assert.equal(budgets.length, 2);
    assert.ok(budgets.every(ms => ms > 0 && ms <= 20));
    assert.equal(name === 'confirmation' ? result.diagnostics.retryReason : result.retryReason, 'timeout');
    if (name === 'Siteverify') assert.equal(result.reason, 'verifier_timeout');
  });
}

test('independent body deadline works without transport cancellation', async () => {
  let cancelled = false;
  const response = new Response(new ReadableStream({
    start(controller) { controller.enqueue(new TextEncoder().encode('{')); },
    cancel() { cancelled = true; return new Promise(() => {}); },
  }));
  const result = await readProviderJson(response, {
    signal: new AbortController().signal, deadline: performance.now() + 20, maxBytes: 100,
  });
  assert.deepEqual(result, { ok: false, reason: 'timeout' });
  assert.equal(cancelled, true);
  assert.equal(response.body.locked, false);
});

test('provider attempt starts its deadline before any response arrives', async () => {
  const before = performance.now();
  const attempt = providerAttempt(100);
  assert.ok(attempt.deadline >= before + 100 && attempt.deadline < performance.now() + 101);
  const result = await readProviderJson(Response.json({ ok: true }), { ...attempt, maxBytes: 100 });
  assert.deepEqual(result, { ok: true, value: { ok: true } });
});
