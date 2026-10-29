import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { assessNativeBotComparison as assess } from '../../analytics/.test-dist/native-bot-comparison.js';

const [readbackPath, archiveManifestPath, acceptancePath, outputPath] = process.argv.slice(2);
assert.ok(outputPath);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const manifestBytes = readFileSync(archiveManifestPath), manifest = JSON.parse(manifestBytes);
const acceptanceBytes = readFileSync(acceptancePath), acceptance = JSON.parse(acceptanceBytes);
assert.equal(hash(manifestBytes), acceptance.privateDataArchive.manifestSha256);
const inputBytes = readFileSync(readbackPath);
assert.equal(hash(inputBytes), manifest.files.find(row => row.path === 'gk-export75-readback.json')?.sha256);
const batches = JSON.parse(inputBytes);
assert.equal(batches.length, 1); assert.equal(batches[0].success, true);
const stored = batches[0].results; assert.equal(stored.length, 52);
const synthetic = [
  { names: ['ExaSearchBot'], value: false, provenance: 'request-cf', expected: 'direct-field-not-crypto-oracle' },
  { names: ['ExaSearchBot'], value: true, provenance: 'request-cf', expected: 'direct-native-true-review' },
  { names: ['AhrefsBot'], value: false, provenance: 'request-cf', expected: 'direct-field-not-crypto-oracle' },
  { names: ['AhrefsSiteAudit'], value: true, provenance: 'request-cf', expected: 'direct-native-true-review' },
  { names: ['ExaUser'], value: false, provenance: 'request-cf', expected: 'registry-unreviewed' },
  { names: ['ExaSearchBot', 'ExaUser'], value: false, provenance: 'request-cf', expected: 'registry-partial' },
  { names: ['ExaSearchBot'], value: null, provenance: 'request-cf', expected: 'native-unavailable' },
  { names: ['ExaSearchBot'], value: 'private-canary', provenance: 'request-cf', expected: 'native-unrecognized' },
  { names: ['ExaSearchBot'], value: true, provenance: 'test-injected', expected: 'test-injected' },
  { names: ['ExaSearchBot'], value: true, provenance: 'unestablished', expected: 'provenance-unestablished' },
  { names: [], value: false, provenance: 'request-cf', expected: 'no-declarations' },
  { names: ['AhrefsBot', 'AhrefsBot'], value: false, provenance: 'request-cf', expected: 'direct-field-not-crypto-oracle' },
];
const script = (await build({ stdin: { resolveDir: process.cwd(), contents: `
import {assessNativeBotComparison as assess} from './packages/analytics/src/native-bot-comparison.ts';
export default {async fetch(request) {const input=await request.json();return Response.json(assess(input.names,input.value,input.provenance));}};`
}, bundle: true, write: false, platform: 'browser', format: 'esm', logLevel: 'silent' })).outputFiles[0].text;
const collector = await build({ entryPoints: ['packages/blog/src/worker/index.ts'], bundle: true,
  write: false, metafile: true, platform: 'browser', format: 'esm', logLevel: 'silent' });
assert.ok(!Object.keys(collector.metafile.inputs).some(path => path.endsWith('/native-bot-comparison.ts')));
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script, compatibilityDate: '2026-03-06', cf: {} });
async function pair(input) {
  const node = assess(input.names, input.value, input.provenance);
  const response = await mf.dispatchFetch('https://offline.example/check', { method: 'POST', body: JSON.stringify(input) });
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), node);
  assert.equal(node.managedCryptographicAgreement, null); assert.equal(node.humanTriggerEstablished, false);
  assert.equal(node.requestOperatorAuthenticated, false);
  assert.ok(!JSON.stringify(node).includes('private-canary'));
  return node;
}
try {
  const controls = [];
  for (const input of synthetic) {
    const result = await pair(input); assert.equal(result.basis, input.expected);
    controls.push({ expected: input.expected, basis: result.basis, nativeSignedAgent: result.nativeSignedAgent });
  }
  const names = { ExaSearchBot: 0, AhrefsBot: 0 };
  for (const row of stored) {
    assert.ok(Object.hasOwn(names, row.agentName)); names[row.agentName]++;
    const signature = JSON.parse(row.signatureEvidence), classification = JSON.parse(row.classificationEvidence);
    assert.equal(row.signatureStatus, 'verified'); assert.equal(signature.source, 'local-webbotauth');
    assert.equal(signature.native.signedAgent, null); assert.equal(row.ownerFlag, 0);
    assert.deepEqual(classification.declarations.candidates, [row.agentName]);
    // Provenance remains unestablished here: an archived JSON field is not a
    // fresh inbound provider assertion. Preserve the stored null either way.
    const result = await pair({ names: classification.declarations.candidates, value: signature.native.signedAgent, provenance: 'unestablished' });
    assert.equal(result.reviewedDirectDeclarations, 1); assert.equal(result.nativeSignedAgent, 'unavailable');
    assert.equal(result.basis, 'provenance-unestablished');
  }
  assert.deepEqual(names, { ExaSearchBot: 51, AhrefsBot: 1 });
  const receipt = { checkedAt: new Date().toISOString(), scriptSha256: hash(readFileSync(new URL(import.meta.url))),
    moduleSha256: hash(readFileSync('packages/analytics/src/native-bot-comparison.ts')), bundleSha256: hash(Buffer.from(script)),
    readbackSha256: hash(inputBytes), archiveManifestSha256: hash(manifestBytes), acceptanceSha256: hash(acceptanceBytes),
    nodeAndWorkerdAgree: true, contextsPerRuntime: 64, syntheticControls: controls, storedRows: 52, declaredNames: names,
    storedNativeUnavailable: 52, registryDirectDeclarations: 52, managedCryptoAgreementRate: null,
    absentFromWorkerDependencyGraph: true, workerGraphInputs: Object.keys(collector.metafile.inputs).length,
    historicalRowsChanged: false, externalRequests: 0, d1Statements: 0, humanLabels: 0,
    limits: ['Registry metadata is current review of supplied declarations, not authenticated historical role.',
      'Archived native nulls and unestablished provenance cannot measure managed-verifier disagreement.',
      'Synthetic request-cf provenance labels simulate the API contract; they are not real provider assertions.'] };
  writeFileSync(outputPath, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ contextsPerRuntime: 64, synthetic: 12, stored: 52, nodeAndWorkerdAgree: true, collectorAdoption: false }));
} finally { await mf.dispose(); }
