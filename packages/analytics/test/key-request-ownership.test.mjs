import test from 'node:test';
import assert from 'node:assert/strict';
import { keyLifecycleFixture } from './fixtures/key-lifecycle.mjs';
import { keyRequestOwnershipTrials } from './fixtures/key-request-ownership.mjs';
import * as api from '../.test-dist/webbotauth.js';

test('explicit directory ownership preserves cancellation, publication and retry limits', async () => {
  const rows = await keyRequestOwnershipTrials(keyLifecycleFixture(), api);
  const get = condition => { const row = rows.find(item => item.condition === condition); assert.ok(row, condition); return row; };
  for (const row of rows) { assert.equal(row.pending, 0, row.condition); assert.equal(row.active ?? 0, 0, row.condition); }
  for (const name of ['pre-aborted', 'transport-synchronous-abort', 'abort-during-key-import']) {
    const row = get(name); assert.equal(row.results[0].reason, 'directory-unavailable');
    assert.equal(row.canceledKeys ?? row.keys, 0, name);
  }
  assert.equal(get('pre-aborted').fetches, 0); assert.equal(get('transport-synchronous-abort').directories, 0);
  const many = get('five-waiters-late-ignored-abort');
  assert.equal(many.results[0].reason, 'directory-unavailable'); assert.ok(many.results.slice(1).every(result => result.status === 'verified'));
  assert.equal(many.fetches, 2); assert.equal(many.lateKeptReplacement, true); assert.equal(many.keys, 1);
  for (const [name, reason] of [['http-status', 'dir-http-status'], ['malformed-json', 'dir-json-invalid']]) {
    const row = get('ordinary-' + name); assert.equal(row.fetches, 1); assert.ok(row.results.every(result => result.reason === reason));
  }
  const imported = get('abort-during-key-import'); assert.equal(imported.results[1].status, 'verified'); assert.equal(imported.fetches, 1);
  const hashed = get('abort-during-warm-missing-key-hash'); assert.equal(hashed.results[0].reason, 'directory-unavailable');
  assert.equal(hashed.fetches, 1); assert.equal(hashed.sourcePreserved, true); assert.equal(hashed.forcedRefreshes, 0); assert.equal(hashed.keys, 1);
  const noncache = get('noncacheable-sequential'); assert.equal(noncache.fetches, 2); assert.ok(noncache.results.every(result => result.status === 'verified'));
  const bounded = get('one-recovery-allowance'); assert.equal(bounded.fetchesBeforeProbe, 2); assert.equal(bounded.fetches, 3);
  assert.ok(bounded.results.slice(0, 3).every(result => result.reason === 'directory-unavailable')); assert.equal(bounded.results[3].status, 'verified');
});
