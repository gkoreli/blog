import assert from 'node:assert/strict';
import {readFileSync,writeFileSync}from'node:fs';
import{createHash}from'node:crypto';
import{isDeepStrictEqual}from'node:util';
import{reconcileReceiptStorage}from'./reconcile-receipt-storage.mjs';
import{analyzeTraffic}from'../../../../analytics/.test-dist/classify.js';

const[prefix,output]=process.argv.slice(2);assert.ok(output);
const read=name=>JSON.parse(readFileSync(prefix+name)),hash=b=>createHash('sha256').update(b).digest('hex');
const pre=read('preflight-final.json'),native=read('native.json'),reference=read('reference.json'),plan=read('read-plan.json');
const chains=read('old-chains.json'),copies=read('old-receipts.json'),input=read('reference-input-final.json'),control=read('control.json'),query=read('readback.json');
for(const[name,sha]of[['old-chains.json',pre.chainsSha256],['old-receipts.json',pre.receiptsSha256],['reference-input-final.json',pre.inputSha256]])assert.equal(hash(readFileSync(prefix+name)),sha);
assert.equal(native.inputSha256,pre.inputSha256);assert.equal(reference.execution.inputSha256,pre.inputSha256);assert.equal(reference.sourceFilesRechecked,18);assert.equal(reference.referenceCalls,156);
assert.equal(native.historicalFilesRechecked,51);assert.equal(native.historicalProfile,'2026-10-28.7');assert.equal(native.currentProfile,'2026-10-29.1');
assert.equal(native.results.length,156);assert.equal(reference.rows.length,156);assert.equal(reference.sourceCommit,'1de433d9a49fd608475c6054ab14a1652c088844');
assert.equal(native.reuse.assessment,'complete');assert.equal(native.reuse.verifiedObservations,52);
assert.equal(native.scriptSha256,hash(readFileSync(new URL('../../../scripts/check-frozen-signed-cohort.mjs',import.meta.url))));
assert.equal(pre.scriptSha256,hash(readFileSync(new URL('./analyze-frozen-signed-cohort.mjs',import.meta.url))));
assert.equal(reference.execution.scriptSha256,hash(readFileSync(new URL('./probe-pyauth-retained.py',import.meta.url))));
assert.equal(reference.execution.sourceManifestSha256,hash(readFileSync(new URL('./complete-audit-sources.json',import.meta.url))));
assert.equal(plan.templateSha256,hash(readFileSync(new URL('./frozen-signed-storage.sql',import.meta.url))));
assert.equal(plan.sqlSha256,hash(readFileSync(prefix+'readback.sql')));assert.equal(plan.invocationInputSha256,pre.chainsSha256);assert.equal(plan.receiptInputSha256,pre.receiptsSha256);
assert.equal(control.length,1);assert.equal(control[0].success,true);assert.deepEqual(control[0].results,[{query_access_control:1}]);
assert.equal(query.length,1);assert.equal(query[0].success,true);assert.equal(query[0].results.length,52);
for(const item of [control[0],query[0]]){assert.equal(item.meta.rows_written,0);assert.equal(item.meta.total_attempts,1);assert.equal(item.meta.changed_db,false);}
assert.equal(control[0].meta.rows_read,0);assert.equal(query[0].meta.rows_read,104);
const comparison=reconcileReceiptStorage(query[0].results,chains);assert.equal(comparison.identicalProjectionPairs,52);assert.equal(comparison.storedLocalVerifiedPairs,52);
for(const key of ['invalidCandidateReferences','unavailableReceiptReferences','invalidReceiptReferences','unmatchedCandidateRows','unmatchedReceiptRecords','ambiguousReferenceGroups','invalidPairMetadata','unprojectableCandidateRows','differentProjectionPairs','testInjectedPairs','conflictingStoredStatusPairs','unexpectedFields'])assert.equal(comparison[key],0,key);
assert.ok(Object.values(comparison.rejectedRetainedRecords).every(n=>n===0));
const counted={ExaSearchBot:0,AhrefsBot:0},references=new Set(),ids=new Set();
for(let index=0;index<input.trials.length;index++){
 const trial=input.trials[index],local=native.results[index],independent=reference.rows[index];assert.equal(local.variant,trial.variant);assert.equal(independent.variant,trial.variant);assert.equal(local.vendor,trial.vendor);
 for(const result of [local.historical,local.current]){assert.equal(result.status,trial.variant==='changed-authority'?'unverified':'verified');assert.equal(result.reason,trial.variant==='changed-authority'?'signature-invalid':null);}
 assert.equal(independent.error,trial.variant==='changed-authority'?'InvalidSignature':null);assert.equal(independent.returnedResults,trial.variant==='changed-authority'?null:1);
 if(trial.variant!=='original')continue;
 // Header-name case can differ between native JSON and Fetch Headers. Use the
 // unique original time+URL+method first, then compare canonical header pairs.
 const candidates=chains.filter(row=>row.$metadata.type==='cf-worker-event'&&row.timestamp===trial.now&&row.$workers.event.request.url===trial.url&&row.$workers.event.request.method===trial.method);
 assert.equal(candidates.length,1);const request=candidates[0].$workers.event.request;
 assert.deepEqual([...new Headers(request.headers)],[...new Headers(trial.headers)]);
 const ref=candidates[0].$metadata.requestId;assert.equal(references.has(ref),false);references.add(ref);
 const stored=chains.filter(row=>row.$metadata.requestId===ref&&row.source?.message==='analytics.observation_stored');assert.equal(stored.length,1);
 const copy=copies.filter(row=>row.$metadata.requestId===ref);assert.equal(copy.length,1);assert.ok(isDeepStrictEqual(copy[0],stored[0]));
 const id=stored[0].source.storage.observationId;assert.equal(ids.has(id),false);ids.add(id);
 const rows=query[0].results.filter(row=>row.privateReference===id);assert.equal(rows.length,1);const row=rows[0],evidence=JSON.parse(row.signatureEvidence),classification=JSON.parse(row.classificationEvidence);
 assert.equal(row.collectionVersion,'2026-10-28.10');assert.equal(evidence.verifierProfile,'2026-10-28.7');assert.equal(row.ownerFlag,0);assert.equal(row.optionalCaptureAbsent,1);
 assert.equal(row.signatureAgent,trial.vendor==='exa'?'https://crawler.exa.ai':'https://ahrefs.com');assert.equal(new URL(trial.url).pathname,row.path);
 assert.deepEqual(analyzeTraffic(new Headers(trial.headers).get('user-agent')).declarations.candidates,classification.declarations.candidates);
 assert.deepEqual(local.historical.coverage.covered,evidence.coverage.covered);assert.deepEqual(local.current.coverage.covered,evidence.coverage.covered);
 assert.deepEqual(local.historical.coverage.selection,evidence.coverage.selection);assert.deepEqual(local.current.coverage.selection,evidence.coverage.selection);
 assert.equal(evidence.native.verifiedBot,null);assert.equal(evidence.native.signedAgent,null);counted[row.agentName]++;
}
assert.deepEqual(counted,{ExaSearchBot:51,AhrefsBot:1});assert.equal(references.size,52);assert.equal(ids.size,52);
const result={checkedAt:new Date().toISOString(),scope:'All 52 included verified outcomes in the frozen Research 64 ID span; no whole-history or wire-completeness claim',preflight:pre,
 exactD1ProjectionPairs:52,independentReceiptCopies:52,currentNameParsingMatchesStored:52,historicalAndCurrentReplayOriginals:52,contextsPerRuntimePerProfile:156,independentRfcContexts:156,
 storedComparison:comparison,declaredNames:counted,historicalProfile:native.historicalProfile,currentProfile:native.currentProfile,historicalSourceCommit:native.historicalCommit,
 historicalSnapshotIsDeployedByteAttestation:false,reuse:native.reuse,
 metering:{controlReads:0,dataReads:104,writes:0,statements:2,providerAttempts:2,uiAndExportCost:'not-returned'},
 sourceCommitments:{preflight:hash(readFileSync(prefix+'preflight-final.json')),native:hash(readFileSync(prefix+'native.json')),reference:hash(readFileSync(prefix+'reference.json')),readPlan:hash(readFileSync(prefix+'read-plan.json'))},
 old52InputAndReplayGapClosed:true,originalDirectorySnapshotRecovered:false,managedVerifierAgreementMeasured:false,humanTriggerOrActualUseEstablished:false,
 optionalCaptureAbsent:52,newProductionObservationRequests:0,newHumanLabels:0,
 limits:['A later directory capture does not reconstruct original resolver state.','Repository snapshot carrying the recorded profile is not an attestation of each deployed Worker byte.','Authority-only signatures leave request role and resource unauthenticated.','Separate publication verification made one collection-ineligible .md GET; no new data observation was requested.']};
writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({exactProjectionPairs:52,recordedAndCurrentOriginalReplays:52,reads:104,writes:0}));
