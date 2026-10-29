import assert from 'node:assert/strict';
export const now=new Date('2026-10-29T21:00:00Z');
export const catalogue=[{path:'/a',title:'Article A',publishedOn:'2026-09-01'},{path:'/b',title:'Article B',publishedOn:'2026-10-22'},{path:'/zero',title:'No events yet',publishedOn:'2026-10-28'}];
const row=(id,overrides={})=>({path:'/a',daily_client_id:id.toString(16).padStart(32,'0'),traffic_class:'browser',device_type:'desktop',reader_kind:'browser',is_owner:0,referrer_state:'absent',referrer_host:null,classifier_version:null,observed_at:'2026-10-01 00:00:00',...overrides});
export function reachCases(){return [
 row(1,{referrer_state:'external',referrer_host:'www.private-canary.example.'}),
 row(2,{observed_at:'2026-10-08 00:00:00',referrer_state:'external',referrer_host:'PRIVATE-CANARY.EXAMPLE',classifier_version:'fixture-new'}),
 row(3,{path:'/b',observed_at:'2026-10-22 00:00:00',referrer_state:'external',referrer_host:'private-canary.example'}),
 row(4,{path:'/',observed_at:'2026-10-28 23:59:59',referrer_state:'external',referrer_host:'private-canary.example'}),
 row(5,{referrer_state:'external',referrer_host:'www.google.com.'}),row(6,{path:'/b',referrer_state:'external',referrer_host:'google.com'}),
 row(7,{referrer_state:'internal'}),row(8,{referrer_state:null,referrer_host:'www.gkoreli.com.'}),
 row(9,{path:'/a/prompts',referrer_state:'internal'}),row(10,{path:'/engineering'}),
 row(11,{referrer_state:'unusable'}),row(12,{referrer_state:null}),row(13,{referrer_state:'external'}),
 row(14,{referrer_state:'absent',referrer_host:'private-unexpected.example'}),
 row(15,{path:'/b',referrer_state:null,referrer_host:'kagi.com'}),
 row(16,{observed_at:'2026-10-25 99:00:00'}),row(17,{observed_at:'2026-10-24 24:00:00'}),
 row(18,{observed_at:'2026-10-20T12:00:00Z'}),
 row(19,{is_owner:1,referrer_host:'traffic2cash.xyz'}),row(20,{owner_client:1}),
 row(21,{referrer_host:'traffic2cash.xyz'}),row(22,{reader_kind:'ai-search'}),
 row(23,{observed_at:'2026-09-30 23:59:59'}),row(24,{observed_at:'2026-10-29 00:00:00'}),
 ]}
export async function seedReach(db,rows){
 for(let i=0;i<rows.length;i+=64){const batch=rows.slice(i,i+64);await db.batch(batch.map(row=>{const{owner_client,...stored}=row,keys=Object.keys(stored);return db.prepare(`INSERT INTO page_observations(${keys.join(',')})VALUES(${keys.map(()=>'?').join(',')})`).bind(...Object.values(stored))}));for(const row of batch)if(row.owner_client)await db.prepare("INSERT INTO owner_clients(daily_client_id,utc_date)VALUES(?,'fixture')").bind(row.daily_client_id).run()}
}
export function checkReach(report){
 assert.equal(report.site.views,18);assert.equal(report.articleTotals.views,15);assert.equal(report.referralPolicy.excludedViews,1);assert.equal(report.largestExternalSource.views,4);assert.equal(report.largestExternalSource.name,null);assert.deepEqual(report.weeks.map(w=>w.site.views),[12,1,0,2]);assert.equal(report.site.unrecognizedTimeViews,3);assert.equal(report.site.externalViews,7);assert.equal(report.site.internalViews,3);assert.equal(report.site.unknownSourceViews,4);assert.equal(report.site.unattributedViews,4);assert.equal(report.classification.recordedProfiles,1);assert.equal(report.classification.unversionedViews,17);assert.equal(report.articles.find(a=>a.path==='/zero').totals.views,0);assert.equal(JSON.stringify(report).includes('private-'),false);assert.equal(report.period.endExclusive,'2026-10-29');
}
export function reportMutations(){return [
 r=>delete r.site,r=>r.site.views++,r=>r.site.largestSourceViews++,r=>r.site.unrecognizedTimeViews++,r=>r.articles.pop(),r=>r.articles[1].path=r.articles[0].path,
 r=>r.weeks[0].site.views++,r=>r.weeks[1].endExclusive='2026-10-14',r=>r.articles[0].weeks.pop(),r=>r.articleTotals.externalViews++,r=>r.largestExternalSource.views++,r=>r.classification.unversionedViews=9999,r=>r.period.startInclusive='2026-10-02',r=>r.period.updatedAt='2026-10-28T00:00:00Z',r=>r.site.views='18',r=>r.site.views=true,r=>r.site.extra=0,r=>r.articles[0].publishedOn='2026-02-30',r=>r.articles[0].path='//private.example',r=>r.referralPolicy.sha256='bad',r=>r.version='future',r=>r.extra='private-canary',r=>r.period.updatedAt='2026-10-29',r=>r.classification.recordedProfiles=0,r=>{r.largestExternalSource.views=0;r.site.largestSourceViews=0}
 ]}
