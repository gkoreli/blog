import assert from 'node:assert/strict';
import test from 'node:test';
import { assessNativeBotComparison as assess, REVIEWED_NATIVE_BOTS } from '../.test-dist/native-bot-comparison.js';

test('a Direct signed publisher does not turn false into cryptographic rejection', () => {
  const exa = REVIEWED_NATIVE_BOTS.find(row => row.declaration === 'ExaSearchBot');
  assert.equal(exa.access, 'direct'); assert.equal(exa.signatureDirectoryShown, true);
  const result = assess(['ExaSearchBot'], false, 'request-cf');
  assert.equal(result.basis, 'direct-field-not-crypto-oracle');
  assert.equal(result.nativeSignedAgent, 'false'); assert.equal(result.managedCryptographicAgreement, null);
  assert.equal(result.humanTriggerEstablished, false); assert.equal(result.requestOperatorAuthenticated, false);
});

test('unexpected native true is a review condition, never authenticated purpose', () => {
  const result = assess(['AhrefsSiteAudit'], true, 'request-cf');
  assert.equal(result.basis, 'direct-native-true-review');
  assert.equal(result.managedCryptographicAgreement, null); assert.equal(result.humanTriggerEstablished, false);
});

test('unknown and injected values remain distinct from a genuine boolean', () => {
  for (const [value, state, basis] of [
    [null, 'unavailable', 'native-unavailable'], [undefined, 'unavailable', 'native-unavailable'],
    ['false', 'unrecognized', 'native-unrecognized'], [0, 'unrecognized', 'native-unrecognized'],
    [{ private: 'canary' }, 'unrecognized', 'native-unrecognized'],
  ]) {
    const result = assess(['AhrefsBot'], value, 'request-cf');
    assert.equal(result.nativeSignedAgent, state); assert.equal(result.basis, basis);
    assert.ok(!JSON.stringify(result).includes('canary'));
  }
  assert.equal(assess(['AhrefsBot'], true, 'test-injected').basis, 'test-injected');
  assert.equal(assess(['AhrefsBot'], true, 'unestablished').basis, 'provenance-unestablished');
  assert.equal(assess(['AhrefsBot'], true, 'unrecognized-canary').declaredProvenance, 'unestablished');
});

test('registry review is exact and partial review cannot supply a vendor-wide claim', () => {
  assert.equal(assess([], false, 'request-cf').basis, 'no-declarations');
  for (const name of ['ExaUser', 'NotExaSearchBot', 'exasearchbot', 'AhrefsBotSuffix', 'canary@example.invalid']) {
    const result = assess([name], false, 'request-cf');
    assert.equal(result.basis, 'registry-unreviewed');
    assert.equal(result.unreviewedDeclarations, 1); assert.ok(!JSON.stringify(result).includes(name));
  }
  const partial = assess(['ExaSearchBot', 'ExaUser'], false, 'request-cf');
  assert.equal(partial.basis, 'registry-partial'); assert.equal(partial.reviewedDirectDeclarations, 1);
  assert.equal(partial.unreviewedDeclarations, 1);
  const duplicates = assess(['AhrefsBot', 'AhrefsBot', 'AhrefsSiteAudit'], false, 'request-cf');
  assert.equal(duplicates.declarations, 2); assert.equal(duplicates.reviewedDirectDeclarations, 2);
  assert.equal(duplicates.unreviewedDeclarations, 0);
});
