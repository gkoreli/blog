// Fixture probe of Promptfoo 0.122.2's OpenRouter response normalization.
// Run with Node 24: node --experimental-vm-modules probe-openrouter.mjs
// The provider source is pinned; all imported dependencies are test doubles.
// This performs no network requests and is not a live model evaluation.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const upstream = {
  repository: 'promptfoo/promptfoo',
  release: '0.122.2',
  commit: '89052308bce06f53645b1f189ada5ac9d1897347',
  path: 'src/providers/openrouter.ts',
  // SHA-256 of the UTF-8 source snapshot, with its original trailing newline.
  sha256: '7b309ba9800741910029e3734a542c0320828e51421ea8a0ad15298cac01c667',
};
const sourceUrl = new URL('./vendor/openrouter.ts.txt', import.meta.url);
const fixtureUrl = new URL('./response.fixture.json', import.meta.url);
const source = await readFile(sourceUrl, 'utf8');
const fixtureBytes = await readFile(fixtureUrl);
const fixture = JSON.parse(fixtureBytes.toString('utf8'));
assert.equal(createHash('sha256').update(source).digest('hex'), upstream.sha256);
let requestCount = 0;

class FixtureBaseProvider {
  constructor(modelName, options) {
    this.modelName = modelName;
    this.config = options.config;
  }
  async getOpenAiBody(prompt) {
    return { body: { model: this.modelName, messages: [{ role: 'user', content: prompt }] }, config: this.config };
  }
  getApiUrl() { return 'https://fixture.invalid'; }
  getApiKey() { return 'synthetic-fixture'; }
  getOrganization() { return undefined; }
}

// Cost is a sentinel from a mocked calculator. It is not a price or a bill.
const sentinelEstimatedCost = 0.00012;
const imports = {
  '../cache': {
    fetchWithCache: async () => {
      requestCount++;
      return { data: structuredClone(fixture), cached: false, status: 200, statusText: 'OK' };
    },
  },
  '../logger': { default: { debug() {}, warn() {}, error() {} } },
  '../tracing/genaiTracer': {
    withGenAISpan: async (_context, run, extract) => {
      const result = await run();
      extract(result);
      return result;
    },
  },
  '../util/finishReason': { normalizeFinishReason: (value) => value },
  './openai/chat': { OpenAiChatCompletionProvider: FixtureBaseProvider },
  './openai/util': {
    appendOpenAiApiPath: (url, path) => url + '/' + path,
    calculateOpenAICost: () => sentinelEstimatedCost,
    formatOpenAiError: (value) => JSON.stringify(value),
    getTokenUsage: (data) => ({
      prompt: data.usage.prompt_tokens,
      completion: data.usage.completion_tokens,
      total: data.usage.total_tokens,
    }),
  },
  './shared': { getRequestTimeoutMs: () => 1000 },
};
const context = vm.createContext({});
const providerModule = new vm.SourceTextModule(
  stripTypeScriptTypes(source, { mode: 'strip', sourceUrl: fileURLToPath(sourceUrl) }),
  { context, identifier: upstream.path },
);
await providerModule.link(async (specifier) => {
  const definitions = imports[specifier];
  assert.ok(definitions, 'Unexpected import: ' + specifier);
  return new vm.SyntheticModule(Object.keys(definitions), function () {
    for (const [name, value] of Object.entries(definitions)) this.setExport(name, value);
  }, { context, identifier: specifier });
});
await providerModule.evaluate();
const provider = new providerModule.namespace.OpenRouterProvider('perplexity/sonar', { config: {} });
const result = await provider.callApi('Synthetic fixture: summarize a supported result.');
assert.equal(requestCount, 1);
assert.equal(result.output, fixture.choices[0].message.content);
assert.equal(result.tokenUsage.total, fixture.usage.total_tokens);

const rawCitationUrls = fixture.citations;
const rawAnnotations = fixture.choices[0].message.annotations;
const normalizedCitationUrls = result.metadata?.citations ?? [];
const normalizedAnnotations = result.metadata?.annotations ?? [];
const observation = {
  schema_version: 1,
  checked_date: '2026-09-08',
  evidence_state: 'Reproduced',
  scope: 'Pinned provider module with mocked dependencies and one synthetic response; no network, model call, npm installation, or production request.',
  upstream,
  fixture_sha256: createHash('sha256').update(fixtureBytes).digest('hex'),
  runtime: process.version,
  fixture_inputs: {
    provider_citation_count: rawCitationUrls.length,
    message_annotation_count: rawAnnotations.length,
    provider_usage_cost: fixture.usage.cost,
    mocked_cost_calculator_result: sentinelEstimatedCost,
  },
  observed: {
    mocked_transport_calls: requestCount,
    answer_text_preserved: result.output === fixture.choices[0].message.content,
    normalized_citation_count: normalizedCitationUrls.length,
    normalized_annotation_count: normalizedAnnotations.length,
    normalized_cost: result.cost,
    provider_reported_cost_preserved: result.cost === fixture.usage.cost,
    normalized_keys: Object.keys(result).sort(),
  },
  limits: [
    'The fixture is invented test data, not an answer from Perplexity.',
    'Imported transport, tracing, base provider, token parsing, and cost calculation are mocked.',
    'The probe establishes the selected module return shape only; it does not test the installed package, raw cache retention, other provider routes, or live billing.',
    'A later upstream change requires a new source hash and a new dated result.',
  ],
};
process.stdout.write(JSON.stringify(observation, null, 2) + '\n');
