import { storedObservationReceipt } from '../../../../analytics/.test-dist/observation-receipt.js';
import { isReaderKind } from '../../../../analytics/.test-dist/contracts.js';
import { KNOWN_AGENT_NAMES } from '../../../../analytics/.test-dist/classify.js';
import { FAILURE_OUTCOMES } from '../../../../analytics/.test-dist/signature-evidence.js';
import { isNativeBotCategory } from '../../../../analytics/.test-dist/native-bot-evidence.js';
import { normalizeRetainedReceiptCopies } from './compare-receipt-captures.mjs';
import { isDeepStrictEqual } from 'node:util';

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const profiles = new Set(['2026-10-27.6','2026-10-27.7','2026-10-28.1','2026-10-28.2','2026-10-28.3','2026-10-28.4','2026-10-28.5','not-applicable']);
const collections = new Set(['2026-10-27.9','2026-10-27.10','2026-10-27.11','2026-10-28.1','2026-10-28.2','2026-10-28.3','2026-10-28.4','2026-10-28.5']);
const paths = ['version','classifierProfile','readerKind',
  ...['profile','method','reviewedOn','configuredDeclarationCount','unmappedDeclarationCount','status'].map(key=>'directoryPublication.'+key),
  ...['status','candidateCount','candidateNames','categoryAgreement'].map(key=>'declarations.'+key),
  ...['evidenceVersion','source','verifierProfile','status','outcome','reason','reasonCount','reasonNames','signer','documentedVendorStatus','userAgentCovered'].map(key=>'signature.'+key),
  ...['policy','matchedCandidates','taggedCandidates','attemptedCandidates','unassessedCandidates'].map(key=>'signature.selection.'+key),
  ...['status','authority','targetUri','method','path','query','userAgent','contentDigest','replayPolicy'].map(key=>'signature.coverage.'+key),
  ...['verifiedBot','signedAgent','categoryStatus','categoryValue'].map(key=>'native.'+key)];
const field = (value,path) => path.split('.').reduce((value,key)=>object(value)&&Object.hasOwn(value,key)?value[key]:undefined,value);
const nonempty = value => typeof value === 'string' && value.length > 0;
const integer = value => Number.isSafeInteger(value) && value >= 0;
const reason = value => value === 'none' || typeof value === 'string' && Object.hasOwn(FAILURE_OUTCOMES,value);
function reference(value) {
  return typeof value === 'string' && /^[1-9][0-9]{0,18}$/.test(value) && BigInt(value)<=9223372036854775807n ? value : null;
}
const allowed = new Map();
for (const path of paths) {
  const parts=path.split('.');
  for(let i=0;i<parts.length;i++) {
    const prefix=parts.slice(0,i).join('.');
    if(!allowed.has(prefix))allowed.set(prefix,new Set());
    allowed.get(prefix).add(parts[i]);
  }
}
function extraFields(value,prefix='') {
  if(!object(value))return 0;
  let count=0;
  for(const key of Object.keys(value)) {
    if(!allowed.get(prefix)?.has(key)){count++;continue;}
    const next=prefix?prefix+'.'+key:key;
    if(allowed.has(next))count+=extraFields(value[key],next);
  }
  return count;
}
function projection(row) {
  try {
    const c=JSON.parse(row.classificationEvidence),e=JSON.parse(row.signatureEvidence);
    if(!isReaderKind(row.readerKind)||!['verified','unverified',null].includes(row.signatureStatus)
      ||!object(c)||c.version!=='2026-10-27.2'||c.classifierProfile!==row.classifierVersion
      ||!object(c.declarations)||!Array.isArray(c.declarations.candidates)
      ||!c.declarations.candidates.every(name=>KNOWN_AGENT_NAMES.has(name))
      ||new Set(c.declarations.candidates).size!==c.declarations.candidates.length
      ||c.declarations.status!==(c.declarations.candidates.length===0?'none':c.declarations.candidates.length===1?'single':'multiple')
      ||!object(e)||e.version!=='2026-10-27.5'||!object(e.native)||!object(e.native.category)
      ||![e.native.verifiedBot,e.native.signedAgent].every(value=>value===null||typeof value==='boolean')
      ||e.native.category.version!=='2026-10-27.1'
      ||(e.native.category.status==='known'?!isNativeBotCategory(e.native.category.value):e.native.category.value!==null)
      ||!object(e.vendor)||!(e.vendor.userAgentCovered===null||typeof e.vendor.userAgentCovered==='boolean'))return null;
    if(row.signatureStatus==='verified') {
      if(!nonempty(row.signatureAgent))return null;
      const signer=new URL(row.signatureAgent);
      if(signer.protocol!=='https:'||signer.origin!==row.signatureAgent)return null;
    }
    if(e.coverage!==null&&(!object(e.coverage)||!['2026-10-27.1','2026-10-28.1'].includes(e.coverage.version)
      ||!['dictionary','legacy-string','bare-uri'].includes(e.coverage.headerForm)
      ||![e.coverage.validitySeconds,e.coverage.ageSeconds,e.coverage.otherComponentCount].every(integer)))return null;
    if(e.coverage?.version==='2026-10-28.1') {
      const s=e.coverage.selection;
      if(!object(s)||s.policy!=='first-valid-in-input-order'
        ||!['matchedCandidates','taggedCandidates','attemptedCandidates','unassessedCandidates'].every(key=>integer(s[key]))
        ||s.taggedCandidates<1||s.attemptedCandidates<1||s.matchedCandidates<s.taggedCandidates||s.taggedCandidates<s.attemptedCandidates
        ||s.unassessedCandidates!==s.taggedCandidates-s.attemptedCandidates)return null;
    }
    const r=storedObservationReceipt({readerKind:row.readerKind,signatureStatus:row.signatureStatus,signatureAgent:row.signatureAgent,classificationEvidence:c,signatureEvidence:e});
    const d=r.directoryPublication,s=r.signature,n=r.native,v=r.declarations;
    if(extraFields(r)!==0||!['2026-10-27.3','2026-10-28.1'].includes(r.version)||r.classifierProfile!=='2026-10-27.5'
      ||d.profile!=='2026-10-27.1'||d.method!=='reviewed-first-party-directory'||d.reviewedOn!=='2026-10-27'
      ||!integer(d.configuredDeclarationCount)||!integer(d.unmappedDeclarationCount)
      ||!['no-declaration','not-configured','not-verified','matching-publisher','different-publisher','partial-mapping','conflicting-publishers','test-injected'].includes(d.status)
      ||!['none','single','multiple'].includes(v.status)||!integer(v.candidateCount)
      ||!['no-match','single-match','multiple-same-category','multiple-categories'].includes(v.categoryAgreement)
      ||!['local-webbotauth','test-injected'].includes(s.source)||!profiles.has(s.verifierProfile)
      ||(s.source==='local-webbotauth'&&s.verifierProfile==='not-applicable')
      ||!['verified','unverified','absent'].includes(s.status)
      ||!['verified','absent','test-injected',...Object.values(FAILURE_OUTCOMES)].includes(s.outcome)
      ||!reason(s.reason)||!integer(s.reasonCount)||typeof s.reasonNames!=='string'
      ||!s.reasonNames.split(',').every(reason)
      ||!['no-declaration','not-configured','not-verified','matching-origin','different-origin','test-injected'].includes(s.documentedVendorStatus)
      ||![s.userAgentCovered,n.verifiedBot,n.signedAgent].every(value=>['true','false','unavailable'].includes(value))
      ||!['known','empty','unavailable','unrecognized'].includes(n.categoryStatus)
      ||!(n.categoryValue==='none'||isNativeBotCategory(n.categoryValue)))return null;
    if(s.coverage.status==='recorded') {
      if(!['authority','targetUri','method','path','query','userAgent','contentDigest'].every(key=>typeof s.coverage[key]==='boolean')||s.coverage.replayPolicy!=='expiry-only')return null;
    } else if(s.coverage.status!=='unavailable')return null;
    return r;
  } catch {return null;}
}
function group(items,key) {
  const result=new Map();
  for(const item of items) {
    const id=key(item);if(id===null)continue;
    result.set(id,[...result.get(id)??[],item]);
  }
  return result;
}
/** Exact returned-row identity and known receipt projection only. Not a second
 * verification verdict, native/provider agreement, or time/path surrogate join. */
export function reconcileReceiptStorage(candidates,retainedInput) {
  if(!Array.isArray(candidates))throw Error('Expected candidate row array');
  const normalized=normalizeRetainedReceiptCopies(retainedInput),rows=normalized.rows;
  const stored=rows.filter(row=>row?.source?.message==='analytics.observation_stored');
  const recordIds=group(rows,row=>nonempty(row?.$metadata?.id)?row.$metadata.id:null);
  const operations=group(stored,row=>nonempty(row.source?.operationId)?row.source.operationId:null);
  const C=group(candidates,row=>reference(row?.privateReference));
  const R=group(stored,row=>row.source?.storage?.version==='2026-10-27.1'&&row.source.storage.status==='returned'?reference(row.source.storage.observationId):null);
  const result={candidateRows:candidates.length,retainedInputRecords:normalized.inputRecords,retainedStoredRecords:stored.length,
    rejectedRetainedRecords:normalized.rejected,invalidCandidateReferences:candidates.filter(row=>reference(row?.privateReference)===null).length,
    unavailableReceiptReferences:stored.filter(row=>row.source?.storage?.status==='unavailable').length,
    invalidReceiptReferences:stored.filter(row=>row.source?.storage?.status!=='unavailable'&&(row.source?.storage?.version!=='2026-10-27.1'||row.source.storage.status!=='returned'||reference(row.source.storage.observationId)===null)).length,
    unmatchedCandidateRows:0,unmatchedReceiptRecords:0,ambiguousReferenceGroups:0,invalidPairMetadata:0,unprojectableCandidateRows:0,
    matchedReferencePairs:0,identicalProjectionPairs:0,differentProjectionPairs:0,storedLocalVerifiedPairs:0,testInjectedPairs:0,conflictingStoredStatusPairs:0,
    changedFields:{},unexpectedFields:0};
  for(const key of new Set([...C.keys(),...R.keys()])) {
    const candidatesForKey=C.get(key)??[],receipts=R.get(key)??[];
    if(!candidatesForKey.length){result.unmatchedReceiptRecords+=receipts.length;continue;}
    if(!receipts.length){result.unmatchedCandidateRows+=candidatesForKey.length;continue;}
    if(candidatesForKey.length!==1||receipts.length!==1){result.ambiguousReferenceGroups++;continue;}
    const row=candidatesForKey[0],record=receipts[0],source=record.source,metadata=record.$metadata;
    if(!object(metadata)||metadata.type!=='cf-worker'||!nonempty(metadata.id)||!nonempty(metadata.requestId)
      ||recordIds.get(metadata.id)?.length!==1||!nonempty(source.operationId)||operations.get(source.operationId)?.length!==1
      ||!Number.isFinite(Date.parse(record.timestamp))||record.$workers?.truncated===true||record.$cloudflare?.truncated===true
      ||!collections.has(row.collectionVersion)||source.collectionVersion!==row.collectionVersion||!['2026-10-27.3','2026-10-28.1'].includes(source.receipt?.version)) {result.invalidPairMetadata++;continue;}
    result.matchedReferencePairs++;
    const expected=projection(row);
    if(expected===null){result.unprojectableCandidateRows++;continue;}
    const differences=paths.filter(path=>!isDeepStrictEqual(field(expected,path),field(source.receipt,path)));
    const extras=extraFields(source.receipt);result.unexpectedFields+=extras;
    for(const path of differences)result.changedFields[path]=(result.changedFields[path]??0)+1;
    if(differences.length||extras){result.differentProjectionPairs++;continue;}
    result.identicalProjectionPairs++;
    const signature=expected.signature;
    const cleanVerified=signature.status==='verified'&&signature.outcome==='verified'&&signature.reason==='none'&&signature.reasonCount===0&&signature.reasonNames==='none';
    if(signature.source==='test-injected'||signature.outcome==='test-injected')result.testInjectedPairs++;
    if(signature.source==='local-webbotauth'&&(row.signatureStatus==='verified')!==cleanVerified)result.conflictingStoredStatusPairs++;
    if(row.signatureStatus==='verified'&&signature.source==='local-webbotauth'&&cleanVerified&&signature.coverage.status==='recorded')result.storedLocalVerifiedPairs++;
  }
  return result;
}
