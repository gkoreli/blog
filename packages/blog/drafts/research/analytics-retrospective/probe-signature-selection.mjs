import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { signatureSelectionFixture } from '../../../../analytics/test/fixtures/signature-selection.mjs';
import { verifyWebBotAuth, createWebBotAuthCache } from '../../../../analytics/.test-dist/webbotauth.js';
import { VERIFIER_PROFILE_VERSION } from '../../../../analytics/.test-dist/versions.js';

const [output, modulePath] = process.argv.slice(2); assert.ok(output && modulePath);
const moduleFile = resolve(modulePath), { verifySignature } = await import(pathToFileURL(moduleFile).href);
assert.equal(typeof verifySignature, 'function');
const fixture = await signatureSelectionFixture(), rows = [];
const errors = new Set(['LabelRequired', 'LabelMismatch', 'VerificationFailed']);
for (const trial of fixture.cases) {
  const request = new Request('https://publication.example/article', { headers: trial.headers });
  const local = await verifyWebBotAuth(request, { now: fixture.now, includeEvidence: true, cache: createWebBotAuthCache(), fetcher: async url => {
    assert.ok(Object.hasOwn(fixture.directories, String(url)));
    return Response.json(fixture.directories[String(url)], { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } });
  } });
  const reference = [];
  for (const label of [undefined, 'one', 'two']) {
    let verifications = 0;
    try {
      const result = await verifySignature(request, { label,
        policy: { algorithms: ['ed25519'], requiredComponents: [], requiredParameters: ['created', 'expires', 'keyid', 'alg', 'tag'], now: Math.floor(fixture.now.getTime() / 1000) },
        resolveVerifier: async candidate => {
          const jwks = Object.values(fixture.directories).flatMap(directory => directory.keys);
          let selected;
          for (const jwk of jwks) {
            const canonical = JSON.stringify({ crv: 'Ed25519', kty: 'OKP', x: jwk.x });
            const kid = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical))).toString('base64url');
            if (kid === candidate.parameters.keyid) selected = jwk;
          }
          assert.ok(selected); const key = await crypto.subtle.importKey('jwk', selected, 'Ed25519', false, ['verify']);
          return { algorithm: 'ed25519', verify: async (data, signature) => { verifications++; return crypto.subtle.verify('Ed25519', key, signature, data); } };
        },
      });
      reference.push({ requestedLabel: label ?? 'default', verified: true, selectedFixtureLabel: result.label, verifications });
    } catch (error) {
      assert.ok(errors.has(error.code), 'Unexpected reference failure');
      reference.push({ requestedLabel: label ?? 'default', verified: false, error: error.code, verifications });
    }
  }
  assert.equal(local.status, 'verified'); assert.equal(local.agent, trial.selectedOrigin);
  rows.push({ name: trial.name, localStatus: local.status, localSelection: local.evidence.selection, reference });
}
const both = rows.find(row => row.name === 'both-valid');
assert.equal(both.reference[0].error, 'LabelRequired'); assert.ok(both.reference.slice(1).every(row => row.verified));
writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), profile: VERIFIER_PROFILE_VERSION,
  method: 'Execute the pinned generic reference verifySignature API with actual WebCrypto fixture verification, default and explicit labels. It is not the complete Web Bot Auth profile, production Cloudflare, or a vendor resolver.',
  moduleSha256: createHash('sha256').update(readFileSync(moduleFile)).digest('hex'), rows, productionRequests: 0, externalRequests: 0,
}, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
console.log(JSON.stringify({ cases: rows.length, referenceInvocations: rows.length * 3, productionRequests: 0 }));
