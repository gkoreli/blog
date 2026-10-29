import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { join } from 'node:path';
import { reconcileInvocations } from './reconcile-organic-exa.mjs';

const [chainsFile, receiptsFile, directories, boundarySqlFile, inputFile, output] = process.argv.slice(2); assert.ok(output);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const chainBytes = readFileSync(chainsFile), receiptBytes = readFileSync(receiptsFile);
const chains = JSON.parse(chainBytes), receipts = JSON.parse(receiptBytes);
assert.equal(chains.length, 208); assert.equal(receipts.length, 52);
const reconciled = reconcileInvocations(chains, new Set(['ExaSearchBot', 'AhrefsBot']));
assert.equal(reconciled.reconciliations.length, 52); assert.ok(reconciled.reconciliations.every(row => row.complete));
assert.ok(Object.values(reconciled.integrity).every(n => n === 0));
const boundaryBytes = readFileSync(boundarySqlFile);
assert.equal(hash(boundaryBytes), '50cbc14b038f670bb07d5bedbfb8cd7811a3e88abdf4cd7a59878029d21a111c');
const bounds = boundaryBytes.toString('utf8').matchAll(/(?:id|id\))\s*(?:>|<=)\s*(?:CAST\()?\s*['"]?(\d+)/g);
const limits = [...bounds].map(match => BigInt(match[1])); assert.equal(limits.length, 2);
const captures = {};
for (const [vendor, origin] of [['exa', 'https://crawler.exa.ai'], ['ahrefs', 'https://ahrefs.com']]) {
  const bytes = readFileSync(join(directories, vendor + '.json')), capture = JSON.parse(readFileSync(join(directories, vendor + '-capture.json')));
  assert.equal(capture.source, origin + '/.well-known/http-message-signatures-directory'); assert.equal(capture.responseStatus, 200);
  assert.equal(capture.sha256, hash(bytes)); assert.equal(capture.responseHeaders['content-type'].split(';')[0].trim(), 'application/http-message-signatures-directory+json');
  captures[vendor] = { directory: JSON.parse(bytes), capture };
}
const trials = [], references = new Set(), observations = new Set(), workers = new Set(), names = {}, surfaces = { invocationHeaders: 0, invocationPath: 0, invocationSearch: 0, sourceMessageMatches: 0, metadataMessageMatches: 0, urlMarkerShaped: 0 };
for (const item of reconciled.reconciliations.sort((a,b) => Date.parse(a.row.timestamp)-Date.parse(b.row.timestamp))) {
  const invocation = item.row, request = invocation.$workers.event.request, reference = invocation.$metadata.requestId;
  assert.equal(references.has(reference), false); references.add(reference);
  assert.ok(Date.parse(invocation.timestamp) >= Date.parse('2026-10-28T05:41:35Z') && Date.parse(invocation.timestamp) < Date.parse('2026-10-29T01:30:47Z'));
  const stored = chains.filter(row => row.$metadata.requestId === reference && row.source?.message === 'analytics.observation_stored'); assert.equal(stored.length, 1);
  const copy = receipts.filter(row => row.$metadata.requestId === reference); assert.equal(copy.length, 1); assert.ok(isDeepStrictEqual(copy[0], stored[0]));
  const source = stored[0].source, id = source.storage.observationId, receipt = source.receipt;
  assert.equal(typeof id, 'string'); assert.match(id, /^[1-9][0-9]*$/); assert.ok(BigInt(id) > limits[0] && BigInt(id) <= limits[1]);
  assert.equal(observations.has(id), false); observations.add(id);
  assert.equal(source.collectionVersion, '2026-10-28.10'); assert.equal(receipt.version, '2026-10-28.2'); assert.equal(receipt.signature.verifierProfile, '2026-10-28.7'); assert.equal(receipt.signature.outcome, 'verified');
  const name = receipt.declarations.candidateNames; assert.ok(['ExaSearchBot','AhrefsBot'].includes(name)); names[name] = (names[name] ?? 0) + 1;
  const vendor = name === 'AhrefsBot' ? 'ahrefs' : 'exa', captured = captures[vendor];
  assert.ok(Date.parse(captured.capture.capturedAt) > Date.parse(invocation.timestamp));
  const context = new Request(request.url, { method: request.method, headers: request.headers }); assert.equal(context.url, request.url); assert.equal(context.method, 'GET');
  assert.equal(context.headers.has('x-analytics-control'), false); assert.equal(context.headers.has('x-analytics-fixture'), false);
  for (const field of ['targetUri','method','path','query','userAgent']) assert.equal(receipt.signature.coverage[field], false);
  assert.equal(receipt.signature.coverage.authority, true);
  surfaces.invocationHeaders += Object.hasOwn(request,'headers'); surfaces.invocationPath += Object.hasOwn(request,'path'); surfaces.invocationSearch += Object.hasOwn(request,'search');
  surfaces.sourceMessageMatches += invocation.source.message === request.method + ' ' + request.url;
  surfaces.metadataMessageMatches += invocation.$metadata.message === invocation.source.message;
  surfaces.urlMarkerShaped += /(?:^|[^a-z0-9+_-])REDACTED(?=$|[^a-z0-9+_-])/i.test(request.url);
  workers.add(invocation.$workers.scriptVersion.id);
  for (const variant of ['original', 'changed-authority', 'changed-unsigned-role-and-path']) {
    const url = new URL(context.url), headers = new Headers(context.headers);
    if (variant === 'changed-authority') url.hostname = 'offline-control.invalid';
    if (variant === 'changed-unsigned-role-and-path') { url.pathname='/offline-unsigned-role-control'; headers.set('User-Agent','OfflineControl/1.0'); }
    const changed = new Request(url,{method:context.method,headers});
    trials.push({ vendor, variant, now: new Date(invocation.timestamp).toISOString(), url: changed.url, method: changed.method, headers: Object.fromEntries(changed.headers), directory: captured.directory });
  }
}
assert.deepEqual(names, { ExaSearchBot: 51, AhrefsBot: 1 });
const inputBytes = JSON.stringify({trials})+'\n'; writeFileSync(inputFile,inputBytes,{flag:'wx',mode:0o600});
const result = { checkedAt:new Date().toISOString(), chainsSha256:hash(chainBytes), receiptsSha256:hash(receiptBytes), boundarySqlSha256:hash(boundaryBytes), inputSha256:hash(inputBytes), scriptSha256:hash(readFileSync(new URL(import.meta.url))),
  records:chains.length, invocations:52, independentReceiptCopies:52, exactBoundMembership:52, declarations:names, executionWorkers:[...workers], surfaces, contextCount:trials.length,
  directories:Object.fromEntries(Object.entries(captures).map(([name,value])=>[name,value.capture])),
  exactD1ProjectionCompared:false, originalWireCompletenessProven:false, productionRequests:0, d1Statements:0, humanLabels:0 };
writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({invocations:52,contexts:trials.length,exactBoundMembership:52,independentReceiptCopies:52}));
