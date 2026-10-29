import assert from 'node:assert/strict';
import test from 'node:test';
import { reconcileFetcherTrials } from '../scripts/fetcher-trial-ledger.mjs';

const workerVersion = '00000000-0000-4000-8000-000000000001';
const trial = { id: 'browser', operator: 'agent-operated-browser', labelSource: 'cua-controller', url: 'https://gkoreli.com/owner?trial=gk-fetch97-fixture-browser' };
const plan = { workerVersion, frozenAt: '2026-10-29T12:00:00Z', trials: [trial] };
const execution = { id: trial.id, operator: trial.operator, labelSource: trial.labelSource, startedAt: '2026-10-29T12:00:00Z', endedAt: '2026-10-29T12:00:10Z' };
const fixture = () => ({ scriptName: 'gkoreli-com', scriptVersion: { id: workerVersion }, outcome: 'ok', truncated: false, exceptions: [], logs: [], eventTimestamp: Date.parse('2026-10-29T12:00:05Z'), event: { request: { url: trial.url, method: 'GET', headers: { 'cf-ray': '0000000000000001-DFW', 'user-agent': 'FixtureBrowser/1.0' } }, response: { status: 200 } } });
const result = events => reconcileFetcherTrials(plan, [execution], events).measurements[0];

test('independent execution and exact context are both required', () => {
  assert.equal(result([fixture()]).status, 'matched');
  assert.equal(result([]).status, 'capture-unavailable');
  assert.equal(reconcileFetcherTrials(plan, [], [fixture()]).measurements[0].status, 'not-executed');
  assert.throws(() => reconcileFetcherTrials(plan, [{ ...execution, labelSource: 'user-agent-inference' }], [fixture()]));
  assert.throws(() => reconcileFetcherTrials(plan, [{ ...execution, operator: 'human-reported' }], [fixture()]));
  assert.throws(() => reconcileFetcherTrials(plan, [execution, execution], [fixture()]));
  assert.throws(() => reconcileFetcherTrials({ ...plan, trials: [trial, trial] }, [execution], []));
  for (const url of ['https://gkoreli.com/privacy?trial=gk-fetch97-fixture-browser', trial.url + '&trial=second', trial.url + '#fragment', trial.url.replace('gkoreli.com', 'other.example')]) {
    assert.throws(() => reconcileFetcherTrials({ ...plan, trials: [{ ...trial, url }] }, [execution], []));
  }
});

test('complete capture gates refuse false joins', () => {
  const changes = [
    e => { e.scriptVersion.id = '00000000-0000-4000-8000-000000000002'; },
    e => { e.scriptName = 'other'; }, e => { e.outcome = 'error'; },
    e => { e.truncated = true; }, e => { delete e.truncated; },
    e => { e.exceptions.push({ name: 'fixture' }); }, e => { delete e.exceptions; },
    e => { e.event.request.method = 'POST'; }, e => { e.event.response.status = 404; },
    e => { delete e.event.response; }, e => { e.eventTimestamp -= 60000; },
    e => { e.eventTimestamp += 60000; }, e => { e.eventTimestamp = '1793275205000'; },
    e => { delete e.event.request.headers['cf-ray']; }, e => { e.event.request.headers['cf-ray'] = 'malformed'; },
    e => { e.event.request.headers['Cf-Ray'] = e.event.request.headers['cf-ray']; },
    e => { e.event.request.headers['cf-ray'] = 1111111111111111; },
    e => { e.event.request.headers['user-agent'] = 123; }, e => { delete e.logs; },
  ];
  for (const change of changes) {
    const event = fixture(); change(event);
    assert.equal(result([event]).status, 'capture-invalid');
    assert.equal(result([fixture(), event]).status, 'capture-invalid', 'A good copy must not hide contradictory or unusable capture');
  }
});

test('copies, conflicting contexts and separate actual requests stay distinct', () => {
  const event = fixture();
  const duplicate = result([event, structuredClone(event)]);
  assert.equal(duplicate.status, 'matched'); assert.equal(duplicate.events.length, 1); assert.equal(duplicate.duplicateCopies, 1);
  const other = fixture(); other.event.request.headers['user-agent'] = 'ChangedClaim/1.0';
  assert.equal(result([event, other]).status, 'capture-conflict');
  other.event.request.headers['cf-ray'] = '0000000000000002-DFW';
  assert.equal(result([event, other]).events.length, 2);
  const unrelated = fixture(); unrelated.event.request.url = 'https://gkoreli.com/';
  assert.equal(result([unrelated]).status, 'capture-unavailable');
});

test('UTC execution brackets and bounded plan are enforced', () => {
  for (const change of [{ startedAt: '2026-10-29T12:00:00' }, { endedAt: '2026-10-29T11:59:59Z' }, { endedAt: '2026-10-29T12:03:00Z' }, { startedAt: '2026-02-30T12:00:00Z', endedAt: '2026-03-02T12:00:10Z' }]) {
    assert.throws(() => reconcileFetcherTrials(plan, [{ ...execution, ...change }], []));
  }
  assert.throws(() => reconcileFetcherTrials({ workerVersion, trials: [] }, [], []));
  assert.throws(() => reconcileFetcherTrials({ ...plan, workerVersion: 'unknown' }, [], []));
  assert.throws(() => reconcileFetcherTrials({ ...plan, frozenAt: '2026-10-29T12:00:01Z' }, [execution], []));
  assert.throws(() => reconcileFetcherTrials(plan, [execution], Array.from({ length: 4097 }, fixture)));
});
