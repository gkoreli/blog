import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { queryStats, parseStatsQuery } from '../.test-dist/stats.js';
import { unreportedKindFixtures, INSERT_UNREPORTED_FIXTURE, unreportedFixtureValues } from './fixtures/unreported-kinds.mjs';

function fixture() {
  const sqlite = new DatabaseSync(':memory:'); sqlite.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  for (const row of unreportedKindFixtures()) sqlite.prepare(INSERT_UNREPORTED_FIXTURE).run(...unreportedFixtureValues(row));
  let transform = rows => rows;
  const DB = { prepare(sql) { return { bind(...values) { return { execute() { return { results: transform(sqlite.prepare(sql).all(...values)) }; } }; } }; }, async batch(statements) { return statements.map(statement => statement.execute()); } };
  return { sqlite, DB, alter(fn) { transform = fn; } };
}
const now = new Date('2026-10-27T12:00:00Z');
const query = { range: '7d', traffic: 'all', path: '/audit' };

test('composition reconciles all rows; missing/unrecognized classifications remain explicit and private', async () => {
  const { sqlite, DB } = fixture(), before = sqlite.prepare('SELECT * FROM page_observations ORDER BY id').all();
  const result = await queryStats(DB, query, now);
  assert.equal(result.totals.views, 10); assert.equal(result.byKind.reduce((n,row)=>n+row.views,0), 10);
  assert.equal(result.referralPolicy.excludedViews, 1);
  assert.deepEqual(result.byKind.find(row=>row.reason==='unrecognized-stored-classification'), { kind:'unresolved',reason:'unrecognized-stored-classification',views:2,dailyClients:1 });
  assert.deepEqual(result.byKind.find(row=>row.reason==='classification-not-recorded'), { kind:'unresolved',reason:'classification-not-recorded',views:2,dailyClients:2 });
  for (const kind of ['browser','signed-agent']) assert.equal(result.byKind.find(row=>row.kind===kind&&row.reason==='classification-reason-unavailable').views, 1);
  assert.equal(result.byKindSignature.filter(row=>row.kind===null).reduce((n,row)=>n+row.views,0), 4);
  assert.equal(result.byKindNativeCategory.filter(row=>row.kind===null).reduce((n,row)=>n+row.views,0), 4);
  for (const canary of ['private-kind','private-reason','another-private']) assert.equal(JSON.stringify(result).includes(canary), false);
  assert.deepEqual(sqlite.prepare('SELECT * FROM page_observations ORDER BY id').all(), before);
});

test('traffic and kind scopes include reporting unknowns and keep group totals disjoint', async () => {
  const { DB } = fixture(); let sum = 0;
  for (const traffic of ['browser','agents','crawlers','automation','unresolved']) {
    const r = await queryStats(DB, { ...query, traffic }, now); sum += r.totals.views;
    assert.equal(r.byKind.reduce((n,row)=>n+row.views,0), r.totals.views);
    if (traffic === 'unresolved') assert.equal(r.totals.views, 5);
  }
  assert.equal(sum,10);
  assert.equal((await queryStats(DB,{...query,kind:'unresolved'},now)).totals.views,5);
  assert.equal((await queryStats(DB,{...query,range:'all',traffic:'unresolved'},now)).totals.views,6);
  assert.equal((await queryStats(DB,{...query,kind:'ai-assistant'},now)).totals.views,1);
  assert.equal((await queryStats(DB,{...query,traffic:'agents'},now)).totals.views,3);
  assert.equal((await queryStats(DB,{...query,path:'/absent'},now)).byKind.length,0);
});

test('a retained client name can scope missing classifications without claiming its current role', async () => {
  const { DB } = fixture();
  const scoped = parseStatsQuery(new URLSearchParams('range=7d&traffic=unresolved&kind=unresolved&agent=ExaSearchBot&path=/audit'));
  assert.equal(typeof scoped,'object'); const result = await queryStats(DB,scoped,now);
  assert.equal(result.totals.views,1); assert.equal(result.byKind[0].reason,'classification-not-recorded');
  assert.equal(typeof parseStatsQuery(new URLSearchParams('traffic=browser&agent=ExaSearchBot')),'string');
});

test('malformed/duplicated/missing composition rows fail instead of hiding a denominator gap', async () => {
  const { DB, alter } = fixture();
  for (const rewrite of [
    rows => rows.slice(1), rows => [...rows,rows[0]],
    rows => [{...rows[0],key1:'private-kind'},...rows.slice(1)],
    rows => [{...rows[0],key2:null},...rows.slice(1)],
    rows => [{...rows[0],views:0},...rows.slice(1)],
    rows => [{...rows[0],dailyClients:rows[0].views+1},...rows.slice(1)],
    rows => [{...rows[0],views:rows[0].views+1},...rows.slice(1)],
  ]) {
    alter(rows=>rows.map(row=>row.section==='kind'?{...row,payload:JSON.stringify(rewrite(JSON.parse(row.payload)))}:row));
    await assert.rejects(()=>queryStats(DB,query,now),/Malformed statistics report/);
  }
});
