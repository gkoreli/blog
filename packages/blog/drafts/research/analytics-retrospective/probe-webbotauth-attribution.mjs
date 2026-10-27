import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { attributionExperiment } from '../../../../analytics/test/fixtures/webbotauth-attribution.mjs';
import { VERIFIER_PROFILE_VERSION } from '../../../../analytics/.test-dist/versions.js';

const output = process.argv[2]; assert.ok(output, 'Provide a new aggregate receipt path');
const files = ['src/webbotauth.ts', 'src/vendor-signatures.ts', 'src/versions.ts', 'test/fixtures/webbotauth-attribution.mjs'];
const result = await attributionExperiment();
writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), runtime: process.version,
  verifierProfile: VERIFIER_PROFILE_VERSION,
  method: 'Independently assembled signing bytes; ephemeral Ed25519 fixture key, fixed clock, intercepted directory. Exa tokens are declarations only. No native provider, vendor request or human trial.',
  ...result,
  probeSha256: createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),
  sourceSha256: Object.fromEntries(files.map(file => [file, createHash('sha256').update(readFileSync(new URL('../../../../analytics/' + file, import.meta.url))).digest('hex')])),
  limits: ['Selected local controls, not full RFC/draft conformance or production prevalence.', 'Same-nonce acceptance demonstrates existing expiry-only policy, not observed exploitation.', 'Covered Content-Digest means the header is signed; this verifier does not compare its digest with body bytes. The page collector only admits GET.', 'Outer-label acceptance follows RFC relabelling and published draft vectors; draft section 5.2.1 label wording requires clarification.'],
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ trials: result.trials.length, networkCalls: result.networkCalls, productionCalls: result.productionCalls }));
