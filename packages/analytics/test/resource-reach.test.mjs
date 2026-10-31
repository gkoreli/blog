import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyzeResourceReach, renderResourceReach } from '../.test-dist/resource-reach.js';
const fixture = () => JSON.parse(readFileSync(new URL('../../blog/scripts/examples/resource-reach.demo.json', import.meta.url), 'utf8'));

test('one parent owns article and explicit evidence without multiplying article events', () => {
  const f = fixture(), before = structuredClone(f), r = analyzeResourceReach(f);
  assert.deepEqual(f, before);
  assert.deepEqual(r.accounting, { selectedEvents: 8, includedEvents: 5, ownerExcludedEvents: 1, referralExcludedEvents: 1, unassessedEvents: 1 });
  assert.deepEqual(r.roles.map(x => [x.role, x.included.events]), [['article',2],['evidence',1],['site',1],['unmapped',1]]);
  assert.equal(r.articles.length, 1); assert.equal(r.articles[0].article.events, 2);
  assert.equal(r.articles[0].evidenceTotals.events, 1); assert.equal(r.articles[0].relatedResourceEvents, 3);
  assert.equal(r.included.events, 5); assert.equal(r.included.aliasEvents, 1);
  assert.equal(r.sourceAuthenticity, 'not-established'); assert.equal(r.scope.populationCompleteness, 'not-established');
  assert.ok(!JSON.stringify(r).includes('private-unmapped-canary')); assert.ok(!JSON.stringify(r).includes('private-reference'));
});

test('path identity needs declared aliases; no suffix, case, decoding, query or slash inference', () => {
  const f = fixture();
  const paths = ['/article-a','/old-a','/Article-a','/article-a/','/%61rticle-a','/article-a/prompts','/article-a?x=1','/x/../article-a','//article-a','/bad%zz'];
  f.events = paths.map((path,i) => ({ ...f.events[0], path, reference: String(i) }));
  const r = analyzeResourceReach(f);
  assert.equal(r.articles[0].article.events, 2); assert.equal(r.articles[0].evidenceTotals.events, 0);
  assert.deepEqual(r.matching.map(x => x.includedEvents), [1,1,4,4]);
  assert.equal(r.roles.find(x => x.role === 'unmapped').included.events, 8);
});

test('missing or malformed time, kind and method facts stay visible rather than guessed', () => {
  const f = fixture(); f.events = f.events.slice(0,2);
  Object.assign(f.events[0], { observedAt: null, storedKind: null, collection: null, classifier: 'future-private-canary', observationSource: null, representation: 'pdf' });
  Object.assign(f.events[1], { observedAt: '2026-02-30T00:00:00Z', storedKind: 'new-private-kind', collection: '2026-02-30.1', classifier: '2026-10-29.3' });
  const r = analyzeResourceReach(f);
  assert.equal(r.included.timeNotRecordedEvents, 1); assert.equal(r.included.timeUnrecognizedEvents, 1);
  assert.deepEqual(r.included.byStoredKind, [{kind:'not-recorded',events:1},{kind:'unrecognized',events:1}]);
  assert.ok(r.included.measurementHistory.some(h => h.collection === null && h.classifier === 'unrecognized' && h.observationSource === 'not-recorded' && h.representation === 'unrecognized'));
  assert.ok(!JSON.stringify(r).includes('private-canary')); assert.ok(!JSON.stringify(r).includes('new-private-kind'));
});

test('ambiguous registry ownership and duplicate event references reject instead of double counting', () => {
  for (const mutate of [
    f => f.registry.articles.push(structuredClone(f.registry.articles[0])),
    f => f.registry.articles[0].evidence[0].aliases = ['/article-a'],
    f => f.registry.siteResources[0].id = 'article-a',
    f => f.registry.articles[0].aliases.push('/old-a'),
    f => f.events[7].reference = f.events[0].reference,
  ]) { const f = fixture(); mutate(f); assert.throws(() => analyzeResourceReach(f), /Resource reach rejected:/); }
});

test('scope is half-open UTC and validated even for excluded rows', () => {
  for (const at of ['2026-10-29T23:59:59Z','2026-10-31T00:00:00Z']) {
    const f = fixture(); f.events[7].observedAt = at; assert.throws(() => analyzeResourceReach(f), /event-outside-window/);
  }
  const f = fixture(); f.events[0].observedAt = f.scope.startInclusive;
  f.scope.capturedAt = '2026-10-30T12:00:00Z'; assert.equal(analyzeResourceReach(f).scope.windowExtendsAfterCapture, true);
  for (const at of ['2026-02-30T00:00:00Z','2026-10-31T00:00:00+00:00']) { f.scope.endExclusive = at; assert.throws(() => analyzeResourceReach(f), /window/); }
});

test('strict schema and bounded event/history work reject whole input without partial reports', () => {
  for (const mutate of [
    f => f.credential = 'private-secret',
    f => f.events[0].extra = 'private-secret',
    f => f.registry.articles[0].path = '/x/../article-a',
    f => f.events = Array.from({ length:4097 }, (_,i) => ({...f.events[0], reference:String(i)})),
    f => f.events = Array.from({ length:129 }, (_,i) => ({...f.events[0], reference:String(i), classifier:`2026-10-29.${i}`})),
    f => f.registry.articles[0].title = 'x'.repeat(513),
  ]) { const f = fixture(); mutate(f); assert.throws(() => analyzeResourceReach(f), /Resource reach rejected:/); }
});

test('renderer escapes supplied labels and states denominators and evidence limits', () => {
  const f = fixture(); f.registry.articles[0].title = '<img src=x> | **Title**\n# injection';
  const r = analyzeResourceReach(f), md = renderResourceReach(r);
  assert.ok(md.startsWith('# Synthetic')); assert.ok(!md.includes('<img')); assert.ok(!md.includes('**Title**'));
  assert.ok(md.includes('8 supplied events: 5 included')); assert.ok(md.includes('1 unassessed'));
  assert.ok(md.includes('not unique audience')); assert.ok(md.includes('demand is unknown'));
  assert.ok(!md.includes('private-reference')); assert.ok(!md.includes('private-unmapped-canary'));
  r.articles[0].aliases.push('/mutated'); assert.equal(f.registry.articles[0].aliases.includes('/mutated'), false);
});

 test('excluded and unassessed quality stays in selected-event metrics', () => {
  const f = fixture(); f.events = f.events.slice(5);
  f.events[0].observedAt = null; f.events[1].observedAt = 'bad-time';
  f.events[2].storedKind = 'future-kind'; f.events[2].classifier = null;
  const r = analyzeResourceReach(f);
  assert.equal(r.selected.events, 3); assert.equal(r.included.events, 0);
  assert.equal(r.selected.timeNotRecordedEvents, 1); assert.equal(r.selected.timeUnrecognizedEvents, 1);
  assert.ok(r.selected.byStoredKind.some(k => k.kind === 'unrecognized' && k.events === 1));
  assert.ok(r.selected.measurementHistory.some(h => h.classifier === null && h.events === 1));
  assert.equal(r.roles.reduce((n,row) => n + row.selected.events, 0), 3);
});
