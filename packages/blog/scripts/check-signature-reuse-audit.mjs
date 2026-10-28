import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { signatureReuseFixture } from '../../analytics/test/fixtures/signature-reuse.mjs';
import { checkSignatureReuseFixture } from '../../analytics/test/fixtures/signature-reuse-assertions.mjs';

const [output, fixtureCapture] = process.argv.slice(2); assert.ok(output);
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const fixture = await signatureReuseFixture();
if (fixtureCapture) writeFileSync(fixtureCapture, JSON.stringify(fixture) + '\n', { flag: 'wx', mode: 0o600 });
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
  import {auditWebBotAuthReuse} from './packages/analytics/src/webbotauth-reuse-audit.ts';
  const directories=${JSON.stringify(fixture.directories)};
  export default{async fetch(request){
    const {rows,mode}=await request.json();let abortObserved=false;
    const result=await auditWebBotAuthReuse(rows.map(row=>({reference:row.reference,observedAt:new Date(row.observedAt),request:new Request(row.url,{method:row.method,headers:row.headers})})),{
      maxObservations:mode==='observation-limit'?1:64,maxCandidatesPerObservation:mode==='candidate-limit'?1:8,deadlineMs:mode==='deadline'?100:2000,
      fetcher:async(url,init)=>{
        if(!Object.hasOwn(directories,String(url)))throw Error('Unexpected fixture source');
        if(mode==='unavailable')return new Response(null,{status:503});
        if(mode==='deadline'&&String(url).includes('second.example'))return new Promise((resolve,reject)=>init.signal.addEventListener('abort',()=>{abortObserved=true;reject(Error('Fixture abort'));},{once:true}));
        return Response.json(directories[String(url)],{headers:{'Content-Type':'application/http-message-signatures-directory+json'}});
      }
    });return Response.json({result,abortObserved});
  }};
` }, bundle: true, write: false, platform: 'browser', format: 'esm', logLevel: 'silent' });
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {} });
try {
  const invoke = async (rows, mode = 'complete') => {
    const response = await mf.dispatchFetch('https://fixture-control.example/', { method: 'POST', body: JSON.stringify({ rows, mode }) });
    assert.equal(response.status, 200); return response.json();
  };
  const trials = await checkSignatureReuseFixture(fixture, async rows => (await invoke(rows)).result);
  const extra = [
    ['observation-limit', fixture.cohorts[0].rows], ['candidate-limit', [{ ...fixture.records.multi, reference: 'one' }]],
    ['unavailable', fixture.cohorts[0].rows], ['deadline', [{ ...fixture.records.original, reference: 'one' }, { ...fixture.records.otherPublisher, reference: 'two' }]],
  ];
  for (const [mode, rows] of extra) {
    const { result, abortObserved } = await invoke(rows, mode);
    assert.equal(result.assessment, mode === 'observation-limit' ? 'not-assessed' : 'partial');
    if (mode === 'observation-limit') assert.equal(result.unassessedObservations, 2);
    if (mode === 'candidate-limit') assert.equal(result.unassessedKnownCandidates, 1);
    if (mode === 'unavailable') assert.equal(result.unresolvedCandidates, 2);
    if (mode === 'deadline') { assert.equal(result.termination, 'deadline'); assert.equal(result.verifiedCandidates, 1); assert.equal(abortObserved, true); }
    trials.push({ name: mode, ...result, abortObserved });
  }
  writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), method: 'Actual local workerd/WebCrypto; independently constructed fixture signatures and intercepted directory resolver. Offline cohort diagnostics only.', trials, externalRequests: 0, productionRequests: 0, d1Statements: 0 }, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ nativeCohorts: trials.length, productionRequests: 0, d1Statements: 0 }));
} finally { await mf.dispose(); }
