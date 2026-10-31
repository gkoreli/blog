import assert from 'node:assert/strict';
import test from 'node:test';
import * as requestApi from '../.test-dist/webbotauth.js';
import * as responseApi from '../.test-dist/directory-response-audit.js';
import { makeStructuredExtensionsFixture, runStructuredExtensionsFixture, structuredExtensionSyntax } from './fixtures/structured-extensions.mjs';

test('Structured Field decimals canonicalize exactly while syntax and duplicate policies remain strict', () => {
  for (const row of structuredExtensionSyntax) {
    const entries = requestApi.parseDictionary(row.input);
    const canonical = entries === null ? null : entries.map(e => `${e.key}=${e.member.type === 'inner-list' ? requestApi.serializeInnerList(e.member.value) : requestApi.serializeItem(e.member.value)}`).join(', ');
    assert.equal(canonical, row.canonical, row.name);
  }
  const decimal = requestApi.parseDictionary('sig=("@authority");x=1.000');
  assert.equal(decimal[0].member.value.parameters[0].value.type, 'decimal');
  const spacedInteger = requestApi.parseDictionary('sig=("@authority");  created=1793404800');
  assert.equal(requestApi.serializeInnerList(spacedInteger[0].member.value), '("@authority");created=1793404800');
});

test('independently signed legal extensions verify; mutation and registered metadata type errors remain distinct', async () => {
  const data = await makeStructuredExtensionsFixture();
  // Isolate whitespace compatibility from decimal compatibility. Reuse the
  // plain control's signature; whitespace changes no canonical signed bytes.
  const plain = data.requests.find(row => row.name === 'plain-baseline');
  data.requests.push({ ...plain, name: 'semicolon-sp-only', headers: plain.headers.map(([name, value]) =>
    [name, name === 'signature-input' ? value.replaceAll(';', ';  ') : value]) });
  const result = await runStructuredExtensionsFixture(data, requestApi, responseApi);
  for (const row of result.requests) {
    const expected = data.requests.find(r => r.name === row.name).expected;
    assert.equal(row.status === 'verified' ? 'verified' : row.reason, expected, row.name);
    if (row.name === 'decimal-created' || row.name === 'decimal-expires') assert.equal(row.lookups, 0);
  }
  const [valid, parameter, body] = result.responses;
  assert.equal(valid.audit.digest, 'matched');
  assert.equal(valid.audit.profiles.ietfProtocol01DomainBinding.verifiedKeys, 1);
  assert.equal(parameter.audit.digest, 'matched');
  assert.equal(parameter.audit.proofs[0].reason, 'signature-mismatch');
  assert.equal(parameter.audit.profiles.ietfProtocol01DomainBinding.verifiedKeys, 0);
  assert.equal(body.audit.digest, 'mismatch');
  assert.equal(body.audit.proofs[0].outcome, 'verified');
  assert.equal(body.audit.profiles.ietfProtocol01DomainBinding.verifiedKeys, 0);
});
