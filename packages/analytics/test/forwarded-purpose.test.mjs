import assert from 'node:assert/strict';
import test from 'node:test';
import { auditForwardedPurpose, forwardedClaimFacts } from '../.test-dist/forwarded-purpose.js';
import { forwardedPurposeFixture, forwardedSyntaxCases } from './fixtures/forwarded-purpose.mjs';

test('Forwarded claims preserve syntax, conflicts, bounds and private-value absence', () => {
  for (const item of forwardedSyntaxCases) {
    const facts = forwardedClaimFacts(item.header);
    assert.equal(facts.syntax, item.syntax, item.name);
    if (item.duplicate) assert.equal(facts.duplicate, item.duplicate, item.name);
    if (Object.hasOwn(item, 'operator')) assert.equal(facts.elements[0].operator.value, item.operator, item.name);
    if (Object.hasOwn(item, 'use')) assert.equal(facts.elements[0].use.value, item.use, item.name);
    if (item.elements) assert.equal(facts.elements.length, item.elements, item.name);
    assert.equal(facts.chainSelection, 'not-performed');
    if (facts.syntax !== 'parsed') assert.deepEqual(facts.elements, [], item.name);
  }
  const privateValues = forwardedClaimFacts('for="192.0.2.123";by="[2001:db8::abcd]";host="private.example";x="email@example.invalid";use=full');
  const output = JSON.stringify(privateValues);
  for (const value of ['192.0.2.123', '2001:db8', 'private.example', 'email@example.invalid']) assert.equal(output.includes(value), false);
});

test('verified publisher assertions remain separate from delegation and actual use', async () => {
  const fixture = await forwardedPurposeFixture();
  const request = row => new Request(row.url, { method: row.method, headers: row.headers });
  const fetcher = async url => { assert.equal(String(url), 'https://purpose-fixture.example/.well-known/http-message-signatures-directory'); return Response.json(fixture.records.signed.directory, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } }); };
  const invoke = (name, options = {}) => auditForwardedPurpose(request(fixture.records[name]), { fetcher, now: new Date(fixture.records[name].now), ...options });
  for (const name of ['signed', 'unsigned', 'changedUnsigned', 'coveredOtherHeader']) {
    const result = await invoke(name); assert.equal(result.assessment, 'complete', name); assert.equal(result.verified, 1, name);
    assert.equal(result.verifiedWholeFieldCoverage, name === 'signed' ? 1 : 0, name);
    assert.equal(result.claimAuthentication, name === 'signed' ? 'verified-signer-assertion' : 'not-established', name);
    for (const field of ['delegation', 'actualUse', 'humanTrigger', 'nativeHeaderProvenance']) assert.equal(result[field], 'not-established', field);
  }
  const changed = await invoke('changedSigned'); assert.equal(changed.invalid, 1); assert.equal(changed.verified, 0); assert.equal(changed.claimAuthentication, 'not-established');
  const spoof = await invoke('spoof'); assert.equal(spoof.verified, 0); assert.equal(spoof.claimAuthentication, 'not-established'); assert.equal(spoof.directoryFetches, 0);
  const cfSpoof = request(fixture.records.spoof); Object.defineProperty(cfSpoof, 'cf', { value: { botManagement: { verifiedBot: true, signedAgent: true } } });
  assert.equal((await auditForwardedPurpose(cfSpoof, { fetcher })).nativeHeaderProvenance, 'not-established');
  const conflict = await invoke('conflict'); assert.equal(conflict.claims.duplicate, 'different-values'); assert.equal(conflict.attempted, 0);
  const full = await invoke('multi'); assert.equal(full.verifiedWholeFieldCoverage, 1); assert.equal(full.verifiedWithoutFieldCoverage, 1);
  const limited = await invoke('multi', { maxCandidates: 1 }); assert.equal(limited.assessment, 'partial'); assert.equal(limited.unassessedCandidates, 1); assert.equal(limited.claimAuthentication, 'not-established');
  const unavailable = await invoke('signed', { fetcher: async () => new Response(null, { status: 503 }) }); assert.equal(unavailable.unavailable, 1); assert.equal(unavailable.invalid, 0); assert.equal(unavailable.assessment, 'partial');
  const badOptions = await invoke('signed', { maxCandidates: 0 }); assert.equal(badOptions.assessment, 'not-assessed'); assert.equal(badOptions.policy, null);
  let aborted = false;
  const timeout = await invoke('signed', { deadlineMs: 30, fetcher: (_, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => { aborted = true; reject(new Error('Controlled abort')); }, { once: true })) });
  assert.equal(timeout.assessment, 'partial'); assert.equal(timeout.termination, 'deadline'); assert.equal(timeout.unavailable, 1); assert.equal(aborted, true);
  const mutable = request(fixture.records.signed);
  const pending = auditForwardedPurpose(mutable, { fetcher, now: new Date(fixture.records.signed.now) }); mutable.headers.set('Forwarded', 'for=other;use=full');
  assert.equal((await pending).claimAuthentication, 'verified-signer-assertion');
});
