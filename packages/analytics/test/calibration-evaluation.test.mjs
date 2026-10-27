import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateCalibration } from '../.test-dist/calibration-evaluation.js';

function inputs() {
  const plans = ['a', 'b', 'c'].map(id => ({ id, condition: 'normal', plannedOperator: 'agent-browser' }));
  const executions = plans.map(p => ({ id: p.id, condition: p.condition, actualOperator: p.plannedOperator, labelSource: 'agent-controller' }));
  const measurements = plans.map(p => ({ id: p.id, trialRecorded: true, condition: p.condition, plannedOperator: p.plannedOperator, responsesPrepared: 1, storedObservations: 1, ownerExcludedObservations: 1, kinds: ['browser'] }));
  return { plans, executions, measurements };
}

test('balanced duplicate and missing observations cannot masquerade as three complete labelled trials', () => {
  const f = inputs(); f.measurements[0].storedObservations = 2; f.measurements[0].ownerExcludedObservations = 2; f.measurements[0].kinds.push('browser');
  f.measurements[2].storedObservations = 0; f.measurements[2].ownerExcludedObservations = 0; f.measurements[2].kinds = [];
  assert.equal(f.measurements.reduce((n, r) => n + r.storedObservations, 0), 3);
  const r = evaluateCalibration(f.plans, f.executions, f.measurements);
  assert.equal(r.accounting.incompleteExecuted, 2); assert.equal(r.accounting.labeledEvaluable, 1);
  assert.equal(r.issueCounts['observation-missing'], 1); assert.equal(r.issueCounts['observation-duplicate'], 1);
  assert.equal(r.decisions.abstained, 1); assert.equal(r.rates.errorAmongDecisions, null);
});

test('measurement failures, absent execution, unconfirmed labels and classifier abstention have separate denominators', () => {
  const f = inputs(); f.executions[1].labelSource = 'unconfirmed'; f.executions.pop(); f.measurements[0].responsesPrepared = 2;
  const r = evaluateCalibration(f.plans, f.executions, f.measurements);
  assert.equal(r.accounting.noAcceptedExecution, 1); assert.equal(r.accounting.incompleteExecuted, 1);
  assert.equal(r.accounting.completeUnlabeled, 1); assert.equal(r.accounting.labeledEvaluable, 0);
  assert.equal(r.decisions.abstained, 0); assert.ok(Object.values(r.rates).every(v => v === null));
});

test('confusion rows are known labels, columns are decisions; humans require their own explicit accepted provenance', () => {
  const f = inputs(); f.plans[1].plannedOperator = 'human-reported'; f.executions[1].actualOperator = 'human-reported'; f.executions[1].labelSource = 'human-attestation'; f.measurements[1].plannedOperator = 'human-reported';
  f.measurements[0].kinds = ['other-bot']; f.measurements[1].kinds = ['other-bot'];
  const r = evaluateCalibration(f.plans, f.executions, f.measurements);
  assert.deepEqual(r.confusion, { automation: { automation: 1, human: 0, abstain: 1 }, human: { automation: 1, human: 0, abstain: 0 } });
  assert.equal(r.decisions.wrong, 1); assert.equal(r.rates.errorAmongDecisions, 0.5);
  assert.equal(r.rates.automationFalsePositiveRateAmongDecidedHumans, 1); assert.equal(r.rates.decisionCoverage, 2 / 3);
});

test('registration/uniqueness, label consistency and all-owner exclusion protect evaluation integrity', () => {
  const f = inputs();
  assert.throws(() => evaluateCalibration(f.plans, [...f.executions, f.executions[0]], f.measurements), /duplicate/);
  assert.throws(() => evaluateCalibration(f.plans, [{ ...f.executions[0], id: 'unregistered' }], f.measurements), /Unregistered/);
  assert.throws(() => evaluateCalibration(f.plans, [{ ...f.executions[0], labelSource: 'human-attestation' }], f.measurements), /provenance/);
  f.measurements[0].ownerExcludedObservations = 0; const r = evaluateCalibration(f.plans, f.executions, f.measurements);
  assert.equal(r.issueCounts['owner-exclusion'], 1); assert.equal(r.accounting.labeledEvaluable, 2);
  assert.equal(JSON.stringify(r).includes('"id"'), false);
});
