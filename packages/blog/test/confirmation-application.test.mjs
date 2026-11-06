import assert from 'node:assert/strict';
import test from 'node:test';
import { SubscriberAddress } from '../../newsletter/src/confirmation.ts';
import { requestConfirmation } from '../../newsletter/src/request-confirmation.ts';
import { recordConfirmationOutcome } from '../../newsletter/src/confirmation-store.ts';

const address = SubscriberAddress.parse(' Reader@Example.Invalid ');
const command = { id: 'operation-id', email: address, challengeToken: 'proof', mode: 'subscribe',
  source: null, consentIp: null, userAgent: null };
function scenario(overrides = {}) {
  const calls = [];
  const observations = [];
  const ports = {
    async verify(token) {
      calls.push(['verify', token]);
      return { ok: true, httpStatus: 200, errorCodes: [], attempts: 1, elapsedMs: 3, retryReason: 'none' };
    },
    async issue() { calls.push(['issue']); return { confirmationToken: 'confirmation-token', tokenHash: 'hash',
      subscriberId: 'subscriber-id', unsubscribeToken: 'candidate-opt-out' }; },
    async admit(reservation) { calls.push(['admit', reservation]); return { decision: 'admitted', unsubscribeToken: 'retained-opt-out' }; },
    async deliver(...args) { calls.push(['deliver', ...args]); return { outcome: 'accepted', providerId: 'private-id',
      providerStatus: 200, diagnostics: { attempts: 1, elapsedMs: 4, retryReason: 'none', stopReason: 'accepted' } }; },
    async record(...args) { calls.push(['record', ...args]); },
    observe(event) { observations.push(event); },
    ...overrides,
  };
  return { ports, calls, observations };
}

test('address policy canonicalizes once and produces an immutable domain value', () => {
  assert.equal(address.value, 'reader@example.invalid');
  assert.equal(Object.isFrozen(address), true);
  assert.throws(() => { address.value = 'changed@example.invalid'; }, TypeError);
  for (const input of [null, {}, '', 'no-domain', 'a@b', 'a b@example.invalid', `${'x'.repeat(250)}@example.invalid`]) {
    assert.equal(SubscriberAddress.parse(input), null);
  }
});

for (const kind of ['rejected', 'unavailable']) {
  test(`${kind} proof cannot issue tokens, reserve capacity or send`, async () => {
    const h = scenario({ async verify() { return { ok: false, kind, reason: 'invalid_token', httpStatus: 200,
      errorCodes: ['invalid-input-response'], attempts: 1, elapsedMs: 3, retryReason: 'none' }; } });
    assert.equal(await requestConfirmation(command, h.ports), `verification-${kind}`);
    assert.deepEqual(h.calls, []);
    assert.equal(h.observations[0].stage, 'verification_failed');
  });
}

for (const decision of ['capacity', 'unchanged']) {
  test(`${decision} admission cannot reach delivery`, async () => {
    const h = scenario({ async admit() { return { decision }; } });
    assert.equal(await requestConfirmation(command, h.ports), decision);
    assert.deepEqual(h.calls.map(call => call[0]), ['verify', 'issue']);
  });
}

test('durable admission precedes one send using the retained opt-out and operation identity', async () => {
  const h = scenario();
  assert.equal(await requestConfirmation(command, h.ports), 'accepted');
  assert.deepEqual(h.calls.map(call => call[0]), ['verify', 'issue', 'admit', 'deliver', 'record']);
  assert.equal(h.calls[2][1].email, address);
  assert.deepEqual(h.calls[3], ['deliver', address.value, 'confirmation-token', 'retained-opt-out', command.id]);
  assert.equal(h.calls[4][1], command.id);
  assert.doesNotMatch(JSON.stringify(h.observations), /reader@|private-id|confirmation-token|retained-opt-out/);
  assert.equal(h.observations.at(-1).receiptConfirmed, true);
});

test('admission failure prevents an external effect', async () => {
  const h = scenario({ async admit() { throw new Error('storage unavailable'); } });
  await assert.rejects(requestConfirmation(command, h.ports), /storage unavailable/);
  assert.deepEqual(h.calls.map(call => call[0]), ['verify', 'issue']);
});

for (const outcome of ['accepted', 'unknown', 'failed']) {
  test(`lost receipt acknowledgment preserves ${outcome} without resending`, async () => {
    let sends = 0;
    const h = scenario({ async deliver() { sends++; return { outcome, providerId: null, providerStatus: 200,
      diagnostics: { attempts: 1, elapsedMs: 4, retryReason: 'none', stopReason: 'accepted' } }; },
    async record() { throw new Error('ack lost after commit'); } });
    assert.equal(await requestConfirmation(command, h.ports), outcome === 'accepted' ? 'accepted' : 'delivery-unconfirmed');
    assert.equal(sends, 1);
    assert.equal(h.observations.at(-2).stage, 'outcome_write_unconfirmed');
    assert.equal(h.observations.at(-1).stage, outcome);
    assert.equal(h.observations.at(-1).receiptConfirmed, false);
  });
}

for (const result of [{ success: true, meta: { changes: 0 } }, { success: false, meta: { changes: 1 } }]) {
  test(`receipt adapter rejects an unconfirmed acknowledgment ${JSON.stringify(result)}`, async () => {
    const db = { prepare() { return { bind() { return { async run() { return result; } }; } }; } };
    await assert.rejects(recordConfirmationOutcome(db, command.id, 'accepted', 'private-id', 200), /unconfirmed/);
  });
}

for (const lostWrite of [false, true]) {
  test(`an unexpected delivery escape keeps unknown charged and never replays (lost write ${lostWrite})`, async () => {
    let sends = 0;
    const receipts = [];
    const h = scenario({ async deliver() { sends++; throw new Error('private adapter detail after possible effect'); },
      async record(id, receipt) { receipts.push({ id, receipt }); if (lostWrite) throw new Error('lost acknowledgment'); } });
    assert.equal(await requestConfirmation(command, h.ports), 'delivery-unconfirmed');
    assert.equal(sends, 1);
    assert.deepEqual(receipts, [{ id: command.id, receipt: { outcome: 'unknown', providerId: null, providerStatus: null } }]);
    assert.deepEqual(h.observations.at(-1), { stage: 'delivery_exception', delivery: 'unknown', receiptConfirmed: !lostWrite });
    assert.doesNotMatch(JSON.stringify(h.observations), /private adapter|deliveryAttempts|deliveryElapsedMs/);
  });
}
