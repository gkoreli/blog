// Exercise beta.38's actual scoring module; no provider, server or generated model answers.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [modulePath, outputPath] = process.argv.slice(2).map(value => resolve(value));
assert(modulePath && outputPath);
const { replayScore, clears, answerCorrect, REPLAY_MIN, PROMOTE_BAR } = await import(pathToFileURL(modulePath));
const row = (i, outcome = 'answered', answer = `right-${i}`) => ({
  of: `fixture-${i}`, recorded: { answer: `right-${i}`, correct: true },
  outcome, answer: outcome === 'answered' ? answer : null, guards: [],
});
const declared = [
  ['twenty-autonomous-correct', Array.from({ length: 20 }, (_, i) => row(i)),
    { n: 20, agree: 20, agent_acc: 1, wf_acc: 1, delta: 0, handed_back: 0 }, true],
  ['one-autonomous-nineteen-handbacks', Array.from({ length: 20 }, (_, i) => row(i, i ? 'handed_back' : 'answered')),
    { n: 20, agree: 1, agent_acc: 1, wf_acc: 1, delta: 0, handed_back: 19 }, true],
  ['all-handbacks', Array.from({ length: 20 }, (_, i) => row(i, 'handed_back')),
    { n: 20, agree: 0, agent_acc: 1, wf_acc: 1, delta: 0, handed_back: 20 }, false],
  ['one-wrong-of-twenty', Array.from({ length: 20 }, (_, i) => row(i, 'answered', i ? `right-${i}` : 'wrong')),
    { n: 20, agree: 19, agent_acc: 1, wf_acc: 0.95, delta: -0.05, handed_back: 0 }, false],
  ['five-correct-fifteen-failed', Array.from({ length: 20 }, (_, i) => row(i, i < 5 ? 'answered' : 'failed')),
    { n: 5, agree: 5, agent_acc: 1, wf_acc: 1, delta: 0, handed_back: 0 }, true],
];
const results = declared.map(([name, rows, expected, expectedClears]) => {
  const score = replayScore(rows, new Map());
  assert.deepEqual(score, expected, name);
  assert.equal(clears(score), expectedClears, name);
  return { case: name, suppliedRows: rows.length, score, clearsScoringBar: clears(score) };
});
const changedUnlabelled = answerCorrect('new answer', { answer: 'old answer', correct: false });
assert.equal(changedUnlabelled, false);
assert.equal(REPLAY_MIN, 5);
assert.equal(PROMOTE_BAR, 0.02);
const result = {
  sourceCommit: 'd10f0053e09cd7ac0186006b13f7a6a52aa8bc22', release: 'v0.1.0-beta.38',
  node: process.version, platform: process.platform, architecture: process.arch,
  results, changedAnswerWithoutExpectedLabelCountedCorrect: changedUnlabelled,
  replayMinimumFromModule: REPLAY_MIN, allowedAccuracyDelta: PROMOTE_BAR,
  modelCalls: 0, fullPromotionOrchestrationExercised: false, diskDurabilityExercised: false,
  scope: 'Actual unchanged learning-scoring module on declared synthetic rows; accuracy includes recorded agent answers for hand-backs and excludes failed rows. No learned-task improvement, cost result or full runner acceptance is established.',
};
await writeFile(outputPath, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(results.map(({ case: name, score, clearsScoringBar }) => ({ case: name, score, clearsScoringBar }))));
