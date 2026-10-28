import assert from 'node:assert/strict';
import { writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { signatureSelectionFixture } from '../../../../analytics/test/fixtures/signature-selection.mjs';
import { verificationClockCases } from '../../../../analytics/test/fixtures/verification-clock.mjs';
import { verifyWebBotAuth, verifyWebBotAuthCandidate, createWebBotAuthCache } from '../../../../analytics/.test-dist/webbotauth.js';
import { auditWebBotAuth } from '../../../../analytics/.test-dist/webbotauth-audit.js';
import { VERIFIER_PROFILE_VERSION } from '../../../../analytics/.test-dist/versions.js';

const [output, referencePath, fixtureOutput] = process.argv.slice(2); assert.ok(output && referencePath && fixtureOutput);
const fixture = await signatureSelectionFixture();
writeFileSync(fixtureOutput, JSON.stringify(fixture) + '\n', { mode: 0o600, flag: 'wx' });
const rows = [];
for (const trial of verificationClockCases(fixture.now)) {
  const request = new Request('https://publication.example/a', { headers: trial.unsigned ? {} : fixture.cases[0].headers });
  const paths = [];
  for (const mode of ['default', 'selected', 'audit']) {
    let fetches = 0;
    const options = { now: trial.now, includeEvidence: true, maxAgeSeconds: 86400, cache: createWebBotAuthCache(), fetcher: async url => {
      fetches++; const body = structuredClone(fixture.directories[String(url)]); assert.ok(body);
      if (trial.expiredKey) body.keys = body.keys.map(key => ({ ...key, exp: Math.floor(fixture.now.getTime() / 1000) - 100 }));
      return Response.json(body, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } });
    } };
    try {
      const result = await (mode === 'default' ? verifyWebBotAuth(request, options) : mode === 'selected' ? verifyWebBotAuthCandidate(request, 'one', options) : auditWebBotAuth(request, options));
      paths.push({ mode, status: result.status ?? result.assessment, reason: result.reason ?? result.termination ?? null, fetches,
        ageFinite: result.evidence === undefined ? null : Number.isFinite(result.evidence.ageSeconds),
        serializedAgeNull: result.evidence === undefined ? null : JSON.parse(JSON.stringify(result.evidence)).ageSeconds === null });
    } catch (error) { assert.ok(['Error', 'TypeError'].includes(error.name)); paths.push({ mode, status: 'threw', error: error.name, fetches }); }
  }
  rows.push({ name: trial.name, unusableClock: trial.unusable === true, paths });
}
const { verifySignature } = await import(pathToFileURL(resolve(referencePath)).href), reference = [];
for (const [name, now] of [['finite', Math.floor(fixture.now.getTime() / 1000)], ['nan', NaN], ['infinite', Infinity]]) {
  let resolutions = 0;
  try {
    const result = await verifySignature(new Request('https://publication.example/a', { headers: fixture.cases[0].headers }), { label: 'one',
      policy: { algorithms: ['ed25519'], requiredComponents: [], requiredParameters: ['created','expires'], now },
      resolveVerifier: async () => {
        resolutions++; const jwk = Object.values(fixture.directories)[0].keys[0];
        const key = await crypto.subtle.importKey('jwk', jwk, 'Ed25519', false, ['verify']);
        return { algorithm: 'ed25519', verify: (data, signature) => crypto.subtle.verify('Ed25519', key, signature, data) };
      },
    });
    assert.equal(result.label, 'one'); reference.push({ name, status: 'verified', resolutions });
  } catch (error) { assert.equal(error.code, 'PolicyViolation'); reference.push({ name, status: 'rejected', error: 'PolicyViolation', resolutions }); }
}
assert.equal(reference[0].status, 'verified'); assert.ok(reference.slice(1).every(row => row.resolutions === 0));
writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), verifierProfile: VERIFIER_PROFILE_VERSION,
  method: 'Independently signed fixture across default, explicit-candidate and bounded-audit APIs. Clock options constructed in-process, never malformed HTTP clocks or claimed production clock failures. Generic pinned reference numeric-clock API has separate scope.',
  rows, reference, referenceModuleSha256: createHash('sha256').update(readFileSync(referencePath)).digest('hex'), externalRequests: 0, productionRequests: 0,
}, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
console.log(JSON.stringify({ cases: rows.length, paths: rows.length * 3, unusableDefaultVerified: rows.filter(row => row.unusableClock && row.paths[0].status === 'verified').length, auditThrows: rows.filter(row => row.paths[2].status === 'threw').length }));
