import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { analyzeTraffic, KNOWN_CLIENT_PRODUCTS } from '../.test-dist/classify.js';
import { classificationEvidence, retainedDeclaredCategories, retainedMatchedProducts } from '../.test-dist/classification-evidence.js';
import { CLASSIFIER_VERSION } from '../.test-dist/versions.js';
import { extractFetchMetadata } from '../.test-dist/fetch-metadata.js';
import { DatabaseSync } from 'node:sqlite';
import { schemaObjects } from './fresh-schema.mjs';

const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("fixture")}}', compatibilityDate: '2026-03-06', d1Databases: { DB: 'retained-client-products' } });
try {
  const db = await mf.getD1Database('DB');
  const sqlite = new DatabaseSync(':memory:');
  try {
    sqlite.exec(readFileSync(new URL('../schema/0001_fresh_analytics.sql', import.meta.url), 'utf8'));
    for (const row of schemaObjects(sqlite)) await db.prepare(row.sql).run();
  } finally { sqlite.close(); }
  const userAgent = [...KNOWN_CLIENT_PRODUCTS].join(' ');
  const analysis = analyzeTraffic(userAgent);
  // Longest supported network/browser/context/activation labels, five-digit
  // Fetch Metadata bits and false navigation preserve a conservative byte bound.
  const metadata = extractFetchMetadata(new Headers({ 'Sec-Fetch-Mode': 'cors;x',
    'Sec-Fetch-Dest': 'document;x', 'Sec-Fetch-Site': 'same-origin;x', 'Sec-Fetch-User': 'a'.repeat(32769) }));
  const facts = { ...analysis, ...metadata, userAgent, observationSource: 'edge', asn: 7941,
    acceptsHtml: 1, hasAcceptLanguage: 1, signature: { status: 'absent' }, referrerState: 'external' };
  const evidence = classificationEvidence(facts, analysis.declarations);
  const json = JSON.stringify(evidence), bytes = Buffer.byteLength(json);
  assert.ok(bytes <= 2048);
  assert.equal(analysis.declarations.candidates.length, 63);
  assert.equal(analysis.declarations.matchedProducts.length, 74);
  assert.deepEqual(retainedMatchedProducts(evidence), analysis.declarations.matchedProducts);
  const insert = db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,classification_evidence) VALUES(?,'00000000000000000000000000000000','bot','desktop',0,?)");
  await insert.bind('/all-products', json).run();
  assert.equal((await db.prepare("SELECT classification_evidence FROM page_observations WHERE path='/all-products'").first()).classification_evidence, json);
  const historical = JSON.stringify({ version: '2026-10-29.2', classifierProfile: '2026-11-05.1', declarations: { matchedProducts: ['Googlebot', 'Googlebot-Image'] }, declaredCategoryBits: 16 });
  await insert.bind('/historical', historical).run();
  assert.equal((await db.prepare("SELECT classification_evidence FROM page_observations WHERE path='/historical'").first()).classification_evidence, historical);
  assert.deepEqual(retainedMatchedProducts(JSON.parse(historical)), ['Googlebot', 'Googlebot-Image']);
  await assert.rejects(() => insert.bind('/too-large', JSON.stringify({ value: 'x'.repeat(2049) })).run());
  const result = { checkedAt: new Date().toISOString(), classifierProfile: CLASSIFIER_VERSION, schema: evidence.version,
    runtime: 'Node 24 collector-domain code; actual Miniflare/workerd D1 SQL persistence',
    products: analysis.declarations.matchedProducts.length, candidates: analysis.declarations.candidates.length,
    classificationEvidenceBytes: bytes, storageLimitBytes: 2048, remainingBytes: 2048 - bytes,
    matchedProductBits: evidence.declarations.matchedProductBits, declaredCategories: retainedDeclaredCategories(evidence),
    nativeD1InsertAndExactReadback: true, nativeD1RejectsOversizedJson: true, historicalBytesUnchanged: true,
    productionCalls: 0, limits: ['No vendor/network verification or production Worker execution.', 'Synthetic all-products input establishes the current full catalogue storage bound, not production incidence.'] };
  if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify(result));
} finally { await mf.dispose(); }
