import { DatabaseSync } from 'node:sqlite';
import { isDeepStrictEqual } from 'node:util';
import { VENDOR_IP_SOURCES } from '../../../../analytics/.test-dist/vendor-ip-sources.js';
import { vendorIpReceipt } from '../../../../analytics/.test-dist/vendor-ip-receipt.js';
import { vendorNetworkStateSql } from '../../../../analytics/.test-dist/vendor-network-summary.js';

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const sourceIds = new Set(VENDOR_IP_SOURCES.map(source => source.id));
const database = new DatabaseSync(':memory:');
const state = database.prepare(`SELECT (${vendorNetworkStateSql()}) AS state FROM (SELECT ? AS vendor_ip_evidence)`);

/** Offline consistency through the report's stored-field validator. This is not
 * independent proof of a request address, a feed, a signature or provider truth. */
export function recognizedNetworkEvidence(value) {
  try { return object(value) && state.get(JSON.stringify(value)).state === 'recognized'; }
  catch { return false; }
}

const snapshotKeys = ['status','sha256','fetchedAt','validatedAt','freshUntil','publisherVersionStatus','publisherVersion','prefixCount'];
export const networkReceiptPaths = [
  ...['status','profile','method','source','checkedAt','addressState','addressHeader','addressFamily',
    'declarationCount','configuredDeclarationCount','unmappedDeclarationCount','checkCount','sourceNames'].map(key => 'vendorNetwork.'+key),
  ...['listed','notListed','unavailable','notAssessed'].map(key => 'vendorNetwork.summary.'+key),
  'vendorNetwork.checks.status',
  ...[...sourceIds].flatMap(source => ['outcome','reason',...snapshotKeys.map(key => 'snapshot.'+key)]
    .map(key => 'vendorNetwork.checks.sources.'+source+'.'+key)),
];

const allowed = new Map();
for (const path of networkReceiptPaths) {
  const parts=path.split('.').slice(1);
  for(let i=0;i<parts.length;i++){
    const prefix=parts.slice(0,i).join('.');
    if(!allowed.has(prefix))allowed.set(prefix,new Set());
    allowed.get(prefix).add(parts[i]);
  }
}
export function extraNetworkReceiptFields(value,prefix='') {
  if(!object(value))return 0;
  let count=0;
  for(const key of Object.keys(value)){
    if(!allowed.get(prefix)?.has(key)){count++;continue;}
    const path=prefix?prefix+'.'+key:key;
    if(allowed.has(path))count+=extraNetworkReceiptFields(value[key],path);
  }
  return count;
}

/** Reconstruct only known facts and require canonical re-projection. Unknown keys,
 * lost scalars and contradictory count/source/snapshot states cannot pass. */
export function validNetworkReceipt(value) {
  if (!object(value)) return false;
  if (value.status === 'not-recorded') return isDeepStrictEqual(value, {status:'not-recorded'});
  if (value.status !== 'recorded' || typeof value.sourceNames !== 'string' || value.sourceNames.length > 300) return false;
  const names = value.sourceNames === 'none' ? [] : value.sourceNames.split(',');
  if (names.length > sourceIds.size || new Set(names).size !== names.length || names.some(name => !sourceIds.has(name))) return false;
  if (!object(value.checks) || (names.length === 0 ? value.checks.status !== 'none' : value.checks.status !== 'recorded')) return false;
  try {
    const raw = {
      profile:value.profile,method:value.method,source:value.source,checkedAt:value.checkedAt,
      address:{state:value.addressState,header:value.addressHeader === 'none' ? null : value.addressHeader,family:value.addressFamily === 'none' ? null : value.addressFamily},
      declarationCount:value.declarationCount,configuredDeclarationCount:value.configuredDeclarationCount,unmappedDeclarationCount:value.unmappedDeclarationCount,
      summary:value.summary,
      checks:names.map(source => {
        const check=value.checks.sources[source],snapshot=check.snapshot;
        if (!object(snapshot) || !['recorded','unavailable'].includes(snapshot.status)) throw Error('Unknown snapshot state');
        if (snapshot.status === 'recorded' && !['recorded','unavailable'].includes(snapshot.publisherVersionStatus)) throw Error('Unknown publisher-version state');
        return {source,outcome:check.outcome,reason:check.reason === 'none' ? null : check.reason,
          snapshot:snapshot.status === 'unavailable' ? null : {
            sha256:snapshot.sha256,fetchedAt:snapshot.fetchedAt,validatedAt:snapshot.validatedAt,freshUntil:snapshot.freshUntil,
            publisherVersion:snapshot.publisherVersionStatus === 'unavailable' ? null : snapshot.publisherVersion,prefixCount:snapshot.prefixCount,
          }};
      }),
    };
    return recognizedNetworkEvidence(raw) && isDeepStrictEqual(value,vendorIpReceipt(raw));
  } catch { return false; }
}
