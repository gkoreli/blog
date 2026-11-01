import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
import { isDeepStrictEqual } from 'node:util';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const record = value => typeof value === 'object' && value !== null && !Array.isArray(value);
const id = value => typeof value === 'string' && /^[1-9][0-9]{0,18}$/.test(value) && BigInt(value) <= 9223372036854775807n;
const read = file => JSON.parse(readFileSync(file));
const DIRECTORY = 'https://crawler.exa.ai/.well-known/http-message-signatures-directory';
const [chainFile, dayFile, directoryFile, directoryHeadersFile, privateOutput, publicOutput, python, pythonSource, option] = process.argv.slice(2);
assert.ok(chainFile && dayFile && directoryFile && directoryHeadersFile && privateOutput && publicOutput && python && pythonSource,
  'Provide retained chain, day rows, captured directory/body headers, NEW private output dir, NEW public output, existing Python executable/source [--node-only]');
assert.ok(option === undefined || option === '--node-only');
const chains = read(chainFile), dayRows = read(dayFile);
assert.ok(Array.isArray(chains) && chains.length === 3 && Array.isArray(dayRows));
const invocations = chains.filter(row => row.$metadata?.type === 'cf-worker-event' && record(row.$workers?.event?.request?.headers));
const attempts = chains.filter(row => row.source?.message === 'analytics.observation_attempt');
const stored = chains.filter(row => row.source?.message === 'analytics.observation_stored');
assert.equal(invocations.length, 1); assert.equal(attempts.length, 1); assert.equal(stored.length, 1);
const invocation = invocations[0], attempt = attempts[0], acknowledgement = stored[0];
const requestId = invocation.$metadata.requestId;
assert.ok(typeof requestId === 'string' && requestId.length > 0);
assert.ok(chains.every(row => row.$metadata?.requestId === requestId && row.$workers?.truncated === false));
assert.equal(new Set(chains.map(row => row.$metadata.id)).size, 3);
assert.equal(attempt.source.operationId, acknowledgement.source.operationId);
assert.ok(typeof attempt.source.operationId === 'string' && attempt.source.operationId.length > 0);
assert.equal(acknowledgement.source.storage?.status, 'returned');
const reference = acknowledgement.source.storage.observationId;
assert.ok(id(reference));
const selected = dayRows.filter(row => String(row.id) === reference);
assert.equal(selected.length, 1);
const row = selected[0], request = invocation.$workers.event.request;
assert.equal(new URL(request.url).origin, 'https://gkoreli.com');
assert.equal(new URL(request.url).pathname, row.path);
assert.equal(request.method, 'GET');
assert.equal(invocation.$workers.event.response?.status, 200);
assert.equal(row.signature_agent, 'https://crawler.exa.ai');
assert.equal(row.agent_name, 'ExaSearchBot');
assert.equal(row.signature_status, 'verified');
assert.equal(row.reader_kind, 'ai-search');
assert.equal(attempt.source.collectionVersion, row.collection_version);
assert.equal(acknowledgement.source.collectionVersion, row.collection_version);
const recordedAt = new Date(attempt.timestamp);
assert.ok(Number.isFinite(recordedAt.getTime()));
assert.equal(recordedAt.toISOString().replace('T', ' ').slice(0, 19), row.observed_at);
const workers = new Set(chains.map(value => value.$workers.scriptVersion?.id));
assert.equal(workers.size, 1);
const workerVersion = [...workers][0]; assert.match(workerVersion, /^[a-f0-9-]{36}$/);

const directoryBytes = readFileSync(directoryFile), directory = JSON.parse(directoryBytes);
const headerText = readFileSync(directoryHeadersFile, 'utf8');
const statusLines = [...headerText.matchAll(/^HTTP\/[^ ]+ (\d{3})/gm)];
assert.ok(statusLines.length > 0); assert.equal(statusLines.at(-1)[1], '200');
const directoryHeaders = Object.fromEntries(headerText.split(/\r?\n/).flatMap(line => {
  const index = line.indexOf(':'); return index > 0 ? [[line.slice(0, index).toLowerCase(), line.slice(index + 1).trim()]] : [];
}));
assert.equal(directoryHeaders['content-type']?.split(';')[0], 'application/http-message-signatures-directory+json');
const capturedAt = new Date(directoryHeaders.date); assert.ok(Number.isFinite(capturedAt.getTime()));
assert.ok(capturedAt > recordedAt, 'Expected separately captured later directory');
assert.ok(Array.isArray(directory.keys) && directory.keys.length > 0);
assert.ok(Object.keys(request.headers).some(name => name.toLowerCase() === 'signature'));
assert.ok(Object.keys(request.headers).some(name => name.toLowerCase() === 'signature-input'));
const retainedSignatureInput = Object.entries(request.headers).find(([name]) => name.toLowerCase() === 'signature-input')?.[1];
assert.equal(typeof retainedSignatureInput, 'string');
const componentLists = [...retainedSignatureInput.matchAll(/\(([^)]*)\)/g)]
  .map(match => [...match[1].matchAll(/"([@a-z][@a-z0-9-]*)"/g)].map(component => component[1]));
assert.deepEqual(componentLists, [['@authority', 'signature-agent']]);
const input = { vendor: 'exa', variant: 'untouched-retained-request', url: request.url, method: request.method,
  headers: request.headers, now: recordedAt.toISOString(), directory, directoryBytes: directoryBytes.toString('utf8'), directoryHeaders };
const output = resolve(privateOutput); mkdirSync(output, { mode: 0o700 });
const save = (file, value) => writeFileSync(resolve(output, file), JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
save('recorded-input-private.json', input);
save('selected-row-private.json', row);

const entry = `import {verifyWebBotAuth,createWebBotAuthCache} from './packages/analytics/src/webbotauth.ts';
import {storedObservationReceipt} from './packages/analytics/src/observation-receipt.ts';
import {VERIFIER_PROFILE_VERSION} from './packages/analytics/src/versions.ts';
export async function replay(input){
 const calls=[];
 const result=await verifyWebBotAuth(new Request(input.url,{method:input.method,headers:input.headers}),{
  now:new Date(input.now),includeEvidence:true,maxAgeSeconds:86400,cache:createWebBotAuthCache(),
  fetcher:async(url,init)=>{if(String(url)!==${JSON.stringify(DIRECTORY)})throw Error('Unreviewed resolver URL');
   if(init?.redirect!=='manual')throw Error('Resolver redirect policy differs');calls.push(String(url));
   return new Response(input.directoryBytes,{status:200,headers:input.directoryHeaders});}
 });
 return {verifierProfile:VERIFIER_PROFILE_VERSION,result,calls};
}
export function project(row){return storedObservationReceipt({readerKind:row.reader_kind,signatureStatus:row.signature_status,
 signatureAgent:row.signature_agent,signatureEvidence:JSON.parse(row.signature_evidence),
 classificationEvidence:JSON.parse(row.classification_evidence),vendorIpEvidence:JSON.parse(row.vendor_ip_evidence)});}
`;
const bundle = await build({ stdin: { contents: entry, resolveDir: process.cwd() }, bundle: true, write: false,
  format: 'esm', platform: 'browser', metafile: true, logLevel: 'silent' });
const code = bundle.outputFiles[0].text;
const sources = Object.keys(bundle.metafile.inputs).filter(file => file !== '<stdin>');
const sourceHashes = () => Object.fromEntries(sources.map(file => [file, hash(readFileSync(file))]));
const sourceSha256 = sourceHashes();
const api = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
const projectedReceipt = api.project(row);
assert.deepEqual(projectedReceipt, acknowledgement.source.receipt, 'D1 projection and acknowledged receipt differ');
assert.equal(projectedReceipt.signature.verifierProfile, '2026-10-31.3');
const node = await api.replay(input);
save('node-private.json', node);
assert.equal(node.result.status, 'verified'); assert.equal(node.result.agent, 'https://crawler.exa.ai');
assert.deepEqual(node.calls, [DIRECTORY]);
const storedEvidence = JSON.parse(row.signature_evidence);
assert.deepEqual(node.result.evidence.covered, storedEvidence.coverage.covered);
assert.deepEqual(node.result.evidence.selection, storedEvidence.coverage.selection);
let native = null;
if (option !== '--node-only') {
  const require = createRequire(resolve('package.json'));
  const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
  const mf = new Miniflare({ modules: true, script: code + '\nexport default {async fetch(request,env){return Response.json(await replay(env.INPUT));}};',
    compatibilityDate: '2026-03-06', cf: {}, bindings: { INPUT: input } });
  try { const response = await mf.dispatchFetch('https://offline-replay.invalid/'); assert.equal(response.status, 200); native = await response.json(); }
  finally { await mf.dispose(); }
  save('workerd-private.json', native);
  assert.deepEqual(native, node);
}
const manifestPath = 'packages/blog/drafts/research/analytics-retrospective/complete-audit-sources.json';
const manifest = read(manifestPath);
assert.equal(manifest.commit, '1de433d9a49fd608475c6054ab14a1652c088844');
for (const source of manifest.sourceFiles) assert.equal(hash(readFileSync(resolve(pythonSource, source.path))), source.sha256, source.path);
const dependencyVersions = JSON.parse(execFileSync(python, ['-c', 'import importlib.metadata,json; print(json.dumps({n:importlib.metadata.version(n) for n in ["cryptography","http-sf","cffi","typing_extensions","pycparser"]}))'], { encoding: 'utf8' }));
for (const dependency of manifest.dependencies) assert.equal(dependencyVersions[dependency.name], dependency.version, dependency.name);
const wrapper = 'packages/blog/drafts/research/analytics-retrospective/probe-pyauth-retained.py';
const referenceResult = JSON.parse(execFileSync(python, [wrapper, pythonSource, manifestPath], {
  input: JSON.stringify({ trials: [input] }), encoding: 'utf8', maxBuffer: 1024 * 1024, env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
}));
save('independent-reference.json', referenceResult);
assert.equal(referenceResult.sourceFilesRechecked, 18); assert.equal(referenceResult.referenceCalls, 1);
assert.equal(referenceResult.externalRequests, 0); assert.equal(referenceResult.rows[0].returnedResults, 1); assert.equal(referenceResult.rows[0].error, null);
assert.deepEqual(sourceHashes(), sourceSha256, 'Source changed during replay');
const summary = { checkedAt: new Date().toISOString(), kind: 'one-real-retained-proof',
  invocationRecords: 1, attemptRecords: 1, storedRecords: 1, exactRequestChain: true, exactOperationChain: true,
  exactReturnedRowProjection: true, receiptFieldsMatch: isDeepStrictEqual(projectedReceipt, acknowledgement.source.receipt),
  recordedClock: recordedAt.toISOString(), rowObservationSecond: row.observed_at, executionWorker: workerVersion,
  declaredClient: row.agent_name, storedKind: row.reader_kind, storedCollection: row.collection_version,
  storedClassifier: row.classifier_version, storedVerifier: projectedReceipt.signature.verifierProfile,
  replayVerifier: node.verifierProfile, untouchedRequestReplays: { node: node.result.status, localWorkerd: native?.result.status ?? 'not-run',
    independentRfc: 'verified', independentReturnedResults: 1 },
  signatureComponents: componentLists[0], covered: node.result.evidence.covered,
  validitySeconds: node.result.evidence.validitySeconds, ageSecondsAtRecordedClock: node.result.evidence.ageSeconds,
  native: projectedReceipt.native,
  directory: { url: DIRECTORY, responseStatus: 200, responseDate: capturedAt.toISOString(), keyCount: directory.keys.length,
    bodySha256: hash(directoryBytes), headersSha256: hash(readFileSync(directoryHeadersFile)), independentlyCapturedLater: true,
    originalResolverResponseReconstructed: false, directoryResponseSignatureVerified: false },
  independent: { repository: manifest.repository, commit: manifest.commit, sourceFilesRechecked: 18,
    dependencies: dependencyVersions, wrapperSha256: hash(readFileSync(wrapper)), manifestSha256: hash(readFileSync(manifestPath)),
    referenceClockSkewSeconds: referenceResult.rows[0].referenceClockSkewSeconds },
  inputSha256: { nativeChain: hash(readFileSync(chainFile)), dayRows: hash(readFileSync(dayFile)) }, sourceSha256,
  scriptSha256: hash(readFileSync(fileURLToPath(import.meta.url))), nodeVersion: process.version,
  replayNetworkCalls: 0, generatedSignatures: 0, counterfactualMutations: 0,
  limits: ['One real retained request, not a vendor-wide signing rate or a new controlled assistant attribution.',
    'Replayed at the recorded attempt time with a separately captured later public key response; original resolver contents are not reconstructed.',
    'Retained provider request representation is not a packet capture; successful replay establishes the supplied signed bytes and bound components.',
    'Unsigned User-Agent, method and path are not authenticated by the valid proof.',
    'Local and independent RFC verification are not a Cloudflare managed-verifier verdict or evidence of a human trigger.',
    'The directory HTTP response signature is retained but not independently verified in this incoming-request replay.'] };
writeFileSync(publicOutput, JSON.stringify(summary, null, 2) + '\n', { flag: 'wx', mode: 0o644 });
console.log(JSON.stringify({ exactCompleteChains: 1, receiptMatches: true, untouchedRequestReplays: summary.untouchedRequestReplays,
  covered: summary.covered, generatedSignatures: 0, counterfactualMutations: 0, replayNetworkCalls: 0 }));
