import assert from 'node:assert/strict';
import test from 'node:test';
import { sendConfirmationEmail } from '../../newsletter/src/email.ts';
import { verifyTurnstile } from '../../newsletter/src/turnstile.ts';
import { handleConfirmationRequest } from '../../newsletter/src/confirmation-request.ts';

const confirmation = [
  'synthetic-key', 'reader@example.invalid', 'https://example.invalid/confirm',
  'https://example.invalid/opt-out', '12345678-1234-4234-8234-123456789abc',
];

function deliveryOutcome(receipt) {
  const { diagnostics, ...outcome } = receipt;
  assert.equal(Number.isInteger(diagnostics.attempts), true);
  assert.ok(diagnostics.attempts >= 1 && diagnostics.attempts <= 2);
  assert.equal(Number.isInteger(diagnostics.elapsedMs), true);
  assert.ok(diagnostics.elapsedMs >= 0);
  return outcome;
}

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
      assert.deepEqual(deliveryOutcome(result), { outcome: 'unknown', providerId: null, providerStatus: status });
      assert.equal(result.diagnostics.stopReason, status === 400 ? 'http-rejected' : 'retry-exhausted');
      assert.equal(calls.length, 2);
      assert.equal(calls[0].body, calls[1].body);
      assert.ok(calls.every(call => call.redirect === 'manual'));
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
  const result = await sendConfirmationEmail(...confirmation);
  assert.deepEqual(deliveryOutcome(result), {
    outcome: 'accepted', providerId: 'synthetic-provider-id', providerStatus: 200,
  });
  assert.equal(result.diagnostics.retryReason, 'network');
  assert.equal(result.diagnostics.stopReason, 'accepted');
});

test('a known first-call rejection stays failed without an unnecessary retry', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return new Response(null, { status: 400 }); });
  const result = await sendConfirmationEmail(...confirmation);
  assert.deepEqual(deliveryOutcome(result), {
    outcome: 'failed', providerId: null, providerStatus: 400,
  });
  assert.equal(result.diagnostics.retryReason, 'none');
  assert.equal(result.diagnostics.stopReason, 'http-rejected');
  assert.equal(calls, 1);
});

test('an unparseable successful confirmation response retains its observed HTTP status', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('{', { status: 200 }));
  const result = await sendConfirmationEmail(...confirmation);
  assert.deepEqual(deliveryOutcome(result), {
    outcome: 'unknown', providerId: null, providerStatus: 200,
  });
  assert.equal(result.diagnostics.retryReason, 'invalid-response');
  assert.equal(result.diagnostics.stopReason, 'retry-exhausted');
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
    assert.ok(calls.every(call => call.redirect === 'manual'));
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

for (const [status, reason] of [[500, 'server'], [409, 'idempotency']]) {
  test(`confirmation diagnoses bounded ${status} retries without provider text`, async t => {
    t.mock.method(globalThis, 'fetch', async () => new Response('private-provider-detail', { status }));
    const result = await sendConfirmationEmail(...confirmation);
    assert.equal(result.outcome, 'unknown');
    assert.equal(result.diagnostics.attempts, 2);
    assert.equal(result.diagnostics.retryReason, reason);
    assert.equal(result.diagnostics.stopReason, 'retry-exhausted');
    assert.doesNotMatch(JSON.stringify(result), /private-provider-detail/);
  });
}

for (const hint of [null, '0', '2', '3']) {
  test(`confirmation records a bounded rate wait for ${String(hint)} before accepted replay`, async t => {
    const waits = [];
    let calls = 0;
    const nativeSetTimeout = globalThis.setTimeout;
    t.mock.method(globalThis, 'setTimeout', (callback, delay, ...args) => {
      if (delay > 3_000) return nativeSetTimeout(callback, delay, ...args);
      waits.push(delay); queueMicrotask(callback); return 0;
    });
    t.mock.method(globalThis, 'fetch', async () => ++calls === 1
      ? new Response(null, { status: 429, headers: hint === null ? {} : { 'retry-after': hint } })
      : Response.json({ id: 'synthetic-provider-id' }));
    const result = await sendConfirmationEmail(...confirmation);
    assert.equal(result.outcome, 'accepted');
    assert.deepEqual(waits, [Math.max(1, Number(hint ?? 1)) * 1000]);
    assert.equal(result.diagnostics.attempts, 2);
    assert.equal(result.diagnostics.retryReason, 'rate-limit');
    assert.equal(result.diagnostics.stopReason, 'accepted');
  });
}

for (const [hint, stopReason] of [
  ['120', 'rate-wait-too-long'], ['2e0', 'rate-wait-invalid'],
  ['0x2', 'rate-wait-invalid'], ['1.5', 'rate-wait-invalid'],
  ['', 'rate-wait-invalid'], ['-1', 'rate-wait-invalid'],
  ['private-provider-detail', 'rate-wait-invalid'],
]) {
  test(`confirmation stops without retrying ahead of ${JSON.stringify(hint)}`, async t => {
    let calls = 0;
    t.mock.method(globalThis, 'fetch', async () => {
      calls++;
      return new Response(null, { status: 429, headers: { 'retry-after': hint } });
    });
    const result = await sendConfirmationEmail(...confirmation);
    assert.equal(result.outcome, 'failed');
    assert.equal(calls, 1);
    assert.equal(result.diagnostics.retryReason, 'none');
    assert.equal(result.diagnostics.stopReason, stopReason);
    assert.doesNotMatch(JSON.stringify(result), /private-provider-detail/);
  });
}

test('confirmation classifies timeout by its native error name without copying its message', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new DOMException('private-provider-detail', 'TimeoutError'); });
  const result = await sendConfirmationEmail(...confirmation);
  assert.equal(result.outcome, 'unknown');
  assert.equal(result.diagnostics.attempts, 2);
  assert.equal(result.diagnostics.retryReason, 'timeout');
  assert.equal(result.diagnostics.stopReason, 'retry-exhausted');
  assert.doesNotMatch(JSON.stringify(result), /private-provider-detail/);
});

test('rejection receipt does not wait for an unresolved body-cancellation hook', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response(new ReadableStream({
    cancel() { return new Promise(() => {}); },
  }), { status: 400 }));
  const result = await Promise.race([
    sendConfirmationEmail(...confirmation),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Cancellation extended the response budget')), 50)),
  ]);
  assert.equal(result.outcome, 'failed');
  assert.equal(result.diagnostics.stopReason, 'http-rejected');
});

for (const status of [301, 302, 303, 307, 308]) {
  test(`provider adapters explicitly reject ${status} without following or replaying`, async t => {
    const calls = [];
    t.mock.method(globalThis, 'fetch', async (_url, init) => {
      calls.push(init);
      return new Response(null, { status, headers: { location: 'https://private-redirect.invalid/path' } });
    });
    const verification = await verifyTurnstile('synthetic-token', 'synthetic-secret', '192.0.2.1', 'gkoreli.com');
    const delivery = await sendConfirmationEmail(...confirmation);
    assert.equal(verification.ok, false);
    assert.equal(verification.reason, 'verifier_redirect');
    assert.equal(verification.attempts, 1);
    assert.equal(delivery.outcome, 'unknown');
    assert.equal(delivery.providerStatus, status);
    assert.equal(delivery.diagnostics.attempts, 1);
    assert.equal(delivery.diagnostics.stopReason, 'redirect-rejected');
    assert.equal(delivery.diagnostics.retryReason, 'none');
    assert.equal(calls.length, 2);
    assert.ok(calls.every(call => call.redirect === 'manual'));
    assert.doesNotMatch(JSON.stringify({ verification, delivery }), /private-redirect/);
  });
}

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
