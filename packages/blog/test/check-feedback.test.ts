import assert from 'node:assert/strict';
import test from 'node:test';
import { failureFeedback } from '../src/lib/check-feedback.js';
import { checkErrorHtml } from '../src/worker/ai-check-html.js';

test('daily exhaustion gives one reset explanation and useful free alternatives', () => {
  const quota = { limit: 10, remaining: 0, resetAt: '2026-11-07T00:00:00Z' };
  const feedback = failureFeedback('Your ten daily checks have been used. Try again after the UTC reset.', 429, quota, 'America/Los_Angeles');
  assert.equal(feedback.tone, 'limited'); assert.equal(feedback.title, 'Daily limit reached');
  assert.match(feedback.detail, /Nov 6, 4:00 PM PST/); assert.doesNotMatch(feedback.detail, /UTC reset|0 of 10/);
  assert.equal(feedback.meta, '0 of 10 checks remaining');
  const html = checkErrorHtml('Old repeated error', 429, quota);
  assert.match(html, /Daily limit reached/); assert.match(html, /UTC/);
  assert.match(html, /href="\/ai-check\/example#access-report"/); assert.match(html, /href="\/tools\/robots"/);
  assert.doesNotMatch(html, /Old repeated error/);
});

test('a burst limit or malformed quota does not invent a daily reset time', () => {
  for (const quota of [undefined, { limit: 10, remaining: 0, resetAt: 'unknown' }, { limit: 10, remaining: 5, resetAt: '2026-11-07T00:00:00Z' }]) {
    const feedback = failureFeedback('Try again in a minute.', 429, quota);
    assert.equal(feedback.title, 'Give it a moment'); assert.equal(feedback.detail, 'Try again in a minute.'); assert.equal(feedback.meta, undefined);
  }
});

test('a service failure retains its explanation and escapes it in server HTML', () => {
  const message = '<img src=x onerror=alert(1)> Unavailable';
  const feedback = failureFeedback(message, 503, null); assert.equal(feedback.tone, 'error'); assert.equal(feedback.detail, message);
  const html = checkErrorHtml(message); assert.doesNotMatch(html, /<img src=x/); assert.match(html, /&lt;img/);
});
