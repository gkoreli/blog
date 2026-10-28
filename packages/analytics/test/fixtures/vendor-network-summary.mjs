const at='2026-10-28T04:00:00.000Z';
const snapshot={sha256:'a'.repeat(64),fetchedAt:at,validatedAt:at,freshUntil:'2026-10-28T04:05:00.000Z',publisherVersion:null,prefixCount:1};
export function networkEvidence(outcome='listed', options={}) {
 const usable=options.addressState===undefined||options.addressState==='usable';
 const checks=outcome===null?[]:[{source:options.source??'google-common',outcome,reason:outcome==='unavailable'?(usable?'fetch-timeout':'address-unavailable'):outcome==='not-assessed'?'refresh-cooldown':null,snapshot:['listed','not-listed'].includes(outcome)?structuredClone(snapshot):null}];
 return {profile:options.profile??'2026-10-28.1',method:'published-ip-feed',source:'local-vendor-ip',checkedAt:at,address:{state:options.addressState??'usable',header:usable?'cf-connecting-ip':null,family:usable?'ipv4':null},declarationCount:1,configuredDeclarationCount:outcome===null?0:1,unmappedDeclarationCount:outcome===null?1:0,summary:{listed:outcome==='listed',notListed:outcome==='not-listed',unavailable:outcome==='unavailable',notAssessed:outcome==='not-assessed'},checks};
}
const change=(mutate)=>{const e=networkEvidence();mutate(e);return e;};
const good=(name,e)=>({name,e,recognized:true});const bad=(name,e)=>({name,e,recognized:false});
export const networkSummaryCases=[
 {name:'missing-history',e:null,recognized:false},
 good('current-listed',networkEvidence()),good('historical-listed',networkEvidence('listed',{profile:'2026-10-27.1'})),
 good('nonlisted',networkEvidence('not-listed')),good('deadline-unavailable',networkEvidence('unavailable')),
 good('address-unavailable',networkEvidence('unavailable',{addressState:'worker-subrequest'})),good('cooldown-not-assessed',networkEvidence('not-assessed')),
 good('unmapped-declaration',networkEvidence(null)),good('no-declaration',(()=>{const e=networkEvidence(null);e.declarationCount=0;e.unmappedDeclarationCount=0;return e;})()),
 good('mixed-outcomes',(()=>{const e=networkEvidence();e.checks.push({...structuredClone(e.checks[0]),source:'ahrefs-crawlers',outcome:'not-listed'});e.declarationCount=2;e.configuredDeclarationCount=2;e.summary.notListed=true;return e;})()),
 good('two-ahrefs-declarations-one-feed',(()=>{const e=networkEvidence('listed',{source:'ahrefs-crawlers'});e.declarationCount=2;e.configuredDeclarationCount=2;return e;})()),
 good('new-profile-google-agent',networkEvidence('listed',{source:'google-agent'})),
 bad('number-instead-of-boolean',change(e=>e.summary.listed=1)),bad('no-check-behind-positive',change(e=>e.checks=[])),
 bad('summary-disagrees-with-check',change(e=>e.summary.listed=false)),bad('unknown-profile',change(e=>e.profile='future-private-canary')),
 bad('wrong-method',change(e=>e.method='dns')),bad('wrong-source',change(e=>e.source='injected')),
 bad('string-count',change(e=>e.configuredDeclarationCount='1')),bad('unsafe-count',change(e=>e.declarationCount=9007199254740992)),
 bad('counts-do-not-add',change(e=>e.unmappedDeclarationCount=1)),bad('no-declaration-positive',change(e=>{e.declarationCount=0;e.configuredDeclarationCount=0;})),
 bad('unknown-address',change(e=>e.address.state='private-canary')),bad('relay-with-success',change(e=>e.address={state:'worker-subrequest',header:null,family:null})),
 bad('unknown-check-source',change(e=>e.checks[0].source='private-canary')),bad('duplicate-check-source',change(e=>e.checks.push(structuredClone(e.checks[0])))),
 bad('legacy-profile-new-source',networkEvidence('listed',{profile:'2026-10-27.1',source:'google-agent'})),
 bad('no-snapshot-behind-success',change(e=>e.checks[0].snapshot=null)),bad('success-with-failure-reason',change(e=>e.checks[0].reason='fetch-timeout')),
 bad('scalar-check',change(e=>e.checks=['private-canary'])),bad('non-array-checks',change(e=>e.checks={})),
 bad('fake-digest',change(e=>e.checks[0].snapshot.sha256='private-canary')),bad('missing-time',change(e=>delete e.checkedAt)),
];
