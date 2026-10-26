import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
const req = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(req.resolve('miniflare', { paths: [dirname(req.resolve('wrangler/package.json'))] })));
const { queryStats } = await import(pathToFileURL(resolve('packages/analytics/.test-dist/stats.js')));
const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("fixture")}}', compatibilityDate: '2026-03-06', d1Databases: { DB: 'public-signer-fixture' } });
try {
  const db = await mf.getD1Database('DB');
  const schema = readFileSync('packages/analytics/schema.sql', 'utf8').replace(/^--.*$/gm, '');
  await db.batch(schema.split(';').map(s => s.trim()).filter(Boolean).map(s => db.prepare(s)));
  let nextId = 0;
  const operations = [];
  function add(origin, options = {}) {
    const client = options.client ?? (++nextId).toString(16).padStart(32, '0');
    operations.push(db.prepare(`INSERT INTO page_observations
      (path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,signature_status,signature_agent,agent_name,referrer_host,observed_at)
      VALUES(?,?,'bot','desktop',?,?,?,'verified',?,?,?,?)`).bind(options.path ?? '/article', client, options.owner ?? 0,
        options.kind ?? 'signed-agent', options.reason ?? origin, origin, options.agent ?? null,
        options.referrer ?? null, options.at ?? '2026-10-26 02:00:00'));
  }
  add('https://private-one.example', { client: 'f'.repeat(32) });
  add('https://private-two.example', { client: 'f'.repeat(32) });
  add('https://crawler.exa.ai'); add('https://crawler.exa.ai');
  add('https://ahrefs.com', { agent: 'AhrefsBot', kind: 'seo-crawler', reason: 'AhrefsBot' });
  add('https://assistbot.duckduckgo.com');
  add('https://private-owner.example', { owner: 1 });
  add('https://private-referral.example', { referrer: 'uniuit.com' });
  add('https://private-future.example', { at: '2026-10-27 00:00:00' });
  add('https://private-marked.example', { client: 'a'.repeat(32) });
  await db.batch(operations);
  await db.prepare('INSERT INTO owner_clients(daily_client_id,utc_date) VALUES(?,?)').bind('a'.repeat(32), '2026-10-26').run();
  const before = (await db.prepare('SELECT * FROM page_observations ORDER BY id').all()).results;
  const now = new Date('2026-10-26T12:00:00Z');
  const reports = [];
  for (const range of ['7d', 'all']) {
    const stats = await queryStats(db, { range, traffic: 'all' }, now);
    assert.equal(stats.totals.views, 6);
    assert.deepEqual(stats.bySigner, [
      { signatureAgent: 'Exa', views: 2 }, { signatureAgent: 'Other', views: 2 },
      { signatureAgent: 'Ahrefs', views: 1 }, { signatureAgent: 'DuckDuckGo', views: 1 },
    ]);
    assert.deepEqual(stats.byKind.find(row => row.reason === 'Other'),
      { kind: 'signed-agent', reason: 'Other', views: 2, dailyClients: 1 });
    assert.equal(stats.byKind.reduce((sum, row) => sum + row.views, 0), 6);
    assert.equal(stats.referralPolicy.excludedViews, 1);
    for (const canary of ['private-', 'https://crawler.exa.ai', 'https://ahrefs.com', 'https://assistbot.duckduckgo.com']) assert.equal(JSON.stringify(stats).includes(canary), false, canary);
    reports.push({ range, views: stats.totals.views, signerViews: stats.bySigner.reduce((sum, row) => sum + row.views, 0), unknownSignerViews: 2, unknownSignerDailyClients: 1 });
  }
  assert.equal((await queryStats(db, { range: '7d', traffic: 'agents' }, now)).totals.views, 5);
  const selected = await queryStats(db, { range: '7d', traffic: 'crawlers', agent: 'AhrefsBot', kind: 'seo-crawler', path: '/article' }, now);
  assert.deepEqual(selected.bySigner, [{ signatureAgent: 'Ahrefs', views: 1 }]);
  assert.equal((await queryStats(db, { range: '7d', traffic: 'all', path: '/missing' }, now)).totals.views, 0);
  assert.deepEqual((await db.prepare('SELECT * FROM page_observations ORDER BY id').all()).results, before);
  // Prepare one bounded production acceptance SELECT using the actual report source.
  let captured;
  const tapped = {
    prepare(sql) {
      return { bind(...values) { captured = { sql, values }; return db.prepare(sql).bind(...values); } };
    },
    batch(statements) { return db.batch(statements); },
  };
  const query = { range: '7d', traffic: 'agents', kind: 'signed-agent' };
  const current = await queryStats(tapped, query, new Date());
  assert.equal(current.totals.views, 5);
  assert.ok(captured);
  let index = 0;
  const sql = captured.sql.replace(/\?/g, () => {
    const value = captured.values[index++];
    if (value === null) return 'NULL';
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    assert.equal(typeof value, 'string');
    return "'" + value.replaceAll("'", "''") + "'";
  });
  assert.equal(index, captured.values.length);
  const sqlBytes = new TextEncoder().encode(sql).byteLength;
  assert.ok(sqlBytes < 100000);
  const literal = (await db.prepare(sql).all()).results;
  const literalTotals = JSON.parse(literal.find(row => row.section === 'totals').payload)[0];
  assert.equal(literalTotals.views, 5);
  assert.equal(JSON.stringify(literal).includes('private-'), false);
  const productionPlan = { query, start: current.period.start, end: current.period.end, sqlBytes,
    sqlSha256: createHash('sha256').update(sql).digest('hex'), nativeLiteralPass: true,
    selectReadCeiling: 50000, productionCalls: 0 };
  writeFileSync('/tmp/gk-public-signers-production.sql', sql + ';\n');
  writeFileSync('/tmp/gk-public-signers-production-plan.json', JSON.stringify(productionPlan, null, 2) + '\n');
  const result = { checkedAt: new Date().toISOString(), runtime: 'Actual report code with Miniflare/workerd local D1', productionCalls: 0, fixtureRows: 10, reportExecutions: 7, reports, ownerReferralFutureAndPathExclusionsPass: true, originsPrivateInBothPublicChannels: true, namedRoleIndependentOfSigner: true, storedObservationsUnchanged: true, limit: 'Synthetic rows and stored verifier statuses; no real-vendor re-verification, production billing or anonymous-data claim.' };
  writeFileSync('/tmp/gk-public-signers-local.json', JSON.stringify(result, null, 2) + '\n');
  console.log('Native local-D1 public signer names, daily-client grouping, exclusions and history preservation pass.');
} finally { await mf.dispose(); }
