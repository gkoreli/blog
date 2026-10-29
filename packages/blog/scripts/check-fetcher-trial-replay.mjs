import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { reconcileFetcherTrials } from './fetcher-trial-ledger.mjs';
import { extractRequestMetadata } from '../../analytics/.test-dist/metadata.js';
import { analyzeTraffic } from '../../analytics/.test-dist/classify.js';
import { classifyReaderKind } from '../../analytics/.test-dist/readerkind.js';
import { classificationEvidence } from '../../analytics/.test-dist/classification-evidence.js';
import { verificationEvidence } from '../../analytics/.test-dist/signature-evidence.js';
import { DEFAULT_OPERATOR_POLICY } from '../../analytics/.test-dist/calibration-evaluation.js';
import { CLASSIFIER_VERSION } from '../../analytics/.test-dist/versions.js';

const [inputRoot, output] = process.argv.slice(2); assert.ok(output);
const bytes = file => readFileSync(resolve(inputRoot, file));
const load = file => JSON.parse(bytes(file));
const hash = value => createHash('sha256').update(value).digest('hex');
const plan = load('plan.json'), executions = load('executions.json'), terminal = load('tail-terminal.json');
assert.deepEqual(terminal.ownedGroupMembersRemaining, []);
const raw = bytes('tail.jsonstream').toString('utf8');
const events = []; let position = 0;
// Wrangler emits concatenated pretty JSON objects, not JSONL. Require a complete stream.
while (position < raw.length) {
  while (/\s/.test(raw[position] ?? '') && position < raw.length) position++;
  if (position === raw.length) break;
  let depth = 0, quoted = false, escaped = false, end = position;
  assert.equal(raw[position], '{');
  for (; end < raw.length; end++) {
    const char = raw[end];
    if (quoted) { if (escaped) escaped = false; else if (char === '\\') escaped = true; else if (char === '"') quoted = false; }
    else if (char === '"') quoted = true;
    else if (char === '{' || char === '[') depth++;
    else if (char === '}' || char === ']') { depth--; if (depth === 0) { end++; break; } }
  }
  assert.equal(depth, 0, 'Partial native capture');
  events.push(JSON.parse(raw.slice(position, end))); position = end;
}
const ledger = reconcileFetcherTrials(plan, executions, events);

function inspect(captured) {
  const row = captured.event.request;
  const request = new Request(row.url, { method: row.method, headers: row.headers });
  Object.defineProperty(request, 'cf', { value: row.cf });
  const metadata = extractRequestMetadata(request);
  const analysis = analyzeTraffic(metadata.userAgent);
  // Signed contexts require the separate explicit-key replay path. Never turn
  // an unassessed proof into absent verification to obtain a convenient kind.
  if (metadata.hasSignatureHeaders) return { assessment: 'not-assessed', reason: 'explicit-signature-replay-required', declarations: analysis.declarations };
  const signature = { status: 'absent' };
  const facts = { ...metadata, ...analysis, observationSource: 'edge', signature };
  const reader = classifyReaderKind(facts);
  const verification = verificationEvidence(request, signature, false, analysis.declarations.candidates);
  return { assessment: 'classified', classifierProfile: CLASSIFIER_VERSION, declarations: analysis.declarations, reader,
    classification: classificationEvidence(facts, analysis.declarations),
    native: verification.native, signatureAssessment: 'absent',
    operatorPrediction: DEFAULT_OPERATOR_POLICY.predict(reader.kind) };
}
const worker = await build({ stdin: { resolveDir: process.cwd(), contents: `
 import{extractRequestMetadata}from'./packages/analytics/src/metadata.ts';
 import{analyzeTraffic}from'./packages/analytics/src/classify.ts';
 import{classifyReaderKind}from'./packages/analytics/src/readerkind.ts';
 import{classificationEvidence}from'./packages/analytics/src/classification-evidence.ts';
 import{verificationEvidence}from'./packages/analytics/src/signature-evidence.ts';
 import{DEFAULT_OPERATOR_POLICY}from'./packages/analytics/src/calibration-evaluation.ts';
 import{CLASSIFIER_VERSION}from'./packages/analytics/src/versions.ts';
 const inspect=${inspect.toString()};export default{async fetch(request){return Response.json(inspect(await request.json()));}};
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script: worker.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {} });
try {
  const measurements = [];
  const syntheticControls = [];
  for (const [index, measurement] of ledger.measurements.entries()) {
    const predictions = [];
    for (const event of measurement.events) {
      assert.equal(event.logs.some(log => String(log.message?.[0] ?? '').startsWith('analytics.observation')), false);
      const node = inspect(event);
      const response = await mf.dispatchFetch('https://offline.invalid/replay', { method: 'POST', body: JSON.stringify(event) });
      assert.equal(response.status, 200); assert.deepEqual(await response.json(), node);
      predictions.push(node);
      for (const condition of ['unassessed-signature', 'missing-network']) {
        const changed = structuredClone(event);
        if (condition === 'unassessed-signature') changed.event.request.headers['signature-agent'] = '"https://fixture.example"';
        else delete changed.event.request.cf;
        const expected = inspect(changed);
        const control = await mf.dispatchFetch('https://offline.invalid/control', { method: 'POST', body: JSON.stringify(changed) });
        assert.equal(control.status, 200); assert.deepEqual(await control.json(), expected);
        if (condition === 'unassessed-signature') assert.equal(expected.assessment, 'not-assessed');
        else { assert.equal(expected.reader.kind, 'unresolved'); assert.equal(expected.reader.reason, 'network-evidence-missing'); }
        syntheticControls.push({ condition, result: expected, scope: 'Modified context only; excluded from actual automation denominator' });
      }
    }
    measurements.push({ ordinal: index + 1, operator: plan.trials[index].operator, status: measurement.status,
      matchedRequests: measurement.events.length, duplicateCopies: measurement.duplicateCopies, predictions });
  }
  const evaluated = measurements.flatMap(row => row.predictions).filter(row => row.assessment === 'classified');
  const abstentions = evaluated.filter(row => row.operatorPrediction === 'abstain').length;
  const receipt = { checkedAt: new Date().toISOString(), sourceBaseline: 'e623964', capturedWorkerVersion: plan.workerVersion, classifierProfile: CLASSIFIER_VERSION,
    scope: 'Fresh exact captured metadata replay; original owner page is excluded before collection, not a production observation or end-to-end persistence measurement',
    planned: ledger.planned, executed: ledger.executed, matchedTrials: measurements.filter(row => row.status === 'matched').length,
    trialsWithoutAcceptedMeasurement: measurements.filter(row => row.status !== 'matched').length,
    labeledAutomationRequestsEvaluated: evaluated.length, operatorAbstentions: abstentions,
    committedOperatorDecisions: evaluated.length - abstentions,
    errorAmongOperatorDecisions: evaluated.length === abstentions ? null : evaluated.filter(row => row.operatorPrediction === 'human').length / (evaluated.length - abstentions),
    humanLabels: 0, humanFalsePositiveRate: null, populationAccuracyClaimed: false, productionObservationWritten: false,
    measurements, syntheticControls, inputHashes: Object.fromEntries(['plan.json', 'executions.json', 'tail.jsonstream', 'tail-terminal.json'].map(file => [file, hash(bytes(file))])),
    sourceHashes: Object.fromEntries(['packages/blog/scripts/fetcher-trial-ledger.mjs', 'packages/blog/scripts/check-fetcher-trial-replay.mjs', 'packages/analytics/src/classify.ts', 'packages/analytics/src/readerkind.ts', 'packages/analytics/src/metadata.ts', 'packages/analytics/src/versions.ts'].map(file => [file, hash(readFileSync(file))])),
    limits: ['No accepted capture is not proof of no request.', 'Metadata replay does not independently identify an engine, device, person or intent.', 'Missing signed contexts require explicit verification; no implicit resolver or absent-verification substitution.', 'Cases with no accepted measurement remain outside classifier abstention/error denominators.'] };
  writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ executed: receipt.executed, matchedTrials: receipt.matchedTrials, evaluatedAutomationRequests: evaluated.length, abstentions, committedDecisions: receipt.committedOperatorDecisions }));
} finally { await mf.dispose(); }
