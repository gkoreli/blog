import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
const root = process.cwd();
const require = createRequire(resolve(root, 'package.json'));
const mfPath = require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] });
const { Miniflare } = await import(pathToFileURL(mfPath));
const { queryStats } = await import(pathToFileURL(resolve(root, 'packages/analytics/.test-dist/stats.js')));
const mf = new Miniflare({ modules: true, script: 'export default { fetch() { return new Response("fixture") } }', compatibilityDate: '2026-03-06', d1Databases: { DB: 'classification-fixture' } });
try {
  const db = await mf.getD1Database('DB');
  const schema = readFileSync(resolve(root, 'packages/analytics/schema.sql'), 'utf8');
  await db.batch(schema.split(';').map(s => s.trim()).filter(Boolean).map(s => db.prepare(s)));
  const names = [['ExaUser','ai','ai-assistant'], ['ExaSearchBot','ai','ai-search'], ['AhrefsBot','bot','seo-crawler'], ['AhrefsSiteAudit','bot','seo-crawler']];
  let id = 0;
  const inserts = [];
  function add(name, traffic, kind, signed, extra = {}) {
    inserts.push(db.prepare(`INSERT INTO page_observations(path,daily_client_id,traffic_class,agent_name,device_type,is_owner,reader_kind,reader_reason,signature_status,signature_agent,observed_at,referrer_host) VALUES('/fixture',?,?,?,'desktop',?,?,?,?,?,?,?)`).bind((++id).toString(16).padStart(32,'0'),traffic,name,extra.owner ?? 0,kind,name ?? 'https://legacy.example',signed ? 'verified' : null,signed ? 'https://signer.example' : null,extra.at ?? '2026-10-26 02:00:00',extra.host ?? null));
  }
  for (const [n,t,k] of names) { add(n,t,k,false); add(n,t,k,true); }
  add(null,'bot','signed-agent',true);
  add('AhrefsBot','bot','seo-crawler',true,{owner:1});
  add('AhrefsBot','bot','seo-crawler',true,{host:'uniuit.com'});
  add('AhrefsBot','bot','seo-crawler',true,{at:'2026-10-27 00:00:00'});
  await db.batch(inserts);
  const before = await db.prepare('SELECT * FROM page_observations ORDER BY id').all();
  const results = [];
  for (const range of ['7d','all']) {
    const stats = await queryStats(db,{range,traffic:'all'},new Date('2026-10-26T12:00:00Z'));
    assert.equal(stats.totals.views,9);
    assert.equal(stats.byAgent.reduce((s,r)=>s+r.views,0),8);
    assert.deepEqual(stats.bySigner,[{signatureAgent:'https://signer.example',views:5}]);
    assert.equal(stats.referralPolicy.excludedViews,1);
    assert.equal(stats.byKind.reduce((s,r)=>s+r.views,0),9);
    results.push({ range, views:stats.totals.views, namedViews:8, signerViews:5, excludedViews:1 });
  }
  for (const [n,,k] of names) {
    const stats=await queryStats(db,{range:'7d',traffic:'all',agent:n,kind:k},new Date('2026-10-26T12:00:00Z'));
    assert.equal(stats.totals.views,2); assert.equal(stats.bySigner[0].views,1);
  }
  for (const [traffic,views] of [['crawlers',6],['agents',3]]) assert.equal((await queryStats(db,{range:'7d',traffic},new Date('2026-10-26T12:00:00Z'))).totals.views,views);
  assert.deepEqual((await db.prepare('SELECT * FROM page_observations ORDER BY id').all()).results,before.results);
  console.log(JSON.stringify({capturedAt:new Date().toISOString(),runtime:'Miniflare 4.20260301.1 / workerd local D1',fixtureRows:id,reportExecutions:8,results,unchangedRows:true,productionCalls:0},null,2));
} finally { await mf.dispose(); }
