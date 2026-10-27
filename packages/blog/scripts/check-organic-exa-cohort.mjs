import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [output] = process.argv.slice(2); assert.ok(output && !existsSync(output));
const req = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(req.resolve('miniflare', { paths: [dirname(req.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("Fixture only")}}', compatibilityDate: '2026-03-06', d1Databases: { DB: 'organic-cohort-fixture' } });
try {
  const db = await mf.getD1Database('DB');
  const schema = readFileSync('packages/analytics/schema.sql', 'utf8').replace(/^\s*--.*$/gm, '');
  await db.batch(schema.split(';').map(s => s.trim()).filter(Boolean).map(s => db.prepare(s)));
  const evidence = JSON.stringify({ version: '2026-10-27.3', source: 'local-webbotauth', verifierProfile: '2026-10-27.6', localOutcome: 'verified', vendor: { status: 'matching-origin' }, coverage: { covered: { authority: true, userAgent: false, path: false } }, native: { verifiedBot: null, signedAgent: null } });
  const path = '/which-ai-fetchers-send-which-headers';
  for (const [observedAt, page, owner] of [
    ['2026-10-27 20:16:44', path, 0], ['2026-10-27 20:16:47', path, 1],
    ['2026-10-27 20:16:43', path, 0], ['2026-10-27 20:16:48', path, 0],
    ['2026-10-27 20:16:45', '/other', 0],
  ]) {
    await db.prepare(`INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,signature_status,collection_version,signature_evidence)
      VALUES(?,'00000000000000000000000000000000','ai','desktop',?,'ai-search','fixture',?,'verified','2026-10-27.6',?)`).bind(page, owner, observedAt, evidence).run();
  }
  const sql = readFileSync('packages/blog/drafts/research/analytics-retrospective/organic-exa-cohort.sql', 'utf8');
  const result = await db.prepare(sql).all();
  assert.equal(result.results.length, 1); assert.equal(result.results[0].observations, 2);
  assert.equal(result.results[0].authorityCovered, 1); assert.equal(result.results[0].userAgentCovered, 0);
  assert.equal(result.results[0].nativeSignedAgent, null); assert.equal(result.results[0].routineSourceEventIdAbsent, 1);
  writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), method: 'Native local workerd/D1 query acceptance with five synthetic stored rows. Executed after the production SELECT; not a pre-production acceptance claim.', fixtureRows: 5, selectedRows: 2, results: result.results, meta: result.meta, productionRequests: 0, limits: ['Synthetic query-window/owner/path controls, not real vendor collection or a deterministic invocation join.'] }, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ selectedRows: 2, checksPassed: true }));
} finally { await mf.dispose(); }
