// Unchanged beta.42 functions and actual defaults; authored counts, no model/service.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [modulePath, sourceHashes, output] = process.argv.slice(2).map(value => resolve(value));
const { checkPasses, checkShares, sameAnswer, loopOf } = await import(pathToFileURL(modulePath));
const bar = loopOf(true);
assert.deepEqual(bar, { compile_after: 20, agree_min: 0.8, alone_min: 0.7 });
const inputs = [
  ['one-alone-of-twenty', { n: 20, alone: 1, agreed: 1 }, false],
  ['all-handed-back', { n: 20, alone: 0, agreed: 0 }, false],
  ['no-inputs', { n: 0, alone: 0, agreed: 0 }, false],
  ['fourteen-alone-twelve-agree', { n: 20, alone: 14, agreed: 12 }, true],
  ['fourteen-alone-eleven-agree', { n: 20, alone: 14, agreed: 11 }, false],
];
const checks = inputs.map(([name, score, expected]) => {
  const passes = checkPasses(score, bar);
  assert.equal(passes, expected, name);
  return { name, score, shares: checkShares(score), passes };
});
const matching = [
  ['JSON-key-order', '{"a":1,"b":2}', '{"b":2,"a":1}', true],
  ['different-incorrect-text', '2 + 2 = 5', '2 + 2 = 6', false],
  ['identical-incorrect-text', '2 + 2 = 5', '2 + 2 = 5', true],
].map(([name, agent, draft, expected]) => {
  const same = sameAnswer(agent, draft);
  assert.equal(same, expected, name);
  return { name, agent, draft, same };
});
const receipt = {
  release: '0.1.0-beta.42', source: '3b10f6fa540d37acf237d230207baa691402dcbe',
  node: process.version, typebox: '1.3.27', esbuild: '0.27.3', bar, checks, matching,
  sourceHashes: JSON.parse(await readFile(sourceHashes, 'utf8')),
  bundleSha256: createHash('sha256').update(await readFile(modulePath)).digest('hex'),
  modelCalls: 0, fullPromotionOrchestrationExercised: false,
  scope: 'Actual pinned checkPasses/checkShares/sameAnswer and loopOf functions with synthetic counts and text. Runtime caller and no-input stop inspected separately; no provider, service, real learning, upgrade or semantic-correctness claim.',
};
await writeFile(output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ scoringConditions: checks.length, matchingConditions: matching.length, bar }));
