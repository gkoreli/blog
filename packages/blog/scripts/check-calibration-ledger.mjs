import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { evaluateCalibration } from '../../analytics/.test-dist/calibration-evaluation.js';

const [output, privateDirectory] = process.argv.slice(2); assert.ok(output && privateDirectory, 'Provide a new aggregate receipt and private synthetic-fixture directory');
assert.equal(existsSync(output), false, 'Do not replace an existing receipt');
assert.equal(existsSync(privateDirectory), false, 'Use a new private synthetic-fixture directory');
mkdirSync(privateDirectory, { recursive: true, mode: 0o700 });
const req = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(req.resolve('miniflare', { paths: [dirname(req.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("ledger fixture")}}', compatibilityDate: '2026-03-06', d1Databases: { DB: 'trial-ledger' } });
const baselineCommit = '4222587';
const oldSource = execFileSync('git', ['show', baselineCommit + ':packages/blog/scripts/summarize-production-calibration.mjs'], { encoding: 'utf8' });
const contractUrl = pathToFileURL(resolve('packages/analytics/.test-dist/contracts.js')).href;
const legacyPath = resolve(privateDirectory, 'legacy-summary.mjs');
writeFileSync(legacyPath, oldSource.replace("'../../analytics/.test-dist/contracts.js'", JSON.stringify(contractUrl)), { mode: 0o600 });
const conditions = ['normal', 'block-script', 'block-beacon', 'http-client'];
const plans = conditions.flatMap((condition, c) => Array.from({ length: 3 }, (_, i) => ({ id: `00000000-0000-4000-8000-${String(c * 3 + i + 1).padStart(12, '0')}`, condition, plannedOperator: condition === 'http-client' ? 'controlled-curl' : 'agent-browser' })));
const executions = plans.map(p => ({ id: p.id, condition: p.condition, actualOperator: p.plannedOperator, labelSource: p.plannedOperator === 'controlled-curl' ? 'curl-receipt' : 'agent-controller' }));
const read = file => readFileSync('packages/blog/drafts/research/edge-vs-rum/' + file, 'utf8');
const oldSql = read('production-stage-acceptance.sql'), ledgerSql = read('production-trial-ledger.sql');
const bounds = [JSON.stringify(plans.map(p => p.id)), '2026-10-27 00:00:00', '2026-10-28 00:00:00'];
function measurement(row) {
  return { id: row.id, trialRecorded: row.trialRecorded === 1, condition: row.condition, plannedOperator: row.plannedOperator, responsesPrepared: row.responsesPrepared, storedObservations: row.storedObservations, ownerExcludedObservations: row.ownerExcludedObservations, kinds: JSON.parse(row.observations).map(o => o.kind) };
}
try {
  const db = await mf.getD1Database('DB');
  const schema = readFileSync('packages/analytics/schema.sql', 'utf8').replace(/^\s*--.*$/gm, '');
  await db.batch(schema.split(';').map(s => s.trim()).filter(Boolean).map(s => db.prepare(s)));
  for (const p of plans) {
    const runs = ['normal', 'block-beacon'].includes(p.condition) ? 1 : 0;
    await db.prepare("INSERT INTO analytics_calibration_trials(id,condition,operator,expires_at,page_responses,script,attempt,queued,beacon) VALUES(?,?,?,'2026-10-29 00:00:00',1,?,?,?,?)").bind(p.id, p.condition, p.plannedOperator, runs, runs, runs, p.condition === 'normal' ? 1 : 0).run();
    await db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,collection_version,classification_evidence) VALUES(?,'00000000000000000000000000000000','bot','desktop',1,?,?,'2026-10-27 18:20:00','2026-10-27.6',?)").bind('/analytics-check/' + p.id, p.condition === 'http-client' ? 'other-bot' : 'browser', p.condition === 'http-client' ? 'generic-bot' : 'navigation-shaped-network-unlisted', JSON.stringify({ network: 'not-listed', navigationShaped: p.condition !== 'http-client' })).run();
  }
  const cleanRows = (await db.prepare(ledgerSql).bind(...bounds).all()).results;
  const clean = evaluateCalibration(plans, executions, cleanRows.map(measurement));
  assert.equal(clean.accounting.labeledEvaluable, 12); assert.equal(clean.decisions.committed, 3); assert.equal(clean.decisions.abstained, 9);
  const queryPlan = (await db.prepare('EXPLAIN QUERY PLAN ' + ledgerSql).bind(...bounds).all()).results;
  assert.ok(queryPlan.some(row => row.detail.includes('idx_page_observations_public_path_time')));
  // Duplicate one actual observation and remove another: totals stay twelve.
  await db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,collection_version,classification_evidence) SELECT path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,collection_version,classification_evidence FROM page_observations WHERE path=?").bind('/analytics-check/' + plans[0].id).run();
  await db.prepare('DELETE FROM page_observations WHERE path=?').bind('/analytics-check/' + plans[2].id).run();
  const aggregate = await db.prepare(oldSql).bind(...bounds).all();
  assert.equal(aggregate.results.reduce((n, r) => n + r.storedObservations, 0), 12);
  const fixtureWrite = (name, value) => writeFileSync(resolve(privateDirectory, name), JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
  fixtureWrite('trial-plan.json', { trials: plans.map(p => ({ id: p.id, condition: p.condition, operator: p.plannedOperator })) });
  fixtureWrite('browser-executed.json', executions.filter(e => e.actualOperator === 'agent-browser'));
  fixtureWrite('curl-executed.json', executions.filter(e => e.actualOperator === 'controlled-curl').map(e => ({ ...e, httpStatus: 200 })));
  fixtureWrite('browser-ui.json', { syntheticFixtureOnly: true }); fixtureWrite('query-plan.json', { readCeiling: 500, cutoff: 'synthetic-fixture' });
  fixtureWrite('automated-query.json', [{ success: true, meta: aggregate.meta, results: aggregate.results }]);
  writeFileSync(resolve(privateDirectory, 'automated-production.sql'), '-- synthetic fixture, not production\n');
  execFileSync(process.execPath, [legacyPath, privateDirectory, resolve(privateDirectory, 'legacy-accepted.json')], { stdio: 'pipe' });
  let repairedAggregateRejected = false;
  try { execFileSync(process.execPath, ['packages/blog/scripts/summarize-production-calibration.mjs', privateDirectory, resolve(privateDirectory, 'repaired-should-not-exist.json')], { stdio: 'pipe' }); }
  catch (error) { assert.match(String(error.stderr), /Aggregate totals cannot replace one observation per selected trial/); repairedAggregateRejected = true; }
  assert.equal(repairedAggregateRejected, true);
  const balanced = evaluateCalibration(plans, executions, (await db.prepare(ledgerSql).bind(...bounds).all()).results.map(measurement));
  assert.equal(balanced.accounting.incompleteExecuted, 2); assert.equal(balanced.issueCounts['observation-missing'], 1); assert.equal(balanced.issueCounts['observation-duplicate'], 1);
  // Even if observations balance correctly, response totals can hide a retry.
  await db.prepare('DELETE FROM page_observations WHERE path=? AND id=(SELECT MAX(id) FROM page_observations WHERE path=?)').bind('/analytics-check/' + plans[0].id, '/analytics-check/' + plans[0].id).run();
  await db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,collection_version,classification_evidence) SELECT ? ,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,collection_version,classification_evidence FROM page_observations LIMIT 1").bind('/analytics-check/' + plans[2].id).run();
  await db.prepare('UPDATE analytics_calibration_trials SET page_responses=2 WHERE id=?').bind(plans[0].id).run();
  await db.prepare('UPDATE analytics_calibration_trials SET page_responses=0 WHERE id=?').bind(plans[2].id).run();
  const responseAggregate = (await db.prepare(oldSql).bind(...bounds).all()).results; assert.equal(responseAggregate.find(r => r.condition === 'normal').responsesPrepared, 3);
  const responseBalance = evaluateCalibration(plans, executions, (await db.prepare(ledgerSql).bind(...bounds).all()).results.map(measurement));
  assert.equal(responseBalance.issueCounts['response-count'], 2); assert.equal(responseBalance.accounting.incompleteExecuted, 2);
  await db.prepare('DELETE FROM analytics_calibration_trials WHERE id=?').bind(plans[0].id).run();
  const missing = (await db.prepare(ledgerSql).bind(...bounds).all()).results; assert.equal(missing.length, 12); assert.equal(missing.filter(r => r.trialRecorded === 0).length, 1);
  writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), runtime: process.version,
    method: 'Native local D1 and synthetic stored trial/observation/controller fixtures. No real browser/curl/human operation or production calls. The legacy helper is compiled from pinned repository source with only its import path relocated.',
    baselineCommit, baselineHelperSha256: createHash('sha256').update(oldSource).digest('hex'), clean,
    balancedObservations: { aggregateTotal: 12, legacyHelperAccepted: true, repairedAggregateHelperRejected: true, ledger: balanced },
    balancedResponses: responseBalance, missingCounterRecordRemainsInRequestedLedger: true, queryPlan,
    querySha256: createHash('sha256').update(ledgerSql).digest('hex'), productionCalls: 0, networkCalls: 0,
    limits: ['This demonstrates an acceptance-harness gap, not corruption of the original production cohort.', 'Source labels here are intentionally supplied fixtures, not independently accepted human labels or a population accuracy estimate.'],
  }, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ legacyHelperAcceptedBalancedFault: true, newLedgerRejectsFault: true, cleanEvaluable: 12, cleanAbstentions: 9, productionCalls: 0 }));
} finally { await mf.dispose(); }
