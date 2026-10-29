import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {inspectMetadata} from './analyze-unresolved-metadata.mjs';

const names=['user-agent','accept','accept-language','referer','sec-fetch-mode','sec-fetch-dest','sec-fetch-site','sec-fetch-user'];
const fetchNames=names.filter(n=>n.startsWith('sec-fetch-'));
const add=(counts,key)=>{counts[key]=(counts[key]??0)+1};
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const hash=v=>createHash('sha256').update(v).digest('hex');
function indexed(rows,key){assert.ok(Array.isArray(rows));const m=new Map(rows.map(r=>[r[key],r]));assert.equal(m.size,rows.length);return m}
function headers(value){assert.ok(object(value)&&Object.keys(value).every(k=>names.includes(k))&&Object.values(value).every(v=>typeof v==='string'));return value}

export function analyzeLocalRelay(data){
 const{plan,native,front,forward,attempts,ui}=data;
 assert.equal(plan.trials.length,15);assert.equal(new Set(plan.trials.map(t=>t.id)).size,15);
 const N=indexed(native,'trialId'),F=indexed(front,'trialId'),R=indexed(forward,'trialId'),A=indexed(attempts,'trialId'),U=indexed(ui,'trialId');
 assert.equal(N.size,15);assert.equal(F.size,12);assert.equal(R.size,12);assert.equal(A.size,15);assert.equal(U.size,15);
 const byCondition={},familyClaims={},nativeClasses={},missingAsnClasses={},beforeModes={},receiverModes={},sites={};
 let nodeComparisons=0,uiPairs=0,transforms=0,modeAdditions=0;
 const userAgents=new Set();
 for(const[index,trial]of plan.trials.entries()){
  assert.ok(plan.conditions.includes(trial.condition));assert.ok([1,2,3].includes(trial.round));
  const n=N.get(trial.id),a=A.get(trial.id),u=U.get(trial.id);assert.ok(n&&a&&u);
  assert.equal(n.condition,trial.condition);assert.equal(a.index,index);assert.equal(a.operator,'agent');assert.equal(a.attempt,1);assert.equal(a.label,trial.label);
  assert.ok(u.text.includes('Trial captured')&&u.text.includes(trial.label)&&u.text.includes('/trial/'+trial.id));
  const url=new URL(n.input.url);assert.equal(url.hostname,'127.0.0.1');assert.equal(url.protocol,'http:');assert.equal(url.pathname,'/trial/'+trial.id);assert.equal(n.input.method,'GET');
  headers(n.input.headers);userAgents.add(n.input.headers['user-agent']);
  for(const[cf,output]of [[{},n.asnAbsent],[{asn:64512},n.syntheticAsn]]){
   assert.deepEqual(inspectMetadata({...n.input,cf}),output);nodeComparisons++;
   assert.ok(u.text.includes(output.classification.kind+' / '+output.classification.reason));
  }
  uiPairs++;const f=F.get(trial.id),r=R.get(trial.id);
  let before=n.input.headers;
  if(trial.condition==='direct'){assert.equal(f,undefined);assert.equal(r,undefined)}
  else{
   assert.ok(f&&r);assert.equal(f.condition,trial.condition);assert.equal(r.status,200);assert.match(r.responseSha256,/^[a-f0-9]{64}$/);
   assert.ok(Date.parse(a.startedAt)<=Date.parse(f.at)&&Date.parse(f.at)<=Date.parse(n.at)&&Date.parse(n.at)<=Date.parse(r.at));
   before=headers(f.before);headers(f.forwardedHeaders);const expected={...before};
   if(trial.condition.startsWith('strip-all'))for(const name of fetchNames)delete expected[name];
   if(trial.condition==='strip-user-http')delete expected['sec-fetch-user'];
   assert.deepEqual(f.forwardedHeaders,expected);
   if(trial.condition==='strip-all-fetch'){
    assert.equal(f.transport,'Node builtin fetch');assert.deepEqual(n.input.headers,{...expected,'sec-fetch-mode':'cors'});modeAdditions++;
   }else{assert.equal(f.transport,'node:http.request');assert.deepEqual(n.input.headers,expected)}
   transforms++;
  }
  assert.equal(before['sec-fetch-mode'],'navigate');assert.equal(before['sec-fetch-dest'],'document');assert.equal(before['sec-fetch-user'],'?1');
  assert.equal(n.input.headers['user-agent'],before['user-agent']);
  add(beforeModes,before['sec-fetch-mode']);add(receiverModes,n.syntheticAsn.metadata.secFetchMode??'absent');add(sites,before['sec-fetch-site']);
  add(familyClaims,n.syntheticAsn.evidence.declarations.browserFamily);add(nativeClasses,n.syntheticAsn.classification.kind);add(missingAsnClasses,n.asnAbsent.classification.kind);
  const row=byCondition[trial.condition]??={trials:0,syntheticAsnKinds:{},syntheticAsnReasons:{},asnAbsentKinds:{},asnAbsentReasons:{},receiverModes:{},activation:{}};
  row.trials++;add(row.syntheticAsnKinds,n.syntheticAsn.classification.kind);add(row.syntheticAsnReasons,n.syntheticAsn.classification.reason);
  add(row.asnAbsentKinds,n.asnAbsent.classification.kind);add(row.asnAbsentReasons,n.asnAbsent.classification.reason);
  add(row.receiverModes,n.syntheticAsn.metadata.secFetchMode??'absent');add(row.activation,n.syntheticAsn.metadata.secFetchUser===null?'absent':String(n.syntheticAsn.metadata.secFetchUser));
 }
 assert.ok(Object.values(byCondition).every(r=>r.trials===3));
 return{labelledTrials:15,knownAgentOperatedTrials:15,humanOperatedTrials:0,conditions:5,repetitions:3,
  exactNativeReceipts:15,exactUiReceiptPairs:uiPairs,relayStageTriples:transforms,nodeReplayComparisons:nodeComparisons,
  uaValuesPreservedAtReceiver:15,distinctRetainedUaStrings:userAgents.size,browserFamilyClaims:familyClaims,
  browserEntryModes:beforeModes,browserEntrySites:sites,receiverModes,fetchAddedMode:modeAdditions,
  syntheticAsnKinds:nativeClasses,asnAbsentKinds:missingAsnClasses,byCondition,
  operatorAttribution:{labelledInputs:15,operatorDecisionsImplemented:0,operatorAbstentions:15,humanErrorRate:null,humanAbstentionRate:null},
  cfProvenance:{miniflare:'cf:{}',asnAbsent:'explicit empty cf object',syntheticAsn:'explicit fixture value 64512, unlisted by the current catalogue',managedBotAgreement:false},
  originalHistoricalCauseEstablished:false,populationAccuracyMeasured:false,productionRequests:0,d1Statements:0,newHumanLabels:0};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const[root,cleanupRoot,output]=process.argv.slice(2);assert.ok(output);
 const read=name=>JSON.parse(readFileSync(root+'/'+name)),plan=read('plan.json'),ready=read('ready.json');
 assert.equal(ready.scriptSha256,plan.scriptSha256);assert.equal(hash(readFileSync(root+'/harness-source.mjs')),plan.scriptSha256);
 const clean=JSON.parse(readFileSync(cleanupRoot+'/ready.json')),terminal=JSON.parse(readFileSync(cleanupRoot+'/terminal.json'));
 assert.equal(clean.workerBundleSha256,ready.workerBundleSha256);assert.equal(terminal.nativeTrials,0);assert.equal(terminal.frontTrials,0);assert.deepEqual(terminal.errors,[]);
 const data={plan,native:plan.trials.map(t=>read('native-'+t.id+'.json')),front:plan.trials.filter(t=>t.condition!=='direct').map(t=>read('front-'+t.id+'.json')),
  forward:plan.trials.filter(t=>t.condition!=='direct').map(t=>read('forward-'+t.id+'.json')),attempts:plan.trials.map((t,i)=>read('ui-attempt-'+i+'.json')),
  ui:plan.trials.map((t,i)=>({trialId:t.id,text:readFileSync(root+'/ui-result-'+i+'.txt','utf8')}))};
 const result=analyzeLocalRelay(data),negative=[];
 for(const[name,mutate]of[
  ['missing-native',d=>d.native.pop()],['missing-ui',d=>d.ui.pop()],['duplicate-native-identity',d=>d.native[0].trialId=d.native[1].trialId],
  ['wrong-condition',d=>d.front[0].condition='direct'],['changed-outgoing-ua',d=>d.front[0].forwardedHeaders['user-agent']='OfflineControl/1.0'],
  ['changed-native-mode',d=>d.native[0].input.headers['sec-fetch-mode']='cors'],['wrong-asn-projection',d=>d.native[0].syntheticAsn.metadata.asn=null],
  ['mislabelled-ui-operator',d=>d.attempts[0].operator='human'],['changed-ui-classification',d=>d.ui[0].text='Trial captured '+d.plan.trials[0].label],
  ['missing-fetch-added-mode',d=>{const n=d.native.find(r=>r.condition==='strip-all-fetch');delete n.input.headers['sec-fetch-mode']}],
 ]){const changed=structuredClone(data);mutate(changed);assert.throws(()=>analyzeLocalRelay(changed),name);negative.push(name)}
 const files=readdirSync(root).filter(n=>/^(native-|front-|forward-|ui-)|hub-dom\.txt$/.test(n));
 const bytes=files.reduce((n,f)=>n+statSync(root+'/'+f).size,0);assert.ok(files.length<=plan.maximumPrivateRecords&&bytes<=plan.maximumPrivateBytes);
 const receipt={checkedAt:new Date().toISOString(),sourceBaseline:'e3f3f37',...result,negativeControls:negative,
  captureBudget:{scope:'Trial JSON and DOM/action records; bundled library/harness/source captures separate',records:files.length,bytes,recordReviewThreshold:plan.maximumPrivateRecords,byteReviewThreshold:plan.maximumPrivateBytes,serverEnforcedByteCap:false},
  executedHarnessSha256:ready.scriptSha256,workerBundleSha256:ready.workerBundleSha256,cleanupUsesSameNativeBundle:true,
  initialShutdown:{terminalExit:130,terminalReceipt:false,ownedPortsClosed:read('terminal-observed.json').ports.every(p=>p.listening===false)},
  gracefulShutdownCheck:{nativeTrials:0,frontendTrials:0,errors:0,mechanism:'explicit stop line through TTY stdin; exit 0'},
  node:ready.node,undici:ready.undici,nodeUndiciBundledSha256:ready.nodeUndiciSha256,
  analyzerSha256:hash(readFileSync(new URL(import.meta.url))),deliveredHarnessSha256:hash(readFileSync('packages/blog/scripts/serve-local-fetch-metadata.mjs')),
  sourceSha256:Object.fromEntries(['metadata.ts','classify.ts','readerkind.ts','classification-evidence.ts','versions.ts'].map(n=>[n,hash(readFileSync('packages/analytics/src/'+n))]))};
 writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({trials:15,exactUiPairs:15,syntheticAsnKinds:result.syntheticAsnKinds,asnAbsentKinds:result.asnAbsentKinds,negatives:negative.length,rawRecords:files.length,rawBytes:bytes}));
}
