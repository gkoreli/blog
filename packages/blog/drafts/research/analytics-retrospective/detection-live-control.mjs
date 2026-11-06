import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { COLLECTION_VERSION, CLASSIFIER_VERSION, VERIFIER_PROFILE_VERSION } from '../../../../analytics/.test-dist/versions.js';
import { CLIENT_REGISTRY, CLIENT_REGISTRY_PROFILE } from '../../../../analytics/.test-dist/client-registry.js';
import { RETAINED_CLIENT_PRODUCT_PROFILE, RETAINED_CLIENT_PRODUCTS_20261106, retainedMatchedProducts } from '../../../../analytics/.test-dist/retained-client-products.js';
import { analyzeTraffic } from '../../../../analytics/.test-dist/classify.js';
import { extractRequestMetadata } from '../../../../analytics/.test-dist/metadata.js';
import { classifyReaderKind } from '../../../../analytics/.test-dist/readerkind.js';
import { classificationEvidence } from '../../../../analytics/.test-dist/classification-evidence.js';
import { verificationEvidence } from '../../../../analytics/.test-dist/signature-evidence.js';
import { storedObservationReceipt } from '../../../../analytics/.test-dist/observation-receipt.js';
import { isObservationId } from '../../../../analytics/.test-dist/observation-storage.js';
import { isNativeBotCategory } from '../../../../analytics/.test-dist/native-bot-evidence.js';
import { VENDOR_IP_PROFILE } from '../../../../analytics/.test-dist/vendor-ip.js';
import { VENDOR_IP_SOURCES } from '../../../../analytics/.test-dist/vendor-ip-sources.js';
import { ACTIVE_REFERRAL_POLICY } from '../../../../analytics/.test-dist/referral-policy.generated.js';
import { createReferralAssessor } from '../../../../analytics/.test-dist/referral-policy.js';

export const DETECTION_CONTROL_PROFILE = '2026-11-06.1';
export const CONTROL_PROFILE_LABELS = Object.freeze(['cubot','uri-negative','gpt-positive','seo-name','http-name','all-products']);
export const DETECTION_CONTROL_LIMITS = Object.freeze({trials:6,attemptsPerTrial:1,maximumWindowMs:900000,readReviewThreshold:100,maximumStatements:1,databaseEnforcedReadCap:false});
const uuid4 = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(value);
const sha = value => createHash('sha256').update(value).digest('hex');
const hash = value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const exact = (value, expected) => assert.deepEqual(value, expected);
const stamp = value => {
  assert.equal(typeof value,'string');assert.match(value,/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/);
  const ms=Date.parse(value.replace(' ','T')+'Z');assert.ok(Number.isFinite(ms));assert.equal(new Date(ms).toISOString().slice(0,19).replace('T',' '),value);return ms;
};
const iso = value => {assert.equal(typeof value,'string');const ms=Date.parse(value);assert.ok(Number.isFinite(ms));assert.equal(new Date(ms).toISOString(),value);return ms;};
function currentProducer() {
  for(const profile of [COLLECTION_VERSION,CLASSIFIER_VERSION,CLIENT_REGISTRY_PROFILE,RETAINED_CLIENT_PRODUCT_PROFILE])assert.equal(profile,DETECTION_CONTROL_PROFILE,'Explicit current-producer adapter requires review');
  assert.equal(CLIENT_REGISTRY.length,63);assert.equal(RETAINED_CLIENT_PRODUCTS_20261106.length,74);
}
function definitions() {
  currentProducer();
  return [
    ['cubot','Mozilla/5.0 (Linux; Android 6.0; CUBOT MAX) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Mobile Safari/537.36'],
    ['uri-negative','Mozilla/5.0 Chrome/150.0 Safari/537.36 (+https://example.test/;GPTBot/1.0)'],
    ['gpt-positive','GPTBot/1.0'],
    ['seo-name','Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)'],
    ['http-name','node-fetch'],
    ['all-products',RETAINED_CLIENT_PRODUCTS_20261106.join(' ')],
  ].map(([label,userAgent])=>({label,userAgent,userAgentSha256:sha(userAgent)}));
}

/** Private plan input contains no owner credential. Source association and
 * settings ownership are external evidence, not established by a supplied hash.
 * The fixed cutoff bounds this SELECT; when still future, counts describe the
 * SELECT observation, not completeness of the unelapsed interval.
 */
export function createDetectionControlPlan(input) {
  currentProducer();assert.ok(object(input));
  const origin=new URL(input.origin);assert.equal(origin.protocol,'https:');assert.equal(origin.origin,input.origin);assert.equal(origin.pathname,'/');
  assert.ok(uuid(input.workerVersion));assert.match(input.marker,/^[A-Za-z0-9][A-Za-z0-9_-]{15,95}$/);
  assert.ok(hash(input.sourceSha256));assert.match(input.sourceCommit,/^[0-9a-f]{40}$/);
  const start=stamp(input.start),cutoff=stamp(input.cutoff);assert.ok(cutoff>start&&cutoff-start<=DETECTION_CONTROL_LIMITS.maximumWindowMs);assert.equal(input.start.slice(0,10),input.cutoff.slice(0,10),'Do not cross UTC midnight');
  assert.ok(Array.isArray(input.trialIds)&&input.trialIds.length===6&&input.trialIds.every(uuid4)&&new Set(input.trialIds).size===6);
  if(input.referralPolicySha256!==undefined){assert.equal(input.referralPolicySha256,ACTIVE_REFERRAL_POLICY.sha256);assert.equal(createReferralAssessor(ACTIVE_REFERRAL_POLICY)('traffic2cash.xyz').action,'exclude');}
  return {version:DETECTION_CONTROL_PROFILE,operator:'controlled-curl',humanLabels:0,origin:input.origin,scriptName:'gkoreli-com',workerVersion:input.workerVersion,marker:input.marker,
    sourceCommit:input.sourceCommit,sourceSha256:input.sourceSha256,start:input.start,cutoff:input.cutoff,
    ...(input.referralPolicySha256===undefined?{}:{referralPolicySha256:input.referralPolicySha256}),
    collectionVersion:COLLECTION_VERSION,classifierVersion:CLASSIFIER_VERSION,verifierProfile:VERIFIER_PROFILE_VERSION,
    allProductsSha256:sha(RETAINED_CLIENT_PRODUCTS_20261106.join(' ')),
    trials:definitions().map((d,i)=>({...d,id:input.trialIds[i],url:`${input.origin}/analytics-check/${input.trialIds[i]}`,method:'GET',attempts:1,
      headers:{'User-Agent':d.userAgent,Accept:'text/html','Accept-Language':'en','Sec-Fetch-Mode':'navigate','Sec-Fetch-Dest':'document','Sec-Fetch-Site':'cross-site','Sec-Fetch-User':'?1','X-Gk-Analytics-Check':input.marker,
        ...(input.referralPolicySha256===undefined?{}:{Referer:'https://traffic2cash.xyz/'})}}))};
}
export function validateDetectionControlPlan(plan) {
  assert.ok(object(plan));const expected=createDetectionControlPlan({...plan,trialIds:plan.trials?.map(t=>t.id)});exact(plan,expected);return plan;
}
export function detectionControlRay(value) {
  assert.equal(typeof value,'string');const found=/^([0-9a-f]{16})(?:-[A-Z]{3})?$/.exec(value);assert.ok(found,'Invalid controlled Ray');return found[1];
}
export function compatibleDetectionControlUrl(trial,actual) {
  return actual===trial.url||actual===trial.url.replace(`/analytics-check/${trial.id}`,'/analytics-check/REDACTED');
}
function references(plan,items) {
  validateDetectionControlPlan(plan);assert.ok(Array.isArray(items)&&items.length===6);
  assert.equal(new Set(items.map(item=>item.label)).size,6);assert.equal(new Set(items.map(item=>item.observationId)).size,6);
  return plan.trials.map(trial=>{const item=items.find(item=>item.label===trial.label);assert.ok(item&&isObservationId(item.observationId),'Six distinct exact decimal-text IDs required');return {trial,id:item.observationId};});
}

/** Six requested rows survive missing observation/counter records. Contradictory
 * path/profile/owner facts are retrieved, not filtered out. No broad time scan:
 * one observation PK, one trial PK and an indexed owner/path/time count per ID.
 */
export function detectionControlReadbackQuery(plan,items) {
  const selected=references(plan,items),values=selected.flatMap(({trial,id},i)=>[i,trial.label,trial.id,id]);values.push(plan.start,plan.cutoff);
  const sql=`WITH requested(ordinal,label,trialId,requestedObservationId) AS (VALUES ${selected.map(()=>'(?,?,?,?)').join(',')}),bounds(start,cutoff) AS (VALUES (?,?))
SELECT r.*,CAST(p.id AS TEXT) AS observationId,p.path,p.observed_at AS observedAt,p.observation_source AS observationSource,
p.collection_version AS collectionVersion,p.classifier_version AS classifierVersion,p.traffic_class AS trafficClass,p.agent_name AS agentName,p.reader_kind AS readerKind,p.reader_reason AS readerReason,p.representation,p.is_owner AS isOwner,p.asn,p.asn_source AS asnSource,
p.sec_fetch_mode AS secFetchMode,p.sec_fetch_dest AS secFetchDest,p.sec_fetch_site AS secFetchSite,p.sec_fetch_user AS secFetchUser,p.accepts_html AS acceptsHtml,p.has_accept_language AS hasAcceptLanguage,p.referrer_state AS referrerState,p.referrer_host AS referrerHost,
p.signature_status AS signatureStatus,p.signature_agent AS signatureAgent,p.classification_evidence AS classificationEvidence,p.signature_evidence AS signatureEvidence,p.vendor_ip_evidence AS vendorIpEvidence,
length(CAST(p.classification_evidence AS BLOB)) AS classificationBytes,
(p.request_evidence IS NULL AND NOT EXISTS(SELECT 1 FROM page_observation_diagnostics d WHERE d.observation_id=p.id)) AS optionalCaptureAbsent,
t.condition AS trialCondition,t.operator AS trialOperator,t.expires_at AS trialExpiresAt,t.page_responses AS pageResponses,t.script AS scriptCount,t.attempt AS attemptCount,t.queued AS queuedCount,t.not_queued AS notQueuedCount,t.threw AS threwCount,t.beacon AS beaconCount,
(SELECT COUNT(*) FROM page_observations AS duplicates INDEXED BY idx_page_observations_public_path_time,bounds b WHERE duplicates.is_owner IN (0,1) AND duplicates.path='/analytics-check/'||r.trialId AND duplicates.observed_at>=b.start AND duplicates.observed_at<b.cutoff) AS trialObservationCount
FROM requested r LEFT JOIN page_observations p ON p.id=CAST(r.requestedObservationId AS INTEGER) LEFT JOIN analytics_calibration_trials t ON t.id=r.trialId ORDER BY r.ordinal`;
  return {sql,values};
}
export function detectionControlReadbackSql(plan,items) {
  const query=detectionControlReadbackQuery(plan,items);let i=0;
  const sql=query.sql.replace(/\?/g,()=>{const value=query.values[i++];return typeof value==='number'?String(value):"'"+value.replaceAll("'","''")+"'";})+';\n';assert.equal(i,query.values.length);assert.ok(Buffer.byteLength(sql)<100000);return sql;
}
function json(source,budget) {
  assert.equal(typeof source,'string');assert.ok(Buffer.byteLength(source)<=budget);const value=JSON.parse(source);assert.ok(object(value));assert.equal(JSON.stringify(value),source,'Current producer JSON must preserve canonical bytes/no duplicate keys');return value;
}
function nativeCf(evidence) {
  const n=evidence.native;assert.ok(object(n)&&object(n.category));assert.equal(n.category.version,'2026-10-27.1');
  assert.ok([n.verifiedBot,n.signedAgent].every(value=>value===null||typeof value==='boolean'));
  assert.ok(['known','empty','unavailable','unrecognized'].includes(n.category.status));
  if(n.category.status==='known')assert.ok(isNativeBotCategory(n.category.value));else assert.equal(n.category.value,null);
  return {botManagement:{...(n.verifiedBot===null?{}:{verifiedBot:n.verifiedBot}),...(n.signedAgent===null?{}:{signedAgent:n.signedAgent})},
    ...(n.category.status==='unavailable'?{}:{verifiedBotCategory:n.category.status==='known'?n.category.value:n.category.status==='empty'?'':'unrecognized-fixture'})};
}
function currentNetwork(n,names) {
  assert.equal(n.profile,VENDOR_IP_PROFILE);assert.equal(n.source,'local-vendor-ip');assert.equal(n.method,'published-ip-feed');
  const selected=VENDOR_IP_SOURCES.filter(source=>source.declarations.some(name=>names.includes(name))),mapped=new Set(selected.flatMap(source=>source.declarations.filter(name=>names.includes(name))));
  assert.equal(n.declarationCount,names.length);assert.equal(n.configuredDeclarationCount,mapped.size);assert.equal(n.unmappedDeclarationCount,names.length-mapped.size);
  exact(n.checks.map(check=>check.source),selected.map(source=>source.id));
  for(const [flag,outcome]of [['listed','listed'],['notListed','not-listed'],['unavailable','unavailable'],['notAssessed','not-assessed']])assert.equal(n.summary[flag],n.checks.some(check=>check.outcome===outcome));
}

/** Current producer only; historical projector branches remain unchanged.
 * Native values are checked as retained facts, not independently reverified.
 */
export function projectCurrentDetectionReceipt(row) {
  currentProducer();assert.equal(row.collectionVersion,COLLECTION_VERSION);assert.equal(row.classifierVersion,CLASSIFIER_VERSION);
  const c=json(row.classificationEvidence,2048),e=json(row.signatureEvidence,2048),n=json(row.vendorIpEvidence,4096);
  assert.equal(c.version,DETECTION_CONTROL_PROFILE);assert.equal(c.classifierProfile,CLASSIFIER_VERSION);
  assert.equal(c.declarations.productProfile,RETAINED_CLIENT_PRODUCT_PROFILE);assert.notEqual(retainedMatchedProducts(c),null);
  assert.equal(e.version,'2026-10-27.5');assert.equal(e.source,'local-webbotauth');assert.equal(e.verifierProfile,VERIFIER_PROFILE_VERSION);assert.equal(e.localStatus,'absent');assert.equal(e.localOutcome,'absent');
  assert.equal(row.signatureStatus,null);assert.equal(row.signatureAgent,null);currentNetwork(n,c.declarations.candidates);
  return storedObservationReceipt({readerKind:row.readerKind,signatureStatus:row.signatureStatus,signatureAgent:row.signatureAgent,classificationEvidence:c,signatureEvidence:e,vendorIpEvidence:n});
}

/** Response manifests carry exact outbound page headers and execution times,
 * never owner POST credentials. Supply raw tail invocations; unrelated paths
 * may coexist, but every marker-bearing eligible page invocation is accounted.
 */
export function reconcileDetectionControls(plan,events,rows,responses) {
  validateDetectionControlPlan(plan);assert.ok(Array.isArray(events)&&Array.isArray(rows)&&rows.length===6&&Array.isArray(responses)&&responses.length===6);
  assert.equal(new Set(rows.map(row=>row.requestedObservationId)).size,6);assert.equal(new Set(rows.map(row=>row.label)).size,6);assert.equal(new Set(responses.map(row=>row.label)).size,6);
  const relevant=events.filter(event=>{const request=event.event?.request;try{return new Headers(request?.headers).get('X-Gk-Analytics-Check')===plan.marker&&typeof request.url==='string'&&new URL(request.url).pathname.startsWith('/analytics-check/');}catch{return false;}});
  assert.equal(relevant.length,6,'Missing or extra marker-bearing page invocation');
  const operations=new Set(),ids=new Set(),used=new Set(),rays=new Set(),controls=[];
  for(const [ordinal,trial]of plan.trials.entries()) {
    const response=responses.find(item=>item.label===trial.label);assert.ok(response);exact(response.headers,trial.headers);assert.equal(response.method,'GET');assert.equal(response.url,trial.url);assert.equal(response.attempts,1);assert.equal(response.status,200);assert.ok(hash(response.bodySha256));
    const began=iso(response.startedAt),ended=iso(response.completedAt);assert.ok(began<=ended&&began>=stamp(plan.start)&&ended<stamp(plan.cutoff),'Execution outside planned window');
    const ray=detectionControlRay(response.ray);assert.equal(rays.has(ray),false);rays.add(ray);
    const matches=relevant.filter(event=>{try{return detectionControlRay(new Headers(event.event.request.headers).get('CF-Ray'))===ray;}catch{return false;}});assert.equal(matches.length,1,'Ambiguous Ray within scoped capture');
    const event=matches[0];assert.equal(used.has(event),false);used.add(event);assert.equal(event.scriptName,plan.scriptName);assert.equal(event.scriptVersion?.id,plan.workerVersion);assert.equal(event.truncated,false);assert.equal(event.outcome,'ok');exact(event.exceptions,[]);assert.equal(event.event.response.status,200);
    const input=event.event.request;assert.equal(input.method,'GET');assert.ok(compatibleDetectionControlUrl(trial,input.url));const headers=new Headers(input.headers);
    for(const [name,value]of Object.entries(trial.headers))assert.equal(headers.get(name),value,'Native receiver header differs: '+name);
    for(const forbidden of ['Purpose','Sec-Purpose','Sec-Fetch-Purpose','Signature-Agent','Signature-Input','Signature','Authorization','Cookie'])assert.equal(headers.has(forbidden),false,'Unexpected page credential/prefetch/signature');
    assert.ok(Array.isArray(event.logs));const messages=event.logs.map(log=>log.message),attempts=messages.filter(message=>message?.[0]==='analytics.observation_attempt'),stores=messages.filter(message=>message?.[0]==='analytics.observation_stored');
    assert.equal(attempts.length,1);assert.equal(stores.length,1);assert.equal(messages.some(message=>message?.[0]==='analytics.observation_write_failed'),false);
    const attempt=attempts[0][1],stored=stores[0][1];assert.ok(uuid4(stored.operationId));assert.equal(attempt.operationId,stored.operationId);assert.equal(operations.has(stored.operationId),false);operations.add(stored.operationId);assert.equal(attempt.collectionVersion,COLLECTION_VERSION);assert.equal(stored.collectionVersion,COLLECTION_VERSION);
    exact(stored.storage,{version:'2026-10-27.1',status:'returned',observationId:stored.storage.observationId});assert.ok(isObservationId(stored.storage.observationId));assert.equal(ids.has(stored.storage.observationId),false);ids.add(stored.storage.observationId);
    const row=rows.find(row=>row.label===trial.label);assert.ok(row);assert.equal(row.ordinal,ordinal);assert.equal(row.trialId,trial.id);assert.equal(row.requestedObservationId,stored.storage.observationId);assert.equal(row.observationId,stored.storage.observationId);assert.equal(row.path,new URL(trial.url).pathname);assert.equal(row.isOwner,1);assert.equal(row.observationSource,'edge');assert.equal(row.representation,'html');assert.equal(row.optionalCaptureAbsent,1);
    assert.equal(row.pageResponses,1);assert.equal(row.trialObservationCount,1);assert.equal(row.trialCondition,'http-client');assert.equal(row.trialOperator,'controlled-curl');assert.ok(stamp(row.trialExpiresAt)>stamp(plan.cutoff));for(const key of ['scriptCount','attemptCount','queuedCount','notQueuedCount','threwCount','beaconCount'])assert.equal(row[key],0);
    assert.ok(stamp(row.observedAt)>=stamp(plan.start)&&stamp(row.observedAt)<stamp(plan.cutoff));assert.ok(row.asn===null||Number.isInteger(row.asn)&&row.asn>0&&row.asn<4294967295);assert.equal(row.asnSource,row.asn===null?null:'request');
    const c=json(row.classificationEvidence,2048),e=json(row.signatureEvidence,2048);assert.equal(row.classificationBytes,Buffer.byteLength(row.classificationEvidence));
    const request=new Request(trial.url,{method:'GET',headers});const cf=nativeCf(e);Object.defineProperty(request,'cf',{value:{...cf,asn:row.asn}});
    const m=extractRequestMetadata(request),analysis=analyzeTraffic(m.userAgent),facts={...m,...analysis,observationSource:'edge',signature:{status:'absent'}};
    if(input.cf&&Object.hasOwn(input.cf,'asn'))assert.equal(input.cf.asn,row.asn);
    for(const field of ['secFetchMode','secFetchDest','secFetchSite','secFetchUser','acceptsHtml','hasAcceptLanguage','referrerState','referrerHost'])assert.equal(row[field],m[field]);
    exact(c,classificationEvidence(facts,analysis.declarations));exact(e,verificationEvidence(request,{status:'absent'},false,analysis.declarations.candidates));
    assert.equal(row.trafficClass,analysis.trafficClass);assert.equal(row.agentName,analysis.agentName);const kind=classifyReaderKind(facts);assert.equal(row.readerKind,kind.kind);assert.equal(row.readerReason,kind.reason);
    exact(retainedMatchedProducts(c),analysis.declarations.matchedProducts);exact(stored.receipt,projectCurrentDetectionReceipt(row));
    if(trial.label==='all-products'){assert.equal(c.declarations.candidates.length,63);assert.equal(c.declarations.status,'multiple');exact(retainedMatchedProducts(c),[...RETAINED_CLIENT_PRODUCTS_20261106].sort());assert.equal(row.readerKind,'unresolved');assert.equal(row.readerReason,'multiple-client-declarations');}
    if(['cubot','uri-negative'].includes(trial.label)){assert.equal(row.trafficClass,'browser');assert.equal(row.agentName,null);exact(c.declarations.candidates,[]);assert.notEqual(row.readerReason,'generic-bot');}
    controls.push({label:trial.label,readerKind:row.readerKind,readerReason:row.readerReason,canonicalCandidates:c.declarations.candidates.length,matchedProducts:retainedMatchedProducts(c).length,classificationBytes:row.classificationBytes,permanentOwnerExclusion:true,urlUuidRedacted:input.url!==trial.url});
  }
  return {profile:DETECTION_CONTROL_PROFILE,controls,exactChains:6,knownControlledRequests:6,humanLabels:0,optionalCaptures:0,operatorAttribution:'not-implemented',nativeIdentityAgreement:'not-assessed',window: {start:plan.start,cutoff:plan.cutoff,meaning:'Counts observed by the single readback SELECT within these bounds; no completeness claim for unelapsed time.'},scope:'Six supplied curl controls with exact execution/tail/acknowledgement/row/counter linkage; not genuine vendor traffic, operator identification or population accuracy.'};
}
