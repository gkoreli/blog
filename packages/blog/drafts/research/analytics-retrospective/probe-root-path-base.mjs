import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildSignatureBase, inspectWebBotAuthCandidates, ed25519JwkThumbprint } from '../../../../analytics/.test-dist/webbotauth.js';

/** Signature-byte counterfactual only. An empty @path is not an accepted HTTP
 * context and must never become a fallback in the production verifier. */
async function verifyBytes(trial){
  const key=await crypto.subtle.importKey('jwk',trial.key,{name:'Ed25519'},false,['verify']);
  return crypto.subtle.verify('Ed25519',key,Uint8Array.from(atob(trial.signature),c=>c.charCodeAt(0)),new TextEncoder().encode(trial.base));
}
const root=process.argv[2];assert.ok(root);const groups=JSON.parse(readFileSync(join(root,'unreviewed-groups.json')));
const group=groups[2],directory=JSON.parse(readFileSync(join(root,'publisher-3.json'))),keys=new Map();
for(const key of directory.keys){const id=await ed25519JwkThumbprint(key);assert.ok(id);keys.set(id,key);}
const trials=[];for(const record of group.records){
  const data=record.$workers.event.request,request=new Request(data.url,{method:data.method,headers:data.headers});
  const inspected=inspectWebBotAuthCandidates(request);assert.equal(inspected.status,'ready');assert.equal(inspected.labels.length,1);
  const label=inspected.labels[0],base=buildSignatureBase(request,label);assert.ok(base!==null);
  const signature=request.headers.get('signature').match(/^[!#$%&'*+.^_`|~0-9A-Za-z-]+=\s*:([A-Za-z0-9+/=]+):$/);assert.ok(signature);
  const id=request.headers.get('signature-input').match(/;keyid="([A-Za-z0-9_-]{43})"/);assert.ok(id);const key=keys.get(id[1]);assert.ok(key);
  const lines=base.split('\n'),paths=lines.filter(line=>line.startsWith('"@path": '));assert.equal(paths.length,1);
  const empty=lines.map(line=>line.startsWith('"@path": ')?'"@path": ':line).join('\n');
  const rootPath=new URL(request.url).pathname==='/';
  trials.push({pathClass:rootPath?'root':'other-path',variant:'rfc-base',signature:signature[1],key,base});
  trials.push({pathClass:rootPath?'root':'other-path',variant:'counterfactual-empty-path-base',signature:signature[1],key,base:empty});
}
assert.equal(trials.length,28);const node=[];for(const trial of trials)node.push(await verifyBytes(trial));
const req=createRequire(resolve('package.json'));const{Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
const script=`const verifyBytes=${verifyBytes.toString()};export default{async fetch(request){return Response.json(await verifyBytes(await request.json()));}};`;
const mf=new Miniflare({modules:true,script,compatibilityDate:'2026-03-06',cf:{}});
try{
  for(const[index,trial]of trials.entries()){
    const response=await mf.dispatchFetch('https://offline.invalid/bytes',{method:'POST',body:JSON.stringify(trial)});assert.equal(response.status,200);assert.equal(await response.json(),node[index]);
  }
  const groups={};for(const[index,trial]of trials.entries()){
    const key=trial.pathClass+':'+trial.variant+':'+node[index];groups[key]=(groups[key]??0)+1;
  }
  const input=JSON.stringify({trials})+'\n',hash=x=>createHash('sha256').update(x).digest('hex');
  writeFileSync(join(root,'root-path-byte-input.json'),input,{flag:'wx',mode:0o600});
  const result={checkedAt:new Date().toISOString(),scriptSha256:hash(readFileSync(new URL(import.meta.url))),inputSha256:hash(input),contextsPerRuntime:28,
    groups,httpValidityClaim:false,productionFallbackAdded:false,productionRequests:0,
    limits:['Primitive signature-byte comparison only; freshness, discovery, HTTP semantics and policy are not re-evaluated here.',
      'An empty-path base matching a signature does not make it RFC-compliant or identify which producer/transport stage created the discrepancy.']};
  writeFileSync(join(root,'root-path-byte-result.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify(result));
}finally{await mf.dispose();}
