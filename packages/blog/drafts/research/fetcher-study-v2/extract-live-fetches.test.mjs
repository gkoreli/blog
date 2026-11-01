import test from 'node:test';
import assert from 'node:assert/strict';
import { parseStream, extract, publicReceipt } from './extract-live-fetches.mjs';

const label = 'fetcher-live-20261101-test';
const labels = { [label]: 'test' };
function event(logs = [], url = `https://gkoreli.com/article?probe=${label}`) {
  return { event: { request: { url, method: 'GET', headers: {} }, response: { status: 200 } }, logs };
}
const attempt = { message: ['analytics.observation_attempt', { operationId: 'private-operation' }] };
const stored = id => ({ message: ['analytics.observation_stored', {
  operationId: 'private-operation', storage: { status: 'returned', observationId: id }, receipt: {},
}] });

test('formatted concatenated objects preserve quotes, nesting and incomplete suffix', () => {
  const a = { x: '} { \\"', nested: { x: 1 } };
  const result = parseStream(JSON.stringify(a, null, 2) + '\n' + '{"second":2}\n{"unfinished":');
  assert.deepEqual(result.objects, [a, { second: 2 }]);
  assert.equal(result.suffix, '{"unfinished":');
});

test('malformed completed frame and non-JSON output remain explicit', () => {
  const result = parseStream('warning\n{bad}\n{"valid":1}\ntrailer');
  assert.equal(result.malformed.length, 1);
  assert.deepEqual(result.objects, [{ valid: 1 }]);
  assert.deepEqual(result.outside, ['warning\n', '\ntrailer']);
});

test('exact origin and one probe required; label must have frozen assignment', () => {
  assert.equal(extract([event([], `https://elsewhere.example/?probe=${label}`)], labels).events.length, 0);
  assert.equal(extract([event([], `https://gkoreli.com/?probe=${label}&probe=${label}`)], labels).events.length, 0);
  assert.throws(() => extract([event()], {}), /frozen label map/);
});

test('sensitive headers, arbitrary UA text, nonce and raw signature never enter projection', () => {
  const input = event();
  input.event.request.headers = { cookie: 'sensitive-cookie', authorization: 'secret-token',
    'user-agent': 'PersonalValue/secret Mozilla/5.0 Chrome/152.0.0.0',
    'signature-input': 'p=("@authority" "signature-agent");nonce="private-nonce"', signature: 'p=:secret-signature:' };
  const result = extract([input], labels).events;
  assert.deepEqual(result[0].userAgentProducts, ['Mozilla/5.0', 'Chrome/152.0.0.0']);
  assert.deepEqual(result[0].retainedSignatureComponentLists, [['@authority', 'signature-agent']]);
  assert.doesNotMatch(JSON.stringify(result), /sensitive-cookie|secret-token|PersonalValue|private-nonce|secret-signature/);
});

test('row IDs remain private decimal strings and require an exact unique operation chain', () => {
  const id = '9007199254740993';
  const result = extract([event([attempt, stored(id)])], labels);
  assert.deepEqual(result.ids, [id]);
  assert.doesNotMatch(JSON.stringify(result.events), /9007199254740993|private-operation/);
  assert.equal(extract([event([stored(id)])], labels).ids.length, 0);
  assert.equal(extract([event([attempt, stored(id), stored(id)])], labels).ids.length, 0);
});

test('invalid, numeric, overflow and SQL-shaped IDs never prepare a readback', () => {
  for (const id of [12, '0', '-1', '9223372036854775808', "1'); DROP TABLE x;--"]) {
    assert.equal(extract([event([attempt, stored(id)])], labels).ids.length, 0);
  }
});

test('unknown receipt values are closed rather than reflected', () => {
  const result = publicReceipt({ readerKind: 'personal-value', signature: { reasonNames: 'personal-value', signer: 'personal-value' },
    native: { signedAgent: 'personal-value' }, declarations: { candidateNames: 'personal-value' } });
  assert.doesNotMatch(JSON.stringify(result), /personal-value/);
  assert.equal(result.signature.reasonNames, 'unrecognized');
});

test('malformed timestamps and response statuses do not cause false successful observations', () => {
  const input = event(); input.eventTimestamp = Number.MAX_SAFE_INTEGER; input.event.response.status = 900;
  const result = extract([input], labels).events[0];
  assert.equal(result.timestamp, null); assert.equal(result.responseStatus, null);
});
