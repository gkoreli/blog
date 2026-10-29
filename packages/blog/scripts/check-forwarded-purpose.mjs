import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { forwardedPurposeFixture, forwardedSyntaxCases } from '../../analytics/test/fixtures/forwarded-purpose.mjs';

const [retainedFile, output, privateInput] = process.argv.slice(2); assert.ok(privateInput);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const retainedBytes = readFileSync(retainedFile), retained = JSON.parse(retainedBytes);
assert.equal(hash(retainedBytes), JSON.parse(readFileSync('packages/blog/drafts/research/analytics-retrospective/current-verifier-cohort.json')).inputSha256);
const originals = retained.trials.filter(row => row.variant === 'original'); assert.equal(originals.length, 4);
const fixture = await forwardedPurposeFixture();
const trials = Object.entries(fixture.records).map(([name, row]) => ({ name, row }));
trials.push(...[
  ['limited', fixture.records.multi], ['unavailable', fixture.records.signed], ['deadline', fixture.records.signed],
  ['mutation', fixture.records.signed], ['native-boolean-spoof', fixture.records.spoof], ['signature-budget', fixture.records.signed],
  ['no-header', fixture.records.signed], ['unpaired', fixture.records.multi], ['invalid-options', fixture.records.signed],
  ['header-budget', fixture.records.signed],
].map(([name, row]) => ({ name, row })));
for (const [index, row] of originals.entries()) {
  assert.equal(new Headers(row.headers).has('Forwarded'), false);
  trials.push({ name: `retained-absent-${index}`, row });
  for (const use of ['reference', 'full']) {
    const headers = new Headers(row.headers); headers.set('Forwarded', `for="openai";use="${use}"`);
    trials.push({ name: `retained-injected-${use}-${index}`, row: { ...row, headers: Object.fromEntries(headers) } });
  }
}
const fixtureBytes = JSON.stringify({ trials, syntax: forwardedSyntaxCases }) + '\n';
writeFileSync(privateInput, fixtureBytes, { flag: 'wx', mode: 0o600 });
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
 import {auditForwardedPurpose,forwardedClaimFacts} from './packages/analytics/src/forwarded-purpose.ts';
 export default{async fetch(request){
  const {name,row,syntax}=await request.json();if(syntax)return Response.json(forwardedClaimFacts(row));
  const headers=new Headers(row.headers);
  if(name==='signature-budget')headers.set('Signature-Agent','a'.repeat(32769));
  if(name==='header-budget')headers.set('Forwarded','a'.repeat(4097));
  if(name==='no-header')headers.delete('Forwarded');
  if(name==='unpaired')headers.set('Signature',headers.get('Signature').split(',')[0]);
  const context=new Request(row.url,{method:row.method,headers});
  if(name==='native-boolean-spoof')Object.defineProperty(context,'cf',{value:{botManagement:{verifiedBot:true,signedAgent:true}}});
  let aborted=false;
  const pending=auditForwardedPurpose(context,{now:new Date(row.now),maxCandidates:name==='limited'?1:name==='invalid-options'?0:8,deadlineMs:name==='deadline'?100:2000,
   fetcher:async(url,init)=>{
    if(!['https://purpose-fixture.example/.well-known/http-message-signatures-directory','https://crawler.exa.ai/.well-known/http-message-signatures-directory'].includes(String(url)))throw Error('Unreviewed source');
    if(name==='unavailable')return new Response(null,{status:503});
    if(name==='deadline')return new Promise((resolve,reject)=>init.signal.addEventListener('abort',()=>{aborted=true;reject(Error('Controlled abort'));},{once:true}));
    return Response.json(row.directory,{headers:{'Content-Type':'application/http-message-signatures-directory+json'}});
   }});
  if(name==='mutation')context.headers.set('Forwarded','for=other;use=full');
  return Response.json({result:await pending,abortObserved:aborted});
 }};` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {} });
try {
  const syntax = [], results = [];
  const invoke = async value => {
    const response = await mf.dispatchFetch('https://offline.example/audit', { method: 'POST', body: JSON.stringify(value) });
    if (response.status !== 200) writeFileSync(`${output}.failure.txt`, await response.text(), { flag: 'wx', mode: 0o600 });
    assert.equal(response.status, 200); return response.json();
  };
  for (const item of forwardedSyntaxCases) {
    const result = await invoke({ syntax: true, row: item.header }); assert.equal(result.syntax, item.syntax, item.name);
    if (item.duplicate) assert.equal(result.duplicate, item.duplicate);
    if (Object.hasOwn(item, 'operator')) assert.equal(result.elements[0].operator.value, item.operator);
    if (Object.hasOwn(item, 'use')) assert.equal(result.elements[0].use.value, item.use);
    syntax.push({ name: item.name, ...result });
  }
  for (const trial of trials) {
    const { result, abortObserved } = await invoke(trial), name = trial.name;
    for (const field of ['delegation', 'actualUse', 'humanTrigger', 'nativeHeaderProvenance']) assert.equal(result[field], 'not-established', `${name}:${field}`);
    assert.equal(result.claimAuthentication, ['signed', 'multi', 'mutation'].includes(name) ? 'verified-signer-assertion' : 'not-established', name);
    if (['unsigned', 'changedUnsigned', 'coveredOtherHeader'].includes(name) || name.startsWith('retained-injected')) { assert.equal(result.verified, 1, name); assert.equal(result.verifiedWithoutFieldCoverage, 1, name); }
    if (name === 'changedSigned') { assert.equal(result.invalid, 1); assert.equal(result.verified, 0); }
    if (name === 'multi') { assert.equal(result.verifiedWholeFieldCoverage, 1); assert.equal(result.verifiedWithoutFieldCoverage, 1); }
    if (name === 'limited') { assert.equal(result.assessment, 'partial'); assert.equal(result.unassessedCandidates, 1); }
    if (name === 'unpaired') { assert.equal(result.assessment, 'partial'); assert.equal(result.unpairedMembers, 1); }
    if (name === 'unavailable') { assert.equal(result.unavailable, 1); assert.equal(result.invalid, 0); assert.equal(result.assessment, 'partial'); }
    if (name === 'deadline') { assert.equal(result.termination, 'deadline'); assert.equal(result.assessment, 'partial'); assert.equal(result.unavailable, 1); assert.equal(abortObserved, true); }
    if (name === 'conflict') { assert.equal(result.claims.duplicate, 'different-values'); assert.equal(result.attempted, 0); }
    if (name === 'signature-budget') { assert.equal(result.termination, 'signature-budget'); assert.equal(result.attempted, 0); }
    if (name === 'header-budget') { assert.equal(result.claims.reason, 'header-budget'); assert.equal(result.attempted, 0); }
    if (name === 'invalid-options') { assert.equal(result.policy, null); assert.equal(result.attempted, 0); }
    if (name === 'no-header' || name.startsWith('retained-absent')) { assert.equal(result.assessment, 'absent'); assert.equal(result.attempted, 0); }
    if (['spoof', 'native-boolean-spoof'].includes(name)) { assert.equal(result.verified, 0); assert.equal(result.directoryFetches, 0); }
    results.push({ name, result, abortObserved });
  }
  const receipt = { checkedAt: new Date().toISOString(), profile: '2026-10-29.1', purpose: 'Offline diagnostics only; no classifier, collector, policy or native trust adoption',
    retainedInputSha256: hash(retainedBytes), fixtureInputSha256: hash(fixtureBytes), scriptSha256: hash(readFileSync(new URL(import.meta.url))),
    moduleSha256: hash(readFileSync('packages/analytics/src/forwarded-purpose.ts')), fixtureFactorySha256: hash(readFileSync('packages/analytics/test/fixtures/forwarded-purpose.mjs')),
    directSyntaxCases: syntax, auditCases: results, retainedOriginals: 4, retainedInjectedUnsignedCases: 8,
    externalRequests: 0, productionRequests: 0, d1Statements: 0, newHumanLabels: 0,
    limits: ['Injected headers are counterfactuals, not observed vendor assertions or native Cloudflare propagation.', 'A verified signer assertion does not establish delegation, actual use or a human trigger.', 'No native trustworthy-header source has been adopted.'] };
  writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ syntaxCases: syntax.length, auditCases: results.length, retainedInjectedUnsigned: 8, productionRequests: 0 }));
} finally { await mf.dispose(); }
