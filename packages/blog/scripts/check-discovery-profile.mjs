import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { discoveryProfileFixture } from '../../analytics/test/fixtures/discovery-profile.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const [mode, input, privateOutput, publicOutput, option] = process.argv.slice(2);
assert.ok(input, 'Usage: --prepare INPUT | --run INPUT PRIVATE_OUTPUT PUBLIC_OUTPUT [--node-only]');
if (mode === '--prepare') {
  const fixture = await discoveryProfileFixture();
  writeFileSync(input, JSON.stringify(fixture) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ preparedCases: fixture.rows.length, inputSha256: hash(readFileSync(input)) }));
} else {
  assert.equal(mode, '--run'); assert.ok(privateOutput && publicOutput);
  const inputBytes = readFileSync(input), fixture = JSON.parse(inputBytes);
  assert.equal(fixture.version, 1); assert.equal(fixture.rows.length, 20);
  const sourceFiles = ['packages/analytics/src/directory-discovery.ts', 'packages/analytics/src/webbotauth.ts',
    'packages/analytics/src/signature-evidence.ts', 'packages/analytics/src/versions.ts', 'packages/analytics/src/webbotauth-audit.ts'];
  const sourceHashes = () => Object.fromEntries(sourceFiles.map(file => [file, hash(readFileSync(file))]));
  const sourceSha256 = sourceHashes();
  // Read a frozen, explicitly supplied fixture. Running never generates or replaces it.
  const entry = `import {verifyWebBotAuth,verifyWebBotAuthCandidate,createWebBotAuthCache} from './packages/analytics/src/webbotauth.ts';
import {auditWebBotAuth} from './packages/analytics/src/webbotauth-audit.ts';
import {verificationOutcome} from './packages/analytics/src/signature-evidence.ts';
import {VERIFIER_PROFILE_VERSION} from './packages/analytics/src/versions.ts';
export async function runFixture(fixture){
 const rows=[];
 for(const row of fixture.rows){
  const paths=[];
  for(const mode of ['default','candidate','audit']){
   const calls=[];
   const fetcher=async(url,init)=>{const target=String(url);calls.push(target);
    if(init?.redirect!=='manual')throw Error('Resolver must reject redirects');
    const directory=fixture.directories[target];if(!directory)throw Error('Unlisted synthetic resolver target');
    return Response.json(directory,{headers:{'Content-Type':'application/http-message-signatures-directory+json','Cache-Control':'max-age=300'}});
   };
   const request=new Request(row.url,{method:row.method,headers:row.headers});
   const options={now:new Date(row.now),includeEvidence:true,cache:createWebBotAuthCache(),fetcher};
   const result=mode==='audit'?await auditWebBotAuth(request,options):mode==='candidate'?await verifyWebBotAuthCandidate(request,'proof',options):await verifyWebBotAuth(request,options);
   paths.push({mode,calls,result,outcome:mode==='audit'?null:verificationOutcome(result)});
  }
  rows.push({name:row.name,paths});
 }
 return {profile:VERIFIER_PROFILE_VERSION,rows};
}`;
  const bundled = await build({ stdin: { contents: entry, resolveDir: process.cwd() }, bundle: true, write: false,
    format: 'esm', platform: 'browser', logLevel: 'silent' });
  const moduleCode = bundled.outputFiles[0].text;
  const api = await import('data:text/javascript;base64,' + Buffer.from(moduleCode).toString('base64'));
  const oracle = [];
  for (const row of fixture.rows) {
    const key = await crypto.subtle.importKey('jwk', row.publicKey, 'Ed25519', false, ['verify']);
    const match = /^proof=:([^:]+):$/.exec(row.headers.Signature); assert.ok(match);
    const valid = await crypto.subtle.verify('Ed25519', key, Buffer.from(match[1], 'base64'), new TextEncoder().encode(row.oracleBase));
    assert.equal(valid, row.expectedCrypto, row.name);
    oracle.push({ name: row.name, signatureMathVerified: valid, baseSha256: hash(row.oracleBase) });
  }
  const node = await api.runFixture(fixture);
  const byName = new Map(node.rows.map(row => [row.name, row]));
  const existing = new Set(['legacy-origin', 'dictionary-origin', 'legacy-directory-parameter']);
  for (const row of node.rows) {
    for (const path of row.paths) {
      if (existing.has(row.name)) {
        assert.deepEqual(path.calls, ['https://keys.example/.well-known/http-message-signatures-directory']);
        if (path.mode === 'audit') {
          assert.equal(path.result.verifiedCandidates, 1); assert.equal(path.result.assessment, 'complete');
        } else { assert.equal(path.result.status, 'verified'); assert.equal(path.result.agent, 'https://keys.example'); }
      } else if (!['root-resource-key', 'invalid-origin-proof'].includes(row.name)) {
        assert.deepEqual(path.calls, [], `${row.name}/${path.mode}: unsupported or unsafe input must not fetch`);
        assert.equal(path.mode === 'audit' ? path.result.verifiedCandidates : Number(path.result.status === 'verified'), 0);
      }
    }
  }
  for (const name of ['root-resource-key', 'invalid-origin-proof']) {
    const row = byName.get(name); assert.ok(row);
    for (const path of row.paths) {
      assert.deepEqual(path.calls, ['https://keys.example/.well-known/http-message-signatures-directory']);
      if (path.mode === 'audit') assert.equal(path.result.verifiedCandidates, 0);
      else assert.equal(path.result.reason, name === 'root-resource-key' ? 'key-not-found' : 'signature-invalid');
    }
  }
  let native = null;
  if (option !== '--node-only') {
    assert.equal(option, undefined, 'Only --node-only is supported');
    const require = createRequire(resolve('package.json'));
    const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
    const workerCode = moduleCode + '\nexport default { async fetch(request,env){ return Response.json(await runFixture(env.FIXTURE)); } };';
    const mf = new Miniflare({ modules: true, script: workerCode, compatibilityDate: '2026-03-06', cf: {}, bindings: { FIXTURE: fixture } });
    try {
      const response = await mf.dispatchFetch('https://local-experiment.example/');
      assert.equal(response.status, 200); native = await response.json();
      assert.deepEqual(native, node);
    } finally { await mf.dispose(); }
  }
  assert.deepEqual(sourceHashes(), sourceSha256, 'Source changed during measurement; do not emit a mixed-source receipt');
  const receipt = { checkedAt: new Date().toISOString(), scope: fixture.scope, inputSha256: hash(inputBytes),
    fixtureSha256: hash(readFileSync('packages/analytics/test/fixtures/discovery-profile.mjs')),
    harnessSha256: hash(readFileSync(new URL(import.meta.url))), bundledSourceSha256: hash(moduleCode), sourceSha256,
    nodeVersion: process.version, node, nativeComparison: native === null ? 'not-run' : 'exact-match', oracle,
    caseCount: fixture.rows.length, perRuntimeApiPaths: fixture.rows.length * 3,
    productionRequests: 0, realDirectoryFetches: 0, d1Statements: 0, humanLabels: 0,
    limits: ['Synthetic incoming requests, keys and exact-map resolver only.',
      'Independent WebCrypto checks signature math; not an independent complete protocol verifier.',
      'Origin-only local profile; direct-URL standards compatibility is not vendor adoption.',
      'Native comparison, when run, is local workerd, not the managed provider service.'] };
  writeFileSync(privateOutput, JSON.stringify({ receipt, native }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  writeFileSync(publicOutput, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ profile: node.profile, cases: receipt.caseCount, nativeComparison: receipt.nativeComparison,
    rows: node.rows.map(row => ({ name: row.name, outcome: row.paths[0].outcome, reason: row.paths[0].result.reason ?? null,
      fetches: row.paths[0].calls.length })) }, null, 2));
}
