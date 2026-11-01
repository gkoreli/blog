import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { KNOWN_AGENT_NAMES } from '../../../../analytics/src/classify.ts';
import { READER_KINDS } from '../../../../analytics/src/contracts.ts';
import { FAILURE_OUTCOMES } from '../../../../analytics/src/signature-evidence.ts';
import { isObservationId } from '../../../../analytics/src/observation-storage.ts';
import { isPublicSignerName } from '../../../../analytics/src/signers.ts';

const record = value => typeof value === 'object' && value !== null && !Array.isArray(value);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const PREFIX = 'fetcher-live-20261101-';
const profile = value => typeof value === 'string' && /^20\d{2}-\d{2}-\d{2}(?:\.\d+)?$/.test(value) ? value : 'unrecognized';
const choice = (value, choices) => choices.includes(value) ? value : 'unrecognized';
const count = value => Number.isSafeInteger(value) && value >= 0 ? value : null;

/** Parse concatenated formatted objects, retaining malformed frames and an incomplete suffix. */
export function parseStream(text) {
  assert.ok(Buffer.byteLength(text) <= 32 * 1024 * 1024, 'Stream exceeds 32 MiB bound');
  const objects = [], malformed = [], outside = [];
  let start = -1, depth = 0, quoted = false, escaped = false, outsideStart = 0;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (start < 0) {
      if (char === '{') {
        const noise = text.slice(outsideStart, index); if (noise.trim()) outside.push(noise);
        start = index; depth = 1; quoted = false; escaped = false;
      }
      continue;
    }
    if (quoted) { if (escaped) escaped = false; else if (char === '\\') escaped = true; else if (char === '"') quoted = false; continue; }
    if (char === '"') quoted = true;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) {
      const frame = text.slice(start, index + 1);
      try { const value = JSON.parse(frame); assert.ok(record(value)); objects.push(value); }
      catch { malformed.push(frame); }
      start = -1; outsideStart = index + 1;
    }
  }
  const suffix = start < 0 ? '' : text.slice(start);
  if (start < 0 && text.slice(outsideStart).trim()) outside.push(text.slice(outsideStart));
  return { objects, malformed, outside, suffix };
}

function list(value, allowed) {
  if (value === 'none') return 'none';
  return typeof value === 'string' && value.split(',').every(item => allowed.has(item)) ? value : 'unrecognized';
}

/** Selected closed fields only; never copy arbitrary nested receipt values. */
export function publicReceipt(value) {
  if (!record(value)) return { status: 'unavailable' };
  const signature = record(value.signature) ? value.signature : {};
  const declarations = record(value.declarations) ? value.declarations : {};
  const native = record(value.native) ? value.native : {};
  const coverage = record(signature.coverage) ? signature.coverage : {};
  const keys = ['authority', 'targetUri', 'method', 'path', 'query', 'userAgent', 'contentDigest'];
  const closedCoverage = coverage.status === 'recorded' && keys.every(key => typeof coverage[key] === 'boolean')
    ? { status: 'recorded', ...Object.fromEntries(keys.map(key => [key, coverage[key]])) } : { status: 'unavailable' };
  const network = record(value.vendorNetwork) ? value.vendorNetwork : {};
  const summary = record(network.summary) ? network.summary : {};
  return { status: 'recorded', version: profile(value.version), classifierProfile: profile(value.classifierProfile),
    readerKind: choice(value.readerKind, READER_KINDS), fetchMetadataBits: count(value.fetchMetadataBits),
    declarations: { status: choice(declarations.status, ['none', 'single', 'multiple']),
      candidateCount: count(declarations.candidateCount), candidateNames: list(declarations.candidateNames, KNOWN_AGENT_NAMES) },
    signature: { verifierProfile: signature.verifierProfile === 'not-applicable' ? 'not-applicable' : profile(signature.verifierProfile),
      source: choice(signature.source, ['local-webbotauth', 'test-injected']),
      status: choice(signature.status, ['absent', 'verified', 'unverified']),
      outcome: choice(signature.outcome, ['absent', 'verified', 'invalid', 'unsupported', 'unavailable', 'policy-rejected', 'not-applicable', 'indeterminate', 'test-injected']),
      reasonNames: list(signature.reasonNames, new Set([...Object.keys(FAILURE_OUTCOMES), 'unknown'])),
      reasonCount: count(signature.reasonCount), signer: signature.signer === 'none' || isPublicSignerName(signature.signer) ? signature.signer : 'unrecognized',
      userAgentCovered: choice(signature.userAgentCovered, ['true', 'false', 'unavailable']), coverage: closedCoverage },
    native: { verifiedBot: choice(native.verifiedBot, ['true', 'false', 'unavailable']),
      signedAgent: choice(native.signedAgent, ['true', 'false', 'unavailable']) },
    vendorNetwork: { status: choice(network.status, ['recorded', 'not-recorded']), checkCount: count(network.checkCount),
      summary: Object.fromEntries(['listed', 'notListed', 'unavailable', 'notAssessed'].map(key => [key, typeof summary[key] === 'boolean' ? summary[key] : null])) } };
}

function headersOf(value) {
  if (!record(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, v]) => typeof v === 'string').map(([k, v]) => [k.toLowerCase(), v]));
}

function publicHeaders(headers) {
  const ua = headers['user-agent'];
  const products = typeof ua === 'string' ? [...ua.matchAll(/\b(Mozilla|AppleWebKit|Chrome|Chromium|Safari|Version|Edg|Firefox|GPTBot|ChatGPT-User|Claude-User|PerplexityBot|Perplexity-User|DuckAssistBot|MistralAI-User|GrokBot|curl)\/([0-9A-Za-z.+_-]{1,40})(?=[\s;)]|$)/g)].map(match => match[0]) : [];
  const accept = headers.accept;
  const acceptable = typeof accept === 'string' && accept.length <= 512 && accept.split(',').every(part => /^\s*[a-z*][a-z0-9!#$&^_.+*-]*\/[a-z*][a-z0-9!#$&^_.+*-]*(?:\s*;\s*q=(?:0(?:\.\d{1,3})?|1(?:\.0{1,3})?))?\s*$/i.test(part));
  const componentLists = [];
  const input = headers['signature-input'];
  if (typeof input === 'string' && input.length <= 8192 && !/redact/i.test(input)) {
    for (const match of input.matchAll(/\(([^)]*)\)/g)) {
      const components = [...match[1].matchAll(/"([@a-z][@a-z0-9-]*)"/g)].map(item => item[1]);
      if (components.length && components.length <= 32) componentLists.push(components);
    }
  }
  return { userAgentProducts: [...new Set(products)], userAgentValuePresent: typeof ua === 'string',
    accept: acceptable ? accept : typeof accept === 'string' ? 'withheld-unrecognized' : null,
    fetchMetadata: Object.fromEntries(['sec-fetch-mode', 'sec-fetch-dest', 'sec-fetch-site', 'sec-fetch-user'].map(key => [key,
      headers[key] === undefined ? null : /^(navigate|no-cors|cors|same-origin|websocket|document|iframe|empty|none|same-site|cross-site|\?1|\?0)$/.test(headers[key]) ? headers[key] : 'unrecognized'])),
    signingHeaderPresence: Object.fromEntries(['signature', 'signature-input', 'signature-agent'].map(key => [key, typeof headers[key] === 'string'])),
    retainedSignatureComponentLists: componentLists, retainedSignatureInputAssessed: componentLists.length > 0 };
}

export function extract(objects, labels) {
  assert.ok(record(labels));
  for (const [label, service] of Object.entries(labels)) {
    assert.ok(label.startsWith(PREFIX) && /^[a-z0-9-]{1,100}$/.test(label));
    assert.ok(typeof service === 'string' && /^[a-z0-9-]{1,60}$/.test(service));
  }
  const matched = [], events = [], ids = new Set();
  for (const envelope of objects) {
    const request = envelope.event?.request;
    if (!record(request) || typeof request.url !== 'string') continue;
    let url; try { url = new URL(request.url); } catch { continue; }
    const probes = url.searchParams.getAll('probe');
    if (url.origin !== 'https://gkoreli.com' || probes.length !== 1 || !probes[0].startsWith(PREFIX)) continue;
    assert.ok(Object.hasOwn(labels, probes[0]), 'Matched a probe missing from the supplied frozen label map');
    matched.push(envelope);
    const logs = Array.isArray(envelope.logs) ? envelope.logs : [];
    const attempts = logs.filter(log => log.message?.[0] === 'analytics.observation_attempt' && record(log.message?.[1]));
    const stored = logs.filter(log => log.message?.[0] === 'analytics.observation_stored' && record(log.message?.[1]));
    const receipts = [];
    for (const log of stored) {
      const data = log.message[1];
      const joins = attempts.filter(item => item.message[1].operationId === data.operationId);
      const exact = typeof data.operationId === 'string' && joins.length === 1
        && stored.filter(item => item.message[1].operationId === data.operationId).length === 1;
      const returned = data.storage?.status === 'returned' && isObservationId(data.storage?.observationId);
      if (exact && returned) ids.add(data.storage.observationId);
      receipts.push({ operationJoined: exact, returnedReferenceAvailable: returned, receipt: publicReceipt(data.receipt) });
    }
    const time = envelope.eventTimestamp;
    const worker = envelope.scriptVersion?.id;
    events.push({ service: labels[probes[0]], timestamp: Number.isSafeInteger(time) && Math.abs(time) <= 8.64e15 ? new Date(time).toISOString() : null,
      workerVersion: typeof worker === 'string' && /^[a-f0-9-]{36}$/.test(worker) ? worker : 'unavailable',
      responseStatus: Number.isInteger(envelope.event?.response?.status) && envelope.event.response.status >= 100 && envelope.event.response.status <= 599 ? envelope.event.response.status : null,
      method: choice(request.method, ['GET', 'HEAD', 'POST']), truncated: envelope.truncated === true,
      ...publicHeaders(headersOf(request.headers)), attemptLogs: attempts.length, storedLogs: stored.length, receipts });
  }
  return { matched, events, ids: [...ids].sort((a, b) => BigInt(a) < BigInt(b) ? -1 : BigInt(a) > BigInt(b) ? 1 : 0) };
}

function readbackSql(ids) {
  assert.ok(ids.length > 0 && ids.length <= 40 && ids.every(isObservationId));
  return `SELECT CAST(id AS TEXT) AS observation_id, path, observed_at, collection_version, classifier_version,
representation, is_owner, reader_kind, reader_reason, agent_name, signature_status, signature_agent,
signature_evidence, classification_evidence, vendor_ip_evidence
FROM page_observations WHERE id IN (${ids.map(id => `CAST('${id}' AS INTEGER)`).join(',')})
ORDER BY id LIMIT ${ids.length + 1};\n`;
}

async function preflight(output, ids, sql) {
  const require = createRequire(resolve('package.json'));
  const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
  const schemaPath = 'packages/analytics/schema.sql';
  const schemaBytes = readFileSync(resolve(schemaPath));
  const schemaHashes = { [schemaPath]: sha256(schemaBytes) };
  const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("local preflight")}}',
    compatibilityDate: '2026-03-06', cf: {}, d1Databases: ['DB'], d1Persist: resolve(output, 'local-d1') });
  try {
    const db = await mf.getD1Database('DB');
    const schema = schemaBytes.toString('utf8').replace(/^\s*--.*$/gm, '');
    await db.batch(schema.split(';').map(statement => statement.trim()).filter(Boolean).map(statement => db.prepare(statement)));
    for (const id of ids) await db.prepare("INSERT INTO page_observations(id,path,daily_client_id,traffic_class,device_type,is_owner) VALUES(CAST(? AS INTEGER),'/local-preflight',?,'browser','desktop',1)").bind(id, '0'.repeat(32)).run();
    const plan = await db.prepare('EXPLAIN QUERY PLAN ' + sql).all();
    assert.ok(plan.results.every(row => typeof row.detail === 'string' && /INTEGER PRIMARY KEY/.test(row.detail)), 'Readback must use integer primary key');
    const result = await db.prepare(sql).all();
    assert.deepEqual(result.results.map(row => row.observation_id), ids);
    return { status: 'passed-local-workerd-d1', nodeVersion: process.version, schemaHashes, selectedRows: result.results.length,
      queryPlan: plan.results.map(row => ({ detail: row.detail })), queryMeta: result.meta,
      boundary: 'Local seeded schema/readback test; not production contents, cost or persistence acceptance.' };
  } finally { await mf.dispose(); }
}

async function main() {
  const [streamPath, labelsPath, outputPath, option] = process.argv.slice(2);
  assert.ok(streamPath && labelsPath && outputPath, 'node --import ./packages/blog/node_modules/tsx/dist/loader.mjs extract-live-fetches.mjs STREAM FROZEN_LABELS_JSON NEW_PRIVATE_OUTPUT [--no-preflight]');
  assert.ok(option === undefined || option === '--no-preflight');
  const input = readFileSync(streamPath), labelsBytes = readFileSync(labelsPath), labels = JSON.parse(labelsBytes);
  const parsed = parseStream(input.toString('utf8')), selected = extract(parsed.objects, labels);
  const output = resolve(outputPath); mkdirSync(output, { mode: 0o700 });
  const save = (file, value) => writeFileSync(resolve(output, file), JSON.stringify(value, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  save('matched-private.json', selected.matched);
  save('parse-anomalies-private.json', { malformed: parsed.malformed, outside: parsed.outside, suffix: parsed.suffix });
  save('references-private.json', selected.ids);
  const report = { checkedAt: new Date().toISOString(), sourceSha256: sha256(input), labelsSha256: sha256(labelsBytes),
    extractorSha256: sha256(readFileSync(fileURLToPath(import.meta.url))), nodeVersion: process.version,
    inputBytes: input.length, completedJsonObjects: parsed.objects.length, malformedCompleteFrames: parsed.malformed.length,
    outsideTextFragments: parsed.outside.length, unparsedSuffixBytes: Buffer.byteLength(parsed.suffix),
    unparsedSuffixSha256: parsed.suffix ? sha256(parsed.suffix) : null, matchedInvocations: selected.matched.length,
    returnedJoinedReferences: selected.ids.length, events: selected.events,
    limits: ['Assigned URL joins are controller attribution, not cryptographic identity.', 'Retained headers may be transformed; no wire-complete capture is claimed.',
      'A missing event is unavailable evidence, not proof of no request.', 'Deliberate trial observations are not organic audience growth.',
      'User-Agent output retains only recognized product/version tokens; unsupported free text is omitted.'] };
  save('public-projection.json', report);
  if (selected.ids.length) {
    const sql = readbackSql(selected.ids); writeFileSync(resolve(output, 'readback-private.sql'), sql, { mode: 0o600, flag: 'wx' });
    if (option !== '--no-preflight') {
      try { save('local-preflight.json', { ...await preflight(output, selected.ids, sql), sqlSha256: sha256(sql) }); }
      catch (error) { save('local-preflight.json', { status: 'failed', error: error instanceof Error ? error.message : 'unknown', sqlSha256: sha256(sql) }); throw error; }
    }
  }
  console.log(JSON.stringify({ completedJsonObjects: parsed.objects.length, matchedInvocations: selected.matched.length,
    malformedCompleteFrames: parsed.malformed.length, unparsedSuffixBytes: Buffer.byteLength(parsed.suffix),
    returnedJoinedReferences: selected.ids.length, localPreflight: option === '--no-preflight' ? 'not-run' : selected.ids.length ? 'passed' : 'no-references' }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
