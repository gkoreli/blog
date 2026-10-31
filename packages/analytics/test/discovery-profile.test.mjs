import assert from 'node:assert/strict';
import test from 'node:test';
import { discoveryProfileFixture } from './fixtures/discovery-profile.mjs';
import { createWebBotAuthCache, verifyWebBotAuth, verifyWebBotAuthCandidate } from '../.test-dist/webbotauth.js';
import { auditWebBotAuth } from '../.test-dist/webbotauth-audit.js';
import { verificationEvidence, verificationOutcome } from '../.test-dist/signature-evidence.js';

const fixture = await discoveryProfileFixture();
const rows = new Map(fixture.rows.map(row => [row.name, row]));
const wellKnown = 'https://keys.example/.well-known/http-message-signatures-directory';

async function assess(name, mode) {
  const row = rows.get(name); assert.ok(row);
  const calls = [];
  const fetcher = async (url, init) => {
    const target = String(url); calls.push(target); assert.equal(init.redirect, 'manual');
    assert.ok(Object.hasOwn(fixture.directories, target), 'only exact synthetic URLs can resolve');
    return Response.json(fixture.directories[target], {
      headers: { 'Content-Type': 'application/http-message-signatures-directory+json', 'Cache-Control': 'max-age=300' },
    });
  };
  const request = new Request(row.url, { method: row.method, headers: row.headers });
  const options = { now: new Date(row.now), includeEvidence: true, cache: createWebBotAuthCache(), fetcher };
  const result = mode === 'audit' ? await auditWebBotAuth(request, options)
    : mode === 'candidate' ? await verifyWebBotAuthCandidate(request, 'proof', options)
    : await verifyWebBotAuth(request, options);
  return { result, calls, request };
}

test('synthetic mathematical controls are independent of protocol compatibility', async () => {
  assert.equal(fixture.rows.length, 20);
  assert.equal(fixture.rows.filter(row => row.expectedCrypto).length, 18);
  for (const row of fixture.rows) {
    const key = await crypto.subtle.importKey('jwk', row.publicKey, 'Ed25519', false, ['verify']);
    const match = /^proof=:([^:]+):$/.exec(row.headers.Signature); assert.ok(match);
    const valid = await crypto.subtle.verify('Ed25519', key, Buffer.from(match[1], 'base64'), new TextEncoder().encode(row.oracleBase));
    assert.equal(valid, row.expectedCrypto, row.name);
  }
});

test('three existing origin profiles preserve verification and exact directory lookup', async () => {
  for (const name of ['legacy-origin', 'dictionary-origin', 'legacy-directory-parameter']) {
    for (const mode of ['default', 'candidate', 'audit']) {
      const { result, calls } = await assess(name, mode);
      assert.deepEqual(calls, [wellKnown]);
      if (mode === 'audit') {
        assert.equal(result.verifiedCandidates, 1); assert.equal(result.unsupportedCandidates, 0);
        assert.equal(result.assessment, 'complete');
      } else {
        assert.equal(result.status, 'verified'); assert.equal(result.agent, 'https://keys.example');
      }
    }
  }
});

test('explicit path discovery remains unsupported before crypto in all three API paths', async () => {
  for (const name of ['explicit-well-known', 'explicit-tenant-a', 'explicit-tenant-b', 'invalid-explicit-proof', 'explicit-legacy-parameter']) {
    for (const mode of ['default', 'candidate', 'audit']) {
      const { result, calls, request } = await assess(name, mode);
      assert.deepEqual(calls, [], `${name}/${mode}`);
      if (mode === 'audit') {
        assert.equal(result.verifiedCandidates, 0); assert.equal(result.unsupportedCandidates, 1);
        assert.equal(result.notVerifiedByProfileCandidates, 0); assert.equal(result.unresolvedCandidates, 1);
        assert.equal(result.assessment, 'partial'); assert.equal(result.termination, 'exhausted');
      } else {
        assert.deepEqual(result, { status: 'unverified', reason: 'unsupported-signature-agent-location' });
        assert.equal(verificationOutcome(result), 'unsupported');
        const evidence = verificationEvidence(request, result);
        assert.equal(evidence.localOutcome, 'unsupported'); assert.equal(evidence.coverage, null);
      }
    }
  }
  // These assertions concern two distinct unsupported identifiers, not one trusted host identity.
  assert.notEqual(rows.get('explicit-tenant-a').headers['Signature-Agent'], rows.get('explicit-tenant-b').headers['Signature-Agent']);
});

test('a root-resource key and a damaged supported proof retain distinct failure causes', async () => {
  for (const [name, reason, outcome] of [['root-resource-key', 'key-not-found', 'unavailable'], ['invalid-origin-proof', 'signature-invalid', 'invalid']]) {
    for (const mode of ['default', 'candidate', 'audit']) {
      const { result, calls } = await assess(name, mode); assert.deepEqual(calls, [wellKnown]);
      if (mode === 'audit') {
        assert.equal(result.verifiedCandidates, 0); assert.equal(result.unsupportedCandidates, 0);
        assert.equal(result.unavailableCandidates, Number(outcome === 'unavailable'));
        assert.equal(result.notVerifiedByProfileCandidates, Number(outcome === 'invalid'));
      } else { assert.deepEqual(result, { status: 'unverified', reason }); assert.equal(verificationOutcome(result), outcome); }
    }
  }
});

test('malformed and unsafe locations cannot gain unsupported status through a path-first shortcut', async () => {
  const invalid = ['explicit-query', 'explicit-fragment', 'origin-query', 'origin-fragment', 'non-https-explicit', 'credentials-explicit', 'malformed-uri'];
  for (const name of [...invalid, 'ip-explicit', 'local-explicit', 'unsupported-type']) {
    const reason = invalid.includes(name) ? 'invalid-signature-agent'
      : name === 'unsupported-type' ? 'unsupported-or-missing-component' : 'discovery-policy-rejected';
    for (const mode of ['default', 'candidate', 'audit']) {
      const { result, calls } = await assess(name, mode); assert.deepEqual(calls, []);
      if (mode === 'audit') { assert.equal(result.verifiedCandidates, 0); assert.equal(result.unsupportedCandidates, 0); }
      else { assert.deepEqual(result, { status: 'unverified', reason }); assert.notEqual(verificationOutcome(result), 'unsupported'); }
    }
  }
});
