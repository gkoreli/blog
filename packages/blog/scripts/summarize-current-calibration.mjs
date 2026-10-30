import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { evaluateCalibration, DEFAULT_OPERATOR_POLICY } from '../../analytics/.test-dist/calibration-evaluation.js';
import { isReaderKind } from '../../analytics/.test-dist/contracts.js';
import { COLLECTION_VERSION, CLASSIFIER_VERSION } from '../../analytics/.test-dist/versions.js';

const [directory,output]=process.argv.slice(2);assert.ok(directory&&output,'Provide private study directory and new aggregate output');
const read=name=>readFileSync(join(directory,name));
const parse=name=>JSON.parse(read(name));
const hash=name=>createHash('sha256').update(read(name)).digest('hex');
const input={plan:parse('trial-plan.json'),browser:parse('browser-executed.json'),curl:parse('curl-executed.json'),query:parse('ledger-query.json'),
  cleanup:parse('cleanup-acceptance.json'),budget:parse('ledger-query-plan.json'),metadata:parse('ledger-query-metadata.json')};
const conditions=['normal','block-script','block-beacon','http-client'];
const safe=n=>Number.isSafeInteger(n)&&n>=0;
const counterPairs=[['responsesPrepared','page_responses'],['scriptReports','script'],['beaconAttemptReports','attempt'],['queuedReports','queued'],
  ['notQueuedReports','not_queued'],['thrownReports','threw'],['beaconReceipts','beacon']];
function summarize(data){
 const {plan,browser,curl,query,cleanup,budget,metadata}=data;
 assert.equal(plan.trials.length,12);assert.equal(new Set(plan.trials.map(t=>t.id)).size,12);
 assert.equal(browser.length,9);assert.equal(curl.length,3);
 assert.ok(browser.every(e=>e.actualOperator==='agent-browser'&&e.labelSource==='agent-controller'));
 assert.ok(curl.every(e=>e.actualOperator==='controlled-curl'&&e.labelSource==='curl-receipt'));
 assert.equal(query.length,1);assert.equal(query[0].success,true);
 assert.equal(budget.selectedTrials,12);assert.equal(budget.readReviewThreshold,500);assert.equal(query[0].meta.rows_written,0);
 assert.ok(safe(query[0].meta.rows_read)&&query[0].meta.rows_read<=500);assert.equal(metadata.rowsRead,query[0].meta.rows_read);assert.equal(metadata.rowsReturned,12);
 assert.equal(metadata.agentAttempts,1);assert.equal(cleanup.originalSecretNamesRestored,true);assert.equal(cleanup.inactiveStatus,404);assert.equal(cleanup.disabledBeforeExpiry,true);
 const rows=query[0].results;assert.equal(rows.length,12);assert.equal(new Set(rows.map(r=>r.id)).size,12);
 const byId=new Map(rows.map(r=>[r.id,r]));
 const plans=plan.trials.map(t=>{
  assert.ok(conditions.includes(t.condition));assert.equal(t.operator,t.condition==='http-client'?'controlled-curl':'agent-browser');
  return {id:t.id,condition:t.condition,plannedOperator:t.operator};
 });
 const executions=[...browser,...curl];assert.equal(new Set(executions.map(e=>e.id)).size,12);
 const observations=[];
 for(const e of executions){
  const t=plan.trials.find(t=>t.id===e.id),r=byId.get(e.id);assert.ok(t&&r);
  assert.equal(e.actualOperator,t.operator);assert.equal(e.labelSource,t.operator==='agent-browser'?'agent-controller':'curl-receipt');
  const start=Date.parse(e.startedAt),end=Date.parse(e.endedAt);assert.ok(Number.isFinite(start)&&end>=start&&start>=plan.issuedAt&&end<plan.expiresAt);
  assert.equal(r.condition,t.condition);assert.equal(r.plannedOperator,t.operator);assert.equal(r.trialRecorded,1);
  assert.equal(r.responsesPrepared,1);assert.equal(r.storedObservations,1);assert.equal(r.ownerExcludedObservations,1);
  assert.equal(r.minCollectionVersion,COLLECTION_VERSION);assert.equal(r.maxCollectionVersion,COLLECTION_VERSION);
  const obs=JSON.parse(r.observations);assert.equal(obs.length,1);const o=obs[0];assert.ok(isReaderKind(o.kind));assert.equal(o.ownerExcluded,1);
  assert.equal(o.collection,COLLECTION_VERSION);assert.equal(o.classifier,CLASSIFIER_VERSION);assert.equal(o.classification.classifierProfile,CLASSIFIER_VERSION);
  assert.equal(e.receipt.condition,t.condition);assert.equal(e.receipt.plannedOperator,t.operator);
  for(const [column,receipt] of counterPairs){assert.ok(safe(r[column])&&r[column]<=8);assert.equal(e.receipt.counters[receipt],r[column]);}
  assert.deepEqual(e.receipt.observations,[{kind:o.kind,ownerExcluded:1,observations:1}]);observations.push(o);
 }
 const measurements=rows.map(r=>({id:r.id,trialRecorded:r.trialRecorded===1,condition:r.condition,plannedOperator:r.plannedOperator,
  responsesPrepared:r.responsesPrepared,storedObservations:r.storedObservations,ownerExcludedObservations:r.ownerExcludedObservations,kinds:JSON.parse(r.observations).map(o=>o.kind)}));
 const evaluation=evaluateCalibration(plans,executions,measurements);assert.equal(evaluation.accounting.executedCohortComplete,true);
 assert.equal(evaluation.accounting.automationLabels,12);assert.equal(evaluation.accounting.humanLabels,0);
 const counterfactual=evaluateCalibration(plans,executions,measurements,{profile:'counterfactual-browser-as-human-v1',predict:kind=>kind==='browser'?'human':DEFAULT_OPERATOR_POLICY.predict(kind)});
 const byCondition=conditions.map(condition=>{const selected=rows.filter(r=>r.condition===condition);assert.equal(selected.length,3);return {condition,trials:selected.length,
  ...Object.fromEntries(counterPairs.map(([column])=>[column,selected.reduce((n,r)=>n+r[column],0)]))};});
 const kindCounts=new Map();for(const o of observations)kindCounts.set(o.kind,(kindCounts.get(o.kind)??0)+1);
 const facts=new Map();const native={verifiedBot:{true:0,false:0,unavailable:0,unrecognized:0},signedAgent:{true:0,false:0,unavailable:0,unrecognized:0}};
 for(const o of observations){const c=o.classification;assert.ok(['listed','not-listed','unavailable'].includes(c.network));assert.ok(['chromium','firefox','webkit','unrecognized'].includes(c.declarations.browserFamily));
  assert.ok(['true-claim','absent','other-value','invalid','policy-limit','not-assessed'].includes(c.activation));assert.equal(typeof c.navigationShaped,'boolean');
  const fact={kind:o.kind,network:c.network,navigationShaped:c.navigationShaped,activation:c.activation,browserFamilyClaim:c.declarations.browserFamily,fetchMetadataBits:c.fetchMetadataBits};
  const key=JSON.stringify(fact);facts.set(key,{...fact,events:(facts.get(key)?.events??0)+1});
  for(const key of ['verifiedBot','signedAgent']){const value=o.native?.[key];native[key][value===true?'true':value===false?'false':value===null||value===undefined?'unavailable':'unrecognized']++;}
 }
 return {evaluation,counterfactualBrowserAsHuman:counterfactual,byCondition,byKind:[...kindCounts].map(([kind,events])=>({kind,events})),classificationFacts:[...facts.values()],native};
}
const before=parse('version-before.json'),active=parse('version-active.json'),after=parse('version-after.json');
assert.equal(before.id,input.plan.baseWorkerVersion);
assert.equal(before.resources.script.etag,active.resources.script.etag);assert.equal(before.resources.script.etag,after.resources.script.etag);
assert.deepEqual(before.resources.script_runtime,active.resources.script_runtime);assert.deepEqual(before.resources.script_runtime,after.resources.script_runtime);
const bindings=v=>[...v.resources.bindings].sort((a,b)=>a.name.localeCompare(b.name));
assert.deepEqual(bindings(before),bindings(after));
assert.deepEqual(bindings(before),bindings(active).filter(b=>!['ANALYTICS_CALIBRATION','OWNER_MARK_GRANT'].includes(b.name)));
const baseTop=read('native-base-build-top.txt').toString(),baseEnd=read('native-base-build-end.txt').toString();
assert.ok(baseTop.includes(input.plan.sourceCommit)&&baseEnd.includes(before.id)&&baseEnd.includes('Success! Build completed.'));
const result=summarize(input);
const mutations=[d=>d.browser.pop(),d=>d.browser.push(d.browser[0]),d=>d.browser[0].actualOperator='human-reported',d=>d.query[0].results[0].responsesPrepared++,
 d=>d.query[0].results[0].ownerExcludedObservations=0,d=>d.query[0].results[0].minCollectionVersion='old',d=>d.browser[0].receipt.counters.beacon++,
 d=>d.query[0].results[0].id='unknown',d=>d.query[0].meta.rows_read=501,d=>d.cleanup.originalSecretNamesRestored=false,
 d=>{const first=d.browser[0];d.browser[0]=d.curl[0];d.curl[0]=first;},d=>d.browser[0].labelSource='curl-receipt'];
for(const mutate of mutations){const altered=structuredClone(input);mutate(altered);assert.throws(()=>summarize(altered));}
assert.equal(hash('ledger-production.sql'),input.budget.sqlSha256);assert.equal(hash('ledger-template.sql'),input.budget.templateSha256);
const receipt={checkedAt:new Date().toISOString(),method:'Fresh separately operated agent-browser/curl cohort; exact twelve-ID independent D1 ledger agrees with each client receipt. Not a replay of October27 controls.',
 sourceCommit:input.plan.sourceCommit,deploymentContext:{baseVersion:before.id,activeVersion:active.id,cleanupVersion:after.id,baseBuildId:'f3e2d520-368a-4272-aab5-a658888f5426',nativeBuildSourceJoined:true,scriptEtagUnchanged:true,runtimeSettingsUnchanged:true,otherBindingsUnchanged:true,perRequestVersionTrace:false},collection:COLLECTION_VERSION,classifier:CLASSIFIER_VERSION,observationWindow:input.budget.window,...result,
 directStatements:{constantProbeReads:parse('remote-constant.json')[0].meta.rows_read,ledgerReads:input.query[0].meta.rows_read,ledgerWrites:0,ledgerAttempts:input.metadata.providerTotalAttempts,reviewThreshold:500},
 negativeChecks:mutations.length,cleanup:input.cleanup,inputSha256:Object.fromEntries(['trial-plan.json','browser-executed.json','curl-executed.json','ledger-production.sql','ledger-query.json','ledger-query-metadata.json','cleanup-acceptance.json'].map(name=>[name,hash(name)])),
 limits:['Twelve correlated automation controls from one browser profile and one curl profile, not population accuracy or twelve readers.','No human, real-device or JavaScript-disabled control; CSP script blocking is a separate condition. Human rates remain null.','Evaluation-only operator policy abstains on Browser/legacy/Unresolved; it is not a deployed human classifier.','The counterfactual Browser-as-human policy is not deployed.','Counters measure accepted first-party stages through the cutoff, not Cloudflare Web Analytics receipt or every wire attempt.','Profile stamps and unchanged provider script ETags establish the recorded deployment context; no per-request Worker version trace was captured.','Guard/stage/collector/receipt/metadata work is additional to direct SELECT metering.','Temporary bindings are removed before expiry; physical counter deletion and provider-wide erasure are unproven.']};
writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({executed:result.evaluation.accounting.executed,decisions:result.evaluation.decisions,byKind:result.byKind,ledgerReads:receipt.directStatements.ledgerReads,negatives:mutations.length}));
