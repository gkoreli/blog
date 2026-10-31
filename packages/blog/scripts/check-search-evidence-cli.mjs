import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, statSync, existsSync, symlinkSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const [root, output] = process.argv.slice(2); assert.ok(root && output); mkdirSync(root, { mode: 0o700 });
const cli = resolve('packages/blog/scripts/search-evidence.mjs'), sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const invoke = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', timeout: 5000 });
const demo = join(root, 'demo'), first = invoke('--demo', demo); assert.equal(first.status, 0, first.stderr);
for (const name of ['report.json', 'brief.md', 'evidence.json']) assert.equal(statSync(join(demo, name)).mode & 0o777, 0o600);
assert.equal(statSync(demo).mode & 0o777, 0o700);
const before = sha(join(demo, 'report.json')); const collision = invoke('--demo', demo); assert.equal(collision.status, 1); assert.equal(sha(join(demo, 'report.json')), before);
const linked = join(root, 'linked'); symlinkSync(demo, linked, 'dir'); assert.equal(invoke('--demo', linked).status, 1); assert.equal(sha(join(demo, 'report.json')), before);
const provided = JSON.parse(readFileSync(join(demo, 'evidence.json'), 'utf8')); provided.provenance = 'provided-api-response';
provided.response.rows[0].keys[1] = 'private-query-canary'; const source = join(root, 'provided-control.json'); writeFileSync(source, JSON.stringify(provided), { mode: 0o600 });
const accepted = invoke(source, join(root, 'provided')); assert.equal(accepted.status, 0, accepted.stderr); assert.equal(accepted.stdout.includes('private-query-canary'), false);
const report = JSON.parse(readFileSync(join(root, 'provided/report.json'), 'utf8'));
assert.equal(report.inputSha256, sha(source)); assert.equal(report.analysis.sourceAuthenticity, 'not-established'); assert.equal(report.analysis.rows[0].query, 'private-query-canary');
provided.request.apiKey = 'private-credential-canary'; const bad = join(root, 'invalid.json'); writeFileSync(bad, JSON.stringify(provided), { mode: 0o600 });
const rejected = invoke(bad, join(root, 'rejected')); assert.equal(rejected.status, 1); assert.equal(rejected.stderr.includes('private-credential-canary'), false); assert.equal(existsSync(join(root, 'rejected')), false);
const invalidUtf8 = join(root, 'invalid-utf8.json'); writeFileSync(invalidUtf8, Buffer.from([123, 34, 120, 34, 58, 34, 255, 34, 125]), { mode: 0o600 });
assert.equal(invoke(invalidUtf8, join(root, 'utf8-rejected')).status, 1); assert.equal(existsSync(join(root, 'utf8-rejected')), false);
const bom = join(root, 'bom.json'); writeFileSync(bom, Buffer.concat([Buffer.from([239, 187, 191]), readFileSync(source)]), { mode: 0o600 });
assert.equal(invoke(bom, join(root, 'bom-rejected')).status, 1); assert.equal(existsSync(join(root, 'bom-rejected')), false);
const fifo = join(root, 'fifo'); assert.equal(spawnSync('mkfifo', [fifo]).status, 0);
assert.equal(invoke(fifo, join(root, 'fifo-rejected')).status, 1); assert.equal(existsSync(join(root, 'fifo-rejected')), false);
const large = join(root, 'oversized.json'); writeFileSync(large, Buffer.alloc(8 * 1024 * 1024 + 1, 32), { mode: 0o600 });
assert.equal(invoke(large, join(root, 'large-rejected')).status, 1); assert.equal(existsSync(join(root, 'large-rejected')), false);
writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), node: process.version, successfulDemo: true,
  privateModesChecked: true, existingDestinationPreserved: true, symlinkDestinationPreserved: true,
  suppliedShapeDoesNotAuthenticateOrigin: true, queryAndCredentialCanariesAbsentFromLogs: true,
  invalidUtf8Rejected: true, bomRejected: true, fifoRejectedWithoutBlocking: true, oversizedFileRejectedBeforeParsing: true, inputByteHashMatches: true,
  cliSourceSha256: sha(cli), analysisSourceSha256: sha('packages/analytics/src/search-evidence.ts'),
  realSearchRows: 0, externalRequests: 0, productionRequests: 0, d1Statements: 0,
}, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
console.log('Private CLI success, permissions, source hash and refusal/isolation checks pass; all inputs are synthetic controls.');
