import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isIP } from 'node:net';

const [input, output] = process.argv.slice(2); assert.ok(output);
const bytes = readFileSync(input), hash = value => createHash('sha256').update(value).digest('hex');
const accepted = JSON.parse(readFileSync(new URL('./latest-signed-production.json', import.meta.url)));
assert.equal(hash(bytes), accepted.inputCommitments.headers);
const rows = JSON.parse(bytes); assert.equal(rows.length, 409);
const names = ['user-agent', 'cookie', 'authorization', 'cf-connecting-ip', 'cf-connecting-ipv6', 'x-real-ip', 'cf-worker', 'x-openai-host-hash', 'forwarded'];
const counts = Object.fromEntries(names.map(name => [name, { absent: 0, empty: 0, placeholderShaped: 0, nonemptyUninterpreted: 0, validIpSyntax: 0 }]));
const requests = new Set(), logIds = new Map();
for (const row of rows) {
  assert.equal(row.$metadata.type, 'cf-worker-event');
  assert.equal(typeof row.$metadata.requestId, 'string'); assert.equal(typeof row.$metadata.id, 'string');
  assert.equal(requests.has(row.$metadata.requestId), false); requests.add(row.$metadata.requestId);
  logIds.set(row.$metadata.id, (logIds.get(row.$metadata.id) ?? 0) + 1);
  assert.ok(Date.parse(row.timestamp) >= Date.parse(accepted.headerSelection.start) && Date.parse(row.timestamp) < Date.parse(accepted.headerSelection.end));
  const source = row.$workers.event.request.headers;
  assert.equal(typeof source, 'object'); assert.ok(source && !Array.isArray(source));
  assert.ok(Object.values(source).every(value => typeof value === 'string'));
  const fields = new Headers(source); assert.ok(fields.has('x-forwarded-proto'));
  for (const name of names) {
    const value = fields.get(name), item = counts[name];
    if (value === null) item.absent++;
    else if (value === '') item.empty++;
    else if (['REDACTED', '[REDACTED]', '[redacted]', '<redacted>'].includes(value)) item.placeholderShaped++;
    else item.nonemptyUninterpreted++;
    if (value !== null && ['cf-connecting-ip', 'cf-connecting-ipv6', 'x-real-ip'].includes(name) && isIP(value)) item.validIpSyntax++;
  }
}
for (const item of Object.values(counts)) assert.equal(item.absent + item.empty + item.placeholderShaped + item.nonemptyUninterpreted, rows.length);
assert.equal(logIds.size, 402); assert.deepEqual([...logIds.values()].filter(n => n > 1), Array(7).fill(2));
const result = { checkedAt: new Date().toISOString(), sourceSha256: hash(bytes), scriptSha256: hash(readFileSync(new URL(import.meta.url))),
  selection: accepted.headerSelection, counts, distinctRequests: requests.size, distinctLogIds: logIds.size,
  newProductionRequests: 0, d1Statements: 0, newHumanLabels: 0,
  interpretation: {
    cookie: 'Two placeholder-shaped retained values; original bytes and exact redaction path unestablished.',
    address: 'Syntactically valid retained addresses do not alone establish trusted edge provenance or original client topology.',
    cfWorker: 'One captured nonempty value; no native trustworthy-header adoption or independently established upstream operator.',
    openaiHostHash: 'One unreviewed transport hint; field name does not authenticate an OpenAI operator or human trigger.',
    forwarded: 'Absent from captured objects, not proof of wire-complete absence.',
  } };
writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
console.log(JSON.stringify({ records: rows.length, cookiePlaceholderShaped: counts.cookie.placeholderShaped, rawValuesReturned: false }));
