// Reproduce our side of the pinned Matomo placeholder-field comparison.
// Matomo's expected result comes from its upstream test; this does not run PHP.
// First: pnpm -C packages/analytics exec tsc -p tsconfig.test.json
import assert from 'node:assert/strict';
import { verifyWebBotAuth } from '../../../../analytics/.test-dist/webbotauth.js';

// Fixture source and SHA-256 are recorded in signature-comparison.json.
const headers = {
  Signature: 'Signature (value irrelevant)',
  'Signature-Agent': '"https://chatgpt.com"',
  'Signature-Input': 'Signature Input (value irrelevant)',
};
let networkFetches = 0;
const result = await verifyWebBotAuth(new Request('https://example.test/article', { headers }), {
  fetcher: async () => {
    networkFetches += 1;
    throw new Error('This local fixture must not make a network request');
  },
});

console.log(JSON.stringify({ headers, result, networkFetches }, null, 2));
assert.deepEqual(result, { status: 'unverified', reason: 'malformed-signature-fields' });
assert.equal(networkFetches, 0);
