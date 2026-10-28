import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { signatureSelectionFixture } from '../../analytics/test/fixtures/signature-selection.mjs';
import { verificationClockCases } from '../../analytics/test/fixtures/verification-clock.mjs';

const [output] = process.argv.slice(2); assert.ok(output, 'Provide a new closed native receipt');
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const fixture = await signatureSelectionFixture();
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
  import { verifyWebBotAuth, verifyWebBotAuthCandidate, createWebBotAuthCache } from './packages/analytics/src/webbotauth.ts';
  import { auditWebBotAuth } from './packages/analytics/src/webbotauth-audit.ts';
  import { verificationClockCases } from './packages/analytics/test/fixtures/verification-clock.mjs';
  import { VERIFIER_PROFILE_VERSION } from './packages/analytics/src/versions.ts';
  const directories=${JSON.stringify(fixture.directories)}, fixtureNow=new Date(${JSON.stringify(fixture.now)});
  export default { async fetch(request) {
    const trial=verificationClockCases(fixtureNow).find(row=>row.name===request.headers.get('X-Fixture-Case'));
    if(!trial)throw Error('Unknown fixture case');
    const paths=[];
    for(const mode of ['default','selected','audit']) {
      let fetches=0;
      const options={now:trial.now,includeEvidence:true,cache:createWebBotAuthCache(),fetcher:async url=>{
        fetches++;const body=structuredClone(directories[String(url)]);
        if(!body)throw Error('Unexpected fixture directory');
        if(trial.expiredKey)body.keys=body.keys.map(key=>({...key,exp:Math.floor(fixtureNow.getTime()/1000)-100}));
        return Response.json(body,{headers:{'Content-Type':'application/http-message-signatures-directory+json'}});
      }};
      const result=await(mode==='default'?verifyWebBotAuth(request,options):mode==='selected'?verifyWebBotAuthCandidate(request,'one',options):auditWebBotAuth(request,options));
      paths.push({mode,status:result.status??result.assessment,reason:result.reason??result.termination??null,fetches,
        verifiedCandidates:result.verifiedCandidates??null,ageFinite:result.evidence===undefined?null:Number.isFinite(result.evidence.ageSeconds)});
    }
    return Response.json({name:trial.name,unusableClock:trial.unusable===true,verifierProfile:VERIFIER_PROFILE_VERSION,paths});
  }};
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {} });
try {
  const rows = [];
  for (const trial of verificationClockCases(fixture.now)) {
    const response = await mf.dispatchFetch('https://publication.example/a', { headers: { ...(trial.unsigned ? {} : fixture.cases[0].headers), 'X-Fixture-Case': trial.name } });
    assert.equal(response.status, 200); const row = await response.json();
    for (const path of row.paths) {
      if (trial.unusable) {
        assert.equal(path.fetches, 0);
        assert.equal(path.status, path.mode === 'audit' ? 'not-assessed' : trial.unsigned ? 'absent' : 'unverified');
        assert.equal(path.reason, path.mode === 'audit' ? 'invalid-options' : trial.unsigned ? null : 'invalid-verification-time');
      } else if (path.mode === 'audit') assert.equal(path.verifiedCandidates, trial.name === 'valid' ? 1 : 0);
      else {
        assert.equal(path.status, trial.name === 'valid' ? 'verified' : 'unverified');
        assert.equal(path.reason, trial.name === 'valid' ? null : trial.expiredKey ? 'key-expired' : trial.name === 'expired-signature' ? 'expired' : 'not-yet-valid');
      }
    }
    assert.equal(JSON.stringify(row).includes('private-clock-canary'), false); rows.push(row);
  }
  writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), method: 'Actual local workerd/WebCrypto with independent proofs and in-process caller clock options; intercepted directories, no collector or D1. No malformed HTTP clock or production failure claim.', rows, externalRequests: 0, productionRequests: 0, d1Statements: 0 }, null, 2)+'\n', { mode: 0o600, flag: 'wx' });
  console.log(JSON.stringify({ nativeCases: rows.length, nativePaths: rows.length * 3, productionRequests: 0 }));
} finally { await mf.dispose(); }
