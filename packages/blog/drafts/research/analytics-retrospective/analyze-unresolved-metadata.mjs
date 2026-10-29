import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {existsSync} from 'node:fs';
import {extractRequestMetadata} from '../../../../analytics/.test-dist/metadata.js';
import {analyzeTraffic} from '../../../../analytics/.test-dist/classify.js';
import {classifyReaderKind,claimsFetchMetadataBrowser} from '../../../../analytics/.test-dist/readerkind.js';
import {classificationEvidence} from '../../../../analytics/.test-dist/classification-evidence.js';
import {reconcileReceiptStorage} from './reconcile-receipt-storage.mjs';

const metadataKeys=['path','secFetchMode','secFetchDest','secFetchSite','secFetchUser','acceptsHtml','hasAcceptLanguage','asn','referrerState','referrerHost'];
const evidenceKeys=['declarations','network','navigationShaped','activation','referrerContext','categoryAgreement'];
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const add=(counts,key)=>{counts[key]=(counts[key]??0)+1};
const group=(rows,key)=>{const groups=new Map();for(const row of rows){const k=key(row);groups.set(k,[...groups.get(k)??[],row])}return groups};
const hash=v=>createHash('sha256').update(v).digest('hex');

/** Current-code replay of a retained context, never an original-wire or human verdict.
 * Owner settings and the historical public-path registry are not reconstructed. */
export function inspectMetadata(input){
 const request=new Request(input.url,{method:input.method,headers:input.headers});
 Object.defineProperty(request,'cf',{value:input.cf});
 const m=extractRequestMetadata(request,undefined),a=analyzeTraffic(m.userAgent);
 const facts={...m,...a,observationSource:'edge',signature:{status:'absent'}};
 const c=classificationEvidence(facts,a.declarations),metadata={};
 for(const key of ['path','secFetchMode','secFetchDest','secFetchSite','secFetchUser','acceptsHtml','hasAcceptLanguage','asn','referrerState','referrerHost'])metadata[key]=m[key];
 return{metadata,classification:classifyReaderKind(facts),evidence:{declarations:c.declarations,network:c.network,navigationShaped:c.navigationShaped,activation:c.activation,referrerContext:c.referrerContext,categoryAgreement:c.categoryAgreement},claimsMetadataSupport:claimsFetchMetadataBrowser(m.userAgent)};
}

/** Quarantine global log-ID collisions until an independently selected native
 * group reproduces the entire chain with locally unique IDs. Never deduplicate.
 * Exact storage/request/operation IDs establish correspondence; time/path do not. */
export function reconcileUnresolved(candidates,copies,chains,recaptures=[]){
 assert.ok(Array.isArray(candidates)&&candidates.length>0&&candidates.length<=128);
 assert.ok(Array.isArray(copies)&&copies.length<=1024&&Array.isArray(chains)&&chains.length<=1024);
 assert.ok(Array.isArray(recaptures)&&recaptures.length<=128&&recaptures.every(r=>Array.isArray(r)&&r.length>0&&r.length<=8));
 const C=group(candidates,r=>r.privateReference),G=group(chains,r=>r.$metadata?.requestId),ids=group(chains,r=>r.$metadata?.id);
 assert.equal(C.size,candidates.length);assert.ok(candidates.every(r=>typeof r.privateReference==='string'&&r.readerKind==='unresolved'));
 const stored=chains.filter(r=>r.source?.message==='analytics.observation_stored'),S=group(stored,r=>r.source?.storage?.observationId);
 const copiesByStorage=group(copies,r=>r.source?.storage?.observationId);
 const fresh=group(recaptures,r=>r[0]?.$metadata?.requestId);
 const accepted=[],rejected=[],seenRequests=new Set();
 for(const row of candidates){
  const stores=S.get(row.privateReference)??[];
  if(stores.length!==1){rejected.push({reference:row.privateReference,reason:stores.length?'ambiguous-stored-record':'stored-record-unavailable'});continue}
  const receipt=stores[0],requestId=receipt.$metadata?.requestId;
  let scope=G.get(requestId)??[],collisionResolved=false;
  const reject=reason=>rejected.push({reference:row.privateReference,reason});
  if(typeof requestId!=='string'||!requestId||seenRequests.has(requestId)){reject('invalid-request-identity');continue}
  seenRequests.add(requestId);
  if(scope.some(r=>typeof r.$metadata?.id!=='string'||!r.$metadata.id||ids.get(r.$metadata.id)?.length!==1)){
   const captures=fresh.get(requestId)??[],capture=captures[0];
   const ordered=rows=>rows.toSorted((a,b)=>String(a.$metadata?.id).localeCompare(String(b.$metadata?.id)));
   if(captures.length!==1||!capture.every(r=>r.$metadata?.requestId===requestId&&typeof r.$metadata?.id==='string'&&r.$metadata.id)
    ||new Set(capture.map(r=>r.$metadata.id)).size!==capture.length||!isDeepStrictEqual(ordered(capture),ordered(scope))){reject('colliding-or-missing-log-identity');continue}
   scope=capture;collisionResolved=true;
  }
  if(scope.some(r=>r.$workers?.truncated===true||r.$cloudflare?.truncated===true)){reject('truncated-context');continue}
  const invocations=scope.filter(r=>r.$metadata?.type==='cf-worker-event'),logs=scope.filter(r=>r.$metadata?.type==='cf-worker');
  const attempts=logs.filter(r=>r.source?.message==='analytics.observation_attempt');
  const writes=logs.filter(r=>r.source?.message==='analytics.observation_stored');
  if(invocations.length!==1||attempts.length!==1||writes.length!==1||logs.some(r=>r.source?.message==='analytics.observation_write_failed')){reject('incomplete-chain');continue}
  if([invocations[0],...logs].some(r=>r.$workers?.scriptName!=='gkoreli-com'||r.$workers?.scriptVersion?.id!==invocations[0].$workers.scriptVersion?.id)
   ||typeof attempts[0].source.operationId!=='string'||!attempts[0].source.operationId
   ||attempts[0].source.operationId!==receipt.source.operationId||attempts[0].source.collectionVersion!==row.collectionVersion
   ||receipt.source.collectionVersion!==row.collectionVersion||!Number.isFinite(Date.parse(attempts[0].timestamp))
   ||Date.parse(attempts[0].timestamp)>Date.parse(receipt.timestamp)){reject('incoherent-chain');continue}
  const copy=copiesByStorage.get(row.privateReference)??[];
  if(copy.length!==1||!isDeepStrictEqual(copy[0],receipt)){reject('receipt-copy-difference');continue}
  const pairing=reconcileReceiptStorage([row],scope);
  if(pairing.identicalProjectionPairs!==1||pairing.invalidPairMetadata||pairing.differentProjectionPairs){reject('stored-projection-difference');continue}
  const request=invocations[0].$workers?.event?.request;
  if(!object(request)||typeof request.url!=='string'||typeof request.method!=='string'||!object(request.headers)||!object(request.cf)
   ||!Object.values(request.headers).every(v=>typeof v==='string')||new URL(request.url).pathname!==row.path
   ||JSON.parse(row.signatureEvidence).localStatus!=='absent'){reject('unusable-request-context');continue}
  const replay=inspectMetadata(request),c=JSON.parse(row.classificationEvidence);
  const differences=metadataKeys.filter(k=>JSON.stringify(replay.metadata[k])!==JSON.stringify(row[k]));
  differences.push(...evidenceKeys.filter(k=>JSON.stringify(replay.evidence[k])!==JSON.stringify(c[k])).map(k=>'evidence.'+k));
  if(replay.classification.kind!==row.readerKind||replay.classification.reason!==row.readerReason)differences.push('current-reader-classification');
  if(differences.length){rejected.push({reference:row.privateReference,reason:'current-replay-difference',fields:differences});continue}
  accepted.push({row,request,replay,invocationTimestamp:invocations[0].timestamp,scopeRecords:scope.length,collisionResolved});
 }
 return{accepted,rejected,globalDuplicateLogIdGroups:[...ids.values()].filter(v=>v.length>1).length};
}

function summarize(result){
 const counts={storedReasons:{},browserFamilyClaims:{},claimedMetadataSupport:{},requestUrlScheme:{},forwardedProtoClaim:{},retainedTlsVersion:{},retainedHttpProtocol:{},headerPresence:{},referrerState:{},classifierProfiles:{},internalReferrerRegistryComparison:{}};
 const headerNames=['sec-fetch-mode','sec-fetch-dest','sec-fetch-site','sec-fetch-user'];
 for(const item of result.accepted){const{row,request,replay}=item,h=new Headers(request.headers);
  add(counts.storedReasons,row.readerReason);add(counts.browserFamilyClaims,replay.evidence.declarations.browserFamily);
  add(counts.claimedMetadataSupport,String(replay.claimsMetadataSupport));add(counts.requestUrlScheme,new URL(request.url).protocol);
  add(counts.forwardedProtoClaim,['http','https'].includes(h.get('x-forwarded-proto'))?h.get('x-forwarded-proto'):'other-or-absent');
  add(counts.retainedTlsVersion,['TLSv1.2','TLSv1.3','none','off'].includes(request.cf.tlsVersion)?request.cf.tlsVersion:'other-or-unavailable');
  add(counts.retainedHttpProtocol,['HTTP/1.0','HTTP/1.1','HTTP/2','HTTP/3'].includes(request.cf.httpProtocol)?request.cf.httpProtocol:'other-or-unavailable');
  for(const name of headerNames)add(counts.headerPresence,name+':'+(h.has(name)?'present':'absent'));
  add(counts.referrerState,row.referrerState);add(counts.classifierProfiles,row.classifierVersion);
  const ref=h.get('referer'),needsRegistry=ref!==null&&replay.metadata.referrerState==='internal'&&new URL(ref).pathname.replace(/\/+$/,'')!=='';
  add(counts.internalReferrerRegistryComparison,needsRegistry?'unassessed-historical-registry':'registry-independent-null');
 }
 const rejectedReasons={};for(const row of result.rejected)add(rejectedReasons,row.reason);
 return{candidateRows:result.accepted.length+result.rejected.length,acceptedExactContexts:result.accepted.length,rejectedReasons,
  collisionsResolvedByIndependentExactQuery:result.accepted.filter(r=>r.collisionResolved).length,
  globalDuplicateLogIdGroups:result.globalDuplicateLogIdGroups,counts,metadataComparisonsPerContext:metadataKeys.length,evidenceComparisonsPerContext:evidenceKeys.length,
  rawUserAgentStoredInPublicOutput:false,ownerSettingReplayed:false,historicalPublicPathRegistryRecovered:false,
  originalWireHeaderAbsenceEstablished:false,actualBrowserEnginesEstablished:false,botOrHumanTruthEstablished:false};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const[root,output,replayOutput]=process.argv.slice(2);assert.ok(replayOutput);
 const read=name=>{const bytes=readFileSync(root+'/'+name);assert.ok(bytes.length<=8388608);return{bytes,value:JSON.parse(bytes)}};
 const c=read('unresolved-production.json'),copies=read('invocations.json'),chains=read('chains.json');
 const recaptures=Array.from({length:12},(_,i)=>'recovery-'+i+'.json').filter(name=>existsSync(root+'/'+name)).map(name=>read(name).value);
 const result=reconcileUnresolved(c.value[0].results,copies.value,chains.value,recaptures);
 const originals=result.accepted.map(({row,request,replay})=>({url:request.url,method:request.method,headers:request.headers,cf:request.cf,expected:replay,reference:row.privateReference}));
 const replayBytes=JSON.stringify({originals},null,2)+'\n';writeFileSync(replayOutput,replayBytes,{flag:'wx',mode:0o600});
 const summary={checkedAt:new Date().toISOString(),sourceBaseline:'7ad2405',...summarize(result),scriptSha256:hash(readFileSync(new URL(import.meta.url))),
  inputsSha256:{candidates:hash(c.bytes),receiptCopies:hash(copies.bytes),chains:hash(chains.bytes),replayInput:hash(replayBytes)},
  replayClassifierProfile:'2026-10-29.2',newOwnSiteRequests:0,newHumanLabels:0};
 writeFileSync(output,JSON.stringify(summary,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify(summary));
}
