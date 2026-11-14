/** Isolated acceptance server: actual built assets and composed Worker, synthetic
 * native D1, no secrets, and denied external transport. Never a deployment tool. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { dirname, extname, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { schemaObjects } from '../../analytics/scripts/fresh-schema.mjs';
import { accessFixture } from '../../analytics/test/fixtures/agent-access.mjs';
import { reportProjectionSql } from '../../analytics/.test-dist/report-projection.js';
import { referralReportProjectionSql, REFERRAL_REPORT_RULES_JSON } from '../../analytics/.test-dist/referral-report-projection.js';

const output = process.argv[2]; assert(output, 'Output directory required'); await mkdir(output, { recursive: true });
const root = resolve(import.meta.dirname, '../../..'), dist = resolve(root, 'packages/blog/dist');
const require = createRequire(resolve(root, 'package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const { build } = await import(pathToFileURL(require.resolve('esbuild', { paths: [resolve(root, 'packages/blog')] })));
const entry = `import app from './packages/blog/src/worker/index.ts';
let batches=0,reads=0,writes=0,externalFetches=0,mode='healthy';
globalThis.fetch=async()=>{externalFetches++;throw Error('External transport disabled')};
export default{async fetch(request,env,ctx){
  const path=new URL(request.url).pathname;
  if(path==='/__acceptance/state')return Response.json({batches,reads,writes,externalFetches,mode});
  if(path==='/__acceptance/mode'){
    const next=new URL(request.url).searchParams.get('mode');
    if(!['healthy','unavailable','slow'].includes(next))return new Response(null,{status:400});
    mode=next;return Response.json({mode});
  }
  if(path==='/api/agent-access'&&mode==='unavailable')return Response.json({error:'Controlled acceptance fault'},{status:503,headers:{'Cache-Control':'no-store'}});
  if(path==='/api/agent-access'&&mode==='slow')await new Promise(resolve=>setTimeout(resolve,1500));
  if(path==='/__acceptance/corrupt'){
    await env.DB.prepare("UPDATE page_observation_report_facts SET report_signature_basis='invalid' WHERE observation_id=1").run();
    return Response.json({controlledDerivedFault:true});
  }
  const DB={prepare:sql=>env.DB.prepare(sql),batch:async statements=>{
    batches++;const results=await env.DB.batch(statements);
    for(const result of results){reads+=result.meta.rows_read??0;writes+=result.meta.rows_written??0;}return results;
  }};
  return app.fetch(request,{...env,DB},ctx);
}};`;
const compiled = await build({ stdin: { contents: entry, resolveDir: root, loader: 'js' }, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', write: false });
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.md': 'text/markdown' };
const fixturePosts = [{ url: '/article-a', title: 'Article A — controlled fixture', date: '2026-10-17' }, { url: '/article-b', title: 'Article B — controlled fixture', date: '2026-10-17' }, { url: '/article-zero', title: 'No retained events — controlled fixture', date: '2026-11-01' }];
async function asset(request) {
  const path = new URL(request.url).pathname;
  if (path === '/posts.json') return Response.json(fixturePosts);
  let file = resolve(dist, '.' + path);
  if (relative(dist, file).startsWith('..')) return new Response(null, { status: 404 });
  try {
    const info = await stat(file);
    if (info.isDirectory()) file = resolve(file, 'index.html');
    let bytes = await readFile(file);
    if (path === '/stats' || path === '/stats/') bytes = Buffer.from(bytes.toString().replace('<agent-access-report', '<p>Controlled local data — synthetic native D1 acceptance fixture.</p><agent-access-report'));
    return new Response(request.method === 'HEAD' ? null : bytes, { headers: { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' } });
  } catch { return new Response(null, { status: 404 }); }
}
const fixture = accessFixture(), schema = new DatabaseSync(':memory:');
schema.exec(await readFile(resolve(root, 'packages/analytics/schema.sql'), 'utf8'));
const mf = new Miniflare({ modules: true, script: compiled.outputFiles[0].text, compatibilityDate: '2026-03-06', compatibilityFlags: ['global_fetch_strictly_public'], cf: {}, port: 0,
  d1Databases: { DB: 'agent-access-browser-fixture' }, bindings: { ANALYTICS_HASH_KEY: 'controlled-local-key' }, serviceBindings: { ASSETS: asset },
});
const db = await mf.getD1Database('DB');
for (const object of schemaObjects(schema)) await db.prepare(object.sql).run();
for (let offset = 0; offset < fixture.rows.length; offset += 32) await db.batch(fixture.rows.slice(offset, offset + 32).map(row => {
  const columns = Object.keys(row); return db.prepare(`INSERT INTO page_observations(${columns.join(',')})VALUES(${columns.map(() => '?').join(',')})`).bind(...Object.values(row));
}));
await db.prepare("INSERT INTO owner_clients(daily_client_id,utc_date)VALUES(?,'2026-10-17')").bind('f'.repeat(32)).run();
await db.prepare(reportProjectionSql('range')).bind(0, Number.MAX_SAFE_INTEGER).run();
await db.prepare(referralReportProjectionSql()).bind(0, Number.MAX_SAFE_INTEGER, REFERRAL_REPORT_RULES_JSON).run();
const originals = (await db.prepare('SELECT * FROM page_observations ORDER BY id').all()).results;
const url = (await mf.ready).href;
const receipt = { url, stats: new URL('/stats', url).href, source: 'actual composed Worker and isolated built assets; synthetic native D1', originalRows: originals.length, originalSha256: createHash('sha256').update(JSON.stringify(originals)).digest('hex'), publicBuildConfiguration: 'No local .env copied; subscription site key is not part of this acceptance.', startedAt: new Date().toISOString() };
await writeFile(resolve(output, 'preview.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify(receipt));
async function stop() {
  const after = (await db.prepare('SELECT * FROM page_observations WHERE id<=? ORDER BY id').bind(originals.length).all()).results;
  assert.deepEqual(after, originals);
  await writeFile(resolve(output, 'originals-after-browser.json'), JSON.stringify({ originalRows: originals.length, originalRowsUnchanged: true, sha256: createHash('sha256').update(JSON.stringify(after)).digest('hex') }, null, 2) + '\n');
  await mf.dispose(); fixture.sqlite.close(); schema.close(); process.exit(0);
}
process.once('SIGINT', () => { void stop(); });
process.once('SIGTERM', () => { void stop(); });
