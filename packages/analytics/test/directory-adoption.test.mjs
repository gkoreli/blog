import test from 'node:test';
import assert from 'node:assert/strict';
import { directoryAdoptionFixture, directoryAdoptionTrials } from './fixtures/directory-adoption.mjs';
import * as requestApi from '../.test-dist/webbotauth.js';
import * as responseApi from '../.test-dist/directory-response-audit.js';

test('directory proof policy stays separate from request verification and selected-key identity', async () => {
  const fixture = directoryAdoptionFixture();
  const rows = await directoryAdoptionTrials(fixture, requestApi, responseApi);
  assert.equal(rows.length, 14);
  const get = name => { const row = rows.find(row => row.name === name); assert.ok(row, name); return row; };
  assert.equal(rows.filter(row => row.hypothetical.current).length, 13);
  assert.equal(rows.filter(row => row.hypothetical.requireAllAuthority).length, 7);
  assert.equal(rows.filter(row => row.hypothetical.requireAllBodyBound).length, 2);
  const bound = get('body-bound'); assert.equal(bound.audit.result.digest, 'matched');
  const parameterized = get('signed-parameterized-digest');
  assert.equal(parameterized.audit.result.digest, 'matched'); assert.equal(parameterized.audit.result.profiles.ietfProtocol01DomainBinding.verifiedKeys, 2);
  const header = get('parameter-changed-without-resigning');
  assert.equal(header.audit.result.digest, 'matched'); assert.ok(header.audit.result.proofs.every(p => p.reason === 'signature-mismatch'));
  const changed = get('parameterized-digest-body-changed');
  assert.equal(changed.audit.result.digest, 'mismatch'); assert.ok(changed.audit.result.proofs.every(p => p.outcome === 'verified'));
  assert.equal(changed.audit.result.profiles.ietfProtocol01DomainBinding.verifiedKeys, 0);
  assert.equal(get('signed-empty-digest').audit.result.digest, 'malformed');
  assert.equal(get('signed-unsupported-digest').audit.result.digest, 'unsupported');
  assert.deepEqual(get('proof-for-request-key-only').audit, get('proof-for-other-key-only').audit, 'An aggregate count cannot identify the incoming request key');
  const large = get('128-keys-response-proofs-absent');
  assert.deepEqual(large.audit.counts, { digest: 128, importKey: 128, verify: 0 });
  assert.deepEqual(large.incoming.counts, { digest: 1, importKey: 1, verify: 1 });
  assert.equal(get('invalid-incoming-proof').incoming.result.reason, 'signature-invalid');
  assert.equal(get('invalid-incoming-proof').audit.result.profiles.ietfProtocol01DomainBinding.verifiedKeys, 2);
  // Counter instrumentation must not change the actual adapter verdict.
  for (const trial of fixture.cases) {
    const plain = await responseApi.auditDirectoryResponse({ ...trial.context, body: new Uint8Array(trial.context.body) }, { now: new Date(trial.now) });
    assert.deepEqual(plain, get(trial.name).audit.result);
  }
});
