import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isReaderKind } from '../../analytics/.test-dist/contracts.js';
import { DEFAULT_OPERATOR_POLICY, evaluateCalibration } from '../../analytics/.test-dist/calibration-evaluation.js';

const [directory, output] = process.argv.slice(2); assert.ok(directory && output, 'Provide private evidence directory and new aggregate path');
const read = name => readFileSync(directory + '/' + name);
const parse = name => JSON.parse(read(name));
const hash = name => createHash('sha256').update(read(name)).digest('hex');
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const conditions = ['normal', 'block-script', 'block-beacon', 'http-client', 'javascript-off'];
const operators = ['agent-browser', 'controlled-curl', 'human-reported'];
const sourcePlan = parse('trial-plan.json'), browser = parse('browser-executed.json'), curl = parse('curl-executed.json');
assert.equal(browser.length, 9); assert.equal(curl.length, 3);
const plans = sourcePlan.trials.map(p => {
  assert.ok(uuid.test(p.id) && conditions.includes(p.condition) && operators.includes(p.operator));
  return { id: p.id, condition: p.condition, plannedOperator: p.operator };
});
const executions = [...browser.map(e => ({ ...e, labelSource: 'agent-controller' })), ...curl.map(e => ({ ...e, labelSource: 'curl-receipt' }))].map(e => {
  assert.ok(uuid.test(e.id));
  assert.equal(e.actualOperator, e.labelSource === 'agent-controller' ? 'agent-browser' : 'controlled-curl');
  if (e.labelSource === 'curl-receipt') assert.equal(e.httpStatus, 200);
  return { id: e.id, condition: e.condition, actualOperator: e.actualOperator, labelSource: e.labelSource };
});
const budget = parse('trial-ledger-plan.json'), queries = parse('trial-ledger-query.json');
const capture = parse('trial-ledger-query-metadata.json');
assert.equal(queries.length, 1); const query = queries[0]; assert.equal(query.success, true);
assert.equal(budget.readCeiling, 500); assert.equal(budget.selectedExecutedTrials, executions.length);
assert.equal(createHash('sha256').update(readFileSync('packages/blog/drafts/research/edge-vs-rum/production-trial-ledger.sql')).digest('hex'), budget.templateSha256);
assert.ok(query.meta.rows_read <= budget.readCeiling); assert.equal(query.meta.rows_written, 0);
assert.equal(capture.rowsRead, query.meta.rows_read); assert.equal(capture.rowsWritten, 0); assert.ok(Number.isFinite(Date.parse(capture.capturedAt)));
assert.equal(capture.rowsReturned, query.results.length);
assert.equal(hash('trial-ledger-production.sql'), budget.sqlSha256);
assert.equal(query.results.length, executions.length);
assert.deepEqual(new Set(query.results.map(r => r.id)), new Set(executions.map(e => e.id)));
const number = (value, max = 32) => { assert.ok(Number.isSafeInteger(value) && value >= 0 && value <= max); return value; };
const rows = query.results;
const measurements = rows.map(row => {
  assert.ok(uuid.test(row.id)); assert.ok([0, 1].includes(row.trialRecorded));
  assert.ok(row.condition === null || conditions.includes(row.condition));
  assert.ok(row.plannedOperator === null || operators.includes(row.plannedOperator));
  const observations = JSON.parse(row.observations); assert.ok(Array.isArray(observations));
  assert.equal(observations.filter(o => o.ownerExcluded === 1).length, row.ownerExcludedObservations);
  if (row.storedObservations > 0) { assert.equal(row.minCollectionVersion, '2026-10-27.6'); assert.equal(row.maxCollectionVersion, '2026-10-27.6'); }
  return { id: row.id, trialRecorded: row.trialRecorded === 1, condition: row.condition, plannedOperator: row.plannedOperator,
    responsesPrepared: row.responsesPrepared === null ? null : number(row.responsesPrepared, 4),
    storedObservations: number(row.storedObservations), ownerExcludedObservations: number(row.ownerExcludedObservations),
    kinds: observations.map(o => { assert.ok([0, 1].includes(o.ownerExcluded)); return typeof o.kind === 'string' && isReaderKind(o.kind) ? o.kind : null; }),
  };
});
const evaluation = evaluateCalibration(plans, executions, measurements);
assert.equal(evaluation.accounting.executedCohortComplete, true, 'Incomplete trials cannot become an accepted accuracy cohort');
assert.equal(evaluation.accounting.completeUnlabeled, 0); assert.equal(evaluation.accounting.humanLabels, 0);
const counterfactual = evaluateCalibration(plans, executions, measurements, { profile: 'counterfactual-browser-as-human-v1', predict: kind => kind === 'browser' ? 'human' : DEFAULT_OPERATOR_POLICY.predict(kind) });
const byCondition = [];
for (const condition of conditions) {
  const selected = rows.filter(r => r.condition === condition); if (!selected.length) continue;
  const total = name => selected.reduce((n, row) => n + number(row[name], name === 'responsesPrepared' ? 4 : ['storedObservations', 'ownerExcludedObservations'].includes(name) ? 32 : 8), 0);
  byCondition.push({ condition, executedTrials: selected.length, responsesPrepared: total('responsesPrepared'), storedObservations: total('storedObservations'), ownerExcludedObservations: total('ownerExcludedObservations'),
    scriptReports: total('scriptReports'), beaconAttemptReports: total('beaconAttemptReports'), queuedReports: total('queuedReports'), notQueuedReports: total('notQueuedReports'), thrownReports: total('thrownReports'), beaconReceipts: total('beaconReceipts') });
}
const receipt = { checkedAt: new Date().toISOString(), method: 'Per-trial reinspection of the original twelve production controls, joined to saved independently operated controller/curl manifests. No new page visits or human labels. The adapter accepts only the original nine agent-controller and three curl-receipt executions.',
  observationWindow: budget.observationWindow, counterCaptureCompletedAt: capture.capturedAt, evaluation, counterfactualBrowserAsHuman: counterfactual, byCondition,
  directSelect: { rowsRead: query.meta.rows_read, rowsWritten: query.meta.rows_written, ceiling: budget.readCeiling },
  privateEvidenceSha256: Object.fromEntries(['trial-plan.json', 'browser-executed.json', 'curl-executed.json', 'trial-ledger-plan.json', 'trial-ledger-production.sql', 'trial-ledger-query.json', 'trial-ledger-query-metadata.json'].map(name => [name, hash(name)])),
  limits: ['Repeated selected positive controls from two profiles are not a population accuracy estimate or independent sample of readers', 'No accepted human labels: human false-positive rates remain null; six planned human trials have no accepted execution in these inputs, not proven absence of requests', 'The operator mapping is evaluation-only; Browser/legacy/Unresolved abstain, other kinds are automation candidates', 'The counterfactual Browser-as-human policy is not deployed; its wrong decisions diagnose an unsafe interpretation', 'Missing/duplicate observations and counter failures are integrity failures, not classifier abstentions or proven database write failures', 'Observation timestamps use the original fixed window; counters are reinspected later before expiry cleanup, not reconstructed at the original cutoff', 'Native Cloudflare beacon receipt, real devices and actual JavaScript-off remain unaccepted; no temporary activation or new diagnostic mode is used'] };
writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ evaluation, counterfactualWrongDecisions: counterfactual.decisions.wrong, rowsRead: query.meta.rows_read }));
