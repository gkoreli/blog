import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import * as api from '../../analytics/.test-dist/resource-reach.js';

const [output, inputPath, historicalPath, ...extra] = process.argv.slice(2);
assert.ok(output && inputPath && extra.length === 0, 'Usage: check-resource-reach.mjs PRIVATE_RECEIPT PRIVATE_CASES [PRIVATE_HISTORICAL_INPUT]');
assert.notEqual(resolve(output), resolve(inputPath));
if (historicalPath) for (const path of [output, inputPath]) assert.notEqual(resolve(path), resolve(historicalPath));
const demoPath = new URL('./examples/resource-reach.demo.json', import.meta.url);
const base = JSON.parse(readFileSync(demoPath, 'utf8'));
assert.equal(base.provenance, 'synthetic');
assert.ok(base.registry.articles[0]?.evidence[0] && base.registry.siteResources[0] && base.events[0], 'Demo needs article, evidence, site and event');
const article = base.registry.articles[0], evidence = article.evidence[0], site = base.registry.siteResources[0];
const event = path => ({ ...structuredClone(base.events[0]), reference: 'private-event-reference-canary', path, observedAt: base.scope.startInclusive, assessment: 'included' });
const cases = [], expectations = new Map();
function add(name, mutate, valid = true, check = () => {}) {
  const input = structuredClone(base); mutate(input); cases.push({ name, input, valid }); expectations.set(name, check);
}
const one = (name, path, mutate = () => {}, check = () => {}) => add(name, input => { input.events = [event(path)]; mutate(input); }, true, check);
const role = (report, name) => report.roles.find(row => row.role === name);
const basis = (report, name) => report.matching.find(row => row.basis === name);
add('demo', () => {});
add('empty-events', f => { f.events = []; }, true, r => assert.equal(r.accounting.selectedEvents, 0));
one('article', article.path, () => {}, r => { assert.equal(role(r, 'article').included.events, 1); assert.equal(r.articles[0].relatedResourceEvents, 1); });
one('evidence', evidence.path, () => {}, r => { assert.equal(role(r, 'evidence').included.events, 1); assert.equal(r.articles[0].article.events, 0); assert.equal(r.articles[0].evidenceTotals.events, 1); });
one('site', site.path, () => {}, r => assert.equal(role(r, 'site').included.events, 1));
one('declared-alias', '/declared-resource-alias', f => { f.registry.articles[0].aliases = ['/declared-resource-alias']; }, r => { assert.equal(r.included.aliasEvents, 1); assert.equal(basis(r, 'declared-alias').includedEvents, 1); });
one('undeclared-variant', article.path + '/extra-variant', () => {}, r => assert.equal(basis(r, 'unregistered-path').includedEvents, 1));
one('query-not-stripped', article.path + '?from=fixture', () => {}, r => assert.equal(basis(r, 'noncanonical-path').includedEvents, 1));
one('fragment-not-stripped', article.path + '#fixture', () => {}, r => assert.equal(role(r, 'unmapped').included.events, 1));
one('dot-path-not-normalized', '/fixture/../resource', () => {}, r => assert.equal(basis(r, 'noncanonical-path').includedEvents, 1));
one('encoded-path-not-decoded', '/%66ixture-only-unregistered', () => {}, r => assert.equal(basis(r, 'unregistered-path').includedEvents, 1));
one('exclusions-and-unassessed', article.path, f => {
  f.events = ['included', 'owner-excluded', 'referral-excluded', 'unassessed'].map((assessment, i) => ({ ...event(article.path), reference: 'private-event-reference-canary-' + i, assessment }));
}, r => assert.deepEqual(r.accounting, { selectedEvents: 4, includedEvents: 1, ownerExcludedEvents: 1, referralExcludedEvents: 1, unassessedEvents: 1 }));
one('missing-time-and-method', article.path, f => { Object.assign(f.events[0], { observedAt: null, storedKind: null, collection: null, classifier: null, observationSource: null, representation: null }); }, r => {
  assert.equal(r.included.timeNotRecordedEvents, 1); assert.equal(r.included.byStoredKind[0].kind, 'not-recorded'); assert.equal(r.included.measurementHistory[0].collection, null);
});
one('malformed-time-and-method', article.path, f => { Object.assign(f.events[0], { observedAt: '2026-02-30T00:00:00Z', storedKind: 'private-kind-canary', collection: '2026-02-30.1', classifier: 'private-stamp-canary', observationSource: 'private-source-canary', representation: 'private-format-canary' }); }, r => {
  assert.equal(r.included.timeUnrecognizedEvents, 1); assert.equal(r.included.byStoredKind[0].kind, 'unrecognized'); const h = r.included.measurementHistory[0];
  for (const key of ['collection', 'classifier', 'observationSource', 'representation']) assert.equal(h[key], 'unrecognized');
});
one('future-syntactic-stamp', article.path, f => { f.events[0].collection = '2099-01-01.7'; }, r => assert.equal(r.included.measurementHistory[0].collection, '2099-01-01.7'));
one('capture-before-window-end', article.path, f => { f.scope.capturedAt = f.scope.startInclusive; }, r => assert.equal(r.scope.windowExtendsAfterCapture, true));
one('safe-rendering', article.path, f => { f.registry.articles[0].title = '<script>|*unsafe*\nfixture'; f.scope.selectionId = '<private-selection>'; }, (r, brief) => { assert.ok(!brief.includes('<script>') && !brief.includes('<private-selection>')); assert.ok(brief.includes('&#60;script&#62;')); });
one('excluded-quality-retained', article.path, f => { Object.assign(f.events[0], { assessment: 'unassessed', observedAt: null, storedKind: null, classifier: null }); }, r => { assert.equal(r.included.events, 0); assert.equal(r.selected.events, 1); assert.equal(r.selected.timeNotRecordedEvents, 1); assert.equal(r.selected.byStoredKind[0].kind, 'not-recorded'); });
add('duplicate-event', f => { f.events = [event(article.path), event(article.path)]; }, false);
add('duplicate-parent-id', f => { const copy = structuredClone(f.registry.articles[0]); copy.path = '/unique-parent-path'; copy.aliases = []; copy.evidence = []; f.registry.articles.push(copy); }, false);
add('duplicate-parent-path', f => { const copy = structuredClone(f.registry.articles[0]); copy.id = 'distinct-parent'; copy.aliases = []; copy.evidence = []; f.registry.articles.push(copy); }, false);
add('evidence-two-parents', f => { f.registry.articles.push({ id: 'second-parent', path: '/second-parent', title: 'Second', evidence: [structuredClone(f.registry.articles[0].evidence[0])] }); }, false);
add('alias-conflict', f => { f.registry.articles[0].aliases = [evidence.path]; }, false);
add('noncanonical-registry', f => { f.registry.articles[0].path = '/fixture/../resource'; }, false);
add('query-registry', f => { f.registry.articles[0].path += '?fixture'; }, false);
add('invalid-window', f => { f.scope.endExclusive = f.scope.startInclusive; }, false);
add('invalid-calendar-window', f => { f.scope.startInclusive = '2026-02-30T00:00:00Z'; }, false);
add('outside-window', f => { f.events = [{ ...event(article.path), observedAt: f.scope.endExclusive }]; }, false);
add('unknown-field', f => { f.credential = 'private-canary'; }, false);
add('unsupported-version', f => { f.version = 'resource-reach-v2'; }, false);
add('invalid-assessment', f => { f.events = [{ ...event(article.path), assessment: 'probably-included' }]; }, false);
add('event-budget', f => { f.events = Array.from({ length: 4097 }, (_, i) => ({ ...event(article.path), reference: String(i) })); }, false);
add('alias-budget', f => { f.registry.articles[0].aliases = Array.from({ length: 17 }, (_, i) => '/alias-' + i); }, false);
add('history-budget', f => { f.events = Array.from({ length: 129 }, (_, i) => ({ ...event(article.path), reference: String(i), collection: '2099-01-01.' + i })); }, false);
writeFileSync(inputPath, JSON.stringify(cases) + '\n', { flag: 'wx', mode: 0o600 });
function run(trials, api) {
  return trials.map(trial => {
    const before = JSON.stringify(trial.input);
    let row;
    try { const result = api.analyzeResourceReach(trial.input); row = { name: trial.name, accepted: true, result, brief: api.renderResourceReach(result) }; }
    catch (error) { row = { name: trial.name, accepted: false, error: error instanceof Error ? error.message : 'unexpected-error' }; }
    if (JSON.stringify(trial.input) !== before) throw Error('Input mutated: ' + trial.name);
    return row;
  });
}
function checkRows(rows, trials, synthetic) {
  rows.forEach((row, i) => {
    assert.equal(row.accepted, trials[i].valid, row.name);
    if (!row.accepted) return;
    const r = row.result, sum = (values, field) => values.reduce((n, v) => n + v[field], 0);
    assert.equal(sum(r.roles.map(v => v.accounting), 'selectedEvents'), r.accounting.selectedEvents);
    assert.equal(sum(r.roles.map(v => v.included), 'events'), r.included.events);
    assert.equal(sum(r.roles.map(v => v.selected), 'events'), r.selected.events);
    assert.equal(r.selected.events, r.accounting.selectedEvents);
    assert.equal(sum(r.selected.byStoredKind, 'events'), r.selected.events);
    assert.equal(sum(r.selected.measurementHistory, 'events'), r.selected.events);
    assert.equal(sum(r.included.byStoredKind, 'events'), r.included.events);
    assert.equal(sum(r.included.measurementHistory, 'events'), r.included.events);
    assert.equal(sum(r.matching, 'selectedEvents'), r.accounting.selectedEvents);
    assert.equal(sum(r.matching, 'includedEvents'), r.accounting.includedEvents);
    assert.equal(r.accounting.includedEvents + r.accounting.ownerExcludedEvents + r.accounting.referralExcludedEvents + r.accounting.unassessedEvents, r.accounting.selectedEvents);
    r.articles.forEach(a => assert.equal(a.relatedResourceEvents, a.article.events + a.evidenceTotals.events));
    if (synthetic) {
      expectations.get(row.name)(r, row.brief);
      const rendered = JSON.stringify(row);
      for (const canary of ['private-reference-', '/private-unmapped-canary', 'private-event-reference-canary', 'private-kind-canary', 'private-stamp-canary', 'private-source-canary', 'private-format-canary', '/%66ixture-only-unregistered']) assert.ok(!rendered.includes(canary), 'Private/unrecognized value leaked: ' + row.name);
    }
  });
}
const historical = historicalPath ? [{ name: 'historical-private-input', input: JSON.parse(readFileSync(historicalPath, 'utf8')), valid: true }] : [];
if (historical.length) assert.equal(historical[0].input.provenance, 'saved-events');
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
  import * as api from './packages/analytics/src/resource-reach.ts';
  const run=${run.toString()};
  export default {async fetch(request){return Response.json(run(await request.json(),api));}};
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {} });
try {
  const rounds = [], historicalRounds = [];
  for (let round = 0; round < 3; round++) {
    for (const [trials, target, synthetic] of [[cases, rounds, true], ...(historical.length ? [[historical, historicalRounds, false]] : [])]) {
      const node = run(trials, api), response = await mf.dispatchFetch('https://offline.invalid/resource-reach', { method: 'POST', body: JSON.stringify(trials) });
      assert.equal(response.status, 200); const native = await response.json(); assert.deepEqual(native, node); checkRows(native, trials, synthetic); target.push({ round, rows: native });
    }
  }
  const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex');
  const accepted = cases.filter(row => row.valid).length;
  writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), inputSha256: hash(inputPath), demoSha256: hash(demoPath),
    sourceSha256: hash('packages/analytics/src/resource-reach.ts'), generatedModuleSha256: hash('packages/analytics/.test-dist/resource-reach.js'), harnessSha256: hash(new URL(import.meta.url)),
    workerBundleSha256: createHash('sha256').update(bundle.outputFiles[0].contents).digest('hex'),
    method: 'Synthetic saved-event contexts with semantic expectations and input immutability; three exact Node/workerd result and brief comparisons. Optional historical input is compared separately without authenticating its source.',
    rounds, historicalInputSha256: historicalPath ? hash(historicalPath) : null, historicalRounds,
    acceptedCasesPerRound: accepted, rejectedCasesPerRound: cases.length - accepted,
    productionRequests: 0, externalRequests: 0, d1Statements: 0 }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(`${cases.length * 3} exact Node/workerd synthetic comparisons pass (${accepted * 3} accepted/${(cases.length - accepted) * 3} rejected); ${historicalRounds.length} separate historical comparisons.`);
} finally { await mf.dispose(); }
