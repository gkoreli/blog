import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { validateUnavailable } from './run-native-bot-capture.mjs';

// Run from repository root. The private file contains synthetic control IDs only;
// neither output is an actual Cloudflare Transform Rule/managed-verifier test.
const output = process.argv[2];
assert.ok(output, 'Provide a new aggregate receipt path');
const req = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(req.resolve('miniflare', { paths: [dirname(req.resolve('wrangler/package.json'))] })));
const compiled = await build({ entryPoints: ['packages/blog/src/worker/index.ts'], bundle: true, write: false,
  format: 'esm', platform: 'browser', external: ['cloudflare:workers'], logLevel: 'silent' });
assert.equal(compiled.outputFiles.length, 1);
const origin = 'https://publication.example', id = randomUUID(), token = 'd'.repeat(64);
const issuedAt = Date.now() - 1000, expiresAt = Date.now() + 600000;
const config = { issuedAt, expiresAt, origins: [origin], controls: [{ id, condition: 'direct' }] };
// `cf: false` still supplies Miniflare's fallback, including verifiedBot=false.
// An explicit object prevents cached/fetched metadata and makes absence deliberate.
const options = { modules: true, script: compiled.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {},
  d1Databases: { DB: 'native-bot-capture' }, bindings: { ANALYTICS_HASH_KEY: 'synthetic-only',
    OWNER_MARK_GRANT: JSON.stringify({ token, issuedAt, expiresAt }), ANALYTICS_NATIVE_CAPTURE: JSON.stringify(config) } };
const mf = new Miniflare(options), results = [], privateResponses = [];
const path = '/api/analytics-native-capture/' + id;
const call = (pathname = path, init = {}) => mf.dispatchFetch(origin + pathname, { ...init,
  headers: { 'User-Agent': 'private-ua-canary', 'CF-Connecting-IP': '192.0.2.99', ...init.headers } });
try {
  const db = await mf.getD1Database('DB');
  const schema = readFileSync('packages/analytics/schema.sql', 'utf8').replace(/^\s*--.*$/gm, '');
  await db.batch(schema.split(';').map(sql => sql.trim()).filter(Boolean).map(sql => db.prepare(sql)));
  await db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,observed_at) VALUES('/historical','00000000000000000000000000000000','browser','desktop',0,'2026-01-01 00:00:00')").run();
  const before = await db.prepare('SELECT COUNT(*) AS n FROM page_observations').first();
  async function check(name, requestPath, init, status, candidate) {
    const response = await call(requestPath, init);
    assert.equal(response.status, status, name);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.match(response.headers.get('Content-Type'), /^application\/json/);
    const body = await response.json();
    if (candidate) {
      assert.equal(body.candidate, candidate, name);
      assert.equal(body.candidateTrust, 'untrusted-header');
      assert.deepEqual(body.native, { verifiedBot: 'unavailable', signedAgent: 'unavailable' });
      assert.equal(body.controlId, id); assert.equal(body.plannedCondition, 'direct');
      assert.equal(body.profile, 'native-bot-capture-v1');
      assert.ok(typeof body.responseId === 'string');
      for (const value of ['private-ua-canary', '192.0.2.99', 'synthetic-only', 'private-header-canary']) assert.equal(JSON.stringify(body).includes(value), false);
      privateResponses.push(body);
    } else if (status === 503) {
      assert.equal(validateUnavailable(body, { id, condition: 'direct' }), true);
      assert.equal(body.reason, 'owner-check-error');
      for (const value of ['owner_clients', 'private-ua-canary', '192.0.2.99', 'synthetic-only']) assert.equal(JSON.stringify(body).includes(value), false);
    } else assert.deepEqual(body, {});
    results.push({ condition: name, status, ...(candidate ? { candidate, native: body.native } : status === 503 ? { unavailableReason: body.reason } : {}) });
  }
  await check('unmarked', path, {}, 403);
  assert.equal((await call('/api/owner', { method: 'POST', headers: { Authorization: 'Bearer ' + token } })).status, 200);
  await check('missing-candidate', path, {}, 200, 'missing');
  for (const [value, state] of [['true', 'literal-true'], ['false', 'literal-false'], ['private-header-canary', 'other'], ['true, false', 'other'], ['false, true', 'other'], ['true, true', 'other']]) {
    await check('supplied-' + state + '-' + results.length, path, { headers: { 'x-gk-native-bot-candidate': value } }, 200, state);
  }
  await check('cross-origin', path, { headers: { Origin: 'https://other.example' } }, 403);
  await check('post', path, { method: 'POST', body: '1' }, 405);
  await check('query', path + '?private=canary', {}, 404);
  await check('unknown-control', '/api/analytics-native-capture/' + randomUUID(), {}, 404);
  await check('extra-segment', path + '/extra', {}, 404);
  await check('bare-prefix', '/api/analytics-native-capture', {}, 404);
  for (const [name, raw] of [['off', undefined], ['expired', JSON.stringify({ ...config, issuedAt: issuedAt - 700000, expiresAt: Date.now() - 1 })],
    ['future', JSON.stringify({ ...config, issuedAt: expiresAt, expiresAt: expiresAt + 1000 })], ['malformed', 'not-json']]) {
    const bindings = { ...options.bindings }; delete bindings.ANALYTICS_NATIVE_CAPTURE;
    if (raw !== undefined) bindings.ANALYTICS_NATIVE_CAPTURE = raw;
    await mf.setOptions({ ...options, bindings });
    await check(name, path, { headers: { 'x-gk-native-bot-candidate': 'true' } }, 404);
  }
  await mf.setOptions(options);
  const currentDb = await mf.getD1Database('DB');
  await currentDb.prepare('DELETE FROM owner_clients').run();
  await check('mark-removed', path, {}, 403);
  await currentDb.prepare('DROP TABLE owner_clients').run();
  await check('guard-storage-unavailable', path, {}, 503);
  assert.equal((await currentDb.prepare('SELECT COUNT(*) AS n FROM page_observations').first()).n, before.n);
  assert.equal((await currentDb.prepare('SELECT COUNT(*) AS n FROM page_observation_diagnostics').first()).n, 0);
  assert.equal((await currentDb.prepare('SELECT COUNT(*) AS n FROM analytics_calibration_trials').first()).n, 0);
  assert.equal(new Set(privateResponses.map(body => body.responseId)).size, privateResponses.length);
  const metadataBundle = await build({ stdin: { contents: `import {nativeBotCaptureInputs} from './native-bot-capture.js'; export default {fetch(request){return Response.json(nativeBotCaptureInputs(request));}}`,
    loader: 'js', resolveDir: resolve('packages/analytics/src') }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
  const metadataFixtureControls = [];
  for (const [name, cf, expected] of [['explicit-empty', {}, { verifiedBot: 'unavailable', signedAgent: 'unavailable' }],
    ['fetch-disabled-fallback', false, { verifiedBot: 'false', signedAgent: 'unavailable' }],
    ['explicit-positive-fixture', { botManagement: { verifiedBot: true, signedAgent: false } }, { verifiedBot: 'true', signedAgent: 'false' }]]) {
    const fixture = new Miniflare({ modules: true, script: metadataBundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf });
    try {
      const result = await (await fixture.dispatchFetch(origin + '/')).json();
      assert.deepEqual(result.native, expected, name);
      metadataFixtureControls.push({ fixture: name, native: result.native, providerVerdict: false });
    } finally { await fixture.dispose(); }
  }
  const sources = ['packages/analytics/src/native-bot-capture.ts', 'packages/analytics/src/owner.ts', 'packages/analytics/src/calibration.ts',
    'packages/analytics/src/index.ts', 'packages/analytics/src/db.ts', 'packages/blog/src/worker/index.ts',
    'packages/blog/scripts/check-native-bot-capture.mjs', 'packages/blog/scripts/run-native-bot-capture.mjs'];
  const receipt = { checkedAt: new Date().toISOString(), runtime: process.version,
    environment: 'Actual composed blog Worker in local workerd with native D1; supplied synthetic HTTP controls',
    conditions: results, successfulCaptures: privateResponses.length, metadataFixtureControls,
    checks: { exactWorkerRouting: true, noAssetBindingRequired: true, unchangedObservationCount: true, zeroDiagnosticRows: true,
      zeroCalibrationRows: true, ownerGuard: true, expiryOffAndMalformed: true, privateResponseIdsUnique: true, closedPayloadCanariesAbsent: true,
      explicitEmptyCfFixture: true },
    limits: ['No Cloudflare Transform Rule execution or provider verification', 'Combined values are single HTTP header values here; wire duplicates need a live curl harness',
      'No native-positive or human labels', '32-control configuration cap is not a global admission counter; repeat controls remain possible',
      'Owner marking/setup/deletion are fixture writes; diagnostic route performs only owner lookup'],
    bundleSha256: createHash('sha256').update(compiled.outputFiles[0].contents).digest('hex'),
    sourceSha256: Object.fromEntries(sources.map(file => [file, createHash('sha256').update(readFileSync(file)).digest('hex')])), productionCalls: 0 };
  writeFileSync(output + '.private.json', JSON.stringify({ config, captures: privateResponses }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ conditions: results.length, successfulCaptures: privateResponses.length, checks: receipt.checks }));
} finally { await mf.dispose(); }
