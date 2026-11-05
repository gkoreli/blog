import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseStream, publicReceipt } from '../fetcher-study-v2/extract-live-fetches.mjs';
import { isObservationId } from '../../../../analytics/src/observation-storage.ts';
import { storedObservationReceipt } from '../../../../analytics/src/observation-receipt.ts';

// Run from the repository root with the blog's tsx loader. All outputs are private.
// prepare PRIVATE_DIR NEW_OUTPUT [PUBLIC_BATCH_CONFIG]; accept PRIVATE_OUTPUT WRANGLER_RESPONSE_JSON
const [mode, inputPath, outputPath, configPath] = process.argv.slice(2);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const read = file => JSON.parse(readFileSync(file, 'utf8'));
const save = (file, data) => writeFileSync(file, JSON.stringify(data, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
const defaultLabels = ['exa-fetch-01', 'exa-api-fetch-01', 'exa-api-crawl-01', 'duck-02',
  'tavily-extract-01', 'tavily-map-01', 'tavily-crawl-01', 'tavily-research-01',
  'firecrawl-scrape-01', 'firecrawl-crawl-01', 'firecrawl-map-01', 'firecrawl-browser-scrape-01'];
const config = configPath ? read(configPath) : { streams: ['tail.raw', 'tail2.raw'], trialPrefix: 'bot-grill-20261104-', assignedLabels: defaultLabels };
assert.ok(Array.isArray(config.streams) && config.streams.length > 0 && config.streams.length <= 4
  && config.streams.every(file => typeof file === 'string' && /^[a-z0-9][a-z0-9.-]*\.raw$/.test(file)));
assert.ok(typeof config.trialPrefix === 'string' && /^[a-z0-9-]{1,80}$/.test(config.trialPrefix));
assert.ok(Array.isArray(config.assignedLabels) && config.assignedLabels.length > 0
  && config.assignedLabels.every(label => typeof label === 'string' && /^[a-z0-9-]{1,80}$/.test(label)));
const trialPrefix = config.trialPrefix;
const assignedLabels = new Set(config.assignedLabels);

if (mode === 'prepare') {
  assert.ok(inputPath && outputPath, 'prepare PRIVATE_DIR NEW_OUTPUT');
  const output = resolve(outputPath);
  mkdirSync(output, { mode: 0o700 });
  const inputs = config.streams.map(file => {
    const bytes = readFileSync(resolve(inputPath, file));
    const parsed = parseStream(bytes.toString('utf8'));
    return { file, bytes, parsed };
  });
  const privateEvents = [], sideRequests = [], events = [], ids = new Set(), operations = new Set();
  for (const { parsed } of inputs) {
    for (const envelope of parsed.objects) {
      const request = envelope.event?.request;
      if (typeof request?.url !== 'string') continue;
      const url = new URL(request.url), labels = url.searchParams.getAll('probe');
      if (url.origin !== 'https://gkoreli.com' || labels.length !== 1 || !labels[0].startsWith(trialPrefix)) continue;
      const label = labels[0].slice(trialPrefix.length);
      if (!assignedLabels.has(label)) { sideRequests.push(envelope); continue; }
      const attempts = envelope.logs.filter(log => log.message?.[0] === 'analytics.observation_attempt');
      const stored = envelope.logs.filter(log => log.message?.[0] === 'analytics.observation_stored');
      assert.equal(attempts.length, 1, 'Expected one attempt for the controlled request');
      assert.equal(stored.length, 1, 'Expected one storage acknowledgement');
      const ack = stored[0].message[1];
      assert.equal(ack.operationId, attempts[0].message[1].operationId);
      assert.equal(ack.collectionVersion, attempts[0].message[1].collectionVersion);
      assert.equal(ack.storage.status, 'returned');
      assert.ok(isObservationId(ack.storage.observationId));
      assert.ok(!ids.has(ack.storage.observationId), 'Duplicate returned storage reference');
      assert.ok(!operations.has(ack.operationId), 'Duplicate operation ID');
      ids.add(ack.storage.observationId); operations.add(ack.operationId);
      const headers = request.headers;
      const ua = headers['user-agent'] ?? '';
      const products = [...ua.matchAll(/\b(ExaUser|ExaSearchBot|DuckAssistBot|ChatGPT-User|OAI-SearchBot|Perplexity-User|PerplexityBot|Slackbot-LinkExpanding|Chrome|Firefox|Safari|Version)[ /]([0-9.]+)/g)].map(match => `${match[1]}/${match[2]}`);
      const components = [...(headers['signature-input'] ?? '').matchAll(/\(([^)]*)\)/g)]
        .flatMap(match => [...match[1].matchAll(/"([@a-z][@a-z0-9-]*)"/g)].map(value => value[1]));
      privateEvents.push(envelope);
      events.push({ trialLabel: label, timestamp: new Date(envelope.eventTimestamp).toISOString(),
        workerVersion: envelope.scriptVersion?.id ?? null, collectionVersion: ack.collectionVersion,
        originStatus: envelope.event.response?.status ?? null, userAgentProducts: [...new Set(products)],
        cloudflareFacts: { asn: Number.isInteger(request.cf?.asn) ? request.cf.asn : null,
          country: /^[A-Z]{2}$/.test(request.cf?.country ?? '') ? request.cf.country : null,
          httpProtocol: /^HTTP\/[123](?:\.[01])?$/.test(request.cf?.httpProtocol ?? '') ? request.cf.httpProtocol : null,
          tlsVersion: /^TLSv1\.[23]$/.test(request.cf?.tlsVersion ?? '') ? request.cf.tlsVersion : null },
        fetchMetadata: Object.fromEntries(['sec-fetch-mode', 'sec-fetch-dest', 'sec-fetch-site', 'sec-fetch-user'].map(key => [key,
          headers[key] === undefined ? null : /^(navigate|no-cors|cors|same-origin|websocket|document|iframe|empty|none|same-site|cross-site|\?1|\?0)$/.test(headers[key]) ? headers[key] : 'unrecognized'])),
        signatureComponents: components, receipt: publicReceipt(ack.receipt) });
    }
  }
  const sortedIds = [...ids].sort((a, b) => BigInt(a) < BigInt(b) ? -1 : BigInt(a) > BigInt(b) ? 1 : 0);
  assert.ok(sortedIds.length > 0 && sortedIds.length <= 40);
  const sql = `SELECT CAST(id AS TEXT) AS observation_id, path, collection_version, classifier_version,
representation, is_owner, reader_kind, signature_status, signature_agent,
signature_evidence, classification_evidence, vendor_ip_evidence
FROM page_observations WHERE id IN (${sortedIds.map(id => `CAST('${id}' AS INTEGER)`).join(',')})
ORDER BY id LIMIT ${sortedIds.length + 1};\n`;
  save(resolve(output, 'matched-private.json'), privateEvents);
  save(resolve(output, 'nonexact-probe-requests-private.json'), sideRequests);
  writeFileSync(resolve(output, 'readback-private.sql'), sql, { flag: 'wx', mode: 0o600 });
  save(resolve(output, 'projection.json'), { checkedAt: new Date().toISOString(),
    streams: inputs.map(({ file, bytes, parsed }) => ({ file, sha256: hash(bytes), bytes: bytes.length,
      completedObjects: parsed.objects.length, malformedFrames: parsed.malformed.length,
      outsideFragments: parsed.outside.length, suffixBytes: Buffer.byteLength(parsed.suffix) })),
    matchedRequests: events.length, nonexactProbeRequests: sideRequests.length, returnedReferences: ids.size, events });
  const require = createRequire(resolve('package.json'));
  const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
  const schema = readFileSync('packages/analytics/schema.sql', 'utf8');
  const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("preflight")}}',
    compatibilityDate: '2026-03-06', cf: {}, d1Databases: ['DB'], d1Persist: resolve(output, 'local-d1') });
  try {
    const db = await mf.getD1Database('DB');
    await db.batch(schema.replace(/^\s*--.*$/gm, '').split(';').map(value => value.trim()).filter(Boolean).map(value => db.prepare(value)));
    for (const id of sortedIds) await db.prepare("INSERT INTO page_observations(id,path,daily_client_id,traffic_class,device_type,is_owner) VALUES(CAST(? AS INTEGER),'/local-preflight',?,'browser','desktop',1)").bind(id, '0'.repeat(32)).run();
    const plan = await db.prepare('EXPLAIN QUERY PLAN ' + sql).all();
    assert.ok(plan.results.every(row => /INTEGER PRIMARY KEY/.test(row.detail)));
    const result = await db.prepare(sql).all();
    assert.deepEqual(result.results.map(row => row.observation_id), sortedIds);
    save(resolve(output, 'native-preflight.json'), { status: 'passed-local-workerd-d1', sqlSha256: hash(sql),
      schemaSha256: hash(schema), selectedRows: result.results.length, queryPlan: plan.results.map(row => row.detail),
      productionReadPlanned: { maxReturnedRows: sortedIds.length, maxStatements: 1, exactIds: true, writes: false },
      limits: ['Native seeded query/plan only; production cost and row contents remain untested.'] });
  } finally { await mf.dispose(); }
  console.log(JSON.stringify({ matchedRequests: events.length, nativePreflight: 'passed', sqlSha256: hash(sql) }));
} else if (mode === 'accept') {
  assert.ok(inputPath && outputPath, 'accept PRIVATE_OUTPUT WRANGLER_RESPONSE_JSON');
  const response = read(outputPath);
  assert.equal(response.length, 1); assert.equal(response[0].success, true);
  const result = response[0], rows = result.results, captures = read(resolve(inputPath, 'matched-private.json'));
  assert.equal(rows.length, captures.length);
  assert.equal(result.meta.rows_written, 0); assert.equal(result.meta.changed_db, false);
  for (const envelope of captures) {
    const ack = envelope.logs.find(log => log.message?.[0] === 'analytics.observation_stored').message[1];
    const matches = rows.filter(row => row.observation_id === ack.storage.observationId);
    assert.equal(matches.length, 1);
    const row = matches[0];
    assert.equal(row.path, new URL(envelope.event.request.url).pathname);
    assert.equal(row.collection_version, ack.collectionVersion);
    const receipt = storedObservationReceipt({ readerKind: row.reader_kind, signatureStatus: row.signature_status,
      signatureAgent: row.signature_agent, signatureEvidence: JSON.parse(row.signature_evidence),
      classificationEvidence: JSON.parse(row.classification_evidence), vendorIpEvidence: JSON.parse(row.vendor_ip_evidence) });
    assert.deepEqual(receipt, ack.receipt);
  }
  save(resolve(inputPath, 'acceptance.json'), { checkedAt: new Date().toISOString(), exactRows: rows.length,
    fullReceiptMatches: rows.length, rowsRead: result.meta.rows_read, rowsWritten: result.meta.rows_written,
    statementAttempts: result.meta.total_attempts ?? null, responseSha256: hash(readFileSync(outputPath)),
    readerKinds: rows.reduce((counts, row) => ({ ...counts, [row.reader_kind]: (counts[row.reader_kind] ?? 0) + 1 }), {}),
    ownerExcluded: rows.filter(row => row.is_owner === 1).length,
    limits: ['Controlled test traffic; not organic audience growth, people, or independent cryptographic replay.'] });
  console.log(JSON.stringify({ exactRows: rows.length, fullReceiptMatches: rows.length, rowsRead: result.meta.rows_read, rowsWritten: result.meta.rows_written }));
} else throw new Error('Expected prepare or accept');
