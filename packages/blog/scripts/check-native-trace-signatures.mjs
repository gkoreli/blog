import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { nativeTraceSignatureFixture } from '../../analytics/test/fixtures/native-trace-signatures.mjs';
import { auditRetainedWebBotAuth } from '../../analytics/.test-dist/retained-signature-audit.js';

const [input, capture, output] = process.argv.slice(2); assert.ok(output);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fixture = await nativeTraceSignatureFixture(), inputBytes = JSON.stringify(fixture) + '\n';
writeFileSync(input, inputBytes, { flag: 'wx', mode: 0o600 });
const common = `import {auditRetainedWebBotAuth} from './packages/analytics/src/retained-signature-audit.ts';
async function audit(request,row){return auditRetainedWebBotAuth(request,{recordedAt:new Date(row.now),fetcher:async(url)=>{
 if(String(url)!=='https://trace-fixture.example/.well-known/http-message-signatures-directory')throw Error('Unreviewed resolver');
 return Response.json(row.directory,{headers:{'Content-Type':'application/http-message-signatures-directory+json'}});
}});}`;
const producer = `${common}
export default{async fetch(request,env){const row=env.TRIALS[request.headers.get('x-trial')];
 if(!row)return new Response(null,{status:404});
 return Response.json({result:await audit(request,row)});
}};`;
const consumer = `${common}
export default{async tail(events,env){for(const event of events){
 const view=event.event?.request;if(!view)continue;
 const name=view.headers['x-trial'],row=env.TRIALS[name];if(!row)continue;
 const original=view.getUnredacted();
 const copy=v=>({url:v.url,method:v.method,headers:v.headers});
 const retained=copy(view),unredacted=copy(original);
 const reconstruct=v=>new Request(v.url,{method:v.method,headers:v.headers});
 await env.RESULTS.fetch('https://local-results.example/capture',{method:'POST',body:JSON.stringify({name,
  event:{scriptName:event.scriptName,outcome:event.outcome,truncated:event.truncated,exceptions:event.exceptions.length},
  retained,unredacted,defaultAudit:await audit(reconstruct(retained),row),unredactedAudit:await audit(reconstruct(unredacted),row)
 })});
}}};`;
const bundle = async contents => (await build({ stdin: { contents, resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' })).outputFiles[0].text;
const [producerScript, consumerScript] = await Promise.all([bundle(producer), bundle(consumer)]);
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const pending = new Map(), captured = [], rows = [], trials = Object.fromEntries(fixture.trials.map(row => [row.name, row]));
const mf = new Miniflare({ workers: [
  { name: 'producer', modules: true, script: producerScript, compatibilityDate: '2026-03-06', cf: {}, tails: ['consumer'], bindings: { TRIALS: trials } },
  { name: 'consumer', modules: true, script: consumerScript, compatibilityDate: '2026-03-06', cf: {}, bindings: { TRIALS: trials }, serviceBindings: {
    RESULTS: async request => { const value = await request.json(); captured.push(value); pending.get(value.name)?.(value); return new Response(null, { status: 204 }); },
  } },
] });
try {
  for (const row of fixture.trials) {
    let timer;
    const delivered = new Promise((resolve, reject) => {
      pending.set(row.name, resolve); timer = setTimeout(() => reject(Error(`Missing local trace: ${row.name}`)), 10000);
    });
    try {
      const headers = new Headers(row.headers); headers.set('x-trial', row.name);
      const response = await mf.dispatchFetch(row.url, { method: row.method, headers }); assert.equal(response.status, 200);
      const producerResult = await response.json(), trace = await delivered;
      // The installed local runtime does not populate scriptName. Association
      // here uses one configured producer and an exact synthetic case key.
      assert.deepEqual(trace.event, { scriptName: null, outcome: 'ok', truncated: false, exceptions: 0 });
      const replay = async view => auditRetainedWebBotAuth(new Request(view.url, { method: view.method, headers: view.headers }), {
        recordedAt: new Date(row.now), fetcher: async () => Response.json(row.directory, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } }),
      });
      const serializedReplay = await replay(trace.retained), unredactedReplay = await replay(trace.unredacted);
      assert.deepEqual(serializedReplay, trace.defaultAudit); assert.deepEqual(unredactedReplay, trace.unredactedAudit);
      assert.equal(producerResult.result.capturedInputAudit.verifiedCandidates, Number(row.expected.producerVerified), row.name);
      assert.equal(trace.unredactedAudit.capturedInputAudit.verifiedCandidates, Number(row.expected.producerVerified), row.name);
      assert.equal(trace.defaultAudit.capturedInputAudit.verifiedCandidates, Number(row.expected.defaultTraceVerified), row.name);
      assert.equal(trace.defaultAudit.availability.placeholderShapedUrlComponents, ['covered-target-uri', 'covered-path', 'covered-query', 'literal-url-marker'].includes(row.name) ? 1 : 0, row.name);
      const changedHeaders = Object.keys(trace.unredacted.headers).filter(name => trace.unredacted.headers[name] !== trace.retained.headers[name]);
      assert.deepEqual(changedHeaders.sort(), ['covered-cookie', 'literal-cookie-marker', 'unsigned-cookie'].includes(row.name) && row.name !== 'literal-cookie-marker' ? ['cookie'] : row.name === 'covered-benign-key-name' ? ['x-monkey'] : row.name === 'unsigned-authorization' ? ['authorization'] : []);
      assert.equal(trace.unredacted.url !== trace.retained.url, ['covered-target-uri', 'covered-path', 'covered-query', 'unsigned-url'].includes(row.name));
      rows.push({ name: row.name, expected: row.expected, event: trace.event, changedHeaderCount: changedHeaders.length, urlChanged: trace.unredacted.url !== trace.retained.url,
        producer: producerResult.result, defaultTrace: trace.defaultAudit, unredactedTrace: trace.unredactedAudit, nodeSerializedReplayMatchesNative: true });
    } finally { clearTimeout(timer); pending.delete(row.name); }
  }
  assert.equal(captured.length, fixture.trials.length);
  const captureBytes = JSON.stringify({ traces: captured }) + '\n'; writeFileSync(capture, captureBytes, { flag: 'wx', mode: 0o600 });
  const receipt = { checkedAt: new Date().toISOString(), scope: 'Local native workerd producer and Tail Worker; synthetic inputs only',
    inputSha256: hash(inputBytes), captureSha256: hash(captureBytes), scriptSha256: hash(readFileSync(new URL(import.meta.url))), fixtureSha256: hash(readFileSync('packages/analytics/test/fixtures/native-trace-signatures.mjs')),
    cases: rows, newProductionRequests: 0, externalResolverRequests: 0, d1Statements: 0, humanLabels: 0,
    limits: ['Synthetic getUnredacted use only; no production credentials or raw-capture adoption.', 'Tail Worker API is not the Workers Logs dashboard export contract.', 'Local trace scriptName is null; case association uses the isolated one-producer topology and unique synthetic case key.', 'Local trace results do not identify the redaction path of earlier production representations.'] };
  writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ producerCases: rows.length, nativeTraces: captured.length, originalVerified: rows.filter(row => row.producer.capturedInputAudit.verifiedCandidates > 0).length, defaultTraceVerified: rows.filter(row => row.defaultTrace.capturedInputAudit.verifiedCandidates > 0).length }));
} finally { await mf.dispose(); }
