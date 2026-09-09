import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { captureProvider, object, parseJson, sha256 } from './capture-provider.ts';

const directory = await mkdtemp(join(tmpdir(), 'radar-07-capture-'));
Object.assign(process.env, {
  PROMPTFOO_DISABLE_TELEMETRY: '1', PROMPTFOO_DISABLE_UPDATE: '1',
  PROMPTFOO_CONFIG_DIR: join(directory, 'config'), PROMPTFOO_CACHE_PATH: join(directory, 'cache'),
  PROMPTFOO_CACHE_TYPE: 'disk', LOG_LEVEL: 'error',
});
const citation = 'https://gkoreli.com/how-i-separate-readers-from-bots-without-javascript';
const full = {
  id: 'synthetic-completion',
  choices: [{ message: { content: 'Requests do not establish a count of people.', annotations: [{ type: 'url_citation', url_citation: { url: citation } }] }, finish_reason: 'stop' }],
  citations: [citation], usage: { prompt_tokens: 10, completion_tokens: 11, cost: 0.001 },
};
const absent = { choices: [{ message: { content: full.choices[0]!.message.content }, finish_reason: 'stop' }] };
const cases = [
  { id: 'full', body: full, outcome: 'success', citationState: 'present', attempts: 1 },
  { id: 'absent', body: absent, outcome: 'success', citationState: 'absent', attempts: 1 },
  { id: 'empty', body: { ...absent, citations: [], choices: [{ message: { ...absent.choices[0]!.message, annotations: [] } }] }, outcome: 'success', citationState: 'empty', attempts: 1 },
  { id: 'null', body: { ...absent, citations: null }, outcome: 'success', citationState: 'null', attempts: 1 },
  { id: 'malformed', body: '{broken', outcome: 'invalid-json', citationState: 'absent', attempts: 1 },
  { id: 'rate-limit', body: { error: { message: 'Synthetic rate limit' } }, status: 429, outcome: 'http-error', citationState: 'absent', attempts: 1 },
  { id: 'retry', body: full, outcome: 'success', citationState: 'present', attempts: 2 },
  { id: 'provider-error', body: { error: { message: 'Synthetic provider failure' } }, outcome: 'provider-error', citationState: 'absent', attempts: 1 },
  { id: 'missing-answer', body: { choices: [] }, outcome: 'missing-answer', citationState: 'absent', attempts: 1 },
  { id: 'truncated', body: { ...full, choices: [{ ...full.choices[0], finish_reason: 'length' }] }, outcome: 'incomplete-answer', citationState: 'present', attempts: 1 },
];
const requests: { caseId: string; body: string; response: string; status: number }[] = [];
const server = createServer(async (request, response) => {
  const caseId = request.url?.slice(1) ?? '';
  const test = cases.find(test => test.id === caseId);
  if (!test) { response.writeHead(404).end(); return; }
  let input = '';
  for await (const chunk of request) input += chunk;
  const retry = caseId === 'retry' && !requests.some(request => request.caseId === caseId);
  const body = retry ? { error: { message: 'Synthetic retry' } } : test.body;
  const raw = typeof body === 'string' ? body : JSON.stringify(body);
  const status = retry ? 429 : test.status ?? 200;
  requests.push({ caseId, body: input, response: raw, status });
  response.writeHead(status, { 'content-type': 'application/json', 'x-request-id': `synthetic-${caseId}-${requests.length}`, 'retry-after': '0' });
  response.end(raw);
});
await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('No local endpoint');
const origin = `http://127.0.0.1:${address.port}`;
const originalFetch = globalThis.fetch;
const blocked: string[] = [];
globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  if (url.origin !== origin) { blocked.push(url.origin + url.pathname); throw new Error('Local probe blocked outbound fetch'); }
  return originalFetch(input, { ...init, redirect: 'error' });
};
const { evaluate, cache } = await import('promptfoo');
const observations: Record<string, unknown>[] = [];
let traceJoin: Record<string, unknown> | undefined;
try {
  for (const test of cases) {
    const provider = captureProvider({ endpoint: `${origin}/${test.id}`, model: 'synthetic', runId: test.id, directory, maxAttempts: test.id === 'retry' ? 2 : 1 });
    const evaluation = await evaluate({
      prompts: ['Explain the classification boundary.'], providers: [provider],
      tests: [{ assert: [{ type: 'contains', value: 'count of people' }] }],
      writeLatestResults: true, sharing: false, author: 'OSS Radar controlled fixture',
      ...(test.id === 'full' ? { tracing: { enabled: true } } : {}),
      outputPath: join(directory, `${test.id}-export.json`),
    }, { cache: false, maxConcurrency: 1 });
    const summary = await evaluation.toEvaluateSummary();
    const text = JSON.stringify(summary, null, 2) + '\n';
    await writeFile(join(directory, `${test.id}-summary.json`), text);
    const saved = parseJson(await readFile(join(directory, `${test.id}-summary.json`), 'utf8'));
    assert.ok(object(saved) && Array.isArray(saved.results));
    const first = saved.results[0];
    assert.ok(object(first) && object(first.response) && object(first.response.metadata));
    const evidence = first.response.metadata.evidence;
    assert.ok(object(evidence) && Array.isArray(evidence.attempts));
    assert.equal(evidence.attempts.length, test.attempts);
    const inputText = await readFile(join(directory, `${test.id}-1-input.json`), 'utf8');
    assert.equal(inputText, requests.find(request => request.caseId === test.id)?.body);
    for (const [i, attempt] of evidence.attempts.entries()) {
      assert.ok(object(attempt));
      const raw = await readFile(join(directory, `${test.id}-1-attempt-${i + 1}-response.txt`), 'utf8');
      assert.equal(attempt.responseSha256, sha256(raw));
      assert.equal(attempt.inputSha256, sha256(inputText));
      const standalone = parseJson(await readFile(join(directory, `${test.id}-1-attempt-${i + 1}.json`), 'utf8'));
      assert.deepEqual(attempt, standalone);
      assert.equal(attempt.runId, test.id);
    }
    const final = evidence.attempts.at(-1);
    assert.ok(object(final) && object(final.providerCitations));
    assert.equal(final.outcome, test.outcome);
    assert.equal(final.providerCitations.state, test.citationState);
    assert.equal(summary.stats.successes, test.outcome === 'success' ? 1 : 0);
    assert.equal(first.response.raw, requests.filter(request => request.caseId === test.id).at(-1)?.response);
    const cliPath = fileURLToPath(new URL('entrypoint.js', import.meta.resolve('promptfoo')));
    execFileSync(process.execPath, ['--import', fileURLToPath(new URL('offline-cli.ts', import.meta.url)), cliPath, 'export', 'eval', evaluation.id, '--output', join(directory, `${test.id}-cli-export.json`)], { env: process.env, timeout: 30_000, stdio: 'pipe' });
    for (const suffix of ['export', 'cli-export']) {
      const exported = parseJson(await readFile(join(directory, `${test.id}-${suffix}.json`), 'utf8'));
      assert.ok(object(exported) && object(exported.results) && Array.isArray(exported.results.results));
      assert.equal(exported.evalId, evaluation.id);
      const exportedResult = exported.results.results[0];
      assert.ok(object(exportedResult) && object(exportedResult.response));
      assert.deepEqual(exportedResult.response, first.response);
      if (test.id === 'full') {
        assert.ok(Array.isArray(exported.traces) && exported.traces.length === 1);
        const trace = exported.traces[0];
        assert.ok(object(trace) && Array.isArray(trace.spans));
        assert.equal(trace.evaluationId, evidence.evaluationId);
        assert.equal(trace.testCaseId, evidence.testCaseId);
        assert.equal(typeof evidence.traceparent, 'string');
        if (typeof evidence.traceparent !== 'string') throw new Error('Missing traceparent');
        const traceParts: string[] = evidence.traceparent.split('-');
        const traceId: string | undefined = traceParts[1];
        const targetSpanId: string | undefined = traceParts[2];
        assert.equal(trace.traceId, traceId);
        const target: unknown = trace.spans.find(span => object(span) && span.spanId === targetSpanId);
        assert.ok(object(target) && object(target.attributes));
        assert.equal(target.attributes['promptfoo.span.role'], 'target');
        traceJoin = { traceId, targetSpanId, evaluationId: trace.evaluationId, testCaseId: trace.testCaseId, spans: trace.spans.length, libraryAndRestartedCliJoinVerified: true };
      }
    }
    observations.push({ case: test.id, attempts: test.attempts, outcome: final.outcome, citationFieldState: final.providerCitations.state, allAttemptRecordsEqualAfterExport: true, finalRawTextEqualAfterExport: true, libraryAndRestartedCliResponsesEqual: true, evaluationId: evaluation.id });
  }
  assert.equal(requests.length, 11);
  const result = {
    measuredAt: new Date().toISOString(), node: process.version, platform: process.platform, arch: process.arch,
    promptfooVersion: '0.122.2', evaluations: cases.length, localHttpRequests: requests.length,
    liveModelCalls: 0, apiSpendUsd: 0, tracingEnabled: 'full case only', databasePersistence: true,
    observations, traceJoin, blockedFetches: blocked,
    sourceHashes: Object.fromEntries(await Promise.all(['capture-provider.ts', 'probe-capture.ts', 'offline-cli.ts'].map(async name => [name, sha256(await readFile(new URL(name, import.meta.url), 'utf8'))]))),
    limits: ['Synthetic response variants only.', 'UTF-8 decoded response text; not HTTP wire bytes.', 'Summary JSON, library JSON exporter, and separately started CLI database export tested; UI and streaming untested.', 'Local trace joins tested on one successful case; no remote provider trace or separate retry spans.', 'Synthetic cost is an input, not an invoice.', 'Missing citation fields do not establish citation absence.', 'Transport-exception handling exists but is not exercised by these ten cases.', 'Main-process fetch guard records the listed blocked destinations; export subprocesses separately block fetch without counting attempts.'],
  };
  await writeFile(join(directory, 'requests.json'), JSON.stringify(requests, null, 2) + '\n');
  await writeFile(join(directory, 'result.json'), JSON.stringify(result, null, 2) + '\n');
  process.stdout.write(JSON.stringify({ directory, ...result }, null, 2) + '\n');
} finally {
  server.closeAllConnections();
  await new Promise<void>(resolve => server.close(() => resolve()));
  await cache.getCache().disconnect();
}
