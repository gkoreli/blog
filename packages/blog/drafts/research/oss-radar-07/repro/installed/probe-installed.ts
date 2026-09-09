import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ApiProvider, ProviderResponse } from 'promptfoo';

// Controlled fixture transport and programmatic summary export only.
// This is not a production OpenRouter adapter or a source-support scorer.
type Fixture = {
  choices: [{ message: { content: string; annotations: unknown[] } }];
  citations: string[];
  usage: Record<string, unknown>;
};
type ExportedResponse = {
  output?: unknown;
  raw?: unknown;
  cached?: boolean;
  metadata?: { evidence: { providerCitations: unknown; answerAnnotations: unknown } };
};
const directory = dirname(fileURLToPath(import.meta.url));
const output = join(directory, 'outputs');
const isolatedConfig = await mkdtemp(join(tmpdir(), 'oss-radar-07-'));
Object.assign(process.env, {
  PROMPTFOO_DISABLE_TELEMETRY: '1',
  PROMPTFOO_DISABLE_UPDATE: '1',
  PROMPTFOO_CONFIG_DIR: isolatedConfig,
  PROMPTFOO_CACHE_PATH: join(isolatedConfig, 'cache'),
  PROMPTFOO_CACHE_TYPE: 'disk',
  LOG_LEVEL: 'error',
});

const fixtureText = await readFile(join(directory, '../response.fixture.json'), 'utf8');
const fixture = JSON.parse(fixtureText) as Fixture;
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const writeJson = async (name: string, value: unknown) => {
  await writeFile(join(output, name), JSON.stringify(value, null, 2) + '\n');
};
const requests: { path: string | undefined; body: string }[] = [];
const server = createServer(async (request, response) => {
  let body = '';
  for await (const chunk of request) body += chunk;
  requests.push({ path: request.url, body });
  response.writeHead(200, {
    'content-type': 'application/json',
    'x-request-id': 'synthetic-request-07',
  });
  response.end(fixtureText);
});
await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Missing loopback address');
const origin = `http://127.0.0.1:${address.port}`;
const endpoint = `${origin}/api/v1`;

// Prevent the known opt-out beacon from leaving this process. Record destination
// and body field NAMES only: identifiers or runtime metadata are not published.
// Installed source inspection confirms the exercised HTTP paths use global fetch.
// This is a guard for this probe, not a general operating-system network sandbox.
const originalFetch = globalThis.fetch;
const blocked: { destination: string; method: string; bodyFields: string[] }[] = [];
globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  if (url.origin !== origin) {
    let bodyFields: string[] = [];
    if (typeof init?.body === 'string') {
      try { bodyFields = Object.keys(JSON.parse(init.body)); } catch { /* Not JSON. */ }
    }
    blocked.push({ destination: url.origin + url.pathname, method: init?.method ?? 'GET', bodyFields });
    throw new Error('Probe blocked non-loopback fetch');
  }
  return originalFetch(input, { ...init, redirect: 'error' });
};

const { evaluate, cache } = await import('promptfoo');
const builtIn = {
  id: 'openrouter:perplexity/sonar',
  config: { apiBaseUrl: endpoint, apiKey: 'synthetic-key', temperature: 0, max_tokens: 1024 },
};
const captureProvider: ApiProvider = {
  id: () => 'oss-radar-evidence-fixture',
  async callApi(prompt): Promise<ProviderResponse> {
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'perplexity/sonar', messages: [{ role: 'user', content: prompt }],
        temperature: 0, max_tokens: 1024,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const raw = await response.text();
    assert.equal(response.status, 200);
    assert.equal(raw, fixtureText, 'The two paths must receive identical fixture bytes');
    const parsed = JSON.parse(raw) as Fixture;
    return {
      output: parsed.choices[0].message.content,
      raw,
      metadata: { evidence: {
        providerCitations: parsed.citations,
        answerAnnotations: parsed.choices[0].message.annotations,
        requestId: response.headers.get('x-request-id'),
        responseSha256: sha256(raw),
        providerReportedUsage: parsed.usage,
      } },
    };
  },
};

try {
  await mkdir(output, { recursive: true });
  const results: Record<string, unknown>[] = [];
  for (const [label, provider, useCache] of [
    ['built-in-fresh', builtIn, true],
    ['built-in-cached', builtIn, true],
    ['custom-capture', captureProvider, false],
  ] as const) {
    const before = requests.length;
    const record = await evaluate({
      prompts: ['Explain the classification finding.'], providers: [provider],
      tests: [{ assert: [{ type: 'contains', value: 'no verified count of people' }] }],
      writeLatestResults: false, sharing: false,
    }, { cache: useCache, maxConcurrency: 1 });
    const summary = await record.toEvaluateSummary();
    // JSON export through the public API. No CLI exporter, DB or UI is tested.
    await writeJson(`${label}.json`, summary);
    const saved = JSON.parse(await readFile(join(output, `${label}.json`), 'utf8')) as {
      results: { response: ExportedResponse }[];
    };
    const response = saved.results[0].response;
    assert.equal(summary.stats.successes, 1);
    assert.equal(response.output, fixture.choices[0].message.content);
    const isCustom = label === 'custom-capture';
    assert.equal(requests.length - before, label === 'built-in-cached' ? 0 : 1);
    if (isCustom) {
      assert.equal(response.raw, fixtureText);
      assert.ok(response.metadata);
      assert.deepEqual(response.metadata.evidence.providerCitations, fixture.citations);
      assert.deepEqual(response.metadata.evidence.answerAnnotations, fixture.choices[0].message.annotations);
    } else {
      assert.equal(response.raw, undefined);
      assert.equal(response.metadata, undefined);
      assert.equal(response.cached, label === 'built-in-cached');
    }
    results.push({
      label, localHttpRequests: requests.length - before, cacheEnabled: useCache,
      cached: response.cached ?? null, responseKeys: Object.keys(response),
      answerPreserved: true,
      rawBytesPreserved: isCustom,
      structuredCitationUrlsRetained: isCustom ? fixture.citations.length : 0,
      structuredAnnotationsRetained: isCustom ? fixture.choices[0].message.annotations.length : 0,
      textAssertionPassed: true,
    });
  }
  let cacheRecords = 0;
  for (const store of cache.getCache().stores) {
    if (!store.iterator) continue;
    for await (const [key, value] of store.iterator()) {
      const cached = (typeof value === 'string' ? JSON.parse(value) : value) as { data?: Fixture };
      if (!cached.data?.citations) continue;
      assert.deepEqual(cached.data, fixture);
      cacheRecords += 1;
      await writeJson('transport-cache-entry.json', { key, value });
    }
  }
  assert.equal(cacheRecords, 1);
  const packageInfo = JSON.parse(await readFile(join(directory, 'node_modules/promptfoo/package.json'), 'utf8')) as {
    version: string;
  };
  assert.equal(packageInfo.version, '0.122.2');
  await writeJson('requests.json', requests);
  await writeJson('result.json', {
    measuredAt: new Date().toISOString(), node: process.version, platform: process.platform,
    arch: process.arch, promptfooVersion: packageInfo.version,
    upstreamCommit: '89052308bce06f53645b1f189ada5ac9d1897347',
    fixtureSha256: sha256(fixtureText),
    scriptSha256: sha256(await readFile(fileURLToPath(import.meta.url), 'utf8')),
    lockfileSha256: sha256(await readFile(join(directory, 'package-lock.json'), 'utf8')),
    tracingEnabled: false, databasePersistence: false,
    fixtureUniqueSourceUrls: new Set(fixture.citations).size,
    evaluations: results, cacheRecordsWithFullParsedFixture: cacheRecords,
    totalLocalHttpRequests: requests.length, liveModelCalls: 0, apiSpendUsd: 0,
    blockedNonLoopbackFetches: blocked,
    limits: [
      'One invented payload; one distinct URL appears in two structured fields.',
      'Counts measure fixture retention, not citation rates in model answers.',
      'String assertion checks answer transport, not source support or truth.',
      'Fixture annotation offsets are not validated and are not used for scoring.',
      'Synthetic usage/cost fields are not bills; absent normalized cost is not free live inference.',
      'Programmatic summary JSON only; trace export, CLI export, database restart, streaming, retries and failures are untested.',
      'Custom provider handles this successful fixture only and is not ready for paid use.',
      'Non-loopback fetch attempts were blocked locally; this is not an OS-level network audit.',
    ],
  });
  process.stdout.write(JSON.stringify({ output, evaluations: results, blockedRequests: blocked.length }, null, 2) + '\n');
} finally {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await cache.getCache().disconnect();
}
