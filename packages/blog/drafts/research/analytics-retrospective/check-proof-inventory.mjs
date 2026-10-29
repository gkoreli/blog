import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { build } from 'esbuild';
import { normalizeProjection } from '../../../scripts/check-signed-slice.mjs';
import { reconcileInvocations } from './reconcile-organic-exa.mjs';
import { reconcileReceiptStorage } from './reconcile-receipt-storage.mjs';
import { auditWebBotAuthReuse } from '../../../../analytics/.test-dist/webbotauth-reuse-audit.js';

const hash = value => createHash('sha256').update(value).digest('hex');
const json = path => JSON.parse(readFileSync(path));
const publicRoot = dirname(new URL(import.meta.url).pathname);

// Deduplicate repeated representations of one stored observation. Equal proofs
// on distinct observations must remain distinct so the reuse audit can see them.
export function mergeInventory(memberships) {
  const records = new Map(), sources = {};
  for (const entry of memberships) {
    assert.ok(typeof entry.source === 'string' && entry.source.length > 0);
    const projection = normalizeProjection(entry.projection), key = projection.privateReference;
    const previous = records.get(key);
    if (previous) assert.ok(isDeepStrictEqual(previous.projection, projection)
      && isDeepStrictEqual(previous.context, entry.context), 'Conflicting representations of one stored observation');
    else records.set(key, { projection, context: entry.context });
    const source = sources[entry.source] ??= new Set(); source.add(key);
  }
  return { records: [...records.values()], summary: { memberships: memberships.length,
    distinctStoredObservations: records.size,
    uniqueBySource: Object.fromEntries(Object.entries(sources).map(([name, refs]) => [name, refs.size])),
    overlappingSourceMemberships: Object.values(sources).reduce((n, refs) => n + refs.size, 0) - records.size } };
}

async function main() {
  const [archiveRoot, outputRoot] = process.argv.slice(2); assert.ok(outputRoot);
  const commitments = [], rechecked = new Map();
  function archive(name, expected) {
    const root = join(archiveRoot, name), bytes = readFileSync(join(root, 'manifest.json'));
    assert.equal(hash(bytes), expected);
    const manifest = JSON.parse(bytes), files = Array.isArray(manifest) ? manifest : manifest.files;
    commitments.push({ archive: name, manifestSha256: expected });
    return rel => {
      const entry = files.find(file => (file.path ?? file.file) === rel); assert.ok(entry, 'Uncommitted archive member');
      const bytes = readFileSync(join(root, rel)); assert.equal(hash(bytes), entry.sha256);
      rechecked.set(name + '/' + rel, hash(bytes)); return JSON.parse(bytes);
    };
  }
  const sources80 = json(join(publicRoot, 'signed-slice-sources.json'));
  const a75 = archive('2026-10-29-frozen-signed-cohort', sources80.previousArchives[2].manifestSha256);
  const a69 = archive('2026-10-29-current-verifier-cohort', sources80.previousArchives[0].manifestSha256);
  const a72 = archive('2026-10-29-latest-signed-and-header-selection', sources80.previousArchives[1].manifestSha256);
  const a80 = archive('2026-10-29-signed-slice-data', json(join(publicRoot, 'signed-slice-checks.json')).privateDataArchive.manifestSha256);
  const canonical = [], contexts = [];
  function cohort(source, readback, chains, input, expected) {
    const rows = readback[0].results; assert.equal(readback[0].success, true); assert.equal(rows.length, expected);
    const reconciliation = reconcileReceiptStorage(rows, chains);
    assert.equal(reconciliation.identicalProjectionPairs, expected);
    assert.equal(reconciliation.storedLocalVerifiedPairs, expected);
    assert.equal(reconciliation.ambiguousReferenceGroups, 0);
    const joined = reconcileInvocations(chains, new Set(['ExaSearchBot', 'AhrefsBot']));
    assert.equal(joined.reconciliations.length, expected);
    assert.ok(Object.values(joined.integrity).every(value => value === 0));
    const originals = input.trials.filter(trial => trial.variant === 'original'); assert.equal(originals.length, expected);
    const matched = new Set();
    for (const item of joined.reconciliations) {
      assert.equal(item.complete, true);
      const invocation = item.row, data = invocation.$workers.event.request;
      const request = new Request(data.url, { method: data.method, headers: data.headers });
      const at = new Date(invocation.timestamp).toISOString(), headers = Object.fromEntries(request.headers);
      const matches = originals.filter(trial => trial.now === at && trial.url === request.url
        && trial.method === request.method && isDeepStrictEqual(Object.fromEntries(new Headers(trial.headers)), headers));
      assert.equal(matches.length, 1); const trial = matches[0]; assert.equal(matched.has(trial), false); matched.add(trial);
      const stored = chains.filter(row => row.source?.message === 'analytics.observation_stored'
        && row.$metadata.requestId === invocation.$metadata.requestId); assert.equal(stored.length, 1);
      const row = rows.find(row => row.privateReference === stored[0].source.storage.observationId); assert.ok(row);
      assert.equal(row.signatureStatus, 'verified'); assert.equal(row.ownerFlag, 0); assert.equal(row.referrerHost, null);
      const context = { reference: invocation.$metadata.requestId, now: at, url: request.url,
        method: request.method, headers, vendor: trial.vendor, directory: trial.directory };
      canonical.push({ source, projection: row, context }); contexts.push(context);
    }
    return reconciliation;
  }
  const reconciliations = {
    'older-52': cohort('older-52', a75('gk-export75-readback.json'), a75('gk-export75-old-chains.json'), a75('gk-export75-reference-input-final.json'), 52),
    'current-four': cohort('current-four', a69('gk-current69-readback.json'), a69('gk-current69-chains.json'), a69('gk-current69-reference-input.json'), 4),
    'latest-two': cohort('latest-two', a72('gk-native72-readback.json'), a72('gk-native72-chains.json'), a72('gk-native72-reference-input.json'), 2),
    'recovered-one': cohort('recovered-one', [{ success: true, results: a80('private/new-row.json') }], a80('private/chains.json'), a80('private/input.json'), 1),
  };
  const aliases = canonical.filter(entry => entry.source !== 'older-52').map(entry => ({ ...entry, source: 'seven-proof-report' }));
  const inventory = mergeInventory([...canonical.filter(entry => entry.source !== 'recovered-one'), ...aliases]);
  assert.equal(inventory.summary.memberships, 65); assert.equal(inventory.records.length, 59);
  assert.equal(inventory.summary.overlappingSourceMemberships, 6);
  const distinctReferences = new Set(inventory.records.map(row => row.context.reference)); assert.equal(distinctReferences.size, 59);
  const bounds = a80('private/known.json').bounds;
  for (const entry of canonical) {
    const value = BigInt(entry.projection.privateReference);
    if (entry.source === 'older-52') assert.ok(value <= BigInt(bounds.lowerIdExclusive));
    else assert.ok(value > BigInt(bounds.lowerIdExclusive) && value <= BigInt(bounds.upperIdInclusive));
  }
  // Adversarial identity gates: overlap, conflicts, large IDs and reused proofs.
  const fixture = canonical[0], duplicate = mergeInventory([fixture, { ...fixture, source: 'alias' }]);
  assert.equal(duplicate.records.length, 1);
  const conflict = structuredClone(fixture); conflict.projection.ownerFlag = 1;
  assert.throws(() => mergeInventory([fixture, conflict]));
  const changedContext = structuredClone(fixture); changedContext.context.url = 'https://offline.invalid/changed';
  assert.throws(() => mergeInventory([fixture, changedContext]));
  const first = { ...fixture, projection: { ...fixture.projection, privateReference: '9007199254740992' } };
  const second = { ...fixture, projection: { ...fixture.projection, privateReference: '9007199254740993' } };
  assert.equal(mergeInventory([first, second]).records.length, 2);
  assert.throws(() => mergeInventory([{ ...fixture, projection: { ...fixture.projection, privateReference: 9007199254740992 } }]));
  const trials = inventory.records.map(row => row.context);
  const inputBytes = JSON.stringify({ trials }) + '\n';
  writeFileSync(join(outputRoot, 'inventory-input.json'), inputBytes, { flag: 'wx', mode: 0o600 });
  const directories = new Map();
  for (const trial of trials) {
    const origin = trial.vendor === 'exa' ? 'https://crawler.exa.ai' : 'https://ahrefs.com';
    // All retained captures must agree before sharing one offline resolver.
    const prior = directories.get(origin);
    if (prior) assert.ok(isDeepStrictEqual(prior, trial.directory)); else directories.set(origin, trial.directory);
  }
  const fetcher = async url => {
    const origin = String(url).replace('/.well-known/http-message-signatures-directory', '');
    const directory = directories.get(origin); assert.ok(directory);
    assert.equal(String(url), origin + '/.well-known/http-message-signatures-directory');
    return Response.json(directory, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } });
  };
  const observations = trials.map(trial => ({ reference: trial.reference, observedAt: new Date(trial.now),
    request: new Request(trial.url, { method: trial.method, headers: trial.headers }) }));
  const node = await auditWebBotAuthReuse(observations, { fetcher });
  assert.equal(node.assessment, 'complete'); assert.equal(node.verifiedObservations, 59);
  const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
    import{auditWebBotAuthReuse}from './packages/analytics/src/webbotauth-reuse-audit.ts';
    export default{async fetch(request){const{trials}=await request.json();const observations=trials.map(t=>({reference:t.reference,observedAt:new Date(t.now),request:new Request(t.url,{method:t.method,headers:t.headers})}));
    return Response.json(await auditWebBotAuthReuse(observations,{fetcher:async url=>{const t=trials.find(t=>String(url)===(t.vendor==='exa'?'https://crawler.exa.ai':'https://ahrefs.com')+'/.well-known/http-message-signatures-directory');if(!t)throw Error('Unreviewed directory');return Response.json(t.directory,{headers:{'Content-Type':'application/http-message-signatures-directory+json'}});}}));}};`
  }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
  const req = createRequire(resolve('package.json'));
  const { Miniflare } = await import(pathToFileURL(req.resolve('miniflare', { paths: [dirname(req.resolve('wrangler/package.json'))] })));
  const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {} });
  try {
    const response = await mf.dispatchFetch('https://offline.invalid/inventory', { method: 'POST', body: inputBytes });
    assert.equal(response.status, 200); const native = await response.json(); assert.deepEqual(native, node);
    const result = { checkedAt: new Date().toISOString(), scriptSha256: hash(readFileSync(new URL(import.meta.url))),
      sourceBaseline: '186f855', archives: commitments, recheckedArchiveFiles: rechecked.size,
      inputSha256: hash(inputBytes), inventory: inventory.summary,
      exactReceiptProjectionsByCanonicalSource: Object.fromEntries(Object.entries(reconciliations).map(([name, value]) => [name, value.identicalProjectionPairs])),
      gates: { duplicateRepresentationsMerge: true, conflictingProjectionsRejected: true, conflictingContextsRejected: true,
        adjacentLargeReferencesDistinct: true, repeatedProofOnDistinctReferencesPreserved: true, unsafeNumericReferencesRejected: true },
      nodeAndNativeReuse: node, newProductionRequests: 0, newD1Statements: 0, newHumanLabels: 0,
      limits: ['Archived stored projections were read at different times; this is not exact membership in one held census snapshot.',
        'No full retained-population replay denominator or detector accuracy rate follows from this selected inventory.',
        'Captured later keys do not recover original directory resolution or managed-provider agreement.',
        'No repeated proof/nonce in this cohort would not establish distinct actions, human triggers or global replay absence.'] };
    writeFileSync(join(outputRoot, 'inventory.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    console.log(JSON.stringify({ memberships: 65, distinct: 59, verified: node.verifiedObservations,
      distinctProofs: node.distinctVerifiedProofs, repeatedProofGroups: node.repeatedProofGroups, repeatedNonceGroups: node.repeatedNonceGroups }));
  } finally { await mf.dispose(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
