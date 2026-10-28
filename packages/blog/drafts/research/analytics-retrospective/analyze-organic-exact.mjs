import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { reconcileReceiptStorage } from './reconcile-receipt-storage.mjs';
import { reconcileInvocations } from './reconcile-organic-exa.mjs';
import { verifyWebBotAuth, createWebBotAuthCache } from '../../../../analytics/.test-dist/webbotauth.js';
import { nativeCategoryEvidence } from '../../../../analytics/.test-dist/native-bot-evidence.js';
import { VERIFIER_PROFILE_VERSION } from '../../../../analytics/.test-dist/versions.js';

const directoryUrl='https://crawler.exa.ai/.well-known/http-message-signatures-directory';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const add=(counts,key)=>{counts[key]=(counts[key]??0)+1;};
/** Exa-only analysis of selected retained observations. Exact references and
 * recorded-time replay are different gates; neither authenticates human intent. */
export async function analyzeOrganicExact(candidates,chainRows,receiptRows,directoryBytes,capture) {
  assert.ok(Array.isArray(candidates)&&candidates.length>0,'No candidates for positive exact-chain assessment');
  const comparison=reconcileReceiptStorage(candidates,chainRows);
  assert.equal(comparison.identicalProjectionPairs,candidates.length,'Incomplete receipt/storage projection');
  assert.equal(comparison.storedLocalVerifiedPairs,candidates.length,'Stored evidence is not uniformly detailed local verification');
  for(const key of ['invalidCandidateReferences','unavailableReceiptReferences','invalidReceiptReferences','unmatchedCandidateRows','unmatchedReceiptRecords','ambiguousReferenceGroups','invalidPairMetadata','unprojectableCandidateRows','differentProjectionPairs','testInjectedPairs','conflictingStoredStatusPairs'])assert.equal(comparison[key],0,'Unaccepted receipt/storage accounting');
  assert.equal(comparison.rejectedRetainedRecords.shape+comparison.rejectedRetainedRecords.timestamp,0,'Rejected retained records');
  const reconciliation=reconcileInvocations(chainRows);
  assert.equal(reconciliation.reconciliations.length,candidates.length,'Invocation scope differs from candidate scope');
  assert.ok(reconciliation.reconciliations.every(item=>item.complete),'Incomplete native chain');
  assert.ok(capture.source===directoryUrl&&capture.responseStatus===200&&capture.sha256===hash(directoryBytes),'Unaccepted directory capture');
  assert.ok(/^20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|\+00:00)$/.test(capture.capturedAt)
    &&Number.isFinite(Date.parse(capture.capturedAt)),'Unrecognized capture time');
  assert.ok(Object.keys(capture.responseHeaders).every(name=>['content-type','cache-control','age'].includes(name)),'Unexpected replay response header');
  assert.equal(capture.responseHeaders['content-type'].split(';')[0].trim(),'application/http-message-signatures-directory+json');
  const counts={collections:{},storedVerifierProfiles:{},readerKinds:{},representations:{},replayStatus:{},nativeCategories:{},directoryPublisherStates:{},documentedVendorStates:{}};
  const identities={urls:new Set(),signatures:new Set(),signatureInputs:new Set(),requestIds:new Set(),operations:new Set()};
  let exactNativeChains=0,matchingSeparateCopies=0,replayVerified=0,coverageFlagsEqual=0,nativeFactsEqual=0,nativeBooleanAvailable=0;
  for(const item of reconciliation.reconciliations) {
    const id=item.row.$metadata.requestId;
    const stored=chainRows.filter(row=>row.$metadata?.requestId===id&&row.source?.message==='analytics.observation_stored');
    assert.equal(stored.length,1,'Ambiguous stored receipt');
    const record=stored[0],source=record.source;
    const rows=candidates.filter(row=>row.privateReference===source.storage.observationId);assert.equal(rows.length,1,'Ambiguous exact row');
    const row=rows[0],e=JSON.parse(row.signatureEvidence);
    const copies=receiptRows.filter(copy=>copy.$metadata?.id===record.$metadata.id);
    assert.ok(copies.length===1&&isDeepStrictEqual(copies[0].source,source),'Separate native copy mismatch');matchingSeparateCopies++;
    const requestData=item.row.$workers.event.request;
    const request=new Request(requestData.url,{method:requestData.method,headers:new Headers(requestData.headers)});
    assert.ok(request.method==='GET'&&new URL(request.url).pathname===row.path,'Context differs from stored selection');
    assert.ok(row.signatureAgent==='https://crawler.exa.ai','Unsupported signer cohort');
    const at=new Date(item.row.timestamp);assert.ok(Number.isFinite(at.getTime()));
    assert.ok(Date.parse(capture.capturedAt)>=at.getTime(),'Directory capture precedes selected request');
    const replay=await verifyWebBotAuth(request,{now:at,includeEvidence:true,maxAgeSeconds:86400,cache:createWebBotAuthCache(),fetcher:async url=>{
      assert.equal(String(url),directoryUrl,'Unexpected intercepted directory origin');
      return new Response(directoryBytes,{status:capture.responseStatus,headers:capture.responseHeaders});
    }});
    add(counts.replayStatus,replay.status);
    if(replay.status==='verified') {
      assert.ok(replay.agent===row.signatureAgent,'Replayed signer differs');replayVerified++;
      if(isDeepStrictEqual(replay.evidence?.covered,e.coverage.covered))coverageFlagsEqual++;
    }
    const cf=requestData.cf,management=cf?.botManagement;
    const native={verifiedBot:typeof management?.verifiedBot==='boolean'?management.verifiedBot:null,signedAgent:typeof management?.signedAgent==='boolean'?management.signedAgent:null,category:nativeCategoryEvidence(cf)};
    if(isDeepStrictEqual(native,e.native))nativeFactsEqual++;
    if(native.verifiedBot!==null||native.signedAgent!==null)nativeBooleanAvailable++;
    add(counts.nativeCategories,native.category.value??native.category.status);
    add(counts.collections,row.collectionVersion);add(counts.storedVerifierProfiles,e.verifierProfile);add(counts.readerKinds,row.readerKind);
    add(counts.representations,['html','markdown'].includes(row.representation)?row.representation:'unrecognized');
    add(counts.directoryPublisherStates,source.receipt.directoryPublication.status);add(counts.documentedVendorStates,source.receipt.signature.documentedVendorStatus);
    identities.urls.add(hash(request.url));identities.signatures.add(hash(request.headers.get('signature')??''));identities.signatureInputs.add(hash(request.headers.get('signature-input')??''));
    identities.requestIds.add(id);identities.operations.add(source.operationId);exactNativeChains++;
  }
  return {checkedAt:new Date().toISOString(),method:'Join retained native invocation/attempt/stored records by provider request and operation references, then actual returned text row references to the captured D1 rows. Compare the known v3 receipt projection; replay separately at invocation-record time with later-captured Exa keys and captured response headers.',
    replayVerifierProfile:VERIFIER_PROFILE_VERSION,directoryCaptureLaterThanRequests:true,directoryCapture:{capturedAt:capture.capturedAt,sha256:capture.sha256,source:directoryUrl},
    candidateRows:candidates.length,comparison,nativeExportIntegrity:reconciliation.integrity,exactNativeChains,matchingSeparateCopies,replayVerified,coverageFlagsEqual,nativeFactsEqual,nativeBooleanAvailable,
    cardinalities:Object.fromEntries(Object.entries(identities).map(([key,values])=>[key,values.size])),counts,
    externalReplayRequests:0,newControlRequests:0,
    limits:['Local verification in these stored rows is the dated original profile; current-profile offline replay is not organic current-profile persistence.',
      'Later keys do not reconstruct the directory or provider configuration at request time.',
      'The receipt comparison is a projection, not equality of the entire D1 row or raw log.',
      'Provider category agreement is not native cryptographic-verifier agreement.',
      'Different signatures/requests do not establish distinct people, triggers, sessions or unique agent actions.',
      'No raw request values, provider/operation/database references or signature fingerprints appear in this aggregate.']};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const [candidateFile,chainFile,receiptFile,directoryFile,captureFile,output]=process.argv.slice(2);assert.ok(output,'Provide five private inputs and a new closed output');
  const files=[candidateFile,chainFile,receiptFile,directoryFile,captureFile],bytes=files.map(file=>readFileSync(file));
  const response=JSON.parse(bytes[0]);assert.ok(Array.isArray(response)&&response.length===1&&response[0].success===true,'Unexpected D1 response');
  const result=await analyzeOrganicExact(response[0].results,JSON.parse(bytes[1]),JSON.parse(bytes[2]),bytes[3],JSON.parse(bytes[4]));
  result.inputCommitments=bytes.map(data=>({bytes:data.length,sha256:hash(data)}));
  writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({exactNativeChains:result.exactNativeChains,replayVerified:result.replayVerified,coverageFlagsEqual:result.coverageFlagsEqual,nativeBooleanAvailable:result.nativeBooleanAvailable}));
}
