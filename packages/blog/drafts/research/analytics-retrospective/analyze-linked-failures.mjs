import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {reconcileInvocations} from './reconcile-organic-exa.mjs';
import {reconcileReceiptStorage} from './reconcile-receipt-storage.mjs';

const [root,output,inputPath]=process.argv.slice(2);assert.ok(inputPath);
const read=p=>JSON.parse(readFileSync(p)),h=v=>createHash('sha256').update(v).digest('hex');
const rows=read(join(root,'accepted.json'));assert.equal(rows.length,2);
const cases=[{alias:'duck',name:'DuckDuckBot',origin:'https://bot.duckduckgo.com',
 archive:'2026-10-29-additional-publishers',file:'publisher-3.json',digest:'671d10f3fc69e03de28b820333e9d20390c63bcb14c4c82ebc4cc5addd8de84d'},
 {alias:'exa',name:'ExaSearchBot',origin:'https://crawler.exa.ai',
 archive:'2026-10-29-outcome-candidate-recovery',file:'private/directories/exa.json',digest:'2a9fed3dab0798b45eb58791f5e0c178bb95ef6d247d5a37531890058bd0fb52'}];
const archives='/Users/goga/Documents/goga/analytics-evidence',trials=[],summaries=[];let referrerPathExperiment='not-applicable';
for(const entry of cases){
 const row=rows.find(r=>r.agentName===entry.name);assert.ok(row);
 const chain=read(join(root,entry.alias+'-chain.json')),copy=read(join(root,entry.alias+'-receipt.json'));
 assert.equal(chain.length,4);assert.equal(copy.length,1);
 const joined=reconcileInvocations(chain,new Set([entry.name]));assert.ok(Object.values(joined.integrity).every(n=>n===0));
 assert.equal(joined.reconciliations.length,1);const linked=joined.reconciliations[0];assert.equal(linked.complete,true);
 for(const records of [chain,copy]){
  const pairing=reconcileReceiptStorage([row],records);assert.equal(pairing.identicalProjectionPairs,1);
  for(const field of ['differentProjectionPairs','unmatchedCandidateRows','ambiguousReferenceGroups','invalidPairMetadata','unexpectedFields','unprojectableCandidateRows'])assert.equal(pairing[field],0);
 }
 const receipt=chain.filter(r=>r.source?.message==='analytics.observation_stored');assert.deepEqual(receipt,copy);
 const r=linked.row.$workers.event.request;assert.equal(new URL(r.url).pathname,row.path);
 assert.equal(row.collectionVersion,'2026-10-29.3');assert.equal(row.observationSource,'edge');
 assert.equal(JSON.parse(row.signatureEvidence).verifierProfile,'2026-10-29.1');
 const archive=join(archives,entry.archive),manifest=read(join(archive,'manifest.json'));
 const recordedFile=manifest.files.find(f=>f.path===entry.file);assert.ok(recordedFile);assert.equal(recordedFile.sha256,entry.digest);
 const bytes=readFileSync(join(archive,entry.file));assert.equal(h(bytes),entry.digest);const directory=JSON.parse(bytes);
 const original={vendor:entry.alias,variant:'original',origin:entry.origin,directoryUrl:entry.origin+'/.well-known/http-message-signatures-directory',directory,
  now:row.observedAt.replace(' ','T')+'Z',url:r.url,method:r.method,headers:r.headers};
 const add=(variant,url,headers=r.headers)=>trials.push({...original,variant,url:String(url),headers});
 add('original',r.url);const authority=new URL(r.url);authority.hostname='offline-control.invalid';add('changed-authority',authority);
 const changed=new URL(r.url);changed.pathname='/offline-role-and-path-control';const headers=new Headers(r.headers);headers.set('User-Agent','OfflineControl/1.0');
 add('changed-role-and-path',changed,Object.fromEntries(headers));
 if(entry.alias==='duck'){
  const referrer=new URL(new Headers(r.headers).get('referer'));assert.equal(referrer.hostname,new URL(r.url).hostname);
  assert.ok(['http:','https:'].includes(referrer.protocol));assert.equal(referrer.port,'');
  if(referrer.pathname===new URL(r.url).pathname)referrerPathExperiment='skipped-identical-path';
  else{
   referrerPathExperiment='substituted-same-hostname-path';
   const counterfactual=new URL(r.url);counterfactual.pathname=referrer.pathname;
   add('counterfactual-referrer-path',counterfactual);
   const wrong=new URL(counterfactual);wrong.hostname='offline-control.invalid';add('counterfactual-referrer-path-changed-authority',wrong);
   const ua=new Headers(r.headers);ua.set('User-Agent','OfflineControl/1.0');add('counterfactual-referrer-path-changed-role',counterfactual,Object.fromEntries(ua));
  }
 }
 summaries.push({declaration:entry.name,chainRecords:chain.length,identicalStoredProjectionPairs:1,matchingSeparateQueryReceiptCopies:1,
  storedReason:JSON.parse(row.signatureEvidence).localReason,recordedClockSource:'D1 observed_at, second precision',invocationWallTimeMs:linked.row.$workers.wallTimeMs,
  collector:'2026-10-29.3',verifier:'2026-10-29.1',originalWireValidity:'not-established',originalDirectoryState:'not-established',
  inputCommitments:{chain:h(readFileSync(join(root,entry.alias+'-chain.json'))),receiptCopy:h(readFileSync(join(root,entry.alias+'-receipt.json'))),directory:entry.digest,archiveManifest:h(readFileSync(join(archive,'manifest.json')))}});
}
assert.ok([6,9].includes(trials.length));const input=JSON.stringify({trials},null,2)+'\n';writeFileSync(inputPath,input,{flag:'wx',mode:0o600});
const result={checkedAt:new Date().toISOString(),sourceBaseline:'16c8bd8',scriptSha256:h(readFileSync(new URL(import.meta.url))),
 storedRowsSha256:h(readFileSync(join(root,'accepted.json'))),inputSha256:h(input),contexts:trials.length,observations:2,summaries,
 referrerPathExperiment,counterfactualPolicy:'Only a different same-hostname retained referrer pathname may be substituted, offline. Its HTTP scheme differs from the HTTPS destination. An identical path is skipped. No URL search, acceptance fallback or causal attribution.',
 newOwnSiteRequests:0,newHumanLabels:0};
writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({observations:2,identicalStoredProjectionPairs:2,contexts:trials.length,referrerPathExperiment}));
