import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { verifyVendorIp, createVendorIpCache } from '../../analytics/.test-dist/vendor-ip.js';
import { cachePolicyCases, CACHE_POLICY_CLOCK } from '../../analytics/test/fixtures/vendor-cache-provenance.mjs';

const output = process.argv[2]; assert.ok(output, 'Provide a new receipt path');
const require = createRequire(new URL('../package.json', import.meta.url));
const { build } = require('esbuild');
const bundle = await build({ entryPoints: [fileURLToPath(new URL('../test/fixtures/vendor-cache-provenance-worker.js', import.meta.url))], bundle: true, platform: 'browser', format: 'esm', write: false });
assert.equal(bundle.outputFiles.length, 1);
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {} });
const hash = value => createHash('sha256').update(value).digest('hex');
try {
  const node = await cachePolicyCases(verifyVendorIp, createVendorIpCache);
  const response = await mf.dispatchFetch('https://fixture.invalid/probe'); assert.equal(response.status, 200);
  const native = await response.json(); assert.deepEqual(native, node); assert.equal(node.length, 6);
  const positive = node[0]; assert.equal(positive.second.checks[0].outcome, 'listed'); assert.equal(positive.fetchCalls, 1);
  const zero = node.slice(1), groups = new Map();
  for (const result of zero) {
    assert.equal(result.first.checks[0].outcome, 'listed');
    assert.equal(result.first.checks[0].snapshot.freshUntil, result.first.checkedAt);
    assert.equal(result.second.checks[0].outcome, 'not-assessed');
    assert.equal(result.second.checks[0].reason, 'refresh-cooldown'); assert.equal(result.fetchCalls, 1);
    const projection = JSON.stringify([result.first, result.second]);
    const group = groups.get(projection) ?? []; group.push(result.label); groups.set(projection, group);
  }
  assert.ok(zero.some(row => row.cacheStored) && zero.some(row => !row.cacheStored));
  const receipt = {
    checkedAt: new Date().toISOString(), profile: 'zero-reuse-provenance-v1', controlledClock: CACHE_POLICY_CLOCK,
    conditions: node.length, checksPerCondition: 2, nodeAndNativeEqual: true,
    // Measure ambiguity rather than requiring it to persist after a repair.
    zeroReuseProjectionGroups: [...groups].map(([value, labels]) => ({ labels, sha256: hash(value) })),
    differentStorageStatesPresent: true, positiveReuseControlPassed: true, skippedChecksRemainNotAssessed: true,
    results: node.map(row => ({ label: row.label, firstOutcome: row.first.checks[0].outcome,
      freshForMs: Date.parse(row.first.checks[0].snapshot.freshUntil) - Date.parse(row.first.checkedAt),
      secondOutcome: row.second.checks[0].outcome, secondReason: row.second.checks[0].reason,
      upstreamCalls: row.fetchCalls, cacheRetained: row.cacheStored })),
    upstreamCallsPerRuntime: node.reduce((total, row) => total + row.fetchCalls, 0),
    productionRequests: 0, productionSqlStatements: 0, humanLabels: 0,
    sourceSha256: Object.fromEntries(['../../analytics/src/vendor-ip.ts', '../../analytics/test/fixtures/vendor-cache-provenance.mjs', '../test/fixtures/vendor-cache-provenance-worker.js', './check-vendor-cache-provenance.mjs']
      .map(path => [path, hash(readFileSync(new URL(path, import.meta.url)))])),
    scope: 'Synthetic cache-policy contrast, not current Google headers, historical header recovery, native provider detection or classifier accuracy.',
  };
  writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ conditions: receipt.conditions, projectionGroups: receipt.zeroReuseProjectionGroups.length, upstreamCallsPerRuntime: receipt.upstreamCallsPerRuntime }));
} finally { await mf.dispose(); }
