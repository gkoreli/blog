import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyzeAgentDiscovery, renderAgentDiscovery } from '../.test-dist/agent-discovery-evidence.js';

const saved = () => JSON.parse(readFileSync(new URL('../../blog/drafts/research/discovery-experiment-02/agent-discovery-evidence.json', import.meta.url), 'utf8'));
const fixture = () => {
  const f = saved(); f.provenance = 'synthetic'; f.references = [];
  f.runs = f.runs.slice(0, 1);
  f.runs[0].observations.forEach(o => { o.returnedSources = []; });
  return f;
};
const canonical = 'https://gkoreli.com/which-ai-fetchers-send-which-headers';

test('actual two-run audit preserves per-question discovery and one external evidence reuse', () => {
  const r = analyzeAgentDiscovery(saved());
  assert.equal(r.provenance, 'saved-observations');
  assert.deepEqual(r.runs.map(run => [run.completed, run.failed, run.missing]), [[4, 0, 0], [4, 0, 0]]);
  assert.deepEqual(r.runs.map(run => run.matches.map(m => m.found)), [[3, 1, 1], [3, 1, 1]]);
  const comparison = r.comparisons[0]; assert.equal(comparison.sameDeclaredMethod, false);
  assert.equal(comparison.status, 'new-baseline-required'); assert.deepEqual(comparison.sources, []);
  assert.deepEqual(r.referenceTotals, { distinctSourceUrls: 1, distinctSourceTargetPairs: 1, evidenceReusePairs: 1, reviewedObservations: 1 });
  assert.equal(Object.hasOwn(r, 'people'), false); assert.equal(Object.hasOwn(r, 'answerCitations'), false);
  assert.ok(r.limits.some(l => l.includes('Human') || l.includes('human')));
});

test('failed and missing questions stay unavailable while a completed empty result is a non-return', () => {
  const f = fixture(), o = f.runs[0].observations[1];
  delete o.returnedSources; o.status = 'failed'; o.reason = 'tool-error'; f.runs[0].observations.pop();
  f.runs.push(structuredClone(f.runs[0])); f.runs[1].id = 'partial-repeat';
  const r = analyzeAgentDiscovery(f), run = r.runs[0];
  assert.deepEqual([run.completed, run.failed, run.missing], [2, 1, 1]);
  assert.deepEqual(run.matches[0].byQuestion.map(q => q.presence), ['not-returned', 'failed', 'not-returned', 'missing']);
  assert.equal(run.matches[0].completed, 2);
  assert.deepEqual(r.comparisons[0].sources[0].unavailable, ['coverage', 'grok']);
  assert.equal(r.comparisons[0].sources[0].pairedCompleted, 2);
  f.runs[0].observations = []; const empty = analyzeAgentDiscovery(f).runs[0];
  assert.deepEqual([empty.completed, empty.failed, empty.missing, empty.matches[0].found], [0, 0, 4, 0]);
});

test('one source counts once per question and URL variants require explicit registration', () => {
  const f = fixture(), o = f.runs[0].observations[0];
  o.returnedSources = [{ title: 'One', url: canonical }, { title: 'Duplicate', url: canonical }];
  assert.equal(analyzeAgentDiscovery(f).runs[0].matches[0].found, 1);
  o.returnedSources = [{ title: 'Variant', url: canonical + '#grok' }];
  assert.equal(analyzeAgentDiscovery(f).runs[0].matches[0].found, 0);
  f.sources[0].urls.push(canonical + '#grok');
  assert.equal(analyzeAgentDiscovery(f).runs[0].matches[0].found, 1);
});

test('repeat reference captures retain observations without multiplying external source pages', () => {
  const f = saved(); f.references.push({ ...f.references[0], relation: 'link', capturedAt: '2026-10-31T07:00:00Z' });
  f.references[1].sourceUrl += '#signature-agent';
  const r = analyzeAgentDiscovery(f);
  assert.deepEqual(r.referenceTotals, { distinctSourceUrls: 1, distinctSourceTargetPairs: 1, evidenceReusePairs: 1, reviewedObservations: 2 });
  assert.equal(r.references[0].relation, 'evidence-reuse');
  assert.ok(r.references[0].observations[1].sourceUrl.endsWith('#signature-agent'));
  f.references.push({ ...f.references[0], sourceUrl: f.references[0].sourceUrl + '?edition=other' });
  assert.equal(analyzeAgentDiscovery(f).referenceTotals.distinctSourceUrls, 2, 'Query equivalence is not guessed');
});

test('incompatible methods withhold transitions even when both have complete results', () => {
  const f = saved(); f.runs[1].method.service = 'different-service';
  const r = analyzeAgentDiscovery(f);
  assert.equal(r.comparisons[0].status, 'new-baseline-required');
  assert.deepEqual(r.comparisons[0].sources, []);
  assert.ok(renderAgentDiscovery(r).includes('transitions withheld'));
});

test('compatible methods preserve appearances and losses by question', () => {
  const f = saved(); f.runs[0].method = structuredClone(f.runs[1].method);
  f.runs[1].observations[0].returnedSources = [];
  f.runs[1].observations[3].returnedSources = [{ title: 'New appearance', url: canonical }];
  const r = analyzeAgentDiscovery(f), c = r.comparisons[0];
  assert.equal(c.sameDeclaredMethod, true); assert.equal(c.status, 'paired');
  assert.deepEqual(c.sources[0].disappeared, ['headers']); assert.deepEqual(c.sources[0].appeared, ['grok']);
  assert.ok(renderAgentDiscovery(r).includes('Same declared method: true'));
});

test('ambiguous or malformed evidence cannot become plausible visibility totals', () => {
  const cases = [
    f => { f.questions.push(f.questions[0]); },
    f => { f.questions[1].query = f.questions[0].query; },
    f => { f.sources[1].urls.push(canonical); },
    f => { f.runs.push(f.runs[0]); },
    f => { f.runs[0].observations[1] = f.runs[0].observations[0]; },
    f => { f.runs[0].observations[0].questionId = 'unknown'; },
    f => { f.runs[0].observations[0].capturedAt = '2026-02-30T00:00:00Z'; },
    f => { f.runs[0].observations[0].rawSha256 = 'not-a-hash'; },
    f => { f.runs[0].observations[0].returnedSources[0].url = 'https://user:secret@example.test/'; },
    f => { f.runs[0].method.apiKey = 'private-canary'; },
    f => { f.references[0].targetId = 'unknown'; },
    f => { f.references[0].sourceUrl = canonical; },
    f => { f.references[0].relation = 'analytics-installed'; },
    f => { f.provenance = 'authenticated'; },
    f => { f.questions = []; },
    f => { f.sources = []; },
    f => { f.runs = []; },
  ];
  for (const mutate of cases) { const f = saved(); mutate(f); assert.throws(() => analyzeAgentDiscovery(f), /^Error: Agent discovery evidence rejected:/); }
});

test('human and machine reports retain evidence boundaries and escape untrusted prose', () => {
  const f = saved(); f.questions[0].query = 'x | <script>\n[click](https://evil.test)';
  f.references[0].review = '<img src=x onerror=x>\n# Injected';
  const brief = renderAgentDiscovery(analyzeAgentDiscovery(f));
  assert.ok(brief.includes('3/4')); assert.ok(brief.includes('evidence-reuse'));
  assert.ok(brief.includes('Human identification is not a condition'));
  assert.ok(brief.includes('not an AI answer citation rate'));
  assert.ok(!brief.includes('<script>')); assert.ok(!brief.includes('<img')); assert.ok(!brief.includes('\n# Injected'));
  assert.ok(!brief.includes('[click]'));
});
