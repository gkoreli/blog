import { TECHNICAL_ASSESSMENT_PROFILE, type TechnicalAssessment, type TechnicalCheck, type TechnicalComponent, type OptionalCapability } from './product-contracts.js';

const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length <= 32_768;
const count = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100;
const closed = (value: Record<string, unknown>, keys: readonly string[]): boolean => Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.length <= 30 && value.every(text);
const state = (value: unknown): value is TechnicalCheck['state'] => value === 'pass' || value === 'fail' || value === 'unknown';
const checkWeights: Readonly<Record<string, number>> = { 'page-status': 30, 'page-html': 10, 'source-text': 20, 'page-title': 10, 'page-heading': 10, 'general-indexing': 20 };
const componentChecks: Readonly<Record<string, readonly string[]>> = { delivery: ['page-status', 'page-html'], content: ['source-text', 'page-title', 'page-heading'], indexing: ['general-indexing'] };
function check(value: unknown): value is TechnicalCheck {
  return record(value) && closed(value, ['id', 'title', 'state', 'weight', 'evidence', 'nextStep'])
    && text(value.id) && Object.hasOwn(checkWeights, value.id) && text(value.title) && state(value.state)
    && count(value.weight) && value.weight === checkWeights[value.id] && text(value.evidence) && text(value.nextStep);
}
function component(value: unknown): value is TechnicalComponent {
  if (!record(value) || !closed(value, ['id', 'title', 'earned', 'unknown', 'max', 'checks'])
    || typeof value.id !== 'string' || !['delivery', 'content', 'indexing'].includes(value.id) || !text(value.title)
    || !count(value.earned) || !count(value.unknown) || !count(value.max) || !Array.isArray(value.checks) || !value.checks.every(check)) return false;
  const expected = componentChecks[value.id];
  const checks = value.checks;
  if (!expected || checks.length !== expected.length || !expected.every(id => checks.filter(item => item.id === id).length === 1)) return false;
  return value.max === value.checks.reduce((sum, item) => sum + item.weight, 0)
    && value.earned === value.checks.filter(item => item.state === 'pass').reduce((sum, item) => sum + item.weight, 0)
    && value.unknown === value.checks.filter(item => item.state === 'unknown').reduce((sum, item) => sum + item.weight, 0);
}
function optional(value: unknown): value is OptionalCapability {
  return record(value) && closed(value, ['id', 'title', 'state', 'evidence', 'nextStep']) && typeof value.id === 'string'
    && ['llms', 'sitemap', 'markdown', 'structured-data'].includes(value.id) && text(value.title) && text(value.evidence) && text(value.nextStep)
    && typeof value.state === 'string' && ['available', 'not-provided', 'not-negotiated', 'http-error', 'unavailable', 'unexpected-content'].includes(value.state);
}

/** Validate the published profile and its complete point ledger. This proves
 * shape/coherence only, not the authenticity of supplied observations. Clients
 * should derive their displayed assessment from the imported base evidence. */
export function isTechnicalAssessment(value: unknown): value is TechnicalAssessment {
  if (!record(value) || !closed(value, ['profile', 'label', 'score', 'counts', 'components', 'optional', 'limits'])
    || value.profile !== TECHNICAL_ASSESSMENT_PROFILE || value.label !== 'Technical access score' || !strings(value.limits)
    || !Array.isArray(value.components) || value.components.length !== 3 || !value.components.every(component)
    || !Array.isArray(value.optional) || value.optional.length !== 4 || !value.optional.every(optional)
    ) return false;
  const components = value.components;
  const capabilities = value.optional;
  if (!['delivery', 'content', 'indexing'].every(id => components.filter(item => item.id === id).length === 1)
    || !['llms', 'sitemap', 'markdown', 'structured-data'].every(id => capabilities.filter(item => item.id === id).length === 1)) return false;
  const score = value.score;
  const counts = value.counts;
  if (!record(score) || !closed(score, ['lower', 'upper', 'max', 'coveragePercent']) || !count(score.lower) || !count(score.upper)
    || score.max !== 100 || !count(score.coveragePercent) || score.upper < score.lower
    || !record(counts) || !closed(counts, ['passed', 'failed', 'unknown']) || !count(counts.passed) || !count(counts.failed) || !count(counts.unknown)) return false;
  const checks = value.components.flatMap(item => item.checks);
  const earned = value.components.reduce((sum, item) => sum + item.earned, 0);
  const unknown = value.components.reduce((sum, item) => sum + item.unknown, 0);
  return value.components.reduce((sum, item) => sum + item.max, 0) === 100
    && score.lower === earned && score.upper === earned + unknown && score.coveragePercent === 100 - unknown
    && counts.passed === checks.filter(item => item.state === 'pass').length
    && counts.failed === checks.filter(item => item.state === 'fail').length
    && counts.unknown === checks.filter(item => item.state === 'unknown').length;
}
