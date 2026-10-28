import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { directoryPublicationEvidence, directoryPublicationBasisSql } from '../.test-dist/directory-publication.js';
import { DIRECTORY_PUBLICATION_STATUSES } from '../.test-dist/directory-publication-contract.js';
import { vendorSignatureEvidence } from '../.test-dist/vendor-signatures.js';
import { verificationEvidence, FAILURE_OUTCOMES } from '../.test-dist/signature-evidence.js';
import { queryStats } from '../.test-dist/stats.js';

const verified = { status:'verified', agent:'https://ahrefs.com' };
const cases = [
  [[], verified, false, 'no-declaration'],
  [['GPTBot'], verified, false, 'not-configured'],
  [['AhrefsBot'], { status:'absent' }, false, 'not-verified'],
  [['AhrefsBot'], verified, false, 'matching-publisher'],
  [['AhrefsBot'], { status:'verified', agent:'https://crawler.exa.ai' }, false, 'different-publisher'],
  [['AhrefsBot','GPTBot'], verified, false, 'partial-mapping'],
  [['AhrefsBot','ExaSearchBot'], verified, false, 'conflicting-publishers'],
  [['AhrefsBot'], verified, true, 'test-injected'],
];

test('published directory provenance is separate from documented signing promises and cryptographic trust', () => {
  assert.equal(vendorSignatureEvidence(['AhrefsBot'], verified).status, 'not-configured');
  const before = JSON.stringify(verified);
  for (const [names,result,injected,status] of cases) assert.equal(directoryPublicationEvidence(names,result,injected).status,status);
  assert.equal(JSON.stringify(verified),before);
  for (const name of ['AhrefsBot','AhrefsSiteAudit','ExaSearchBot','ExaUser','Google-Agent']) {
    const origin=name.startsWith('Ahrefs')?'https://ahrefs.com':name==='Google-Agent'?'https://agent.bot.goog':'https://crawler.exa.ai';
    assert.equal(directoryPublicationEvidence([name],{status:'verified',agent:origin}).status,'matching-publisher');
  }
});

test('Google publisher review stays separate from client declarations, injected verdicts and related products', () => {
  const result={status:'verified',agent:'https://agent.bot.goog'};
  const evidence=directoryPublicationEvidence(['Google-Agent'],result);
  assert.equal(evidence.profile,'2026-10-28.1');assert.equal(evidence.reviewedOn,'2026-10-28');
  assert.equal(evidence.status,'matching-publisher');assert.equal(evidence.configuredDeclarationCount,1);
  assert.equal(directoryPublicationEvidence(['Google-Agent'],{status:'absent'}).status,'not-verified');
  assert.equal(directoryPublicationEvidence(['Google-GeminiNotebook'],result).status,'not-configured');
  assert.equal(directoryPublicationEvidence(['Google-Agent','Google-GeminiNotebook'],result).status,'partial-mapping');
  assert.equal(directoryPublicationEvidence(['Google-Agent','ExaUser'],result).status,'conflicting-publishers');
  assert.equal(directoryPublicationEvidence(['Google-Agent'],result,true).status,'test-injected');
  assert.equal(directoryPublicationEvidence(['Google-Agent'],{status:'verified',agent:'https://agent.bot.goog.evil.example'}).status,'different-publisher');
});

test('legacy directory profile/date pairs remain readable, but hybrid profiles cannot inherit review', () => {
  const {sqlite,add}=fixture();
  const current=verificationEvidence(new Request('https://publication.example'),verified,false,['AhrefsBot']);
  const legacy=structuredClone(current);legacy.directoryPublication.profile='2026-10-27.1';legacy.directoryPublication.reviewedOn='2026-10-27';
  add(legacy);add(current);
  for(const [profile,date]of [['2026-10-27.1','2026-10-28'],['2026-10-28.1','2026-10-27'],['future','2026-10-28']]){
    const hybrid=structuredClone(current);hybrid.directoryPublication.profile=profile;hybrid.directoryPublication.reviewedOn=date;add(hybrid);
  }
  assert.deepEqual(sqlite.prepare(`SELECT ${directoryPublicationBasisSql()} basis FROM page_observations`).all().map(r=>r.basis),
    ['matching-publisher','matching-publisher','unrecognized-record','unrecognized-record','unrecognized-record']);
});

test('duplicates, partial mappings, competing publishers and injected verdicts retain uncertainty', () => {
  const e=directoryPublicationEvidence(['AhrefsBot','AhrefsSiteAudit','AhrefsBot'],verified);
  assert.equal(e.configuredDeclarationCount,2);assert.equal(e.unmappedDeclarationCount,0);
  for (const names of [['AhrefsBot','ExaSearchBot','GPTBot'],['GPTBot','ExaSearchBot','AhrefsBot']]) {
    const result=directoryPublicationEvidence(names,verified);assert.equal(result.status,'conflicting-publishers');assert.equal(result.unmappedDeclarationCount,1);
  }
  for (const agent of ['https://ahrefs.com.evil.example','https://private-canary.example','https://ahrefs.com/']) {
    const result=directoryPublicationEvidence(['AhrefsBot'],{status:'verified',agent});
    assert.equal(result.status,'different-publisher');assert.equal(JSON.stringify(result).includes(agent),false);
  }
  assert.equal(directoryPublicationEvidence(['private-name@example.invalid'],verified).status,'not-configured');
  assert.equal(directoryPublicationEvidence(['AhrefsBot'],verified,true).status,'test-injected');
});

test('new publication facts and the full closed failure set stay within the existing stored JSON budget', () => {
  const evidence=verificationEvidence(new Request('https://publication.example'),{status:'unverified',reason:'private-reason@example.invalid',reasons:Object.keys(FAILURE_OUTCOMES)},false,['ExaSearchBot','AhrefsBot','GPTBot']);
  assert.equal(evidence.version,'2026-10-27.5');assert.equal(evidence.directoryPublication.status,'conflicting-publishers');
  assert.ok(Buffer.byteLength(JSON.stringify(evidence))<=2048);assert.equal(JSON.stringify(evidence).includes('private-reason'),false);
});

function fixture() {
  const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
  let next=0;
  const insert=sqlite.prepare(`INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,signature_status,signature_evidence,referrer_host)
    VALUES(?,?,'bot','desktop',?,'unresolved','fixture',?,?,?,?)`);
  const add=(evidence,options={})=>insert.run(options.path??'/article',(++next).toString(16).padStart(32,'0'),options.owner??0,options.at??'2026-10-27 22:00:00',options.signatureStatus??(evidence?.localStatus==='verified'?'verified':null),evidence===null?null:JSON.stringify(evidence),options.referrer??null);
  const DB={prepare(sql){return{bind(...values){return{all(){return{results:sqlite.prepare(sql).all(...values)}}}}}},async batch(statements){return statements.map(s=>s.all())}};
  return{sqlite,DB,add};
}

test('directory distribution is exhaustive, private, scoped and preserves history and all exclusions',async()=>{
  const{DB,add}=fixture();
  for(const[names,result,injected]of cases)add(verificationEvidence(new Request('https://publication.example'),result,injected,names));
  add(null);add({version:'2026-10-27.4',source:'local-webbotauth',localStatus:'absent'});
  const broken=verificationEvidence(new Request('https://publication.example'),verified,false,['AhrefsBot']);broken.directoryPublication.status='private-canary@example.invalid';add(broken);
  const valid=verificationEvidence(new Request('https://publication.example'),verified,false,['AhrefsBot']);
  add(valid,{owner:1});add(valid,{referrer:'traffic2cash.xyz'});add(valid,{at:'2026-10-28 00:00:00'});add(valid,{path:'/other'});
  const report=await queryStats(DB,{range:'7d',traffic:'all',path:'/article'},new Date('2026-10-27T23:00:00Z'));
  const counts=Object.fromEntries(report.byDirectoryPublication.map(r=>[r.basis,r.views]));
  assert.equal(report.totals.views,11);assert.equal(counts['not-recorded'],2);assert.equal(counts['unrecognized-record'],1);
  for(const status of DIRECTORY_PUBLICATION_STATUSES)assert.equal(counts[status],1,status);
  assert.equal(report.byDirectoryPublication.reduce((n,r)=>n+r.views,0),report.totals.views);
  assert.equal(JSON.stringify(report).includes('private-canary'),false);assert.equal(report.referralPolicy.excludedViews,1);
  const empty=await queryStats(DB,{range:'7d',traffic:'all',path:'/missing'},new Date('2026-10-27T23:00:00Z'));assert.deepEqual(empty.byDirectoryPublication,[]);
});

test('malformed publisher records cannot be promoted into a matching publisher',()=>{
  const{sqlite,add}=fixture();
  const base=verificationEvidence(new Request('https://publication.example'),verified,false,['AhrefsBot']);
  const mutations=[e=>{e.version='future'},e=>{e.source='test-injected'},e=>{e.directoryPublication.profile='future'},e=>{e.directoryPublication.method='private-method'},e=>{e.directoryPublication.configuredDeclarationCount=0},e=>{e.directoryPublication.configuredDeclarationCount=.5},e=>{e.directoryPublication.unmappedDeclarationCount=1},e=>{e.directoryPublication.status='partial-mapping'},e=>{e.directoryPublication.status='no-declaration'},e=>{e.directoryPublication.status='not-verified'},e=>{e.localStatus='unverified'}];
  for(const mutate of mutations){const e=structuredClone(base);mutate(e);add(e)}
  const rows=sqlite.prepare(`SELECT ${directoryPublicationBasisSql()} basis FROM page_observations`).all();
  assert.ok(rows.every(r=>r.basis==='unrecognized-record'));
});

test('incomplete, duplicate or invalid directory distributions fail report decoding',async()=>{
  const{DB,add}=fixture();add(null);add(null);
  for(const payload of [
    [{key1:'private-basis@example.invalid',views:2}],
    [{key1:'not-recorded',views:1},{key1:'not-recorded',views:1}],
    [{key1:'not-recorded',views:1}],
    [{key1:'not-recorded',views:2.5}],
    [{key1:'not-recorded',views:-1}],
    [],
  ]){
    const broken={prepare:DB.prepare,async batch(statements){const results=await DB.batch(statements);return results.map(result=>({...result,results:result.results.map(row=>row.section==='directory-publication'?{...row,payload:JSON.stringify(payload)}:row)}))}};
    await assert.rejects(queryStats(broken,{range:'7d',traffic:'all'},new Date('2026-10-27T23:00:00Z')),/Malformed statistics report/);
  }
});
