import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';
import { validateUnavailable, summarize, preparePlan } from './run-native-bot-capture.mjs';

const output = process.argv[2];
assert.ok(output, 'Provide a new aggregate receipt path');
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const plan = preparePlan(), control = plan.controls.find(item => item.phase === 'dynamic');
// Deliberate fault injection in workerd, separate from the composed Worker/D1 run.
const source = `
import { handleNativeBotCapture } from './native-bot-capture.js';
export default { async fetch(request) {
  const mode = request.headers.get('x-fixture-mode');
  const now = new Date(); let clocks = 0;
  const config = { issuedAt: now.getTime() - 1000, expiresAt: now.getTime() + 60000,
    origins: [new URL(request.url).origin], controls: [{ id: ${JSON.stringify(control.id)}, condition: ${JSON.stringify(control.condition)} }] };
  const events = [], info = console.info;
  console.info = (...args) => { if (mode === 'logger-error') throw Error('private-logger-canary'); events.push(args); };
  const env = { ANALYTICS_NATIVE_CAPTURE: JSON.stringify(config), ANALYTICS_HASH_KEY: 'synthetic-only',
    DB: { prepare() { return { bind() { return { first() {
      if (mode === 'owner-error') return Promise.reject(Error('private-storage-canary'));
      if (mode === 'owner-timeout') return new Promise(() => {});
      return Promise.resolve({ marked: 1 });
    } }; } }; } } };
  try {
    const result = await handleNativeBotCapture(request, env, () => {
      if (clocks++ === 0) return now;
      if (mode === 'clock-error') throw Error('private-clock-canary');
      if (mode === 'expired') return new Date(config.expiresAt);
      return now;
    });
    return Response.json({ status: result.status, cache: result.headers.get('Cache-Control'), body: await result.json(), events });
  } finally { console.info = info; }
} };`;
const bundle = await build({ stdin: { contents: source, loader: 'js', resolveDir: resolve('packages/analytics/src') },
  bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {} });
const conditions = [], ids = new Set();
try {
  for (const [mode, reason] of [['owner-error', 'owner-check-error'], ['owner-timeout', 'owner-check-timeout'],
    ['clock-error', 'capture-error'], ['logger-error', 'capture-error'], ['expired', null]]) {
    const result = await (await mf.dispatchFetch(plan.origin + '/api/analytics-native-capture/' + control.id,
      { headers: { 'x-fixture-mode': mode, 'User-Agent': 'private-ua-canary', 'CF-Connecting-IP': '192.0.2.99' } })).json();
    assert.equal(result.cache, 'no-store');
    if (reason === null) {
      assert.equal(result.status, 404); assert.deepEqual(result.body, {}); assert.deepEqual(result.events, []);
    } else {
      assert.equal(result.status, 503); assert.equal(validateUnavailable(result.body, control), true);
      assert.equal(result.body.reason, reason); assert.equal(ids.has(result.body.responseId), false); ids.add(result.body.responseId);
      const logs = result.events.filter(event => event[0] === 'analytics.native_bot_capture_unavailable').map(event => event[1]);
      const summary = summarize(plan, [{ id: control.id, status: 503, body: result.body }], [], logs);
      assert.equal(summary.validCaptures, 0); assert.equal(summary.validUnavailableResponses, 1);
      assert.equal(summary.exactUnavailableLogJoins, mode === 'logger-error' ? 0 : 1);
      if (mode === 'logger-error') assert.deepEqual(result.events, []);
      else assert.deepEqual(result.events, [['analytics.native_bot_capture_unavailable', result.body]]);
      for (const canary of ['private-', '192.0.2.99', 'synthetic-only']) assert.equal(JSON.stringify(result).includes(canary), false);
    }
    conditions.push({ mode, status: result.status, reason, exactLogJoins: reason === null || mode === 'logger-error' ? 0 : 1 });
  }
  const files = ['packages/analytics/src/native-bot-capture.ts', 'packages/analytics/src/owner.ts',
    'packages/blog/scripts/check-native-capture-failures.mjs', 'packages/blog/scripts/run-native-bot-capture.mjs'];
  const receipt = { checkedAt: new Date().toISOString(), runtime: process.version,
    environment: 'Local workerd; actual handler with deliberately injected owner/clock/logger faults; no native D1 faults here',
    conditions, checks: { reasonsClosed: true, noRawCanaries: true, exactAvailableLogJoins: true, loggerFailurePreservesResponse: true,
      expiryRejectsBeforeDiagnostics: true, successfulCaptures: 0 },
    sourceSha256: Object.fromEntries(files.map(file => [file, createHash('sha256').update(readFileSync(file)).digest('hex')])),
    productionCalls: 0, humanLabels: 0,
    limits: ['Controlled failures establish instrument behavior, not production prevalence or the cause of the historical 503',
      'The deadline does not cancel underlying owner work; native D1 rejection is tested separately by the composed Worker harness'] };
  writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ conditions: conditions.length, checks: receipt.checks }));
} finally { await mf.dispose(); }
