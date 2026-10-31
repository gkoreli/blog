import { constants, openSync, fstatSync, readSync, closeSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const check = (condition, code) => { if (!condition) throw Error(`Answer review rejected: ${code}`); };
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const id = v => typeof v === 'string' && /^[a-z][a-z0-9-]{0,63}$/.test(v);
const nonempty = v => typeof v === 'string' && v.trim().length > 0 && v.length <= 8192;
const unique = values => new Set(values).size === values.length;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const digest = v => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const instant = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v)
  && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;

/** Reconciles supplied categorical reviews. It does not judge model truth. */
export function summarizeAnswerReview(input) {
  check(object(input) && input.version === 'answer-review-v1', 'version');
  check(Array.isArray(input.criteria) && input.criteria.length > 0 && input.criteria.length <= 100, 'criteria');
  check(input.criteria.every(c => object(c) && id(c.id) && typeof c.primary === 'boolean')
    && unique(input.criteria.map(c => c.id)) && input.criteria.some(c => c.primary), 'criterion-identity');
  check(Array.isArray(input.cohorts) && input.cohorts.length > 0 && input.cohorts.length <= 100
    && input.cohorts.every(c => object(c) && id(c.id) && nonempty(c.service) && nonempty(c.mode) && (c.model === null || nonempty(c.model)))
    && unique(input.cohorts.map(c => c.id)), 'cohorts');
  check(Array.isArray(input.conditions) && input.conditions.length > 0 && input.conditions.length <= 1000
    && input.conditions.every(c => object(c) && id(c.id)) && unique(input.conditions.map(c => c.id)), 'conditions');
  const criteria = new Set(input.criteria.map(c => c.id)), cohortIds = new Set(input.cohorts.map(c => c.id));
  const primary = input.criteria.filter(c => c.primary).map(c => c.id);
  const conditions = input.conditions.map(c => {
    check(cohortIds.has(c.cohort) && digest(c.promptSha256) && ['completed', 'blocked', 'not-submitted'].includes(c.status), 'condition-context');
    check(c.status === 'not-submitted' ? !Object.hasOwn(c, 'submittedAt') : instant(c.submittedAt) && instant(c.observedAt) && c.observedAt >= c.submittedAt, 'condition-clocks');
    check(Array.isArray(c.grades), 'grades');
    if (c.status !== 'completed') {
      check(c.grades.length === 0 && nonempty(c.reason) && !Object.hasOwn(c, 'answerCapture'), 'unavailable-not-graded');
      return { id: c.id, cohort: c.cohort, status: c.status, primaryPassed: null, supported: null, contradicted: null, notAddressed: null, unavailable: null };
    }
    check(nonempty(c.answerCapture) && Number.isSafeInteger(c.answerParagraphs) && c.answerParagraphs > 0, 'answer-capture');
    check(c.grades.length === criteria.size && unique(c.grades.map(g => g.criterion)), 'complete-criterion-review');
    for (const g of c.grades) {
      check(object(g) && criteria.has(g.criterion) && ['supported', 'contradicted', 'not-addressed', 'unavailable'].includes(g.status)
        && nonempty(g.reason) && Array.isArray(g.paragraphs) && unique(g.paragraphs), 'grade');
      check(g.paragraphs.every(p => Number.isSafeInteger(p) && p > 0 && p <= c.answerParagraphs)
        && (g.status === 'unavailable' || g.paragraphs.length > 0), 'grade-location');
    }
    const contradicted = c.grades.filter(g => g.status === 'contradicted').length;
    return { id: c.id, cohort: c.cohort, status: c.status,
      primaryPassed: contradicted === 0 && primary.every(id => c.grades.find(g => g.criterion === id)?.status === 'supported'),
      supported: c.grades.filter(g => g.status === 'supported').length, contradicted,
      notAddressed: c.grades.filter(g => g.status === 'not-addressed').length,
      unavailable: c.grades.filter(g => g.status === 'unavailable').length };
  });
  return { version: 'answer-review-summary-v1', reviewIsSuppliedAssessment: true, criteria: input.criteria.length, conditions,
    cohorts: input.cohorts.map(cohort => {
      const rows = conditions.filter(c => c.cohort === cohort.id), completed = rows.filter(c => c.status === 'completed');
      return { id: cohort.id, planned: rows.length, submitted: rows.filter(c => c.status !== 'not-submitted').length,
        completed: completed.length, blocked: rows.filter(c => c.status === 'blocked').length,
        notSubmitted: rows.filter(c => c.status === 'not-submitted').length,
        primaryPassed: completed.filter(c => c.primaryPassed).length, primaryNotPassed: completed.filter(c => !c.primaryPassed).length,
        primaryOutcomeDenominator: completed.length };
    }) };
}
function readBounded(path) {
  const fd = openSync(path, constants.O_RDONLY | constants.O_NONBLOCK);
  try {
    check(fstatSync(fd).isFile(), 'regular-file'); const buffer = Buffer.alloc(8 * 1024 * 1024 + 1); let n = 0;
    while (n < buffer.length) { const count = readSync(fd, buffer, n, buffer.length - n, null); if (count === 0) break; n += count; }
    check(n < buffer.length, 'input-budget'); return buffer.subarray(0, n);
  } finally { closeSync(fd); }
}
function decode(bytes) { return JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes)); }
export function verifyAnswerCaptures(input, directory) {
  const summary = summarizeAnswerReview(input);
  check(Array.isArray(input.captures) && input.captures.length > 0 && input.captures.length <= 100
    && input.captures.every(c => object(c) && typeof c.file === 'string' && c.file === basename(c.file) && /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(c.file) && digest(c.sha256))
    && unique(input.captures.map(c => c.file)), 'capture-registry');
  let totalBytes = 0;
  const bytes = new Map(input.captures.map(c => {
    const raw = readBounded(join(directory, c.file)); totalBytes += raw.length; check(totalBytes <= 32 * 1024 * 1024, 'capture-budget');
    check(hash(raw) === c.sha256, 'capture-hash'); return [c.file, raw];
  }));
  check(digest(input.protocolSha256) && hash(bytes.get('protocol.md') ?? '') === input.protocolSha256, 'protocol-binding');
  for (const c of input.conditions) {
    const prompt = bytes.get(c.id + '-prompt.txt'); check(prompt && hash(prompt) === c.promptSha256, 'prompt-binding');
    if (c.status === 'completed') {
      const capture = bytes.get(c.answerCapture); check(capture, 'missing-answer'); const answer = decode(capture);
      check(answer.condition === c.id && Array.isArray(answer.answerParagraphs) && answer.answerParagraphs.length === c.answerParagraphs
        && answer.answerParagraphs.every(nonempty), 'answer-binding');
      check(c.answerWords === answer.answerParagraphs.join(' ').split(/\s+/).filter(Boolean).length, 'answer-word-count');
      check(Array.isArray(c.citationGroups) && Array.isArray(answer.inlineCitations)
        && JSON.stringify(c.citationGroups.map(g => ({ paragraph: g.answerParagraph, urls: g.citedUrls })))
          === JSON.stringify(answer.inlineCitations.map(g => ({ paragraph: g.paragraph, urls: g.urls }))), 'citation-binding');
      const cohort = input.cohorts.find(x => x.id === c.cohort);
      check(answer.service === cohort?.service && answer.mode === cohort.mode && answer.model === cohort.model, 'answer-method');
      check(answer.submitClickedAt === c.submittedAt && answer.completionObservedAt === c.observedAt, 'answer-clocks');
    } else if (c.status === 'blocked') {
      const capture = bytes.get(c.gateCapture); check(capture, 'missing-gate'); const gate = decode(capture);
      check(gate.condition === c.id && gate.status === 'blocked' && gate.answerAvailable === false, 'gate-binding');
      check(gate.submitClickedAt === c.submittedAt && gate.gateObservedAt === c.observedAt, 'gate-clocks');
    }
  }
  return { ...summary, captureHashesVerified: input.captures.length };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [review, directory, extra] = process.argv.slice(2); check(review && directory && !extra, 'usage');
    const bytes = readBounded(resolve(review)), result = verifyAnswerCaptures(decode(bytes), resolve(directory));
    console.log(JSON.stringify({ inputSha256: hash(bytes), ...result }, null, 2));
  } catch (error) {
    console.error(error instanceof Error && error.message.startsWith('Answer review rejected:') ? error.message : 'Answer review verification failed: check UTF-8 JSON input and private captures.');
    process.exitCode = 1;
  }
}
