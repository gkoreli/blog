import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeExport, reconcileInvocations } from '../../blog/drafts/research/analytics-retrospective/reconcile-organic-exa.mjs';

function fixture() {
  const invocation = { timestamp: '2026-10-27T20:00:01Z', $metadata: { id: 'event', type: 'cf-worker-event', requestId: 'invocation' },
    $workers: { event: { request: { url: 'https://example.test/', method: 'GET', headers: { 'User-Agent': 'ExaSearchBot/1.0' } } } } };
  const log = (id, message) => ({ timestamp: '2026-10-27T20:00:00Z', $metadata: { id, type: 'cf-worker', requestId: 'invocation' },
    source: { message, operationId: 'operation', collectionVersion: '2026-10-27.6' } });
  return [invocation, log('attempt', 'analytics.observation_attempt'), log('stored', 'analytics.observation_stored')];
}

test('selects invocation declarations, ignoring SQL/span matches and unrelated requests', () => {
  const rows = fixture();
  rows.push({ $metadata: { id: 'span', type: 'span' }, source: { text: 'ExaSearchBot crawler.exa.ai' } });
  const other = structuredClone(rows[0]); other.$metadata.id = 'other'; other.$metadata.requestId = 'other';
  other.$workers.event.request.headers['User-Agent'] = 'curl/8'; rows.push(other);
  const result = reconcileInvocations(rows);
  assert.equal(result.reconciliations.length, 1); assert.equal(result.reconciliations[0].complete, true);
});

test('balanced totals cannot hide duplicate/missing logs or conflicting invocation joins', () => {
  for (const mutate of [
    rows => { rows[2].source.message = 'analytics.observation_attempt'; },
    rows => { rows[2].source.operationId = 'other'; },
    rows => { rows[2].$metadata.requestId = 'other'; },
    rows => { rows[2].source.collectionVersion = 'different'; },
    rows => { rows[2].timestamp = '2026-10-26T20:00:00Z'; },
    rows => { const other = structuredClone(rows[0]); other.$metadata.id = 'second-invocation'; rows.push(other); },
  ]) {
    const rows = fixture(); mutate(rows);
    assert.ok(reconcileInvocations(rows).reconciliations.every(item => !item.complete));
  }
});

test('damaged exports cannot supply accepted completion pairs', () => {
  for (const mutate of [
    rows => { delete rows[0].$metadata.id; },
    rows => { rows[2].$metadata.id = rows[1].$metadata.id; },
    rows => { rows[0].$workers.truncated = true; },
    rows => { delete rows[0].$metadata.requestId; },
  ]) {
    const rows = fixture(); mutate(rows);
    assert.equal(reconcileInvocations(rows).reconciliations[0].complete, false);
  }
});

test('retains unrelated collisions without discarding valid scoped pairs; selected ID collisions reject', () => {
  const rows = fixture();
  rows.push({ $metadata: { id: 'elsewhere', type: 'span' } }, { $metadata: { id: 'elsewhere', type: 'span' } });
  const result = reconcileInvocations(rows);
  assert.equal(result.integrity.duplicateIds, 1);
  assert.equal(result.reconciliations[0].complete, true);
  rows.push({ $metadata: { id: 'stored', type: 'span' } });
  assert.equal(reconcileInvocations(rows).reconciliations[0].complete, false);
});

test('public aggregates omit raw context and unrecognized collection versions', async () => {
  const rows = fixture();
  rows[0].$workers.event.request.url = 'https://example.test/private-token?email=private@example.invalid';
  rows[0].$workers.event.request.headers['cf-connecting-ip'] = '192.0.2.1';
  rows[0].$workers.event.request.cf = { verifiedBotCategory: 'private-category@example.invalid' };
  for (const row of rows) row.$metadata.requestId = 'fixture-private-invocation';
  for (const row of rows.slice(1)) {
    row.source.collectionVersion = 'private-version@example.invalid';
    row.source.operationId = 'fixture-private-operation';
  }
  const result = await analyzeExport(Buffer.from(JSON.stringify(rows)), Buffer.from('{"keys":[]}'));
  const serialized = JSON.stringify(result);
  for (const canary of ['private-token', 'example.invalid', '192.0.2.1', 'fixture-private-invocation', 'fixture-private-operation'])
    assert.equal(serialized.includes(canary), false);
  assert.deepEqual(result.counts.categories, { unrecognized: 1 });
  assert.deepEqual(result.counts.collections, { 'unrecognized-or-unreconciled': 1 });
  assert.equal(result.exactD1Joins, 0);
});

test('Ahrefs selection is explicit and does not silently enter the Exa cohort', () => {
  const rows = fixture();
  rows[0].$workers.event.request.headers['User-Agent'] = 'AhrefsBot/7.0';
  assert.equal(reconcileInvocations(rows).reconciliations.length, 0);
  const result = reconcileInvocations(rows, new Set(['AhrefsBot','AhrefsSiteAudit']));
  assert.equal(result.reconciliations.length, 1);
  assert.equal(result.reconciliations[0].complete, true);
});

test('closed replay reports distinguish current stored verdicts from older success logs', async () => {
  const old = await analyzeExport(Buffer.from(JSON.stringify(fixture())), Buffer.from('{"keys":[]}'));
  assert.deepEqual(old.counts.storedReceiptOutcomes, { 'unavailable-or-unrecognized': 1 });
  const rows = fixture();
  rows[2].source.receipt = { version: '2026-10-27.2', signature: { source: 'local-webbotauth', outcome: 'verified' } };
  const current = await analyzeExport(Buffer.from(JSON.stringify(rows)), Buffer.from('{"keys":[]}'));
  assert.deepEqual(current.counts.storedReceiptOutcomes, { verified: 1 });
  assert.deepEqual(current.counts.replayStatus, { absent: 1 });
  assert.equal(current.exactD1Joins, 0);
  for(const version of ['2026-10-28.2','2026-10-29.1']) {
    rows[2].source.receipt.version=version;
    const newer=await analyzeExport(Buffer.from(JSON.stringify(rows)),Buffer.from('{"keys":[]}'));
    assert.deepEqual(newer.counts.storedReceiptVersions,{[version]:1});
    assert.deepEqual(newer.counts.storedReceiptOutcomes,{verified:1});
    assert.equal(newer.exactD1Joins,0,'version recognition adds no field/proof acceptance');
  }
  rows[2].source.receipt.signature.outcome = 'private-outcome@example.invalid';
  assert.equal(JSON.stringify(await analyzeExport(Buffer.from(JSON.stringify(rows)), Buffer.from('{"keys":[]}'))).includes('private-outcome'), false);
});
