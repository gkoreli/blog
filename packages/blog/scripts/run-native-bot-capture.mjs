import assert from 'node:assert/strict';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';

const ORIGIN = 'https://gkoreli.com';
const HEADER = 'x-gk-native-bot-candidate';
const PREFIX = '/api/analytics-native-capture/';
const UA = 'gk-native-capture-controlled-v1/1.0';
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const record = value => typeof value === 'object' && value !== null && !Array.isArray(value);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const load = path => JSON.parse(readFileSync(path, 'utf8'));
const save = (path, value, exclusive = false) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n', { mode: 0o600, flag: exclusive ? 'wx' : 'w' });
const ruleFilter = (ids, issuedAt, expiresAt) => `(http.host eq "gkoreli.com" and http.request.uri.path in {${ids.map(id => JSON.stringify(PREFIX + id)).join(' ')}} and http.request.timestamp.sec ge ${issuedAt / 1000} and http.request.timestamp.sec lt ${expiresAt / 1000})`;

export function preparePlan(now = Date.now()) {
  assert.ok(Number.isSafeInteger(now));
  const controls = [];
  const add = (phase, condition, values, expected) => controls.push({ id: randomUUID(), phase, condition, values, expected });
  add('unmarked', 'direct', [], 'denied');
  const shapes = [[], ['true'], ['false'], ['capture-malformed'], ['true', 'false'], ['false', 'true'], ['true', 'true']];
  for (const values of shapes) add('absent', values.length > 1 ? 'spoof-duplicate' : values.length ? 'spoof-single' : 'direct', values,
    values.length === 0 ? 'missing' : values.length === 1 && values[0] === 'true' ? 'literal-true' : values.length === 1 && values[0] === 'false' ? 'literal-false' : 'other');
  for (const values of shapes) add('dynamic', values.length > 1 ? 'spoof-duplicate' : values.length ? 'spoof-single' : 'direct', values, 'boolean-shape');
  for (const values of [['true'], ['capture-malformed']]) add('disabled', 'rule-disabled', values, values[0] === 'true' ? 'literal-true' : 'other');
  for (const values of [[], ['true']]) add('overwrite', 'later-overwrite', values, 'other');
  for (const values of [['true'], []]) add('rule-expired', 'rule-expired', values, values.length ? 'literal-true' : 'missing');
  for (const values of [['true'], []]) add('receiver-expired', 'rule-expired', values, 'expired');
  const issuedAt = Math.floor(now / 1000) * 1000, ruleExpiresAt = issuedAt + 4 * 60_000, expiresAt = issuedAt + 8 * 60_000;
  return { version: 'native-capture-controller-v4', origin: ORIGIN, issuedAt, ruleExpiresAt, expiresAt, maximumAttempts: 32,
    controls, ruleExpression: ruleFilter(controls.map(control => control.id), issuedAt, ruleExpiresAt),
    overwriteExpression: ruleFilter(controls.filter(control => control.phase === 'overwrite').map(control => control.id), issuedAt, ruleExpiresAt),
    tailTag: randomBytes(16).toString('hex'), expectedCandidateTrust: 'untrusted-header', operator: 'controlled-curl', humanLabels: 0 };
}

/** Only the unisolated boundary: same supplied shapes, enabled then disabled before expiry. */
export function prepareDisabledPlan(now = Date.now()) {
  const { overwriteExpression, ...base } = preparePlan(now);
  const controls = base.controls.filter(control => control.phase === 'disabled'
    || control.phase === 'dynamic' && control.values.length === 1 && ['true', 'capture-malformed'].includes(control.values[0]));
  const ruleExpiresAt = base.issuedAt + 7 * 60_000;
  return { ...base, experiment: 'disabled-before-expiry-v1', controls, maximumAttempts: 4, ruleExpiresAt,
    ruleExpression: ruleFilter(controls.map(control => control.id), base.issuedAt, ruleExpiresAt) };
}

export function validateCapture(body, control) {
  if (!record(body) || body.profile !== 'native-bot-capture-v1' || body.controlId !== control.id
    || body.plannedCondition !== control.condition || !UUID.test(body.responseId ?? '')
    || body.candidateTrust !== 'untrusted-header' || body.nativeSource !== 'request.cf'
    || !['missing', 'literal-true', 'literal-false', 'other'].includes(body.candidate)
    || !record(body.native) || !['true', 'false', 'unavailable', 'unrecognized'].includes(body.native.verifiedBot)
    || !['true', 'false', 'unavailable', 'unrecognized'].includes(body.native.signedAgent)
    || typeof body.observedAt !== 'string' || !Number.isFinite(Date.parse(body.observedAt))) return false;
  return Object.keys(body).sort().join(',') === 'candidate,candidateTrust,controlId,native,nativeSource,observedAt,plannedCondition,profile,responseId'
    && Object.keys(body.native).sort().join(',') === 'signedAgent,verifiedBot';
}

export function validateUnavailable(body, control) {
  return record(body) && body.profile === 'native-bot-capture-unavailable-v1'
    && body.controlId === control.id && body.plannedCondition === control.condition
    && typeof body.responseId === 'string' && UUID.test(body.responseId)
    && body.outcome === 'unavailable' && ['owner-check-timeout', 'owner-check-error', 'capture-error'].includes(body.reason)
    && typeof body.startedAt === 'string' && Number.isFinite(Date.parse(body.startedAt))
    && Object.keys(body).sort().join(',') === 'controlId,outcome,plannedCondition,profile,reason,responseId,startedAt';
}

export function assertPhaseWindow(plan, phase, now = Date.now()) {
  assert.ok(plan.controls.some(control => control.phase === phase), 'Unknown phase');
  assert.ok(now >= plan.issuedAt, 'Not yet issued');
  if (phase === 'receiver-expired') assert.ok(now >= plan.expiresAt + 1000, 'Receiver not expired');
  else assert.ok(now < plan.expiresAt - 1000, 'Receiver expired or near boundary');
  if (phase === 'rule-expired') assert.ok(now >= plan.ruleExpiresAt + 1000, 'Rule not expired');
  // Disabling must be tested while the time predicate would otherwise match.
  if (['dynamic', 'overwrite', 'disabled'].includes(phase)) assert.ok(now < plan.ruleExpiresAt - 5000, 'Rule expired or near boundary');
}

export function summarize(plan, ledger, logCaptures = [], logUnavailable = []) {
  const controls = new Map(plan.controls.map(control => [control.id, control]));
  assert.equal(controls.size, plan.controls.length);
  const seen = new Set();
  const result = { planned: plan.controls.length, attempted: ledger.length, received: 0, captureResponses: 0,
    validCaptures: 0, expectedOutcomes: 0, unexpectedOutcomes: 0, unavailable: 0, exactLogJoins: 0, ambiguousLogJoins: 0,
    transportUnavailable: 0, httpUnavailable: 0, malformedCaptures: 0,
    validUnavailableResponses: 0, exactUnavailableLogJoins: 0, ambiguousUnavailableLogJoins: 0,
    unavailableWithReusedResponseId: 0,
    unavailableReasons: { 'owner-check-timeout': 0, 'owner-check-error': 0, 'capture-error': 0, unestablished: 0 },
    capturesWithReusedResponseId: 0, conditions: [], humanLabels: 0, providerAccuracyRate: null, humanAccuracyRate: null };
  for (const entry of ledger) {
    const control = controls.get(entry.id); assert.ok(control, 'Unknown ledger control');
    assert.ok(!seen.has(entry.id), 'Duplicate attempt for one control'); seen.add(entry.id);
    const received = Number.isInteger(entry.status) && entry.status >= 100 && entry.status <= 599;
    result.received += Number(received);
    const condition = { phase: control.phase, plannedCondition: control.condition, status: received ? entry.status : null, measurement: 'unavailable', expected: null };
    result.conditions.push(condition);
    if (received && entry.status >= 500) {
      result.unavailable++; result.httpUnavailable++;
      const valid = entry.status === 503 && validateUnavailable(entry.body, control);
      const reason = valid ? entry.body.reason : 'unestablished';
      result.unavailableReasons[reason]++;
      condition.unavailableReason = reason;
      if (valid) {
        result.validUnavailableResponses++;
        const duplicates = ledger.filter(other => other.body?.responseId === entry.body.responseId).length;
        if (duplicates > 1) result.unavailableWithReusedResponseId++;
        const joins = logUnavailable.filter(body => body.responseId === entry.body.responseId && body.controlId === entry.id);
        if (joins.length === 1 && isDeepStrictEqual(joins[0], entry.body)) result.exactUnavailableLogJoins++;
        else if (joins.length > 0) result.ambiguousUnavailableLogJoins++;
      }
      continue;
    }
    let expected = false;
    if (entry.status === 200) {
      result.captureResponses++;
      if (!validateCapture(entry.body, control)) { result.unavailable++; result.malformedCaptures++; condition.measurement = 'malformed-capture'; continue; }
      result.validCaptures++;
      const duplicates = ledger.filter(other => other.body?.responseId === entry.body.responseId).length;
      if (duplicates > 1) result.capturesWithReusedResponseId++;
      const joins = logCaptures.filter(body => body.responseId === entry.body.responseId && body.controlId === entry.id);
      if (joins.length === 1 && isDeepStrictEqual(joins[0], entry.body)) result.exactLogJoins++;
      else if (joins.length > 0) result.ambiguousLogJoins++;
      expected = control.expected === 'boolean-shape' ? ['literal-true', 'literal-false'].includes(entry.body.candidate) : entry.body.candidate === control.expected;
    } else if (received) expected = entry.status === (control.expected === 'denied' ? 403 : control.expected === 'expired' ? 404 : -1);
    else { result.unavailable++; result.transportUnavailable++; continue; }
    result.expectedOutcomes += Number(expected); result.unexpectedOutcomes += Number(!expected);
    Object.assign(condition, { measurement: entry.status === 200 ? 'capture' : 'rejection',
      ...(entry.status === 200 ? { candidate: entry.body.candidate, native: entry.body.native } : {}), expected });
  }
  return result;
}

export function parseCaptureLogStream(text) {
  assert.ok(Buffer.byteLength(text) <= 4 * 1024 * 1024, 'Tail exceeds bounded parser input');
  const captures = [], unavailable = []; let depth = 0, start = -1, quoted = false, escaped = false, envelopes = 0, malformed = 0;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (start < 0) { if (char === '{') { start = index; depth = 1; quoted = false; } continue; }
    if (quoted) { if (escaped) escaped = false; else if (char === '\\') escaped = true; else if (char === '"') quoted = false; continue; }
    if (char === '"') quoted = true;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) {
      try {
        const envelope = JSON.parse(text.slice(start, index + 1)); envelopes++;
        if (Array.isArray(envelope.logs)) for (const log of envelope.logs) {
          if (!record(log) || !Array.isArray(log.message)
            || !['analytics.native_bot_capture', 'analytics.native_bot_capture_unavailable'].includes(log.message[0])) continue;
          if (log.message.length !== 2 || !record(log.message[1])) { malformed++; continue; }
          (log.message[0] === 'analytics.native_bot_capture' ? captures : unavailable).push(log.message[1]);
        }
      } catch { malformed++; }
      start = -1;
    }
  }
  return { captures, unavailable, envelopes, malformed, incompleteFragments: Number(start >= 0) };
}

function curl(directory, path, headers, method = 'GET') {
  writeFileSync(resolve(directory, 'last.headers'), '', { mode: 0o600 });
  writeFileSync(resolve(directory, 'last.body'), '', { mode: 0o600 });
  const args = ['--silent', '--show-error', '--max-time', '20', '--http1.1', '--request', method,
    '--header', 'User-Agent: ' + UA, '--header', 'Accept: application/json',
    '--dump-header', resolve(directory, 'last.headers'), '--output', resolve(directory, 'last.body'), '--write-out', '%{http_code}'];
  for (const value of headers) args.push('--header', value);
  return spawnSync('curl', [...args, ORIGIN + path], { encoding: 'utf8', timeout: 25000 });
}

function main() {
  const [command, rawDirectory, phase] = process.argv.slice(2);
  assert.ok(rawDirectory, 'Provide a private directory'); const directory = resolve(rawDirectory);
  if (command === 'prepare' || command === 'prepare-disabled') {
    mkdirSync(directory, { mode: 0o700 }); const plan = command === 'prepare-disabled' ? prepareDisabledPlan() : preparePlan();
    const token = randomBytes(32).toString('hex');
    save(resolve(directory, 'plan.json'), plan, true);
    save(resolve(directory, 'secrets.json'), { ANALYTICS_NATIVE_CAPTURE: JSON.stringify({ issuedAt: plan.issuedAt, expiresAt: plan.expiresAt,
      origins: [ORIGIN], controls: plan.controls.map(({ id, condition }) => ({ id, condition })) }),
      OWNER_MARK_GRANT: JSON.stringify({ token, issuedAt: plan.issuedAt, expiresAt: plan.expiresAt }) }, true);
    writeFileSync(resolve(directory, 'owner.headers'), 'Authorization: Bearer ' + token + '\n', { mode: 0o600, flag: 'wx' });
    save(resolve(directory, 'ledger.json'), [], true);
    console.log(JSON.stringify({ planned: plan.controls.length, receiverMinutes: (plan.expiresAt - plan.issuedAt) / 60000,
      ruleMinutes: (plan.ruleExpiresAt - plan.issuedAt) / 60000, maximumAttempts: plan.maximumAttempts })); return;
  }
  const plan = load(resolve(directory, 'plan.json')), ledgerPath = resolve(directory, 'ledger.json'), ledger = load(ledgerPath);
  assert.equal(plan.origin, ORIGIN); assert.equal(plan.maximumAttempts, plan.experiment === 'disabled-before-expiry-v1' ? 4 : 32);
  assert.ok(plan.controls.length <= plan.maximumAttempts); assert.ok(ledger.length <= plan.maximumAttempts);
  if (command === 'mark-owner') {
    assert.ok(Date.now() < plan.expiresAt, 'Expired window');
    assert.ok(!existsSync(resolve(directory, 'owner-result.json')), 'Owner-mark attempt already recorded');
    save(resolve(directory, 'owner-result.json'), { attemptedAt: new Date().toISOString() }, true);
    const result = curl(directory, '/api/owner', ['@' + resolve(directory, 'owner.headers')], 'POST');
    save(resolve(directory, 'owner-result.json'), { attemptedAt: new Date().toISOString(), status: Number(result.stdout), exitCode: result.status });
    assert.equal(result.status, 0); assert.equal(result.stdout, '200'); console.log('Owner-marking request acknowledged'); return;
  }
  if (command === 'summarize') {
    const logs = phase ? parseCaptureLogStream(readFileSync(resolve(phase), 'utf8')) : null;
    const summary = { ...summarize(plan, ledger, logs?.captures, logs?.unavailable), ...(logs ? { tail: { envelopes: logs.envelopes, malformed: logs.malformed, incompleteFragments: logs.incompleteFragments } } : {}) };
    save(resolve(directory, 'summary.json'), summary); console.log(JSON.stringify(summary)); return;
  }
  assert.equal(command, 'run'); const selected = plan.controls.filter(control => control.phase === phase); assert.ok(selected.length);
  assertPhaseWindow(plan, phase);
  for (const control of selected) {
    if (ledger.some(entry => entry.id === control.id)) continue;
    assert.ok(ledger.length < plan.maximumAttempts, 'Attempt budget exhausted');
    assertPhaseWindow(plan, phase);
    const entry = { id: control.id, phase, startedAt: new Date().toISOString() }; ledger.push(entry); save(ledgerPath, ledger);
    const result = curl(directory, PREFIX + control.id, ['x-gk-native-capture-trial: ' + plan.tailTag, ...control.values.map(value => HEADER + ': ' + value)]);
    const body = readFileSync(resolve(directory, 'last.body'));
    entry.finishedAt = new Date().toISOString(); entry.transportExit = result.status;
    entry.bodySha256 = hash(body);
    writeFileSync(resolve(directory, control.id + '.headers'), readFileSync(resolve(directory, 'last.headers')), { mode: 0o600 });
    writeFileSync(resolve(directory, control.id + '.body'), body, { mode: 0o600 });
    if (result.status === 0 && /^\d{3}$/.test(result.stdout)) entry.status = Number(result.stdout);
    try { entry.body = JSON.parse(body); } catch { entry.decode = 'unavailable'; }
    save(ledgerPath, ledger);
  }
  const summary = summarize(plan, ledger); save(resolve(directory, 'summary.json'), summary);
  console.log(JSON.stringify({ phase, attempted: ledger.length, received: summary.received, validCaptures: summary.validCaptures, unexpected: summary.unexpectedOutcomes }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
