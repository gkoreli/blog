import {extractRequestMetadata} from '../../.test-dist/metadata.js';
import {analyzeTraffic} from '../../.test-dist/classify.js';
import {classificationEvidence} from '../../.test-dist/classification-evidence.js';
import {classifyReaderKind} from '../../.test-dist/readerkind.js';
import {CLASSIFIER_VERSION} from '../../.test-dist/versions.js';
export const now=new Date('2026-10-29T20:00:00Z');
export function current(headers={}){
 const request=new Request('https://publication.example/fixture',{headers:{'User-Agent':'Mozilla/5.0 Chrome/152.0 Safari/537.36','Sec-Fetch-Mode':'navigate','Sec-Fetch-Dest':'document','Sec-Fetch-Site':'none','Sec-Fetch-User':'?1',Accept:'text/html','Accept-Language':'en',...headers}});
 Object.defineProperty(request,'cf',{value:{asn:64512}});const m=extractRequestMetadata(request),a=analyzeTraffic(m.userAgent),facts={...m,...a,observationSource:'edge',signature:{status:'absent'}},c=classificationEvidence(facts,a.declarations),reader=classifyReaderKind(facts);
 return {path:'/fixture',daily_client_id:'0'.repeat(32),traffic_class:a.trafficClass,agent_name:a.agentName,device_type:'desktop',is_owner:0,observation_source:'edge',observed_at:'2026-10-29 19:00:00',collection_version:'2026-10-29.6',classifier_version:CLASSIFIER_VERSION,reader_kind:reader.kind,reader_reason:reader.reason,sec_fetch_mode:m.secFetchMode,sec_fetch_dest:m.secFetchDest,sec_fetch_site:m.secFetchSite,sec_fetch_user:m.secFetchUser,classification_evidence:JSON.stringify(c)};
}
function evidence(row,mutate){const c=JSON.parse(row.classification_evidence);mutate(c);return {...row,classification_evidence:JSON.stringify(c)}}

export function parsingCases(){
 const absent=current();for(const key of ['sec_fetch_mode','sec_fetch_dest','sec_fetch_site','sec_fetch_user'])absent[key]=null;absent.classification_evidence=JSON.stringify({...JSON.parse(absent.classification_evidence),fetchMetadataBits:585,activation:'absent'});
 const old={...current(),collection_version:'2026-10-29.5',classifier_version:'2026-10-29.2',classification_evidence:JSON.stringify({version:'2026-10-29.1',classifierProfile:'2026-10-29.2'})};
 return [
  ['canonical',current(),'recognized'],['false',current({'Sec-Fetch-User':'?0'}),'recognized'],['absent',absent,'recognized'],
  ['future-mode',current({'Sec-Fetch-Mode':'future-mode'}),'recognized'],['invalid-user',current({'Sec-Fetch-User':'true'}),'recognized'],['budget',current({'Sec-Fetch-Mode':'a'.repeat(32769)}),'recognized'],['parameters',current({'Sec-Fetch-Mode':'navigate;x=@1;y=?0'}),'recognized'],['unassessed',evidence(current(),c=>c.fetchMetadataBits=0),'recognized'],
  ['missing',{...current(),classification_evidence:null},'not-recorded'],['old',old,'not-recorded'],
  ...['null','[]','0'].map((value,i)=>['invalid-record-'+i,{...current(),classification_evidence:value},'unrecognized']),
  ['future-record',evidence(current(),c=>c.version='future-private-canary'),'unrecognized'],['unsupported-profile',evidence({...current(),classifier_version:'future-private-profile'},c=>c.classifierProfile='future-private-profile'),'unrecognized'],['missing-collection',{...current(),collection_version:null},'unrecognized'],
  ['boolean-bits',evidence(current(),c=>c.fetchMetadataBits=true),'inconsistent'],['profile-conflict',evidence(current(),c=>c.classifierProfile='other'),'inconsistent'],['scalar-conflict',{...current(),sec_fetch_mode:'NAVIGATE'},'inconsistent'],['activation-conflict',evidence(current(),c=>c.activation='absent'),'inconsistent'],['unsupported-code',evidence(current(),c=>c.fetchMetadataBits=1175),'inconsistent'],['required-field-missing',evidence(current(),c=>delete c.fetchMetadataBits),'inconsistent'],['legacy-format-with-current-stamps',{...current(),classification_evidence:old.classification_evidence},'inconsistent'],['duplicate-key',{...current(),classification_evidence:current().classification_evidence.replace(/}$/,' ,"fetchMetadataBits":1170}')},'inconsistent'],['decimal-bits',{...current(),classification_evidence:current().classification_evidence.replace('"fetchMetadataBits":1170','"fetchMetadataBits":1170.0')},'inconsistent'],
 ];
}
