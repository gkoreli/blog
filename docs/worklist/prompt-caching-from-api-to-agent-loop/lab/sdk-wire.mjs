// Run in an isolated directory with the exact dependencies in sdk-package.json.
// Every fetch is mocked. No real credentials or network inference are used.
import assert from 'node:assert/strict';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

class CapturedRequest extends Error {}

async function capture(provider, model, options) {
  let body;
  let beta;
  const instance = provider({
    apiKey: 'synthetic-not-a-key',
    fetch: async (_url, init) => {
      body = JSON.parse(init.body);
      beta = new Headers(init.headers).get('anthropic-beta');
      throw new CapturedRequest();
    },
  });
  try {
    await instance(model).doGenerate(options);
    assert.fail('Mock fetch must intercept every request');
  } catch (error) {
    assert.ok(error instanceof CapturedRequest, String(error));
  }
  assert.ok(body);
  return { body, beta };
}

const openai = await capture(createOpenAI, 'gpt-6-astra', {
  prompt: [
    { role: 'system', content: 'Stable policy.', providerOptions: { openai: { promptCacheBreakpoint: { mode: 'explicit' } } } },
    { role: 'user', content: [{ type: 'text', text: 'Question.' }] },
  ],
  providerOptions: { openai: { promptCacheOptions: { mode: 'explicit', ttl: '30m', comparisonResponseId: 'resp_synthetic' } } },
});
assert.deepEqual(openai.body.prompt_cache_options, { mode: 'explicit', ttl: '30m' });
assert.deepEqual(openai.body.input[0].content[0].prompt_cache_breakpoint, { mode: 'explicit' });
// This intentionally probes a JS option absent from this version's typed schema.
assert.equal(openai.body.prompt_cache_options.comparison_response_id, undefined);
assert.equal(openai.body.prompt_cache_options.comparisonResponseId, undefined);

const anthropic = await capture(createAnthropic, 'claude-sonnet-5-5', {
  prompt: [
    { role: 'system', content: 'Stable policy.' },
    { role: 'user', content: [{ type: 'text', text: 'Question.' }] },
    { role: 'system', content: 'New policy applies from here.', providerOptions: { anthropic: { toolChanges: [{ type: 'tool_removal', toolName: 'lookup' }] } } },
  ],
});
assert.equal(anthropic.body.system[0].text, 'Stable policy.');
assert.equal(anthropic.body.messages.at(-1).role, 'system');
assert.equal(anthropic.body.messages.at(-1).content.at(-1).type, 'tool_removal');
assert.ok(anthropic.beta.includes('mid-conversation-system-2026-04-07'));
assert.ok(anthropic.beta.includes('mid-conversation-tool-changes-2026-07-01'));

console.log(JSON.stringify({
  boundary: 'Mocked SDK serialization only; no provider acceptance or cache hit measured',
  openai: openai.body,
  anthropic: anthropic.body,
  anthropicBeta: anthropic.beta,
  diagnosticsOption: 'Unknown comparisonResponseId stripped by provider options schema',
  checks: 'passed',
}, null, 2));
