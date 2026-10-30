import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { directoryCacheFixture } from '../../analytics/test/fixtures/directory-cache.mjs';
import { auditDirectoryResponse } from '../../analytics/.test-dist/directory-response-audit.js';

const [output, inputPath, mode = 'create'] = process.argv.slice(2);
assert.ok(output && inputPath && ['create', 'reuse'].includes(mode), 'Supply new receipt path, frozen input path and create/reuse');
const data = mode === 'reuse' ? JSON.parse(readFileSync(inputPath, 'utf8')) : directoryCacheFixture();
if (mode === 'create') writeFileSync(inputPath, JSON.stringify(data) + '\n', { mode: 0o600, flag: 'wx' });
const runner = `async function measure(trial, audit) {
  const counts={digest:0,importKey:0,verify:0}, originals={};
  for(const name of Object.keys(counts)){
    originals[name]=crypto.subtle[name];
    crypto.subtle[name]=function(...args){counts[name]++;return originals[name].apply(this,args);};
  }
  try{return {counts,result:await audit({...trial.context,body:new Uint8Array(trial.context.body)},{now:new Date(trial.now)})};}
  finally{for(const name of Object.keys(counts))crypto.subtle[name]=originals[name];}
}`;
// Same pass-through counter wrappers in Node and workerd. No crypto/time substitution.
const measure = new Function(`${runner}; return measure;`)();
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
  import {auditDirectoryResponse} from './packages/analytics/src/directory-response-audit.ts';
  ${runner}
  export default {async fetch(request){const data=await request.json(),rows=[];
    for(const trial of data.scenarios)rows.push({name:trial.name,...await measure(trial,auditDirectoryResponse)});
    return Response.json(rows);
  }};
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {} });
try {
  const native = await (await mf.dispatchFetch('https://offline.invalid/matrix', { method: 'POST', body: JSON.stringify(data) })).json();
  const rows = [];
  for (const [index, trial] of data.scenarios.entries()) {
    const node = { name: trial.name, ...await measure(trial, auditDirectoryResponse) };
    assert.deepEqual(node, native[index], trial.name);
    const plain = await auditDirectoryResponse({ ...trial.context, body: new Uint8Array(trial.context.body) }, { now: new Date(trial.now) });
    assert.deepEqual(plain, node.result, 'Counter wrappers preserve results');
    rows.push(node);
  }
  const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex');
  writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), inputSha256: hash(inputPath),
    auditSourceSha256: hash('packages/analytics/src/directory-response-audit.ts'), workerBundleSha256: createHash('sha256').update(bundle.outputFiles[0].contents).digest('hex'),
    method: 'Actual pass-through WebCrypto operation counters, exact Node/local-workerd agreement, plain-result comparison; not CPU/billing/latency measurements',
    rows, externalRequests: 0, productionRequests: 0, d1Statements: 0 }, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  console.log(JSON.stringify({ compared: rows.length, inputSha256: hash(inputPath), duplicate128: rows.find(row => row.name === 'duplicate-128@0').counts,
    absent128: rows.find(row => row.name === 'absent-proof-duplicate-128@0').counts }));
} finally { await mf.dispose(); }
