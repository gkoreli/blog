import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {SIGNATURE_DEADLINE_MS} from '../../../../analytics/.test-dist/index.js';

const[chainPath,tracePath,output,duckChainPath,duckTracePath]=process.argv.slice(2);assert.ok(output);
const h=v=>createHash('sha256').update(v).digest('hex'),chain=JSON.parse(readFileSync(chainPath)),trace=JSON.parse(readFileSync(tracePath));
function inspect(records,chain,origin='https://crawler.exa.ai'){
 assert.ok(Array.isArray(records)&&records.length>0&&records.length<=64);
 const receipt=chain.filter(r=>r.source?.message==='analytics.observation_stored');assert.equal(receipt.length,1);
 const invocation=chain.filter(r=>r.$metadata?.type==='cf-worker-event');assert.equal(invocation.length,1);
 const attempt=chain.filter(r=>r.source?.message==='analytics.observation_attempt');assert.equal(attempt.length,1);
 const traceId=receipt[0].$metadata.traceId;assert.ok(typeof traceId==='string'&&traceId.length>0);
 assert.equal(new Set(records.map(r=>r.$metadata.id)).size,records.length);
 for(const record of records){assert.equal(record.$metadata.traceId,traceId);assert.notEqual(record.$workers?.truncated,true);assert.notEqual(record.$cloudflare?.truncated,true);}
 const stored=records.filter(r=>r.source?.message==='analytics.observation_stored');assert.deepEqual(stored,receipt);
 const spans=records.filter(r=>r.$metadata.type==='span');assert.ok(spans.length>0);
 for(const {source:s,$metadata:m}of spans){
  assert.equal(s.traceId,traceId);assert.equal(s.spanId,m.spanId);assert.equal(s.faas.version,invocation[0].$workers.scriptVersion.id);
  for(const key of ['startTime','endTime','durationMS'])assert.ok(Number.isSafeInteger(s[key])&&s[key]>=0);
  assert.ok(typeof m.startTimeNs==='string'&&/^[0-9]{1,24}$/.test(m.startTimeNs));
  assert.ok(typeof m.endTimeNs==='string'&&/^[0-9]{1,24}$/.test(m.endTimeNs));
  const start=BigInt(m.startTimeNs),end=BigInt(m.endTimeNs);assert.ok(end>=start);
  assert.equal(Number(start/1000000n),s.startTime);assert.equal(Number(end/1000000n),s.endTime);
  assert.equal(Number((end-start)/1000000n),s.durationMS);
 }
 const root=spans.filter(r=>r.source.spanId===receipt[0].$metadata.spanId);assert.equal(root.length,1);
 const directories=spans.filter(r=>r.source.name==='fetch'&&r.source.url?.full===origin+'/.well-known/http-message-signatures-directory');assert.equal(directories.length,1);
 const directory=directories[0].source;assert.equal(directory.parentSpanId,root[0].source.spanId);
 assert.equal(directory.http.request.method,'GET');assert.ok(directory.startTime>=Date.parse(attempt[0].timestamp));
 const writes=spans.filter(r=>r.source.name==='d1_run');assert.equal(writes.length,1);const write=writes[0].source;
 assert.equal(write.parentSpanId,root[0].source.spanId);assert.ok(write.startTime>=directory.endTime);
 assert.equal(write.endTime,Date.parse(receipt[0].timestamp));
 const timeout=origin==='https://crawler.exa.ai';
 assert.equal(receipt[0].source.receipt.signature.reason,timeout?'verification-timeout':'signature-invalid');
 if(timeout){assert.equal(directory.startTime,Date.parse(attempt[0].timestamp));assert.equal(directory.durationMS,SIGNATURE_DEADLINE_MS);assert.equal(directory.endTime,write.startTime);}
 else{assert.ok(directory.durationMS<SIGNATURE_DEADLINE_MS);assert.equal(directory.http.response.status_code,200);}
 return{exportedTraceRecords:records.length,selectedSpans:spans.length,uniqueRecordIds:true,exactReceiptCopy:true,traceAndParentAndWorkerLinks:true,
  directoryFetchMs:directory.durationMS,directoryEndpointDifferenceMs:directory.endTime-directory.startTime,
  directoryNanosecondDifference:(BigInt(directories[0].$metadata.endTimeNs)-BigInt(directories[0].$metadata.startTimeNs)).toString(),
  directoryFetchStartsAtAttempt:directory.startTime===Date.parse(attempt[0].timestamp),directoryFetchEndsAtWriteStart:directory.endTime===write.startTime,
  recordedHttpResponseCode:directory.http.response?.status_code??null,directorySpanStatus:directories[0].$metadata.spanStatus,
  followingD1SpanMs:write.durationMS,rootSpanMs:root[0].source.durationMS,
  invocationWallTimeMs:invocation[0].$workers.wallTimeMs,
  interpretation:timeout?'The retained key-directory fetch spans the configured verification deadline and precedes persistence. The wait is located at directory retrieval; transport or remote-service cause remains unknown.':'The retained key-directory fetch records HTTP 200 within the deadline, followed by a stored signature-invalid outcome. The original response body and cryptographic-failure cause remain unknown.',
  nativeManagedSignatureVerdict:'unavailable',originalWireValidity:'not-established'};
}
const accepted=inspect(trace,chain),controls=[];
for(const condition of ['trace-mismatch','wrong-parent','wrong-worker','duration-mismatch','duplicate-record','missing-directory-span']){
 const copy=structuredClone(trace),span=copy.find(r=>r.source?.url?.full==='https://crawler.exa.ai/.well-known/http-message-signatures-directory');
 if(condition==='trace-mismatch')span.$metadata.traceId='offline-wrong-trace';
 if(condition==='wrong-parent')span.source.parentSpanId='offline-wrong-parent';
 if(condition==='wrong-worker')span.source.faas.version='offline-wrong-worker';
 if(condition==='duration-mismatch')span.source.durationMS++;
 if(condition==='duplicate-record')copy.push(copy[0]);
 if(condition==='missing-directory-span')copy.splice(copy.indexOf(span),1);
 assert.throws(()=>inspect(copy,chain));controls.push({condition,rejected:true});
}
let duck=null;
if(duckChainPath||duckTracePath){assert.ok(duckChainPath&&duckTracePath);
 const duckChain=JSON.parse(readFileSync(duckChainPath)),duckTrace=JSON.parse(readFileSync(duckTracePath));
 duck={...inspect(duckTrace,duckChain,'https://bot.duckduckgo.com'),chainSha256:h(readFileSync(duckChainPath)),traceSha256:h(readFileSync(duckTracePath))};
}
const result={checkedAt:new Date().toISOString(),sourceBaseline:'16c8bd8',scriptSha256:h(readFileSync(new URL(import.meta.url))),
 chainSha256:h(readFileSync(chainPath)),traceSha256:h(readFileSync(tracePath)),accepted,duck,negativeControls:controls,
 collectorSourceSha256:h(readFileSync('packages/analytics/src/index.ts')),configuredDeadlineMs:SIGNATURE_DEADLINE_MS,
 limits:['Exact retained trace, not a claim of complete tracing or independent wire capture.',
  'No HTTP response code in the export does not establish absence of an original response.',
  'Span status unset is not success. Root-span duration and invocation wall time differ; no cause or equivalence is inferred.',
  'The successful offline replay does not replace the original timeout outcome.'],newOwnSiteRequests:0,d1Statements:0,humanLabels:0};
writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify(accepted));
