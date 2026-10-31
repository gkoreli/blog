import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, statSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = mkdtempSync(join(tmpdir(), 'agent-discovery-cli-'));
const cli = resolve('packages/blog/scripts/agent-discovery-evidence.mjs');
const input = resolve('packages/blog/drafts/research/discovery-experiment-02/agent-discovery-evidence.json');
const run = (source, output) => spawnSync(process.execPath, [cli, source, output], { encoding: 'utf8', timeout: 10000 });
const checks = [];
function rejected(name, source, output = join(root, name)) {
  const result = run(source, output);
  assert.equal(result.status, 1, name); assert.equal(result.signal, null, name);
  assert.ok(!result.stdout.includes('PRIVATE-CANARY') && !result.stderr.includes('PRIVATE-CANARY'), name);
  checks.push(name);
}
const output = join(root, 'accepted'), accepted = run(input, output);
assert.equal(accepted.status, 0, accepted.stderr);
const report = JSON.parse(readFileSync(join(output, 'report.json'), 'utf8'));
assert.equal(report.inputSha256, createHash('sha256').update(readFileSync(input)).digest('hex'));
assert.deepEqual(report.report.runs.map(r => r.matches[0].found), [3, 3]);
assert.equal(report.report.referenceTotals.evidenceReusePairs, 1);
assert.equal(statSync(output).mode & 0o777, 0o700);
for (const file of ['report.json', 'brief.md']) assert.equal(statSync(join(output, file)).mode & 0o777, 0o600);
assert.ok(!accepted.stdout.includes('DuckAssist') && !accepted.stdout.includes('Grok'));
checks.push('actual-pack-hash-modes-and-log-minimization');
const original = readFileSync(join(output, 'report.json'));
rejected('existing-destination', input, output);
assert.deepEqual(readFileSync(join(output, 'report.json')), original);
symlinkSync(output, join(root, 'destination-link')); rejected('destination-symlink', input, join(root, 'destination-link'));
const controls = [
  ['invalid-utf8', Buffer.from([0x7b, 0xff, 0x7d])],
  ['bom', Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), readFileSync(input)])],
  ['oversized', Buffer.alloc(8 * 1024 * 1024 + 1, 0x20)],
  ['invalid-json', '{PRIVATE-CANARY'],
];
for (const [name, bytes] of controls) { const source = join(root, name + '.json'); writeFileSync(source, bytes, { mode: 0o600 }); rejected(name, source); }
const malformed = JSON.parse(readFileSync(input, 'utf8')); malformed.runs[0].method.credential = 'PRIVATE-CANARY';
const bad = join(root, 'bad-schema.json'); writeFileSync(bad, JSON.stringify(malformed), { mode: 0o600 }); rejected('schema-secret-not-logged', bad);
const fifo = join(root, 'fifo'); assert.equal(spawnSync('mkfifo', [fifo]).status, 0); rejected('nonblocking-fifo-refusal', fifo);
rejected('device-refusal', '/dev/null');
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), checks, privateOutput: root, networkRequests: 0, d1Statements: 0 }));
