import type { CalibrationCondition, CalibrationOperator } from './calibration.js';
import { isReaderKind, type ReaderKind } from './contracts.js';

/** Offline evaluation only. A label source is accepted by its caller, not inferred from headers. */
export interface EvaluationPlan { id: string; condition: CalibrationCondition; plannedOperator: CalibrationOperator }
export interface EvaluationExecution {
  id: string;
  condition: CalibrationCondition;
  actualOperator: CalibrationOperator;
  labelSource: 'agent-controller' | 'curl-receipt' | 'human-attestation' | 'unconfirmed';
}
export interface EvaluationMeasurement {
  id: string;
  trialRecorded: boolean;
  condition: CalibrationCondition | null;
  plannedOperator: CalibrationOperator | null;
  responsesPrepared: number | null;
  storedObservations: number;
  ownerExcludedObservations: number;
  kinds: readonly (ReaderKind | null)[];
}
export type OperatorTruth = 'automation' | 'human';
export type OperatorPrediction = OperatorTruth | 'abstain';
export interface OperatorPolicy { profile: string; predict(kind: ReaderKind): OperatorPrediction }
export const DEFAULT_OPERATOR_POLICY: OperatorPolicy = {
  profile: 'evaluation-only-kind-to-operator-v2',
  predict: kind => ['browser', 'legacy-browser', 'unresolved'].includes(kind) ? 'abstain' : 'automation',
};
const ISSUES = ['measurement-missing', 'trial-record-missing', 'plan-mismatch', 'response-count', 'observation-missing', 'observation-duplicate', 'owner-exclusion', 'kind-unrecognized'] as const;
type Issue = typeof ISSUES[number];
function unique<T extends { id: string }>(rows: readonly T[]): Map<string, T> {
  const result = new Map<string, T>();
  for (const row of rows) {
    if (typeof row.id !== 'string' || !row.id || row.id.length > 128 || result.has(row.id)) throw Error('Invalid or duplicate evaluation ID');
    result.set(row.id, row);
  }
  return result;
}
function ratio(numerator: number, denominator: number): number | null { return denominator === 0 ? null : numerator / denominator; }
function truth(execution: EvaluationExecution): OperatorTruth | null {
  if (execution.labelSource === 'unconfirmed') return null;
  if (execution.labelSource === 'agent-controller' && execution.actualOperator === 'agent-browser') return 'automation';
  if (execution.labelSource === 'curl-receipt' && execution.actualOperator === 'controlled-curl') return 'automation';
  if (execution.labelSource === 'human-attestation' && execution.actualOperator === 'human-reported') return 'human';
  throw Error('Inconsistent evaluation label provenance');
}

/** Summaries contain no experiment IDs. Incomplete trials never become classifier abstentions. */
export function evaluateCalibration(
  plans: readonly EvaluationPlan[], executions: readonly EvaluationExecution[], measurements: readonly EvaluationMeasurement[],
  policy: OperatorPolicy = DEFAULT_OPERATOR_POLICY,
) {
  if (plans.length > 32 || !/^[a-z0-9.-]{1,80}$/.test(policy.profile)) throw Error('Invalid evaluation scope');
  const planned = unique(plans), executed = unique(executions), measured = unique(measurements);
  for (const id of [...executed.keys(), ...measured.keys()]) if (!planned.has(id)) throw Error('Unregistered evaluation input');
  const issueCounts: Record<Issue, number> = { 'measurement-missing': 0, 'trial-record-missing': 0, 'plan-mismatch': 0, 'response-count': 0, 'observation-missing': 0, 'observation-duplicate': 0, 'owner-exclusion': 0, 'kind-unrecognized': 0 };
  const matrix: Record<OperatorTruth, Record<OperatorPrediction, number>> = { automation: { automation: 0, human: 0, abstain: 0 }, human: { automation: 0, human: 0, abstain: 0 } };
  let incomplete = 0, unlabeled = 0, complete = 0;
  for (const execution of executions) {
    const plan = planned.get(execution.id); if (!plan) throw Error('Missing evaluation plan');
    const label = truth(execution), row = measured.get(execution.id), issues = new Set<Issue>();
    if (execution.condition !== plan.condition || execution.actualOperator !== plan.plannedOperator) issues.add('plan-mismatch');
    if (!row) issues.add('measurement-missing');
    else {
      if (![row.storedObservations, row.ownerExcludedObservations].every(n => Number.isSafeInteger(n) && n >= 0)
        || row.ownerExcludedObservations > row.storedObservations || row.kinds.length !== row.storedObservations
        || (row.responsesPrepared !== null && (!Number.isSafeInteger(row.responsesPrepared) || row.responsesPrepared < 0))) throw Error('Invalid evaluation measurement counts');
      if (!row.trialRecorded) issues.add('trial-record-missing');
      if (row.condition !== plan.condition || row.plannedOperator !== plan.plannedOperator) issues.add('plan-mismatch');
      if (row.responsesPrepared !== 1) issues.add('response-count');
      if (row.storedObservations === 0) issues.add('observation-missing');
      if (row.storedObservations > 1) issues.add('observation-duplicate');
      if (row.ownerExcludedObservations !== row.storedObservations) issues.add('owner-exclusion');
      if (row.kinds.some(kind => kind === null || !isReaderKind(kind))) issues.add('kind-unrecognized');
    }
    if (issues.size) { incomplete++; for (const issue of issues) issueCounts[issue]++; continue; }
    complete++;
    if (label === null) { unlabeled++; continue; }
    const kind = row?.kinds[0]; if (!kind) throw Error('Complete evaluation lacks a kind');
    const prediction = policy.predict(kind);
    if (!['automation', 'human', 'abstain'].includes(prediction)) throw Error('Invalid evaluation prediction');
    matrix[label][prediction]++;
  }
  const human = matrix.human, automation = matrix.automation;
  const humanLabels = human.automation + human.human + human.abstain;
  const automationLabels = automation.automation + automation.human + automation.abstain;
  const labeled = humanLabels + automationLabels;
  const decided = human.automation + human.human + automation.automation + automation.human;
  const wrong = human.automation + automation.human;
  return {
    profile: policy.profile,
    accounting: { planned: plans.length, executed: executed.size, noAcceptedExecution: plans.length - executed.size, completeExecuted: complete, incompleteExecuted: incomplete, executedCohortComplete: incomplete === 0, completeUnlabeled: unlabeled, labeledEvaluable: labeled, humanLabels, automationLabels },
    issueCounts,
    confusion: matrix,
    decisions: { committed: decided, correct: decided - wrong, wrong, abstained: human.abstain + automation.abstain },
    rates: { decisionCoverage: ratio(decided, labeled), abstentionRate: ratio(human.abstain + automation.abstain, labeled), errorAmongDecisions: ratio(wrong, decided), automationFalsePositiveRateAmongDecidedHumans: ratio(human.automation, human.automation + human.human), humanAbstentionRate: ratio(human.abstain, humanLabels), automationAbstentionRate: ratio(automation.abstain, automationLabels) },
  };
}
