// Frozen assignment projections. These do not claim complete classifier,
// transport, cache or verification records; those keep their separate checks.
const schemas={'2026-10-27.4':'2026-10-27.2','2026-10-27.5':'2026-10-27.2','2026-10-29.1':'2026-10-27.2','2026-10-29.2':'2026-10-29.1','2026-10-29.3':'2026-10-29.2','2026-10-31.1':'2026-10-29.2'};
export function networkAssignmentCases(){
 const cases=[];
 function add(id,names,sources,configured=names.length,classifier='2026-10-31.1',network='2026-10-31.2'){
  const c={version:schemas[classifier],classifierProfile:classifier,declarations:{status:names.length===0?'none':names.length===1?'single':'multiple',candidates:names,matchedProducts:names,browserFamily:'unrecognized'}};
  const n={profile:network,method:'published-ip-feed',source:'local-vendor-ip',checkedAt:'2026-10-31T10:00:00.000Z',address:{state:'missing',header:null,family:null},declarationCount:names.length,configuredDeclarationCount:configured,unmappedDeclarationCount:names.length-configured,summary:{listed:false,notListed:false,unavailable:sources.length>0,notAssessed:false},checks:sources.map(source=>({source,outcome:'unavailable',reason:'address-unavailable',snapshot:null,...['2026-10-30.1','2026-10-31.1','2026-10-31.2'].includes(network)?{cache:null}:{}}))};
  const row={id,c,n,storedClassifier:classifier,state:'consistent',reasons:[]};cases.push(row);return row;
 }
 function mutate(id,change,state,reasons){const row=structuredClone(cases[0]);row.id=id;change(row);row.state=state;row.reasons=reasons;cases.push(row);return row;}
 add('gpt-correct',['GPTBot'],['openai-gpt']);
 for(const [classifier,network]of [['2026-10-27.4','2026-10-27.1'],['2026-10-27.5','2026-10-27.1'],['2026-10-27.5','2026-10-28.1'],['2026-10-27.5','2026-10-28.2'],['2026-10-29.1','2026-10-29.1'],['2026-10-29.2','2026-10-29.1'],['2026-10-29.2','2026-10-29.2'],['2026-10-29.3','2026-10-29.2'],['2026-10-29.3','2026-10-30.1'],['2026-10-31.1','2026-10-31.1']])add('history-'+classifier+'-'+network,['GPTBot'],['openai-gpt'],1,classifier,network);
 add('no-declarations',[],[],0);
 add('unmapped-declaration',['ExaUser'],[],0);
 add('old-google-unmapped',['GoogleOther','Google-CloudVertexBot'],[],0,'2026-10-29.3','2026-10-30.1');
 add('cloudvertex-before-method',['Google-CloudVertexBot'],[],0,'2026-10-31.1','2026-10-31.1');
 add('google-other-first-method',['GoogleOther'],['google-common'],1,'2026-10-31.1','2026-10-31.1');
 add('five-declarations-two-sources',['Googlebot','GoogleOther','Google-CloudVertexBot','AhrefsBot','AhrefsSiteAudit'],['ahrefs-crawlers','google-common']);
 const alias=add('aliases-one-declaration',['GoogleOther'],['google-common']);alias.c.declarations.matchedProducts=['GoogleOther','GoogleOther-Image','GoogleOther-Video'];
 add('two-ordered-sources',['GPTBot','Googlebot'],['google-common','openai-gpt']);
 mutate('gpt-wrong-source',r=>r.n.checks[0].source='google-common','contradictory',['source-set']);
 mutate('declaration-count',r=>r.n.declarationCount=2,'contradictory',['declaration-count']);
 mutate('configured-count',r=>r.n.configuredDeclarationCount=0,'contradictory',['configured-count']);
 mutate('unmapped-count',r=>r.n.unmappedDeclarationCount=1,'contradictory',['unmapped-count']);
 mutate('missing-source',r=>r.n.checks=[],'contradictory',['source-set']);
 mutate('duplicate-source',r=>r.n.checks.push(structuredClone(r.n.checks[0])),'contradictory',['duplicate-source']);
 const order=structuredClone(cases.find(r=>r.id==='two-ordered-sources'));order.id='reversed-source-order';order.n.checks.reverse();order.state='contradictory';order.reasons=['source-order'];cases.push(order);
 mutate('unsupported-source',r=>r.n.checks[0].source='private-canary@example.invalid','not-assessed',['source-unsupported']);
 mutate('duplicate-candidate',r=>r.c.declarations.candidates.push('GPTBot'),'not-assessed',['declarations-invalid']);
 mutate('status-conflict',r=>r.c.declarations.status='none','not-assessed',['declarations-invalid']);
 mutate('unknown-candidate',r=>r.c.declarations.candidates=['private-canary@example.invalid'],'not-assessed',['declarations-invalid']);
 mutate('classifier-column-conflict',r=>r.storedClassifier='2026-10-29.3','not-assessed',['classifier-profile-conflict']);
 mutate('future-classifier',r=>{r.c.classifierProfile=r.storedClassifier='private-canary-profile';},'not-assessed',['classifier-profile-unsupported']);
 mutate('unsupported-classifier-field-with-reviewed-column',r=>r.c.classifierProfile='private-canary-profile','not-assessed',['classifier-profile-unsupported']);
 mutate('unsupported-classifier-column-with-reviewed-field',r=>r.storedClassifier='private-canary-profile','not-assessed',['classifier-profile-unsupported']);
 mutate('future-schema',r=>r.c.version='future-private-canary','not-assessed',['classification-schema-unsupported']);
 mutate('schema-conflict',r=>r.c.version='2026-10-27.2','not-assessed',['classification-schema-conflict']);
 mutate('missing-classifier-field',r=>delete r.c.classifierProfile,'not-assessed',['classifier-profile-missing']);
 mutate('missing-classifier-column',r=>r.storedClassifier=null,'not-assessed',['classifier-profile-missing']);
 mutate('invalid-classifier-field',r=>r.c.classifierProfile=1,'not-assessed',['classifier-profile-invalid']);
 mutate('empty-classifier-field',r=>r.c.classifierProfile='','not-assessed',['classifier-profile-invalid']);
 mutate('invalid-classifier-column',r=>r.storedClassifier=1,'not-assessed',['classifier-profile-invalid']);
 mutate('missing-schema',r=>delete r.c.version,'not-assessed',['classification-schema-missing']);
 mutate('invalid-schema',r=>r.c.version=1,'not-assessed',['classification-schema-invalid']);
 mutate('empty-schema',r=>r.c.version='','not-assessed',['classification-schema-invalid']);
 mutate('missing-network-profile',r=>delete r.n.profile,'not-assessed',['network-profile-missing']);
 mutate('invalid-network-profile',r=>r.n.profile=1,'not-assessed',['network-profile-invalid']);
 mutate('empty-network-profile',r=>r.n.profile='','not-assessed',['network-profile-invalid']);
 mutate('future-network',r=>r.n.profile='future-private-canary','not-assessed',['network-profile-unsupported']);
 mutate('unreviewed-pair',r=>{r.c.classifierProfile=r.storedClassifier='2026-10-29.3';},'not-assessed',['profile-pair-unreviewed']);
 mutate('invalid-network-count',r=>r.n.declarationCount='1','not-assessed',['network-assignment-fields-invalid']);
 mutate('invalid-network-method',r=>r.n.method='future-private-canary','not-assessed',['network-envelope-invalid']);
 mutate('malformed-classification',r=>r.c=null,'not-assessed',['classification-envelope-invalid']);
 mutate('missing-classification',r=>r.cRaw=null,'not-assessed',['classification-not-recorded']);
 mutate('missing-network',r=>r.nRaw=null,'not-assessed',['network-not-recorded']);
 mutate('invalid-classification-json',r=>r.cRaw='{','not-assessed',['classification-invalid-json']);
 mutate('invalid-network-json',r=>r.nRaw='{','not-assessed',['network-invalid-json']);
 mutate('duplicate-classifier-json',r=>r.cRaw=JSON.stringify(r.c).replace(/}$/,',"classifierProfile":"2026-10-29.3"}'),'not-assessed',['classification-duplicate-key']);
 mutate('duplicate-nested-json',r=>r.cRaw=JSON.stringify(r.c).replace('"status":"single"','"status":"single","status":"none"'),'not-assessed',['classification-duplicate-key']);
 mutate('escaped-duplicate-source-key',r=>r.nRaw=JSON.stringify(r.n).replace('"source":"openai-gpt"','"source":"openai-gpt","so\\u0075rce":"google-common"'),'not-assessed',['network-duplicate-key']);
 mutate('same-key-different-parents',r=>r.c.extra=[{key:1},{key:2}],'consistent',[]);
 mutate('classification-byte-limit',r=>r.c.extra='学'.repeat(6000),'not-assessed',['classification-policy-limit']);
 mutate('network-byte-limit',r=>r.n.extra='学'.repeat(6000),'not-assessed',['network-policy-limit']);
 return cases.map(row=>({...row,classificationJson:Object.hasOwn(row,'cRaw')?row.cRaw:JSON.stringify(row.c),networkJson:Object.hasOwn(row,'nRaw')?row.nRaw:JSON.stringify(row.n)}));
}
