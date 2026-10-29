import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {extractRequestMetadata} from '../../../../analytics/.test-dist/metadata.js';
import {analyzeTraffic} from '../../../../analytics/.test-dist/classify.js';
import {classifyReaderKind} from '../../../../analytics/.test-dist/readerkind.js';
import {classificationEvidence} from '../../../../analytics/.test-dist/classification-evidence.js';
import {fetchMetadataFields} from '../../../../analytics/.test-dist/fetch-metadata.js';
import {createReferralAssessor} from '../../../../analytics/.test-dist/referral-policy.js';
import {ACTIVE_REFERRAL_POLICY} from '../../../../analytics/.test-dist/referral-policy.generated.js';
import {projectStoredReceipt} from './reconcile-receipt-storage.mjs';

export const METADATA_CONTROL_CASES = [
 {label:'canonical',mode:'navigate',user:'?1',bits:1170,states:['valid','valid','valid','valid']},
 {label:'uppercase-mode',mode:'NAVIGATE',user:'?1',bits:1171,states:['unrecognized','valid','valid','valid']},
 {label:'valid-parameters',mode:'navigate;x=@1;y=?0',user:'?1',bits:5266,states:['valid','valid','valid','valid']},
 {label:'invalid-activation',mode:'navigate',user:'not-a-boolean',bits:2194,states:['valid','valid','valid','invalid']},
];
const reference=value=>typeof value==='string'&&/^[1-9][0-9]{0,18}$/.test(value)&&BigInt(value)<=9223372036854775807n;
/** Compare the identifier separately from the optional datacenter suffix.
 * Cloudflare does not promise global Ray uniqueness; callers must additionally
 * enforce the private marker, one-to-one membership, method, URL shape and headers. */
export function controlRay(value){
 assert.equal(typeof value,'string');const match=/^([0-9a-f]{16})(?:-[A-Z]{3})?$/.exec(value);assert.ok(match,'Unexpected Ray representation');return match[1];
}
export function compatibleControlUrl(expected,actual){
 if(expected===actual)return true;
 const url=new URL(expected);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(url.searchParams.get('analytics_check')??''))return false;
 url.searchParams.set('analytics_check','REDACTED');return url.href===actual;
}
export function matchControlEvent(plan,events,trial,response){
 assert.equal(response.label,trial.label);const ray=controlRay(response.ray);
 const matches=events.filter(event=>{try{return controlRay(new Headers(event.event?.request?.headers).get('CF-Ray'))===ray}catch{return false}});
 assert.equal(matches.length,1,'Ray correspondence must be unambiguous within this controlled capture');const event=matches[0];
 assert.equal(new Headers(event.event.request.headers).get('X-Gk-Analytics-Check'),plan.marker);assert.equal(compatibleControlUrl(trial.url,event.event.request.url),true,'Unexpected URL shape; redaction is permitted only for the known trial UUID');
 return event;
}
const columns=`CAST(id AS TEXT) AS privateReference,path,observed_at AS observedAt,referrer_state AS referrerState,referrer_host AS referrerHost,is_owner AS isOwner,collection_version AS collectionVersion,classifier_version AS classifierVersion,reader_kind AS readerKind,reader_reason AS readerReason,traffic_class AS trafficClass,agent_name AS agentName,asn,sec_fetch_mode AS secFetchMode,sec_fetch_dest AS secFetchDest,sec_fetch_site AS secFetchSite,sec_fetch_user AS secFetchUser,accepts_html AS acceptsHtml,has_accept_language AS hasAcceptLanguage,signature_status AS signatureStatus,signature_agent AS signatureAgent,classification_evidence AS classificationEvidence,signature_evidence AS signatureEvidence,vendor_ip_evidence AS vendorIpEvidence,request_evidence IS NULL AS optionalCaptureAbsent`;
export function metadataControlSql(ids){
 assert.ok(Array.isArray(ids)&&ids.length===4&&ids.every(reference)&&new Set(ids).size===4,'Four distinct exact observation references required');
 return `SELECT ${columns} FROM page_observations WHERE id IN (${ids.map(id=>`CAST('${id}' AS INTEGER)`).join(',')}) ORDER BY id;\n`;
}
export function inspectControlRequest(input){
 const request=new Request(input.url,{method:input.method,headers:input.headers});Object.defineProperty(request,'cf',{value:input.cf});
 const m=extractRequestMetadata(request),a=analyzeTraffic(m.userAgent),facts={...m,...a,observationSource:'edge',signature:{status:'absent'}};
 return {metadata:m,classification:classifyReaderKind(facts),evidence:classificationEvidence(facts,a.declarations)};
}
const fields=['secFetchMode','secFetchDest','secFetchSite','secFetchUser','acceptsHtml','hasAcceptLanguage','asn'];
/** Controlled Ray/marker/header + compatible URL + operation/storage-reference joins. This input is
 * a live tail capture, not an independently retained Workers Logs export. */
export function reconcileMetadataControls(plan,events,rows,responses){
 assert.ok(plan.operator==='controlled-curl'&&plan.humanLabels===0&&plan.trials.length===4);
 assert.ok(Array.isArray(events)&&events.length===4&&Array.isArray(rows)&&rows.length===4);
 assert.ok(Array.isArray(responses)&&responses.length===4);assert.equal(new Set(responses.map(r=>controlRay(r.ray))).size,4);
 assert.equal(new Set(plan.trials.map(t=>t.url)).size,4);assert.equal(new Set(rows.map(r=>r.privateReference)).size,4);
 const outputs=[],operationIds=new Set(),storageIds=new Set(),usedEvents=new Set();
 const assess=createReferralAssessor(ACTIVE_REFERRAL_POLICY);
 for(const [i,trial]of plan.trials.entries()){
  const condition=METADATA_CONTROL_CASES[i];assert.equal(trial.label,condition.label);
  const event=matchControlEvent(plan,events,trial,responses[i]);assert.equal(usedEvents.has(event),false);usedEvents.add(event);
  assert.equal(event.scriptName,'gkoreli-com');assert.equal(event.scriptVersion?.id,plan.workerVersion);assert.equal(event.truncated,false);assert.equal(event.outcome,'ok');assert.deepEqual(event.exceptions,[]);assert.equal(event.event.response.status,200);
  const input=event.event.request;assert.equal(input.method,'GET');const actualHeaders=new Headers(input.headers);
  for(const [name,value]of Object.entries(trial.headers))assert.equal(actualHeaders.get(name),value,'Planned header differs at native receiver: '+name);
  assert.equal(actualHeaders.get('X-Gk-Analytics-Check'),plan.marker);
  const messages=event.logs.map(log=>log.message);const attempts=messages.filter(m=>m[0]==='analytics.observation_attempt'),stores=messages.filter(m=>m[0]==='analytics.observation_stored');assert.equal(attempts.length,1);assert.equal(stores.length,1);assert.equal(messages.some(m=>m[0]==='analytics.observation_write_failed'),false);
  const attempt=attempts[0][1],stored=stores[0][1];assert.equal(attempt.operationId,stored.operationId);assert.equal(typeof stored.operationId,'string');assert.equal(operationIds.has(stored.operationId),false);operationIds.add(stored.operationId);assert.equal(stored.collectionVersion,'2026-10-29.6');assert.equal(attempt.collectionVersion,stored.collectionVersion);
  assert.equal(stored.storage.version,'2026-10-27.1');assert.equal(stored.storage.status,'returned');const id=stored.storage.observationId;assert.ok(reference(id));assert.equal(storageIds.has(id),false);storageIds.add(id);
  const row=rows.find(row=>row.privateReference===id);assert.ok(row);assert.equal(row.path,'/privacy');assert.equal(row.isOwner,0);assert.equal(row.referrerState,'external');assert.equal(row.referrerHost,'traffic2cash.xyz');assert.equal(assess(row.referrerHost).action,'exclude');assert.equal(row.optionalCaptureAbsent,1);assert.equal(row.collectionVersion,'2026-10-29.6');assert.equal(row.classifierVersion,'2026-10-29.3');assert.equal(row.agentName,null);assert.equal(row.trafficClass,'browser');assert.equal(row.signatureStatus,null);assert.equal(row.signatureAgent,null);
  const projection=projectStoredReceipt(row,stored.receipt.version);assert.ok(projection);assert.deepEqual(stored.receipt,projection);
  const replay=inspectControlRequest(input);for(const field of fields)assert.equal(row[field],replay.metadata[field]);assert.equal(row.readerKind,replay.classification.kind);assert.equal(row.readerReason,replay.classification.reason);assert.equal(isDeepStrictEqual(JSON.parse(row.classificationEvidence),replay.evidence),true);
  assert.equal(replay.metadata.fetchMetadataBits,condition.bits);assert.deepEqual(fetchMetadataFields(condition.bits).states,condition.states);assert.equal(stored.receipt.fetchMetadataBits,condition.bits);
  outputs.push({urlQueryRedacted:input.url!==trial.url,condition:condition.label,states:condition.states,parameters:fetchMetadataFields(condition.bits).parameters,readerKind:row.readerKind,readerReason:row.readerReason,network:replay.evidence.network,activation:replay.evidence.activation,receiptVersion:stored.receipt.version,signatureStatus:'absent',referralExcluded:true});
 }
 return {controls:outputs,exactRequestReceiptStorageChains:4,responseRayAndPrivateMarkerPairs:4,independentRetainedCopies:0,metadataComparisons:fields.length*4,fieldStateComparisons:16,operator:'controlled-curl',knownAgentControlledRequests:4,humanLabels:0,operatorAttributionDecisions:0,operatorAttributionAbstentions:4,productionPopulationErrorRate:null,scope:'Exact four controlled requests, not a population classifier rate, genuine browser/engine identity or native managed-bot agreement'};
}
