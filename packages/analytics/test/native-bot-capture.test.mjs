import assert from 'node:assert/strict';
import test from 'node:test';
import { handleNativeBotCapture, nativeBotCaptureInputs, NATIVE_CAPTURE_PREFIX, NATIVE_CAPTURE_HEADER } from '../.test-dist/native-bot-capture.js';
import { verificationEvidence } from '../.test-dist/signature-evidence.js';

const id = 'd56b2ede-a81f-47c2-b249-5db69f785c75';
const now = new Date('2026-10-28T12:00:00Z');
const config = { issuedAt: now.getTime() - 1000, expiresAt: now.getTime() + 600000,
  origins: ['https://publication.example'], controls: [{ id, condition: 'direct' }] };
const path = NATIVE_CAPTURE_PREFIX + '/' + id;
const request = (init = {}, suffix = '') => new Request('https://publication.example' + path + suffix, init);
function environment(marked = true) {
  const queries = [];
  return { queries, env: { ANALYTICS_HASH_KEY: 'synthetic-only', ANALYTICS_NATIVE_CAPTURE: JSON.stringify(config),
    DB: { prepare(sql) { queries.push(sql); assert.match(sql, /^SELECT 1 AS marked FROM owner_clients/); return {
      bind() { return { async first() { return marked ? { marked: 1 } : null; } }; },
    }; } },
  } };
}
async function quiet(fn) {
  const log = console.info, events = [];
  console.info = (...args) => events.push(args);
  try { return await fn(events); } finally { console.info = log; }
}

test('untrusted candidate states preserve coalesced ambiguity and cannot manufacture native verification', () => {
  for (const [value, expected] of [[null, 'missing'], ['true', 'literal-true'], ['false', 'literal-false'], ['', 'other'],
    ['TRUE', 'other'], ['1', 'other'], ['true, false', 'other'], ['true, true', 'other'], ['private-canary', 'other']]) {
    const headers = new Headers(); if (value !== null) headers.set(NATIVE_CAPTURE_HEADER, value);
    const req = request({ headers });
    const observed = nativeBotCaptureInputs(req);
    assert.equal(observed.candidate, expected);
    assert.equal(observed.candidateTrust, 'untrusted-header');
    assert.deepEqual(observed.native, { verifiedBot: 'unavailable', signedAgent: 'unavailable' });
    assert.deepEqual(verificationEvidence(req, { status: 'absent' }).native.verifiedBot, null);
    assert.equal(JSON.stringify(observed).includes('private-canary'), false);
  }
  const headers = new Headers(); headers.append(NATIVE_CAPTURE_HEADER, 'true'); headers.append(NATIVE_CAPTURE_HEADER, 'false');
  assert.equal(nativeBotCaptureInputs(request({ headers })).candidate, 'other');
});

test('synthetic native booleans, unavailable fields and malformed containers remain independent of the header', () => {
  for (const [cf, expected] of [[undefined, ['unavailable', 'unavailable']], [null, ['unavailable', 'unavailable']],
    ['malformed', ['unrecognized', 'unrecognized']], [{ botManagement: [] }, ['unrecognized', 'unrecognized']],
    [{ botManagement: null }, ['unavailable', 'unavailable']], [{ botManagement: { verifiedBot: true, signedAgent: false } }, ['true', 'false']],
    [{ botManagement: { verifiedBot: 'true', signedAgent: 1 } }, ['unrecognized', 'unrecognized']],
    [{ botManagement: { signedAgent: true } }, ['unavailable', 'true']]]) {
    const req = request({ headers: { [NATIVE_CAPTURE_HEADER]: 'false' } }); Object.defineProperty(req, 'cf', { value: cf });
    const observed = nativeBotCaptureInputs(req);
    assert.deepEqual([observed.native.verifiedBot, observed.native.signedAgent], expected);
    assert.equal(observed.candidate, 'literal-false');
  }
});

test('inactive, malformed, future, expired, duplicate and excessive configurations fail before owner lookup', async () => {
  const invalid = [undefined, 'invalid', JSON.stringify([]), 'x'.repeat(8193),
    ...[{ issuedAt: now.getTime() + 1 }, { expiresAt: now.getTime() }, { expiresAt: config.issuedAt + 900001 },
      { expiresAt: 1.5 }, { origins: [] }, { origins: ['http://publication.example'] },
      { origins: ['https://publication.example/'] }, { origins: ['https://a:b@publication.example'] },
      { origins: ['https://publication.example', 'https://publication.example'] },
      { controls: [] }, { controls: [config.controls[0], config.controls[0]] },
      { controls: [{ id, condition: 'human' }] }, { controls: [{ id: 'not-uuid', condition: 'direct' }] },
      { origins: Array.from({ length: 5 }, (_, index) => `https://p${index}.example`) },
      { controls: Array.from({ length: 33 }, () => ({ id: crypto.randomUUID(), condition: 'direct' })) }].map(part => JSON.stringify({ ...config, ...part }))];
  for (const raw of invalid) {
    const { env, queries } = environment(); env.ANALYTICS_NATIVE_CAPTURE = raw;
    assert.equal((await handleNativeBotCapture(request(), env, () => now)).status, 404);
    assert.equal(queries.length, 0);
  }
  const { env, queries } = environment();
  assert.equal((await handleNativeBotCapture(request(), env, () => new Date('invalid'))).status, 404);
  assert.equal(queries.length, 0);
});

test('origin, path, query and method guards cannot fall through to collection', async () => {
  for (const [req, status] of [[request({}, '/extra'), 404], [request({}, '?x=1'), 404],
    [new Request('https://different.example' + path), 404], [request({ method: 'POST', body: '1' }), 405],
    [request({ headers: { Origin: 'https://different.example' } }), 403]]) {
    const { env, queries } = environment(); const result = await handleNativeBotCapture(req, env, () => now);
    assert.equal(result.status, status); assert.equal(queries.length, 0);
    assert.equal(result.headers.get('Cache-Control'), 'no-store');
    if (status === 405) assert.equal(result.headers.get('Allow'), 'GET');
  }
});

test('marked capture is read-only with exact closed response/log join; unmarked is denied', async () => quiet(async events => {
  const { env, queries } = environment();
  env.ANALYTICS_NATIVE_CAPTURE = JSON.stringify({ ...config,
    origins: [...config.origins, 'https://p1.example', 'https://p2.example', 'https://p3.example'],
    controls: [...config.controls, ...Array.from({ length: 31 }, () => ({ id: crypto.randomUUID(), condition: 'direct' }))] });
  const result = await handleNativeBotCapture(request({ headers: { [NATIVE_CAPTURE_HEADER]: 'private-canary', 'User-Agent': 'private-ua-canary', 'CF-Connecting-IP': '192.0.2.99' } }), env, () => now);
  assert.equal(result.status, 200); const body = await result.json();
  assert.equal(body.plannedCondition, 'direct'); assert.equal(body.candidate, 'other');
  assert.equal(queries.length, 1); assert.equal(events.length, 1);
  assert.equal(events[0][0], 'analytics.native_bot_capture'); assert.deepEqual(events[0][1], body);
  for (const canary of ['private-canary', 'private-ua-canary', '192.0.2.99', 'synthetic-only']) assert.equal(JSON.stringify(body).includes(canary), false);
  assert.equal(result.headers.get('Access-Control-Allow-Origin'), null);
  const denied = environment(false);
  assert.equal((await handleNativeBotCapture(request(), denied.env, () => now)).status, 403);
  assert.equal(events.length, 1);
}));

test('expiry during owner lookup, backward clock and midnight boundary cannot emit a capture', async () => quiet(async events => {
  for (const [start, finish] of [[now, new Date(config.expiresAt)], [now, new Date(now.getTime() - 1)],
    [new Date('2026-10-28T23:59:59.999Z'), new Date('2026-10-29T00:00:00.000Z')]]) {
    const { env } = environment();
    env.ANALYTICS_NATIVE_CAPTURE = JSON.stringify({ ...config, issuedAt: start.getTime() - 1000, expiresAt: start.getTime() + 600000 });
    let calls = 0; const result = await handleNativeBotCapture(request(), env, () => calls++ === 0 ? start : finish);
    assert.equal(result.status, 404);
  }
  assert.equal(events.length, 0);
}));

test('owner storage rejection and stalled lookup have distinct closed, exactly joined unavailable results', async () => quiet(async events => {
  for (const stalled of [false, true]) {
    const { env } = environment();
    env.DB = { prepare() { return { bind() { return { first() { return stalled ? new Promise(() => {}) : Promise.reject(Error('private-db-canary')); } }; } }; } };
    const result = await handleNativeBotCapture(request(), env, () => now);
    assert.equal(result.status, 503); const body = await result.json();
    assert.equal(body.profile, 'native-bot-capture-unavailable-v1');
    assert.equal(body.reason, stalled ? 'owner-check-timeout' : 'owner-check-error');
    assert.equal(body.outcome, 'unavailable'); assert.equal(body.controlId, id);
    assert.deepEqual(events.at(-1), ['analytics.native_bot_capture_unavailable', body]);
    assert.equal(JSON.stringify(body).includes('private-db-canary'), false);
    assert.equal(result.headers.get('Cache-Control'), 'no-store');
    assert.deepEqual(Object.keys(body).sort(), ['controlId', 'outcome', 'plannedCondition', 'profile', 'reason', 'responseId', 'startedAt']);
  }
  assert.equal(events.length, 2);
}));

test('late owner success or rejection cannot change a deadline result or emit a capture', async () => quiet(async events => {
  for (const reject of [false, true]) {
    const { env } = environment(); let settle;
    const pending = new Promise((resolve, fail) => { settle = reject ? fail : resolve; });
    env.DB = { prepare() { return { bind() { return { first() { return pending; } }; } }; } };
    const result = await handleNativeBotCapture(request(), env, () => now);
    const body = await result.json(); assert.equal(body.reason, 'owner-check-timeout');
    const count = events.length;
    settle(reject ? Error('private-late-canary') : { marked: 1 });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(events.length, count); assert.equal(result.status, 503);
  }
  assert.equal(events.filter(event => event[0] === 'analytics.native_bot_capture').length, 0);
}));

test('post-guard failure remains distinct and logger failure preserves a closed response', async () => quiet(async events => {
  const { env } = environment(); let calls = 0;
  const result = await handleNativeBotCapture(request(), env, () => {
    if (calls++ === 0) return now;
    throw Error('private-clock-canary');
  });
  const body = await result.json(); assert.equal(body.reason, 'capture-error');
  assert.deepEqual(events[0], ['analytics.native_bot_capture_unavailable', body]);
  const original = console.info;
  try {
    console.info = () => { throw Error('private-logger-canary'); };
    const failedLog = await handleNativeBotCapture(request(), env, () => now);
    const failedBody = await failedLog.json();
    assert.equal(failedLog.status, 503); assert.equal(failedBody.reason, 'capture-error');
    assert.equal(JSON.stringify(failedBody).includes('private-logger-canary'), false);
  } finally { console.info = original; }
}));

test('expiry still closes failed owner checks before emitting diagnostics', async () => quiet(async events => {
  const { env } = environment(); let calls = 0;
  env.DB = { prepare() { throw Error('private-db-canary'); } };
  const result = await handleNativeBotCapture(request(), env, () => calls++ === 0 ? now : new Date(config.expiresAt));
  assert.equal(result.status, 404); assert.deepEqual(await result.json(), {});
  assert.equal(events.length, 0);
}));

test('response-ID failure closes before owner lookup and remains unjoined unavailable', async () => quiet(async events => {
  const original = crypto.randomUUID; const { env, queries } = environment();
  try {
    crypto.randomUUID = () => { throw Error('private-id-canary'); };
    const result = await handleNativeBotCapture(request(), env, () => now);
    assert.equal(result.status, 503); assert.deepEqual(await result.json(), {});
    assert.equal(queries.length, 0); assert.equal(events.length, 0);
  } finally { crypto.randomUUID = original; }
}));
