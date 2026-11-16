// Exact published beta.38/beta.40 modules; authored rows, no provider/service or actual spending.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [beforeRoot, afterRoot, output] = process.argv.slice(2).map(value => resolve(value));
const packageRoot = root => join(root, 'node_modules/@parcha/agentrun-serve');
const from = (root, path) => import(pathToFileURL(join(packageRoot(root), 'dist', path)));
const old = await from(beforeRoot, 'learn/promote.js');
const current = await from(afterRoot, 'learn/promote.js');
const refit = await from(afterRoot, 'learn/refit.js');
const oldCost = await from(beforeRoot, 'learning-cost.js');
const newCost = await from(afterRoot, 'learning-cost.js');
assert.equal(JSON.parse(await readFile(join(packageRoot(beforeRoot), 'package.json'), 'utf8')).version, '0.1.0-beta.38');
assert.equal(JSON.parse(await readFile(join(packageRoot(afterRoot), 'package.json'), 'utf8')).version, '0.1.0-beta.40');
const row = (i, outcome = 'answered') => ({
  of: `authored-${i}`, recorded: { answer: `right-${i}`, correct: true, path: 'agent' },
  outcome, answer: outcome === 'answered' ? `right-${i}` : null, guards: [],
});
const score = rows => refit.scoreRows(refit.refitRowsOf(rows), new Map());
const conditions = [
  ['one-answer-nineteen-handbacks', Array.from({ length: 20 }, (_, i) => row(i, i ? 'handed_back' : 'answered')), 20, 19, true],
  ['all-handbacks', Array.from({ length: 20 }, (_, i) => row(i, 'handed_back')), 20, 20, false],
  ['five-answers-fifteen-failures', Array.from({ length: 20 }, (_, i) => row(i, i < 5 ? 'answered' : 'failed')), 5, 0, true],
];
const scoring = conditions.map(([name, rows, n, handbacks, clears]) => {
  const result = score(rows);
  assert.equal(result.n, n, name); assert.equal(result.handed_back, handbacks, name);
  assert.equal(result.wf_acc, 1, name); assert.equal(current.clears(result), clears, name);
  return { case: name, suppliedRows: rows.length, score: result, clearsScoringPredicate: current.clears(result) };
});
const wrongRows = (answer, expected) => Array.from({ length: 5 }, (_, i) => ({
  of: `previously-wrong-${i}`, outcome: 'answered', answer, guards: [],
  recorded: { answer: 'old-wrong-answer', correct: false, path: 'workflow', ...(expected ? { expected } : {}) },
}));
const unchanged = wrongRows('old-wrong-answer');
const oldTie = old.replayScore(unchanged, new Map());
const newRejection = score(unchanged);
assert.equal(old.clears(oldTie), true); assert.equal(current.clears(newRejection), false);
const differentUnlabelled = score(wrongRows('different-unlabelled-answer'));
assert.equal(current.clears(differentUnlabelled), true);
const differentWithExpected = score(wrongRows('different-unlabelled-answer', { answer: 'verified-answer' }));
assert.equal(current.clears(differentWithExpected), false);
const expectedMatch = score(wrongRows('verified-answer', { answer: 'verified-answer' }));
assert.equal(current.clears(expectedMatch), true);
const costRow = (n, path, cost) => ({ n, run_id: `cost-fixture-${n}`, path,
  cost_usd: cost, learning_usd: 0, total_usd: cost, cost_upper_bound: null,
});
const base = [costRow(0, 'agent', 10), costRow(1, 'agent', 10), ...Array.from({ length: 20 }, (_, i) => costRow(i + 2, 'workflow', 1))];
const contaminated = [...base.slice(0, 3), costRow(100, 'replay', 1000), costRow(101, 'agent', 1000), ...base.slice(3)];
const oldClean = oldCost.costSummary(base), newClean = newCost.costSummary(base);
const oldMixed = oldCost.costSummary(contaminated), newMixed = newCost.costSummary(contaminated);
assert.equal(oldClean.after.mean_usd, 1); assert.equal(newClean.after.mean_usd, 1);
assert.equal(oldMixed.after.runs, 22); assert.equal(newMixed.after.runs, 20);
assert.ok(oldMixed.after.mean_usd > 90); assert.equal(newMixed.after.mean_usd, 1);
const files = ['learn/promote.js', 'learn/refit.js', 'learning-cost.js'];
const moduleHashes = Object.fromEntries(await Promise.all(files.map(async file => [file,
  createHash('sha256').update(await readFile(join(packageRoot(afterRoot), 'dist', file))).digest('hex')])));
const result = {
  before: { release: '0.1.0-beta.38', source: 'd10f0053e09cd7ac0186006b13f7a6a52aa8bc22' },
  after: { release: '0.1.0-beta.40', source: 'bb7fb3eab9ad592fe81a57c1389744856889da7b', moduleHashes },
  node: process.version, scoring,
  previouslyWrongWorkflowAnswer: { oldUnchanged: oldTie, currentUnchanged: newRejection,
    currentDifferentWithoutExpected: differentUnlabelled, currentDifferentWithExpected: differentWithExpected,
    currentExpectedMatch: expectedMatch,
    oldComparisonLimit: 'The beta.38 scorer comparison is arithmetic only: beta.38 replay selection normally chose agent-path grades, not these workflow-path rows. It is not a reproduced beta.38 service defect.' },
  costSelection: { suppliedServingRows: 20, insertedNonservingRows: 2,
    oldClean: oldClean.after, currentClean: newClean.after, oldWithNonservingRows: oldMixed.after,
    currentWithNonservingRows: newMixed.after },
  modelCalls: 0, realSpend: 0, fullPromotionOrchestrationExercised: false,
  scope: 'Actual published scoring and cost aggregation on declared synthetic rows. No full service, model learning, semantic correctness, replay orchestration or real cost-saving result. clears is a scoring predicate, not a complete promotion decision.',
};
await writeFile(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ scoringCases: scoring.length, wrongAnswerControls: 5, oldCostRows: oldMixed.after.runs, currentCostRows: newMixed.after.runs }));
