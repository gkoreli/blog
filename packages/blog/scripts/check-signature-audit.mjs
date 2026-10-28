import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { signatureSelectionFixture } from '../../analytics/test/fixtures/signature-selection.mjs';

const [output, fixtureCapture] = process.argv.slice(2); assert.ok(output, 'Provide a new closed native receipt');
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const fixture = await signatureSelectionFixture();
if (fixtureCapture) writeFileSync(fixtureCapture, JSON.stringify(fixture) + '\n', {mode:0o600,flag:'wx'});
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
  import { auditWebBotAuth } from './packages/analytics/src/webbotauth-audit.ts';
  const directories=${JSON.stringify(fixture.directories)};
  export default { async fetch(request) {
    const mode=request.headers.get('X-Fixture-Mode'); let abortObserved=false;
    const result=await auditWebBotAuth(request,{maxCandidates:mode==='limited'?1:8,deadlineMs:mode==='deadline'?1000:2000,
      fetcher:async(url,init)=>{
        if(!Object.hasOwn(directories,String(url)))throw Error('Unexpected fixture origin');
        if(mode==='unavailable'&&String(url).startsWith('https://two.'))return new Response(null,{status:503});
        if(mode==='deadline'&&String(url).startsWith('https://two.'))return new Promise((resolve,reject)=>init.signal.addEventListener('abort',()=>{abortObserved=true;reject(new Error('Fixture abort'));},{once:true}));
        return Response.json(directories[String(url)],{headers:{'Content-Type':'application/http-message-signatures-directory+json'}});
      }});
    return Response.json({result,abortObserved});
  }};
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {} });
try {
  const trials = [];
  const extra = ['limited','unavailable','deadline'].map(mode => ({ ...fixture.cases[1], name: mode, mode }));
  for (const trial of [...fixture.cases, ...extra]) {
    const response = await mf.dispatchFetch('https://publication.example/a', { headers: { ...trial.headers, 'X-Fixture-Mode': trial.mode ?? 'complete' } });
    assert.equal(response.status, 200); const { result, abortObserved } = await response.json();
    assert.equal(result.taggedCandidates, result.verifiedCandidates + result.notVerifiedByProfileCandidates + result.unavailableCandidates + result.unsupportedCandidates + result.indeterminateCandidates + result.unassessedCandidates);
    if (!trial.mode) {
      assert.equal(result.assessment,trial.name.startsWith('unpaired-')?'partial':'complete'); assert.equal(result.verifiedCandidates,trial.name.startsWith('both-valid')?2:1);
    } else {
      assert.equal(result.assessment,'partial');assert.equal(result.verifiedCandidates,1);
      if(trial.mode==='limited'){assert.equal(result.termination,'candidate-limit');assert.equal(result.unassessedCandidates,1);}
      else {assert.equal(result.unavailableCandidates,1);assert.equal(result.unassessedCandidates,0);}
      if(trial.mode==='deadline'){assert.equal(abortObserved,true);assert.equal(result.termination,'deadline');}
    }
    const text=JSON.stringify(result);assert.equal(text.includes('fixture.example'),false);assert.equal(text.includes(trial.headers.Signature),false);
    trials.push({name:trial.name,...result,abortObserved});
  }
  writeFileSync(output,JSON.stringify({checkedAt:new Date().toISOString(),method:'Actual local workerd/WebCrypto audit with independent fixture proofs and explicitly intercepted resolver transport. No collector, D1 or production network path.',trials,externalRequests:0,productionRequests:0,d1Statements:0},null,2)+'\n',{mode:0o600,flag:'wx'});
  console.log(JSON.stringify({nativeAudits:trials.length,complete:trials.filter(t=>t.assessment==='complete').length,partial:trials.filter(t=>t.assessment==='partial').length,productionRequests:0}));
} finally { await mf.dispose(); }
