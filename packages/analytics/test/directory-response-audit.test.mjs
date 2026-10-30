import test from 'node:test';
import assert from 'node:assert/strict';
import { auditDirectoryResponse } from '../.test-dist/directory-response-audit.js';
import { directoryResponseFixture } from './fixtures/directory-response.mjs';

test('labelled response matrix separates possession, signed headers and actual body integrity', async () => {
  const fixture = directoryResponseFixture();
  for (const { name, context, expected: e } of fixture.cases) {
    const r = await auditDirectoryResponse(context, { now: fixture.now });
    if (e.assessed === false) { assert.equal(r.assessment, 'not-assessed', name); assert.equal(r.reason, e.reason, name); continue; }
    assert.equal(r.proofs.filter(p => p.outcome === 'verified').length, e.verified, name);
    assert.equal(r.profiles.cloudflareDirectory03.verifiedKeys, e.authority, name);
    assert.equal(r.profiles.ietfProtocol01DomainBinding.verifiedKeys, e.bound, name);
    assert.equal(r.digest, e.digest, name);
    if (e.reason) assert.equal(r.proofs[0].reason, e.reason, name);
    if (e.allAuthority !== undefined) assert.equal(r.profiles.cloudflareDirectory03.allAdmittedKeysVerified, e.allAuthority, name);
    if (e.duplicates !== undefined) assert.equal(r.duplicateKeyEntries, e.duplicates, name);
    if (e.admitted !== undefined) assert.equal(r.admittedKeys, e.admitted, name);
    if (e.rejected !== undefined) assert.equal(r.rejectedKeyEntries, e.rejected, name);
    if (name === 'signed-unsupported-digest') {
      assert.equal(r.profiles.ietfProtocol01DomainBinding.allAdmittedKeysVerified, null);
      assert.equal(r.assessment, 'partial'); assert.equal(r.reason, 'unsupported-evidence');
    }
    assert.equal(r.proofs.length + r.unassessedCandidates, r.pairedCandidates, name);
    const text = JSON.stringify(r);
    for (const secret of ['fixture.example', context.headers.Signature, context.headers['Signature-Input']]) if (secret) assert.equal(text.includes(secret), false, name);
  }
});

test('candidate caps and orphan members keep incomplete traversal visible', async () => {
  const f = directoryResponseFixture(), context = f.build();
  const capped = await auditDirectoryResponse(context, { now: f.now, maxCandidates: 1 });
  assert.equal(capped.assessment, 'partial'); assert.equal(capped.reason, 'candidate-limit');
  assert.equal(capped.unassessedCandidates, 1); assert.equal(capped.profiles.cloudflareDirectory03.allAdmittedKeysVerified, null);
  context.headers.Signature += ', orphan=:AAAA:';
  const orphan = await auditDirectoryResponse(context, { now: f.now });
  assert.equal(orphan.unpairedMembers, 1); assert.equal(orphan.assessment, 'partial');
  assert.equal(orphan.profiles.cloudflareDirectory03.verifiedKeys, 2);
});

test('transport/context/size gates do not become cryptographic negatives', async () => {
  const f = directoryResponseFixture(), base = f.build();
  const cases = [
    [{ ...base, requestUrl: base.requestUrl.replace('https:', 'http:') }, {}, 'invalid-context'],
    [{ ...base, status: 302 }, {}, 'http-status'],
    [{ ...base, headers: { ...base.headers, 'Content-Type': 'application/json' } }, {}, 'media-type'],
    [{ ...base, headers: { ...base.headers, 'Content-Encoding': 'gzip' } }, {}, 'encoding-unsupported'],
    [{ ...base, body: new Uint8Array(65537) }, {}, 'input-budget'],
    [{ ...base, headers: { ...base.headers, Oversized: 'x'.repeat(32769) } }, {}, 'input-budget'],
    [{ ...base, body: new TextEncoder().encode('{"keys":null}') }, {}, 'directory-invalid'],
    [base, { maxCandidates: 0 }, 'invalid-context'],
    [base, { now: new Date(NaN) }, 'invalid-context'],
  ];
  for (const [context, options, reason] of cases) {
    const r = await auditDirectoryResponse(context, { now: f.now, ...options });
    assert.equal(r.assessment, 'not-assessed'); assert.equal(r.reason, reason); assert.equal(r.proofs.length, 0);
    assert.equal(r.digest, 'not-assessed');
    assert.equal(r.profiles.cloudflareDirectory03.allAdmittedKeysVerified, null);
  }
});

test('snapshots survive caller mutation while asynchronous key work is pending', async () => {
  const f = directoryResponseFixture(), context = f.build({ digest: true, components: ['"@authority";req', '"content-digest"', '"@status"'] });
  const pending = auditDirectoryResponse(context, { now: f.now });
  context.body.fill(0); context.status = 503; context.headers.Signature = 'changed';
  const r = await pending;
  assert.equal(r.profiles.ietfProtocol01DomainBinding.verifiedKeys, 2);
});
