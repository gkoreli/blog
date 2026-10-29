import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { verifyWebBotAuth } from '../../analytics/.test-dist/webbotauth.js';
import { auditWebBotAuth } from '../../analytics/.test-dist/webbotauth-audit.js';
import { auditWebBotAuthReuse } from '../../analytics/.test-dist/webbotauth-reuse-audit.js';

const [inputFile, preflightFile, historicalRoot, manifestFile, historicalBundle, output] = process.argv.slice(2); assert.ok(output);
const hash = bytes => createHash('sha256').update(bytes).digest('hex'), inputBytes = readFileSync(inputFile), input = JSON.parse(inputBytes);
const preflight = JSON.parse(readFileSync(preflightFile)), manifest = JSON.parse(readFileSync(manifestFile));
assert.equal(hash(inputBytes), preflight.inputSha256); assert.equal(input.trials.length, 156);
assert.equal(manifest.verifierProfile, '2026-10-28.7'); assert.equal(manifest.files.length, 51);
for (const file of manifest.files) assert.equal(hash(readFileSync(join(historicalRoot,file.path))),file.sha256);
const historicSrc = join(historicalRoot,'packages/analytics/src');
const bundle = async contents => (await build({stdin:{resolveDir:process.cwd(),contents},bundle:true,write:false,format:'esm',platform:'browser',logLevel:'silent'})).outputFiles[0].text;
const old = await bundle(`export{verifyWebBotAuth}from ${JSON.stringify(join(historicSrc,'webbotauth.ts'))};export{VERIFIER_PROFILE_VERSION}from ${JSON.stringify(join(historicSrc,'versions.ts'))};`);
writeFileSync(historicalBundle,old,{flag:'wx',mode:0o600}); const historical = await import(pathToFileURL(historicalBundle)); assert.equal(historical.VERIFIER_PROFILE_VERSION,'2026-10-28.7');

async function inspect(trial, verify, audit) {
  const request = new Request(trial.url,{method:trial.method,headers:trial.headers});
  const expected = trial.vendor === 'exa' ? 'https://crawler.exa.ai' : 'https://ahrefs.com';
  const options = {now:new Date(trial.now),maxAgeSeconds:86400,includeEvidence:true,fetcher:async url=>{
    if(String(url)!==expected+'/.well-known/http-message-signatures-directory')throw Error('Unreviewed resolver');
    return Response.json(trial.directory,{headers:{'Content-Type':'application/http-message-signatures-directory+json'}});
  }};
  const verdict = await verify(request,options);
  const result = {status:verdict.status,reason:verdict.reason??null,expectedPublisher:verdict.status==='verified'?verdict.agent===expected:null,coverage:verdict.evidence??null};
  if(audit && trial.variant==='original') {
    const value = await audit(request,options);
    if(value.assessment!=='complete'||value.verifiedCandidates!==1||value.taggedCandidates!==1||value.unassessedCandidates!==0)throw Error('Incomplete original proof audit');
    result.candidateAudit = value;
  }
  return result;
}
const nativeScript = await bundle(`
import{verifyWebBotAuth as current}from './packages/analytics/src/webbotauth.ts';
import{auditWebBotAuth}from './packages/analytics/src/webbotauth-audit.ts';
import{verifyWebBotAuth as historical}from ${JSON.stringify(join(historicSrc,'webbotauth.ts'))};
const inspect=${inspect.toString()};export default{async fetch(request){const trial=await request.json();return Response.json({historical:await inspect(trial,historical),current:await inspect(trial,current,auditWebBotAuth)});}};`);
const require = createRequire(resolve('package.json'));
const {Miniflare} = await import(pathToFileURL(require.resolve('miniflare',{paths:[dirname(require.resolve('wrangler/package.json'))]})));
const mf = new Miniflare({modules:true,script:nativeScript,compatibilityDate:'2026-03-06',cf:{}});
try {
  const results=[];
  for(const trial of input.trials) {
    const node={historical:await inspect(trial,historical.verifyWebBotAuth),current:await inspect(trial,verifyWebBotAuth,auditWebBotAuth)};
    const response=await mf.dispatchFetch('https://offline.example/check',{method:'POST',body:JSON.stringify(trial)});assert.equal(response.status,200);
    const native=await response.json();assert.deepEqual(native,node);
    for(const result of Object.values(native)) {
      assert.equal(result.status,trial.variant==='changed-authority'?'unverified':'verified');assert.equal(result.reason,trial.variant==='changed-authority'?'signature-invalid':null);
      if(result.status==='verified') {assert.equal(result.expectedPublisher,true);assert.equal(result.coverage.covered.authority,true);for(const field of ['targetUri','method','path','query','userAgent'])assert.equal(result.coverage.covered[field],false);}
    }
    results.push({vendor:trial.vendor,variant:trial.variant,...native});
  }
  const originals=input.trials.filter(row=>row.variant==='original');
  const reuse=await auditWebBotAuthReuse(originals.map((row,i)=>({reference:`private-cohort-${i}`,request:new Request(row.url,{method:row.method,headers:row.headers}),observedAt:new Date(row.now)})),{fetcher:async url=>{
    const row=originals.find(row=>String(url)===(row.vendor==='exa'?'https://crawler.exa.ai':'https://ahrefs.com')+'/.well-known/http-message-signatures-directory');assert.ok(row);
    return Response.json(row.directory,{headers:{'Content-Type':'application/http-message-signatures-directory+json'}});
  }});
  assert.equal(reuse.assessment,'complete');assert.equal(reuse.verifiedObservations,52);
  const receipt={checkedAt:new Date().toISOString(),inputSha256:hash(inputBytes),preflightSha256:hash(readFileSync(preflightFile)),scriptSha256:hash(readFileSync(new URL(import.meta.url))),
    historicalCommit:manifest.commit,historicalFilesRechecked:manifest.files.length,historicalManifestSha256:hash(readFileSync(manifestFile)),historicalBundleSha256:hash(Buffer.from(old)),
    historicalProfile:'2026-10-28.7',currentProfile:'2026-10-29.1',contextsPerRuntimePerProfile:156,originals:52,results,reuse,
    productionRequests:0,externalResolverRequests:0,d1Statements:0,humanLabels:0,
    limits:['Later captured keys do not reconstruct original resolver state.','Two local implementations/profiles do not establish managed-provider agreement.','Reuse audit references are synthetic one-to-one ordinals after native request-reference uniqueness checks; no identities or digests are emitted.']};
  writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(JSON.stringify({contextsPerRuntimePerProfile:156,originals:52,distinctProofs:reuse.distinctVerifiedProofs,repeatedProofGroups:reuse.repeatedProofGroups}));
}finally{await mf.dispose();}
