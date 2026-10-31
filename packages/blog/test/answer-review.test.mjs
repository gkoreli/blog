import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { summarizeAnswerReview, verifyAnswerCaptures } from '../scripts/verify-answer-review.mjs';

const saved = () => JSON.parse(readFileSync(new URL('../drafts/research/discovery-experiment-02/public-answer-review.json', import.meta.url), 'utf8'));
test('actual review separates a completed task failure from blocked and unsubmitted conditions', () => {
  const r = summarizeAnswerReview(saved());
  assert.deepEqual(r.cohorts, [{ id: 'perplexity-search', planned: 3, submitted: 2, completed: 1,
    blocked: 1, notSubmitted: 1, primaryPassed: 0, primaryNotPassed: 1, primaryOutcomeDenominator: 1 }]);
  assert.deepEqual(r.conditions.map(c => c.primaryPassed), [false, null, null]);
  assert.deepEqual([r.conditions[0].supported, r.conditions[0].notAddressed, r.conditions[0].contradicted], [3, 3, 0]);
  assert.equal(r.reviewIsSuppliedAssessment, true);
});
test('contradictions defeat primary success while omissions stay distinct from contradictions', () => {
  const f = saved(); f.conditions[0].grades.forEach(g => { g.status = 'supported'; });
  assert.equal(summarizeAnswerReview(f).conditions[0].primaryPassed, true);
  f.conditions[0].grades.find(g => g.criterion === 'reuse').status = 'contradicted';
  assert.equal(summarizeAnswerReview(f).conditions[0].primaryPassed, false);
  f.conditions[0].grades.find(g => g.criterion === 'reuse').status = 'not-addressed';
  const r = summarizeAnswerReview(f); assert.equal(r.conditions[0].primaryPassed, true); assert.equal(r.conditions[0].notAddressed, 1);
});
test('partial or unavailable evidence cannot acquire complete-answer grades', () => {
  const mutations = [
    f => { f.conditions[0].grades.pop(); }, f => { f.conditions[0].grades[1] = f.conditions[0].grades[0]; },
    f => { f.conditions[0].grades[0].paragraphs = [3]; }, f => { f.conditions[0].grades[0].criterion = 'unknown'; },
    f => { f.conditions[1].grades = f.conditions[0].grades; }, f => { f.conditions[2].submittedAt = '2026-10-31T16:00:00.000Z'; },
    f => { f.conditions[0].observedAt = '2026-10-31T14:00:00.000Z'; },
    f => { f.conditions[0].grades[0].status = 'pass'; }, f => { f.criteria.forEach(c => { c.primary = false; }); },
  ];
  for (const mutate of mutations) { const f = saved(); mutate(f); assert.throws(() => summarizeAnswerReview(f), /Answer review rejected:/); }
});
test('methods retain separate cohorts rather than a pooled cross-service success rate', () => {
  const f = saved(); f.cohorts.push({ id: 'other-service', service: 'Different service', mode: 'Saved input', model: null });
  f.conditions[1].cohort = 'other-service'; const r = summarizeAnswerReview(f);
  assert.deepEqual(r.cohorts.map(c => [c.id, c.completed, c.blocked, c.primaryOutcomeDenominator]), [['perplexity-search', 1, 0, 1], ['other-service', 0, 1, 0]]);
  assert.equal(Object.hasOwn(r, 'accuracy'), false);
});
test('private capture hashes, prompt, method, clock and paragraph bindings are actually checked', () => {
  const f = saved(), dir = mkdtempSync(join(tmpdir(), 'answer-review-control-'));
  f.conditions = [f.conditions[0]];
  const hash = bytes => createHash('sha256').update(bytes).digest('hex');
  const capture = { condition: 'neutral', service: f.cohorts[0].service, mode: f.cohorts[0].mode, model: null,
    submitClickedAt: f.conditions[0].submittedAt, completionObservedAt: f.conditions[0].observedAt,
    answerParagraphs: ['Synthetic first paragraph.', 'Synthetic second paragraph.'],
    inlineCitations: f.conditions[0].citationGroups.map(g => ({ paragraph: g.answerParagraph, urls: [...g.citedUrls] })) };
  f.conditions[0].answerWords = 6;
  const files = { 'protocol.md': 'Synthetic protocol', 'neutral-prompt.txt': 'Synthetic prompt', 'neutral-answer.json': JSON.stringify(capture) };
  function bind() {
    f.captures = Object.entries(files).map(([file, bytes]) => { writeFileSync(join(dir, file), bytes, { mode: 0o600 }); return { file, sha256: hash(bytes) }; });
    f.protocolSha256 = hash(files['protocol.md']); f.conditions[0].promptSha256 = hash(files['neutral-prompt.txt']);
  }
  bind(); assert.equal(verifyAnswerCaptures(f, dir).captureHashesVerified, 3);
  f.conditions[0].citationGroups[0].citedUrls.push('https://wrong.example/source');
  assert.throws(() => verifyAnswerCaptures(f, dir), /citation-binding/); f.conditions[0].citationGroups[0].citedUrls.pop();
  writeFileSync(join(dir, 'neutral-answer.json'), '{}'); assert.throws(() => verifyAnswerCaptures(f, dir), /capture-hash/);
  capture.mode = 'Different mode'; files['neutral-answer.json'] = JSON.stringify(capture); bind();
  assert.throws(() => verifyAnswerCaptures(f, dir), /answer-method/);
  capture.mode = f.cohorts[0].mode; capture.answerParagraphs.pop(); files['neutral-answer.json'] = JSON.stringify(capture); bind();
  assert.throws(() => verifyAnswerCaptures(f, dir), /answer-binding/);
});
