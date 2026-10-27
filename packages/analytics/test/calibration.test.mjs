import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handleCalibration, purgeExpiredCalibration } from '../.test-dist/calibration.js';
import { handleOwner } from '../.test-dist/owner.js';
import { observePageResponse } from '../.test-dist/index.js';
import { queryStats } from '../.test-dist/stats.js';

const now = new Date();
const id = 'c579f002-cb9c-4baa-a477-babfa353e5b5';
const token = 'f'.repeat(64);
function setup() {
  const sqlite = new DatabaseSync(':memory:'); sqlite.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
  const DB = { prepare(sql) { return { bind(...values) { const statement = sqlite.prepare(sql); return {
    async first() { return statement.get(...values) ?? null; },
    async all() { return {results:statement.all(...values)}; },
    async run() { const r=statement.run(...values); return {success:true,meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}}; },
  }; } }; }, async batch(statements) { return Promise.all(statements.map(s=>s.all())); } };
  const config = {issuedAt:now.getTime()-1000,expiresAt:now.getTime()+600000,trials:[{id,condition:'normal',operator:'agent-browser'}]};
  const env = {DB,ANALYTICS_HASH_KEY:'local-only',OWNER_MARK_GRANT:JSON.stringify({token,issuedAt:config.issuedAt,expiresAt:config.expiresAt}),ANALYTICS_CALIBRATION:JSON.stringify(config)};
  const request = (path,init={})=>new Request('https://publication.example'+path,{...init,headers:{'User-Agent':'SyntheticClient/1.0',...init.headers}});
  const mark = ()=>handleOwner(request('/api/owner',{method:'POST',headers:{Authorization:'Bearer '+token}}),env,now);
  return {sqlite,env,config,request,mark};
}

test('inactive, expired, future, malformed and duplicate trial configurations fail before database work',async()=>{
  const base={issuedAt:now.getTime()-1000,expiresAt:now.getTime()+1000,trials:[{id,condition:'normal',operator:'agent-browser'}]};
  for(const value of [undefined,'invalid',JSON.stringify({...base,expiresAt:now.getTime()}),JSON.stringify({...base,issuedAt:now.getTime()+1}),JSON.stringify({...base,expiresAt:now.getTime()+900001}),JSON.stringify({...base,trials:[...base.trials,...base.trials]}),JSON.stringify({...base,trials:[{...base.trials[0],operator:'human-proven'}]})]){
    const env={DB:{prepare(){throw Error('must not query')}},ANALYTICS_HASH_KEY:'fixture',ANALYTICS_CALIBRATION:value};
    const r=await handleCalibration(new Request('https://publication.example/analytics-check/'+id),env,now);assert.equal(r.response.status,404);assert.equal(r.collect,false);
  }
  assert.equal(await handleCalibration(new Request('https://publication.example/article'),{},now),null);
});

test('unmarked clients cannot start a trial or write/read its evidence',async()=>{
  const {env,request,sqlite}=setup();
  for(const path of ['/analytics-check/'+id,'/api/analytics-calibration/'+id+'/ready','/api/analytics-calibration/'+id+'/client.js','/api/analytics-calibration/'+id+'/receipt','/api/analytics-calibration/'+id+'/beacon']){
    const r=await handleCalibration(request(path),env,now);assert.equal(r.response.status,403);assert.equal(r.collect,false);
  }
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM analytics_calibration_trials').get().n,0);
});

test('actual collection stays excluded after daily marks are removed; closed stages and observed rows remain distinct',async()=>{
  const {env,request,mark,sqlite}=setup();assert.equal((await mark()).status,200);
  const ready=await handleCalibration(request('/api/analytics-calibration/'+id+'/ready'),env,now);assert.equal(ready.response.status,200);assert.equal(ready.collect,false);assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM analytics_calibration_trials').get().n,0);
  const page=request('/analytics-check/'+id);const prepared=await handleCalibration(page,env,now);assert.equal(prepared.collect,true);
  const pending=[];observePageResponse(page,prepared.response,'html',env,{waitUntil:p=>pending.push(p)},{verifiedOwnerExclusion:true});await Promise.all(pending);
  assert.equal(sqlite.prepare('SELECT is_owner FROM page_observations').get().is_owner,1);
  const api='/api/analytics-calibration/'+id;
  for(const action of ['/stage/script','/stage/attempt','/stage/queued','/beacon'])assert.equal((await handleCalibration(request(api+action,{method:'POST',headers:{Origin:'https://publication.example'},body:'1'}),env,now)).response.status,200);
  const receipt=await (await handleCalibration(request(api+'/receipt'),env,now)).response.json();
  assert.equal(receipt.counters.page_responses,1);assert.equal(receipt.counters.beacon,1);assert.equal(receipt.observations[0].ownerExcluded,1);
  for(const forbidden of ['daily_client_id','User-Agent','local-only','SyntheticClient'])assert.equal(JSON.stringify(receipt).includes(forbidden),false);
  sqlite.exec('DELETE FROM owner_clients');
  const stats=await queryStats(env.DB,{range:'7d',traffic:'all'});assert.equal(stats.totals.views,0);
  assert.equal((await handleCalibration(request(api+'/receipt'),env,now)).response.status,403);
});

test('cross-origin, oversized, unsolicited, repeated and expired inputs remain bounded; CSP conditions differ',async()=>{
  const {env,request,mark,config,sqlite}=setup();await mark();const api='/api/analytics-calibration/'+id;
  await handleCalibration(request('/analytics-check/'+id),env,now);
  assert.equal((await handleCalibration(request(api+'/beacon',{method:'POST',headers:{Origin:'https://other.example'},body:'1'}),env,now)).response.status,403);
  assert.equal((await handleCalibration(request(api+'/beacon',{method:'POST',headers:{Origin:'https://publication.example'},body:'1'.repeat(10000)}),env,now)).response.status,400);
  assert.equal((await handleCalibration(request(api+'/stage/arbitrary',{method:'POST'}),env,now)).response.status,405);
  for(let i=0;i<8;i++)assert.equal((await handleCalibration(request(api+'/beacon',{method:'POST',headers:{Origin:'https://publication.example'},body:'1'}),env,now)).response.status,200);
  assert.equal((await handleCalibration(request(api+'/beacon',{method:'POST',headers:{Origin:'https://publication.example'},body:'1'}),env,now)).response.status,429);
  assert.equal(sqlite.prepare('SELECT beacon FROM analytics_calibration_trials').get().beacon,8);
  for(const condition of ['block-script','block-beacon']){
    const cfg={...config,trials:[{id:crypto.randomUUID(),condition,operator:'agent-browser'}]};const modified={...env,ANALYTICS_CALIBRATION:JSON.stringify(cfg)};
    const r=await handleCalibration(request('/analytics-check/'+cfg.trials[0].id),modified,now);const csp=r.response.headers.get('Content-Security-Policy');
    if(condition==='block-script')assert.ok(csp.includes("script-src 'none'"));else{assert.ok(csp.includes('/stage/ '));assert.ok(!csp.includes('/beacon'));}
  }
  assert.equal((await handleCalibration(request(api+'/receipt'),env,new Date(config.expiresAt))).response.status,404);
  assert.equal(await purgeExpiredCalibration(env.DB,new Date(config.expiresAt+86400001)),3);
});
