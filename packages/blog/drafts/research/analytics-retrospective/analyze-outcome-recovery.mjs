import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { build } from 'esbuild';
import { parseSignatureAgentHeader, verifyWebBotAuth } from '../../../../analytics/.test-dist/webbotauth.js';
import { auditRetainedWebBotAuth } from '../../../../analytics/.test-dist/retained-signature-audit.js';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=path=>JSON.parse(readFileSync(path));
const fingerprint=row=>({at:row.timestamp,worker:row.$workers?.scriptVersion?.id,
  url:row.$workers?.event?.request?.url,method:row.$workers?.event?.request?.method,
  headers:Object.fromEntries(new Headers(row.$workers?.event?.request?.headers))});
export function deduplicateCaptures(groups) {
  const records=new Map();let memberships=0,overlaps=0;
  for(const rows of groups)for(const row of rows){memberships++;assert.equal(row.$metadata?.type,'cf-worker-event');
    const ref=row.$metadata.requestId;assert.ok(typeof ref==='string'&&ref.length>0);
    assert.notEqual(row.$workers?.truncated,true);assert.notEqual(row.$cloudflare?.truncated,true);
    const prior=records.get(ref);
    if(prior){assert.ok(isDeepStrictEqual(fingerprint(prior),fingerprint(row)),'Conflicting retained contexts');overlaps++;}
    else records.set(ref,row);
  }
  return{rows:[...records.values()],memberships,overlaps};
}
/** A literal UTC-second/path correspondence diagnostic, never a D1 identity join.
 * No offset is fitted to improve matches; unmatched rows are not proven lost inputs.
 */
export function candidateCorrespondence(candidates,records) {
  const rows=candidates.map(candidate=>({reference:candidate.privateReference,requestReferences:records.filter(record=>{
    const data=record.$workers.event.request;let url;try{url=new URL(data.url);}catch{return false;}
    return data.method==='GET'&&url.origin==='https://gkoreli.com'&&url.pathname===candidate.path
      &&new Date(record.timestamp).toISOString().slice(0,19).replace('T',' ')===candidate.observedAt;
  }).map(record=>record.$metadata.requestId)}));
  return{rows,summary:{candidates:candidates.length,noCorrespondence:rows.filter(r=>r.requestReferences.length===0).length,
    singleCandidateCorrespondence:rows.filter(r=>r.requestReferences.length===1).length,
    multipleCandidateCorrespondences:rows.filter(r=>r.requestReferences.length>1).length,
    exactStorageJoins:0,method:'Literal same UTC second, GET, site origin and URL pathname; no authenticated row reference'}};
}
async function inspectContext(trial) {
  const request=new Request(trial.url,{method:trial.method,headers:trial.headers});
  const header=request.headers.get('signature-agent'),parsed=header===null?null:parseSignatureAgentHeader(header);
  if(parsed===null)return{assessment:'not-assessed',reason:header===null?'signature-agent-missing':'signature-agent-unrecognized'};
  const origins=[...new Set(parsed.map(row=>row.uri))];
  if(origins.length!==1||!['https://crawler.exa.ai','https://ahrefs.com'].includes(origins[0]))return{assessment:'not-assessed',reason:'publisher-outside-reviewed-replay-scope'};
  const origin=origins[0],vendor=origin==='https://crawler.exa.ai'?'exa':'ahrefs';
  const options={now:new Date(trial.now),includeEvidence:true,maxAgeSeconds:86400,fetcher:async url=>{
    if(String(url)!==origin+'/.well-known/http-message-signatures-directory')throw Error('Unreviewed resolver');
    return Response.json(trial.directories[vendor],{headers:{'Content-Type':'application/http-message-signatures-directory+json'}});
  }};
  const verified=await verifyWebBotAuth(request,options);
  const audit=await auditRetainedWebBotAuth(request,{recordedAt:new Date(trial.now),maxAgeSeconds:86400,fetcher:options.fetcher});
  return{assessment:'retained-context',vendor,status:verified.status,reason:verified.reason??null,
    coverage:verified.evidence??null,interpretation:audit.replayInterpretation,availability:audit.availability,
    candidateAudit:audit.capturedInputAudit,originalRequestValidity:audit.originalRequestValidity};
}
async function main(){
  const root=process.argv[2];assert.ok(root);const ledger=json(join(root,'partitions/ledger.json'));
  const groups=ledger.map(item=>json(join(root,'partitions',item.file??item.label+'.json')));
  const broad=json(join(root,'signed-download.json')),initial=json(join(root,'signed-copy-initial.json'));
  const daily=deduplicateCaptures(groups),combined=deduplicateCaptures([broad,daily.rows,initial]);
  assert.equal(daily.rows.length,240);assert.equal(combined.rows.length,240);assert.equal(combined.overlaps,340);
  const records=combined.rows,candidates=json(join(root,'candidates-production.json'))[0].results;
  const correspondence=candidateCorrespondence(candidates,records);assert.equal(correspondence.summary.candidates,201);
  const directories={},captures={};for(const vendor of['exa','ahrefs']){
    const bytes=readFileSync(join(root,'directories',vendor+'.json')),capture=json(join(root,'directories',vendor+'-capture.json'));
    assert.equal(hash(bytes),capture.sha256);directories[vendor]=JSON.parse(bytes);captures[vendor]=capture;
  }
  const trials=records.map(record=>{const r=record.$workers.event.request;return{reference:record.$metadata.requestId,
    now:new Date(record.timestamp).toISOString(),url:r.url,method:r.method,headers:r.headers,directories};});
  const node=[];for(const trial of trials)node.push(await inspectContext(trial));
  const controls=[];for(const vendor of['exa','ahrefs']){
    const index=node.findIndex(row=>row.vendor===vendor&&row.status==='verified');assert.ok(index>=0);
    const original=trials[index],authority=new URL(original.url);authority.hostname='offline-control.invalid';
    controls.push({...original,variant:'changed-authority',url:authority.href});
    const path=new URL(original.url);path.pathname='/offline-unsigned-role-control';const headers=new Headers(original.headers);headers.set('User-Agent','OfflineControl/1.0');
    controls.push({...original,variant:'changed-unsigned-role-and-path',url:path.href,headers:Object.fromEntries(headers)});
  }
  const controlNode=[];for(const trial of controls)controlNode.push(await inspectContext(trial));
  const bundle=await build({stdin:{resolveDir:process.cwd(),contents:`
    import{parseSignatureAgentHeader,verifyWebBotAuth}from './packages/analytics/src/webbotauth.ts';
    import{auditRetainedWebBotAuth}from './packages/analytics/src/retained-signature-audit.ts';
    const inspectContext=${inspectContext.toString()};export default{async fetch(request){return Response.json(await inspectContext(await request.json()));}};`
  },bundle:true,write:false,format:'esm',platform:'browser',logLevel:'silent'});
  const req=createRequire(resolve('package.json'));const{Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
  const mf=new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-03-06',cf:{}});
  try{
    const native=[];for(const[index,trial]of[...trials,...controls].entries()){
      const response=await mf.dispatchFetch('https://offline.invalid/replay',{method:'POST',body:JSON.stringify(trial)});assert.equal(response.status,200);
      const result=await response.json(),expected=index<trials.length?node[index]:controlNode[index-trials.length];
      assert.ok(isDeepStrictEqual(result,expected),'Node/native captured-context disagreement');native.push(result);
    }
    const referenceTrials=[];for(const[index,result]of[...node,...controlNode].entries())if(result.assessment==='retained-context'){
      const trial=index<trials.length?trials[index]:controls[index-trials.length];
      referenceTrials.push({vendor:result.vendor,variant:index<trials.length?'retained-original':trial.variant,
        now:trial.now,url:trial.url,method:trial.method,headers:trial.headers,directory:directories[result.vendor]});
    }
    const counts={};for(const result of node){const key=result.assessment==='retained-context'?result.vendor+':'+result.status+':'+(result.reason??'none'):result.reason;counts[key]=(counts[key]??0)+1;}
    const ids=new Map();for(const record of records){const id=record.$metadata.id;ids.set(id,(ids.get(id)??0)+1);}
    // Negative gates retain distinct observations with the same proof and never
    // turn a single time/path candidate into an authenticated storage join.
    const duplicate=structuredClone(records[0]);duplicate.$metadata.requestId='private-distinct-observation';
    assert.equal(deduplicateCaptures([[records[0],duplicate]]).rows.length,2);
    const conflict=structuredClone(records[0]);conflict.$workers.event.request.url='https://offline.invalid/conflict';
    assert.throws(()=>deduplicateCaptures([[records[0],conflict]]));
    const fixture={privateReference:'9007199254740993',observedAt:new Date(records[0].timestamp).toISOString().slice(0,19).replace('T',' '),path:new URL(records[0].$workers.event.request.url).pathname};
    const ambiguous=candidateCorrespondence([fixture],[records[0],duplicate]);assert.equal(ambiguous.summary.multipleCandidateCorrespondences,1);assert.equal(ambiguous.summary.exactStorageJoins,0);
    const result={checkedAt:new Date().toISOString(),scriptSha256:hash(readFileSync(new URL(import.meta.url))),
      sourceBaseline:'cd05ef0',inputSha256:hash(readFileSync(join(root,'daily-union.json'))),retainedInvocations:240,
      sourceMemberships:combined.memberships,overlappingRepresentations:combined.overlaps,distinctRequestReferences:240,
      distinctLogIds:ids.size,duplicateLogIdGroups:[...ids.values()].filter(n=>n>1).length,
      nativeCountAndExportAgreement:false,counts,correspondence:correspondence.summary,
      recordedClock:true,originalResults:node,controlResults:controls.map((trial,i)=>({variant:trial.variant,...controlNode[i]})),
      nodeNativeContexts:native.length,referenceInputContexts:referenceTrials.length,directoryCaptures:captures,
      gates:{sameRequestCopiesReconciled:true,conflictingContextsRejected:true,distinctRequestsWithSameProofRetained:true,ambiguousCorrespondenceNotPromoted:true},
      externalResolverRequests:0,productionRequests:0,newHumanLabels:0,exactStorageJoins:0,
      limits:['Scoped retained representations, not wire-complete original requests or historical resolver state.',
        'The native aggregate and exports disagree; complete retained population coverage is not established.',
        'Literal same-second/path correspondence is neither an authenticated row identity nor a missing-input census.',
        'Publishers outside Exa/Ahrefs replay scope remain not assessed; no unreviewed directory is fetched.']};
    for(const[name,value]of[['replay-full.json',result],['candidate-correspondence.json',correspondence.rows],['reference-input.json',{trials:referenceTrials}]])writeFileSync(join(root,name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
    console.log(JSON.stringify({records:240,counts,nodeNativeContexts:native.length,referenceContexts:referenceTrials.length,correspondence:correspondence.summary}));
  }finally{await mf.dispose();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
