import assert from 'node:assert/strict';
import test from 'node:test';
import { sendConfirmationEmail } from '../../newsletter/src/email.ts';
import { verifyTurnstile } from '../../newsletter/src/turnstile.ts';
import { handleConfirmationRequest } from '../../newsletter/src/confirmation-request.ts';

const confirmation = [
  'synthetic-key', 'reader@example.invalid', 'https://example.invalid/confirm',
  'https://example.invalid/opt-out', '12345678-1234-4234-8234-123456789abc',
];

for (const [label, first] of [
  ['lost response', () => { throw new TypeError('synthetic response loss'); }],
  ['malformed accepted response', () => Response.json({ accepted: true })],
  ['unparseable accepted response', () => new Response('{', { status: 200 })],
  ['server failure', () => new Response(null, { status: 500 })],
  ['unresolved idempotent operation', () => new Response(null, { status: 409 })],
]) {
  for (const status of [400, 429]) {
    test(`confirmation keeps ${label} uncertain after a later ${status}`, async t => {
      const calls = [];
      t.mock.method(globalThis, 'fetch', async (_url, init) => {
        calls.push(init);
        return calls.length === 1 ? first() : new Response(null, {
          status, headers: { 'retry-after': '120' },
        });
      });
      const result = await sendConfirmationEmail(...confirmation);
      assert.deepEqual(result, { outcome: 'unknown', providerId: null, providerStatus: status });
      assert.equal(calls.length, 2);
      assert.equal(calls[0].body, calls[1].body);
      assert.equal(new Headers(calls[0].headers).get('Idempotency-Key'),
        new Headers(calls[1].headers).get('Idempotency-Key'));
    });
  }
}

test('a valid accepted replay resolves earlier confirmation uncertainty', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    if (++calls === 1) throw new TypeError('synthetic response loss');
    return Response.json({ id: 'synthetic-provider-id' });
  });
  assert.deepEqual(await sendConfirmationEmail(...confirmation), {
    outcome: 'accepted', providerId: 'synthetic-provider-id', providerStatus: 200,
  });
});

test('a known first-call rejection stays failed without an unnecessary retry', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return new Response(null, { status: 400 }); });
  assert.deepEqual(await sendConfirmationEmail(...confirmation), {
    outcome: 'failed', providerId: null, providerStatus: 400,
  });
  assert.equal(calls, 1);
});

test('an unparseable successful confirmation response retains its observed HTTP status', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('{', { status: 200 }));
  assert.deepEqual(await sendConfirmationEmail(...confirmation), {
    outcome: 'unknown', providerId: null, providerStatus: 200,
  });
});

for (const [label, reply] of [
  ['successful result with rejection codes', { success: true, hostname: 'gkoreli.com', 'error-codes': ['invalid-input-response'] }],
  ['successful result with unknown errors', { success: true, hostname: 'gkoreli.com', 'error-codes': ['private-provider-detail'] }],
  ['non-array error codes', { success: false, 'error-codes': 'invalid-input-response' }],
  ['non-string error codes', { success: false, 'error-codes': [123] }],
  ['missing failure codes', { success: false }],
  ['empty failure codes', { success: false, 'error-codes': [] }],
  ['wholly unknown failure', { success: false, 'error-codes': ['private-provider-detail'] }],
  ['missing hostname', { success: true }],
  ['non-string action', { success: true, hostname: 'gkoreli.com', action: null }],
]) {
  test(`Siteverify treats ${label} as an unavailable provider contract`, async t => {
    const calls = [];
    t.mock.method(globalThis, 'fetch', async (_url, init) => {
      calls.push(init);
      return Response.json(reply);
    });
    const result = await verifyTurnstile('synthetic-token', 'synthetic-secret', '192.0.2.1', 'gkoreli.com');
    assert.equal(result.ok, false);
    assert.equal(result.kind, 'unavailable');
    assert.equal(result.reason, 'invalid_verifier_response');
    assert.deepEqual(result.errorCodes, []);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].body, calls[1].body);
    assert.doesNotMatch(JSON.stringify(result), /private-provider-detail|synthetic-token|synthetic-secret/);
  });
}

test('Siteverify accepts a documented successful reply and preserves cached-action compatibility', async t => {
  for (const action of [undefined, '', 'subscribe']) {
    t.mock.method(globalThis, 'fetch', async () => Response.json({
      success: true, hostname: 'gkoreli.com', 'error-codes': [], action,
    }));
    const result = await verifyTurnstile('synthetic-token', 'synthetic-secret', '192.0.2.1', 'gkoreli.com');
    assert.equal(result.ok, true);
    assert.equal(result.attempts, 1);
    t.mock.restoreAll();
  }
});

test('a known token rejection remains rejected while unknown provider text is discarded', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    success: false, 'error-codes': ['invalid-input-response', 'private-provider-detail'],
  }));
  const result = await verifyTurnstile('synthetic-token', 'synthetic-secret', '192.0.2.1', 'gkoreli.com');
  assert.equal(result.ok, false);
  assert.equal(result.kind, 'rejected');
  assert.equal(result.reason, 'invalid_token');
  assert.deepEqual(result.errorCodes, ['invalid-input-response']);
  assert.equal(result.attempts, 1);
  assert.doesNotMatch(JSON.stringify(result), /private-provider-detail/);
});

test('a contradictory verifier reply cannot cross the real confirmation admission boundary', async t => {
  let databaseCalls = 0;
  const logs = [];
  const env = {
    RESEND_API_KEY: 'synthetic-key', TURNSTILE_SECRET_KEY: 'synthetic-secret',
    SUBSCRIBE_RATE_LIMITER: { async limit() { return { success: true }; } },
    DB: {
      prepare() { databaseCalls++; throw new Error('Unexpected admission'); },
      batch() { databaseCalls++; throw new Error('Unexpected admission'); },
    },
  };
  t.mock.method(console, 'log', (...event) => { logs.push(event); });
  t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    return Response.json({ success: true, hostname: 'gkoreli.com', 'error-codes': ['invalid-input-response'] });
  });
  const response = await handleConfirmationRequest(new Request('https://gkoreli.com/api/subscribe', {
    method: 'POST', headers: { origin: 'https://gkoreli.com', 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'reader@example.invalid', turnstile: 'synthetic-token' }),
  }), env, 'subscribe');
  assert.equal(response.status, 503);
  assert.equal(databaseCalls, 0);
  assert.equal(logs.at(-1)?.[1]?.stage, 'verification_failed');
  assert.equal(logs.at(-1)?.[1]?.reason, 'invalid_verifier_response');
  assert.doesNotMatch(JSON.stringify(logs), /reader@example.invalid|synthetic-token|synthetic-secret/);
});
