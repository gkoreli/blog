import assert from 'node:assert/strict';
import test from 'node:test';
import { SubscriptionAttempt, retryableVerificationError, verificationToken } from '../src/client/subscription-attempt.ts';

const id = '12345678-1234-4234-8234-123456789abc';
function executing(startedAt = 0) {
  const attempt = new SubscriptionAttempt(id, startedAt);
  assert.equal(attempt.startRendering(startedAt), true);
  assert.equal(attempt.rendered(startedAt), true);
  assert.equal(attempt.startExecution(startedAt), true);
  return attempt;
}

test('attempt identity and clock reject invalid construction without echoing the input', () => {
  assert.throws(() => new SubscriptionAttempt('private@example.invalid', 0), { message: 'Invalid subscription attempt identity' });
  for (const clock of [-1, NaN, Infinity]) assert.throws(() => new SubscriptionAttempt(id, clock));
});

test('token handoff requires an executing challenge and can happen only once', () => {
  const attempt = new SubscriptionAttempt(id, 0);
  assert.equal(attempt.handoff(1), false);
  assert.equal(attempt.beforeInteraction(1), false);
  assert.equal(attempt.startExecution(1), false);
  assert.equal(attempt.rendered(1), false);
  attempt.startRendering(1);
  assert.equal(attempt.handoff(2), false);
  attempt.rendered(2); attempt.startExecution(3);
  assert.equal(attempt.handoff(4), true);
  assert.deepEqual(attempt.state, { phase: 'sending', deadlineAt: 35_004 });
  assert.equal(attempt.handoff(5), false);
  assert.equal(attempt.recover('300031', 5), false);
  assert.equal(attempt.failVerification(), false, 'late verifier exceptions cannot end a sending attempt');
  assert.equal(attempt.settleRequest('accepted-response', 6), true);
  assert.equal(attempt.settleRequest('rejected-response', 7), false);
});

test('absolute deadlines are checked by commands even when timer callbacks have not run', () => {
  const attempt = executing();
  assert.equal(attempt.expired(29_999), false);
  assert.equal(attempt.handoff(30_000), false);
  assert.equal(attempt.beforeInteraction(30_001), false);
  assert.equal(attempt.recover('300031', 30_001), false);
  assert.equal(attempt.failVerification(), true);
  const request = executing(); request.handoff(1);
  assert.equal(request.settleRequest('accepted-response', 35_001), false);
  assert.equal(request.settleRequest('response-unavailable', 35_001), true);
});

test('current interactive mode is distinct from using the one deadline extension', () => {
  const attempt = executing();
  assert.equal(attempt.beforeInteraction(1000), true);
  const deadline = attempt.state.phase === 'verifying' ? attempt.state.deadlineAt : undefined;
  assert.equal(deadline, 121_000);
  assert.equal(attempt.afterInteraction(2000), true);
  assert.equal(attempt.beforeInteraction(120_000), true);
  assert.ok(attempt.state.phase === 'verifying');
  assert.equal(attempt.state.step, 'interactive');
  assert.equal(attempt.state.deadlineAt, deadline);
  assert.equal(attempt.beforeInteraction(121_000), false);
});

test('one fresh-widget recovery keeps the attempt identity and original deadline', () => {
  const attempt = executing();
  assert.equal(attempt.recover('110200', 1000), false);
  assert.equal(attempt.recover('300031', 29_000), true);
  assert.equal(attempt.id, id);
  assert.ok(attempt.state.phase === 'verifying');
  assert.equal(attempt.state.step, 'waiting-api');
  assert.equal(attempt.state.deadlineAt, 30_000);
  assert.equal(attempt.state.recoveryCount, 1);
  attempt.startRendering(29_100); attempt.rendered(29_100); attempt.startExecution(29_100);
  assert.equal(attempt.recover('600010', 29_200), false);
});

test('token validation is bounded and opaque; arbitrary provider values cannot enter transport', () => {
  for (const value of [undefined, null, {}, [], 123, 'x'.repeat(2049)]) {
    assert.deepEqual(verificationToken(value), { ok: false, reason: 'invalid' });
  }
  assert.deepEqual(verificationToken(' \n '), { ok: false, reason: 'empty' });
  assert.deepEqual(verificationToken(' opaque-token '), { ok: true, token: ' opaque-token ' });
  assert.equal(verificationToken('x'.repeat(2048)).ok, true);
  for (const value of [undefined, 300031, '300031x', '110200']) assert.equal(retryableVerificationError(value), false);
});

test('generated invalid command orders never revive a settled attempt or hand off twice', () => {
  let seed = 0x51a7;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed; };
  for (let trial = 0; trial < 2000; trial++) {
    const attempt = new SubscriptionAttempt(id, 0);
    let clock = 0, handoffs = 0, settled = false, sawSending = false;
    for (let step = 0; step < 32; step++) {
      clock += random() % 5000;
      switch (random() % 10) {
        case 0: attempt.startRendering(clock); break;
        case 1: attempt.rendered(clock); break;
        case 2: attempt.startExecution(clock); break;
        case 3: attempt.beforeInteraction(clock); break;
        case 4: attempt.afterInteraction(clock); break;
        case 5: attempt.recover('300031', clock); break;
        case 6: if (attempt.handoff(clock)) handoffs++; break;
        case 7: attempt.failVerification(); break;
        case 8: attempt.settleRequest('accepted-response', clock); break;
        case 9: attempt.settleRequest('response-unavailable', clock); break;
      }
      const state = attempt.state;
      assert.ok(handoffs <= 1);
      if (settled) assert.equal(state.phase, 'settled');
      if (sawSending) assert.notEqual(state.phase, 'verifying');
      if (state.phase === 'verifying') {
        assert.ok(state.recoveryCount <= 1);
        assert.ok(state.deadlineAt <= 150_000);
      }
      if (state.phase === 'sending') sawSending = true;
      if (state.phase === 'settled') settled = true;
    }
  }
});
