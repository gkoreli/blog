import test from 'node:test';
import assert from 'node:assert/strict';
import { keyLifecycleFixture, keyLifecycleTrials } from './fixtures/key-lifecycle.mjs';
import * as api from '../.test-dist/webbotauth.js';
import { verificationOutcome } from '../.test-dist/signature-evidence.js';

test('directory rotation cannot resurrect an old key after a delayed import', async () => {
  const cases = await keyLifecycleTrials(keyLifecycleFixture(), api);
  const late = cases.find(row => row.condition === 'late-old-import');
  assert.equal(late.newDirectoryPublished, true); assert.equal(late.resurrectedBeforeProbe, false);
  assert.equal(late.results[0].reason, 'reload'); assert.equal(late.results[1].status, 'verified');
  assert.equal(late.results[2].status, 'unverified'); assert.equal(late.results[2].reason, 'key-not-found');
  assert.equal(verificationOutcome({ status: 'unverified', reason: late.results[0].reason }), 'unavailable');
  assert.equal(late.fetches, 2); assert.equal(late.pending, 0);
  for (const row of cases.filter(row => row.condition !== 'late-old-import')) {
    assert.ok(row.results.every(result => result.status === 'verified'), row.condition);
    assert.equal(row.fetches, row.condition === 'parallel-warm-rotation' ? 2 : 1, row.condition);
    assert.equal(row.pending, 0);
  }
});
