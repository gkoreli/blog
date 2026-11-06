import assert from 'node:assert/strict';
import test from 'node:test';
import { serializeSubscriptionRequest } from '../src/client/subscription-request.js';

test('the wire envelope preserves opaque intent and the existing public field names', () => {
  const email = 'Reader@example.invalid', token = ' opaque-token ', source = '/article?utm_source=news';
  assert.equal(serializeSubscriptionRequest(email, token, source), JSON.stringify({ email, turnstile: token, source }));
});

test('optional attribution yields when the actual encoded request would exceed the intake budget', () => {
  const email = 'reader@example.invalid', token = 't'.repeat(2048), source = '/'.repeat(2400);
  const result = serializeSubscriptionRequest(email, token, source);
  assert.equal(result, JSON.stringify({ email, turnstile: token, source: '' }));
});

test('JSON escaping and multi-byte text are counted as bytes, with no truncation of email or token', () => {
  for (const token of ['é'.repeat(2048), '"'.repeat(2048), '\u0000'.repeat(1000)]) {
    assert.equal(serializeSubscriptionRequest('reader@example.invalid', token, ''), undefined);
  }
});
