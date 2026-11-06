import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const [baseline, output] = process.argv.slice(2);
assert.match(baseline ?? '', /^[0-9a-f]{40}$/);
assert.ok(output?.startsWith('/'), 'Pass a new absolute private output directory');
mkdirSync(output, { mode: 0o700 });
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const rootRequire = createRequire(`${repo}/package.json`);
const blogRequire = createRequire(`${repo}/packages/blog/package.json`);
const { Miniflare } = await import(pathToFileURL(rootRequire.resolve('miniflare', {
  paths: [dirname(rootRequire.resolve('wrangler/package.json'))],
})));
const { build } = await import(pathToFileURL(blogRequire.resolve('esbuild')));
const prefix = 'packages/newsletter/src/';
const oldNames = execFileSync('git', ['ls-tree', '-r', '--name-only', baseline, '--', prefix], { cwd: repo })
  .toString().trim().split('\n').map(name => name.slice(prefix.length));
const cases = ['ordinary', 'unsigned-bom', 'signed-bom', 'invalid-utf8', 'missing-headers',
  'overflow', 'confirmation-overflow', 'aborted', 'bad-secret', 'slow-confirmation'];
const expected = {
  ordinary: [200, 200], 'unsigned-bom': [200, 401], 'signed-bom': [401, 200],
  'invalid-utf8': [401, 400], 'missing-headers': ['pending', 401],
  overflow: ['pending', 413], 'confirmation-overflow': ['pending', 413],
  aborted: ['pending', 408], 'bad-secret': ['exception', 503], 'slow-confirmation': ['pending', 408],
};
const results = {};
let outboundCalls = 0;
for (const [index, variant] of ['before', 'after'].entries()) {
  const dir = `${output}/${variant}`; mkdirSync(`${dir}/src`, { recursive: true, mode: 0o700 });
  for (const name of variant === 'before' ? oldNames : readdirSync(`${repo}/${prefix}`).filter(name => name.endsWith('.ts'))) {
    const bytes = variant === 'before'
      ? execFileSync('git', ['show', `${baseline}:${prefix}${name}`], { cwd: repo })
      : readFileSync(`${repo}/${prefix}${name}`);
    writeFileSync(`${dir}/src/${name}`, bytes, { mode: 0o600 });
  }
  const fixture = readFileSync(`${repo}/packages/blog/test/fixtures/newsletter-request-boundary-worker.js`, 'utf8')
    .replaceAll('../../../newsletter/src/', './src/');
  const bundle = await build({ stdin: { contents: fixture, resolveDir: dir }, bundle: true,
    write: false, format: 'esm', platform: 'browser', target: 'es2024' });
  const script = bundle.outputFiles[0].text;
  writeFileSync(`${dir}/worker.js`, script, { mode: 0o600 });
  const mf = new Miniflare({ modules: true, script, compatibilityDate: '2026-03-06', cf: {},
    d1Databases: { DB: `newsletter-request-${variant}` }, outboundService() {
      outboundCalls++; throw new Error('Native boundary check must not call a provider');
    } });
  try {
    const db = await mf.getD1Database('DB');
    for (const name of ['0001_create_subscribers.sql', '0003_add_bounced_at.sql', '0004_delivery_logs.sql', '0005_confirmation_admission.sql']) {
      const sql = readFileSync(`${repo}/packages/newsletter/migrations/${name}`, 'utf8').replace(/--.*$/gm, '');
      for (const statement of sql.split(';').filter(part => part.trim())) await db.prepare(statement).run();
    }
    await db.prepare("INSERT INTO subscribers(id,email,status,unsubscribe_token) VALUES(?,?,'pending',?)")
      .bind('native-boundary', 'native-boundary@example.invalid', 'synthetic-opt-out').run();
    const rows = [];
    for (const mode of cases) {
      await db.prepare("UPDATE subscribers SET status='pending', suppression_reason=NULL WHERE id=?").bind('native-boundary').run();
      const response = await mf.dispatchFetch(`https://fixture.invalid/${mode}?after=${index}`);
      assert.equal(response.status, 200);
      const row = await response.json();
      // Baseline observations are measured, not inferred from Node's runtime.
      if (variant === 'after' || ['ordinary', 'unsigned-bom', 'signed-bom'].includes(mode)) {
        assert.equal(row.status, expected[mode][index], `${variant}/${mode}`);
      }
      const suppressed = row.status === 200 && ['ordinary', 'unsigned-bom', 'signed-bom', 'invalid-utf8'].includes(mode);
      assert.equal(row.subscriberStatus, suppressed ? 'bounced' : 'pending', `${variant}/${mode}/persistence`);
      rows.push(row);
      writeFileSync(`${dir}/results.json`, JSON.stringify(rows, null, 2) + '\n', { mode: 0o600 });
    }
    results[variant] = { workerSha256: createHash('sha256').update(script).digest('hex'), rows };
  } finally { await mf.dispose(); }
}
assert.equal(outboundCalls, 0);
const receipt = { checkedAt: new Date().toISOString(), baseline, compatibilityDate: '2026-03-06',
  runtime: 'actual local workerd, Web Crypto and D1; constructed request-stream controls',
  casesPerVariant: cases.length, providerCalls: 0, productionCalls: 0,
  actualIncomingWireFramingMeasured: false, ...results };
writeFileSync(`${output}/native.json`, JSON.stringify(receipt, null, 2) + '\n', { mode: 0o600 });
console.log(JSON.stringify({ pairedNative: 'pass', casesPerVariant: cases.length, providerCalls: 0, productionCalls: 0 }));
