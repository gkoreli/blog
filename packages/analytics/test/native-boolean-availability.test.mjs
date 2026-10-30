import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { queryStats } from '../.test-dist/stats.js';
import { consistentSignatureSummary } from '../.test-dist/signature-summary.js';

function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  const db = { prepare(sql) { return { bind(...values) { return { run: () => sqlite.prepare(sql).all(...values) }; } }; },
    async batch(statements) { return statements.map(s => ({ results: s.run() })); } };
  let id = 0;
  const add = (native, options = {}) => {
    const evidence = { version: '2026-10-27.1', source: 'local-webbotauth', verifierProfile: 'fixture',
      localStatus: 'absent', localReason: null, coverage: null, native };
    sqlite.prepare(`INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,reader_kind,reader_reason,
      observed_at,signature_evidence,is_owner,referrer_host) VALUES('/fixture',?,'ai','desktop','other-bot','fixture','2026-10-30 04:00:00',?,?,?)`)
      .run(String(++id).padStart(32,'0'), options.history ? null : JSON.stringify(evidence), options.owner ?? 0, options.referrer ?? null);
  };
  return { sqlite, db, add };
}
const query = { range: '7d', traffic: 'all', path: '/fixture' }, now = new Date('2026-10-30T05:00:00Z');

test('native fields retain independent false-versus-missing denominators in every boolean/null combination', async () => {
  for (const verifiedBot of [true,false,null]) for (const signedAgent of [true,false,null]) {
    const f = fixture(); f.add({ verifiedBot,signedAgent });
    const v = (await queryStats(f.db,query,now)).verification;
    assert.equal(v.nativeAvailableViews, Number(verifiedBot !== null || signedAgent !== null));
    assert.equal(v.nativeVerifiedBotAvailableViews, Number(verifiedBot !== null));
    assert.equal(v.nativeSignedAgentAvailableViews, Number(signedAgent !== null));
    assert.equal(v.nativeVerifiedBotViews, Number(verifiedBot === true));
    assert.equal(v.nativeSignedAgentViews, Number(signedAgent === true));
    assert.equal(v.nativeVerifiedBotAvailableViews - v.nativeVerifiedBotViews, Number(verifiedBot === false));
    assert.equal(v.nativeSignedAgentAvailableViews - v.nativeSignedAgentViews, Number(signedAgent === false));
    f.sqlite.close();
  }
});

test('malformed envelopes and excluded events cannot supply a native field denominator', async () => {
  const f = fixture();
  f.add({ verifiedBot:true,signedAgent:1 }); f.add({ verifiedBot:false }); f.add(null); f.add({}, { history:true });
  f.add({ verifiedBot:true,signedAgent:true }, { owner:1 });
  f.add({ verifiedBot:true,signedAgent:true }, { referrer:'traffic2cash.xyz' });
  const report = await queryStats(f.db,query,now), v = report.verification;
  assert.equal(report.totals.views,4); assert.equal(v.nativeNotRecordedViews,1); assert.equal(v.nativeUnrecognizedViews,3);
  assert.equal(v.nativeVerifiedBotAvailableViews,0); assert.equal(v.nativeSignedAgentAvailableViews,0);
  const empty = await queryStats(f.db,{...query,path:'/missing'},now);
  assert.ok(Object.values(empty.verification).every(n => n === 0)); f.sqlite.close();
});

test('native availability rejects impossible union, positive and negative counts', async () => {
  const f = fixture(); f.add({ verifiedBot:true,signedAgent:false });
  const report = await queryStats(f.db,query,now), v = report.verification;
  assert.equal(consistentSignatureSummary(v,1,report.byKindSignature),true);
  for (const changed of [
    { ...v,nativeVerifiedBotAvailableViews:0 },
    { ...v,nativeSignedAgentAvailableViews:2 },
    { ...v,nativeAvailableViews:0,nativeUnavailableViews:1 },
    { ...v,nativeVerifiedBotAvailableViews:0,nativeVerifiedBotViews:0,nativeSignedAgentAvailableViews:0 },
    { ...v,localVerifiedNativeNotVerifiedViews:1 },
    { ...v,nativeSignedAgentViews:1,nativeSignedAgentAvailableViews:0 },
    { ...v,nativeSignedAgentAvailableViews:-1 },
    { ...v,nativeSignedAgentAvailableViews:'1' },
  ]) assert.equal(consistentSignatureSummary(changed,1,report.byKindSignature),false);
  f.sqlite.close();
});
