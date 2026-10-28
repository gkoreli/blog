import test from 'node:test';
import assert from 'node:assert/strict';
import { preparePlan, summarize, validateCapture, parseCaptureLogStream, assertPhaseWindow } from '../scripts/run-native-bot-capture.mjs';

const plan = preparePlan(Date.parse('2026-10-28T12:00:00Z'));
const control = plan.controls.find(item => item.phase === 'dynamic');
const body = { profile: 'native-bot-capture-v1', responseId: 'cb16cdd4-36f5-4bf4-a382-cad07bacdd98', controlId: control.id,
  plannedCondition: control.condition, observedAt: '2026-10-28T12:00:01Z', candidate: 'literal-false', candidateTrust: 'untrusted-header',
  nativeSource: 'request.cf', native: { verifiedBot: 'unavailable', signedAgent: 'unavailable' } };

test('live plan bounds paths, clock windows and controller attempts without human labels', () => {
  assert.equal(plan.version, 'native-capture-controller-v2');
  assert.equal(plan.controls.length, 23); assert.equal(new Set(plan.controls.map(item => item.id)).size, 23);
  assert.equal(plan.ruleExpiresAt - plan.issuedAt, 240000); assert.equal(plan.expiresAt - plan.issuedAt, 480000);
  assert.ok(plan.ruleExpression.length < 4000); assert.ok(plan.ruleExpression.includes('http.request.timestamp.sec lt '));
  assert.equal(plan.maximumAttempts, 32); assert.equal(plan.humanLabels, 0);
  assert.deepEqual(plan.controls.filter(item => item.phase === 'absent').map(item => item.values).slice(-3), [['true', 'false'], ['false', 'true'], ['true', 'true']]);
});

test('a disabled-phase run cannot silently substitute an expired-rule experiment', () => {
  assert.doesNotThrow(() => assertPhaseWindow(plan, 'disabled', plan.issuedAt + 1000));
  assert.throws(() => assertPhaseWindow(plan, 'disabled', plan.ruleExpiresAt + 1000), /Rule expired/);
  assert.throws(() => assertPhaseWindow(plan, 'dynamic', plan.ruleExpiresAt - 4000), /near boundary/);
  assert.throws(() => assertPhaseWindow(plan, 'rule-expired', plan.ruleExpiresAt), /not expired/);
  assert.doesNotThrow(() => assertPhaseWindow(plan, 'rule-expired', plan.ruleExpiresAt + 1000));
  assert.doesNotThrow(() => assertPhaseWindow(plan, 'receiver-expired', plan.expiresAt + 1000));
});

test('closed capture validation rejects spoofed provenance, mismatched controls and unexpected retained fields', () => {
  assert.equal(validateCapture(body, control), true);
  for (const patch of [{ candidateTrust: 'native' }, { controlId: plan.controls[0].id }, { candidate: 'private-string' },
    { native: { verifiedBot: true, signedAgent: null } }, { responseId: 'missing' }, { observedAt: 'invalid' }, { rawIp: 'private-canary' }]) {
    assert.equal(validateCapture({ ...body, ...patch }, control), false);
  }
});

test('unavailable responses, wrong outcomes, malformed captures and absent executions remain separate', () => {
  const missing = plan.controls.find(item => item.phase === 'absent' && item.expected === 'missing');
  const ledger = [{ id: control.id, status: 200, body }, { id: missing.id, status: 503 }, { id: plan.controls[0].id }];
  const result = summarize(plan, ledger);
  assert.equal(result.planned, 23); assert.equal(result.attempted, 3); assert.equal(result.received, 2);
  assert.equal(result.validCaptures, 1); assert.equal(result.expectedOutcomes, 1); assert.equal(result.unexpectedOutcomes, 0); assert.equal(result.unavailable, 2);
  assert.equal(result.httpUnavailable, 1); assert.equal(result.transportUnavailable, 1); assert.equal(result.conditions.length, 3);
  assert.equal(summarize(plan, [{ id: control.id, status: 200, body: { ...body, candidate: 'missing' } }]).unexpectedOutcomes, 1);
  assert.equal(summarize(plan, [{ id: control.id, status: 200, body: {} }]).malformedCaptures, 1);
  assert.equal(result.humanAccuracyRate, null); assert.equal(result.providerAccuracyRate, null);
  assert.throws(() => summarize(plan, [...ledger, ledger[0]]), /Duplicate attempt/);
  assert.throws(() => summarize(plan, [{ id: 'unknown' }]), /Unknown ledger/);
});

test('tail joins require one identical response/control pair; copied or conflicting records are ambiguous', () => {
  const ledger = [{ id: control.id, status: 200, body }];
  const reordered = Object.fromEntries(Object.entries(body).reverse());
  assert.equal(summarize(plan, ledger, [reordered]).exactLogJoins, 1);
  assert.equal(summarize(plan, ledger, [body, body]).ambiguousLogJoins, 1);
  assert.equal(summarize(plan, ledger, [{ ...body, candidate: 'literal-true' }]).ambiguousLogJoins, 1);
  assert.equal(summarize(plan, ledger, []).exactLogJoins, 0);
});

test('tail parser handles multiline envelopes, quoted braces and truncation without inventing a capture', () => {
  const envelope = { logs: [{ message: ['other', 'quoted {brace}'] }, { message: ['analytics.native_bot_capture', body] }] };
  const parsed = parseCaptureLogStream('Connected\n' + JSON.stringify(envelope, null, 2) + '\n{invalid}\n{"partial":');
  assert.equal(parsed.envelopes, 1); assert.equal(parsed.malformed, 1); assert.equal(parsed.incompleteFragments, 1);
  assert.deepEqual(parsed.captures, [body]);
  assert.throws(() => parseCaptureLogStream('x'.repeat(4 * 1024 * 1024 + 1)), /bounded parser/);
});
